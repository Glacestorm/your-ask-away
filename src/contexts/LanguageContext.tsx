import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import caTranslations from '@/locales/ca';
import esTranslations from '@/locales/es';
import frTranslations from '@/locales/fr';
import enTranslations from '@/locales/en';
import { supabase } from '@/integrations/supabase/client';

// Expanded to support 65+ languages
export type Language = 
  | 'ca' | 'es' | 'fr' | 'en' 
  | 'de' | 'pt' | 'pt-BR' | 'it' | 'zh-CN' | 'ja' | 'ko' | 'ru'
  | 'nl' | 'pl' | 'cs' | 'ro' | 'hu' | 'sv' | 'da' | 'no' | 'fi' | 'el' | 'tr' | 'uk' | 'ar' | 'he'
  | 'zh-TW' | 'th' | 'vi' | 'id' | 'ms' | 'hi' | 'bn' | 'tl' | 'ur' | 'fa' | 'bg' | 'hr' | 'sk' | 'sl' | 'et' | 'lv' | 'lt'
  | 'es-MX' | 'es-AR' | 'en-US' | 'fr-CA' | 'af'
  | 'ga' | 'is' | 'mt' | 'lb' | 'bs' | 'sr' | 'mk' | 'sq' | 'ka' | 'hy' | 'az' | 'kk' | 'uz' | 'ne' | 'si' | 'my' | 'km' | 'lo' | 'am' | 'sw' | 'ha' | 'yo' | 'ig';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  loadingDynamic: boolean;
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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

// All supported locale codes
const SUPPORTED_LOCALES: Language[] = [
  'ca', 'es', 'fr', 'en', 'de', 'pt', 'pt-BR', 'it', 'zh-CN', 'ja', 'ko', 'ru',
  'nl', 'pl', 'cs', 'ro', 'hu', 'sv', 'da', 'no', 'fi', 'el', 'tr', 'uk', 'ar', 'he',
  'zh-TW', 'th', 'vi', 'id', 'ms', 'hi', 'bn', 'tl', 'ur', 'fa', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt',
  'es-MX', 'es-AR', 'en-US', 'fr-CA', 'af',
  'ga', 'is', 'mt', 'lb', 'bs', 'sr', 'mk', 'sq', 'ka', 'hy', 'az', 'kk', 'uz', 'ne', 'si', 'my', 'km', 'lo', 'am', 'sw', 'ha', 'yo', 'ig'
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

      // Check cache first
      if (dynamicTranslationsCache[language]) {
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
          return;
        }

        const translationMap: Record<string, string> = {};
        for (const item of data || []) {
          if (item.value) {
            translationMap[item.translation_key] = item.value;
          }
        }

        dynamicTranslationsCache[language] = translationMap;
        setDynamicTranslations(translationMap);
      } catch (err) {
        console.error('Failed to load dynamic translations:', err);
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
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, loadingDynamic }}>
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
