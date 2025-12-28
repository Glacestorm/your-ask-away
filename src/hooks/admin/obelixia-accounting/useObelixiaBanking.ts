/**
 * useObelixiaBanking Hook
 * Gestión bancaria y conciliación para ObelixIA
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  iban: string | null;
  swift_bic: string | null;
  account_number: string | null;
  currency: string;
  chart_account_id: string | null;
  current_balance: number;
  last_reconciled_date: string | null;
  last_reconciled_balance: number | null;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date: string | null;
  amount: number;
  balance_after: number | null;
  description: string | null;
  reference: string | null;
  counterparty_name: string | null;
  counterparty_iban: string | null;
  transaction_type: 'credit' | 'debit';
  category: string | null;
  is_reconciled: boolean;
  reconciled_entry_id: string | null;
  reconciled_at: string | null;
  created_at: string;
}

export interface ReconciliationRule {
  id: string;
  rule_name: string;
  priority: number;
  match_field: 'description' | 'amount' | 'reference' | 'counterparty';
  match_type: 'exact' | 'contains' | 'regex' | 'range';
  match_value: string;
  target_account_id: string | null;
  target_category: string | null;
  auto_create_entry: boolean;
  is_active: boolean;
  matches_count: number;
}

// === HOOK ===
export function useObelixiaBanking() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [rules, setRules] = useState<ReconciliationRule[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // === FETCH BANK ACCOUNTS ===
  const fetchBankAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('obelixia_bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBankAccounts((data || []) as BankAccount[]);
      
      if (data && data.length > 0 && !selectedAccount) {
        setSelectedAccount(data[0] as BankAccount);
      }
      
      return data;
    } catch (err) {
      console.error('[useObelixiaBanking] fetchBankAccounts error:', err);
      toast.error('Error al cargar cuentas bancarias');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  // === FETCH TRANSACTIONS ===
  const fetchTransactions = useCallback(async (bankAccountId: string, options?: {
    onlyUnreconciled?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('obelixia_bank_transactions')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .order('transaction_date', { ascending: false });

      if (options?.onlyUnreconciled) {
        query = query.eq('is_reconciled', false);
      }
      if (options?.startDate) {
        query = query.gte('transaction_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('transaction_date', options.endDate);
      }

      const { data, error } = await query.limit(options?.limit || 200);

      if (error) throw error;
      setTransactions((data || []) as BankTransaction[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaBanking] fetchTransactions error:', err);
      toast.error('Error al cargar movimientos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH RULES ===
  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('obelixia_reconciliation_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority');

      if (error) throw error;
      setRules((data || []) as ReconciliationRule[]);
      return data;
    } catch (err) {
      console.error('[useObelixiaBanking] fetchRules error:', err);
      return null;
    }
  }, []);

  // === CREATE BANK ACCOUNT ===
  const createBankAccount = useCallback(async (accountData: { account_name: string; bank_name: string } & Partial<BankAccount>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('obelixia_bank_accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Cuenta bancaria creada');
      await fetchBankAccounts();
      return data as BankAccount;
    } catch (err) {
      console.error('[useObelixiaBanking] createBankAccount error:', err);
      toast.error('Error al crear cuenta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBankAccounts]);

  // === IMPORT TRANSACTIONS ===
  const importTransactions = useCallback(async (
    bankAccountId: string,
    txnList: Array<{
      transaction_date: string;
      amount: number;
      description: string;
      reference?: string;
      counterparty_name?: string;
    }>
  ) => {
    setIsLoading(true);
    try {
      const formattedTxns = txnList.map(txn => ({
        bank_account_id: bankAccountId,
        transaction_date: txn.transaction_date,
        amount: txn.amount,
        description: txn.description,
        reference: txn.reference,
        counterparty_name: txn.counterparty_name,
        transaction_type: txn.amount >= 0 ? 'credit' as const : 'debit' as const,
        is_reconciled: false,
      }));

      const { data, error } = await supabase
        .from('obelixia_bank_transactions')
        .insert(formattedTxns)
        .select();

      if (error) throw error;

      toast.success(`${data?.length || 0} movimientos importados`);
      await fetchTransactions(bankAccountId);
      return data;
    } catch (err) {
      console.error('[useObelixiaBanking] importTransactions error:', err);
      toast.error('Error al importar movimientos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions]);

  // === AUTO RECONCILE ===
  const autoReconcile = useCallback(async (bankAccountId: string) => {
    setIsReconciling(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-engine',
        {
          body: {
            action: 'auto_reconcile',
            params: { bank_account_id: bankAccountId }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        const result = data.data;
        toast.success(
          `Conciliación automática: ${result.reconciled_count} conciliados, ${result.unmatched_count} pendientes`
        );
        await fetchTransactions(bankAccountId);
        return result;
      }

      throw new Error(data?.error || 'Error en conciliación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(message);
      return null;
    } finally {
      setIsReconciling(false);
    }
  }, [fetchTransactions]);

  // === MANUAL RECONCILE ===
  const manualReconcile = useCallback(async (
    transactionId: string,
    journalEntryId: string,
    category?: string
  ) => {
    try {
      const { error } = await supabase
        .from('obelixia_bank_transactions')
        .update({
          is_reconciled: true,
          reconciled_entry_id: journalEntryId,
          reconciled_at: new Date().toISOString(),
          category,
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Movimiento conciliado');
      
      if (selectedAccount) {
        await fetchTransactions(selectedAccount.id);
      }
      
      return true;
    } catch (err) {
      console.error('[useObelixiaBanking] manualReconcile error:', err);
      toast.error('Error al conciliar');
      return false;
    }
  }, [selectedAccount, fetchTransactions]);

  // === CREATE RULE ===
  const createRule = useCallback(async (ruleData: { rule_name: string; match_field: string; match_type: string; match_value: string } & Partial<ReconciliationRule>) => {
    try {
      const { data, error } = await supabase
        .from('obelixia_reconciliation_rules')
        .insert([ruleData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Regla de conciliación creada');
      await fetchRules();
      return data as ReconciliationRule;
    } catch (err) {
      console.error('[useObelixiaBanking] createRule error:', err);
      toast.error('Error al crear regla');
      return null;
    }
  }, [fetchRules]);

  // === GET STATS ===
  const getStats = useCallback(() => {
    const unreconciledCount = transactions.filter(t => !t.is_reconciled).length;
    const unreconciledAmount = transactions
      .filter(t => !t.is_reconciled)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalCredits = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebits = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      unreconciledCount,
      unreconciledAmount,
      totalCredits,
      totalDebits,
      reconciledPercentage: transactions.length > 0
        ? ((transactions.length - unreconciledCount) / transactions.length) * 100
        : 100,
    };
  }, [transactions]);

  // === INITIAL LOAD ===
  useEffect(() => {
    fetchBankAccounts();
    fetchRules();
  }, [fetchBankAccounts, fetchRules]);

  // === LOAD TRANSACTIONS ON ACCOUNT CHANGE ===
  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions(selectedAccount.id);
    }
  }, [selectedAccount, fetchTransactions]);

  return {
    // State
    bankAccounts,
    transactions,
    rules,
    selectedAccount,
    isLoading,
    isReconciling,
    // Actions
    fetchBankAccounts,
    fetchTransactions,
    fetchRules,
    createBankAccount,
    importTransactions,
    autoReconcile,
    manualReconcile,
    createRule,
    setSelectedAccount,
    getStats,
  };
}

export default useObelixiaBanking;
