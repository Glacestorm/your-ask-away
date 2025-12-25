import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Recommendation {
  id: string;
  type: 'product' | 'action' | 'content' | 'offer' | 'upsell' | 'cross_sell';
  title: string;
  description: string;
  confidence: number;
  relevance_score: number;
  reasoning: string;
  target_entity_id: string;
  target_entity_type: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
}

export interface RecommendationConfig {
  enabled: boolean;
  algorithms: string[];
  min_confidence: number;
  max_recommendations: number;
  personalization_level: 'low' | 'medium' | 'high';
  include_reasoning: boolean;
}

export interface RecommendationFeedback {
  recommendation_id: string;
  accepted: boolean;
  rating?: number;
  feedback_text?: string;
}

export interface RecommendationMetrics {
  total_generated: number;
  acceptance_rate: number;
  avg_confidence: number;
  conversion_rate: number;
  revenue_attributed: number;
}

// === HOOK ===
export function useRecommendationEngine() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [config, setConfig] = useState<RecommendationConfig | null>(null);
  const [metrics, setMetrics] = useState<RecommendationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === GET RECOMMENDATIONS ===
  const getRecommendations = useCallback(async (
    entityId: string,
    entityType: string,
    options?: { types?: string[]; limit?: number }
  ): Promise<Recommendation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommendation-engine', {
        body: { action: 'get_recommendations', entityId, entityType, options }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.recommendations) {
        setRecommendations(data.recommendations);
        return data.recommendations;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error getting recommendations';
      setError(message);
      console.error('[useRecommendationEngine] getRecommendations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SUBMIT FEEDBACK ===
  const submitFeedback = useCallback(async (feedback: RecommendationFeedback): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommendation-engine', {
        body: { action: 'submit_feedback', feedback }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setRecommendations(prev => 
          prev.filter(r => r.id !== feedback.recommendation_id)
        );
        toast.success(feedback.accepted ? 'Recomendación aceptada' : 'Feedback registrado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRecommendationEngine] submitFeedback error:', err);
      return false;
    }
  }, []);

  // === GET CONFIG ===
  const fetchConfig = useCallback(async (): Promise<RecommendationConfig | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommendation-engine', {
        body: { action: 'get_config' }
      });

      if (fnError) throw fnError;

      if (data?.config) {
        setConfig(data.config);
        return data.config;
      }

      return null;
    } catch (err) {
      console.error('[useRecommendationEngine] fetchConfig error:', err);
      return null;
    }
  }, []);

  // === UPDATE CONFIG ===
  const updateConfig = useCallback(async (updates: Partial<RecommendationConfig>): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommendation-engine', {
        body: { action: 'update_config', updates }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setConfig(prev => prev ? { ...prev, ...updates } : null);
        toast.success('Configuración actualizada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRecommendationEngine] updateConfig error:', err);
      return false;
    }
  }, []);

  // === GET METRICS ===
  const fetchMetrics = useCallback(async (days: number = 30): Promise<RecommendationMetrics | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommendation-engine', {
        body: { action: 'get_metrics', days }
      });

      if (fnError) throw fnError;

      if (data?.metrics) {
        setMetrics(data.metrics);
        return data.metrics;
      }

      return null;
    } catch (err) {
      console.error('[useRecommendationEngine] fetchMetrics error:', err);
      return null;
    }
  }, []);

  // === TRAIN MODEL ===
  const trainModel = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommendation-engine', {
        body: { action: 'train_model' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Modelo entrenado correctamente');
        return { success: true, message: data.message || 'Modelo entrenado' };
      }

      return { success: false, message: 'Error en entrenamiento' };
    } catch (err) {
      console.error('[useRecommendationEngine] trainModel error:', err);
      toast.error('Error al entrenar modelo');
      return { success: false, message: 'Error al entrenar modelo' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EXPLAIN RECOMMENDATION ===
  const explainRecommendation = useCallback(async (recommendationId: string): Promise<{
    factors: Array<{ name: string; weight: number; description: string }>;
    similar_cases: number;
    explanation_text: string;
  } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommendation-engine', {
        body: { action: 'explain', recommendationId }
      });

      if (fnError) throw fnError;

      return data?.explanation || null;
    } catch (err) {
      console.error('[useRecommendationEngine] explainRecommendation error:', err);
      return null;
    }
  }, []);

  // === GET CONFIDENCE COLOR ===
  const getConfidenceColor = useCallback((confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    if (confidence >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  // === GET TYPE ICON ===
  const getTypeIcon = useCallback((type: string): string => {
    const icons: Record<string, string> = {
      product: '📦',
      action: '⚡',
      content: '📄',
      offer: '🎁',
      upsell: '📈',
      cross_sell: '🔄'
    };
    return icons[type] || '💡';
  }, []);

  return {
    recommendations,
    config,
    metrics,
    isLoading,
    error,
    getRecommendations,
    submitFeedback,
    fetchConfig,
    updateConfig,
    fetchMetrics,
    trainModel,
    explainRecommendation,
    getConfidenceColor,
    getTypeIcon,
  };
}

export default useRecommendationEngine;
