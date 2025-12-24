/**
 * useRevenueForecast - KB 2.0 Migration
 * Enterprise-grade revenue forecasting with state machine and telemetry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// === ERROR TIPADO KB 2.0 ===
export type RevenueForecastError = KBError;

export interface RevenueForecast {
  id: string;
  forecast_date: string;
  forecast_horizon_months: number;
  scenario: string;
  predicted_mrr: number;
  predicted_arr: number;
  confidence_level: number;
  confidence_interval_low: number | null;
  confidence_interval_high: number | null;
  growth_rate_predicted: number | null;
  churn_rate_predicted: number | null;
  expansion_rate_predicted: number | null;
  key_drivers: Record<string, unknown> | null;
  risk_factors: Record<string, unknown> | null;
  model_version: string | null;
  model_accuracy: number | null;
  ai_insights: string | null;
  created_at: string;
  updated_at: string;
}

export const useRevenueForecast = () => {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isQueryLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const { data: forecasts, isLoading, refetch } = useQuery({
    queryKey: ['revenue-forecasts'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_forecasts')
          .select('*')
          .order('forecast_date', { ascending: false })
          .limit(50);
        
        if (fetchError) throw fetchError;
        setLastRefresh(new Date());
        setError(null);
        return data as RevenueForecast[];
      } catch (err) {
        const parsed = parseError(err);
        const kbError = createKBError('FETCH_FORECASTS_ERROR', parsed.message, { retryable: true });
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        collectTelemetry('useRevenueForecast', 'fetchForecasts', 'error', 0, kbError);
        throw err;
      }
    }
  });

  const generateForecastMutation = useMutation({
    mutationFn: async (params: { 
      forecastType: 'monthly' | 'quarterly' | 'yearly';
      historicalData: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('forecast-revenue', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-forecasts'] });
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setStatus('success');
      setRetryCount(0);
      collectTelemetry('useRevenueForecast', 'generateForecast', 'success', 0);
      toast.success('Pronóstico generado correctamente');
    },
    onError: (err) => {
      const parsed = parseError(err);
      const kbError = createKBError('GENERATE_FORECAST_ERROR', parsed.message, { retryable: true });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useRevenueForecast', 'generateForecast', 'error', 0, kbError);
      toast.error('Error al generar pronóstico: ' + parsed.message);
    }
  });

  const getLatestForecast = (scenario: string = 'expected') => {
    return forecasts?.find(f => f.scenario === scenario);
  };

  const getForecastsByScenario = (scenario: string) => {
    return forecasts?.filter(f => f.scenario === scenario) || [];
  };

  const getConfidenceIntervals = () => {
    const latest = forecasts?.[0];
    if (!latest) return null;
    return {
      low: latest.confidence_interval_low,
      high: latest.confidence_interval_high,
      predicted: latest.predicted_mrr
    };
  };

  const getForecastTrend = () => {
    if (!forecasts || forecasts.length < 2) return [];
    return forecasts
      .filter(f => f.scenario === 'expected')
      .slice(0, 12)
      .reverse()
      .map(f => ({
        date: f.forecast_date,
        predicted: f.predicted_mrr,
        low: f.confidence_interval_low,
        high: f.confidence_interval_high,
        confidence: f.confidence_level
      }));
  };

  return {
    // Data
    forecasts,
    data: forecasts,
    
    // State Machine KB 2.0
    status,
    isIdle,
    isLoading: isLoading || isQueryLoading,
    isSuccess,
    isError,
    
    // Error Management KB 2.0
    error,
    clearError,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    retryCount,
    
    // Control
    reset,
    refetch,
    
    // Actions
    generateForecast: generateForecastMutation.mutateAsync,
    isGenerating: generateForecastMutation.isPending,
    getLatestForecast,
    getForecastsByScenario,
    getConfidenceIntervals,
    getForecastTrend,
  };
};

export default useRevenueForecast;
