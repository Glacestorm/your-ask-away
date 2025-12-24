import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface AnomalyDetectionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  // === ESTADO KB ===
  const [error, setError] = useState<AnomalyDetectionError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const detectAnomalies = useCallback(async (
    companyId: string,
    config?: Partial<AnomalyDetectionConfig>
  ) => {
    setIsLoading(true);
    setError(null);

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
      setLastRefresh(new Date());
      
      if (data.anomalies?.length > 0) {
        const critical = data.anomalies.filter((a: AnomalyResult) => a.severity === 'critical').length;
        if (critical > 0) {
          toast.error(`${critical} anomalies crítiques detectades!`);
        } else {
          toast.warning(`${data.anomalies.length} anomalies detectades`);
        }
      } else {
        toast.success('Cap anomalia detectada');
      }

      return data.anomalies;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en detecció anomalies';
      setError({
        code: 'DETECT_ANOMALIES_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
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
    detectAnomalies,
    anomalies,
    isLoading,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
    getSeverityColor
  };
}

export default useAnomalyDetection;
