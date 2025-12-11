import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<VisitSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async (visitSheetId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('summarize-visit', {
        body: { visitSheetId }
      });

      if (fnError) throw fnError;

      setSummary(data);
      toast.success('Resum generat correctament');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generant resum';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateBulkSummaries = useCallback(async (visitSheetIds: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        visitSheetIds.map(id => 
          supabase.functions.invoke('summarize-visit', { body: { visitSheetId: id } })
        )
      );

      const summaries = results.filter(r => !r.error).map(r => r.data);
      toast.success(`${summaries.length}/${visitSheetIds.length} resums generats`);
      return summaries;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en generació massiva';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
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
    isLoading,
    error,
    getSentimentColor
  };
}

export default useVisitSummary;
