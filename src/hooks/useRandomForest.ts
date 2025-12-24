import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, collectTelemetry } from '@/hooks/core/useKBBase';

export interface TreeVote {
  tree_id: number;
  vote: string | number;
  confidence: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  std: number;
}

export interface RandomForestResult {
  prediction: string | number;
  probability: number;
  confidence_interval: { lower: number; upper: number };
  ensemble_details: {
    n_estimators: number;
    max_depth: number;
    tree_votes: TreeVote[];
    oob_score: number;
    feature_importances: FeatureImportance[];
  };
  decision_path: {
    avg_nodes_traversed: number;
    common_splits: { feature: string; threshold: number; frequency: number }[];
  };
  model_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
}

export function useRandomForest() {
  const [result, setResult] = useState<RandomForestResult | null>(null);
  
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
  const isRetrying = status === 'retrying';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
    setResult(null);
  }, []);

  const predict = useCallback(async (
    task: 'classification' | 'regression',
    features: Record<string, number>,
    targetVariable: string,
    options?: {
      nEstimators?: number;
      maxDepth?: number;
      companyId?: string;
    }
  ) => {
    const startTime = new Date();
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('random-forest-predict', {
        body: { 
          task, 
          features, 
          targetVariable,
          nEstimators: options?.nEstimators || 100,
          maxDepth: options?.maxDepth || 10,
          companyId: options?.companyId
        }
      });

      if (fnError) throw fnError;

      setResult(data);
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      
      collectTelemetry({
        hookName: 'useRandomForest',
        operationName: 'predict',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount
      });
      
      toast.success('Predicció Random Forest completada');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en Random Forest';
      const kbError = createKBError('RANDOM_FOREST_ERROR', message, { originalError: err });
      setError(kbError);
      setStatus('error');
      
      collectTelemetry({
        hookName: 'useRandomForest',
        operationName: 'predict',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount
      });
      
      toast.error(message);
      return null;
    }
  }, [retryCount]);

  const getImportanceColor = useCallback((importance: number): string => {
    if (importance >= 0.3) return 'text-emerald-500';
    if (importance >= 0.15) return 'text-yellow-500';
    return 'text-muted-foreground';
  }, []);

  return {
    predict,
    result,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isRetrying,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
    getImportanceColor
  };
}

export default useRandomForest;
