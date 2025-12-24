import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

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
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [context, setContext] = useState<RecommendationContext | null>(null);
  
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

  const getRecommendations = useCallback(async (
    companyId: string,
    options?: {
      max_recommendations?: number;
      include_cross_sell?: boolean;
      min_relevance?: number;
    }
  ) => {
    const startTime = Date.now();
    setStatus('loading');
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
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useProductRecommendations', 'getRecommendations', 'success', Date.now() - startTime);
      
      toast.success(`${data.recommendations?.length || 0} recomanacions generades`);
      return data;
    } catch (err) {
      const kbError = createKBError('RECOMMENDATIONS_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useProductRecommendations', 'getRecommendations', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return null;
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
    getTimingLabel,
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

export default useProductRecommendations;
