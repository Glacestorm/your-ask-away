import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslationCache {
  [locale: string]: {
    [key: string]: string;
  };
}

const cache: TranslationCache = {};

// Cache for AI translations (keyed by "source|target|text")
const translateCache: Record<string, string> = {};
const translateInflight: Record<string, Promise<string>> = {};

// Higher concurrency for faster translations
const MAX_CONCURRENT_TRANSLATIONS = 8;
let activeTranslations = 0;
const translationQueue: Array<{ resolve: () => void; priority: number }> = [];

// Minimal delay between translations (ms)
const TRANSLATION_DELAY_MS = 50;
let lastTranslationTime = 0;

// === GLOBAL TRANSLATION STATE WITH PROGRESS ===
let globalCMSTranslatingCount = 0;
let totalItemsToTranslate = 0;
let completedItems = 0;

interface TranslationProgress {
  isTranslating: boolean;
  total: number;
  completed: number;
  percentage: number;
}

const cmsTranslatingListeners: Set<(progress: TranslationProgress) => void> = new Set();

const getProgress = (): TranslationProgress => ({
  isTranslating: globalCMSTranslatingCount > 0,
  total: totalItemsToTranslate,
  completed: completedItems,
  percentage: totalItemsToTranslate > 0 ? Math.round((completedItems / totalItemsToTranslate) * 100) : 0,
});

const notifyCMSTranslatingChange = () => {
  const progress = getProgress();
  cmsTranslatingListeners.forEach(listener => listener(progress));
};

export const incrementGlobalTranslating = (itemCount: number = 1) => {
  globalCMSTranslatingCount++;
  totalItemsToTranslate += itemCount;
  notifyCMSTranslatingChange();
};

export const decrementGlobalTranslating = (itemCount: number = 1) => {
  globalCMSTranslatingCount = Math.max(0, globalCMSTranslatingCount - 1);
  completedItems += itemCount;
  notifyCMSTranslatingChange();
  
  // Reset counters when all done
  if (globalCMSTranslatingCount === 0) {
    setTimeout(() => {
      if (globalCMSTranslatingCount === 0) {
        totalItemsToTranslate = 0;
        completedItems = 0;
        notifyCMSTranslatingChange();
      }
    }, 500);
  }
};

export const getGlobalTranslatingState = () => globalCMSTranslatingCount > 0;
export const getTranslationProgress = () => getProgress();

export const subscribeToCMSTranslating = (listener: (progress: TranslationProgress) => void) => {
  cmsTranslatingListeners.add(listener);
  return () => cmsTranslatingListeners.delete(listener);
};

const acquireTranslationSlot = async (): Promise<void> => {
  // Wait for slot availability
  if (activeTranslations >= MAX_CONCURRENT_TRANSLATIONS) {
    await new Promise<void>((resolve) => {
      translationQueue.push({ resolve, priority: Date.now() });
      // Sort by priority (FIFO)
      translationQueue.sort((a, b) => a.priority - b.priority);
    });
  }
  
  // Enforce delay between translations
  const now = Date.now();
  const timeSinceLastTranslation = now - lastTranslationTime;
  if (timeSinceLastTranslation < TRANSLATION_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, TRANSLATION_DELAY_MS - timeSinceLastTranslation));
  }
  
  activeTranslations += 1;
  lastTranslationTime = Date.now();
};

const releaseTranslationSlot = () => {
  activeTranslations = Math.max(0, activeTranslations - 1);
  const next = translationQueue.shift();
  if (next) next.resolve();
};

