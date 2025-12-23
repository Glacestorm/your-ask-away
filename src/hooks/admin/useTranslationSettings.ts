import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SupportedLanguage } from '@/hooks/useSupportedLanguages';

// === INTERFACES ===
export interface TranslationSettingsError {
  code: string;
  message: string;
  details?: string;
}

export interface TranslationSettingsContext {
  languageId?: string;
  locale?: string;
}

// === HOOK ===
export function useTranslationSettings() {
  // Estado
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TranslationSettingsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [savingLocale, setSavingLocale] = useState<string | null>(null);
  const [deletingLocale, setDeletingLocale] = useState<string | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH LANGUAGES ===
  const fetchLanguages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('supported_languages')
        .select('*')
        .order('tier', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setLanguages(data as SupportedLanguage[]);
      setLastRefresh(new Date());
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError({ code: 'FETCH_ERROR', message });
      console.error('[useTranslationSettings] fetchLanguages error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === TOGGLE LANGUAGE ACTIVE ===
  const toggleLanguageActive = useCallback(async (lang: SupportedLanguage) => {
    setSavingLocale(lang.locale);
    try {
      const { error: updateError } = await supabase
        .from('supported_languages')
        .update({ is_active: !lang.is_active })
        .eq('id', lang.id);

      if (updateError) throw updateError;

      toast.success(`${lang.name} ${!lang.is_active ? 'activado' : 'desactivado'}`);
      await fetchLanguages();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar idioma';
      toast.error(message);
      return false;
    } finally {
      setSavingLocale(null);
    }
  }, [fetchLanguages]);

  // === DELETE TRANSLATIONS ===
  const deleteTranslations = useCallback(async (locale: string) => {
    setDeletingLocale(locale);
    try {
      const { error: deleteError } = await supabase
        .from('cms_translations')
        .delete()
        .eq('locale', locale);

      if (deleteError) throw deleteError;

      // Reset progress
      await supabase
        .from('supported_languages')
        .update({ translation_progress: 0 })
        .eq('locale', locale);

      toast.success(`Traducciones de ${locale} eliminadas`);
      await fetchLanguages();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar traducciones';
      toast.error(message);
      return false;
    } finally {
      setDeletingLocale(null);
    }
  }, [fetchLanguages]);

  // === RESET/RECALCULATE PROGRESS ===
  const resetProgress = useCallback(async (locale: string) => {
    try {
      // Recalculate progress
      const { count: esCount } = await supabase
        .from('cms_translations')
        .select('*', { count: 'exact', head: true })
        .eq('locale', 'es');

      const { count: localeCount } = await supabase
        .from('cms_translations')
        .select('*', { count: 'exact', head: true })
        .eq('locale', locale);

      const progress = esCount && localeCount 
        ? Math.round((localeCount / esCount) * 100) 
        : 0;

      await supabase
        .from('supported_languages')
        .update({ translation_progress: progress })
        .eq('locale', locale);

      toast.success(`Progreso actualizado: ${progress}%`);
      await fetchLanguages();
      return progress;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al recalcular progreso';
      toast.error(message);
      return null;
    }
  }, [fetchLanguages]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchLanguages();
    autoRefreshInterval.current = setInterval(() => {
      fetchLanguages();
    }, intervalMs);
  }, [fetchLanguages]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  // === RETURN ===
  return {
    // Estado
    languages,
    isLoading,
    error,
    lastRefresh,
    savingLocale,
    deletingLocale,
    // Acciones
    fetchLanguages,
    toggleLanguageActive,
    deleteTranslations,
    resetProgress,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useTranslationSettings;
