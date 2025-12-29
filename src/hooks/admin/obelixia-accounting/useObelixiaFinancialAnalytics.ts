/**
 * useObelixiaFinancialAnalytics - Fase 10: Advanced Financial Analytics & Executive Dashboard
 * Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ExecutiveKPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  target: number;
  targetProgress: number;
  unit: string;
  category: 'profitability' | 'liquidity' | 'efficiency' | 'growth' | 'risk';
  sparklineData: number[];
  benchmark?: number;
  benchmarkDiff?: number;
}

export interface BenchmarkAnalysis {
  id: string;
  metric: string;
  companyValue: number;
  industryAverage: number;
  industryTop25: number;
  industryMedian: number;
  percentile: number;
  gap: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StrategicInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'opportunity' | 'risk' | 'trend' | 'action';
  confidence: number;
  potentialValue?: number;
  timeframe: string;
  actions: string[];
  dataPoints: Array<{
    metric: string;
    value: number;
    context: string;
  }>;
}

export interface FinancialHealth {
  overallScore: number;
  previousScore: number;
  trend: 'improving' | 'declining' | 'stable';
  dimensions: Array<{
    name: string;
    score: number;
    weight: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    factors: string[];
  }>;
  riskFactors: Array<{
    factor: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  strengths: string[];
  weaknesses: string[];
}

export interface PredictiveMetric {
  id: string;
  metric: string;
  currentValue: number;
  predictions: Array<{
    period: string;
    value: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }>;
  drivers: Array<{
    factor: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
  scenarios: Array<{
    name: string;
    probability: number;
    outcome: number;
  }>;
}

export interface ExecutiveReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  sections: Array<{
    title: string;
    content: string;
    charts?: string[];
    highlights?: string[];
  }>;
  keyTakeaways: string[];
  recommendations: string[];
  format: 'pdf' | 'html' | 'excel';
}

export interface FinancialAnalyticsContext {
  companyId?: string;
  fiscalYear?: number;
  industry?: string;
  companySize?: string;
  region?: string;
  comparePeriod?: 'yoy' | 'mom' | 'qoq';
}

// === HOOK ===
export function useObelixiaFinancialAnalytics() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [kpis, setKpis] = useState<ExecutiveKPI[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkAnalysis[]>([]);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [predictions, setPredictions] = useState<PredictiveMetric[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH EXECUTIVE KPIs ===
  const fetchExecutiveKPIs = useCallback(async (context?: FinancialAnalyticsContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-analytics',
        {
          body: {
            action: 'get_executive_kpis',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.kpis) {
        setKpis(fnData.data.kpis);
        setLastRefresh(new Date());
        return fnData.data.kpis;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaFinancialAnalytics] fetchExecutiveKPIs error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ANALYZE BENCHMARKS ===
  const analyzeBenchmarks = useCallback(async (context?: FinancialAnalyticsContext) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-analytics',
        {
          body: {
            action: 'analyze_benchmarks',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.benchmarks) {
        setBenchmarks(fnData.data.benchmarks);
        return fnData.data.benchmarks;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaFinancialAnalytics] analyzeBenchmarks error:', err);
      toast.error('Error al analizar benchmarks');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET STRATEGIC INSIGHTS ===
  const getStrategicInsights = useCallback(async (context?: FinancialAnalyticsContext) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-analytics',
        {
          body: {
            action: 'get_strategic_insights',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.insights) {
        setInsights(fnData.data.insights);
        return fnData.data.insights;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaFinancialAnalytics] getStrategicInsights error:', err);
      toast.error('Error al obtener insights estratégicos');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ASSESS FINANCIAL HEALTH ===
  const assessFinancialHealth = useCallback(async (context?: FinancialAnalyticsContext) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-analytics',
        {
          body: {
            action: 'assess_financial_health',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.health) {
        setHealth(fnData.data.health);
        return fnData.data.health;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaFinancialAnalytics] assessFinancialHealth error:', err);
      toast.error('Error al evaluar salud financiera');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET PREDICTIVE METRICS ===
  const getPredictiveMetrics = useCallback(async (
    metrics: string[],
    context?: FinancialAnalyticsContext
  ) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-analytics',
        {
          body: {
            action: 'get_predictive_metrics',
            params: { metrics },
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.predictions) {
        setPredictions(fnData.data.predictions);
        return fnData.data.predictions;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaFinancialAnalytics] getPredictiveMetrics error:', err);
      toast.error('Error al obtener métricas predictivas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE EXECUTIVE REPORT ===
  const generateExecutiveReport = useCallback(async (
    reportType: 'monthly' | 'quarterly' | 'annual' | 'custom',
    format: 'pdf' | 'html' | 'excel',
    context?: FinancialAnalyticsContext
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-analytics',
        {
          body: {
            action: 'generate_executive_report',
            params: { reportType, format },
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.report) {
        toast.success('Informe ejecutivo generado');
        return fnData.data.report as ExecutiveReport;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaFinancialAnalytics] generateExecutiveReport error:', err);
      toast.error('Error al generar informe');
      return null;
    }
  }, []);

  // === ASK AI ANALYST ===
  const askAIAnalyst = useCallback(async (
    question: string,
    context?: FinancialAnalyticsContext
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-analytics',
        {
          body: {
            action: 'ask_ai_analyst',
            params: { question },
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data?.response) {
        return fnData.data.response as {
          answer: string;
          confidence: number;
          sources: string[];
          relatedMetrics: string[];
          suggestedActions: string[];
        };
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaFinancialAnalytics] askAIAnalyst error:', err);
      toast.error('Error al consultar analista IA');
      return null;
    }
  }, []);

  // === LOAD ALL DASHBOARD DATA ===
  const loadDashboard = useCallback(async (context?: FinancialAnalyticsContext) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchExecutiveKPIs(context),
        analyzeBenchmarks(context),
        getStrategicInsights(context),
        assessFinancialHealth(context)
      ]);
      toast.success('Dashboard ejecutivo actualizado');
    } catch (err) {
      console.error('[useObelixiaFinancialAnalytics] loadDashboard error:', err);
      toast.error('Error al cargar dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [fetchExecutiveKPIs, analyzeBenchmarks, getStrategicInsights, assessFinancialHealth]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: FinancialAnalyticsContext, intervalMs = 300000) => {
    stopAutoRefresh();
    loadDashboard(context);
    autoRefreshInterval.current = setInterval(() => {
      loadDashboard(context);
    }, intervalMs);
  }, [loadDashboard]);

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
    kpis,
    benchmarks,
    insights,
    health,
    predictions,
    error,
    lastRefresh,
    // Acciones
    fetchExecutiveKPIs,
    analyzeBenchmarks,
    getStrategicInsights,
    assessFinancialHealth,
    getPredictiveMetrics,
    generateExecutiveReport,
    askAIAnalyst,
    loadDashboard,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaFinancialAnalytics;
