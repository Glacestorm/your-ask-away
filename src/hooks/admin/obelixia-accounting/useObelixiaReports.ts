/**
 * useObelixiaReports Hook
 * Reportes financieros: Balance, PyG, Flujo de Caja
 * Fase 11.2 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface BalanceSheetRow {
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity';
  account_group: number;
  level: number;
  balance: number;
  previous_balance?: number;
  variation?: number;
  variation_percent?: number;
}

export interface BalanceSheet {
  date: string;
  fiscal_year: number;
  assets: {
    current: BalanceSheetRow[];
    non_current: BalanceSheetRow[];
    total: number;
  };
  liabilities: {
    current: BalanceSheetRow[];
    non_current: BalanceSheetRow[];
    total: number;
  };
  equity: {
    items: BalanceSheetRow[];
    total: number;
  };
  total_liabilities_equity: number;
  is_balanced: boolean;
}

export interface IncomeStatementRow {
  account_code: string;
  account_name: string;
  category: string;
  amount: number;
  previous_amount?: number;
  variation?: number;
  variation_percent?: number;
  is_subtotal?: boolean;
}

export interface IncomeStatement {
  period_start: string;
  period_end: string;
  fiscal_year: number;
  operating_income: IncomeStatementRow[];
  operating_expenses: IncomeStatementRow[];
  gross_margin: number;
  operating_result: number;
  financial_result: number;
  pre_tax_result: number;
  tax_expense: number;
  net_result: number;
  ebitda?: number;
  previous_net_result?: number;
}

export interface CashFlowRow {
  category: string;
  description: string;
  amount: number;
}

export interface CashFlowStatement {
  period_start: string;
  period_end: string;
  fiscal_year: number;
  opening_balance: number;
  operating_activities: {
    items: CashFlowRow[];
    total: number;
  };
  investing_activities: {
    items: CashFlowRow[];
    total: number;
  };
  financing_activities: {
    items: CashFlowRow[];
    total: number;
  };
  net_change: number;
  closing_balance: number;
}

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  include_comparatives: boolean;
  include_notes: boolean;
  language: 'es' | 'en' | 'ca';
}

// === HOOK ===
export function useObelixiaReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // === BALANCE SHEET ===
  const getBalanceSheet = useCallback(async (
    asOfDate?: string,
    comparativeDate?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_balance_sheet',
            params: {
              as_of_date: asOfDate || new Date().toISOString().split('T')[0],
              comparative_date: comparativeDate
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setBalanceSheet(data.data as BalanceSheet);
        return data.data;
      }

      throw new Error(data?.error || 'Error al generar balance');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaReports] getBalanceSheet error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === INCOME STATEMENT ===
  const getIncomeStatement = useCallback(async (
    startDate: string,
    endDate: string,
    includeComparative?: boolean
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_income_statement',
            params: {
              start_date: startDate,
              end_date: endDate,
              include_comparative: includeComparative
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setIncomeStatement(data.data as IncomeStatement);
        return data.data;
      }

      throw new Error(data?.error || 'Error al generar PyG');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaReports] getIncomeStatement error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CASH FLOW STATEMENT ===
  const getCashFlowStatement = useCallback(async (
    startDate: string,
    endDate: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_cash_flow',
            params: {
              start_date: startDate,
              end_date: endDate
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setCashFlow(data.data as CashFlowStatement);
        return data.data;
      }

      throw new Error(data?.error || 'Error al generar flujo de caja');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaReports] getCashFlowStatement error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EXPORT REPORT ===
  const exportReport = useCallback(async (
    reportType: 'balance_sheet' | 'income_statement' | 'cash_flow',
    options: ReportExportOptions
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'export_report',
            params: {
              report_type: reportType,
              ...options,
              data: reportType === 'balance_sheet' ? balanceSheet :
                    reportType === 'income_statement' ? incomeStatement :
                    cashFlow
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.url) {
        // Download the file
        window.open(data.url, '_blank');
        toast.success('Reporte exportado correctamente');
        return data.url;
      }

      throw new Error(data?.error || 'Error al exportar');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaReports] exportReport error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [balanceSheet, incomeStatement, cashFlow]);

  // === AGING REPORT ===
  const getAgingReport = useCallback(async (
    reportType: 'receivables' | 'payables',
    asOfDate?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_aging_report',
            params: {
              report_type: reportType,
              as_of_date: asOfDate || new Date().toISOString().split('T')[0]
            }
          }
        }
      );

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('[useObelixiaReports] getAgingReport error:', err);
      return null;
    }
  }, []);

  return {
    // State
    isLoading,
    balanceSheet,
    incomeStatement,
    cashFlow,
    error,
    // Actions
    getBalanceSheet,
    getIncomeStatement,
    getCashFlowStatement,
    exportReport,
    getAgingReport
  };
}

export default useObelixiaReports;
