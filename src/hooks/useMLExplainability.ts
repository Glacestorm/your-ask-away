import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface MLExplainabilityError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  // === ESTADO KB ===
  const [error, setError] = useState<MLExplainabilityError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

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
      setLastRefresh(new Date());
      toast.success('Anàlisi SHAP/LIME completada');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en explainability';
      setError({
        code: 'EXPLAIN_ERROR',
        message,
        details: { originalError: String(err) }
      });
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
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
    getContributionColor
  };
}

export default useMLExplainability;
