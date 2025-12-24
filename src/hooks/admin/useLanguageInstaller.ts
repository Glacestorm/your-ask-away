import { useCallback, useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import esTranslations from '@/locales/es';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// === INTERFACES ===
export interface LanguageInstallerContext {
  locale: string;
  sourceLocale?: string;
  namespace?: string;
}

// Re-export for backwards compat
export type LanguageInstallerError = KBError;

interface UseLanguageInstallerOptions {
  onComplete?: () => void | Promise<void>;
}

const UI_NAMESPACE = 'ui';
// Only skip Spanish and English (source languages with static files)
const SKIP_LOCALES = ['es', 'en'];

export function useLanguageInstaller(options: UseLanguageInstallerOptions = {}) {
  const [installingLocale, setInstallingLocale] = useState<string | null>(null);
  const [translationProgress, setTranslationProgress] = useState<{ current: number; total: number } | null>(null);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Refs para auto-refresh de estado
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const ensureSpanishSeeded = useCallback(async () => {
    const expected = Object.keys(esTranslations).length;

    const { count, error: countError } = await supabase
      .from('cms_translations')
      .select('*', { count: 'exact', head: true })
      .eq('locale', 'es')
      .eq('namespace', UI_NAMESPACE);

    if (countError) throw countError;

    // If already seeded (or mostly seeded), skip.
    if ((count ?? 0) >= Math.floor(expected * 0.8)) return;

    const entries = Object.entries(esTranslations);
    const BATCH_SIZE = 100;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const items = batch.map(([translation_key, value]) => ({
        locale: 'es',
        translation_key,
        value: String(value ?? ''),
        namespace: UI_NAMESPACE,
      }));

      const { error: upsertError } = await supabase
        .from('cms_translations')
        .upsert(items, { onConflict: 'translation_key,namespace,locale' });

      if (upsertError) throw upsertError;
    }
  }, []);

  // Get all Spanish keys from database instead of static file
  const getSpanishKeysFromDB = useCallback(async () => {
    const allKeys: { translation_key: string; value: string }[] = [];
    let from = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error: fetchError } = await supabase
        .from('cms_translations')
        .select('translation_key, value')
        .eq('locale', 'es')
        .range(from, from + pageSize - 1);
      
      if (fetchError) throw fetchError;
      if (!data || data.length === 0) break;
      
      allKeys.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    
    return allKeys;
  }, []);

  const translateLocaleFromSpanish = useCallback(async (locale: string) => {
    // Only skip Spanish and English (source languages)
    if (SKIP_LOCALES.includes(locale)) return;

    // Get all Spanish keys from database
    const spanishKeys = await getSpanishKeysFromDB();

    // Get existing translations for target locale (paginated)
    const existingKeys = new Set<string>();
    let from = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error: fetchError } = await supabase
        .from('cms_translations')
        .select('translation_key')
        .eq('locale', locale)
        .range(from, from + pageSize - 1);
      
      if (fetchError) throw fetchError;
      if (!data || data.length === 0) break;
      
      data.forEach((r: any) => existingKeys.add(r.translation_key));
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Find keys that need translation
    const keysToTranslate = spanishKeys.filter((k) => !existingKeys.has(k.translation_key));

    if (keysToTranslate.length === 0) {
      console.log(`All keys already translated for ${locale}`);
      return;
    }

    console.log(`Translating ${keysToTranslate.length} keys for ${locale}`);
    setTranslationProgress({ current: 0, total: keysToTranslate.length });

    const BATCH_SIZE = 25;
    let translated = 0;
    
    for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
      const batch = keysToTranslate.slice(i, i + BATCH_SIZE);
      const items = batch.map((k) => ({
        key: k.translation_key,
        text: k.value,
        namespace: UI_NAMESPACE,
      }));

      try {
        const { error: invokeError } = await supabase.functions.invoke('cms-batch-translate', {
          body: {
            items,
            sourceLocale: 'es',
            targetLocale: locale,
            saveToDb: true,
          },
        });

        if (invokeError) {
          console.error(`Batch translation error:`, invokeError);
          // Continue with next batch instead of failing completely
        } else {
          translated += batch.length;
          setTranslationProgress({ current: translated, total: keysToTranslate.length });
        }
      } catch (err) {
        console.error(`Batch ${i / BATCH_SIZE} failed:`, err);
        // Continue with next batch
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update progress
    const { count: esCount, error: esCountError } = await supabase
      .from('cms_translations')
      .select('*', { count: 'exact', head: true })
      .eq('locale', 'es');

    if (esCountError) throw esCountError;

    const { count: locCount, error: locCountError } = await supabase
      .from('cms_translations')
      .select('*', { count: 'exact', head: true })
      .eq('locale', locale);

    if (locCountError) throw locCountError;

    // Cap progress at 100% to handle edge cases where locale might have more entries
    const progress = esCount ? Math.min(100, Math.round(((locCount ?? 0) / esCount) * 100)) : 0;

    await supabase
      .from('supported_languages')
      .update({ translation_progress: progress })
      .eq('locale', locale);
      
    setTranslationProgress(null);
    setLastRefresh(new Date());
  }, [getSpanishKeysFromDB]);

  const installLanguage = useCallback(
    async (locale: string) => {
      if (installingLocale) return;

      const startTime = Date.now();
      setInstallingLocale(locale);
      setStatus('loading');
      setError(null);
      toast.message(`Instalando idioma: ${locale}...`);

      try {
        await ensureSpanishSeeded();
        await translateLocaleFromSpanish(locale);
        toast.success(`Idioma instalado: ${locale}`);
        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setStatus('success');
        setRetryCount(0);
        collectTelemetry('useLanguageInstaller', 'installLanguage', 'success', Date.now() - startTime);
        await options.onComplete?.();
      } catch (err) {
        console.error('Language install error:', err);
        const kbError = createKBError('INSTALL_ERROR', err instanceof Error ? err.message : 'Error desconocido', { details: { locale } });
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        collectTelemetry('useLanguageInstaller', 'installLanguage', 'error', Date.now() - startTime, kbError);
        toast.error('No se pudo instalar el idioma. Reintenta en unos segundos.');
      } finally {
        setInstallingLocale(null);
      }
    },
    [ensureSpanishSeeded, translateLocaleFromSpanish, installingLocale, options]
  );

  // === AUTO-REFRESH (para monitorear estado) ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    autoRefreshInterval.current = setInterval(() => {
      setLastRefresh(new Date());
    }, intervalMs);
  }, []);

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

  return {
    installLanguage,
    installingLocale,
    translationProgress,
    error,
    startAutoRefresh,
    stopAutoRefresh,
    // === KB 2.0 STATE ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}

export default useLanguageInstaller;
