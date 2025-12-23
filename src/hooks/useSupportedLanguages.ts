import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupportedLanguage {
  id: string;
  locale: string;
  name: string;
  native_name: string;
  flag_emoji: string | null;
  is_rtl: boolean;
  tier: number;
  is_active: boolean;
  translation_progress: number;
  created_at: string;
  updated_at: string;
}

interface UseSupportedLanguagesReturn {
  languages: SupportedLanguage[];
  activeLanguages: SupportedLanguage[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getLanguageByLocale: (locale: string) => SupportedLanguage | undefined;
  isRTL: (locale: string) => boolean;
}

// Cache for languages to avoid repeated fetches
let languagesCache: SupportedLanguage[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useSupportedLanguages(): UseSupportedLanguagesReturn {
  const [languages, setLanguages] = useState<SupportedLanguage[]>(languagesCache || []);
  const [loading, setLoading] = useState(!languagesCache);
  const [error, setError] = useState<Error | null>(null);

  const loadLanguages = useCallback(async (force = false) => {
    // Use cache if valid
    if (!force && languagesCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      setLanguages(languagesCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await (supabase as any)
        .from('supported_languages')
        .select('*')
        .order('tier', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const langs = data as SupportedLanguage[];
      languagesCache = langs;
      cacheTimestamp = Date.now();
      setLanguages(langs);
      setError(null);
    } catch (err) {
      console.error('Error loading supported languages:', err);
      setError(err instanceof Error ? err : new Error('Failed to load languages'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const refresh = useCallback(async () => {
    await loadLanguages(true);
  }, [loadLanguages]);

  const activeLanguages = languages.filter(lang => lang.is_active);

  const getLanguageByLocale = useCallback((locale: string): SupportedLanguage | undefined => {
    return languages.find(lang => lang.locale === locale);
  }, [languages]);

  const isRTL = useCallback((locale: string): boolean => {
    const lang = languages.find(l => l.locale === locale);
    return lang?.is_rtl ?? false;
  }, [languages]);

  return {
    languages,
    activeLanguages,
    loading,
    error,
    refresh,
    getLanguageByLocale,
    isRTL,
  };
}

// RTL locales constant for use without hook
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export function isRTLLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}
