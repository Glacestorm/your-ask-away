/**
 * useObelixiaFinancialForecasting
 * Hook para Análisis Predictivo y Pronóstico Financiero
 * Fase 4: Predictive Analytics & Financial Forecasting
 * 
 * Funcionalidades:
 * - Pronóstico de flujo de caja
 * - Predicción de ingresos/gastos
 * - Análisis de tendencias
 * - Detección de anomalías financieras
 * - Escenarios what-if
 * - Alertas predictivas
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === TIPOS E INTERFACES ===

export type ForecastPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ScenarioType = 'optimistic' | 'realistic' | 'pessimistic' | 'custom';

export interface CashFlowForecast {
  periodStart: string;
  periodEnd: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
  confidenceLevel: number;
  factors: ForecastFactor[];
  seasonalAdjustment: number;
  trend: TrendDirection;
}

export interface ForecastFactor {
  name: string;
  impact: number; // Positive or negative percentage impact
  weight: number;
  description: string;
}

export interface RevenuePrediction {
  category: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  trend: TrendDirection;
  historicalData: DataPoint[];
  projectedData: DataPoint[];
}

export interface DataPoint {
  date: string;
  value: number;
  isProjected?: boolean;
}

export interface ExpensePrediction {
  category: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  trend: TrendDirection;
  recurringAmount: number;
  variableAmount: number;
}

export interface TrendAnalysis {
  metric: string;
  direction: TrendDirection;
  strength: number; // 0-100
  velocity: number; // Rate of change
  projectedChange: number;
  breakpoints: BreakPoint[];
  seasonality: SeasonalPattern | null;
}

export interface BreakPoint {
  date: string;
  type: 'increase' | 'decrease' | 'anomaly';
  magnitude: number;
  possibleCause: string;
}

export interface SeasonalPattern {
  periodicity: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  peakPeriods: string[];
  lowPeriods: string[];
  averageVariation: number;
}

export interface FinancialAnomaly {
  id: string;
  detectedAt: string;
  type: 'unusual_transaction' | 'pattern_break' | 'threshold_exceeded' | 'missing_expected';
  severity: AlertSeverity;
  description: string;
  affectedAccount: string;
  amount: number;
  expectedAmount?: number;
  deviation: number;
  recommendation: string;
  isResolved: boolean;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  parameters: ScenarioParameter[];
  results: ScenarioResult | null;
  createdAt: string;
}

export interface ScenarioParameter {
  name: string;
  baseValue: number;
  adjustedValue: number;
  changePercent: number;
  category: 'income' | 'expense' | 'investment' | 'other';
}

export interface ScenarioResult {
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  cashFlowImpact: number;
  breakEvenDate?: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface PredictiveAlert {
  id: string;
  type: 'cash_shortage' | 'unusual_spending' | 'revenue_decline' | 'opportunity' | 'compliance';
  severity: AlertSeverity;
  title: string;
  description: string;
  predictedDate: string;
  probability: number;
  potentialImpact: number;
  suggestedActions: string[];
  isAcknowledged: boolean;
  createdAt: string;
}

export interface ForecastMetrics {
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  averageDeviation: number;
  lastUpdated: string;
  modelVersion: string;
}

export interface ForecastingConfig {
  defaultPeriod: ForecastPeriod;
  confidenceThreshold: number;
  anomalyDetectionEnabled: boolean;
  alertsEnabled: boolean;
  scenarioCount: number;
  historicalDataMonths: number;
}

// === HOOK PRINCIPAL ===

export function useObelixiaFinancialForecasting() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ForecastingConfig>({
    defaultPeriod: 'monthly',
    confidenceThreshold: 75,
    anomalyDetectionEnabled: true,
    alertsEnabled: true,
    scenarioCount: 3,
    historicalDataMonths: 12
  });

  // Datos
  const [cashFlowForecasts, setCashFlowForecasts] = useState<CashFlowForecast[]>([]);
  const [revenuePredictions, setRevenuePredictions] = useState<RevenuePrediction[]>([]);
  const [expensePredictions, setExpensePredictions] = useState<ExpensePrediction[]>([]);
  const [trendAnalyses, setTrendAnalyses] = useState<TrendAnalysis[]>([]);
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [metrics, setMetrics] = useState<ForecastMetrics | null>(null);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // === CONFIGURACIÓN ===

  const updateConfig = useCallback((updates: Partial<ForecastingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    toast.success('Configuración actualizada');
  }, []);

  // === PRONÓSTICO DE FLUJO DE CAJA ===

  const generateCashFlowForecast = useCallback(async (
    period: ForecastPeriod = 'monthly',
    periodsAhead: number = 6
  ): Promise<CashFlowForecast[]> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'generate_cashflow_forecast',
          params: {
            period,
            periodsAhead,
            historicalMonths: config.historicalDataMonths,
            confidenceThreshold: config.confidenceThreshold
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.forecasts) {
        setCashFlowForecasts(data.forecasts);
        return data.forecasts;
      }

      throw new Error('Respuesta inválida');
    } catch (error) {
      console.error('[Forecasting] Cash flow error:', error);
      toast.error('Error al generar pronóstico de flujo de caja');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // === PREDICCIÓN DE INGRESOS ===

  const predictRevenue = useCallback(async (
    categories?: string[],
    period: ForecastPeriod = 'monthly'
  ): Promise<RevenuePrediction[]> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'predict_revenue',
          params: {
            categories,
            period,
            historicalMonths: config.historicalDataMonths
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.predictions) {
        setRevenuePredictions(data.predictions);
        return data.predictions;
      }

      throw new Error('Respuesta inválida');
    } catch (error) {
      console.error('[Forecasting] Revenue prediction error:', error);
      toast.error('Error al predecir ingresos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // === PREDICCIÓN DE GASTOS ===

  const predictExpenses = useCallback(async (
    categories?: string[],
    period: ForecastPeriod = 'monthly'
  ): Promise<ExpensePrediction[]> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'predict_expenses',
          params: {
            categories,
            period,
            historicalMonths: config.historicalDataMonths
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.predictions) {
        setExpensePredictions(data.predictions);
        return data.predictions;
      }

      throw new Error('Respuesta inválida');
    } catch (error) {
      console.error('[Forecasting] Expense prediction error:', error);
      toast.error('Error al predecir gastos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // === ANÁLISIS DE TENDENCIAS ===

  const analyzeTrends = useCallback(async (
    metricsToAnalyze: string[] = ['revenue', 'expenses', 'profit', 'cashflow']
  ): Promise<TrendAnalysis[]> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'analyze_trends',
          params: {
            metrics: metricsToAnalyze,
            historicalMonths: config.historicalDataMonths
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.trends) {
        setTrendAnalyses(data.trends);
        return data.trends;
      }

      throw new Error('Respuesta inválida');
    } catch (error) {
      console.error('[Forecasting] Trend analysis error:', error);
      toast.error('Error al analizar tendencias');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // === DETECCIÓN DE ANOMALÍAS ===

  const detectAnomalies = useCallback(async (): Promise<FinancialAnomaly[]> => {
    if (!config.anomalyDetectionEnabled) {
      toast.info('Detección de anomalías desactivada');
      return [];
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'detect_anomalies',
          params: {
            sensitivityLevel: 'medium',
            lookbackDays: 90
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.anomalies) {
        setAnomalies(data.anomalies);
        
        const criticalCount = data.anomalies.filter((a: FinancialAnomaly) => a.severity === 'critical').length;
        if (criticalCount > 0) {
          toast.warning(`${criticalCount} anomalía(s) crítica(s) detectada(s)`);
        }
        
        return data.anomalies;
      }

      throw new Error('Respuesta inválida');
    } catch (error) {
      console.error('[Forecasting] Anomaly detection error:', error);
      toast.error('Error al detectar anomalías');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const resolveAnomaly = useCallback(async (anomalyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'resolve_anomaly',
          params: { anomalyId }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAnomalies(prev => prev.map(a => 
          a.id === anomalyId ? { ...a, isResolved: true } : a
        ));
        toast.success('Anomalía marcada como resuelta');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Forecasting] Resolve anomaly error:', error);
      toast.error('Error al resolver anomalía');
      return false;
    }
  }, []);

  // === ESCENARIOS WHAT-IF ===

  const createScenario = useCallback(async (
    name: string,
    type: ScenarioType,
    parameters: ScenarioParameter[],
    description?: string
  ): Promise<WhatIfScenario | null> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'create_scenario',
          params: {
            name,
            type,
            parameters,
            description,
            baselineMonths: config.historicalDataMonths
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.scenario) {
        setScenarios(prev => [...prev, data.scenario]);
        toast.success(`Escenario "${name}" creado`);
        return data.scenario;
      }

      throw new Error('Respuesta inválida');
    } catch (error) {
      console.error('[Forecasting] Create scenario error:', error);
      toast.error('Error al crear escenario');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const runScenario = useCallback(async (scenarioId: string): Promise<ScenarioResult | null> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'run_scenario',
          params: { scenarioId }
        }
      });

      if (error) throw error;

      if (data?.success && data?.result) {
        setScenarios(prev => prev.map(s => 
          s.id === scenarioId ? { ...s, results: data.result } : s
        ));
        return data.result;
      }

      throw new Error('Respuesta inválida');
    } catch (error) {
      console.error('[Forecasting] Run scenario error:', error);
      toast.error('Error al ejecutar escenario');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteScenario = useCallback(async (scenarioId: string): Promise<boolean> => {
    try {
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      toast.success('Escenario eliminado');
      return true;
    } catch (error) {
      console.error('[Forecasting] Delete scenario error:', error);
      toast.error('Error al eliminar escenario');
      return false;
    }
  }, []);

  // === ALERTAS PREDICTIVAS ===

  const fetchAlerts = useCallback(async (): Promise<PredictiveAlert[]> => {
    if (!config.alertsEnabled) return [];

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: {
          action: 'get_predictive_alerts',
          params: {
            includeAcknowledged: false,
            minProbability: 0.5
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.alerts) {
        setAlerts(data.alerts);
        return data.alerts;
      }

      return [];
    } catch (error) {
      console.error('[Forecasting] Fetch alerts error:', error);
      return [];
    }
  }, [config]);

  const acknowledgeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, isAcknowledged: true } : a
      ));
      toast.success('Alerta reconocida');
      return true;
    } catch (error) {
      console.error('[Forecasting] Acknowledge alert error:', error);
      return false;
    }
  }, []);

  // === MÉTRICAS DEL MODELO ===

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('obelixia-financial-forecasting', {
        body: { action: 'get_forecast_metrics' }
      });

      if (error) throw error;

      if (data?.success && data?.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('[Forecasting] Fetch metrics error:', error);
    }
  }, []);

  // === GENERACIÓN COMPLETA ===

  const generateFullForecast = useCallback(async () => {
    setIsLoading(true);
    toast.info('Generando análisis predictivo completo...');

    try {
      await Promise.all([
        generateCashFlowForecast(config.defaultPeriod, 6),
        predictRevenue(undefined, config.defaultPeriod),
        predictExpenses(undefined, config.defaultPeriod),
        analyzeTrends(),
        detectAnomalies(),
        fetchAlerts(),
        fetchMetrics()
      ]);

      toast.success('Análisis predictivo completado');
    } catch (error) {
      console.error('[Forecasting] Full forecast error:', error);
      toast.error('Error en análisis predictivo');
    } finally {
      setIsLoading(false);
    }
  }, [config, generateCashFlowForecast, predictRevenue, predictExpenses, analyzeTrends, detectAnomalies, fetchAlerts, fetchMetrics]);

  // === AUTO-REFRESH ===

  const startAutoRefresh = useCallback((intervalMinutes: number = 30) => {
    stopAutoRefresh();
    refreshIntervalRef.current = setInterval(() => {
      fetchAlerts();
      detectAnomalies();
    }, intervalMinutes * 60 * 1000);
  }, [fetchAlerts, detectAnomalies]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
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
    config,
    
    // Datos
    cashFlowForecasts,
    revenuePredictions,
    expensePredictions,
    trendAnalyses,
    anomalies,
    scenarios,
    alerts,
    metrics,
    
    // Configuración
    updateConfig,
    
    // Pronósticos
    generateCashFlowForecast,
    predictRevenue,
    predictExpenses,
    generateFullForecast,
    
    // Análisis
    analyzeTrends,
    detectAnomalies,
    resolveAnomaly,
    
    // Escenarios
    createScenario,
    runScenario,
    deleteScenario,
    
    // Alertas
    fetchAlerts,
    acknowledgeAlert,
    
    // Métricas
    fetchMetrics,
    
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh
  };
}

export default useObelixiaFinancialForecasting;
