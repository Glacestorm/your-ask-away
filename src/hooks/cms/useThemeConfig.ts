/**
 * useThemeConfig - KB 2.0 Migration
 * Theme configuration with state machine
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KBStatus, KBError, parseError, collectTelemetry } from '@/hooks/core';

interface ThemeConfig {
  id: string;
  name: string;
  isDarkMode: boolean;
  colorPalette: Record<string, string>;
  isActive: boolean;
}

const defaultTheme: ThemeConfig = {
  id: '',
  name: 'Default',
  isDarkMode: true,
  colorPalette: {
    primary: '#1e40af',
    secondary: '#059669',
    accent: '#f59e0b',
    background: '#0f172a'
  },
  isActive: true
};

export function useThemeConfig() {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  
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

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setTheme(defaultTheme);
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const applyTheme = useCallback((palette: Record<string, string>) => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(palette)) {
      root.style.setProperty(`--cms-${key}`, value);
    }
  }, []);

  const loadTheme = useCallback(async () => {
    const startTime = Date.now();
    setStatus('loading');
    setError(null);

    try {
      const { data, error: queryError } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (k: string, v: boolean) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { code?: string; message?: string } | null }> } } } })
        .from('cms_themes')
        .select('*')
        .eq('is_active', true)
        .single();

      if (queryError && queryError.code !== 'PGRST116') throw queryError;

      if (data) {
        const newTheme: ThemeConfig = {
          id: data.id as string,
          name: data.theme_name as string,
          isDarkMode: data.is_dark_mode as boolean,
          colorPalette: (data.color_palette as Record<string, string>) || defaultTheme.colorPalette,
          isActive: data.is_active as boolean
        };
        setTheme(newTheme);
        applyTheme(newTheme.colorPalette);
      }

      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useThemeConfig', 'loadTheme', 'success', Date.now() - startTime);
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useThemeConfig', 'loadTheme', 'error', Date.now() - startTime, kbError);
      console.error('Error loading theme:', err);
    }
  }, [applyTheme]);

  const setActiveTheme = useCallback(async (themeId: string) => {
    const startTime = Date.now();
    try {
      await supabase.functions.invoke('cms-sync-theme', {
        body: { themeId, forceRefresh: true }
      });
      await loadTheme();
      collectTelemetry('useThemeConfig', 'setActiveTheme', 'success', Date.now() - startTime);
      return true;
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      collectTelemetry('useThemeConfig', 'setActiveTheme', 'error', Date.now() - startTime, kbError);
      console.error('Error setting theme:', err);
      return false;
    }
  }, [loadTheme]);

  useEffect(() => {
    loadTheme();

    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'cms_themes',
        filter: 'is_active=eq.true'
      }, () => {
        loadTheme();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTheme]);

  return { 
    theme, 
    loading: isLoading, 
    error, 
    setActiveTheme, 
    refresh: loadTheme,
    // === KB 2.0 ===
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
