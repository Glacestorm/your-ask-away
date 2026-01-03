/**
 * Hook para importación inteligente con IA para Maestros ERP
 * Soporta cualquier formato de archivo y usa IA para mapeo automático
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MaestrosEntityType = 
  | 'customers' 
  | 'suppliers' 
  | 'items' 
  | 'taxes' 
  | 'payment_terms' 
  | 'warehouses' 
  | 'bank_accounts' 
  | 'series';

export interface ImportAnalysis {
  format_detected: string;
  encoding: string;
  total_rows: number;
  header_row: number;
  data_start_row: number;
  columns_detected: string[];
  field_mapping: Record<string, string>;
  confidence: number;
}

export interface ImportRecord {
  row_number: number;
  status: 'valid' | 'warning' | 'error';
  original_data: Record<string, unknown>;
  transformed_data: Record<string, unknown>;
  validation_messages: string[];
}

export interface ImportSummary {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  by_field_issues?: Record<string, number>;
}

export interface ImportResult {
  success: boolean;
  action: string;
  targetType: MaestrosEntityType;
  fileName: string;
  analysis?: ImportAnalysis;
  records?: ImportRecord[];
  summary?: ImportSummary;
  suggestions?: string[];
  ready_to_import?: boolean;
  error?: string;
  timestamp?: string;
}

export interface ImportOptions {
  autoCreate?: boolean;
  updateExisting?: boolean;
  dryRun?: boolean;
}

const ENTITY_LABELS: Record<MaestrosEntityType, string> = {
  customers: 'Clientes',
  suppliers: 'Proveedores',
  items: 'Artículos',
  taxes: 'Impuestos',
  payment_terms: 'Condiciones de Pago',
  warehouses: 'Almacenes',
  bank_accounts: 'Cuentas Bancarias',
  series: 'Series'
};

export function useMaestrosAIImport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFile = useCallback(async (
    file: File,
    targetType: MaestrosEntityType,
    companyId?: string
  ): Promise<ImportResult | null> => {
    setIsProcessing(true);
    setProgress(10);
    setCurrentStep('Leyendo archivo...');
    setError(null);
    setResult(null);

    try {
      // Read file content
      const fileContent = await readFileContent(file);
      setProgress(30);
      setCurrentStep('Analizando con IA...');

      const { data, error: fnError } = await supabase.functions.invoke('erp-maestros-ai-import', {
        body: {
          action: 'analyze',
          targetType,
          fileContent,
          fileName: file.name,
          fileType: file.type || detectFileType(file.name),
          companyId,
          options: { dryRun: true }
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      if (data?.success) {
        setProgress(100);
        setCurrentStep('Análisis completado');
        setResult(data);
        
        const validCount = data.summary?.valid || 0;
        const totalCount = data.summary?.total || 0;
        
        if (validCount === totalCount && totalCount > 0) {
          toast.success(`${totalCount} ${ENTITY_LABELS[targetType]} listos para importar`);
        } else if (validCount > 0) {
          toast.warning(`${validCount}/${totalCount} registros válidos`);
        } else {
          toast.error('No se encontraron registros válidos');
        }
        
        return data;
      }

      throw new Error(data?.error || 'Error en análisis');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(`Error: ${message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const executeImport = useCallback(async (
    file: File,
    targetType: MaestrosEntityType,
    companyId?: string,
    options?: ImportOptions
  ): Promise<ImportResult | null> => {
    setIsProcessing(true);
    setProgress(10);
    setCurrentStep('Preparando importación...');
    setError(null);

    try {
      const fileContent = await readFileContent(file);
      setProgress(30);
      setCurrentStep('Procesando datos...');

      const { data, error: fnError } = await supabase.functions.invoke('erp-maestros-ai-import', {
        body: {
          action: 'import',
          targetType,
          fileContent,
          fileName: file.name,
          fileType: file.type || detectFileType(file.name),
          companyId,
          options
        }
      });

      setProgress(70);
      setCurrentStep('Guardando registros...');

      if (fnError) throw fnError;

      if (data?.success && data.records) {
        // Import valid records to database
        const validRecords = data.records.filter((r: ImportRecord) => r.status === 'valid');
        
        if (validRecords.length > 0) {
          await importRecordsToDatabase(targetType, validRecords, companyId);
        }

        setProgress(100);
        setCurrentStep('Importación completada');
        setResult(data);

        const imported = validRecords.length;
        toast.success(`${imported} ${ENTITY_LABELS[targetType]} importados correctamente`);
        
        return data;
      }

      throw new Error(data?.error || 'Error en importación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(`Error: ${message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setCurrentStep('');
    setResult(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    progress,
    currentStep,
    result,
    error,
    analyzeFile,
    executeImport,
    reset,
    entityLabels: ENTITY_LABELS
  };
}

// Helper functions
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // For images and PDFs, read as base64
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      // For text-based files
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    }
  });
}

function detectFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'csv': 'text/csv',
    'json': 'application/json',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

async function importRecordsToDatabase(
  targetType: MaestrosEntityType,
  records: ImportRecord[],
  companyId?: string
): Promise<void> {
  const tableMap: Record<MaestrosEntityType, string> = {
    customers: 'erp_customers',
    suppliers: 'erp_suppliers',
    items: 'erp_items',
    taxes: 'erp_taxes',
    payment_terms: 'erp_payment_terms',
    warehouses: 'erp_warehouses',
    bank_accounts: 'erp_bank_accounts',
    series: 'erp_series'
  };

  const tableName = tableMap[targetType];
  if (!tableName) return;

  const dataToInsert = records.map(r => ({
    ...r.transformed_data,
    company_id: companyId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from(tableName as any)
    .upsert(dataToInsert as any, { 
      onConflict: 'code,company_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error(`[useMaestrosAIImport] DB error for ${tableName}:`, error);
    throw new Error(`Error guardando en base de datos: ${error.message}`);
  }
}

export default useMaestrosAIImport;
