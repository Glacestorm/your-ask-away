/**
 * useERPAutoReconciliation - Hook para conciliación automática IA
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TransactionMatch {
  id: string;
  bank_transaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    reference?: string;
  };
  accounting_entry: {
    id: string;
    date: string;
    description: string;
    amount: number;
    account_code: string;
  };
  confidence: number;
  match_type: 'exact' | 'fuzzy' | 'partial' | 'suggested';
  differences?: {
    amount_diff?: number;
    date_diff_days?: number;
  };
}

export interface Discrepancy {
  id: string;
  type: 'missing_bank' | 'missing_accounting' | 'amount_mismatch' | 'date_mismatch';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggested_action: string;
  related_transactions: string[];
  amount?: number;
}

export interface ReconciliationResult {
  period: { start: string; end: string };
  account_id: string;
  status: 'balanced' | 'discrepancies' | 'pending';
  summary: {
    total_bank: number;
    total_accounting: number;
    difference: number;
    matched_count: number;
    unmatched_count: number;
  };
  matches: TransactionMatch[];
  discrepancies: Discrepancy[];
  suggestions: Array<{
    action: string;
    description: string;
    impact: number;
  }>;
}

export function useERPAutoReconciliation() {
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<TransactionMatch[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matchTransactions = useCallback(async (
    companyId: string,
    bankTransactions: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      reference?: string;
    }>,
    accountingEntries: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      account_code: string;
    }>,
    tolerance: { amount: number; days: number } = { amount: 0.01, days: 3 }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-auto-reconciliation',
        {
          body: {
            action: 'match_transactions',
            company_id: companyId,
            bank_transactions: bankTransactions,
            accounting_entries: accountingEntries,
            tolerance
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setMatches(data.data.matches || []);
        return data.data;
      }

      throw new Error(data?.error || 'Error en matching');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en conciliación automática');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const identifyDiscrepancies = useCallback(async (
    companyId: string,
    accountId: string,
    period: { start: string; end: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-auto-reconciliation',
        {
          body: {
            action: 'identify_discrepancies',
            company_id: companyId,
            account_id: accountId,
            period
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setDiscrepancies(data.data.discrepancies || []);
        return data.data;
      }

      throw new Error(data?.error || 'Error identificando discrepancias');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error identificando discrepancias');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const suggestAdjustments = useCallback(async (
    companyId: string,
    discrepancyIds: string[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-auto-reconciliation',
        {
          body: {
            action: 'suggest_adjustments',
            company_id: companyId,
            discrepancy_ids: discrepancyIds
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      throw new Error(data?.error || 'Error sugiriendo ajustes');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en sugerencias de ajuste');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reconcileAccount = useCallback(async (
    companyId: string,
    accountId: string,
    period: { start: string; end: string },
    autoApproveThreshold: number = 0.95
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-auto-reconciliation',
        {
          body: {
            action: 'reconcile_account',
            company_id: companyId,
            account_id: accountId,
            period,
            auto_approve_threshold: autoApproveThreshold
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setResult(data.data);
        const status = data.data.status;
        if (status === 'balanced') {
          toast.success('Cuenta conciliada correctamente');
        } else if (status === 'discrepancies') {
          toast.warning(`Conciliación con ${data.data.discrepancies?.length || 0} discrepancias`);
        }
        return data.data;
      }

      throw new Error(data?.error || 'Error en conciliación');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error conciliando cuenta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveMatch = useCallback(async (
    matchId: string,
    approved: boolean
  ) => {
    setMatches(prev => prev.map(m => 
      m.id === matchId 
        ? { ...m, match_type: approved ? 'exact' : 'suggested' } 
        : m
    ));
    toast.success(approved ? 'Match aprobado' : 'Match rechazado');
  }, []);

  return {
    isLoading,
    matches,
    discrepancies,
    result,
    error,
    matchTransactions,
    identifyDiscrepancies,
    suggestAdjustments,
    reconcileAccount,
    approveMatch
  };
}

export default useERPAutoReconciliation;
