import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// === PERSISTENT CACHE CONFIG ===
const CACHE_STORAGE_KEY = 'obelixia_translation_cache';
const CACHE_VERSION = 'v1';
const CACHE_MAX_ENTRIES = 500; // Limit to prevent localStorage bloat
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  value: string;
  timestamp: number;
}

interface StoredCache {
  version: string;
  entries: Record<string, CacheEntry>;
}

// === GLOBAL STATE ===
let memoryCache: Map<string, string> = new Map();
const pendingTranslations: Map<string, Promise<string>> = new Map();
let lastLanguage: string | null = null;
let cacheLoaded = false;

// Global translation state for UI indicator
let globalTranslatingCount = 0;
const translatingListeners: Set<(isTranslating: boolean) => void> = new Set();

const notifyTranslatingChange = () => {
  const isTranslating = globalTranslatingCount > 0;
  translatingListeners.forEach(listener => listener(isTranslating));
};

// === LOCALSTORAGE HELPERS ===
const loadCacheFromStorage = (): void => {
  if (cacheLoaded) return;
  
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
      const parsed: StoredCache = JSON.parse(stored);
      
      // Check version
      if (parsed.version !== CACHE_VERSION) {
        localStorage.removeItem(CACHE_STORAGE_KEY);
        cacheLoaded = true;
        return;
      }
      
      const now = Date.now();
      let validCount = 0;
      
      // Load valid entries into memory cache
      for (const [key, entry] of Object.entries(parsed.entries)) {
        if (now - entry.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, entry.value);
          validCount++;
        }
      }
      
      console.log(`[i18n] Loaded ${validCount} translations from persistent cache`);
    }
  } catch (err) {
    console.warn('[i18n] Failed to load translation cache:', err);
    localStorage.removeItem(CACHE_STORAGE_KEY);
  }
  
  cacheLoaded = true;
};

const saveCacheToStorage = (): void => {
  try {
    const entries: Record<string, CacheEntry> = {};
    const now = Date.now();
    let count = 0;
    
    // Only save up to max entries, prioritizing recent ones
    const sortedEntries = Array.from(memoryCache.entries());
    const entriesToSave = sortedEntries.slice(-CACHE_MAX_ENTRIES);
    
    for (const [key, value] of entriesToSave) {
      entries[key] = { value, timestamp: now };
      count++;
    }
    
    const toStore: StoredCache = {
      version: CACHE_VERSION,
      entries
    };
    
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(toStore));
    console.log(`[i18n] Saved ${count} translations to persistent cache`);
  } catch (err) {
    console.warn('[i18n] Failed to save translation cache:', err);
    // If storage is full, clear old cache
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {}
  }
};

// Debounce save to avoid excessive writes
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCacheToStorage, 2000);
};

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
 * when the user changes language. Uses batch translation and persistent cache.
 */
export function useDynamicTranslation(options: UseDynamicTranslationOptions = {}) {
  const { language } = useLanguage();
  const { sourceLocale = 'es', enabled = true } = options;
  const [isTranslating, setIsTranslating] = useState(false);
  const batchQueueRef = useRef<TranslationItem[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const batchResolversRef = useRef<Map<string, { resolve: (value: string) => void; reject: (error: Error) => void }>>(new Map());

  // Load cache on first use
  useEffect(() => {
    loadCacheFromStorage();
  }, []);

  // Generate cache key with language prefix
  const getCacheKey = useCallback((text: string, targetLocale: string) => {
    return `${sourceLocale}|${targetLocale}|${text.substring(0, 100)}`; // Limit key length
  }, [sourceLocale]);

  // Process batch translations
  const processBatch = useCallback(async () => {
    if (batchQueueRef.current.length === 0) return;

    const batch = [...batchQueueRef.current];
    batchQueueRef.current = [];
    
    const resolvers = new Map(batchResolversRef.current);
    batchResolversRef.current.clear();

    setIsTranslating(true);
    globalTranslatingCount++;
    notifyTranslatingChange();

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
          memoryCache.set(cacheKey, result.translation);
          
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

      // Save to persistent storage
      debouncedSave();

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
      globalTranslatingCount = Math.max(0, globalTranslatingCount - 1);
      notifyTranslatingChange();
    }
  }, [language, sourceLocale, getCacheKey]);

  // Clear memory cache when language changes (keep localStorage for other languages)
  useEffect(() => {
    if (lastLanguage && lastLanguage !== language) {
      console.log('[useDynamicTranslation] Language changed, clearing memory cache');
      // Only clear entries for the old language from memory
      const keysToRemove: string[] = [];
      memoryCache.forEach((_, key) => {
        if (key.includes(`|${lastLanguage}|`)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => memoryCache.delete(key));
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
   * Uses batch processing and persistent caching for efficiency.
   */
  const translate = useCallback(async (text: string, id?: string): Promise<string> => {
    if (!enabled || !text || language === sourceLocale) {
      return text;
    }

    // Check memory cache first
    const cacheKey = getCacheKey(text, language);
    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey)!;
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
      if (memoryCache.has(cacheKey)) {
        results[index] = memoryCache.get(cacheKey)!;
      } else {
        toTranslate.push({ index, text });
      }
    });

    // If all cached, return immediately
    if (toTranslate.length === 0) {
      return results;
    }

    setIsTranslating(true);
    globalTranslatingCount++;
    notifyTranslatingChange();

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
          memoryCache.set(cacheKey, result.translation);
          results[originalItem.index] = result.translation;
        }
      });

      // Fill in any missing with original text
      toTranslate.forEach((item) => {
        if (results[item.index] === undefined) {
          results[item.index] = item.text;
        }
      });

      // Save to persistent storage
      debouncedSave();

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
      globalTranslatingCount = Math.max(0, globalTranslatingCount - 1);
      notifyTranslatingChange();
    }
  }, [enabled, language, sourceLocale, getCacheKey]);

  /**
   * Clear all translation caches (memory and localStorage)
   */
  const clearCache = useCallback(() => {
    memoryCache.clear();
    pendingTranslations.clear();
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {}
    console.log('[useDynamicTranslation] All caches cleared');
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

/**
 * Hook to subscribe to global translation state
 * Useful for showing loading indicators
 */
export function useGlobalTranslationState() {
  const [isTranslating, setIsTranslating] = useState(globalTranslatingCount > 0);

  useEffect(() => {
    const listener = (translating: boolean) => setIsTranslating(translating);
    translatingListeners.add(listener);
    return () => {
      translatingListeners.delete(listener);
    };
  }, []);

  return { isTranslating };
}

export default useDynamicTranslation;
