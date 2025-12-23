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

// Very small concurrency limit to avoid rate limiting when many components request translations at once
const MAX_CONCURRENT_TRANSLATIONS = 2;
let activeTranslations = 0;
const translationWaiters: Array<() => void> = [];

const acquireTranslationSlot = async (): Promise<void> => {
  if (activeTranslations < MAX_CONCURRENT_TRANSLATIONS) {
    activeTranslations += 1;
    return;
  }
  await new Promise<void>((resolve) => translationWaiters.push(resolve));
  activeTranslations += 1;
};

const releaseTranslationSlot = () => {
  activeTranslations = Math.max(0, activeTranslations - 1);
  const next = translationWaiters.shift();
  if (next) next();
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
          delete translateInflight[cacheKey];
        }
      })();

      return translateInflight[cacheKey];
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
    clearCache,
    currentLocale: language 
  };
}
