import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupportedLanguage } from '@/hooks/useSupportedLanguages';

// === INTERFACES ===
export interface LanguageProgressError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TierStats {
  tier: number;
  label: string;
  totalLanguages: number;
  averageProgress: number;
  completedLanguages: number;
}

// === HOOK ===
export function useLanguageProgress() {
  // Estado
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LanguageProgressError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === CALCULATE TIER STATS ===
  const calculateTierStats = useCallback((langs: SupportedLanguage[]): TierStats[] => {
    const tierConfigs: Record<number, string> = {
      1: 'Core',
      2: 'Extended',
      3: 'Regional',
      4: 'Specialized',
    };

    const tierGroups: Record<number, SupportedLanguage[]> = {};
    langs.forEach(lang => {
      const tier = lang.tier || 1;
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(lang);
    });

    return Object.entries(tierGroups).map(([tier, tierLangs]) => {
      const tierNum = Number(tier);
      const totalProgress = tierLangs.reduce((acc, l) => acc + (l.translation_progress || 0), 0);
      const completed = tierLangs.filter(l => (l.translation_progress || 0) >= 100).length;

      return {
        tier: tierNum,
        label: tierConfigs[tierNum] || 'Other',
        totalLanguages: tierLangs.length,
        averageProgress: Math.round(totalProgress / tierLangs.length),
        completedLanguages: completed,
      };
    }).sort((a, b) => a.tier - b.tier);
  }, []);

  // === FETCH LANGUAGES ===
  const fetchLanguages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const langsData = data as SupportedLanguage[];
      setLanguages(langsData);
      setTierStats(calculateTierStats(langsData));
      setLastRefresh(new Date());
      return langsData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError({ code: 'FETCH_ERROR', message, details: { originalError: String(err) } });
      console.error('[useLanguageProgress] fetchLanguages error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [calculateTierStats]);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // === GET OVERALL STATS ===
  const getOverallStats = useCallback(() => {
    if (languages.length === 0) {
      return { totalLanguages: 0, averageProgress: 0, completedLanguages: 0 };
    }

    const totalProgress = languages.reduce((acc, l) => acc + (l.translation_progress || 0), 0);
    const completed = languages.filter(l => (l.translation_progress || 0) >= 100).length;

    return {
      totalLanguages: languages.length,
      averageProgress: Math.round(totalProgress / languages.length),
      completedLanguages: completed,
    };
  }, [languages]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 45000) => {
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
    tierStats,
    // Computed
    overallStats: getOverallStats(),
    // Acciones
    fetchLanguages,
    clearError,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useLanguageProgress;
