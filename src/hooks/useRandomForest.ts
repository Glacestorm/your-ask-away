import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface RandomForestError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RandomForestResult | null>(null);
  // === ESTADO KB ===
  const [error, setError] = useState<RandomForestError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

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
    setIsLoading(true);
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
      setLastRefresh(new Date());
      toast.success('Predicció Random Forest completada');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en Random Forest';
      setError({
        code: 'RANDOM_FOREST_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getImportanceColor = useCallback((importance: number): string => {
    if (importance >= 0.3) return 'text-emerald-500';
    if (importance >= 0.15) return 'text-yellow-500';
    return 'text-muted-foreground';
  }, []);

  return {
    predict,
    result,
    isLoading,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
    getImportanceColor
  };
}

export default useRandomForest;
