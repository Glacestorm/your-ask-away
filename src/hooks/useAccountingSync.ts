import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountingData {
  balance_sheet: Record<string, number>;
  income_statement: Record<string, number>;
  cash_flow: Record<string, number>;
  fiscal_year: number;
}

interface SyncStatus {
  is_available: boolean;
  last_sync: string | null;
  synced_years: number[];
  accounting_module_installed: boolean;
}

export function useAccountingSync(companyId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    is_available: false,
    last_sync: null,
    synced_years: [],
    accounting_module_installed: false
  });
  const [accountingData, setAccountingData] = useState<AccountingData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if accounting module is installed
  const checkAccountingModuleStatus = useCallback(async () => {
    try {
      // Check installed modules for any accounting module
      const { data: modules, error: modulesError } = await supabase
        .from('installed_modules')
        .select(`
          id,
          is_active,
          app_modules!inner (
            module_key,
            module_name
          )
        `)
        .eq('is_active', true);

      if (modulesError) throw modulesError;

      const hasAccounting = modules?.some((m: any) => 
        m.app_modules?.module_key?.includes('accounting') ||
        m.app_modules?.module_key?.includes('contabilidad')
      ) || false;

      setSyncStatus(prev => ({
        ...prev,
        accounting_module_installed: hasAccounting,
        is_available: hasAccounting
      }));

      return hasAccounting;
    } catch (err) {
      console.error('Error checking accounting module:', err);
      return false;
    }
  }, []);

  // Fetch accounting data from the accounting module
  const fetchAccountingData = useCallback(async (fiscalYear?: number) => {
    if (!companyId) return null;
    
    setIsLoading(true);
    try {
      // Try to get data from company_financial_statements
      let query = supabase
        .from('company_financial_statements')
        .select(`
          *,
          balance_sheets (*),
          income_statements (*),
          cash_flow_statements (*)
        `)
        .eq('company_id', companyId);

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }

      const { data, error: fetchError } = await query.order('fiscal_year', { ascending: false });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const formattedData: AccountingData[] = data.map(statement => ({
          fiscal_year: statement.fiscal_year,
          balance_sheet: statement.balance_sheets?.[0] || {},
          income_statement: statement.income_statements?.[0] || {},
          cash_flow: statement.cash_flow_statements?.[0] || {}
        }));

        setAccountingData(formattedData);
        setSyncStatus(prev => ({
          ...prev,
          synced_years: formattedData.map(d => d.fiscal_year)
        }));

        return formattedData;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching accounting data';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Sync accounting data to financial plan
  const syncToFinancialPlan = useCallback(async (planId: string, fiscalYear: number) => {
    setIsLoading(true);
    try {
      const data = await fetchAccountingData(fiscalYear);
      if (!data || data.length === 0) {
        toast.warning('No hay datos contables disponibles para sincronizar');
        return false;
      }

      const yearData = data.find(d => d.fiscal_year === fiscalYear);
      if (!yearData) {
        toast.warning(`No hay datos para el ejercicio ${fiscalYear}`);
        return false;
      }

      // Map accounting data to financial plan accounts
      const accountsToUpsert = [];

      // Balance Sheet mapping
      const balanceMapping: Record<string, { code: string; name: string; type: string }> = {
        'intangible_assets': { code: '20', name: 'Inmovilizado Intangible', type: 'balance_asset' },
        'tangible_assets': { code: '21', name: 'Inmovilizado Material', type: 'balance_asset' },
        'real_estate_investments': { code: '22', name: 'Inversiones Inmobiliarias', type: 'balance_asset' },
        'long_term_financial_investments': { code: '24', name: 'Inversiones Financieras LP', type: 'balance_asset' },
        'inventory': { code: '30', name: 'Existencias', type: 'balance_asset' },
        'trade_receivables': { code: '43', name: 'Clientes', type: 'balance_asset' },
        'cash_equivalents': { code: '57', name: 'Tesorería', type: 'balance_asset' },
        'share_capital': { code: '10E', name: 'Capital Social', type: 'balance_equity' },
        'legal_reserve': { code: '112', name: 'Reserva Legal', type: 'balance_equity' },
        'voluntary_reserves': { code: '113', name: 'Reservas Voluntarias', type: 'balance_equity' },
        'current_year_result': { code: '129', name: 'Resultado del Ejercicio', type: 'balance_equity' },
        'long_term_debts': { code: '17', name: 'Deudas LP', type: 'balance_liability' },
        'trade_payables': { code: '40P', name: 'Proveedores', type: 'balance_liability' },
        'short_term_debts': { code: '52', name: 'Deudas CP', type: 'balance_liability' }
      };

      for (const [key, config] of Object.entries(balanceMapping)) {
        const value = yearData.balance_sheet[key];
        if (value !== undefined) {
          accountsToUpsert.push({
            plan_id: planId,
            account_code: config.code,
            account_name: config.name,
            account_type: config.type,
            year: fiscalYear,
            amount: value,
            source: 'synced'
          });
        }
      }

      // Income Statement mapping
      const incomeMapping: Record<string, { code: string; name: string; type: string }> = {
        'net_turnover': { code: '70', name: 'Importe Neto Cifra Negocios', type: 'income' },
        'other_operating_income': { code: '75', name: 'Otros Ingresos de Explotación', type: 'income' },
        'cost_of_sales': { code: '60', name: 'Aprovisionamientos', type: 'expense' },
        'personnel_expenses': { code: '64', name: 'Gastos de Personal', type: 'expense' },
        'depreciation': { code: '68', name: 'Amortizaciones', type: 'expense' },
        'other_operating_expenses': { code: '62', name: 'Otros Gastos de Explotación', type: 'expense' },
        'operating_result': { code: 'EBIT', name: 'Resultado de Explotación', type: 'income' },
        'financial_income': { code: '76', name: 'Ingresos Financieros', type: 'income' },
        'financial_expenses': { code: '66', name: 'Gastos Financieros', type: 'expense' }
      };

      for (const [key, config] of Object.entries(incomeMapping)) {
        const value = yearData.income_statement[key];
        if (value !== undefined) {
          accountsToUpsert.push({
            plan_id: planId,
            account_code: config.code,
            account_name: config.name,
            account_type: config.type,
            year: fiscalYear,
            amount: value,
            source: 'synced'
          });
        }
      }

      // Upsert all accounts
      const { error: upsertError } = await supabase
        .from('financial_plan_accounts')
        .upsert(accountsToUpsert, {
          onConflict: 'plan_id,account_code,year'
        });

      if (upsertError) throw upsertError;

      // Update plan sync status
      await supabase
        .from('financial_viability_plans')
        .update({
          synced_with_accounting: true,
          last_sync_at: new Date().toISOString(),
          sync_source: 'accounting_module'
        })
        .eq('id', planId);

      setSyncStatus(prev => ({
        ...prev,
        last_sync: new Date().toISOString()
      }));

      toast.success(`Datos del ejercicio ${fiscalYear} sincronizados correctamente`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error sincronizando datos';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountingData]);

  useEffect(() => {
    checkAccountingModuleStatus();
  }, [checkAccountingModuleStatus]);

  return {
    isLoading,
    error,
    syncStatus,
    accountingData,
    checkAccountingModuleStatus,
    fetchAccountingData,
    syncToFinancialPlan
  };
}
