import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevance_score?: number;
  last_updated: string;
  view_count: number;
  helpful_count: number;
}

export interface SearchResult {
  article: KnowledgeArticle;
  similarity: number;
  matched_chunks: string[];
  answer_snippet?: string;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{ title: string; id: string; relevance: number }>;
  confidence: number;
  follow_up_questions: string[];
}

// === HOOK ===
export function useKnowledgeBaseRAG() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === SEMANTIC SEARCH ===
  const semanticSearch = useCallback(async (query: string, limit: number = 5): Promise<SearchResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'search', query, limit }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.results) {
        setResults(data.results);
        return data.results;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search error';
      setError(message);
      console.error('[useKnowledgeBaseRAG] semanticSearch error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ASK QUESTION (RAG) ===
  const askQuestion = useCallback(async (question: string): Promise<RAGResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'ask', question }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.response) {
        setResponse(data.response);
        return data.response;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error getting answer';
      setError(message);
      console.error('[useKnowledgeBaseRAG] askQuestion error:', err);
      toast.error('Error al consultar base de conocimiento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ADD ARTICLE ===
  const addArticle = useCallback(async (article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'add_article', article }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.article) {
        setArticles(prev => [...prev, data.article]);
        toast.success('Artículo añadido');
        return data.article;
      }

      return null;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] addArticle error:', err);
      toast.error('Error al añadir artículo');
      return null;
    }
  }, []);

  // === UPDATE ARTICLE ===
  const updateArticle = useCallback(async (id: string, updates: Partial<KnowledgeArticle>): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'update_article', id, updates }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        toast.success('Artículo actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] updateArticle error:', err);
      return false;
    }
  }, []);

  // === FETCH ARTICLES ===
  const fetchArticles = useCallback(async (category?: string): Promise<KnowledgeArticle[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'list_articles', category }
      });

      if (fnError) throw fnError;

      if (data?.articles) {
        setArticles(data.articles);
        return data.articles;
      }

      return [];
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] fetchArticles error:', err);
      return [];
    }
  }, []);

  // === REINDEX ===
  const reindexKnowledgeBase = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'reindex' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Base de conocimiento reindexada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] reindexKnowledgeBase error:', err);
      toast.error('Error al reindexar');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    response,
    articles,
    isLoading,
    error,
    semanticSearch,
    askQuestion,
    addArticle,
    updateArticle,
    fetchArticles,
    reindexKnowledgeBase,
  };
}

export default useKnowledgeBaseRAG;
