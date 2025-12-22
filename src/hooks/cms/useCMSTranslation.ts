import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslationCache {
  [locale: string]: {
    [key: string]: string;
  };
}

const cache: TranslationCache = {};

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
      try {
        const { data, error } = await supabase.functions.invoke('cms-translate-content', {
          body: {
            text,
            sourceLocale: sourceLocaleOverride ?? language,
            targetLocale,
          },
        });

        if (error) throw error;
        return data.translatedText;
      } catch (err) {
        console.error('Translation error:', err);
        return text;
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
    clearCache,
    currentLocale: language 
  };
}
