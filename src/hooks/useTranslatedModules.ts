import { useState, useEffect, useCallback, useRef } from 'react';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Module {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  module_icon: string | null;
  base_price: number | null;
  category: string;
  is_core: boolean | null;
  features?: string[] | { list?: string[] } | null;
  sector?: string | null;
}

interface TranslatedModules {
  modules: Module[];
  isTranslating: boolean;
}

export function useTranslatedModules(originalModules: Module[]): TranslatedModules {
  const { language } = useLanguage();
  const { translateAsync } = useCMSTranslation();
  const [translatedModules, setTranslatedModules] = useState<Module[]>(originalModules);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Cache translations to avoid re-translating
  const translationCacheRef = useRef<Record<string, string>>({});
  const lastLanguageRef = useRef<string>(language);

  const translateText = useCallback(async (text: string | null, targetLocale: string): Promise<string | null> => {
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

  const extractFeatures = (features: Module['features']): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'object' && features?.list) return features.list;
    return [];
  };

  useEffect(() => {
    // Reset cache when language changes
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
    }

    // If Spanish, use originals directly
    if (language === 'es') {
      setTranslatedModules(originalModules);
      setIsTranslating(false);
      return;
    }

    // If no modules, nothing to translate
    if (originalModules.length === 0) {
      setTranslatedModules([]);
      setIsTranslating(false);
      return;
    }

    const translateAll = async () => {
      setIsTranslating(true);

      try {
        const translatedList = await Promise.all(
          originalModules.map(async (module) => {
            const features = extractFeatures(module.features);
            const translatedFeatures = await Promise.all(
              features.map((f) => translateText(f, language))
            );

            return {
              ...module,
              module_name: (await translateText(module.module_name, language)) || module.module_name,
              description: await translateText(module.description, language),
              category: (await translateText(module.category, language)) || module.category,
              features: translatedFeatures.filter((f): f is string => f !== null),
            };
          })
        );
        setTranslatedModules(translatedList);
      } catch (error) {
        console.error('Error translating modules:', error);
        // Fallback to originals
        setTranslatedModules(originalModules);
      } finally {
        setIsTranslating(false);
      }
    };

    translateAll();
  }, [language, originalModules, translateText]);

  return {
    modules: translatedModules,
    isTranslating,
  };
}
