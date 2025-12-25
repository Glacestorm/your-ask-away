import { useState, useEffect, useCallback } from 'react';

export type ObelixiaTheme = 'dark' | 'light';
export type ObelixiaViewMode = 'compact' | 'expanded';

interface ObelixiaAdminPreferences {
  theme: ObelixiaTheme;
  viewMode: ObelixiaViewMode;
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
}

const STORAGE_KEY = 'obelixia-admin-preferences';

const defaultPreferences: ObelixiaAdminPreferences = {
  theme: 'dark',
  viewMode: 'expanded',
  sidebarCollapsed: false,
  animationsEnabled: true,
};

export function useObelixiaAdminPreferences() {
  const [preferences, setPreferences] = useState<ObelixiaAdminPreferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading preferences:', e);
    }
    return defaultPreferences;
  });

  // Persist to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving preferences:', e);
    }
  }, [preferences]);

  const setTheme = useCallback((theme: ObelixiaTheme) => {
    setPreferences(prev => ({ ...prev, theme }));
  }, []);

  const setViewMode = useCallback((viewMode: ObelixiaViewMode) => {
    setPreferences(prev => ({ ...prev, viewMode }));
  }, []);

  const setSidebarCollapsed = useCallback((sidebarCollapsed: boolean) => {
    setPreferences(prev => ({ ...prev, sidebarCollapsed }));
  }, []);

  const setAnimationsEnabled = useCallback((animationsEnabled: boolean) => {
    setPreferences(prev => ({ ...prev, animationsEnabled }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferences(prev => ({ 
      ...prev, 
      theme: prev.theme === 'dark' ? 'light' : 'dark' 
    }));
  }, []);

  const toggleViewMode = useCallback(() => {
    setPreferences(prev => ({ 
      ...prev, 
      viewMode: prev.viewMode === 'compact' ? 'expanded' : 'compact' 
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setPreferences(prev => ({ 
      ...prev, 
      sidebarCollapsed: !prev.sidebarCollapsed 
    }));
  }, []);

  return {
    ...preferences,
    setTheme,
    setViewMode,
    setSidebarCollapsed,
    setAnimationsEnabled,
    toggleTheme,
    toggleViewMode,
    toggleSidebar,
  };
}
