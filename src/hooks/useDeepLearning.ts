import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

export interface LayerInfo {
  name: string;
  units: number;
  activation: string;
  params: number;
}

export interface FeatureGradient {
  feature: string;
  gradient: number;
  saliency: number;
}

export interface IntegratedGradient {
  feature: string;
  attribution: number;
}

export interface DeepLearningResult {
  prediction: number | number[];
  confidence: number;
  architecture: {
    type: string;
    layers: LayerInfo[];
    total_params: number;
    trainable_params: number;
  };
  activations: {
    layer_outputs: { layer: string; shape: number[]; mean: number; std: number }[];
    attention_weights?: number[][];
    hidden_states?: number[][];
  };
  gradients: {
    feature_gradients: FeatureGradient[];
    integrated_gradients: IntegratedGradient[];
  };
  uncertainty: {
    epistemic: number;
    aleatoric: number;
    total: number;
    prediction_interval: { lower: number; upper: number };
  };
  training_metrics: {
    loss: number;
    val_loss: number;
    epochs: number;
    batch_size: number;
    learning_rate: number;
  };
}

export function useDeepLearning() {
  const [result, setResult] = useState<DeepLearningResult | null>(null);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED STATES ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const predict = useCallback(async (
    modelArchitecture: 'mlp' | 'lstm' | 'transformer' | 'autoencoder',
    task: 'classification' | 'regression' | 'anomaly_detection' | 'time_series',
    features: Record<string, number>,
    options?: {
      sequenceData?: number[][];
      companyId?: string;
      layers?: number[];
    }
  ) => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('deep-learning-predict', {
        body: { 
          modelArchitecture, 
          task, 
          features,
          sequenceData: options?.sequenceData,
          companyId: options?.companyId,
          layers: options?.layers || [128, 64, 32]
        }
      });

      if (fnError) throw fnError;

      setResult(data);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useDeepLearning', 'predict', 'success', Date.now() - startTime);
      toast.success(`Predicció ${modelArchitecture.toUpperCase()} completada`);
      return data;
    } catch (err) {
      const kbError = createKBError('DEEP_LEARNING_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useDeepLearning', 'predict', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return null;
    }
  }, []);

  const getUncertaintyLevel = useCallback((uncertainty: number): 'low' | 'medium' | 'high' => {
    if (uncertainty < 0.1) return 'low';
    if (uncertainty < 0.3) return 'medium';
    return 'high';
  }, []);

  const getArchitectureIcon = useCallback((type: string): string => {
    const icons: Record<string, string> = {
      mlp: '🧠',
      lstm: '🔄',
      transformer: '⚡',
      autoencoder: '🔬'
    };
    return icons[type] || '🤖';
  }, []);

  return {
    predict,
    result,
    getUncertaintyLevel,
    getArchitectureIcon,
    // === KB 2.0 STATE ===
    status,
    error,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
  };
}

export default useDeepLearning;
