/**
 * useERPDynamicHelp - Hook para ayuda dinámica contextual con IA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  relevance: number;
  source?: 'regulation' | 'best_practice' | 'tutorial' | 'faq';
  regulation_ref?: string;
}

export interface ContextualHelp {
  topic: string;
  summary: string;
  details: string;
  related_topics: string[];
  examples?: Array<{
    title: string;
    description: string;
  }>;
  regulations?: Array<{
    code: string;
    name: string;
    summary: string;
  }>;
}

export interface HelpContext {
  current_screen: string;
  current_action?: string;
  selected_account?: string;
  error_context?: string;
}

export function useERPDynamicHelp() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHelp, setCurrentHelp] = useState<ContextualHelp | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<HelpTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, ContextualHelp>>(new Map());

  const getContextualHelp = useCallback(async (
    context: HelpContext
  ) => {
    const cacheKey = JSON.stringify(context);
    
    // Check cache
    if (cacheRef.current.has(cacheKey)) {
      setCurrentHelp(cacheRef.current.get(cacheKey)!);
      return cacheRef.current.get(cacheKey);
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-dynamic-help',
        {
          body: {
            action: 'contextual_help',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.help) {
        const help = data.help as ContextualHelp;
        cacheRef.current.set(cacheKey, help);
        setCurrentHelp(help);
        return help;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchHelp = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestedTopics([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-dynamic-help',
        {
          body: {
            action: 'search_help',
            query
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.topics) {
        setSuggestedTopics(data.topics);
        return data.topics;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRegulationInfo = useCallback(async (regulationCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-dynamic-help',
        {
          body: {
            action: 'regulation_info',
            regulation_code: regulationCode
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.regulation;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccountHelp = useCallback(async (accountCode: string) => {
    return getContextualHelp({
      current_screen: 'chart_of_accounts',
      selected_account: accountCode
    });
  }, [getContextualHelp]);

  const getErrorHelp = useCallback(async (errorMessage: string) => {
    return getContextualHelp({
      current_screen: 'error',
      error_context: errorMessage
    });
  }, [getContextualHelp]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Clear cache on unmount
  useEffect(() => {
    return () => {
      cacheRef.current.clear();
    };
  }, []);

  return {
    isLoading,
    currentHelp,
    suggestedTopics,
    error,
    getContextualHelp,
    searchHelp,
    getRegulationInfo,
    getAccountHelp,
    getErrorHelp,
    clearCache
  };
}

export default useERPDynamicHelp;
