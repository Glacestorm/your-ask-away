import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

export function useSavedNews(articleId?: string) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  
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

    const startTime = Date.now();
    setStatus('loading');
    setError(null);
    
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
      
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useSavedNews', 'toggleSave', 'success', Date.now() - startTime);
    } catch (err) {
      console.error('Error toggling save:', err);
      const kbError = createKBError('TOGGLE_SAVE_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useSavedNews', 'toggleSave', 'error', Date.now() - startTime, kbError);
      toast.error(t('news.saved.error') || 'Error saving article');
    }
  }, [user, articleId, isSaved, t]);

  const fetchSavedArticles = useCallback(async () => {
    if (!user) return [];

    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('saved_news')
        .select('article_id')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      
      const ids = (data || []).map(item => item.article_id);
      setSavedArticleIds(ids);
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      collectTelemetry('useSavedNews', 'fetchSavedArticles', 'success', Date.now() - startTime);
      return ids;
    } catch (err) {
      console.error('Error fetching saved articles:', err);
      collectTelemetry('useSavedNews', 'fetchSavedArticles', 'error', Date.now() - startTime);
      return [];
    }
  }, [user]);

  const isArticleSaved = useCallback((id: string) => {
    return savedArticleIds.includes(id);
  }, [savedArticleIds]);

  return {
    isSaved,
    toggleSave,
    fetchSavedArticles,
    savedArticleIds,
    isArticleSaved,
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
