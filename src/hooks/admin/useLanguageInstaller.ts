import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import esTranslations from '@/locales/es';
import { toast } from 'sonner';

interface UseLanguageInstallerOptions {
  onComplete?: () => void | Promise<void>;
}

const UI_NAMESPACE = 'ui';
const BASE_LOCALES = ['es', 'en', 'ca', 'fr'];

export function useLanguageInstaller(options: UseLanguageInstallerOptions = {}) {
  const [installingLocale, setInstallingLocale] = useState<string | null>(null);

  const ensureSpanishSeeded = useCallback(async () => {
    const expected = Object.keys(esTranslations).length;

    const { count, error } = await supabase
      .from('cms_translations')
      .select('*', { count: 'exact', head: true })
      .eq('locale', 'es')
      .eq('namespace', UI_NAMESPACE);

    if (error) throw error;

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

  const translateLocaleFromSpanish = useCallback(async (locale: string) => {
    if (BASE_LOCALES.includes(locale)) return;

    const translationKeys = Object.keys(esTranslations);

    const { data: existing, error: existingError } = await supabase
      .from('cms_translations')
      .select('translation_key')
      .eq('locale', locale)
      .eq('namespace', UI_NAMESPACE);

    if (existingError) throw existingError;

    const existingKeys = new Set((existing ?? []).map((r: any) => r.translation_key));
    const keysToTranslate = translationKeys.filter((k) => !existingKeys.has(k));

    if (keysToTranslate.length === 0) return;

    const BATCH_SIZE = 25;
    for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
      const batch = keysToTranslate.slice(i, i + BATCH_SIZE);
      const items = batch.map((key) => ({
        key,
        text: (esTranslations as any)[key],
        namespace: UI_NAMESPACE,
      }));

      const { error } = await supabase.functions.invoke('cms-batch-translate', {
        body: {
          items,
          sourceLocale: 'es',
          targetLocale: locale,
          saveToDb: true,
        },
      });

      if (error) throw new Error(error.message);
    }

    // Update progress
    const { count: esCount, error: esCountError } = await supabase
      .from('cms_translations')
      .select('*', { count: 'exact', head: true })
      .eq('locale', 'es')
      .eq('namespace', UI_NAMESPACE);

    if (esCountError) throw esCountError;

    const { count: locCount, error: locCountError } = await supabase
      .from('cms_translations')
      .select('*', { count: 'exact', head: true })
      .eq('locale', locale)
      .eq('namespace', UI_NAMESPACE);

    if (locCountError) throw locCountError;

    const progress = esCount ? Math.round(((locCount ?? 0) / esCount) * 100) : 0;

    await supabase
      .from('supported_languages')
      .update({ translation_progress: progress })
      .eq('locale', locale);
  }, []);

  const installLanguage = useCallback(
    async (locale: string) => {
      if (installingLocale) return;

      setInstallingLocale(locale);
      toast.message(`Instalando idioma: ${locale}...`);

      try {
        await ensureSpanishSeeded();
        await translateLocaleFromSpanish(locale);
        toast.success(`Idioma instalado: ${locale}`);
        await options.onComplete?.();
      } catch (err) {
        console.error('Language install error:', err);
        toast.error('No se pudo instalar el idioma. Reintenta en unos segundos.');
      } finally {
        setInstallingLocale(null);
      }
    },
    [ensureSpanishSeeded, translateLocaleFromSpanish, installingLocale, options]
  );

  return {
    installLanguage,
    installingLocale,
  };
}
