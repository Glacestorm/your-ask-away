/**
 * useObelixiaBudgeting Hook
 * Fase 13: Budgeting & Planning
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Budget {
  id: string;
  name: string;
  type: 'operational' | 'capital' | 'project' | 'departmental' | 'consolidated';
  period: string;
  status: 'draft' | 'approved' | 'active' | 'closed';
  totalBudget: number;
  consumed: number;
  remaining: number;
  variance: number;
  variancePercentage: number;
  categories: BudgetCategory[];
  lastUpdated: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  subcategories: BudgetCategory[];
}

export interface VarianceAnalysis {
  period: string;
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number;
  status: 'favorable' | 'unfavorable' | 'on_track';
  byCategory: Array<{
    category: string;
    budget: number;
    actual: number;
    variance: number;
    variancePercentage: number;
    status: string;
    explanation: string;
    trend: 'improving' | 'worsening' | 'stable';
  }>;
  topVariances: unknown[];
  rootCauses: string[];
}

export interface BudgetScenario {
  id: string;
  name: string;
  type: 'optimistic' | 'baseline' | 'pessimistic' | 'stress';
  probability: number;
  assumptions: Record<string, unknown>;
  projections: {
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  };
  impacts: unknown[];
  risks: unknown[];
  mitigations: unknown[];
}

export interface BudgetingContext {
  companyId: string;
  fiscalYear?: string;
  department?: string;
}

export function useObelixiaBudgeting() {
  const [isLoading, setIsLoading] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchBudgets = useCallback(async (context?: BudgetingContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-budgeting', {
        body: { action: 'get_budgets', context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setBudgets(data.data.budgets || []);
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaBudgeting] fetchBudgets error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBudget = useCallback(async (budgetData: Partial<Budget>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-budgeting', {
        body: { action: 'create_budget', params: budgetData }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Presupuesto creado');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaBudgeting] createBudget error:', err);
      toast.error('Error al crear presupuesto');
      return null;
    }
  }, []);

  const analyzeVariance = useCallback(async (budgetId: string, period: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-budgeting', {
        body: { action: 'analyze_variance', params: { budgetId, period } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data as { varianceAnalysis: VarianceAnalysis; recommendations: unknown[]; forecast: unknown };
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaBudgeting] analyzeVariance error:', err);
      toast.error('Error en análisis de variaciones');
      return null;
    }
  }, []);

  const forecastScenario = useCallback(async (scenarioParams: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-budgeting', {
        body: { action: 'forecast_scenario', params: scenarioParams }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setScenarios(data.data.scenarios || []);
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaBudgeting] forecastScenario error:', err);
      toast.error('Error en modelado de escenarios');
      return null;
    }
  }, []);

  const optimizeAllocation = useCallback(async (budgetId: string, constraints?: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-budgeting', {
        body: { action: 'optimize_allocation', params: { budgetId, constraints } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Optimización completada');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaBudgeting] optimizeAllocation error:', err);
      toast.error('Error en optimización');
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((context: BudgetingContext, intervalMs = 120000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchBudgets(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchBudgets(context);
    }, intervalMs);
  }, [fetchBudgets]);

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
    budgets,
    scenarios,
    error,
    fetchBudgets,
    createBudget,
    analyzeVariance,
    forecastScenario,
    optimizeAllocation,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaBudgeting;
