import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

export interface RevenueRiskAlert {
  id: string;
  alert_type: 'concentration' | 'churn_risk' | 'contraction' | 'payment_issue' | 'engagement_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  company_id: string | null;
  segment: string | null;
  mrr_at_risk: number | null;
  probability: number | null;
  expected_impact: number | null;
  recommended_actions: Array<{ action: string; priority: number }>;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  assigned_to: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string };
}

export interface RetentionSimulation {
  id: string;
  simulation_name: string;
  simulation_type: 'churn_reduction' | 'expansion_increase' | 'pricing_change' | 'segment_focus';
  parameters: Record<string, unknown>;
  baseline_metrics: {
    mrr: number;
    churnRate: number;
    nrr: number;
    customerCount: number;
  };
  projected_metrics: {
    mrr: number;
    churnRate: number;
    nrr: number;
    customerCount: number;
  };
  impact_analysis: {
    mrrDelta: number;
    customerDelta: number;
    nrrDelta: number;
    roiPercentage: number;
  };
  roi_projection: number | null;
  confidence_level: number | null;
  time_horizon_months: number;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface IndustryBenchmark {
  id: string;
  industry: string;
  segment: string | null;
  metric_name: string;
  metric_value: number;
  percentile_25: number | null;
  percentile_50: number | null;
  percentile_75: number | null;
  percentile_90: number | null;
  sample_size: number | null;
  source: string | null;
  effective_date: string;
  is_active: boolean;
}

export interface RiskSummary {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  totalMRRAtRisk: number;
  expectedImpact: number;
  openAlerts: number;
  acknowledgedAlerts: number;
  inProgressAlerts: number;
}

export const useRevenueRiskAlerts = () => {
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
  const isErrorState = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Fetch risk alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['revenue-risk-alerts'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_risk_alerts')
          .select(`
            *,
            company:companies(name)
          `)
          .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setError(null);
        setRetryCount(0);
        return data as RevenueRiskAlert[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(createKBError('FETCH_ALERTS_ERROR', message, { retryable: true, details: { originalError: String(err) } }));
        setRetryCount(prev => prev + 1);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Limit retries to prevent infinite loops
      const MAX_RETRIES = 3;
      if (failureCount >= MAX_RETRIES) {
        console.warn(`[useRevenueRiskAlerts] Max retries (${MAX_RETRIES}) reached, stopping retries`);
        return false;
      }
      // Only retry on network errors or specific error codes
      const shouldRetry = error instanceof Error && 
        (error.message.includes('network') || error.message.includes('timeout'));
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep unused data in cache for 5 minutes
  });

  // Fetch simulations
  const { data: simulations, isLoading: simulationsLoading } = useQuery({
    queryKey: ['retention-simulations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retention_simulations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as RetentionSimulation[];
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    staleTime: 60000,
  });

  // Fetch industry benchmarks
  const { data: benchmarks, isLoading: benchmarksLoading } = useQuery({
    queryKey: ['industry-benchmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('is_active', true)
        .order('industry', { ascending: true });
      
      if (error) throw error;
      return data as IndustryBenchmark[];
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    staleTime: 300000, // Benchmarks are stable, cache for 5 minutes
  });

  // Calculate risk summary
  const riskSummary: RiskSummary = {
    totalAlerts: alerts?.length || 0,
    criticalAlerts: alerts?.filter(a => a.severity === 'critical').length || 0,
    highAlerts: alerts?.filter(a => a.severity === 'high').length || 0,
    totalMRRAtRisk: alerts?.reduce((sum, a) => sum + (a.mrr_at_risk || 0), 0) || 0,
    expectedImpact: alerts?.reduce((sum, a) => sum + (a.expected_impact || 0), 0) || 0,
    openAlerts: alerts?.filter(a => a.status === 'open').length || 0,
    acknowledgedAlerts: alerts?.filter(a => a.status === 'acknowledged').length || 0,
    inProgressAlerts: alerts?.filter(a => a.status === 'in_progress').length || 0
  };

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alert: Partial<RevenueRiskAlert>) => {
      const { data, error } = await supabase
        .from('revenue_risk_alerts')
        .insert([alert as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-risk-alerts'] });
      toast.success('Alerta de riesgo creada');
    },
    onError: (error) => {
      toast.error('Error al crear alerta: ' + error.message);
    }
  });

  // Update alert status mutation
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RevenueRiskAlert> & { id: string }) => {
      const { data, error } = await supabase
        .from('revenue_risk_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-risk-alerts'] });
      toast.success('Alerta actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('revenue_risk_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: notes
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-risk-alerts'] });
      toast.success('Alerta resuelta');
    },
    onError: (error) => {
      toast.error('Error al resolver: ' + error.message);
    }
  });

  // Create simulation mutation
  const createSimulationMutation = useMutation({
    mutationFn: async (simulation: Partial<RetentionSimulation>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const insertData = {
        ...simulation,
        created_by: user?.id
      };
      
      const { data, error } = await supabase
        .from('retention_simulations')
        .insert([insertData as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention-simulations'] });
      toast.success('Simulación creada');
    },
    onError: (error) => {
      toast.error('Error al crear simulación: ' + error.message);
    }
  });

  // Get alerts by severity
  const getAlertsBySeverity = (severity: RevenueRiskAlert['severity']) => {
    return alerts?.filter(a => a.severity === severity && a.status !== 'resolved') || [];
  };

  // Get alerts by type
  const getAlertsByType = (type: RevenueRiskAlert['alert_type']) => {
    return alerts?.filter(a => a.alert_type === type) || [];
  };

  // Get benchmark for metric
  const getBenchmark = (industry: string, metricName: string) => {
    return benchmarks?.find(b => b.industry === industry && b.metric_name === metricName);
  };

  // Compare metric against benchmark
  const compareWithBenchmark = (industry: string, metricName: string, value: number) => {
    const benchmark = getBenchmark(industry, metricName);
    if (!benchmark) return null;

    let percentile = 'below_25';
    if (value >= (benchmark.percentile_90 || 0)) percentile = 'top_10';
    else if (value >= (benchmark.percentile_75 || 0)) percentile = 'top_25';
    else if (value >= (benchmark.percentile_50 || 0)) percentile = 'above_median';
    else if (value >= (benchmark.percentile_25 || 0)) percentile = 'below_median';

    return {
      benchmark,
      percentile,
      vsMedian: value - (benchmark.percentile_50 || 0),
      vsIndustryAvg: value - benchmark.metric_value
    };
  };

  // Run what-if simulation
  const runWhatIfSimulation = async (params: {
    type: RetentionSimulation['simulation_type'];
    parameters: Record<string, unknown>;
    baselineMetrics: RetentionSimulation['baseline_metrics'];
  }) => {
    // Simple local simulation logic
    const { type, parameters, baselineMetrics } = params;
    const projectedMetrics = { ...baselineMetrics };
    
    switch (type) {
      case 'churn_reduction':
        const churnReduction = (parameters.reduction_percentage as number) || 10;
        projectedMetrics.churnRate = baselineMetrics.churnRate * (1 - churnReduction / 100);
        projectedMetrics.mrr = baselineMetrics.mrr * (1 + (churnReduction / 100) * 0.5);
        projectedMetrics.nrr = baselineMetrics.nrr + churnReduction * 0.8;
        break;
      case 'expansion_increase':
        const expansionIncrease = (parameters.increase_percentage as number) || 15;
        projectedMetrics.mrr = baselineMetrics.mrr * (1 + expansionIncrease / 100);
        projectedMetrics.nrr = baselineMetrics.nrr + expansionIncrease * 0.6;
        break;
      case 'pricing_change':
        const priceChange = (parameters.price_change_percentage as number) || 5;
        projectedMetrics.mrr = baselineMetrics.mrr * (1 + priceChange / 100);
        projectedMetrics.churnRate = baselineMetrics.churnRate * (1 + priceChange / 200);
        break;
    }

    const impactAnalysis = {
      mrrDelta: projectedMetrics.mrr - baselineMetrics.mrr,
      customerDelta: projectedMetrics.customerCount - baselineMetrics.customerCount,
      nrrDelta: projectedMetrics.nrr - baselineMetrics.nrr,
      roiPercentage: ((projectedMetrics.mrr - baselineMetrics.mrr) / baselineMetrics.mrr) * 100
    };

    return {
      projectedMetrics,
      impactAnalysis,
      confidence: 75 + Math.random() * 15
    };
  };

  return {
    alerts,
    simulations,
    benchmarks,
    riskSummary,
    isLoading: isLoadingState || alertsLoading || simulationsLoading || benchmarksLoading,
    refetchAlerts,
    createAlert: createAlertMutation.mutateAsync,
    updateAlert: updateAlertMutation.mutateAsync,
    resolveAlert: resolveAlertMutation.mutateAsync,
    createSimulation: createSimulationMutation.mutateAsync,
    getAlertsBySeverity,
    getAlertsByType,
    getBenchmark,
    compareWithBenchmark,
    runWhatIfSimulation,
    isCreatingAlert: createAlertMutation.isPending,
    isCreatingSimulation: createSimulationMutation.isPending,
    // === KB 2.0 STATE ===
    status,
    isIdle,
    isSuccess,
    isError: isErrorState,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
};
