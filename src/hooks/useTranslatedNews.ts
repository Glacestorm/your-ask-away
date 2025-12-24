import { useState, useEffect, useRef, useCallback } from 'react';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { NewsArticle } from '@/hooks/useNewsArticles';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

export type TranslatedNewsError = KBError;

interface TranslatedNews {
  articles: NewsArticle[];
  isTranslating: boolean;
  // === KB 2.0 ===
  status: KBStatus;
  error: KBError | null;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  lastRefresh: Date | null;
  lastSuccess: Date | null;
  retryCount: number;
  clearError: () => void;
}

export function useTranslatedNews(originalArticles: NewsArticle[]): TranslatedNews {
  const { language } = useLanguage();
  const { translateBatchAsync } = useCMSTranslation();
  const [translatedArticles, setTranslatedArticles] = useState<NewsArticle[]>(originalArticles);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const lastLanguageRef = useRef<string>(language);
  const lastArticlesRef = useRef<string>('');

  // === KB 2.0 COMPUTED ===
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
    const articlesKey = originalArticles.map(a => a.id).join(',');
    
    // Skip if nothing changed
    if (lastLanguageRef.current === language && lastArticlesRef.current === articlesKey) {
      return;
    }
    
    lastLanguageRef.current = language;
    lastArticlesRef.current = articlesKey;

    // If Spanish, use originals directly
    if (language === 'es') {
      setTranslatedArticles(originalArticles);
      setIsTranslating(false);
      setStatus('success');
      return;
    }

    // If no articles, nothing to translate
    if (originalArticles.length === 0) {
      setTranslatedArticles([]);
      setIsTranslating(false);
      setStatus('success');
      return;
    }

    const translateAll = async () => {
      const startTime = Date.now();
      setIsTranslating(true);
      setStatus('loading');
      setError(null);

      try {
        // Collect all texts to translate in batches
        const textsToTranslate: string[] = [];
        const textIndexes: { articleIndex: number; field: 'title' | 'ai_summary' | 'category' }[] = [];
        
        originalArticles.forEach((article, articleIndex) => {
          if (article.title) {
            textsToTranslate.push(article.title);
            textIndexes.push({ articleIndex, field: 'title' });
          }
          if (article.ai_summary) {
            textsToTranslate.push(article.ai_summary);
            textIndexes.push({ articleIndex, field: 'ai_summary' });
          }
          if (article.category) {
            textsToTranslate.push(article.category);
            textIndexes.push({ articleIndex, field: 'category' });
          }
        });
        
        // Batch translate all texts at once
        const translatedTexts = await translateBatchAsync(textsToTranslate, language, 'es');
        
        // Reconstruct articles with translations
        const newArticles = originalArticles.map(article => ({ ...article }));
        
        translatedTexts.forEach((translated, i) => {
          const { articleIndex, field } = textIndexes[i];
          (newArticles[articleIndex] as any)[field] = translated;
        });
        
        setTranslatedArticles(newArticles);
        setStatus('success');
        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setRetryCount(0);
        collectTelemetry('useTranslatedNews', 'translateAll', 'success', Date.now() - startTime);
      } catch (err) {
        console.error('Error translating news:', err);
        const parsed = parseError(err);
        const kbError = createKBError('TRANSLATION_ERROR', parsed.message, { retryable: true });
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        setTranslatedArticles(originalArticles);
        collectTelemetry('useTranslatedNews', 'translateAll', 'error', Date.now() - startTime, kbError);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [language, originalArticles, translateBatchAsync]);

  return {
    articles: translatedArticles,
    isTranslating,
    // === KB 2.0 ===
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
