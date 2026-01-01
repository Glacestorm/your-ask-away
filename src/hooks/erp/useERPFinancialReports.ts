/**
 * useERPFinancialReports - Hook para generación de estados financieros
 * Fase 2: Reportes Financieros Avanzados con IA
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

// === INTERFACES ===

export interface BalanceSheetItem {
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
  parent_code?: string;
  level: number;
  is_total: boolean;
}

export interface BalanceSheet {
  as_of_date: string;
  currency: string;
  assets: {
    current: BalanceSheetItem[];
    non_current: BalanceSheetItem[];
    total: number;
  };
  liabilities: {
    current: BalanceSheetItem[];
    non_current: BalanceSheetItem[];
    total: number;
  };
  equity: {
    items: BalanceSheetItem[];
    total: number;
  };
  total_liabilities_equity: number;
  is_balanced: boolean;
}

export interface IncomeStatementItem {
  account_code: string;
  account_name: string;
  amount: number;
  percentage_of_revenue?: number;
  parent_code?: string;
  level: number;
  is_total: boolean;
}

export interface IncomeStatement {
  period_start: string;
  period_end: string;
  currency: string;
  revenue: {
    items: IncomeStatementItem[];
    total: number;
  };
  cost_of_sales: {
    items: IncomeStatementItem[];
    total: number;
  };
  gross_profit: number;
  operating_expenses: {
    items: IncomeStatementItem[];
    total: number;
  };
  operating_income: number;
  other_income_expense: {
    items: IncomeStatementItem[];
    total: number;
  };
  income_before_tax: number;
  tax_expense: number;
  net_income: number;
  ebitda?: number;
}

export interface CashFlowItem {
  description: string;
  amount: number;
  category: 'operating' | 'investing' | 'financing';
}

export interface CashFlowStatement {
  period_start: string;
  period_end: string;
  currency: string;
  opening_cash: number;
  operating_activities: {
    items: CashFlowItem[];
    total: number;
  };
  investing_activities: {
    items: CashFlowItem[];
    total: number;
  };
  financing_activities: {
    items: CashFlowItem[];
    total: number;
  };
  net_change_in_cash: number;
  closing_cash: number;
}

export interface FinancialRatios {
  // Liquidez
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  working_capital: number;
  
  // Solvencia
  debt_to_equity: number;
  debt_ratio: number;
  equity_ratio: number;
  interest_coverage?: number;
  
  // Rentabilidad
  gross_margin: number;
  operating_margin: number;
  net_margin: number;
  roe: number;
  roa: number;
  
  // Eficiencia
  asset_turnover: number;
  inventory_turnover?: number;
  receivables_turnover?: number;
  payables_turnover?: number;
  days_sales_outstanding?: number;
  days_payables_outstanding?: number;
  
  // Crecimiento (YoY)
  revenue_growth?: number;
  profit_growth?: number;
}

export interface AIFinancialAnalysis {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  risk_level: 'low' | 'medium' | 'high';
  outlook: 'positive' | 'neutral' | 'negative';
  key_metrics_analysis: {
    metric: string;
    value: number | string;
    assessment: string;
    benchmark?: number;
  }[];
  comparative_analysis?: {
    vs_industry: string;
    vs_previous_period: string;
  };
}

export interface ClosingEntry {
  id: string;
  period_id: string;
  entry_type: 'revenue_close' | 'expense_close' | 'net_income' | 'dividend';
  description: string;
  status: 'pending' | 'posted' | 'reversed';
  total_amount: number;
  created_at: string;
}

export interface PeriodClosingStatus {
  period_id: string;
  period_name: string;
  status: 'open' | 'closing' | 'closed';
  can_close: boolean;
  blocking_issues: string[];
  closing_entries: ClosingEntry[];
  trial_balance_verified: boolean;
  subsidiary_reconciled: boolean;
}

// === HOOK ===

export function useERPFinancialReports() {
  const { currentCompany } = useERPContext();
  
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [ratios, setRatios] = useState<FinancialRatios | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIFinancialAnalysis | null>(null);
  const [closingStatus, setClosingStatus] = useState<PeriodClosingStatus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // === GENERAR BALANCE DE SITUACIÓN ===
  const generateBalanceSheet = useCallback(async (asOfDate: string) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'generate_balance_sheet',
            company_id: currentCompany.id,
            as_of_date: asOfDate,
            country_code: currentCompany.country || 'ES'
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        setBalanceSheet(data.balance_sheet);
        return data.balance_sheet;
      }
      
      throw new Error(data?.error || 'Error generando balance');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando balance';
      toast.error(message);
      console.error('[useERPFinancialReports] generateBalanceSheet error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  // === GENERAR CUENTA DE RESULTADOS ===
  const generateIncomeStatement = useCallback(async (
    startDate: string,
    endDate: string
  ) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'generate_income_statement',
            company_id: currentCompany.id,
            start_date: startDate,
            end_date: endDate,
            country_code: currentCompany.country || 'ES'
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        setIncomeStatement(data.income_statement);
        return data.income_statement;
      }
      
      throw new Error(data?.error || 'Error generando cuenta de resultados');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando P&L';
      toast.error(message);
      console.error('[useERPFinancialReports] generateIncomeStatement error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  // === GENERAR ESTADO DE FLUJO DE EFECTIVO ===
  const generateCashFlowStatement = useCallback(async (
    startDate: string,
    endDate: string
  ) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'generate_cash_flow',
            company_id: currentCompany.id,
            start_date: startDate,
            end_date: endDate,
            country_code: currentCompany.country || 'ES'
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        setCashFlow(data.cash_flow);
        return data.cash_flow;
      }
      
      throw new Error(data?.error || 'Error generando flujo de efectivo');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando cash flow';
      toast.error(message);
      console.error('[useERPFinancialReports] generateCashFlowStatement error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  // === CALCULAR RATIOS FINANCIEROS ===
  const calculateFinancialRatios = useCallback(async (
    asOfDate: string,
    comparePeriodStart?: string,
    comparePeriodEnd?: string
  ) => {
    if (!currentCompany?.id) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'calculate_ratios',
            company_id: currentCompany.id,
            as_of_date: asOfDate,
            compare_start: comparePeriodStart,
            compare_end: comparePeriodEnd
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        setRatios(data.ratios);
        return data.ratios;
      }
      
      return null;
    } catch (err) {
      console.error('[useERPFinancialReports] calculateFinancialRatios error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  // === ANÁLISIS IA DE ESTADOS FINANCIEROS ===
  const analyzeWithAI = useCallback(async (
    reportType: 'balance' | 'income' | 'cashflow' | 'comprehensive',
    periodStart: string,
    periodEnd: string
  ) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'ai_analysis',
            company_id: currentCompany.id,
            report_type: reportType,
            period_start: periodStart,
            period_end: periodEnd,
            country_code: currentCompany.country || 'ES',
            include_benchmarks: true
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        setAiAnalysis(data.analysis);
        return data.analysis;
      }
      
      throw new Error(data?.error || 'Error en análisis IA');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en análisis IA';
      toast.error(message);
      console.error('[useERPFinancialReports] analyzeWithAI error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentCompany]);

  // === VERIFICAR ESTADO DE CIERRE DE PERÍODO ===
  const checkClosingStatus = useCallback(async (periodId: string) => {
    if (!currentCompany?.id) return null;

    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'check_closing_status',
            company_id: currentCompany.id,
            period_id: periodId
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        setClosingStatus(data.status);
        return data.status;
      }
      
      return null;
    } catch (err) {
      console.error('[useERPFinancialReports] checkClosingStatus error:', err);
      return null;
    }
  }, [currentCompany]);

  // === EJECUTAR CIERRE DE PERÍODO ===
  const executePeriodClosing = useCallback(async (
    periodId: string,
    options?: {
      close_revenue: boolean;
      close_expenses: boolean;
      transfer_net_income: boolean;
      target_equity_account?: string;
    }
  ) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    setIsClosing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'execute_closing',
            company_id: currentCompany.id,
            period_id: periodId,
            options: options || {
              close_revenue: true,
              close_expenses: true,
              transfer_net_income: true
            }
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Cierre de período ejecutado correctamente');
        await checkClosingStatus(periodId);
        return data;
      }
      
      throw new Error(data?.error || 'Error en cierre de período');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en cierre';
      toast.error(message);
      console.error('[useERPFinancialReports] executePeriodClosing error:', err);
      return null;
    } finally {
      setIsClosing(false);
    }
  }, [currentCompany, checkClosingStatus]);

  // === REVERTIR CIERRE DE PERÍODO ===
  const revertPeriodClosing = useCallback(async (periodId: string, reason: string) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    if (!reason) {
      toast.error('Debe indicar un motivo para revertir el cierre');
      return null;
    }

    setIsClosing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'revert_closing',
            company_id: currentCompany.id,
            period_id: periodId,
            reason
          }
        }
      );

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Cierre de período revertido');
        await checkClosingStatus(periodId);
        return data;
      }
      
      throw new Error(data?.error || 'Error revirtiendo cierre');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error revirtiendo cierre';
      toast.error(message);
      console.error('[useERPFinancialReports] revertPeriodClosing error:', err);
      return null;
    } finally {
      setIsClosing(false);
    }
  }, [currentCompany, checkClosingStatus]);

  // === EXPORTAR REPORTE ===
  const exportReport = useCallback(async (
    reportType: 'balance' | 'income' | 'cashflow',
    format: 'pdf' | 'xlsx' | 'csv',
    options?: {
      include_notes?: boolean;
      include_comparison?: boolean;
      comparison_period?: { start: string; end: string };
    }
  ) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'erp-financial-reports',
        {
          body: {
            action: 'export_report',
            company_id: currentCompany.id,
            report_type: reportType,
            format,
            options,
            balance_sheet: balanceSheet,
            income_statement: incomeStatement,
            cash_flow: cashFlow
          }
        }
      );

      if (error) throw error;
      
      if (data?.success && data?.download_url) {
        // Abrir descarga en nueva pestaña
        window.open(data.download_url, '_blank');
        toast.success('Reporte exportado');
        return data.download_url;
      }
      
      throw new Error(data?.error || 'Error exportando reporte');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error exportando';
      toast.error(message);
      console.error('[useERPFinancialReports] exportReport error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, balanceSheet, incomeStatement, cashFlow]);

  // === GENERAR TODOS LOS REPORTES ===
  const generateAllReports = useCallback(async (
    periodStart: string,
    periodEnd: string
  ) => {
    if (!currentCompany?.id) return null;

    setIsLoading(true);
    try {
      const [bs, is, cf, r] = await Promise.all([
        generateBalanceSheet(periodEnd),
        generateIncomeStatement(periodStart, periodEnd),
        generateCashFlowStatement(periodStart, periodEnd),
        calculateFinancialRatios(periodEnd, periodStart, periodEnd)
      ]);

      return { balanceSheet: bs, incomeStatement: is, cashFlow: cf, ratios: r };
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, generateBalanceSheet, generateIncomeStatement, generateCashFlowStatement, calculateFinancialRatios]);

  return {
    // Estado
    isLoading,
    balanceSheet,
    incomeStatement,
    cashFlow,
    ratios,
    aiAnalysis,
    closingStatus,
    isAnalyzing,
    isClosing,
    
    // Acciones
    generateBalanceSheet,
    generateIncomeStatement,
    generateCashFlowStatement,
    calculateFinancialRatios,
    analyzeWithAI,
    checkClosingStatus,
    executePeriodClosing,
    revertPeriodClosing,
    exportReport,
    generateAllReports,
    
    // Setters para limpiar
    clearBalanceSheet: () => setBalanceSheet(null),
    clearIncomeStatement: () => setIncomeStatement(null),
    clearCashFlow: () => setCashFlow(null),
    clearAnalysis: () => setAiAnalysis(null),
  };
}

export default useERPFinancialReports;
