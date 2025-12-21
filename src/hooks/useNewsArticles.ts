import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useNewsArticles(options: UseNewsArticlesOptions = {}) {
  const { category = 'Todos', searchQuery = '', limit = 20 } = options;
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('news_articles')
        .select('*')
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

      const articlesData = (data || []) as NewsArticle[];
      setArticles(articlesData.filter(a => !a.is_featured));
      
      // Get featured article
      const featured = articlesData.find(a => a.is_featured);
      if (featured) {
        setFeaturedArticle(featured);
      } else if (articlesData.length > 0) {
        // Use highest relevance as featured if none marked
        const sorted = [...articlesData].sort((a, b) => b.relevance_score - a.relevance_score);
        setFeaturedArticle(sorted[0]);
        setArticles(articlesData.filter(a => a.id !== sorted[0].id));
      }

    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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
    } catch (err: any) {
      console.error('Error refreshing news:', err);
      toast({
        title: 'Error al actualizar',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [fetchArticles, toast]);

  // Initial fetch
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Subscribe to realtime updates
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
          const newArticle = payload.new as NewsArticle;
          setArticles(prev => [newArticle, ...prev]);
          toast({
            title: '📰 Nueva noticia',
            description: newArticle.title.substring(0, 60) + '...',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Get unique categories
  const getCategories = useCallback(() => {
    const cats = new Set(articles.map(a => a.category));
    if (featuredArticle) cats.add(featuredArticle.category);
    return ['Todos', ...Array.from(cats)];
  }, [articles, featuredArticle]);

  // Get popular tags
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
    isLoading,
    error,
    refreshNews,
    refetch: fetchArticles,
    getCategories,
    getPopularTags,
  };
}
