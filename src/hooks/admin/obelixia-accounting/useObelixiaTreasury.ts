/**
 * useObelixiaTreasury - Fase 8: Intelligent Cash Flow Management & Treasury
 * Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CashFlowForecast {
  id: string;
  period: string;
  periodLabel: string;
  expectedInflows: number;
  expectedOutflows: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface LiquidityPosition {
  id: string;
  accountName: string;
  accountType: 'bank' | 'cash' | 'investment' | 'credit_line';
  currentBalance: number;
  availableBalance: number;
  currency: string;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface PaymentOptimization {
  id: string;
  vendorName: string;
  invoiceRef: string;
  amount: number;
  dueDate: string;
  discountAvailable: number;
  discountDeadline: string;
  recommendedPayDate: string;
  savingsIfOptimized: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface CashFlowAlert {
  id: string;
  alertType: 'shortage' | 'surplus' | 'timing' | 'covenant' | 'opportunity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  affectedPeriod: string;
  projectedImpact: number;
  suggestedActions: string[];
  createdAt: string;
  isResolved: boolean;
}

export interface WorkingCapitalMetrics {
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  daysReceivable: number;
  daysPayable: number;
  daysInventory: number;
  cashConversionCycle: number;
  workingCapital: number;
  workingCapitalTrend: 'improving' | 'stable' | 'deteriorating';
  recommendations: string[];
}

export interface TreasuryContext {
  organizationId?: string;
  dateRange?: { start: string; end: string };
  currencies?: string[];
  includeProjections?: boolean;
}

// === HOOK ===
export function useObelixiaTreasury() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [forecasts, setForecasts] = useState<CashFlowForecast[]>([]);
  const [liquidityPositions, setLiquidityPositions] = useState<LiquidityPosition[]>([]);
  const [paymentOptimizations, setPaymentOptimizations] = useState<PaymentOptimization[]>([]);
  const [alerts, setAlerts] = useState<CashFlowAlert[]>([]);
  const [workingCapital, setWorkingCapital] = useState<WorkingCapitalMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs for auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH CASH FLOW FORECAST ===
  const fetchCashFlowForecast = useCallback(async (
    context?: TreasuryContext,
    horizonMonths: number = 3
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-treasury',
        {
          body: {
            action: 'forecast_cash_flow',
            context,
            params: { horizonMonths }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setForecasts(fnData.data.forecasts || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from treasury function');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching cash flow forecast';
      setError(message);
      console.error('[useObelixiaTreasury] fetchCashFlowForecast error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH LIQUIDITY POSITIONS ===
  const fetchLiquidityPositions = useCallback(async (context?: TreasuryContext) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-treasury',
        {
          body: {
            action: 'get_liquidity_positions',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setLiquidityPositions(fnData.data.positions || []);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTreasury] fetchLiquidityPositions error:', err);
      toast.error('Error al obtener posiciones de liquidez');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET PAYMENT OPTIMIZATIONS ===
  const getPaymentOptimizations = useCallback(async (context?: TreasuryContext) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-treasury',
        {
          body: {
            action: 'optimize_payments',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setPaymentOptimizations(fnData.data.optimizations || []);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTreasury] getPaymentOptimizations error:', err);
      toast.error('Error al obtener optimizaciones de pago');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH CASH FLOW ALERTS ===
  const fetchAlerts = useCallback(async (context?: TreasuryContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-treasury',
        {
          body: {
            action: 'get_alerts',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setAlerts(fnData.data.alerts || []);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTreasury] fetchAlerts error:', err);
      return null;
    }
  }, []);

  // === GET WORKING CAPITAL METRICS ===
  const getWorkingCapitalMetrics = useCallback(async (context?: TreasuryContext) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-treasury',
        {
          body: {
            action: 'analyze_working_capital',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setWorkingCapital(fnData.data.metrics || null);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTreasury] getWorkingCapitalMetrics error:', err);
      toast.error('Error al analizar capital de trabajo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RESOLVE ALERT ===
  const resolveAlert = useCallback(async (alertId: string, resolution?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-treasury',
        {
          body: {
            action: 'resolve_alert',
            params: { alertId, resolution }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAlerts(prev => prev.map(a => 
          a.id === alertId ? { ...a, isResolved: true } : a
        ));
        toast.success('Alerta resuelta');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useObelixiaTreasury] resolveAlert error:', err);
      toast.error('Error al resolver alerta');
      return false;
    }
  }, []);

  // === SIMULATE SCENARIO ===
  const simulateScenario = useCallback(async (
    scenarioType: 'optimistic' | 'pessimistic' | 'custom',
    parameters?: Record<string, number>
  ) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-treasury',
        {
          body: {
            action: 'simulate_scenario',
            params: { scenarioType, parameters }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        toast.success('Simulación completada');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTreasury] simulateScenario error:', err);
      toast.error('Error en simulación de escenario');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === REFRESH ALL DATA ===
  const refreshAll = useCallback(async (context?: TreasuryContext) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCashFlowForecast(context),
        fetchLiquidityPositions(context),
        getPaymentOptimizations(context),
        fetchAlerts(context),
        getWorkingCapitalMetrics(context)
      ]);
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [fetchCashFlowForecast, fetchLiquidityPositions, getPaymentOptimizations, fetchAlerts, getWorkingCapitalMetrics]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: TreasuryContext, intervalMs = 120000) => {
    stopAutoRefresh();
    refreshAll(context);
    autoRefreshInterval.current = setInterval(() => {
      refreshAll(context);
    }, intervalMs);
  }, [refreshAll]);

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

  // === RETURN ===
  return {
    // State
    isLoading,
    forecasts,
    liquidityPositions,
    paymentOptimizations,
    alerts,
    workingCapital,
    error,
    lastRefresh,
    // Actions
    fetchCashFlowForecast,
    fetchLiquidityPositions,
    getPaymentOptimizations,
    fetchAlerts,
    getWorkingCapitalMetrics,
    resolveAlert,
    simulateScenario,
    refreshAll,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaTreasury;
