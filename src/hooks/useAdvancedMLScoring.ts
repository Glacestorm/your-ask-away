import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IndividualModelResult {
  model_name: string;
  model_type: string;
  prediction: number;
  weight: number;
  weighted_contribution: number;
  feature_importances: { feature: string; importance: number }[];
}

export interface GradientBoostingDetails {
  n_estimators: number;
  learning_rate: number;
  max_depth: number;
  boosting_rounds: { round: number; residual_reduction: number; weak_learner_weight: number }[];
  feature_split_gains: { feature: string; total_gain: number; split_count: number }[];
}

export interface RandomForestDetails {
  n_trees: number;
  max_depth: number;
  tree_predictions: { tree_id: number; prediction: number; confidence: number }[];
  oob_score: number;
  feature_importances_mdi: { feature: string; importance: number; std: number }[];
}

export interface ExplainabilityResult {
  shap_values: { feature: string; value: number; direction: 'positive' | 'negative' }[];
  counterfactuals: { change: string; impact: string; new_score: number }[];
  decision_path: string[];
  human_explanation: string;
}

export interface ModelMetrics {
  auc_roc: number;
  precision: number;
  recall: number;
  f1_score: number;
  log_loss: number;
  calibration_error: number;
}

export interface AdvancedMLResult {
  ensemble_prediction: {
    final_score: number;
    confidence: number;
    risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    recommendation: string;
  };
  individual_models: IndividualModelResult[];
  gradient_boosting_details: GradientBoostingDetails;
  random_forest_details: RandomForestDetails;
  explainability: ExplainabilityResult;
  model_metrics: ModelMetrics;
  ab_test_info: {
    model_version: string;
    is_treatment: boolean;
  };
  metadata: {
    latency_ms: number;
    explanation_id: string | null;
    model_version: string;
  };
}

export function useAdvancedMLScoring() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdvancedMLResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const score = useCallback(async (
    scoringType: 'credit' | 'churn' | 'ltv' | 'propensity',
    features: Record<string, number>,
    options?: {
      companyId?: string;
      useEnsemble?: boolean;
      explainability?: boolean;
      abTestId?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-ml-scoring', {
        body: { 
          scoringType, 
          features, 
          companyId: options?.companyId,
          useEnsemble: options?.useEnsemble ?? true,
          explainability: options?.explainability ?? true,
          abTestId: options?.abTestId
        }
      });

      if (fnError) throw fnError;

      setResult(data);
      toast.success('Scoring ML avançat completat');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en scoring avançat';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRiskColor = useCallback((riskLevel: string): string => {
    switch (riskLevel) {
      case 'very_low': return 'text-emerald-500';
      case 'low': return 'text-green-500';
      case 'medium': return 'text-amber-500';
      case 'high': return 'text-orange-500';
      case 'very_high': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  }, []);

  const getRiskBadgeVariant = useCallback((riskLevel: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (riskLevel) {
      case 'very_low':
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high':
      case 'very_high': return 'destructive';
      default: return 'outline';
    }
  }, []);

  return {
    score,
    result,
    isLoading,
    error,
    getRiskColor,
    getRiskBadgeVariant
  };
}

export default useAdvancedMLScoring;
