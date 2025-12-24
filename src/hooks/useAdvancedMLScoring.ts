import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

// Re-export for backwards compat
export type AdvancedMLScoringError = KBError;

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
  // === KB 2.0 STATE MACHINE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [result, setResult] = useState<AdvancedMLResult | null>(null);
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Computed states
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
    setResult(null);
    setError(null);
    setRetryCount(0);
  }, []);

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
    setStatus('loading');
    setError(null);
    const startTime = new Date();

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
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry({
        hookName: 'useAdvancedMLScoring',
        operationName: 'score',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0,
      });
      toast.success('Scoring ML avançat completat');
      return data;
    } catch (err) {
      const kbError: KBError = { ...parseError(err), code: 'ADVANCED_ML_ERROR' };
      setError(kbError);
      setStatus('error');
      collectTelemetry({
        hookName: 'useAdvancedMLScoring',
        operationName: 'score',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount,
      });
      toast.error(kbError.message);
      return null;
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
    // Data
    data: result,
    result,
    // State Machine
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    // Error
    error,
    clearError,
    // Retry
    retryCount,
    canRetry,
    // Control
    execute: score,
    score,
    reset,
    // Metadata
    lastRefresh,
    lastSuccess,
    // Helpers
    getRiskColor,
    getRiskBadgeVariant,
  };
}

export default useAdvancedMLScoring;
