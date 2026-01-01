/**
 * ERP Accounting Hook - Contabilidad con normativas integradas
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

// === INTERFACES ===

export interface AccountingRegulation {
  id: string;
  country_code: string;
  regulation_type: string;
  regulation_code: string;
  title: string;
  description: string;
  content_markdown: string;
  effective_date: string;
  expiry_date?: string;
  source_url?: string;
  tags: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_group: number;
  parent_id?: string;
  parent_account_code?: string;
  is_active: boolean;
  accepts_entries?: boolean;
  is_detail?: boolean;
  normal_balance?: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  status: 'draft' | 'posted' | 'reversed';
  total_debit: number;
  total_credit: number;
  fiscal_period_id: string;
  is_automatic: boolean;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  line_number: number;
  account_id: string;
  account?: ChartOfAccount;
  debit_amount: number;
  credit_amount: number;
  description?: string;
}

export interface AccountingDashboard {
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  cashBalance: number;
  pendingReceivables: number;
  pendingPayables: number;
  pendingVat: number;
  recentEntries: JournalEntry[];
  alerts: AccountingAlert[];
  currentPeriod?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

export interface AccountingAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  dueDate?: string;
  regulationId?: string;
}

export interface RegulationSearchResult {
  regulations: AccountingRegulation[];
  newRegulations: number;
  updatedRegulations: number;
  sources: string[];
  searchTimestamp: string;
}

// === INTERFACES ADICIONALES ===

export interface ERPJournal {
  id: string;
  code: string;
  name: string;
  journal_type: string;
  default_debit_account_id?: string;
  default_credit_account_id?: string;
  is_active: boolean;
}

export interface ERPAccountingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  fiscal_year_id: string;
}

// === HOOK ===

export function useERPAccounting() {
  const { currentCompany } = useERPContext();
  
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [dashboard, setDashboard] = useState<AccountingDashboard | null>(null);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [regulations, setRegulations] = useState<AccountingRegulation[]>([]);
  const [journals, setJournals] = useState<ERPJournal[]>([]);
  const [periods, setPeriods] = useState<ERPAccountingPeriod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isSearchingRegulations, setIsSearchingRegulations] = useState(false);
  const [regulationSearchProgress, setRegulationSearchProgress] = useState<string | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH DASHBOARD ===
  const fetchDashboard = useCallback(async () => {
    if (!currentCompany?.id) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_dashboard',
            params: { company_id: currentCompany.id }
          }
        }
      );

      if (fnError) throw fnError;

      setDashboard(data);
      setLastRefresh(new Date());
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando dashboard';
      setError(message);
      console.error('[useERPAccounting] fetchDashboard error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // === FETCH PLAN DE CUENTAS ===
  const fetchChartOfAccounts = useCallback(async () => {
    if (!currentCompany?.id) return [];

    try {
      const { data, error } = await supabase
        .from('obelixia_chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;

      setChartOfAccounts(data || []);
      return data || [];
    } catch (err) {
      console.error('[useERPAccounting] fetchChartOfAccounts error:', err);
      return [];
    }
  }, [currentCompany?.id]);

  // === FETCH NORMATIVAS ===
  const fetchRegulations = useCallback(async (countryCode?: string) => {
    const country = countryCode || currentCompany?.country || 'ES';

    try {
      const { data, error } = await supabase
        .from('erp_accounting_regulations')
        .select('*')
        .eq('country_code', country)
        .eq('is_active', true)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      setRegulations(data || []);
      return data || [];
    } catch (err) {
      console.error('[useERPAccounting] fetchRegulations error:', err);
      return [];
    }
  }, [currentCompany?.country]);

  // === FETCH JOURNALS ===
  const fetchJournals = useCallback(async () => {
    if (!currentCompany?.id) return [];

    try {
      const { data, error } = await supabase
        .from('erp_journals')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setJournals((data || []) as ERPJournal[]);
      return data || [];
    } catch (err) {
      console.error('[useERPAccounting] fetchJournals error:', err);
      return [];
    }
  }, [currentCompany?.id]);

  // === FETCH PERIODS ===
  const fetchPeriods = useCallback(async (fiscalYearId?: string) => {
    if (!currentCompany?.id) return [];

    try {
      let query = supabase
        .from('erp_periods')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('start_date', { ascending: false });

      if (fiscalYearId) {
        query = query.eq('fiscal_year_id', fiscalYearId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPeriods((data || []) as ERPAccountingPeriod[]);
      return data || [];
    } catch (err) {
      console.error('[useERPAccounting] fetchPeriods error:', err);
      return [];
    }
  }, [currentCompany?.id]);

  // === BUSCAR Y ACTUALIZAR NORMATIVAS ===
  const searchAndUpdateRegulations = useCallback(async (countryCode?: string) => {
    const country = countryCode || currentCompany?.country || 'ES';

    setIsSearchingRegulations(true);
    setRegulationSearchProgress('Iniciando búsqueda de normativas...');

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-regulations-search',
        {
          body: {
            action: 'search_and_update',
            country_code: country,
            company_id: currentCompany?.id
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setRegulationSearchProgress('Actualizando base de datos...');
        
        // Refrescar normativas locales
        await fetchRegulations(country);
        
        toast.success(
          `Normativas actualizadas: ${data.newRegulations} nuevas, ${data.updatedRegulations} actualizadas`
        );
        
        return {
          regulations: data.regulations || [],
          newRegulations: data.newRegulations || 0,
          updatedRegulations: data.updatedRegulations || 0,
          sources: data.sources || [],
          searchTimestamp: new Date().toISOString()
        };
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error buscando normativas';
      console.error('[useERPAccounting] searchAndUpdateRegulations error:', err);
      toast.error(message);
      return null;
    } finally {
      setIsSearchingRegulations(false);
      setRegulationSearchProgress(null);
    }
  }, [currentCompany?.country, currentCompany?.id, fetchRegulations]);

  // === CREAR ASIENTO ===
  const createJournalEntry = useCallback(async (
    entry: Partial<JournalEntry>,
    lines: Partial<JournalEntryLine>[]
  ) => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return null;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'create_entry',
            params: {
              company_id: currentCompany.id,
              entry,
              lines
            }
          }
        }
      );

      if (fnError) throw fnError;

      toast.success('Asiento creado correctamente');
      await fetchDashboard();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando asiento';
      toast.error(message);
      return null;
    }
  }, [currentCompany?.id, fetchDashboard]);

  // === CONTABILIZAR ASIENTO ===
  const postJournalEntry = useCallback(async (entryId: string) => {
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

      toast.success('Asiento contabilizado');
      await fetchDashboard();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error contabilizando asiento';
      toast.error(message);
      return null;
    }
  }, [fetchDashboard]);

  // === OBTENER BALANCE DE SITUACIÓN ===
  const getBalanceSheet = useCallback(async (date: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_balance_sheet',
            params: { as_of_date: date }
          }
        }
      );

      if (fnError) throw fnError;
      return data;
    } catch (err) {
      console.error('[useERPAccounting] getBalanceSheet error:', err);
      return null;
    }
  }, []);

  // === OBTENER CUENTA DE RESULTADOS ===
  const getIncomeStatement = useCallback(async (startDate: string, endDate: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'get_income_statement',
            params: { start_date: startDate, end_date: endDate }
          }
        }
      );

      if (fnError) throw fnError;
      return data;
    } catch (err) {
      console.error('[useERPAccounting] getIncomeStatement error:', err);
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 120000) => {
    stopAutoRefresh();
    fetchDashboard();
    fetchRegulations();
    autoRefreshInterval.current = setInterval(() => {
      fetchDashboard();
    }, intervalMs);
  }, [fetchDashboard, fetchRegulations]);

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

  // === CARGAR AL CAMBIAR EMPRESA ===
  useEffect(() => {
    if (currentCompany?.id) {
      fetchDashboard();
      fetchChartOfAccounts();
      fetchRegulations();
    }
  }, [currentCompany?.id]);

  return {
    // Estado
    isLoading,
    dashboard,
    chartOfAccounts,
    regulations,
    journals,
    periods,
    error,
    lastRefresh,
    isSearchingRegulations,
    regulationSearchProgress,
    
    // Acciones
    fetchDashboard,
    fetchChartOfAccounts,
    fetchRegulations,
    fetchJournals,
    fetchPeriods,
    searchAndUpdateRegulations,
    createJournalEntry,
    postJournalEntry,
    getBalanceSheet,
    getIncomeStatement,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useERPAccounting;
