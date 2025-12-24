import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// === INTERFACES ===
export interface ModuleTranslation {
  id: string;
  module_id: string;
  locale: string;
  namespace: string;
  translation_key: string;
  translation_value: string;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleTranslationWithModule extends ModuleTranslation {
  module?: {
    module_name: string;
    module_key: string;
  };
}

export interface TranslationProgress {
  locale: string;
  total_keys: number;
  translated_keys: number;
  verified_keys: number;
  progress_percentage: number;
}

// Re-export for backwards compat
export type ModuleTranslationsError = KBError;

// === HOOK ===
export function useModuleTranslations(moduleId?: string, locale?: string) {
  const [translations, setTranslations] = useState<ModuleTranslationWithModule[]>([]);
  const [progress, setProgress] = useState<TranslationProgress[]>([]);

  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const loading = status === 'loading';
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

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchTranslations = useCallback(async () => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);
    try {
      let query = supabase
        .from('module_translations')
        .select(`
          *,
          module:app_modules(module_name, module_key)
        `)
        .order('translation_key');

      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      if (locale) {
        query = query.eq('locale', locale);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setTranslations(data as unknown as ModuleTranslationWithModule[]);
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setStatus('success');
      setRetryCount(0);
      collectTelemetry('useModuleTranslations', 'fetchTranslations', 'success', Date.now() - startTime);
    } catch (err) {
      console.error('Error fetching module translations:', err);
      const kbError = createKBError('FETCH_ERROR', err instanceof Error ? err.message : 'Error al cargar las traducciones del módulo', { details: { moduleId, locale } });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useModuleTranslations', 'fetchTranslations', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
    }
  }, [moduleId, locale]);

