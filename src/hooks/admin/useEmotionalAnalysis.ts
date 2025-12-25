import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface EmotionResult {
  emotion: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  sentiment_score: number;
  emotions_detected: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    trust: number;
  };
  key_phrases: string[];
  recommendations: string[];
}

export interface EmotionalAnalysisContext {
  entityId: string;
  entityType: 'ticket' | 'email' | 'chat' | 'review' | 'feedback';
  text: string;
  metadata?: Record<string, unknown>;
}

export interface EmotionalTrend {
  period: string;
  avg_sentiment: number;
  emotion_distribution: Record<string, number>;
  volume: number;
}

// === HOOK ===
export function useEmotionalAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [trends, setTrends] = useState<EmotionalTrend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === ANALYZE TEXT ===
  const analyzeText = useCallback(async (context: EmotionalAnalysisContext): Promise<EmotionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis', {
        body: {
          action: 'analyze',
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setResult(data.data);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing emotions';
      setError(message);
      console.error('[useEmotionalAnalysis] analyzeText error:', err);
      toast.error('Error en análisis emocional');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === BATCH ANALYZE ===
  const batchAnalyze = useCallback(async (texts: EmotionalAnalysisContext[]): Promise<EmotionResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis', {
        body: {
          action: 'batch_analyze',
          texts
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.results) {
        setLastRefresh(new Date());
        return data.results;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error in batch analysis';
      setError(message);
      console.error('[useEmotionalAnalysis] batchAnalyze error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET TRENDS ===
  const fetchTrends = useCallback(async (entityType: string, days: number = 30): Promise<EmotionalTrend[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis', {
        body: {
          action: 'get_trends',
          entityType,
          days
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.trends) {
        setTrends(data.trends);
        return data.trends;
      }

      return [];
    } catch (err) {
      console.error('[useEmotionalAnalysis] fetchTrends error:', err);
      return [];
    }
  }, []);

  // === GET SENTIMENT COLOR ===
  const getSentimentColor = useCallback((score: number): string => {
    if (score >= 0.6) return 'text-green-500';
    if (score >= 0.4) return 'text-yellow-500';
    if (score >= 0.2) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, []);

  return {
    isLoading,
    result,
    trends,
    error,
    lastRefresh,
    analyzeText,
    batchAnalyze,
    fetchTrends,
    getSentimentColor,
  };
}

export default useEmotionalAnalysis;
