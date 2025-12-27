import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// Cache for translated content - global so it persists across hook instances
const translationCache: Map<string, string> = new Map();
const pendingTranslations: Map<string, Promise<string>> = new Map();
let lastLanguage: string | null = null;

// Debounce delay for batch translations
const BATCH_DELAY_MS = 100;

interface TranslationItem {
  key: string;
  text: string;
}

interface UseDynamicTranslationOptions {
  sourceLocale?: string;
  enabled?: boolean;
}

/**
 * Hook for translating dynamic content (products, news, etc.) in real-time
 * when the user changes language. Uses batch translation for efficiency.
 */
export function useDynamicTranslation(options: UseDynamicTranslationOptions = {}) {
  const { language } = useLanguage();
  const { sourceLocale = 'es', enabled = true } = options;
  const [isTranslating, setIsTranslating] = useState(false);
  const batchQueueRef = useRef<TranslationItem[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const batchResolversRef = useRef<Map<string, { resolve: (value: string) => void; reject: (error: Error) => void }>>(new Map());

  // Generate cache key
  const getCacheKey = useCallback((text: string, targetLocale: string) => {
    return `${sourceLocale}|${targetLocale}|${text}`;
  }, [sourceLocale]);

  // Process batch translations
  const processBatch = useCallback(async () => {
    if (batchQueueRef.current.length === 0) return;

    const batch = [...batchQueueRef.current];
    batchQueueRef.current = [];
    
    const resolvers = new Map(batchResolversRef.current);
    batchResolversRef.current.clear();

    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('cms-batch-translate', {
        body: {
          items: batch,
          sourceLocale,
          targetLocale: language,
        },
      });

      if (error) throw error;

      const results = (data?.results as Array<{ key: string; translation: string }>) ?? [];
      
      results.forEach((result) => {
        const originalItem = batch.find(item => item.key === result.key);
        if (originalItem) {
          const cacheKey = getCacheKey(originalItem.text, language);
          translationCache.set(cacheKey, result.translation);
          
          const resolver = resolvers.get(result.key);
          if (resolver) {
            resolver.resolve(result.translation);
          }
        }
      });

      // Resolve any remaining with original text
      batch.forEach((item) => {
        const resolver = resolvers.get(item.key);
        if (resolver && !results.find(r => r.key === item.key)) {
          resolver.resolve(item.text);
        }
      });

    } catch (err) {
      console.error('[useDynamicTranslation] Batch translation error:', err);
      // Fallback to original text
      batch.forEach((item) => {
        const resolver = resolvers.get(item.key);
        if (resolver) {
          resolver.resolve(item.text);
        }
      });
    } finally {
      setIsTranslating(false);
    }
  }, [language, sourceLocale, getCacheKey]);

  // Clear cache when language changes to force re-translation
  useEffect(() => {
    if (lastLanguage && lastLanguage !== language) {
      console.log('[useDynamicTranslation] Language changed, clearing cache');
      translationCache.clear();
      pendingTranslations.clear();
    }
    lastLanguage = language;
  }, [language]);

  // Clear batch timer on unmount
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  /**
   * Translate a single text. If same source language, returns original.
   * Uses batch processing for efficiency.
   */
  const translate = useCallback(async (text: string, id?: string): Promise<string> => {
    if (!enabled || !text || language === sourceLocale) {
      return text;
    }

    // Check cache first
    const cacheKey = getCacheKey(text, language);
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Check if already pending
    if (pendingTranslations.has(cacheKey)) {
      return pendingTranslations.get(cacheKey)!;
    }

    // Add to batch queue
    const itemKey = id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const promise = new Promise<string>((resolve, reject) => {
      batchResolversRef.current.set(itemKey, { resolve, reject });
      batchQueueRef.current.push({ key: itemKey, text });

      // Start or reset batch timer
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      batchTimerRef.current = setTimeout(processBatch, BATCH_DELAY_MS);
    });

    pendingTranslations.set(cacheKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      pendingTranslations.delete(cacheKey);
    }
  }, [enabled, language, sourceLocale, getCacheKey, processBatch]);

  /**
   * Translate multiple texts at once. More efficient than individual calls.
   */
  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    if (!enabled || language === sourceLocale) {
      return texts;
    }

    const results: string[] = [];
    const toTranslate: { index: number; text: string }[] = [];

    // Check cache for each text
    texts.forEach((text, index) => {
      if (!text) {
        results[index] = text;
        return;
      }
      
      const cacheKey = getCacheKey(text, language);
      if (translationCache.has(cacheKey)) {
        results[index] = translationCache.get(cacheKey)!;
      } else {
        toTranslate.push({ index, text });
      }
    });

    // If all cached, return immediately
    if (toTranslate.length === 0) {
      return results;
    }

    setIsTranslating(true);

    try {
      const items = toTranslate.map((item, idx) => ({
        key: `batch_${idx}`,
        text: item.text,
      }));

      const { data, error } = await supabase.functions.invoke('cms-batch-translate', {
        body: {
          items,
          sourceLocale,
          targetLocale: language,
        },
      });

      if (error) throw error;

      const translationResults = (data?.results as Array<{ key: string; translation: string }>) ?? [];
      
      translationResults.forEach((result, idx) => {
        const originalItem = toTranslate[idx];
        if (originalItem) {
          const cacheKey = getCacheKey(originalItem.text, language);
          translationCache.set(cacheKey, result.translation);
          results[originalItem.index] = result.translation;
        }
      });

      // Fill in any missing with original text
      toTranslate.forEach((item) => {
        if (results[item.index] === undefined) {
          results[item.index] = item.text;
        }
      });

      return results;
    } catch (err) {
      console.error('[useDynamicTranslation] Batch translation error:', err);
      // Fallback to original texts
      toTranslate.forEach((item) => {
        results[item.index] = item.text;
      });
      return results;
    } finally {
      setIsTranslating(false);
    }
  }, [enabled, language, sourceLocale, getCacheKey]);

  /**
   * Clear translation cache
   */
  const clearCache = useCallback(() => {
    translationCache.clear();
  }, []);

  return {
    translate,
    translateBatch,
    isTranslating,
    currentLanguage: language,
    isSourceLanguage: language === sourceLocale,
    clearCache,
  };
}

export default useDynamicTranslation;
