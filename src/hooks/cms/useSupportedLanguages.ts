import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === ERROR TIPADO KB ===
export interface SupportedLanguagesError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SupportedLanguage {
  locale: string;
  name: string;
  native_name: string | null;
  is_active: boolean;
  translation_progress: number | null;
}

export function useSupportedLanguages() {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  // === ESTADO KB ===
  const [error, setError] = useState<SupportedLanguagesError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const fetchLanguages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      setLanguages(data || []);
      setLastRefresh(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching languages';
      setError({ code: 'FETCH_LANGUAGES_ERROR', message, details: { originalError: String(err) } });
      console.error('Error fetching supported languages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    languages,
    loading,
    refetch: fetchLanguages,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}
