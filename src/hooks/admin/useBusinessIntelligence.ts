/**
 * Hook: useBusinessIntelligence
 * Sistema de Inteligencia de Negocio con Analytics Avanzado y Predicciones IA
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  targetProgress?: number;
  unit: string;
  category: string;
  forecast?: number;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: string;
  suggestedActions: string[];
  relatedKPIs: string[];
  timestamp: string;
}

export interface Prediction {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  horizon: string;
  factors: PredictionFactor[];
  scenarios: PredictionScenario[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface PredictionScenario {
  name: string;
  probability: number;
  value: number;
  description: string;
}

export interface DataCorrelation {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
  description: string;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'executive' | 'operational' | 'financial' | 'custom';
  metrics: string[];
  schedule?: string;
  recipients?: string[];
  format: 'pdf' | 'excel' | 'dashboard';
}

export interface BIContext {
  organizationId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  metrics?: string[];
  includeInsights?: boolean;
  includePredictions?: boolean;
}

// === HOOK ===
export function useBusinessIntelligence() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [correlations, setCorrelations] = useState<DataCorrelation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GET ANALYTICS DATA ===
  const getAnalyticsData = useCallback(async (context: BIContext = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'get_analytics',
            context: {
              timeRange: '30d',
              includeInsights: true,
              includePredictions: true,
              ...context
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setKpis(fnData.data.kpis || []);
        setInsights(fnData.data.insights || []);
        setPredictions(fnData.data.predictions || []);
        setCorrelations(fnData.data.correlations || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error al obtener datos analíticos');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useBusinessIntelligence] getAnalyticsData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE AI INSIGHTS ===
  const generateInsights = useCallback(async (context: BIContext = {}) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'generate_insights',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setInsights(fnData.data.insights || []);
        toast.success('Insights generados correctamente');
        return fnData.data.insights;
      }

      return [];
    } catch (err) {
      console.error('[useBusinessIntelligence] generateInsights error:', err);
      toast.error('Error al generar insights');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET PREDICTIONS ===
  const getPredictions = useCallback(async (metrics: string[], horizon: string = '30d') => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'get_predictions',
            params: { metrics, horizon }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setPredictions(fnData.data.predictions || []);
        return fnData.data.predictions;
      }

      return [];
    } catch (err) {
      console.error('[useBusinessIntelligence] getPredictions error:', err);
      return [];
    }
  }, []);

  // === ANALYZE CORRELATIONS ===
  const analyzeCorrelations = useCallback(async (metrics: string[]) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'analyze_correlations',
            params: { metrics }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setCorrelations(fnData.data.correlations || []);
        return fnData.data.correlations;
      }

      return [];
    } catch (err) {
      console.error('[useBusinessIntelligence] analyzeCorrelations error:', err);
      return [];
    }
  }, []);

  // === ASK AI QUESTION ===
  const askQuestion = useCallback(async (question: string, context?: Record<string, unknown>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'ask_question',
            params: { question, context }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessIntelligence] askQuestion error:', err);
      toast.error('Error al procesar pregunta');
      return null;
    }
  }, []);

  // === GENERATE REPORT ===
  const generateReport = useCallback(async (config: Partial<ReportConfig>) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'generate_report',
            params: config
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Reporte generado correctamente');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessIntelligence] generateReport error:', err);
      toast.error('Error al generar reporte');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EXPORT DATA ===
  const exportData = useCallback(async (
    dataType: 'kpis' | 'insights' | 'predictions' | 'all',
    format: 'csv' | 'json' | 'excel' = 'csv'
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'export_data',
            params: { dataType, format }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Datos exportados');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessIntelligence] exportData error:', err);
      toast.error('Error al exportar datos');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: BIContext = {}, intervalMs = 300000) => {
    stopAutoRefresh();
    getAnalyticsData(context);
    autoRefreshInterval.current = setInterval(() => {
      getAnalyticsData(context);
    }, intervalMs);
  }, [getAnalyticsData]);

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
    insights,
    predictions,
    correlations,
    error,
    lastRefresh,
    // Acciones
    getAnalyticsData,
    generateInsights,
    getPredictions,
    analyzeCorrelations,
    askQuestion,
    generateReport,
    exportData,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useBusinessIntelligence;
