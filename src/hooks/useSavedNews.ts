import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useSavedNews(articleId?: string) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if specific article is saved
  useEffect(() => {
    if (articleId && user) {
      checkIfSaved();
    }
  }, [articleId, user]);

  const checkIfSaved = async () => {
    if (!user || !articleId) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_news')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .maybeSingle();

      if (!error) {
        setIsSaved(!!data);
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const toggleSave = useCallback(async () => {
    if (!user) {
      toast.error(t('news.saved.loginRequired') || 'Please login to save articles');
      return;
    }

    if (!articleId) return;

    setIsLoading(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_news')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);

        if (error) throw error;
        setIsSaved(false);
        toast.success(t('news.saved.removed') || 'Removed from saved');
      } else {
        const { error } = await supabase
          .from('saved_news')
          .insert({ user_id: user.id, article_id: articleId });

        if (error) throw error;
        setIsSaved(true);
        toast.success(t('news.saved.added') || 'Saved article');
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      toast.error(t('news.saved.error') || 'Error saving article');
    } finally {
      setIsLoading(false);
    }
  }, [user, articleId, isSaved, t]);

  const fetchSavedArticles = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('saved_news')
        .select('article_id')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      
      const ids = (data || []).map(item => item.article_id);
      setSavedArticleIds(ids);
      return ids;
    } catch (err) {
      console.error('Error fetching saved articles:', err);
      return [];
    }
  }, [user]);

  const isArticleSaved = useCallback((id: string) => {
    return savedArticleIds.includes(id);
  }, [savedArticleIds]);

  return {
    isSaved,
    isLoading,
    toggleSave,
    fetchSavedArticles,
    savedArticleIds,
    isArticleSaved,
  };
}
