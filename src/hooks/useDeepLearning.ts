import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DeepLearningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setIsLoading(true);
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
      toast.success(`Predicció ${modelArchitecture.toUpperCase()} completada`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en Deep Learning';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
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
    isLoading,
    error,
    getUncertaintyLevel,
    getArchitectureIcon
  };
}

export default useDeepLearning;
