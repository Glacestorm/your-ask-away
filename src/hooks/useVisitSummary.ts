import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

export interface VisitSummary {
  summary: string;
  key_points: string[];
  action_items: ActionItem[];
  sentiment: 'positive' | 'neutral' | 'negative';
  opportunity_score: number;
  follow_up_priority: 'high' | 'medium' | 'low';
  detected_needs: string[];
  recommended_products: string[];
  next_steps: string[];
  risk_factors: string[];
}

export interface ActionItem {
  description: string;
  responsible: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  category: 'follow_up' | 'documentation' | 'proposal' | 'internal' | 'external';
}

export function useVisitSummary() {
  const [summary, setSummary] = useState<VisitSummary | null>(null);
  
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

  const generateSummary = useCallback(async (visitSheetId: string) => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('summarize-visit', {
        body: { visitSheetId }
      });

      if (fnError) throw fnError;

      setSummary(data);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useVisitSummary', 'generateSummary', 'success', Date.now() - startTime);
      toast.success('Resum generat correctament');
      return data;
    } catch (err) {
      const kbError = createKBError('GENERATE_SUMMARY_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useVisitSummary', 'generateSummary', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return null;
    }
  }, []);

  const generateBulkSummaries = useCallback(async (visitSheetIds: string[]) => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      const results = await Promise.all(
        visitSheetIds.map(id => 
          supabase.functions.invoke('summarize-visit', { body: { visitSheetId: id } })
        )
      );

      const summaries = results.filter(r => !r.error).map(r => r.data);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useVisitSummary', 'generateBulkSummaries', 'success', Date.now() - startTime);
      toast.success(`${summaries.length}/${visitSheetIds.length} resums generats`);
      return summaries;
    } catch (err) {
      const kbError = createKBError('BULK_SUMMARY_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useVisitSummary', 'generateBulkSummaries', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return [];
    }
  }, []);

  const getSentimentColor = useCallback((sentiment: VisitSummary['sentiment']): string => {
    const colors = {
      'positive': 'text-green-500',
      'neutral': 'text-yellow-500',
      'negative': 'text-red-500'
    };
    return colors[sentiment];
  }, []);

  return {
    generateSummary,
    generateBulkSummaries,
    summary,
    getSentimentColor,
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

export default useVisitSummary;
