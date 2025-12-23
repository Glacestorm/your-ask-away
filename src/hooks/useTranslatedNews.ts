import { useState, useEffect, useCallback, useRef } from 'react';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { NewsArticle } from '@/hooks/useNewsArticles';

interface TranslatedNews {
  articles: NewsArticle[];
  isTranslating: boolean;
}

export function useTranslatedNews(originalArticles: NewsArticle[]): TranslatedNews {
  const { language } = useLanguage();
  const { translateAsync } = useCMSTranslation();
  const [translatedArticles, setTranslatedArticles] = useState<NewsArticle[]>(originalArticles);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Cache translations to avoid re-translating
  const translationCacheRef = useRef<Record<string, string>>({});
  const lastLanguageRef = useRef<string>(language);

  const translateText = useCallback(async (text: string, targetLocale: string): Promise<string> => {
    if (!text || targetLocale === 'es') return text;
    
    const cacheKey = `${targetLocale}|${text.substring(0, 100)}`;
    if (translationCacheRef.current[cacheKey]) {
      return translationCacheRef.current[cacheKey];
    }

    try {
      const translated = await translateAsync(text, targetLocale, 'es');
      translationCacheRef.current[cacheKey] = translated;
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }, [translateAsync]);

  useEffect(() => {
    // Reset cache when language changes
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
    }

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
        // Translate articles in batches for better UX
        const translatedList = await Promise.all(
          originalArticles.map(async (article) => ({
            ...article,
            title: await translateText(article.title, language),
            ai_summary: article.ai_summary ? await translateText(article.ai_summary, language) : article.ai_summary,
            category: article.category ? await translateText(article.category, language) : article.category,
            // Keep original tags for filtering but could translate display
          }))
        );
        setTranslatedArticles(translatedList);
      } catch (error) {
        console.error('Error translating news:', error);
        // Fallback to originals
        setTranslatedArticles(originalArticles);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [language, originalArticles, translateText]);

  return {
    articles: translatedArticles,
    isTranslating,
  };
}
