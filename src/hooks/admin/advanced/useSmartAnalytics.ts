/**
 * useSmartAnalytics
 * Analytics inteligentes con ML y predicciones avanzadas
 * Fase 12 - Advanced AI & Automation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface SmartMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  prediction?: {
    nextValue: number;
    confidence: number;
    horizon: string;
  };
  anomalyScore?: number;
  isAnomaly?: boolean;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast' | 'recommendation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  confidence: number;
  relatedMetrics: string[];
  suggestedActions?: string[];
  generatedAt: string;
}

export interface DataPattern {
  id: string;
  patternType: 'seasonal' | 'cyclical' | 'trend' | 'spike' | 'drop';
  description: string;
  startDate: string;
  endDate?: string;
  affectedMetrics: string[];
  magnitude: number;
  recurrence?: string;
}

export interface AnalyticsQuery {
  naturalLanguage: string;
  translatedQuery?: string;
  results?: unknown[];
  visualizationType?: 'table' | 'chart' | 'kpi' | 'map';
  executionTime?: number;
}

export interface AnalyticsContext {
  organizationId?: string;
  dateRange: {
    start: string;
    end: string;
  };
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  filters?: Record<string, unknown>;
  comparisonPeriod?: {
    start: string;
    end: string;
  };
}

// === HOOK ===
export function useSmartAnalytics() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<SmartMetric[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [patterns, setPatterns] = useState<DataPattern[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<AnalyticsContext | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // === INICIALIZAR ANALYTICS ===
  const initialize = useCallback(async (analyticsContext: AnalyticsContext) => {
    setIsLoading(true);
    setContext(analyticsContext);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'initialize',
          context: analyticsContext
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setMetrics(data.metrics || []);
        setInsights(data.insights || []);
        setPatterns(data.patterns || []);
        setLastRefresh(new Date());
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useSmartAnalytics] initialize error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CONSULTA EN LENGUAJE NATURAL ===
  const queryNaturalLanguage = useCallback(async (query: string): Promise<AnalyticsQuery | null> => {
    setIsLoading(true);

    try {
      const startTime = Date.now();
      
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'natural_language_query',
          query,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return {
          naturalLanguage: query,
          translatedQuery: data.translatedQuery,
          results: data.results,
          visualizationType: data.visualizationType,
          executionTime: Date.now() - startTime
        };
      }

      return null;
    } catch (err) {
      console.error('[useSmartAnalytics] queryNaturalLanguage error:', err);
      toast.error('Error al procesar consulta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // === DETECTAR ANOMALÍAS ===
  const detectAnomalies = useCallback(async (metricIds?: string[]): Promise<SmartMetric[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'detect_anomalies',
          metricIds,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.anomalies) {
        // Actualizar métricas con info de anomalías
        setMetrics(prev => prev.map(m => {
          const anomalyInfo = data.anomalies.find((a: SmartMetric) => a.id === m.id);
          return anomalyInfo ? { ...m, ...anomalyInfo } : m;
        }));

        return data.anomalies;
      }

      return [];
    } catch (err) {
      console.error('[useSmartAnalytics] detectAnomalies error:', err);
      return [];
    }
  }, [context]);

  // === GENERAR PREDICCIONES ===
  const generatePredictions = useCallback(async (
    metricIds: string[],
    horizon: 'day' | 'week' | 'month' | 'quarter'
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'generate_predictions',
          metricIds,
          horizon,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.predictions) {
        // Actualizar métricas con predicciones
        setMetrics(prev => prev.map(m => {
          const prediction = data.predictions.find((p: { metricId: string; prediction: SmartMetric['prediction'] }) => 
            p.metricId === m.id
          );
          return prediction ? { ...m, prediction: prediction.prediction } : m;
        }));

        return data.predictions;
      }

      return [];
    } catch (err) {
      console.error('[useSmartAnalytics] generatePredictions error:', err);
      toast.error('Error al generar predicciones');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // === DESCUBRIR PATRONES ===
  const discoverPatterns = useCallback(async (): Promise<DataPattern[]> => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'discover_patterns',
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.patterns) {
        setPatterns(data.patterns);
        return data.patterns;
      }

      return [];
    } catch (err) {
      console.error('[useSmartAnalytics] discoverPatterns error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // === CORRELACIONES ===
  const findCorrelations = useCallback(async (metricId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'find_correlations',
          metricId,
          context
        }
      });

      if (fnError) throw fnError;

      return data?.correlations || [];
    } catch (err) {
      console.error('[useSmartAnalytics] findCorrelations error:', err);
      return [];
    }
  }, [context]);

  // === GENERAR INSIGHTS ===
  const generateInsights = useCallback(async (): Promise<AnalyticsInsight[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'generate_insights',
          metrics,
          patterns,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.insights) {
        setInsights(data.insights);
        return data.insights;
      }

      return [];
    } catch (err) {
      console.error('[useSmartAnalytics] generateInsights error:', err);
      return [];
    }
  }, [metrics, patterns, context]);

  // === EXPORTAR ANÁLISIS ===
  const exportAnalysis = useCallback(async (format: 'pdf' | 'excel' | 'json') => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-analytics', {
        body: {
          action: 'export',
          format,
          metrics,
          insights,
          patterns,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('Análisis exportado');
      }
    } catch (err) {
      console.error('[useSmartAnalytics] exportAnalysis error:', err);
      toast.error('Error al exportar');
    }
  }, [metrics, insights, patterns, context]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs: number = 300000) => {
    stopAutoRefresh();
    
    if (context) {
      refreshIntervalRef.current = setInterval(() => {
        initialize(context);
      }, intervalMs);
    }
  }, [context, initialize]);

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
    metrics,
    insights,
    patterns,
    error,
    context,
    lastRefresh,
    // Acciones
    initialize,
    queryNaturalLanguage,
    detectAnomalies,
    generatePredictions,
    discoverPatterns,
    findCorrelations,
    generateInsights,
    exportAnalysis,
    startAutoRefresh,
    stopAutoRefresh
  };
}

export default useSmartAnalytics;
