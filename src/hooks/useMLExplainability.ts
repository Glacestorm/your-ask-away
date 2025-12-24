import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

// === ERROR TIPADO KB 2.0 ===
export type MLExplainabilityError = KBError;

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
  const [result, setResult] = useState<ExplainabilityResult | null>(null);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
    setResult(null);
  }, []);

  const explain = useCallback(async (
    modelType: 'credit_scoring' | 'churn_prediction' | 'anomaly_detection' | 'segmentation',
    predictionData: Record<string, number>,
    method: 'shap' | 'lime' | 'both' = 'both',
    companyId?: string
  ) => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ml-explainability', {
        body: { modelType, predictionData, method, companyId }
      });

      if (fnError) throw fnError;

      setResult(data);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useMLExplainability', 'explain', 'success', Date.now() - startTime);
      toast.success('Anàlisi SHAP/LIME completada');
      return data;
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('EXPLAIN_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useMLExplainability', 'explain', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return null;
    }
  }, []);

  const getContributionColor = useCallback((direction: 'positive' | 'negative'): string => {
    return direction === 'positive' ? 'text-emerald-500' : 'text-red-500';
  }, []);

  return {
    explain,
    result,
    getContributionColor,
    // === KB 2.0 STATE ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}

export default useMLExplainability;
