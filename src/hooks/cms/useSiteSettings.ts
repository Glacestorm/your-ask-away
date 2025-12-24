import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === ERROR TIPADO KB ===
export interface SiteSettingsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface SiteSettings {
  site_name: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  social_links: Record<string, string>;
  external_scripts: Array<{ name: string; src: string; async?: boolean }>;
}

const defaultSettings: SiteSettings = {
  site_name: 'ObelixIA',
  site_description: '',
  logo_url: '',
  favicon_url: '',
  primary_color: '#1e40af',
  secondary_color: '#059669',
  contact_email: '',
  contact_phone: '',
  address: '',
  social_links: {},
  external_scripts: []
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SiteSettingsError | null>(null);
  // === ESTADO KB ===
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setError(null);
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('cms_site_settings')
        .select('setting_key, setting_value')
        .eq('is_public', true);

      if (fetchError) throw fetchError;

      const settingsMap: Record<string, any> = {};
      for (const item of data || []) {
        settingsMap[item.setting_key] = item.setting_value;
      }

      setSettings(prev => ({
        ...prev,
        ...settingsMap.site_name && { site_name: settingsMap.site_name },
        ...settingsMap.site_description && { site_description: settingsMap.site_description },
        ...settingsMap.logo_url && { logo_url: settingsMap.logo_url },
        ...settingsMap.favicon_url && { favicon_url: settingsMap.favicon_url },
        ...settingsMap.primary_color && { primary_color: settingsMap.primary_color },
        ...settingsMap.secondary_color && { secondary_color: settingsMap.secondary_color },
        ...settingsMap.contact_email && { contact_email: settingsMap.contact_email },
        ...settingsMap.contact_phone && { contact_phone: settingsMap.contact_phone },
        ...settingsMap.address && { address: settingsMap.address },
        ...settingsMap.social_links && { social_links: settingsMap.social_links },
        ...settingsMap.external_scripts && { external_scripts: settingsMap.external_scripts }
      }));
      setLastRefresh(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError({ code: 'LOAD_SETTINGS_ERROR', message });
      console.error('Error loading site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof SiteSettings, value: any) => {
    try {
      await (supabase as any)
        .from('cms_site_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          label: key.replace(/_/g, ' '),
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      setSettings(prev => ({ ...prev, [key]: value }));
      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      return false;
    }
  };

  return { 
    settings, 
    loading, 
    error, 
    updateSetting, 
    refresh: loadSettings,
    // === KB ADDITIONS ===
    lastRefresh,
    clearError,
  };
}
