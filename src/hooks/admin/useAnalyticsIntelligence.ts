import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Anomaly {
  id: string;
  metric_name: string;
  current_value: number;
  expected_value: number;
  deviation_percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  detected_at: string;
  pattern_type: 'spike' | 'drop' | 'trend_change' | 'seasonality_break' | 'outlier';
  possible_causes: string[];
  recommended_actions: string[];
  historical_context: {
    avg_7d: number;
    avg_30d: number;
    std_deviation: number;
  };
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'growth' | 'efficiency' | 'risk' | 'opportunity' | 'optimization';
  impact_level: 'low' | 'medium' | 'high' | 'transformational';
  confidence: number;
  data_points: Array<{ metric: string; value: string; trend: 'up' | 'down' | 'stable' }>;
  recommended_actions: Array<{ action: string; priority: number; estimated_impact: string }>;
  time_sensitivity: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface MetricForecast {
  metric_name: string;
  current_value: number;
  predictions: Array<{
    horizon: '7d' | '30d' | '90d' | '365d';
    scenarios: {
      optimistic: { value: number; probability: number };
      base: { value: number; probability: number };
      pessimistic: { value: number; probability: number };
    };
    confidence_interval: { lower: number; upper: number };
    trend_direction: 'up' | 'down' | 'stable';
  }>;
  influencing_factors: Array<{ factor: string; weight: number; direction: 'positive' | 'negative' }>;
  seasonality_detected: boolean;
  model_accuracy: number;
}

export interface DynamicDashboard {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'flow' | 'tabs' | 'sections';
  refresh_rate_seconds: number;
  widgets: Array<{
    id: string;
    type: 'metric_card' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'gauge' | 'table' | 'heatmap' | 'funnel' | 'kpi_tile';
    title: string;
    position: { row: number; col: number; width: number; height: number };
    data_source: string;
    config: Record<string, unknown>;
    interactivity: {
      drill_down: boolean;
      filters: string[];
      click_action: string | null;
    };
  }>;
  global_filters: Array<{
    name: string;
    type: 'date_range' | 'select' | 'multi_select';
    options: unknown[];
  }>;
  ai_features: {
    auto_insights: boolean;
    anomaly_highlighting: boolean;
    predictive_overlays: boolean;
    natural_language_query: boolean;
  };
}

export interface MetricCorrelation {
  metric_a: string;
  metric_b: string;
  correlation_coefficient: number;
  relationship_type: 'positive' | 'negative' | 'none';
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  lag_days: number;
  potential_causality: {
    direction: 'a_causes_b' | 'b_causes_a' | 'mutual' | 'unknown';
    confidence: number;
    explanation: string;
  };
  business_interpretation: string;
}

export interface Pattern {
  id: string;
  name: string;
  type: 'cyclical' | 'seasonal' | 'trend' | 'behavioral' | 'event_driven';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
  strength: number;
  predictability: number;
  affected_metrics: string[];
  triggers: string[];
  expected_next_occurrence: string;
  business_impact: string;
  recommended_actions: string[];
}

export interface RealTimeState {
  timestamp: string;
  overall_health: number;
  active_alerts: number;
  metrics_summary: Array<{
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    status: 'normal' | 'warning' | 'critical';
  }>;
}

export interface CohortData {
  id: string;
  name: string;
  definition: string;
  size: number;
  created_period: string;
  metrics: {
    retention_rate: number;
    lifetime_value: number;
    engagement_score: number;
    churn_rate: number;
    growth_rate: number;
  };
  behavior_patterns: string[];
  prediction: {
    expected_ltv_30d: number;
    churn_probability: number;
    upsell_potential: number;
  };
}

export interface StrategicRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'revenue' | 'efficiency' | 'cost_reduction' | 'risk_mitigation' | 'growth';
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: {
    type: 'revenue' | 'cost' | 'efficiency' | 'satisfaction';
    estimated_value: number;
    confidence: number;
    timeframe: string;
  };
  effort: {
    level: 'low' | 'medium' | 'high';
    resources_required: string[];
    estimated_duration: string;
  };
  roi_score: number;
  implementation_steps: Array<{ step: number; action: string; owner: string; deadline: string }>;
}