  const fetchProgress = useCallback(async () => {
    if (!moduleId) return;

    try {
      // Get Spanish keys as base (total keys)
      const { data: esKeys, error: esError } = await supabase
        .from('module_translations')
        .select('translation_key')
        .eq('module_id', moduleId)
        .eq('locale', 'es');

      if (esError) throw esError;

      const totalKeys = esKeys?.length || 0;

      // Get all translations for this module
      const { data: allTranslations, error: allError } = await supabase
        .from('module_translations')
        .select('locale, is_verified')
        .eq('module_id', moduleId);

      if (allError) throw allError;

      // Group by locale
      const localeStats: Record<string, { translated: number; verified: number }> = {};
      
      allTranslations?.forEach(t => {
        if (!localeStats[t.locale]) {
          localeStats[t.locale] = { translated: 0, verified: 0 };
        }
        localeStats[t.locale].translated++;
        if (t.is_verified) {
          localeStats[t.locale].verified++;
        }
      });

      const progressData: TranslationProgress[] = Object.entries(localeStats).map(([loc, stats]) => ({
        locale: loc,
        total_keys: totalKeys,
        translated_keys: stats.translated,
        verified_keys: stats.verified,
        progress_percentage: totalKeys > 0 ? Math.round((stats.translated / totalKeys) * 100) : 0
      }));

      setProgress(progressData);
    } catch (err) {
      console.error('Error fetching translation progress:', err);
    }
  }, [moduleId]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchTranslations();
    fetchProgress();
    autoRefreshInterval.current = setInterval(() => {
      fetchTranslations();
      fetchProgress();
    }, intervalMs);
  }, [fetchTranslations, fetchProgress]);

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

  useEffect(() => {
    fetchTranslations();
    fetchProgress();
  }, [fetchTranslations, fetchProgress]);

  const addTranslation = async (data: Omit<ModuleTranslation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error: insertError } = await supabase
        .from('module_translations')
        .insert(data);

      if (insertError) throw insertError;
      toast.success('Traducción añadida');
      await fetchTranslations();
    } catch (err) {
      console.error('Error adding translation:', err);
      toast.error('Error al añadir la traducción');
      throw err;
    }
  };

  const updateTranslation = async (id: string, data: Partial<ModuleTranslation>) => {
    try {
      const { error: updateError } = await supabase
        .from('module_translations')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;
      toast.success('Traducción actualizada');
      await fetchTranslations();
    } catch (err) {
      console.error('Error updating translation:', err);
      toast.error('Error al actualizar la traducción');
      throw err;
    }
  };

  const verifyTranslation = async (id: string, userId: string) => {
    try {
      const { error: verifyError } = await supabase
        .from('module_translations')
        .update({
          is_verified: true,
          verified_by: userId,
          verified_at: new Date().toISOString()
        })
        .eq('id', id);

      if (verifyError) throw verifyError;
      toast.success('Traducción verificada');
      await fetchTranslations();
      await fetchProgress();
    } catch (err) {
      console.error('Error verifying translation:', err);
      toast.error('Error al verificar la traducción');
      throw err;
    }
  };

  const bulkAddTranslations = async (translationsData: Omit<ModuleTranslation, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { error: upsertError } = await supabase
        .from('module_translations')
        .upsert(translationsData, {
          onConflict: 'module_id,locale,namespace,translation_key'
        });

      if (upsertError) throw upsertError;
      toast.success(`${translationsData.length} traducciones añadidas`);
      await fetchTranslations();
      await fetchProgress();
    } catch (err) {
      console.error('Error bulk adding translations:', err);
      toast.error('Error al añadir traducciones en lote');
      throw err;
    }
  };

  const translateModuleToLocale = async (modId: string, targetLocale: string) => {
    try {
      // Get Spanish translations as source
      const { data: sourceTranslations, error: sourceError } = await supabase
        .from('module_translations')
        .select('*')
        .eq('module_id', modId)
        .eq('locale', 'es');

      if (sourceError) throw sourceError;

      if (!sourceTranslations || sourceTranslations.length === 0) {
        toast.warning('No hay traducciones en español para este módulo');
        return;
      }

      // Check existing translations for target locale
      const { data: existingTranslations, error: existingError } = await supabase
        .from('module_translations')
        .select('translation_key')
        .eq('module_id', modId)
        .eq('locale', targetLocale);

      if (existingError) throw existingError;

      const existingKeys = new Set(existingTranslations?.map(t => t.translation_key) || []);
      const missingTranslations = sourceTranslations.filter(t => !existingKeys.has(t.translation_key));

      if (missingTranslations.length === 0) {
        toast.info('Todas las traducciones ya existen para este idioma');
        return;
      }

      // Translate each missing translation using the edge function
      const translatedItems: Omit<ModuleTranslation, 'id' | 'created_at' | 'updated_at'>[] = [];

      for (const source of missingTranslations) {
        try {
          const { data: translatedData, error: translateError } = await supabase.functions.invoke('cms-translate-content', {
            body: {
              text: source.translation_value,
              sourceLocale: 'es',
              targetLocale,
              contentType: 'ui'
            }
          });

          if (translateError) throw translateError;

          translatedItems.push({
            module_id: modId,
            locale: targetLocale,
            namespace: source.namespace,
            translation_key: source.translation_key,
            translation_value: translatedData.translatedText || source.translation_value,
            is_verified: false,
            verified_by: null,
            verified_at: null,
            ai_generated: true
          });
        } catch (err) {
          console.error(`Error translating key ${source.translation_key}:`, err);
          // Use original value as fallback
          translatedItems.push({
            module_id: modId,
            locale: targetLocale,
            namespace: source.namespace,
            translation_key: source.translation_key,
            translation_value: source.translation_value,
            is_verified: false,
            verified_by: null,
            verified_at: null,
            ai_generated: false
          });
        }
      }

      await bulkAddTranslations(translatedItems);
      toast.success(`Módulo traducido a ${targetLocale}: ${translatedItems.length} claves`);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error translating module:', err);
      toast.error('Error al traducir el módulo');
      throw err;
    }
  };

  return {
    translations,
    loading,
    progress,
    error,
    fetchTranslations,
    addTranslation,
    updateTranslation,
    verifyTranslation,
    bulkAddTranslations,
    translateModuleToLocale,
    startAutoRefresh,
    stopAutoRefresh,
    // === KB 2.0 STATE ===
    status,
    isIdle,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}

export function useModuleTranslationsByKey(moduleKey: string, locale: string) {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const fetchTranslations = async () => {
      setLoading(true);
      try {
        // First get the module ID
        const { data: moduleData, error: moduleError } = await supabase
          .from('app_modules')
          .select('id')
          .eq('module_key', moduleKey)
          .single();

        if (moduleError) throw moduleError;

        // Then get translations
        const { data, error: fetchError } = await supabase
          .from('module_translations')
          .select('translation_key, translation_value')
          .eq('module_id', moduleData.id)
          .eq('locale', locale);

        if (fetchError) throw fetchError;

        const translationsMap: Record<string, string> = {};
        data?.forEach(t => {
          translationsMap[t.translation_key] = t.translation_value;
        });

        setTranslations(translationsMap);
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Error fetching module translations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (moduleKey && locale) {
      fetchTranslations();
    }
  }, [moduleKey, locale]);

  const t = useCallback((key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  }, [translations]);

  return { translations, loading, t, lastRefresh };
}
