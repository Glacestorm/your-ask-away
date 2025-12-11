import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShapValue {
  feature: string;
  contribution: number;
  direction: 'positive' | 'negative';
  importance_rank: number;
}

export interface LimeWeight {
  feature: string;
  weight: number;
  confidence: number;
}

export interface ExplainabilityResult {
  shap_values: {
    feature_contributions: ShapValue[];
    base_value: number;
    output_value: number;
    interaction_effects: { features: string[]; interaction_value: number }[];
  };
  lime_explanation: {
    local_interpretable_model: string;
    feature_weights: LimeWeight[];
    model_fidelity: number;
    coverage: number;
  };
  summary: {
    top_positive_factors: string[];
    top_negative_factors: string[];
    confidence_score: number;
    explanation_text: string;
  };
}

export function useMLExplainability() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExplainabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const explain = useCallback(async (
    modelType: 'credit_scoring' | 'churn_prediction' | 'anomaly_detection' | 'segmentation',
    predictionData: Record<string, number>,
    method: 'shap' | 'lime' | 'both' = 'both',
    companyId?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ml-explainability', {
        body: { modelType, predictionData, method, companyId }
      });

      if (fnError) throw fnError;

      setResult(data);
      toast.success('Anàlisi SHAP/LIME completada');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en explainability';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getContributionColor = useCallback((direction: 'positive' | 'negative'): string => {
    return direction === 'positive' ? 'text-emerald-500' : 'text-red-500';
  }, []);

  return {
    explain,
    result,
    isLoading,
    error,
    getContributionColor
  };
}

export default useMLExplainability;
