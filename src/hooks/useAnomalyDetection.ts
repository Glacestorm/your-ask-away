import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

export type AnomalyDetectionError = KBError;

export interface AnomalyResult {
  anomaly_id: string;
  type: 'velocity' | 'amount' | 'pattern' | 'geographic' | 'behavioral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  detected_at: string;
  transaction_ids: string[];
  indicators: AnomalyIndicator[];
  recommended_actions: string[];
  false_positive_likelihood: number;
}

export interface AnomalyIndicator {
  name: string;
  value: number;
  threshold: number;
  deviation: number;
  historical_baseline: number;
}

export interface AnomalyDetectionConfig {
  sensitivity: 'low' | 'medium' | 'high';
  lookback_days: number;
  min_confidence: number;
  include_patterns: string[];
}

export function useAnomalyDetection() {
  // === KB 2.0 STATE MACHINE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const canRetry = isError && retryCount < 3;

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setAnomalies([]);
    setError(null);
    setRetryCount(0);
  }, []);

  const detectAnomalies = useCallback(async (
    companyId: string,
    config?: Partial<AnomalyDetectionConfig>
  ) => {
    setStatus('loading');
    setError(null);
    const startTime = new Date();

    try {
      const { data, error: fnError } = await supabase.functions.invoke('detect-anomalies', {
        body: { 
          companyId,
          config: {
            sensitivity: config?.sensitivity || 'medium',
            lookback_days: config?.lookback_days || 90,
            min_confidence: config?.min_confidence || 0.7,
            include_patterns: config?.include_patterns || ['velocity', 'amount', 'pattern', 'geographic']
          }
        }
      });

      if (fnError) throw fnError;

      setAnomalies(data.anomalies || []);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry({ hookName: 'useAnomalyDetection', operationName: 'detectAnomalies', startTime, endTime: new Date(), durationMs: Date.now() - startTime.getTime(), status: 'success', retryCount: 0 });
      
      if (data.anomalies?.length > 0) {
        const critical = data.anomalies.filter((a: AnomalyResult) => a.severity === 'critical').length;
        if (critical > 0) toast.error(`${critical} anomalies crítiques detectades!`);
        else toast.warning(`${data.anomalies.length} anomalies detectades`);
      } else {
        toast.success('Cap anomalia detectada');
      }
      return data.anomalies;
    } catch (err) {
      const kbError: KBError = { ...parseError(err), code: 'DETECT_ANOMALIES_ERROR' };
      setError(kbError);
      setStatus('error');
      collectTelemetry({ hookName: 'useAnomalyDetection', operationName: 'detectAnomalies', startTime, endTime: new Date(), durationMs: Date.now() - startTime.getTime(), status: 'error', error: kbError, retryCount });
      toast.error(kbError.message);
      return [];
    }
  }, []);

  const getSeverityColor = useCallback((severity: AnomalyResult['severity']): string => {
    const colors = {
      'low': 'text-blue-500',
      'medium': 'text-yellow-500',
      'high': 'text-orange-500',
      'critical': 'text-red-600'
    };
    return colors[severity];
  }, []);

  return {
    data: anomalies,
    anomalies,
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    clearError,
    retryCount,
    canRetry,
    execute: detectAnomalies,
    detectAnomalies,
    reset,
    lastRefresh,
    lastSuccess,
    getSeverityColor,
  };
}

export default useAnomalyDetection;
