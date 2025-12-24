import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface ProductRecommendationsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  category: string;
  relevance_score: number;
  estimated_value: number;
  conversion_probability: number;
  reasoning: string[];
  next_best_action: string;
  timing_recommendation: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  cross_sell_opportunities: string[];
}

export interface RecommendationContext {
  company_profile: {
    sector: string;
    size: string;
    lifecycle_stage: string;
  };
  behavioral_signals: string[];
  similar_companies_adopted: string[];
  current_products: string[];
}

export function useProductRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [context, setContext] = useState<RecommendationContext | null>(null);
  // === ESTADO KB ===
  const [error, setError] = useState<ProductRecommendationsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const getRecommendations = useCallback(async (
    companyId: string,
    options?: {
      max_recommendations?: number;
      include_cross_sell?: boolean;
      min_relevance?: number;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('product-recommendations', {
        body: { 
          companyId,
          max_recommendations: options?.max_recommendations || 5,
          include_cross_sell: options?.include_cross_sell ?? true,
          min_relevance: options?.min_relevance || 0.6
        }
      });

      if (fnError) throw fnError;

      setRecommendations(data.recommendations || []);
      setContext(data.context || null);
      setLastRefresh(new Date());
      
      toast.success(`${data.recommendations?.length || 0} recomanacions generades`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generant recomanacions';
      setError({
        code: 'RECOMMENDATIONS_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTimingLabel = useCallback((timing: ProductRecommendation['timing_recommendation']): string => {
    const labels = {
      'immediate': 'Ara mateix',
      'short_term': '1-3 mesos',
      'medium_term': '3-6 mesos',
      'long_term': '6-12 mesos'
    };
    return labels[timing];
  }, []);

  return {
    getRecommendations,
    recommendations,
    context,
    isLoading,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
    getTimingLabel
  };
}

export default useProductRecommendations;
