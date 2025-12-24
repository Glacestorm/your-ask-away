import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { useState, useCallback } from 'react';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

export interface FeatureUsage {
  id: string;
  company_id?: string;
  user_id?: string;
  feature_key: string;
  product_key?: string;
  usage_count?: number;
  first_used_at?: string;
  last_used_at?: string;
  session_duration_seconds?: number;
  metadata?: Record<string, unknown>;
}

export interface TimeToValueMetric {
  id: string;
  company_id?: string;
  metric_type: string;
  target_days?: number;
  actual_days?: number;
  achieved_at?: string;
  started_at?: string;
  value_indicator?: string;
  is_achieved?: boolean;
  prediction_confidence?: number;
  predicted_days?: number;
  updated_at?: string;
  created_at?: string;
}

export interface LowUsageAlert {
  id: string;
  company_id?: string;
  alert_type: string;
  days_since_last_use?: number;
  product_key?: string;
  feature_key?: string;
  last_usage_at?: string;
  created_at?: string;
  resolved_at?: string;
  resolution_action?: string;
  severity?: string;
  auto_action_taken?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  assigned_to?: string;
  is_active?: boolean;
  message?: string;
  recommended_action?: string;
  updated_at?: string;
}

export interface AdoptionScore {
  id: string;
  company_id?: string;
  overall_score?: number;
  activation_score?: number;
  engagement_score?: number;
  depth_score?: number;
  breadth_score?: number;
  stickiness_score?: number;
  time_to_value_score?: number;
  trend?: string;
  trend_percentage?: number;
  risk_level?: string;
  recommendations?: Array<{
    type: string;
    message: string;
    priority: number;
    action_url?: string;
  }>;
  score_breakdown?: Record<string, number>;
  last_calculated_at?: string;
}

