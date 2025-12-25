import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RevenuePrediction {
  period: string;
  predicted_revenue: number;
  confidence_low: number;
  confidence_high: number;
  confidence_level: number;
  growth_rate: number;
  contributing_factors: RevenueFactor[];
  scenarios: RevenueScenario[];
}

export interface RevenueFactor {
  factor: string;
  contribution: number;
  trend: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface RevenueScenario {
  name: 'pessimistic' | 'baseline' | 'optimistic';
  revenue: number;
  probability: number;
  assumptions: string[];
}

export interface RevenueBreakdown {
  recurring: number;
  expansion: number;
  new_business: number;
  churn_impact: number;
  contraction: number;
}

export interface CohortAnalysis {
  cohort: string;
  ltv_predicted: number;
  avg_revenue: number;
  retention_rate: number;
  expansion_rate: number;
  months_to_payback: number;
}

export function usePredictiveRevenue() {
  const [predictions, setPredictions] = useState<RevenuePrediction[]>([]);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown | null>(null);
  const [cohorts, setCohorts] = useState<CohortAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictRevenue = useCallback(async (months: number = 12) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-revenue', {
        body: { action: 'forecast', months }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setPredictions(data.predictions || []);
        setBreakdown(data.breakdown || null);
        return data;
      }

      throw new Error(data?.error || 'Forecast failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Error en predicción de revenue');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeCohorts = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-revenue', {
        body: { action: 'cohort_analysis' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setCohorts(data.cohorts || []);
        return data.cohorts;
      }
      return null;
    } catch (err) {
      console.error('[usePredictiveRevenue] analyzeCohorts error:', err);
      return null;
    }
  }, []);

  const runScenario = useCallback(async (params: {
    new_customer_growth?: number;
    churn_rate_change?: number;
    expansion_rate?: number;
    pricing_change?: number;
  }) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-revenue', {
        body: { action: 'scenario_analysis', params }
      });

      if (fnError) throw fnError;
      return data?.scenario || null;
    } catch (err) {
      console.error('[usePredictiveRevenue] runScenario error:', err);
      return null;
    }
  }, []);

  return {
    predictions,
    breakdown,
    cohorts,
    isLoading,
    error,
    predictRevenue,
    analyzeCohorts,
    runScenario
  };
}

export default usePredictiveRevenue;
