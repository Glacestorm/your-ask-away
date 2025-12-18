import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTheme();

    // Subscribe to theme changes
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
  }, []);

  const loadTheme = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cms_themes')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setTheme({
          id: data.id,
          name: data.theme_name,
          isDarkMode: data.is_dark_mode,
          colorPalette: data.color_palette || defaultTheme.colorPalette,
          isActive: data.is_active
        });

        // Apply theme to CSS variables
        applyTheme(data.color_palette);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading theme:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (palette: Record<string, string>) => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(palette)) {
      root.style.setProperty(`--cms-${key}`, value);
    }
  };

  const setActiveTheme = async (themeId: string) => {
    try {
      await supabase.functions.invoke('cms-sync-theme', {
        body: { themeId, forceRefresh: true }
      });
      await loadTheme();
      return true;
    } catch (err) {
      console.error('Error setting theme:', err);
      return false;
    }
  };

  return { theme, loading, error, setActiveTheme, refresh: loadTheme };
}