export function useCMSTranslation(namespace: string = 'common') {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    loadTranslations();
  }, [language, namespace]);

  const loadTranslations = async () => {
    // Check cache first
    const cacheKey = `${language}_${namespace}`;
    if (cache[cacheKey]) {
      setTranslations(cache[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('cms_translations')
        .select('translation_key, value')
        .eq('locale', language)
        .eq('namespace', namespace);

      if (error) throw error;

      const translationMap: Record<string, string> = {};
      for (const item of data || []) {
        translationMap[item.translation_key] = item.value || item.translation_key;
      }

      cache[cacheKey] = translationMap;
      setTranslations(translationMap);
    } catch (err) {
      console.error('Error loading CMS translations:', err);
    } finally {
      setLoading(false);
    }
  };

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[key] || key;
    
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(value));
      }
    }
    
    return text;
  }, [translations]);

  const translateAsync = useCallback(
    async (
      text: string,
      targetLocale: string,
      sourceLocaleOverride?: string
    ): Promise<string> => {
      const sourceLocale = sourceLocaleOverride ?? language;
      const cacheKey = `${sourceLocale}|${targetLocale}|${text}`;

      if (translateCache[cacheKey]) return translateCache[cacheKey];
      if (translateInflight[cacheKey]) return translateInflight[cacheKey];

      translateInflight[cacheKey] = (async () => {
        await acquireTranslationSlot();
        incrementGlobalTranslating(1);
        try {
          const { data, error } = await supabase.functions.invoke('cms-translate-content', {
            body: {
              text,
              sourceLocale,
              targetLocale,
            },
          });

          if (error) throw error;
          const translated = (data?.translatedText as string) ?? text;
          translateCache[cacheKey] = translated;
          return translated;
        } catch (err) {
          console.error('Translation error:', err);
          translateCache[cacheKey] = text;
          return text;
        } finally {
          releaseTranslationSlot();
          decrementGlobalTranslating(1);
          delete translateInflight[cacheKey];
        }
      })();

      return translateInflight[cacheKey];
    },
    [language]
  );

  // Batch translation for multiple texts at once - more efficient
  const translateBatchAsync = useCallback(
    async (
      texts: string[],
      targetLocale: string,
      sourceLocaleOverride?: string
    ): Promise<string[]> => {
      const sourceLocale = sourceLocaleOverride ?? language;
      
      // Filter out texts that are already cached
      const uncachedTexts: string[] = [];
      const results: string[] = [];
      const indexMap: number[] = [];
      
      texts.forEach((text, index) => {
        const cacheKey = `${sourceLocale}|${targetLocale}|${text}`;
        if (translateCache[cacheKey]) {
          results[index] = translateCache[cacheKey];
        } else {
          uncachedTexts.push(text);
          indexMap.push(index);
        }
      });
      
      // If all cached, return immediately
      if (uncachedTexts.length === 0) {
        return results;
      }
      
      await acquireTranslationSlot();
      const batchSize = uncachedTexts.length;
      incrementGlobalTranslating(batchSize);
      try {
        // Convert texts array to items array expected by the edge function
        const items = uncachedTexts.map((text, idx) => ({
          key: `batch_${idx}`,
          text,
        }));

        const { data, error } = await supabase.functions.invoke('cms-batch-translate', {
          body: {
            items,
            sourceLocale,
            targetLocale,
          },
        });

        if (error) throw error;
        
        // Extract translations from results array
        const translationResults = (data?.results as Array<{ translation: string }>) ?? [];
        const translations = translationResults.map(r => r.translation);
        
        // Map results back and cache them
        translations.forEach((translated, i) => {
          const originalIndex = indexMap[i];
          const originalText = uncachedTexts[i];
          const cacheKey = `${sourceLocale}|${targetLocale}|${originalText}`;
          translateCache[cacheKey] = translated;
          results[originalIndex] = translated;
        });
        
        return results;
      } catch (err) {
        console.error('Batch translation error:', err);
        // Fallback: return original texts for uncached
        indexMap.forEach((originalIndex, i) => {
          results[originalIndex] = uncachedTexts[i];
        });
        return results;
      } finally {
        releaseTranslationSlot();
        decrementGlobalTranslating(batchSize);
      }
    },
    [language]
  );

  const clearCache = useCallback((locale?: string) => {
    if (locale) {
      Object.keys(cache).forEach(key => {
        if (key.startsWith(`${locale}_`)) {
          delete cache[key];
        }
      });
    } else {
      Object.keys(cache).forEach(key => delete cache[key]);
    }
  }, []);

  return { 
    t, 
    translations, 
    loading, 
    translateAsync,
    translateBatchAsync,
    clearCache,
    currentLocale: language 
  };
}
