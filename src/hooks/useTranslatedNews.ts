import { useState, useEffect, useRef, useCallback } from 'react';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { NewsArticle } from '@/hooks/useNewsArticles';

// === ERROR TIPADO KB ===
export interface TranslatedNewsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface TranslatedNews {
  articles: NewsArticle[];
  isTranslating: boolean;
  error: TranslatedNewsError | null;
  lastRefresh: Date | null;
  clearError: () => void;
}

export function useTranslatedNews(originalArticles: NewsArticle[]): TranslatedNews {
  const { language } = useLanguage();
  const { translateBatchAsync } = useCMSTranslation();
  const [translatedArticles, setTranslatedArticles] = useState<NewsArticle[]>(originalArticles);
  const [isTranslating, setIsTranslating] = useState(false);
  // === ESTADO KB ===
  const [error, setError] = useState<TranslatedNewsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const lastLanguageRef = useRef<string>(language);
  const lastArticlesRef = useRef<string>('');

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

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
      return;
    }

    // If no articles, nothing to translate
    if (originalArticles.length === 0) {
      setTranslatedArticles([]);
      setIsTranslating(false);
      return;
    }

    const translateAll = async () => {
      setIsTranslating(true);

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
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Error translating news:', err);
        setError({
          code: 'TRANSLATION_ERROR',
          message: err instanceof Error ? err.message : 'Error al traducir noticias',
          details: { language }
        });
        setTranslatedArticles(originalArticles);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [language, originalArticles, translateBatchAsync]);

  return {
    articles: translatedArticles,
    isTranslating,
    error,
    lastRefresh,
    clearError,
  };
}
