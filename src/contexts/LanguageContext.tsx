import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import caTranslations from '@/locales/ca';
import esTranslations from '@/locales/es';
import frTranslations from '@/locales/fr';
import enTranslations from '@/locales/en';
import { supabase } from '@/integrations/supabase/client';
import { incrementGlobalTranslating, decrementGlobalTranslating } from '@/hooks/cms/useCMSTranslation';

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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for AI-translated i18n keys
const aiTranslatedKeysCache: Record<string, Record<string, string>> = {};

// Tracking keys being translated
const keysBeingTranslated: Set<string> = new Set();

// Queue for batch translations
let translationBatchQueue: Array<{ key: string; text: string; resolve: (text: string) => void }> = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
const BATCH_DELAY = 50; // ms to wait before processing batch
const MAX_BATCH_SIZE = 50; // Maximum items per batch

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
  const [aiTranslatedKeys, setAiTranslatedKeys] = useState<Record<string, string>>({});
  const translatingRef = useRef(false);
  const pendingKeysRef = useRef<Set<string>>(new Set());

  // Initialize AI cache for current language
  useEffect(() => {
    if (!aiTranslatedKeysCache[language]) {
      aiTranslatedKeysCache[language] = {};
    }
    setAiTranslatedKeys(aiTranslatedKeysCache[language]);
  }, [language]);

  // Process batch of translations
  const processBatch = useCallback(async (targetLocale: string) => {
    if (translationBatchQueue.length === 0) return;

    const batch = translationBatchQueue.splice(0, MAX_BATCH_SIZE);
    const items = batch.map(item => ({
      key: item.key,
      text: item.text,
    }));

    incrementGlobalTranslating(items.length);

    try {
      const { data, error } = await supabase.functions.invoke('cms-batch-translate', {
        body: {
          items,
          sourceLocale: 'es',
          targetLocale,
        },
      });

      if (error) throw error;

      const results = (data?.results as Array<{ key: string; translation: string }>) ?? [];
      const translationMap: Record<string, string> = {};

      results.forEach((result, index) => {
        const originalItem = batch[index];
        if (originalItem) {
          translationMap[originalItem.key] = result.translation;
          originalItem.resolve(result.translation);
          keysBeingTranslated.delete(`${targetLocale}:${originalItem.key}`);
        }
      });

      // Update cache
      if (!aiTranslatedKeysCache[targetLocale]) {
        aiTranslatedKeysCache[targetLocale] = {};
      }
      Object.assign(aiTranslatedKeysCache[targetLocale], translationMap);

      // Trigger re-render
      setAiTranslatedKeys(prev => ({ ...prev, ...translationMap }));

    } catch (err) {
      console.error('Batch translation error:', err);
      // Resolve with original text on error
      batch.forEach(item => {
        item.resolve(item.text);
        keysBeingTranslated.delete(`${targetLocale}:${item.key}`);
      });
    } finally {
      decrementGlobalTranslating(items.length);

      // If more items queued, process next batch
      if (translationBatchQueue.length > 0) {
        setTimeout(() => processBatch(targetLocale), 10);
      }
    }
  }, []);

  // Queue a key for translation
  const queueTranslation = useCallback((key: string, text: string, targetLocale: string): Promise<string> => {
    return new Promise((resolve) => {
      translationBatchQueue.push({ key, text, resolve });

      // Clear existing timeout and set new one
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }

      // Process batch after delay or when batch is full
      if (translationBatchQueue.length >= MAX_BATCH_SIZE) {
        processBatch(targetLocale);
      } else {
        batchTimeout = setTimeout(() => {
          processBatch(targetLocale);
        }, BATCH_DELAY);
      }
    });
  }, [processBatch]);

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
        // Fetch ALL translations without limits - paginate to get beyond 1000 row default
        const translationMap: Record<string, string> = {};
        const PAGE_SIZE = 1000;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await (supabase as any)
            .from('cms_translations')
            .select('translation_key, value')
            .eq('locale', language)
            .range(offset, offset + PAGE_SIZE - 1);

          if (error) {
            console.error('Error loading dynamic translations:', error);
            // Fall back to cached version if available
            if (dynamicTranslationsCache[language]) {
              setDynamicTranslations(dynamicTranslationsCache[language]);
            }
            break;
          }

          for (const item of data || []) {
            if (item.value) {
              translationMap[item.translation_key] = item.value;
            }
          }

          hasMore = (data?.length || 0) === PAGE_SIZE;
          offset += PAGE_SIZE;
        }

        console.log(`[i18n] Loaded ${Object.keys(translationMap).length} DB translations for ${language}`);

        // Update cache with timestamp
        dynamicTranslationsCache[language] = translationMap;
        cacheTimestamps[language] = Date.now();
        setDynamicTranslations(translationMap);

        // If non-base language with no/few DB translations, auto-translate all keys
        if (!staticTranslations[language] && Object.keys(translationMap).length < 50) {
          translateAllStaticKeys(language);
        }
      } catch (err) {
        console.error('Failed to load dynamic translations:', err);
        if (dynamicTranslationsCache[language]) {
          setDynamicTranslations(dynamicTranslationsCache[language]);
        }
      } finally {
        setLoadingDynamic(false);
      }
    };

    loadDynamicTranslations();
  }, [language]);

  // Auto-translate all static keys for non-base languages
  const translateAllStaticKeys = useCallback(async (targetLocale: string) => {
    if (translatingRef.current) return;
    translatingRef.current = true;

    try {
      // Get Spanish translations as source
      const sourceTranslations = staticTranslations.es!;
      const keys = Object.keys(sourceTranslations);
      const existingAI = aiTranslatedKeysCache[targetLocale] || {};
      
      // Filter out already translated keys
      const keysToTranslate = keys.filter(key => {
        const trackingKey = `${targetLocale}:${key}`;
        return !existingAI[key] && !keysBeingTranslated.has(trackingKey);
      });

      if (keysToTranslate.length === 0) {
        translatingRef.current = false;
        return;
      }

      console.log(`[i18n] Auto-translating ${keysToTranslate.length} keys to ${targetLocale}`);

      // Mark all as being translated
      keysToTranslate.forEach(key => {
        keysBeingTranslated.add(`${targetLocale}:${key}`);
      });

      // Queue all translations
      const promises = keysToTranslate.map(key => 
        queueTranslation(key, sourceTranslations[key], targetLocale)
      );

      await Promise.all(promises);

    } catch (err) {
      console.error('Error auto-translating keys:', err);
    } finally {
      translatingRef.current = false;
    }
  }, [queueTranslation]);

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
    // Invalidate cache for current language
    delete cacheTimestamps[language];
    delete dynamicTranslationsCache[language];
    delete aiTranslatedKeysCache[language];
    
    // Reset states
    setDynamicTranslations({});
    setAiTranslatedKeys({});
    
    // Force re-trigger
    setLanguageState((prev) => prev);
    
    // Trigger auto-translation for non-base languages
    if (!staticTranslations[language]) {
      setTimeout(() => translateAllStaticKeys(language), 100);
    }
  }, [language, translateAllStaticKeys]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // Priority: AI translations > dynamic translations > static translations > fallback
    let value = aiTranslatedKeys[key];
    
    if (!value) {
      value = dynamicTranslations[key];
    }
    
    if (!value) {
      const staticTrans = getStaticTranslations(language);
      value = staticTrans[key];
    }

    if (value === undefined) {
      // For non-base languages, queue translation if not already in progress
      if (!staticTranslations[language]) {
        const trackingKey = `${language}:${key}`;
        if (!keysBeingTranslated.has(trackingKey)) {
          const sourceText = staticTranslations.es?.[key];
          if (sourceText) {
            keysBeingTranslated.add(trackingKey);
            queueTranslation(key, sourceText, language).then(translated => {
              // Update will happen via state
            });
          }
        }
        // Return source text while translating (Spanish fallback)
        const fallback = staticTranslations.es?.[key] || key;
        value = fallback;
      } else {
        value = key;
      }
    }

    // Replace parameters like {{name}}
    if (params && value) {
      for (const [param, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(paramValue));
      }
    }

    return value;
  }, [language, dynamicTranslations, aiTranslatedKeys, queueTranslation]);

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