export function useAdoptionTracking(companyId?: string) {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoadingState = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isRetrying = status === 'retrying';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Fetch feature usage for a company
  const { data: featureUsage, isLoading: loadingUsage } = useQuery({
    queryKey: ['feature-usage', companyId],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        let query = supabase
          .from('feature_usage_tracking')
          .select('*')
          .order('last_used_at', { ascending: false });

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error: fetchError } = await query.limit(100);
        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        
        collectTelemetry({
          hookName: 'useAdoptionTracking',
          operationName: 'fetchFeatureUsage',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as FeatureUsage[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        
        collectTelemetry({
          hookName: 'useAdoptionTracking',
          operationName: 'fetchFeatureUsage',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
        });
        
        throw err;
      }
    },
  });

  // Fetch time to value metrics
  const { data: timeToValueMetrics, isLoading: loadingTTV } = useQuery({
    queryKey: ['time-to-value', companyId],
    queryFn: async () => {
      let query = supabase
        .from('time_to_value_metrics')
        .select('*')
        .order('started_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimeToValueMetric[];
    },
  });

  // Fetch low usage alerts
  const { data: lowUsageAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['low-usage-alerts', companyId],
    queryFn: async () => {
      let query = supabase
        .from('low_usage_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('alert_sent_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LowUsageAlert[];
    },
  });

  // Fetch adoption score
  const { data: adoptionScore, isLoading: loadingScore } = useQuery({
    queryKey: ['adoption-score', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('adoption_scores')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        recommendations: (data.recommendations as AdoptionScore['recommendations']) || [],
        score_breakdown: (data.score_breakdown as Record<string, number>) || {},
      } as AdoptionScore;
    },
    enabled: !!companyId,
  });

  // Track feature usage
  const trackFeature = useMutation({
    mutationFn: async ({
      companyId,
      userId,
      featureKey,
      productKey,
      sessionDuration,
      metadata,
    }: {
      companyId: string;
      userId?: string;
      featureKey: string;
      productKey?: string;
      sessionDuration?: number;
      metadata?: Record<string, unknown>;
    }) => {
      // Check if tracking exists
      const { data: existing } = await supabase
        .from('feature_usage_tracking')
        .select('id, usage_count')
        .eq('company_id', companyId)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('feature_usage_tracking')
          .update({
            usage_count: (existing.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
            session_duration_seconds: sessionDuration,
            metadata: metadata as unknown as Json,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('feature_usage_tracking')
          .insert({
            company_id: companyId,
            user_id: userId,
            feature_key: featureKey,
            product_key: productKey,
            usage_count: 1,
            first_used_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
            session_duration_seconds: sessionDuration,
            metadata: metadata as unknown as Json,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-usage'] });
    },
  });

  // Record time to value achievement
  const recordTimeToValue = useMutation({
    mutationFn: async ({
      companyId,
      metricType,
      targetDays,
      valueIndicator,
    }: {
      companyId: string;
      metricType: string;
      targetDays?: number;
      valueIndicator?: string;
    }) => {
      const startDate = new Date();
      const { data, error } = await supabase
        .from('time_to_value_metrics')
        .insert({
          company_id: companyId,
          metric_type: metricType,
          target_days: targetDays,
          started_at: startDate.toISOString(),
          value_indicator: valueIndicator,
          is_achieved: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-to-value'] });
      toast.success('Milestone de valor registrado');
    },
  });

  // Achieve a time to value milestone
  const achieveMilestone = useMutation({
    mutationFn: async ({
      metricId,
      actualDays,
      valueRealized,
    }: {
      metricId: string;
      actualDays: number;
      valueRealized?: number;
    }) => {
      // Calculate benchmark percentile (simplified)
      const benchmarkPercentile = actualDays <= 7 ? 95 : actualDays <= 14 ? 80 : actualDays <= 30 ? 60 : 40;

      const { data, error } = await supabase
        .from('time_to_value_metrics')
        .update({
          actual_days: actualDays,
          achieved_at: new Date().toISOString(),
          is_achieved: true,
          value_realized: valueRealized,
          benchmark_percentile: benchmarkPercentile,
        })
        .eq('id', metricId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-to-value'] });
      toast.success('🎯 ¡Milestone alcanzado!');
    },
  });

  // Resolve a low usage alert
  const resolveAlert = useMutation({
    mutationFn: async ({
      alertId,
      resolutionAction,
    }: {
      alertId: string;
      resolutionAction: string;
    }) => {
      const { data, error } = await supabase
        .from('low_usage_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_action: resolutionAction,
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-usage-alerts'] });
      toast.success('Alerta resuelta');
    },
  });

  // Predict time to value using edge function
  const predictTimeToValue = useMutation({
    mutationFn: async (targetCompanyId: string) => {
      const { data, error } = await supabase.functions.invoke('predict-time-to-value', {
        body: { companyId: targetCompanyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-to-value'] });
      toast.success(`Predicción TTV: ${data.predicted_days} días`);
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error en predicción: ${kbError.message}`);
    },
  });

  // Calculate adoption metrics
  const getAdoptionSummary = () => {
    if (!featureUsage) return null;

    const totalUsage = featureUsage.reduce((sum, f) => sum + (f.usage_count || 0), 0);
    const uniqueFeatures = new Set(featureUsage.map(f => f.feature_key)).size;
    const avgSessionDuration = featureUsage.length > 0
      ? featureUsage.reduce((sum, f) => sum + (f.session_duration_seconds || 0), 0) / featureUsage.length
      : 0;

    const now = new Date();
    const last7Days = featureUsage.filter(f => {
      if (!f.last_used_at) return false;
      const usedAt = new Date(f.last_used_at);
      return (now.getTime() - usedAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
    });

    const last30Days = featureUsage.filter(f => {
      if (!f.last_used_at) return false;
      const usedAt = new Date(f.last_used_at);
      return (now.getTime() - usedAt.getTime()) < 30 * 24 * 60 * 60 * 1000;
    });

    return {
      totalUsage,
      uniqueFeatures,
      avgSessionDuration,
      weeklyActiveFeatures: last7Days.length,
      monthlyActiveFeatures: last30Days.length,
      stickiness: last30Days.length > 0 ? (last7Days.length / last30Days.length) * 100 : 0,
    };
  };

  // Get risk indicators
  const getRiskIndicators = () => {
    const indicators: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string }> = [];

    if (lowUsageAlerts && lowUsageAlerts.length > 0) {
      const criticalAlerts = lowUsageAlerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        indicators.push({
          type: 'low_usage',
          severity: 'high',
          message: `${criticalAlerts.length} alertas críticas de bajo uso`,
        });
      }
    }

    if (adoptionScore) {
      if ((adoptionScore.overall_score || 0) < 40) {
        indicators.push({
          type: 'adoption_score',
          severity: 'high',
          message: 'Score de adopción bajo (<40)',
        });
      }
      if (adoptionScore.trend === 'declining') {
        indicators.push({
          type: 'trend',
          severity: 'medium',
          message: 'Tendencia de adopción en declive',
        });
      }
    }

    if (timeToValueMetrics) {
      const overdueMetrics = timeToValueMetrics.filter(m => {
        if (m.is_achieved || !m.started_at || !m.target_days) return false;
        const startDate = new Date(m.started_at);
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceStart > m.target_days;
      });

      if (overdueMetrics.length > 0) {
        indicators.push({
          type: 'ttv_overdue',
          severity: 'medium',
          message: `${overdueMetrics.length} milestones de valor retrasados`,
        });
      }
    }

    return indicators;
  };

  return {
    featureUsage,
    timeToValueMetrics,
    lowUsageAlerts,
    adoptionScore,
    loadingUsage,
    loadingTTV,
    loadingAlerts,
    loadingScore,
    trackFeature: trackFeature.mutate,
    recordTimeToValue: recordTimeToValue.mutate,
    achieveMilestone: achieveMilestone.mutate,
    resolveAlert: resolveAlert.mutate,
    predictTimeToValue: predictTimeToValue.mutate,
    isPredicting: predictTimeToValue.isPending,
    getAdoptionSummary,
    getRiskIndicators,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoadingState,
    isSuccess,
    isError,
    isRetrying,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
