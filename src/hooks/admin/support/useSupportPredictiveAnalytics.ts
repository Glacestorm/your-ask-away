import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface LoadPrediction {
  period: string;
  expectedSessions: number;
  confidence: number;
  peakHours: string[];
  reasoning: string;
}

export interface WeekForecast {
  day: string;
  predicted: number;
  range: [number, number];
}

export interface SeasonalPatterns {
  highDemandDays: string[];
  lowDemandDays: string[];
  peakHours: string[];
}

export interface StaffingRecommendation {
  minimumTechnicians: number;
  optimalTechnicians: number;
  reason: string;
}

export interface TrendInsight {
  metric: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  significance: 'high' | 'medium' | 'low';
  insight: string;
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'pattern_break' | 'outlier';
  metric: string;
  severity: 'critical' | 'warning' | 'info';
  value: number;
  expectedValue: number;
  deviation: number;
  timestamp: string;
  description: string;
  possibleCauses: string[];
  recommendedActions: string[];
}

export interface HealthMetrics {
  healthScore: number;
  metrics: {
    activeSessions: number;
    actionsLastHour: number;
    highRiskRatio: number;
    successRate: number;
    avgResponseTimeMinutes: number;
    activeAlerts: number;
    criticalAlerts: number;
  };
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface RealtimeStatus {
  activeSessions: number;
  avgActiveDuration: number;
  actionsLast30Min: number;
  highRiskActionsLast30Min: number;
  activeAlerts: number;
  criticalAlerts: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  sessions: Array<{
    id: string;
    deviceName: string;
    companyName: string;
    technicianName: string;
    startedAt: string;
    durationMinutes: number;
  }>;
  recentActions: Array<{
    id: string;
    type: string;
    riskLevel: string;
    status: string;
    createdAt: string;
  }>;
  timestamp: string;
}

// === HOOK ===
export function useSupportPredictiveAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadPredictions, setLoadPredictions] = useState<LoadPrediction[]>([]);
  const [weekForecast, setWeekForecast] = useState<WeekForecast[]>([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState<SeasonalPatterns | null>(null);
  const [staffingRecommendation, setStaffingRecommendation] = useState<StaffingRecommendation | null>(null);
  const [trendInsights, setTrendInsights] = useState<TrendInsight[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === PREDICT LOAD ===
  const predictLoad = useCallback(async (context?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'support-predictive-analytics',
        {
          body: {
            action: 'predict_load',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setLoadPredictions(data.data.predictions || []);
        setWeekForecast(data.data.weekForecast || []);
        setSeasonalPatterns(data.data.seasonalPatterns || null);
        setStaffingRecommendation(data.data.staffingRecommendation || null);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error('Invalid response from predictive analytics');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error predicting load';
      setError(message);
      console.error('[useSupportPredictiveAnalytics] predictLoad error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ANALYZE TRENDS ===
  const analyzeTrends = useCallback(async (context?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'support-predictive-analytics',
        {
          body: {
            action: 'analyze_trends',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setTrendInsights(data.data.keyInsights || []);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error('Invalid response from trend analysis');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing trends';
      setError(message);
      console.error('[useSupportPredictiveAnalytics] analyzeTrends error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === DETECT ANOMALIES ===
  const detectAnomalies = useCallback(async (context?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'support-predictive-analytics',
        {
          body: {
            action: 'detect_anomalies',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setAnomalies(data.data.anomalies || []);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error('Invalid response from anomaly detection');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error detecting anomalies';
      setError(message);
      console.error('[useSupportPredictiveAnalytics] detectAnomalies error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET REALTIME STATUS ===
  const getRealtimeStatus = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'support-realtime-monitor',
        {
          body: { action: 'get_status' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setRealtimeStatus(data.data);
        setLastRefresh(new Date());
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useSupportPredictiveAnalytics] getRealtimeStatus error:', err);
      return null;
    }
  }, []);

  // === GET HEALTH METRICS ===
  const getHealthMetrics = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'support-realtime-monitor',
        {
          body: { action: 'get_health_metrics' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setHealthMetrics(data.data);
        setLastRefresh(new Date());
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useSupportPredictiveAnalytics] getHealthMetrics error:', err);
      return null;
    }
  }, []);

  // === ANALYZE ACTIVE SESSIONS ===
  const analyzeActiveSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'support-realtime-monitor',
        {
          body: { action: 'analyze_active' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useSupportPredictiveAnalytics] analyzeActiveSessions error:', err);
      toast.error('Error al analizar sesiones activas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE ALERTS ===
  const generateAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'support-realtime-monitor',
        {
          body: { action: 'generate_alerts' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useSupportPredictiveAnalytics] generateAlerts error:', err);
      toast.error('Error al generar alertas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === REFRESH ALL ===
  const refreshAll = useCallback(async () => {
    await Promise.all([
      getRealtimeStatus(),
      getHealthMetrics()
    ]);
  }, [getRealtimeStatus, getHealthMetrics]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    refreshAll();
    autoRefreshInterval.current = setInterval(() => {
      refreshAll();
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

  return {
    // State
    isLoading,
    error,
    lastRefresh,
    loadPredictions,
    weekForecast,
    seasonalPatterns,
    staffingRecommendation,
    trendInsights,
    anomalies,
    healthMetrics,
    realtimeStatus,
    // Actions
    predictLoad,
    analyzeTrends,
    detectAnomalies,
    getRealtimeStatus,
    getHealthMetrics,
    analyzeActiveSessions,
    generateAlerts,
    refreshAll,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useSupportPredictiveAnalytics;
