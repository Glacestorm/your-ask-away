/**
 * useERPCashFlow - Hook para gestión de flujo de caja
 * Fase 3: Cash Flow Management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CashFlowItem {
  id: string;
  date: string;
  type: 'inflow' | 'outflow';
  category: string;
  description: string;
  amount: number;
  account_id?: string;
  account_name?: string;
  is_recurring?: boolean;
  recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'pending' | 'confirmed' | 'projected';
  created_at: string;
}

export interface CashFlowProjection {
  date: string;
  projected_inflows: number;
  projected_outflows: number;
  net_cash_flow: number;
  cumulative_balance: number;
  confidence_level: number;
}

export interface LiquidityMetrics {
  current_cash: number;
  days_cash_available: number;
  cash_burn_rate: number;
  cash_runway_days: number;
  liquidity_ratio: number;
  quick_ratio: number;
  cash_conversion_cycle: number;
  working_capital: number;
  free_cash_flow: number;
}

export interface CashFlowAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'liquidity' | 'projection' | 'variance' | 'pattern';
  title: string;
  message: string;
  metric_value?: number;
  threshold_value?: number;
  date?: string;
  recommendations: string[];
  created_at: string;
  is_dismissed: boolean;
}

export interface CashFlowSummary {
  period: string;
  opening_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
}

export interface CashFlowCategory {
  category: string;
  type: 'inflow' | 'outflow';
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

export interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact_score: number;
  confidence: number;
  suggested_actions: string[];
  data_points?: Record<string, number>;
  created_at: string;
}

export interface CashFlowContext {
  companyId: string;
  fiscalYear: number;
  startDate: string;
  endDate: string;
  currency: string;
}

// === HOOK ===
export function useERPCashFlow() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [cashFlowItems, setCashFlowItems] = useState<CashFlowItem[]>([]);
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [liquidityMetrics, setLiquidityMetrics] = useState<LiquidityMetrics | null>(null);
  const [alerts, setAlerts] = useState<CashFlowAlert[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CashFlowCategory[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === CALCULAR MÉTRICAS DE LIQUIDEZ ===
  const calculateLiquidityMetrics = useCallback((
    currentCash: number,
    dailyBurnRate: number,
    currentAssets: number,
    currentLiabilities: number,
    inventory: number
  ): LiquidityMetrics => {
    const daysAvailable = dailyBurnRate > 0 ? Math.round(currentCash / dailyBurnRate) : 999;
    const runwayDays = dailyBurnRate > 0 ? Math.round(currentCash / dailyBurnRate) : 999;
    const liquidityRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;

    return {
      current_cash: currentCash,
      days_cash_available: daysAvailable,
      cash_burn_rate: dailyBurnRate,
      cash_runway_days: runwayDays,
      liquidity_ratio: liquidityRatio,
      quick_ratio: quickRatio,
      cash_conversion_cycle: 45, // TODO: Calcular basado en datos reales
      working_capital: currentAssets - currentLiabilities,
      free_cash_flow: currentCash - (dailyBurnRate * 30),
    };
  }, []);

  // === GENERAR PROYECCIONES ===
  const generateProjections = useCallback(async (
    context: CashFlowContext,
    horizonDays: number = 90
  ): Promise<CashFlowProjection[]> => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'erp-cash-flow-analysis',
        {
          body: {
            action: 'generate_projections',
            context,
            params: { horizon_days: horizonDays }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.projections) {
        setProjections(fnData.projections);
        return fnData.projections;
      }

      return [];
    } catch (err) {
      console.error('[useERPCashFlow] generateProjections error:', err);
      return [];
    }
  }, []);

  // === ANALIZAR LIQUIDEZ ===
  const analyzeLiquidity = useCallback(async (context: CashFlowContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'erp-cash-flow-analysis',
        {
          body: {
            action: 'analyze_liquidity',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        if (fnData.metrics) setLiquidityMetrics(fnData.metrics);
        if (fnData.alerts) setAlerts(fnData.alerts);
        return fnData;
      }

      return null;
    } catch (err) {
      console.error('[useERPCashFlow] analyzeLiquidity error:', err);
      return null;
    }
  }, []);

  // === GENERAR ALERTAS ===
  const generateAlerts = useCallback((
    metrics: LiquidityMetrics,
    projections: CashFlowProjection[]
  ): CashFlowAlert[] => {
    const newAlerts: CashFlowAlert[] = [];
    const now = new Date().toISOString();

    // Alerta de días de efectivo
    if (metrics.days_cash_available < 30) {
      newAlerts.push({
        id: `alert-${Date.now()}-1`,
        type: metrics.days_cash_available < 14 ? 'critical' : 'warning',
        category: 'liquidity',
        title: 'Efectivo disponible bajo',
        message: `Solo ${metrics.days_cash_available} días de efectivo disponible a ritmo actual`,
        metric_value: metrics.days_cash_available,
        threshold_value: 30,
        recommendations: [
          'Acelerar cobros pendientes',
          'Negociar extensión de pagos con proveedores',
          'Revisar líneas de crédito disponibles'
        ],
        created_at: now,
        is_dismissed: false
      });
    }

    // Alerta de ratio de liquidez
    if (metrics.liquidity_ratio < 1.2) {
      newAlerts.push({
        id: `alert-${Date.now()}-2`,
        type: metrics.liquidity_ratio < 1 ? 'critical' : 'warning',
        category: 'liquidity',
        title: 'Ratio de liquidez bajo',
        message: `Ratio de liquidez: ${metrics.liquidity_ratio.toFixed(2)} (recomendado > 1.5)`,
        metric_value: metrics.liquidity_ratio,
        threshold_value: 1.2,
        recommendations: [
          'Reducir deudas a corto plazo',
          'Aumentar activos circulantes',
          'Convertir activos no productivos'
        ],
        created_at: now,
        is_dismissed: false
      });
    }

    // Alerta de proyecciones negativas
    const negativeProjections = projections.filter(p => p.cumulative_balance < 0);
    if (negativeProjections.length > 0) {
      const firstNegative = negativeProjections[0];
      newAlerts.push({
        id: `alert-${Date.now()}-3`,
        type: 'critical',
        category: 'projection',
        title: 'Proyección de saldo negativo',
        message: `Se proyecta saldo negativo para ${firstNegative.date}`,
        metric_value: firstNegative.cumulative_balance,
        date: firstNegative.date,
        recommendations: [
          'Revisar calendario de pagos',
          'Asegurar cobros antes de esa fecha',
          'Considerar financiamiento puente'
        ],
        created_at: now,
        is_dismissed: false
      });
    }

    // Alerta de burn rate alto
    if (metrics.cash_burn_rate > metrics.current_cash * 0.1) {
      newAlerts.push({
        id: `alert-${Date.now()}-4`,
        type: 'warning',
        category: 'pattern',
        title: 'Burn rate elevado',
        message: 'La tasa de consumo de efectivo supera el 10% del disponible',
        metric_value: metrics.cash_burn_rate,
        recommendations: [
          'Revisar gastos operativos',
          'Identificar costos reducibles',
          'Optimizar procesos de compras'
        ],
        created_at: now,
        is_dismissed: false
      });
    }

    return newAlerts;
  }, []);

  // === FETCH DATA COMPLETO ===
  const fetchCashFlowData = useCallback(async (context: CashFlowContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'erp-cash-flow-analysis',
        {
          body: {
            action: 'get_full_analysis',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        if (fnData.items) setCashFlowItems(fnData.items);
        if (fnData.projections) setProjections(fnData.projections);
        if (fnData.metrics) setLiquidityMetrics(fnData.metrics);
        if (fnData.summary) setSummary(fnData.summary);
        if (fnData.categories) setCategoryBreakdown(fnData.categories);
        if (fnData.insights) setAIInsights(fnData.insights);
        
        // Generar alertas basadas en métricas
        if (fnData.metrics && fnData.projections) {
          const generatedAlerts = generateAlerts(fnData.metrics, fnData.projections);
          setAlerts(generatedAlerts);
        }

        setLastRefresh(new Date());
        return fnData;
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useERPCashFlow] fetchCashFlowData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [generateAlerts]);

  // === OBTENER INSIGHTS DE IA ===
  const getAIInsights = useCallback(async (context: CashFlowContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'erp-cash-flow-analysis',
        {
          body: {
            action: 'get_ai_insights',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.insights) {
        setAIInsights(fnData.insights);
        return fnData.insights;
      }

      return [];
    } catch (err) {
      console.error('[useERPCashFlow] getAIInsights error:', err);
      return [];
    }
  }, []);

  // === ESCENARIOS WHAT-IF ===
  const runWhatIfScenario = useCallback(async (
    context: CashFlowContext,
    scenario: {
      name: string;
      inflow_change_percent?: number;
      outflow_change_percent?: number;
      one_time_inflow?: number;
      one_time_outflow?: number;
      delay_payments_days?: number;
    }
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'erp-cash-flow-analysis',
        {
          body: {
            action: 'what_if_scenario',
            context,
            params: { scenario }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        return fnData.scenario_result;
      }

      return null;
    } catch (err) {
      console.error('[useERPCashFlow] runWhatIfScenario error:', err);
      toast.error('Error al ejecutar escenario');
      return null;
    }
  }, []);

  // === DESCARTAR ALERTA ===
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(a => a.id === alertId ? { ...a, is_dismissed: true } : a)
    );
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: CashFlowContext, intervalMs = 120000) => {
    stopAutoRefresh();
    fetchCashFlowData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchCashFlowData(context);
    }, intervalMs);
  }, [fetchCashFlowData]);

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
    // Estado
    isLoading,
    cashFlowItems,
    projections,
    liquidityMetrics,
    alerts,
    summary,
    categoryBreakdown,
    aiInsights,
    error,
    lastRefresh,
    // Acciones
    fetchCashFlowData,
    generateProjections,
    analyzeLiquidity,
    getAIInsights,
    runWhatIfScenario,
    dismissAlert,
    startAutoRefresh,
    stopAutoRefresh,
    // Utilidades
    calculateLiquidityMetrics,
    generateAlerts,
  };
}

export default useERPCashFlow;
