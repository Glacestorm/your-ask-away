/**
 * useObelixiaAccounting Hook
 * Motor contable principal para ObelixIA
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface FiscalConfig {
  id: string;
  jurisdiction: 'spain' | 'andorra';
  fiscal_year: number;
  company_name: string;
  company_tax_id: string | null;
  vat_rate_standard: number;
  vat_rate_reduced: number;
  corporate_tax_rate: number;
  is_active: boolean;
}

export interface ChartAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  account_group: number;
  parent_account_code: string | null;
  description: string | null;
  is_detail: boolean;
  normal_balance: 'debit' | 'credit';
  is_active: boolean;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  source_document: string | null;
  is_automatic: boolean;
  status: 'draft' | 'posted' | 'reversed';
  total_debit: number;
  total_credit: number;
  posted_at: string | null;
  created_at: string;
}

export interface JournalEntryLine {
  account_code: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  tax_code?: string;
}

export interface FiscalPeriod {
  id: string;
  fiscal_year: number;
  period_number: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed' | 'locked';
}

export interface DashboardData {
  config: FiscalConfig | null;
  currentPeriod: FiscalPeriod | null;
  kpis: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    unreconciledCount: number;
    pendingDeclarations: number;
  };
  recentEntries: JournalEntry[];
  unreconciledTxns: unknown[];
  pendingDeclarations: unknown[];
  partners: unknown[];
}

export interface TrialBalanceRow {
  account: ChartAccount;
  debit: number;
  credit: number;
  balance_debit: number;
  balance_credit: number;
}

// === HOOK ===
export function useObelixiaAccounting() {
  const [isLoading, setIsLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH DASHBOARD ===
  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        { body: { action: 'get_dashboard' } }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setDashboard(data.data as DashboardData);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error(data?.error || 'Error al obtener dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaAccounting] fetchDashboard error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH ACCOUNTS ===
  const fetchAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('obelixia_chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      setAccounts((data || []) as ChartAccount[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaAccounting] fetchAccounts error:', err);
      return null;
    }
  }, []);

  // === FETCH ENTRIES ===
  const fetchEntries = useCallback(async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('obelixia_journal_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setEntries((data || []) as JournalEntry[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaAccounting] fetchEntries error:', err);
      return null;
    }
  }, []);

  // === FETCH PERIODS ===
  const fetchPeriods = useCallback(async (fiscalYear?: number) => {
    try {
      let query = supabase
        .from('obelixia_fiscal_periods')
        .select('*')
        .order('period_number');

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPeriods((data || []) as FiscalPeriod[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaAccounting] fetchPeriods error:', err);
      return null;
    }
  }, []);

  // === CREATE ENTRY ===
  const createEntry = useCallback(async (
    entryDate: string,
    description: string,
    lines: JournalEntryLine[],
    options?: {
      referenceType?: string;
      referenceId?: string;
      sourceDocument?: string;
      autoPost?: boolean;
    }
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'create_entry',
            params: {
              entry_date: entryDate,
              description,
              lines,
              reference_type: options?.referenceType,
              reference_id: options?.referenceId,
              source_document: options?.sourceDocument,
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Asiento creado correctamente');
        
        // Auto-post if requested
        if (options?.autoPost && data.data?.entry?.id) {
          await postEntry(data.data.entry.id);
        }
        
        await fetchEntries();
        return data.data;
      }

      throw new Error(data?.error || 'Error al crear asiento');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      console.error('[useObelixiaAccounting] createEntry error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchEntries]);

  // === POST ENTRY ===
  const postEntry = useCallback(async (entryId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'post_entry',
            params: { entry_id: entryId }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Asiento contabilizado');
        await fetchEntries();
        return true;
      }

      throw new Error(data?.error || 'Error al contabilizar');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return false;
    }
  }, [fetchEntries]);

  // === REVERSE ENTRY ===
  const reverseEntry = useCallback(async (entryId: string, reversalDate: string, reason?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'reverse_entry',
            params: { entry_id: entryId, reversal_date: reversalDate, reason }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Asiento anulado correctamente');
        await fetchEntries();
        return data.data;
      }

      throw new Error(data?.error || 'Error al anular asiento');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    }
  }, [fetchEntries]);

  // === GET TRIAL BALANCE ===
  const getTrialBalance = useCallback(async (periodId?: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_trial_balance',
            params: { fiscal_period_id: periodId }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setTrialBalance(data.data.trialBalance || []);
        return data.data;
      }

      throw new Error(data?.error || 'Error al obtener balance');
    } catch (err) {
      console.error('[useObelixiaAccounting] getTrialBalance error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === AI CATEGORIZE ===
  const aiCategorize = useCallback(async (description: string, amount: number, counterparty?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'ai_categorize',
            params: { description, amount, counterparty }
          }
        }
      );

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('[useObelixiaAccounting] aiCategorize error:', err);
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 120000) => {
    stopAutoRefresh();
    fetchDashboard();
    autoRefreshInterval.current = setInterval(() => {
      fetchDashboard();
    }, intervalMs);
  }, [fetchDashboard]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    // State
    isLoading,
    dashboard,
    accounts,
    entries,
    periods,
    trialBalance,
    error,
    lastRefresh,
    // Actions
    fetchDashboard,
    fetchAccounts,
    fetchEntries,
    fetchPeriods,
    createEntry,
    postEntry,
    reverseEntry,
    getTrialBalance,
    aiCategorize,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaAccounting;
