/**
 * useERPStatementImport - Hook para importar estados financieros con OCR multi-país
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface AccountingPlan {
  id: string;
  country_code: string;
  country_name: string;
  plan_code: string;
  plan_name: string;
  plan_version: string;
  is_default: boolean;
  regulatory_reference: string;
  ocr_field_mappings: Record<string, unknown>;
  detection_patterns: {
    keywords: string[];
    currency_symbol: string;
    decimal_separator: string;
    thousands_separator: string;
    date_format: string;
    language_codes: string[];
  };
}

export interface StatementImport {
  id: string;
  company_id: string;
  file_name: string;
  statement_type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';
  detected_country: string;
  detected_plan: string;
  detection_confidence: number;
  extracted_data: Record<string, unknown>;
  mapped_accounts: Array<{
    account_code: string;
    account_name: string;
    amount: number;
    sign: 'debit' | 'credit';
    confidence: number;
  }>;
  status: 'pending' | 'processing' | 'extracted' | 'validated' | 'imported' | 'failed';
  validation_errors: Array<{ field: string; message: string }>;
  generated_entries: unknown[];
  created_at: string;
}

export interface OCRDetectionResult {
  detected_country: string;
  detected_plan: string;
  statement_type: string;
  detected_language: string;
  confidence: number;
  currency: string;
  reasoning: string;
}

export interface OCRExtractionResult {
  fiscal_year: string;
  period_end_date: string;
  currency: string;
  data: {
    assets?: Record<string, unknown>;
    equity_and_liabilities?: Record<string, unknown>;
    income_statement?: Record<string, unknown>;
  };
  prior_year_data?: unknown;
  validation: {
    balance_check: boolean;
    assets_equals_liabilities: boolean;
    errors: string[];
  };
  [key: string]: unknown; // Index signature for Json compatibility
}

export function useERPStatementImport() {
  const { currentCompany } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<AccountingPlan[]>([]);
  const [imports, setImports] = useState<StatementImport[]>([]);
  const [currentImport, setCurrentImport] = useState<StatementImport | null>(null);
  const [detectionResult, setDetectionResult] = useState<OCRDetectionResult | null>(null);
  const [extractionResult, setExtractionResult] = useState<OCRExtractionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Obtener planes contables disponibles
  const fetchAccountingPlans = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('erp_accounting_plans')
        .select('*')
        .eq('is_active', true)
        .order('country_name');

      if (fetchError) throw fetchError;
      setPlans((data || []) as unknown as AccountingPlan[]);
      return data as unknown as AccountingPlan[];
    } catch (err) {
      console.error('[useERPStatementImport] Error fetching plans:', err);
      return [];
    }
  }, []);

  // Obtener historial de importaciones
  const fetchImports = useCallback(async () => {
    if (!currentCompany?.id) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('erp_statement_imports')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setImports((data || []) as unknown as StatementImport[]);
      return data as unknown as StatementImport[];
    } catch (err) {
      console.error('[useERPStatementImport] Error fetching imports:', err);
      return [];
    }
  }, [currentCompany?.id]);

  // Convertir archivo a base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Extraer solo la parte base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }, []);

  // Paso 1: Detectar plan contable
  const detectPlan = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setProgress(10);

    try {
      const base64 = await fileToBase64(file);
      setProgress(20);

      const { data, error: fnError } = await supabase.functions.invoke('erp-financial-statement-ocr', {
        body: {
          action: 'detect_plan',
          file_base64: base64
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setDetectionResult(data.data);
        setProgress(30);
        return data.data as OCRDetectionResult;
      }

      throw new Error('No se pudo detectar el plan contable');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al detectar plan';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fileToBase64]);

  // Paso 2: Extraer datos del documento
  const extractData = useCallback(async (
    file: File,
    countryCode?: string,
    planCode?: string,
    statementType?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(40);

    try {
      const base64 = await fileToBase64(file);
      setProgress(50);

      const { data, error: fnError } = await supabase.functions.invoke('erp-financial-statement-ocr', {
        body: {
          action: 'extract',
          file_base64: base64,
          country_code: countryCode || detectionResult?.detected_country || 'ES',
          plan_code: planCode || detectionResult?.detected_plan,
          statement_type: statementType || detectionResult?.statement_type || 'balance_sheet'
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setExtractionResult(data.data);
        setProgress(70);
        return data.data as OCRExtractionResult;
      }

      throw new Error('No se pudieron extraer los datos');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al extraer datos';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fileToBase64, detectionResult]);

  // Paso 3: Mapear a cuentas contables
  const mapAccounts = useCallback(async (
    extractedData: Record<string, unknown>,
    countryCode?: string,
    planCode?: string
  ) => {
    setIsLoading(true);
    setProgress(75);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('erp-financial-statement-ocr', {
        body: {
          action: 'map_accounts',
          extracted_data: extractedData,
          country_code: countryCode || detectionResult?.detected_country || 'ES',
          plan_code: planCode || detectionResult?.detected_plan
        }
      });

      if (fnError) throw fnError;

      setProgress(85);
      return data?.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al mapear cuentas';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [detectionResult]);

  // Paso 4: Generar asientos contables
  const generateEntries = useCallback(async (
    mappedData: Record<string, unknown>,
    fiscalYearId?: string
  ) => {
    if (!currentCompany?.id) return null;

    setIsLoading(true);
    setProgress(90);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('erp-financial-statement-ocr', {
        body: {
          action: 'generate_entries',
          extracted_data: mappedData,
          company_id: currentCompany.id,
          fiscal_year_id: fiscalYearId
        }
      });

      if (fnError) throw fnError;

      setProgress(100);
      toast.success('Asientos generados correctamente');
      return data?.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar asientos';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Proceso completo de importación
  const processFullImport = useCallback(async (
    file: File,
    options?: {
      statementType?: string;
      countryCode?: string;
      planCode?: string;
      fiscalYearId?: string;
      autoImport?: boolean;
    }
  ) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa primero');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setProgress(5);

    try {
      // Paso 1: Detectar plan
      const detection = await detectPlan(file);
      if (!detection) throw new Error('Fallo en detección');

      // Paso 2: Extraer datos
      const extraction = await extractData(
        file,
        options?.countryCode || detection.detected_country,
        options?.planCode || detection.detected_plan,
        options?.statementType || detection.statement_type
      );
      if (!extraction) throw new Error('Fallo en extracción');

      // Paso 3: Mapear cuentas
      const mapping = await mapAccounts(
        extraction as unknown as Record<string, unknown>,
        options?.countryCode || detection.detected_country,
        options?.planCode || detection.detected_plan
      );

      // Guardar el registro de importación
      const insertData = {
        company_id: currentCompany.id,
        fiscal_year_id: options?.fiscalYearId || null,
        file_name: file.name,
        statement_type: options?.statementType || detection.statement_type || 'balance_sheet',
        detected_country: detection.detected_country,
        detected_plan: detection.detected_plan,
        detection_confidence: detection.confidence,
        detected_language: detection.detected_language,
        extracted_data: JSON.parse(JSON.stringify(extraction)),
        mapped_accounts: mapping?.mapped_accounts ? JSON.parse(JSON.stringify(mapping.mapped_accounts)) : [],
        status: 'extracted' as const,
        validation_errors: extraction.validation?.errors?.map((e: string) => ({ field: 'general', message: e })) || []
      };

      const { data: importRecord, error: insertError } = await supabase
        .from('erp_statement_imports')
        .insert([insertData] as any)
        .select()
        .single();

      if (insertError) throw insertError;

      setCurrentImport(importRecord as unknown as StatementImport);

      // Paso 4: Auto-importar si se solicita
      if (options?.autoImport && mapping) {
        const entries = await generateEntries(mapping, options.fiscalYearId);
        if (entries) {
          await supabase
            .from('erp_statement_imports')
            .update({
              status: 'imported',
              generated_entries: entries.entries || [],
              entry_count: entries.summary?.total_entries || 0,
              imported_at: new Date().toISOString()
            })
            .eq('id', importRecord.id);
        }
      }

      toast.success('Documento procesado correctamente');
      return {
        detection,
        extraction,
        mapping,
        importRecord: importRecord as unknown as StatementImport
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en la importación';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [currentCompany?.id, detectPlan, extractData, mapAccounts, generateEntries]);

  // Reset del estado
  const reset = useCallback(() => {
    setDetectionResult(null);
    setExtractionResult(null);
    setCurrentImport(null);
    setProgress(0);
    setError(null);
  }, []);

  return {
    // Estado
    isLoading,
    plans,
    imports,
    currentImport,
    detectionResult,
    extractionResult,
    progress,
    error,
    
    // Acciones
    fetchAccountingPlans,
    fetchImports,
    detectPlan,
    extractData,
    mapAccounts,
    generateEntries,
    processFullImport,
    reset,
    
    // Setters
    setCurrentImport,
  };
}

export default useERPStatementImport;
