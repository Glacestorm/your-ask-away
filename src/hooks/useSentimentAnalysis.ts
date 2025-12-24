import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SentimentAnalysis, SentimentType } from '@/types/satisfaction';

// === ERROR TIPADO KB ===
export interface SentimentAnalysisError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface AnalyzeSentimentParams {
  content: string;
  company_id?: string;
  source_type?: string;
  source_id?: string;
  gestor_id?: string;
  save_result?: boolean;
}

interface SentimentResult {
  sentiment: SentimentType;
  sentiment_score: number;
  confidence: number;
  key_phrases: string[];
  emotions: Record<string, number>;
  topics: string[];
  action_required: boolean;
  summary?: string;
}

export function useSentimentAnalysis(companyId?: string) {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // === ESTADO KB ===
  const [error, setError] = useState<SentimentAnalysisError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // Fetch sentiment history for a company
  const { data: sentimentHistory, isLoading: loadingHistory, refetch } = useQuery({
    queryKey: ['sentiment-analysis', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SentimentAnalysis[];
    },
    enabled: !!companyId
  });

  // Analyze text sentiment
  const analyzeSentiment = useCallback(async (params: AnalyzeSentimentParams): Promise<SentimentResult | null> => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: params
      });

      if (error) {
        setError({ code: 'FETCH_SENTIMENT_HISTORY_ERROR', message: error.message, details: { originalError: String(error) } });
        throw error;
      }
      
      setLastRefresh(new Date());
      
      if (params.save_result && params.company_id) {
        queryClient.invalidateQueries({ queryKey: ['sentiment-analysis', params.company_id] });
      }

      return data.result as SentimentResult;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast.error('Error al analizar sentimiento');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [queryClient]);

  // Calculate average sentiment for the company
  const averageSentiment = sentimentHistory && sentimentHistory.length > 0
    ? {
        score: sentimentHistory.reduce((sum, s) => sum + s.sentiment_score, 0) / sentimentHistory.length,
        confidence: sentimentHistory.reduce((sum, s) => sum + s.confidence, 0) / sentimentHistory.length,
        positiveCount: sentimentHistory.filter(s => s.sentiment === 'positive').length,
        neutralCount: sentimentHistory.filter(s => s.sentiment === 'neutral').length,
        negativeCount: sentimentHistory.filter(s => s.sentiment === 'negative').length,
        mixedCount: sentimentHistory.filter(s => s.sentiment === 'mixed').length,
        actionRequiredCount: sentimentHistory.filter(s => s.action_required).length
      }
    : null;

  // Get sentiment trend (last 30 days vs previous 30 days)
  const sentimentTrend = useCallback(() => {
    if (!sentimentHistory || sentimentHistory.length < 2) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent = sentimentHistory.filter(s => new Date(s.created_at) >= thirtyDaysAgo);
    const previous = sentimentHistory.filter(
      s => new Date(s.created_at) >= sixtyDaysAgo && new Date(s.created_at) < thirtyDaysAgo
    );

    if (recent.length === 0 || previous.length === 0) return null;

    const recentAvg = recent.reduce((sum, s) => sum + s.sentiment_score, 0) / recent.length;
    const previousAvg = previous.reduce((sum, s) => sum + s.sentiment_score, 0) / previous.length;

    return {
      current: recentAvg,
      previous: previousAvg,
      change: recentAvg - previousAvg,
      improving: recentAvg > previousAvg
    };
  }, [sentimentHistory]);

  return {
    sentimentHistory,
    loadingHistory,
    analyzeSentiment,
    isAnalyzing,
    averageSentiment,
    sentimentTrend: sentimentTrend(),
    refetch,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
}

// === ERROR TIPADO KB BULK ===
export interface BulkSentimentAnalysisError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Hook for bulk sentiment analysis
export function useBulkSentimentAnalysis() {
  const [progress, setProgress] = useState({ total: 0, completed: 0, current: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  // === ESTADO KB ===
  const [error, setError] = useState<BulkSentimentAnalysisError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const analyzeVisitNotes = useCallback(async (visitIds: string[]) => {
    setIsProcessing(true);
    setError(null);
    setProgress({ total: visitIds.length, completed: 0, current: '' });

    const results: SentimentResult[] = [];

    for (let i = 0; i < visitIds.length; i++) {
      const visitId = visitIds[i];
      
      try {
        // Get visit data
        const { data: visit } = await supabase
          .from('visits')
          .select('id, company_id, notes, result, gestor_id')
          .eq('id', visitId)
          .single();

        if (visit?.notes) {
          setProgress(prev => ({ ...prev, current: `Analizando visita ${i + 1}...` }));
          
          const { data } = await supabase.functions.invoke('analyze-sentiment', {
            body: {
              content: visit.notes,
              company_id: visit.company_id,
              source_type: 'visit_notes',
              source_id: visit.id,
              gestor_id: visit.gestor_id,
              save_result: true
            }
          });

          if (data?.result) {
            results.push(data.result);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Error analyzing visit ${visitId}`;
        setError({ code: 'BULK_ANALYZE_ERROR', message, details: { visitId, originalError: String(err) } });
        console.error(`Error analyzing visit ${visitId}:`, err);
      }

      setProgress(prev => ({ ...prev, completed: i + 1 }));
    }

    setIsProcessing(false);
    setLastRefresh(new Date());
    toast.success(`Análisis completado: ${results.length} visitas procesadas`);
    return results;
  }, []);

  return {
    analyzeVisitNotes,
    isProcessing,
    progress,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

export default useSentimentAnalysis;
