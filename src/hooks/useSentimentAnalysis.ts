import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SentimentAnalysis, SentimentType } from '@/types/satisfaction';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

export type SentimentAnalysisError = KBError;

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
  }, []);

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
    setStatus('loading');
    const startTime = new Date();
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-sentiment', {
        body: params
      });

      if (invokeError) {
        const kbError = parseError(invokeError);
        setError(kbError);
        setStatus('error');
        collectTelemetry({
          hookName: 'useSentimentAnalysis',
          operationName: 'analyzeSentiment',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
        });
        throw invokeError;
      }
      
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setStatus('success');
      setError(null);
      
      collectTelemetry({
        hookName: 'useSentimentAnalysis',
        operationName: 'analyzeSentiment',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount
      });
      
      if (params.save_result && params.company_id) {
        queryClient.invalidateQueries({ queryKey: ['sentiment-analysis', params.company_id] });
      }

      return data.result as SentimentResult;
    } catch (err) {
      console.error('Error analyzing sentiment:', err);
      toast.error('Error al analizar sentimiento');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [queryClient, retryCount]);

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
    // === KB 2.0 RETURN ===
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
    reset
  };
}

export type BulkSentimentAnalysisError = KBError;

// Hook for bulk sentiment analysis
export function useBulkSentimentAnalysis() {
  const [progress, setProgress] = useState({ total: 0, completed: 0, current: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  }, []);

  const analyzeVisitNotes = useCallback(async (visitIds: string[]) => {
    setIsProcessing(true);
    setStatus('loading');
    setError(null);
    setProgress({ total: visitIds.length, completed: 0, current: '' });
    const startTime = new Date();

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
        const kbError = parseError(err);
        setError(kbError);
        console.error(`Error analyzing visit ${visitId}:`, err);
      }

      setProgress(prev => ({ ...prev, completed: i + 1 }));
    }

    setIsProcessing(false);
    setLastRefresh(new Date());
    setLastSuccess(new Date());
    setStatus('success');
    
    collectTelemetry({
      hookName: 'useBulkSentimentAnalysis',
      operationName: 'analyzeVisitNotes',
      startTime,
      endTime: new Date(),
      durationMs: Date.now() - startTime.getTime(),
      status: 'success',
      retryCount,
      metadata: { processedCount: results.length }
    });
    
    toast.success(`Análisis completado: ${results.length} visitas procesadas`);
    return results;
  }, [retryCount]);

  return {
    analyzeVisitNotes,
    isProcessing,
    progress,
    // === KB 2.0 RETURN ===
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
    reset
  };
}

export default useSentimentAnalysis;
