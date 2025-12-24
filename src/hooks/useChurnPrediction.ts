import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface ChurnPredictionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  impact: number; // -1 to 1
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

export function useChurnPrediction() {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  // === ESTADO KB ===
  const [error, setError] = useState<ChurnPredictionError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const predictChurn = useCallback(async (
    companyIds?: string[],
    options?: {
      prediction_horizon_days?: number;
      min_probability?: number;
      include_recommendations?: boolean;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predict-churn', {
        body: { 
          companyIds,
          prediction_horizon_days: options?.prediction_horizon_days || 90,
          min_probability: options?.min_probability || 0,
          include_recommendations: options?.include_recommendations ?? true
        }
      });

      if (fnError) throw fnError;

      setPredictions(data.predictions || []);
      setLastRefresh(new Date());
      
      const atRisk = (data.predictions || []).filter(
        (p: ChurnPrediction) => p.risk_level === 'high' || p.risk_level === 'critical'
      );
      
      if (atRisk.length > 0) {
        toast.warning(`${atRisk.length} clients en risc de churn detectats`);
      } else {
        toast.success('Prediccions de churn generades');
      }

      return data.predictions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en predicció churn';
      setError({
        code: 'PREDICT_CHURN_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  return {
    predictChurn,
    predictions,
    isLoading,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
    getRiskColor,
    getTotalValueAtRisk
  };
}

export default useChurnPrediction;
