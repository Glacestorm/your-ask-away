import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  version: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  source_type: 'manual' | 'imported' | 'ai_generated';
  language: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface SearchResult {
  article: {
    id: string;
    title: string;
    content: string;
    summary?: string;
    category: string;
    tags: string[];
    view_count: number;
    helpful_count: number;
    updated_at?: string;
  };
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

export interface ArticleVersion {
  id: string;
  article_id: string;
  version: number;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  changed_by?: string;
  change_reason?: string;
  created_at: string;
}

export interface KBAnalytics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalHelpful: number;
  totalNotHelpful: number;
  helpfulnessRate: number;
  categoryDistribution: Record<string, number>;
  topArticles: Array<{
    id: string;
    title: string;
    category: string;
    view_count: number;
    helpful_count: number;
  }>;
  popularSearches: Array<{ query: string; count: number }>;
  recentFeedback: Array<{
    article_id: string;
    is_helpful: boolean;
    comment?: string;
    created_at: string;
  }>;
  searchesLast7Days: number;
}

// === HOOK ===
export function useKnowledgeBaseRAG() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [analytics, setAnalytics] = useState<KBAnalytics | null>(null);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === SEMANTIC SEARCH ===
  const semanticSearch = useCallback(async (query: string, limit: number = 10): Promise<SearchResult[]> => {
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

  // === FETCH ARTICLES ===
  const fetchArticles = useCallback(async (category?: string, status?: string): Promise<KnowledgeArticle[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'list_articles', category, status }
      });

      if (fnError) throw fnError;

      if (data?.articles) {
        setArticles(data.articles);
        if (data.categories) {
          setCategories(data.categories);
        }
        return data.articles;
      }

      return [];
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] fetchArticles error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET SINGLE ARTICLE ===
  const getArticle = useCallback(async (id: string): Promise<KnowledgeArticle | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'get_article', id }
      });

      if (fnError) throw fnError;

      return data?.article || null;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] getArticle error:', err);
      return null;
    }
  }, []);

  // === ADD ARTICLE ===
  const addArticle = useCallback(async (article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'add_article', article }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.article) {
        setArticles(prev => [data.article, ...prev]);
        toast.success('Artículo añadido correctamente');
        return data.article;
      }

      return null;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] addArticle error:', err);
      toast.error('Error al añadir artículo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE ARTICLE ===
  const updateArticle = useCallback(async (id: string, updates: Partial<KnowledgeArticle>): Promise<boolean> => {
    setIsLoading(true);
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
      toast.error('Error al actualizar artículo');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === DELETE ARTICLE ===
  const deleteArticle = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'delete_article', id }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setArticles(prev => prev.filter(a => a.id !== id));
        toast.success('Artículo eliminado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] deleteArticle error:', err);
      toast.error('Error al eliminar artículo');
      return false;
    }
  }, []);

  // === GET ARTICLE VERSIONS ===
  const getArticleVersions = useCallback(async (articleId: string): Promise<ArticleVersion[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'get_versions', id: articleId }
      });

      if (fnError) throw fnError;

      if (data?.versions) {
        setVersions(data.versions);
        return data.versions;
      }

      return [];
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] getArticleVersions error:', err);
      return [];
    }
  }, []);

  // === IMPORT DOCUMENT ===
  const importDocument = useCallback(async (
    content: string, 
    title?: string, 
    sourceType: 'pdf' | 'docx' | 'txt' | 'url' = 'txt',
    sourceUrl?: string
  ): Promise<KnowledgeArticle | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { 
          action: 'import_document', 
          document: { content, title, source_type: sourceType, source_url: sourceUrl }
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.article) {
        setArticles(prev => [data.article, ...prev]);
        toast.success('Documento importado correctamente');
        return data.article;
      }

      return null;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] importDocument error:', err);
      toast.error('Error al importar documento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EXPORT ALL ===
  const exportAll = useCallback(async (): Promise<KnowledgeArticle[] | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'export_all' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.articles) {
        return data.articles;
      }

      return null;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] exportAll error:', err);
      toast.error('Error al exportar');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SUBMIT FEEDBACK ===
  const submitFeedback = useCallback(async (
    articleId: string, 
    isHelpful: boolean, 
    comment?: string
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { 
          action: 'submit_feedback', 
          feedback: { article_id: articleId, is_helpful: isHelpful, comment }
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Gracias por tu feedback');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] submitFeedback error:', err);
      return false;
    }
  }, []);

  // === GET ANALYTICS ===
  const getAnalytics = useCallback(async (): Promise<KBAnalytics | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-base-rag', {
        body: { action: 'get_analytics' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.analytics) {
        setAnalytics(data.analytics);
        return data.analytics;
      }

      return null;
    } catch (err) {
      console.error('[useKnowledgeBaseRAG] getAnalytics error:', err);
      return null;
    } finally {
      setIsLoading(false);
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
        toast.success(`Base reindexada: ${data.indexedCount} artículos`);
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

  // === CLEAR STATE ===
  const clearResults = useCallback(() => {
    setResults([]);
    setResponse(null);
  }, []);

  return {
    // State
    results,
    response,
    articles,
    versions,
    analytics,
    categories,
    isLoading,
    error,
    // Search & Ask
    semanticSearch,
    askQuestion,
    // CRUD
    fetchArticles,
    getArticle,
    addArticle,
    updateArticle,
    deleteArticle,
    getArticleVersions,
    // Import/Export
    importDocument,
    exportAll,
    // Feedback & Analytics
    submitFeedback,
    getAnalytics,
    // Reindex
    reindexKnowledgeBase,
    // Utils
    clearResults,
  };
}

export default useKnowledgeBaseRAG;
