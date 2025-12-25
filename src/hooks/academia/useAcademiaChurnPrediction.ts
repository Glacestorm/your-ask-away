import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChurnPrediction {
  user_id: string;
  course_id: string;
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_churn_date: string | null;
  confidence: number;
  risk_factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  early_warning_signals: string[];
}

export interface ChurnIntervention {
  type: 'automated' | 'personal' | 'content' | 'gamification' | 'social';
  priority: number;
  action: string;
  message_template: string;
  timing: string;
  expected_impact: number;
  effort_required: 'low' | 'medium' | 'high';
  success_indicators: string[];
}

export interface RiskFactor {
  category: 'engagement' | 'performance' | 'emotional' | 'temporal' | 'behavioral';
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  current_value: number;
  threshold_value: number;
  trend: 'improving' | 'stable' | 'declining';
  description: string;
  data_points: string[];
}

interface ChurnPredictionResult {
  predictions: ChurnPrediction[];
  summary: {
    total_analyzed: number;
    high_risk_count: number;
    avg_churn_probability: number;
  };
}

interface RiskFactorsResult {
  user_id: string;
  risk_factors: RiskFactor[];
  overall_risk_score: number;
  primary_concern: string;
}

interface InterventionsResult {
  user_id: string;
  interventions: ChurnIntervention[];
  recommended_sequence: string[];
  escalation_plan: {
    trigger: string;
    next_steps: string[];
  };
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useAcademiaChurnPrediction() {
  const [status, setStatus] = useState<Status>('idle');
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactorsResult | null>(null);
  const [interventions, setInterventions] = useState<InterventionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const predictChurn = useCallback(async (
    courseId?: string,
    studentIds?: string[],
    timeframeDays = 30
  ) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-churn-prediction',
        {
          body: {
            action: 'predict',
            course_id: courseId,
            student_ids: studentIds,
            timeframe_days: timeframeDays
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const result = data.data as ChurnPredictionResult;
        setPredictions(result.predictions || []);
        setStatus('success');
        return result;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al predecir churn';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const getRiskFactors = useCallback(async (userId: string, courseId: string) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-churn-prediction',
        {
          body: {
            action: 'get_risk_factors',
            user_id: userId,
            course_id: courseId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const result = data.data as RiskFactorsResult;
        setRiskFactors(result);
        setStatus('success');
        return result;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener factores de riesgo';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const getInterventions = useCallback(async (userId: string, courseId: string) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-churn-prediction',
        {
          body: {
            action: 'get_interventions',
            user_id: userId,
            course_id: courseId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const result = data.data as InterventionsResult;
        setInterventions(result);
        setStatus('success');
        return result;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener intervenciones';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setPredictions([]);
    setRiskFactors(null);
    setInterventions(null);
    setError(null);
  }, []);

  const getRiskColor = (level: ChurnPrediction['risk_level']) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getHighRiskStudents = useCallback(() => {
    return predictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical');
  }, [predictions]);

  return {
    // State
    status,
    predictions,
    riskFactors,
    interventions,
    error,
    // Status helpers
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    // Actions
    predictChurn,
    getRiskFactors,
    getInterventions,
    reset,
    // Utilities
    getRiskColor,
    getHighRiskStudents,
  };
}

export default useAcademiaChurnPrediction;
