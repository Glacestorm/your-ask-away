import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface QueryResult {
  query: string;
  sql_generated: string;
  data: Record<string, unknown>[];
  columns: string[];
  row_count: number;
  execution_time_ms: number;
  explanation: string;
  visualization_type: 'table' | 'bar' | 'line' | 'pie' | 'metric';
  chart_config?: {
    x_axis?: string;
    y_axis?: string;
    group_by?: string;
  };
}

export interface QuerySuggestion {
  query: string;
  description: string;
  category: string;
}

export interface QueryHistory {
  id: string;
  query: string;
  result_summary: string;
  created_at: string;
}

// === HOOK ===
export function useNaturalLanguageQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === EXECUTE QUERY ===
  const executeQuery = useCallback(async (naturalQuery: string): Promise<QueryResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('natural-language-query', {
        body: {
          action: 'execute',
          query: naturalQuery
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.result) {
        setResult(data.result);
        return data.result;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error executing query';
      setError(message);
      console.error('[useNaturalLanguageQuery] executeQuery error:', err);
      toast.error('Error al ejecutar consulta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET SUGGESTIONS ===
  const fetchSuggestions = useCallback(async (context?: string): Promise<QuerySuggestion[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('natural-language-query', {
        body: {
          action: 'get_suggestions',
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.suggestions) {
        setSuggestions(data.suggestions);
        return data.suggestions;
      }

      return [];
    } catch (err) {
      console.error('[useNaturalLanguageQuery] fetchSuggestions error:', err);
      return [];
    }
  }, []);

  // === GET HISTORY ===
  const fetchHistory = useCallback(async (limit: number = 10): Promise<QueryHistory[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('natural-language-query', {
        body: {
          action: 'get_history',
          limit
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.history) {
        setHistory(data.history);
        return data.history;
      }

      return [];
    } catch (err) {
      console.error('[useNaturalLanguageQuery] fetchHistory error:', err);
      return [];
    }
  }, []);

  // === EXPLAIN QUERY ===
  const explainQuery = useCallback(async (naturalQuery: string): Promise<string | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('natural-language-query', {
        body: {
          action: 'explain',
          query: naturalQuery
        }
      });

      if (fnError) throw fnError;

      return data?.explanation || null;
    } catch (err) {
      console.error('[useNaturalLanguageQuery] explainQuery error:', err);
      return null;
    }
  }, []);

  // === CLEAR ===
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    suggestions,
    history,
    error,
    executeQuery,
    fetchSuggestions,
    fetchHistory,
    explainQuery,
    clearResult,
  };
}

export default useNaturalLanguageQuery;
