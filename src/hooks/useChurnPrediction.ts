/**
 * useChurnPrediction - KB 2.0 Migration
 * Enterprise-grade churn prediction with state machine, retry, and telemetry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  KBStatus, 
  KBError, 
  KBRetryConfig,
  KB_DEFAULT_RETRY_CONFIG,
  createKBError, 
  parseError, 
  collectTelemetry 
} from './core';

// === TIPOS KB 2.0 ===
export interface ChurnPrediction {
  company_id: string;
  company_name: string;
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_churn_date: string | null;
  confidence: number;
  contributing_factors: ChurnFactor[];
  retention_recommendations: RetentionAction[];
  lifetime_value_at_risk: number;
  early_warning_signals: string[];
}

export interface ChurnFactor {
  factor: string;
  impact: number;
  trend: 'improving' | 'stable' | 'declining';
  description: string;
  actionable: boolean;
}

export interface RetentionAction {
  action: string;
  expected_impact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  responsible: string;
  success_probability: number;
}

export interface PredictChurnOptions {
  prediction_horizon_days?: number;
  min_probability?: number;
  include_recommendations?: boolean;
}

// === HOOK KB 2.0 ===
export function useChurnPrediction() {
  // State
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastArgsRef = useRef<{ companyIds?: string[]; options?: PredictChurnOptions }>({});

  const retryConfig: KBRetryConfig = {
    ...KB_DEFAULT_RETRY_CONFIG,
    maxRetries: 3,
  };

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isRetrying = status === 'retrying';
  const canRetry = error?.retryable === true && retryCount < retryConfig.maxRetries;

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setPredictions([]);
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    if (status === 'loading' || status === 'retrying') {
      setStatus('cancelled' as KBStatus);
    }
  }, [status]);

  // === PREDICT CHURN WITH RETRY ===
  const predictChurnWithRetry = useCallback(async (
    companyIds?: string[],
    options?: PredictChurnOptions,
    currentRetry: number = 0
  ): Promise<ChurnPrediction[]> => {
    const startTime = new Date();
    abortControllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return [];

      setStatus(currentRetry > 0 ? 'retrying' : 'loading');
      setRetryCount(currentRetry);

      const { data, error: fnError } = await supabase.functions.invoke('predict-churn', {
        body: { 
          companyIds,
          prediction_horizon_days: options?.prediction_horizon_days || 90,
          min_probability: options?.min_probability || 0,
          include_recommendations: options?.include_recommendations ?? true
        }
      });

      if (fnError) throw fnError;
      if (!isMountedRef.current) return [];

      const result = data.predictions || [];
      setPredictions(result);
      setStatus('success');
      setError(null);
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);

      // Telemetry
      collectTelemetry({
        hookName: 'useChurnPrediction',
        operationName: 'predictChurn',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: currentRetry,
        metadata: { predictionsCount: result.length },
      });

      // Toast notifications
      const atRisk = result.filter(
        (p: ChurnPrediction) => p.risk_level === 'high' || p.risk_level === 'critical'
      );
      
      if (atRisk.length > 0) {
        toast.warning(`${atRisk.length} clients en risc de churn detectats`);
      } else {
        toast.success('Prediccions de churn generades');
      }

      return result;

    } catch (err) {
      if (!isMountedRef.current) return [];

      const parsed = parseError(err);

      // Retry logic
      if (parsed.retryable && currentRetry < retryConfig.maxRetries) {
        const delay = retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, currentRetry);
        
        collectTelemetry({
          hookName: 'useChurnPrediction',
          operationName: 'predictChurn',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'retrying',
          error: parsed,
          retryCount: currentRetry,
          metadata: { nextRetryIn: delay },
        });

        await new Promise(resolve => setTimeout(resolve, Math.min(delay, retryConfig.maxDelayMs)));
        
        if (!isMountedRef.current) return [];
        
        return predictChurnWithRetry(companyIds, options, currentRetry + 1);
      }

      // Final failure
      setError(parsed);
      setStatus('error');
      setRetryCount(currentRetry);

      collectTelemetry({
        hookName: 'useChurnPrediction',
        operationName: 'predictChurn',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: parsed,
        retryCount: currentRetry,
      });

      toast.error(parsed.message);
      return [];
    }
  }, [retryConfig]);

  // === MAIN PREDICT FUNCTION ===
  const predictChurn = useCallback(async (
    companyIds?: string[],
    options?: PredictChurnOptions
  ): Promise<ChurnPrediction[]> => {
    lastArgsRef.current = { companyIds, options };
    return predictChurnWithRetry(companyIds, options, 0);
  }, [predictChurnWithRetry]);

  // === RETRY FUNCTION ===
  const retry = useCallback(async (): Promise<ChurnPrediction[]> => {
    if (!canRetry) return [];
    const { companyIds, options } = lastArgsRef.current;
    return predictChurnWithRetry(companyIds, options, retryCount + 1);
  }, [canRetry, retryCount, predictChurnWithRetry]);

  // === UTILITY FUNCTIONS ===
  const getRiskColor = useCallback((risk: ChurnPrediction['risk_level']): string => {
    const colors = {
      'low': 'text-green-500',
      'medium': 'text-yellow-500',
      'high': 'text-orange-500',
      'critical': 'text-red-600'
    };
    return colors[risk];
  }, []);

  const getTotalValueAtRisk = useCallback((): number => {
    return predictions.reduce((sum, p) => sum + (p.lifetime_value_at_risk || 0), 0);
  }, [predictions]);

  const getHighRiskPredictions = useCallback((): ChurnPrediction[] => {
    return predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical');
  }, [predictions]);

  const getPredictionByCompany = useCallback((companyId: string): ChurnPrediction | undefined => {
    return predictions.find(p => p.company_id === companyId);
  }, [predictions]);

  // === RETURN KB 2.0 ===
  return {
    // Data
    predictions,
    data: predictions,
    
    // State Machine KB 2.0
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isRetrying,
    
    // Error Management KB 2.0
    error,
    clearError,
    
    // Retry Management
    retryCount,
    canRetry,
    retry,
    
    // Request Control
    execute: predictChurn,
    predictChurn,
    cancel,
    reset,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    
    // Utility Functions
    getRiskColor,
    getTotalValueAtRisk,
    getHighRiskPredictions,
    getPredictionByCompany,
  };
}

export default useChurnPrediction;
