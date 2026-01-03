import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ERPModule = 'accounting' | 'treasury' | 'inventory' | 'sales' | 'purchases' | 'trade' | 'all';
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'xml' | 'pdf' | 'qif' | 'ofx' | 'mt940' | 'camt053' | 'sepa';

export interface ImportExportOptions {
  includeRelations?: boolean;
  dateRange?: { start: string; end: string };
  filters?: Record<string, unknown>;
  ocrEnabled?: boolean;
  language?: string;
  companyId?: string;
  fiscalYear?: string;
}

export interface OCRResult {
  document_type: string;
  confidence: number;
  module_target: string;
  extracted_data: {
    document: { type: string; number: string; series: string };
    company: { name: string; tax_id: string; address: string };
    counterparty: { name: string; tax_id: string; address: string };
    amounts: { subtotal: number; tax_amount: number; tax_rate: number; total: number; currency: string };
    dates: { issue_date: string; due_date: string };
    items: Array<{ description: string; quantity: number; unit_price: number; tax_rate: number; total: number }>;
    payment: { method: string; bank_account: string; reference: string };
    raw_text: string;
  };
  erp_mapping: {
    target_table: string;
    suggested_fields: Record<string, unknown>;
    related_records: unknown[];
  };
  validation: {
    is_valid: boolean;
    warnings: string[];
    errors: string[];
    suggestions: string[];
  };
  tables_extracted: Array<{ headers: string[]; rows: string[][]; confidence: number }>;
  entities: Array<{ type: string; value: string; confidence: number; normalized_value?: string }>;
}

export interface ImportResult {
  import_status: 'success' | 'partial' | 'failed';
  format_detected: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  records: Array<{
    row_number: number;
    status: 'valid' | 'warning' | 'error';
    original_data: Record<string, unknown>;
    transformed_data: Record<string, unknown>;
    target_table: string;
    validation_messages: string[];
  }>;
  field_mapping: Record<string, string>;
  summary: {
    by_status: { valid: number; warning: number; error: number };
    by_type: Record<string, number>;
  };
  suggestions: string[];
}

export interface ExportResult {
  export_status: 'success' | 'failed';
  format: string;
  total_records: number;
  file_content: string;
  file_name: string;
  mime_type: string;
  encoding: string;
  metadata: {
    generated_at: string;
    module: string;
    filters_applied: Record<string, unknown>;
  };
  validation: {
    is_valid: boolean;
    warnings: string[];
  };
}

export function useERPImportExport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performOCR = useCallback(async (
    fileSource: string | File,
    module: ERPModule,
    options?: ImportExportOptions
  ): Promise<OCRResult | null> => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      let fileUrl = '';
      
      if (fileSource instanceof File) {
        // Upload file to get URL
        const formData = new FormData();
        formData.append('file', fileSource);
        
        // For now, convert to base64 for processing
        const reader = new FileReader();
        fileUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileSource);
        });
      } else {
        fileUrl = fileSource;
      }

      setProgress(30);

      const { data, error: fnError } = await supabase.functions.invoke('erp-universal-import-export', {
        body: {
          action: 'ocr_extract',
          module,
          fileUrl,
          options: {
            ...options,
            ocrEnabled: true
          }
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      if (data?.success) {
        setLastResult(data);
        setProgress(100);
        toast.success(`OCR completado: ${data.document_type || 'documento'} detectado`);
        return data as OCRResult;
      }

      throw new Error(data?.error || 'Error en OCR');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(`Error en OCR: ${message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const importData = useCallback(async (
    source: string | File | Record<string, unknown>,
    module: ERPModule,
    format: ExportFormat = 'json',
    options?: ImportExportOptions
  ): Promise<ImportResult | null> => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      let fileContent: string | undefined;
      let data: Record<string, unknown> | undefined;

      if (source instanceof File) {
        const reader = new FileReader();
        fileContent = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(source);
        });
      } else if (typeof source === 'string') {
        fileContent = source;
      } else {
        data = source;
      }

      setProgress(30);

      const { data: result, error: fnError } = await supabase.functions.invoke('erp-universal-import-export', {
        body: {
          action: 'import',
          module,
          format,
          data,
          fileContent,
          options
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      if (result?.success) {
        setLastResult(result);
        setProgress(100);
        
        const status = result.import_status;
        if (status === 'success') {
          toast.success(`Importación completada: ${result.processed_records} registros`);
        } else if (status === 'partial') {
          toast.warning(`Importación parcial: ${result.processed_records}/${result.total_records} registros`);
        } else {
          toast.error('Error en importación');
        }
        
        return result as ImportResult;
      }

      throw new Error(result?.error || 'Error en importación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(`Error en importación: ${message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const exportData = useCallback(async (
    data: Record<string, unknown>,
    module: ERPModule,
    format: ExportFormat = 'json',
    options?: ImportExportOptions
  ): Promise<ExportResult | null> => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      setProgress(30);

      const { data: result, error: fnError } = await supabase.functions.invoke('erp-universal-import-export', {
        body: {
          action: 'export',
          module,
          format,
          data,
          options
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      if (result?.success) {
        setLastResult(result);
        setProgress(100);
        toast.success(`Exportación completada: ${result.total_records} registros`);
        return result as ExportResult;
      }

      throw new Error(result?.error || 'Error en exportación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(`Error en exportación: ${message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const validateData = useCallback(async (
    data: Record<string, unknown>,
    module: ERPModule,
    format?: ExportFormat
  ): Promise<Record<string, unknown> | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('erp-universal-import-export', {
        body: {
          action: 'validate',
          module,
          format,
          data
        }
      });

      if (fnError) throw fnError;

      if (result?.success) {
        setLastResult(result);
        return result;
      }

      throw new Error(result?.error || 'Error en validación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(`Error en validación: ${message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setLastResult(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    progress,
    lastResult,
    error,
    performOCR,
    importData,
    exportData,
    validateData,
    downloadFile,
    reset
  };
}

export default useERPImportExport;
