/**
 * useObelixiaIntegrations Hook
 * Integraciones externas: Importación/Exportación contable
 * Fase 11.7 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface BankImport {
  id: string;
  bank_account_id: string;
  file_name: string;
  file_type: 'ofx' | 'csv' | 'qif' | 'camt053';
  file_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_transactions: number;
  matched_transactions: number;
  pending_transactions: number;
  import_date: string;
  processed_at?: string;
  error_message?: string;
}

export interface AccountingExport {
  id: string;
  export_type: 'a3' | 'sage' | 'contaplus' | 'sii' | 'facturae' | 'sepa';
  export_format: 'xml' | 'csv' | 'txt' | 'json';
  date_from: string;
  date_to: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  file_url?: string;
  file_size?: number;
  records_count: number;
  generated_at?: string;
  downloaded_at?: string;
  error_message?: string;
  created_at: string;
}

export interface ReconciliationRule {
  id: string;
  rule_name: string;
  priority: number;
  is_active: boolean;
  match_type: string;
  match_field: string;
  match_value: string;
  amount_min?: number;
  amount_max?: number;
  target_account_code?: string;
  target_partner_id?: string;
  auto_approve?: boolean;
  times_matched?: number;
  last_matched_at?: string;
}

// === HOOK ===
export function useObelixiaIntegrations() {
  const [isLoading, setIsLoading] = useState(false);
  const [imports, setImports] = useState<BankImport[]>([]);
  const [exports, setExports] = useState<AccountingExport[]>([]);
  const [reconciliationRules, setReconciliationRules] = useState<ReconciliationRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === IMPORT BANK FILE ===
  const importBankFile = useCallback(async (
    bankAccountId: string,
    fileType: BankImport['file_type'],
    fileContent: string,
    fileName: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'import_bank_file',
            params: {
              bank_account_id: bankAccountId,
              file_type: fileType,
              file_content: fileContent,
              file_name: fileName
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Importadas ${data.data.transactions_count} transacciones`);
        return data.data;
      }

      throw new Error(data?.error || 'Error al importar archivo');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaIntegrations] importBankFile error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH IMPORTS ===
  const fetchImports = useCallback(async (bankAccountId?: string) => {
    try {
      const { data, error } = await supabase
        .from('obelixia_bank_imports')
        .select('*')
        .order('import_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setImports((data || []) as BankImport[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaIntegrations] fetchImports error:', err);
      return null;
    }
  }, []);

  // === EXPORT ACCOUNTING DATA ===
  const exportAccountingData = useCallback(async (
    exportType: AccountingExport['export_type'],
    exportFormat: AccountingExport['export_format'],
    dateFrom: string,
    dateTo: string
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'export_accounting',
            params: {
              export_type: exportType,
              export_format: exportFormat,
              date_from: dateFrom,
              date_to: dateTo
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Exportación ${exportType.toUpperCase()} generada`);
        
        // Si hay URL de descarga, abrir en nueva pestaña
        if (data.data.download_url) {
          window.open(data.data.download_url, '_blank');
        }
        
        return data.data;
      }

      throw new Error(data?.error || 'Error al exportar');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaIntegrations] exportAccountingData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH EXPORTS ===
  const fetchExports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('obelixia_accounting_exports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExports((data || []) as AccountingExport[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaIntegrations] fetchExports error:', err);
      return null;
    }
  }, []);

  // === RECONCILIATION RULES ===
  const fetchReconciliationRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('obelixia_reconciliation_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setReconciliationRules((data || []) as ReconciliationRule[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaIntegrations] fetchReconciliationRules error:', err);
      return null;
    }
  }, []);

  const createReconciliationRule = useCallback(async (
    rule: Omit<ReconciliationRule, 'id' | 'times_matched' | 'last_matched_at'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('obelixia_reconciliation_rules')
        .insert([rule] as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Regla de conciliación creada');
      await fetchReconciliationRules();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    }
  }, [fetchReconciliationRules]);

  const updateReconciliationRule = useCallback(async (
    ruleId: string,
    updates: Partial<ReconciliationRule>
  ) => {
    try {
      const { error } = await supabase
        .from('obelixia_reconciliation_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;
      
      toast.success('Regla actualizada');
      await fetchReconciliationRules();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    }
  }, [fetchReconciliationRules]);

  const deleteReconciliationRule = useCallback(async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('obelixia_reconciliation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      toast.success('Regla eliminada');
      await fetchReconciliationRules();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    }
  }, [fetchReconciliationRules]);

  // === GENERATE SII EXPORT (Spain) ===
  const generateSIIExport = useCallback(async (
    period: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    fiscalYear: number,
    bookType: 'issued' | 'received'
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'generate_sii',
            params: {
              period,
              fiscal_year: fiscalYear,
              book_type: bookType
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Libro SII generado');
        return data.data;
      }

      throw new Error(data?.error || 'Error al generar SII');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE SEPA PAYMENT FILE ===
  const generateSEPAPayment = useCallback(async (invoiceIds: string[]) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'generate_sepa_payment',
            params: { invoice_ids: invoiceIds }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Fichero SEPA generado');
        return data.data;
      }

      throw new Error(data?.error || 'Error al generar SEPA');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isLoading,
    imports,
    exports,
    reconciliationRules,
    error,
    // Import Actions
    importBankFile,
    fetchImports,
    // Export Actions
    exportAccountingData,
    fetchExports,
    generateSIIExport,
    generateSEPAPayment,
    // Reconciliation Rules
    fetchReconciliationRules,
    createReconciliationRule,
    updateReconciliationRule,
    deleteReconciliationRule
  };
}

export default useObelixiaIntegrations;
