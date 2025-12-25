import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChurnPrediction {
  company_id: string;
  company_name: string;
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  days_to_churn: number;
  confidence: number;
  risk_factors: ChurnRiskFactor[];
  recommended_actions: ChurnAction[];
  historical_signals: ChurnSignal[];
  predicted_at: string;
}

export interface ChurnRiskFactor {
  factor: string;
  impact: number;
  trend: 'improving' | 'stable' | 'worsening';
  description: string;
}

export interface ChurnAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_impact: number;
  effort: 'low' | 'medium' | 'high';
  deadline_days: number;
}

export interface ChurnSignal {
  signal_type: string;
  detected_at: string;
  severity: number;
  description: string;
}

export interface ChurnAnalytics {
  total_at_risk: number;
  high_risk_count: number;
  critical_count: number;
  avg_churn_probability: number;
  revenue_at_risk: number;
  trend_vs_last_month: number;
  intervention_success_rate: number;
}

export function usePredictiveChurn() {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [analytics, setAnalytics] = useState<ChurnAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictChurn = useCallback(async (companyIds?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-churn', {
        body: { action: 'predict', company_ids: companyIds }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setPredictions(data.predictions || []);
        setAnalytics(data.analytics || null);
        return data;
      }

      throw new Error(data?.error || 'Prediction failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Error en predicción de churn');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInterventionPlan = useCallback(async (companyId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-churn', {
        body: { action: 'intervention_plan', company_id: companyId }
      });

      if (fnError) throw fnError;
      return data?.plan || null;
    } catch (err) {
      console.error('[usePredictiveChurn] getInterventionPlan error:', err);
      return null;
    }
  }, []);

  const recordIntervention = useCallback(async (
    companyId: string,
    intervention: { type: string; notes: string; outcome?: string }
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-churn', {
        body: { action: 'record_intervention', company_id: companyId, intervention }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        toast.success('Intervención registrada');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[usePredictiveChurn] recordIntervention error:', err);
      toast.error('Error al registrar intervención');
      return false;
    }
  }, []);

  return {
    predictions,
    analytics,
    isLoading,
    error,
    predictChurn,
    getInterventionPlan,
    recordIntervention
  };
}

export default usePredictiveChurn;