// === HOOK ===
export function useAnalyticsIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [forecasts, setForecasts] = useState<MetricForecast[]>([]);
  const [dashboard, setDashboard] = useState<DynamicDashboard | null>(null);
  const [correlations, setCorrelations] = useState<MetricCorrelation[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [realTimeState, setRealTimeState] = useState<RealTimeState | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === DETECT ANOMALIES ===
  const detectAnomalies = useCallback(async (metricsData: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'detect_anomalies', context: metricsData }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.anomalies) {
        setAnomalies(data.data.anomalies);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] detectAnomalies error:', err);
      setError(err instanceof Error ? err.message : 'Error detecting anomalies');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE INSIGHTS ===
  const generateInsights = useCallback(async (context: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'generate_insights', context }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.insights) {
        setInsights(data.data.insights);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] generateInsights error:', err);
      setError(err instanceof Error ? err.message : 'Error generating insights');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FORECAST METRICS ===
  const forecastMetrics = useCallback(async (metrics: string[], horizons: string[]) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'forecast_metrics', params: { metrics, horizons } }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.forecasts) {
        setForecasts(data.data.forecasts);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] forecastMetrics error:', err);
      setError(err instanceof Error ? err.message : 'Error forecasting metrics');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE DYNAMIC DASHBOARD ===
  const createDynamicDashboard = useCallback(async (
    objectives: string[],
    userRole: string,
    preferredMetrics?: string[]
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { 
          action: 'create_dynamic_dashboard', 
          params: { objectives, userRole, preferredMetrics } 
        }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.dashboard) {
        setDashboard(data.data.dashboard);
        toast.success('Dashboard dinámico generado');
        return data.data.dashboard;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] createDynamicDashboard error:', err);
      toast.error('Error al crear dashboard');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CORRELATE METRICS ===
  const correlateMetrics = useCallback(async (metricsToCorrelate: string[]) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'correlate_metrics', context: { metrics: metricsToCorrelate } }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.correlations) {
        setCorrelations(data.data.correlations);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] correlateMetrics error:', err);
      setError(err instanceof Error ? err.message : 'Error correlating metrics');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === PATTERN RECOGNITION ===
  const recognizePatterns = useCallback(async (dataContext: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'pattern_recognition', context: dataContext }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.patterns) {
        setPatterns(data.data.patterns);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] recognizePatterns error:', err);
      setError(err instanceof Error ? err.message : 'Error recognizing patterns');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === REAL-TIME ANALYSIS ===
  const analyzeRealTime = useCallback(async (currentMetrics: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'real_time_analysis', context: currentMetrics }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.current_state) {
        setRealTimeState(data.data.current_state);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] analyzeRealTime error:', err);
      return null;
    }
  }, []);

  // === COHORT ANALYSIS ===
  const analyzeCohorts = useCallback(async (cohortConfig: {
    segmentation_criteria: string[];
    time_period: string;
    metrics_to_track: string[];
  }) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'cohort_analysis', params: cohortConfig }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.cohorts) {
        setCohorts(data.data.cohorts);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] analyzeCohorts error:', err);
      toast.error('Error en análisis de cohortes');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET RECOMMENDATIONS ===
  const getRecommendations = useCallback(async (businessContext: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'get_recommendations', context: businessContext }
      });

      if (fnError) throw fnError;
      if (data?.success && data?.data?.recommendations) {
        setRecommendations(data.data.recommendations);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] getRecommendations error:', err);
      toast.error('Error al obtener recomendaciones');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === BENCHMARK PERFORMANCE ===
  const benchmarkPerformance = useCallback(async (metricsToCompare: string[], industry?: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analytics-intelligence', {
        body: { action: 'benchmark_performance', params: { metrics: metricsToCompare, industry } }
      });

      if (fnError) throw fnError;
      return data?.success ? data.data : null;
    } catch (err) {
      console.error('[useAnalyticsIntelligence] benchmarkPerformance error:', err);
      toast.error('Error en benchmarking');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === AUTO REFRESH ===
  const startRealTimeMonitoring = useCallback((metrics: Record<string, unknown>, intervalMs = 30000) => {
    stopRealTimeMonitoring();
    analyzeRealTime(metrics);
    autoRefreshInterval.current = setInterval(() => analyzeRealTime(metrics), intervalMs);
  }, [analyzeRealTime]);

  const stopRealTimeMonitoring = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopRealTimeMonitoring();
  }, [stopRealTimeMonitoring]);

  return {
    // State
    isLoading,
    error,
    anomalies,
    insights,
    forecasts,
    dashboard,
    correlations,
    patterns,
    realTimeState,
    cohorts,
    recommendations,
    // Actions
    detectAnomalies,
    generateInsights,
    forecastMetrics,
    createDynamicDashboard,
    correlateMetrics,
    recognizePatterns,
    analyzeRealTime,
    analyzeCohorts,
    getRecommendations,
    benchmarkPerformance,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
  };
}

export default useAnalyticsIntelligence;
