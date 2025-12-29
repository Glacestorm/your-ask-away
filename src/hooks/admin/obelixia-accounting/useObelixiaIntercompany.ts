/**
 * useObelixiaIntercompany Hook
 * Phase 11D: Intercompany Operations - Consolidation, Eliminations, Transfer Pricing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CompanyEntity {
  id: string;
  name: string;
  code: string;
  type: 'parent' | 'subsidiary' | 'affiliate' | 'branch';
  country: string;
  currency: string;
  ownershipPercent?: number;
  consolidationMethod: 'full' | 'equity' | 'proportional';
  isActive: boolean;
}

export interface IntercompanyTransaction {
  id: string;
  fromEntityId: string;
  fromEntityName: string;
  toEntityId: string;
  toEntityName: string;
  transactionType: 'sale' | 'purchase' | 'loan' | 'dividend' | 'service' | 'royalty';
  amount: number;
  currency: string;
  date: string;
  status: 'pending' | 'matched' | 'eliminated' | 'reconciled';
  eliminationStatus?: 'pending' | 'partial' | 'complete';
  armLengthPrice?: number;
  transferPricingMethod?: string;
}

export interface ConsolidationReport {
  id: string;
  period: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  entities: string[];
  consolidatedBalanceSheet?: Record<string, number>;
  consolidatedIncomeStatement?: Record<string, number>;
  eliminations?: EliminationEntry[];
  adjustments?: AdjustmentEntry[];
}

export interface EliminationEntry {
  id: string;
  type: 'intercompany_receivable' | 'intercompany_payable' | 'intercompany_revenue' | 'intercompany_expense' | 'investment';
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
}

export interface AdjustmentEntry {
  id: string;
  type: 'currency_translation' | 'minority_interest' | 'goodwill' | 'fair_value';
  account: string;
  amount: number;
  description: string;
}

export interface IntercompanyContext {
  groupId: string;
  fiscalYear: number;
  period?: string;
}

// === HOOK ===
export function useObelixiaIntercompany() {
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState<CompanyEntity[]>([]);
  const [transactions, setTransactions] = useState<IntercompanyTransaction[]>([]);
  const [consolidationReports, setConsolidationReports] = useState<ConsolidationReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH DATA ===
  const fetchData = useCallback(async (context?: IntercompanyContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-intercompany',
        {
          body: {
            action: 'get_data',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setEntities(fnData.data.entities || []);
        setTransactions(fnData.data.transactions || []);
        setConsolidationReports(fnData.data.reports || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaIntercompany] fetchData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === MATCH INTERCOMPANY TRANSACTIONS ===
  const matchTransactions = useCallback(async (context: IntercompanyContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-intercompany',
        {
          body: {
            action: 'match_transactions',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`${fnData.data?.matchedCount || 0} transacciones emparejadas`);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaIntercompany] matchTransactions error:', err);
      toast.error('Error al emparejar transacciones');
      return null;
    }
  }, []);

  // === GENERATE ELIMINATIONS ===
  const generateEliminations = useCallback(async (context: IntercompanyContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-intercompany',
        {
          body: {
            action: 'generate_eliminations',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Eliminaciones generadas');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaIntercompany] generateEliminations error:', err);
      toast.error('Error al generar eliminaciones');
      return null;
    }
  }, []);

  // === RUN CONSOLIDATION ===
  const runConsolidation = useCallback(async (context: IntercompanyContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-intercompany',
        {
          body: {
            action: 'consolidate',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Consolidación completada');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaIntercompany] runConsolidation error:', err);
      toast.error('Error en consolidación');
      return null;
    }
  }, []);

  // === ANALYZE TRANSFER PRICING ===
  const analyzeTransferPricing = useCallback(async (transactionId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-intercompany',
        {
          body: {
            action: 'transfer_pricing_analysis',
            transactionId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Análisis de precios de transferencia completado');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaIntercompany] analyzeTransferPricing error:', err);
      toast.error('Error en análisis');
      return null;
    }
  }, []);

  // === GENERATE GROUP REPORT ===
  const generateGroupReport = useCallback(async (context: IntercompanyContext, reportType: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-intercompany',
        {
          body: {
            action: 'generate_group_report',
            context,
            reportType
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Reporte de grupo generado');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaIntercompany] generateGroupReport error:', err);
      toast.error('Error al generar reporte');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: IntercompanyContext, intervalMs = 60000) => {
    stopAutoRefresh();
    fetchData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchData(context);
    }, intervalMs);
  }, [fetchData]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    entities,
    transactions,
    consolidationReports,
    error,
    lastRefresh,
    fetchData,
    matchTransactions,
    generateEliminations,
    runConsolidation,
    analyzeTransferPricing,
    generateGroupReport,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaIntercompany;
