import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import caTranslations from '@/locales/ca';
import esTranslations from '@/locales/es';
import frTranslations from '@/locales/fr';
import enTranslations from '@/locales/en';
import { supabase } from '@/integrations/supabase/client';

// Expanded to support 65+ languages including Spanish regional languages
export type Language = 
  | 'ca' | 'es' | 'fr' | 'en' 
  | 'de' | 'pt' | 'pt-BR' | 'it' | 'zh-CN' | 'ja' | 'ko' | 'ru'
  | 'nl' | 'pl' | 'cs' | 'ro' | 'hu' | 'sv' | 'da' | 'no' | 'fi' | 'el' | 'tr' | 'uk' | 'ar' | 'he'
  | 'zh-TW' | 'th' | 'vi' | 'id' | 'ms' | 'hi' | 'bn' | 'tl' | 'ur' | 'fa' | 'bg' | 'hr' | 'sk' | 'sl' | 'et' | 'lv' | 'lt'
  | 'es-MX' | 'es-AR' | 'en-US' | 'fr-CA' | 'af'
  | 'ga' | 'is' | 'mt' | 'lb' | 'bs' | 'sr' | 'mk' | 'sq' | 'ka' | 'hy' | 'az' | 'kk' | 'uz' | 'ne' | 'si' | 'my' | 'km' | 'lo' | 'am' | 'sw' | 'ha' | 'yo' | 'ig'
  // Spanish regional languages
  | 'eu' | 'gl' | 'oc' | 'ast' | 'an';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  loadingDynamic: boolean;
  refreshTranslations: () => void;
}

const normalizeKeys = (obj: Record<string, string>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.trim()] = v;
  }
  return out;
};

// Static translations (base languages with full coverage)
const staticTranslations: Partial<Record<Language, Record<string, string>>> = {
  ca: normalizeKeys(caTranslations),
  es: normalizeKeys(esTranslations),
  fr: normalizeKeys(frTranslations),
  en: normalizeKeys(enTranslations),
};

// RTL languages
const RTL_LANGUAGES: Language[] = ['ar', 'he', 'fa', 'ur'];

// Cache for dynamic translations from DB
const dynamicTranslationsCache: Record<string, Record<string, string>> = {};
const cacheTimestamps: Record<string, number> = {};
const CACHE_TTL = 1 * 60 * 1000; // 1 minute for faster updates

const getStaticTranslations = (lang: Language): Record<string, string> => {
  // For base languages, use static files
  if (staticTranslations[lang]) {
    return staticTranslations[lang]!;
  }
  // For regional variants, try base language
  const baseLang = lang.split('-')[0] as Language;
  if (staticTranslations[baseLang]) {
    return staticTranslations[baseLang]!;
  }
  // Fallback to Spanish (most complete)
  return staticTranslations.es!;
};

// Helper to check if cache is still valid
const isCacheValid = (lang: string): boolean => {
  const timestamp = cacheTimestamps[lang];
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_TTL;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

// All supported locale codes including Spanish regional languages
const SUPPORTED_LOCALES: Language[] = [
  'ca', 'es', 'fr', 'en', 'de', 'pt', 'pt-BR', 'it', 'zh-CN', 'ja', 'ko', 'ru',
  'nl', 'pl', 'cs', 'ro', 'hu', 'sv', 'da', 'no', 'fi', 'el', 'tr', 'uk', 'ar', 'he',
  'zh-TW', 'th', 'vi', 'id', 'ms', 'hi', 'bn', 'tl', 'ur', 'fa', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt',
  'es-MX', 'es-AR', 'en-US', 'fr-CA', 'af',
  'ga', 'is', 'mt', 'lb', 'bs', 'sr', 'mk', 'sq', 'ka', 'hy', 'az', 'kk', 'uz', 'ne', 'si', 'my', 'km', 'lo', 'am', 'sw', 'ha', 'yo', 'ig',
  // Spanish regional languages
  'eu', 'gl', 'oc', 'ast', 'an'
];

const getInitialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Language)) {
      return stored as Language;
    }
  } catch (e) {
    console.error('Error reading language from localStorage:', e);
  }
  return 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>({});
  const [loadingDynamic, setLoadingDynamic] = useState(false);

  // Load dynamic translations from DB for non-base languages
  useEffect(() => {
    const loadDynamicTranslations = async () => {
      // Skip for base languages that have static files
      if (staticTranslations[language]) {
        setDynamicTranslations({});
        return;
      }

      // Check cache with TTL
      if (dynamicTranslationsCache[language] && isCacheValid(language)) {
        setDynamicTranslations(dynamicTranslationsCache[language]);
        return;
      }

      setLoadingDynamic(true);
      try {
        const { data, error } = await (supabase as any)
          .from('cms_translations')
          .select('translation_key, value')
          .eq('locale', language);

        if (error) {
          console.error('Error loading dynamic translations:', error);
          // Fall back to cached version if available
          if (dynamicTranslationsCache[language]) {
            setDynamicTranslations(dynamicTranslationsCache[language]);
          }
          return;
        }

        const translationMap: Record<string, string> = {};
        for (const item of data || []) {
          if (item.value) {
            translationMap[item.translation_key] = item.value;
          }
        }

        // Update cache with timestamp
        dynamicTranslationsCache[language] = translationMap;
        cacheTimestamps[language] = Date.now();
        setDynamicTranslations(translationMap);
      } catch (err) {
        console.error('Failed to load dynamic translations:', err);
        // Fall back to cached version if available
        if (dynamicTranslationsCache[language]) {
          setDynamicTranslations(dynamicTranslationsCache[language]);
        }
      } finally {
        setLoadingDynamic(false);
      }
    };

    loadDynamicTranslations();
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error('Error saving language to localStorage:', e);
    }
  }, []);

  // Function to refresh translations (invalidate cache and reload)
  const refreshTranslations = useCallback(() => {
    if (language && !staticTranslations[language]) {
      // Invalidate cache for current language
      delete cacheTimestamps[language];
      delete dynamicTranslationsCache[language];
      // Trigger reload
      setDynamicTranslations({});
      setLanguageState(prev => prev); // Force re-render to trigger useEffect
    }
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // Priority: dynamic translations > static translations > fallback to key
    let value = dynamicTranslations[key];
    
    if (!value) {
      const staticTrans = getStaticTranslations(language);
      value = staticTrans[key];
    }

    if (value === undefined) {
      // Only warn in development and for base languages
      if (staticTranslations[language]) {
        console.warn(`[i18n] Missing translation for key: "${key}" in language: "${language}"`);
      }
      value = key;
    }

    // Replace parameters like {{name}}
    if (params && value) {
      for (const [param, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(paramValue));
      }
    }

    return value;
  }, [language, dynamicTranslations]);

  const isRTL = RTL_LANGUAGES.includes(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, loadingDynamic, refreshTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
