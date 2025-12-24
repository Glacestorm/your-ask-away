import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  image_credit: string | null;
  source_url: string;
  source_name: string;
  category: string;
  tags: string[];
  published_at: string;
  fetched_at: string;
  is_featured: boolean;
  ai_summary: string;
  relevance_score: number;
  read_count: number;
}

interface UseNewsArticlesOptions {
  category?: string;
  searchQuery?: string;
  limit?: number;
}

const isLikelyLogoOrIcon = (url: string) => {
  const u = url.toLowerCase();
  return (
    u.includes('favicon') ||
    u.includes('apple-touch-icon') ||
    u.includes('/icon') ||
    u.includes('sprite')
  );
};

const sanitizeImageUrl = (url?: string | null) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return '';
  if (trimmed.toLowerCase().endsWith('.svg')) return '';
  if (isLikelyLogoOrIcon(trimmed)) return '';
  return trimmed;
};

const normalizeForDedupe = (url: string) => {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return url.split('#')[0].split('?')[0];
  }
};

const dedupeImages = (items: NewsArticle[]): NewsArticle[] => {
  const seen = new Set<string>();

  const shouldDedupe = (cleanedUrl: string) => {
    try {
      const u = new URL(cleanedUrl);
      if (u.hostname === 'images.unsplash.com') return false;
      return true;
    } catch {
      return true;
    }
  };

  return items.map((a) => {
    const cleaned = sanitizeImageUrl(a.image_url);
    if (!cleaned) return { ...a, image_url: '' };

    if (!shouldDedupe(cleaned)) {
      return { ...a, image_url: cleaned };
    }

    const key = normalizeForDedupe(cleaned);

    if (seen.has(key)) {
      return { ...a, image_url: '' };
    }

    seen.add(key);
    return { ...a, image_url: cleaned };
  });
};

export function useNewsArticles(options: UseNewsArticlesOptions = {}) {
  const { category = 'Todos', searchQuery = '', limit = 20 } = options;
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(null);
  const { toast } = useToast();
  
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

  const fetchArticles = useCallback(async () => {
    const startTime = Date.now();
    try {
      setStatus('loading');
      setError(null);

      let query = supabase
        .from('news_articles')
        .select('*')
        .order('relevance_score', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (category && category !== 'Todos') {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,ai_summary.ilike.%${searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const rawArticlesData = (data || []) as NewsArticle[];
      const articlesData = dedupeImages(rawArticlesData);

      const featured = articlesData.find(a => a.is_featured);
      if (featured) {
        setFeaturedArticle(featured);
        setArticles(articlesData.filter(a => !a.is_featured));
      } else if (articlesData.length > 0) {
        const sorted = [...articlesData].sort((a, b) => b.relevance_score - a.relevance_score);
        setFeaturedArticle(sorted[0]);
        setArticles(articlesData.filter(a => a.id !== sorted[0].id));
      } else {
        setFeaturedArticle(null);
        setArticles([]);
      }
      
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useNewsArticles', 'fetchArticles', 'success', Date.now() - startTime);

    } catch (err: unknown) {
      console.error('Error fetching news:', err);
      const parsedErr = parseError(err);
      const kbError = createKBError('FETCH_NEWS_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useNewsArticles', 'fetchArticles', 'error', Date.now() - startTime, kbError);
    }
  }, [category, searchQuery, limit]);

  const refreshNews = useCallback(async () => {
    try {
      toast({
        title: 'Actualizando noticias...',
        description: 'Buscando las últimas noticias relevantes',
      });

      const { data, error } = await supabase.functions.invoke('fetch-sector-news');
      
      if (error) throw error;

      toast({
        title: 'Noticias actualizadas',
        description: data?.message || 'Se han cargado las últimas noticias',
      });

      await fetchArticles();
    } catch (err: unknown) {
      console.error('Error refreshing news:', err);
      toast({
        title: 'Error al actualizar',
        description: parseError(err).message,
        variant: 'destructive',
      });
    }
  }, [fetchArticles, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    const channel = supabase
      .channel('news-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles'
        },
        (payload) => {
          console.log('New news article:', payload.new);
          const incoming = payload.new as NewsArticle;
          const cleaned = sanitizeImageUrl(incoming.image_url);
          const key = cleaned ? normalizeForDedupe(cleaned) : '';

          setArticles(prev => {
            const existing = new Set<string>();
            for (const a of prev) {
              const pCleaned = sanitizeImageUrl(a.image_url);
              const pKey = pCleaned ? normalizeForDedupe(pCleaned) : '';
              if (pKey) existing.add(pKey);
            }

            const nextIncoming: NewsArticle = {
              ...incoming,
              image_url: key && existing.has(key) ? '' : cleaned,
            };

            return [nextIncoming, ...prev];
          });

          toast({
            title: '📰 Nueva noticia',
            description: incoming.title.substring(0, 60) + '...',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const getCategories = useCallback(() => {
    const cats = new Set(articles.map(a => a.category));
    if (featuredArticle) cats.add(featuredArticle.category);
    return ['Todos', ...Array.from(cats)];
  }, [articles, featuredArticle]);

  const getPopularTags = useCallback(() => {
    const tagCount: Record<string, number> = {};
    [...articles, featuredArticle].filter(Boolean).forEach(article => {
      (article?.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [articles, featuredArticle]);

  return {
    articles,
    featuredArticle,
    refreshNews,
    refetch: fetchArticles,
    getCategories,
    getPopularTags,
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
