import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'day' | 'night' | 'creand' | 'aurora' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'day' | 'night' | 'creand' | 'aurora';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): 'day' | 'night' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
  }
  return 'day';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('day');
  const [systemTheme, setSystemTheme] = useState<'day' | 'night'>('day');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved) {
      setThemeState(saved as ThemeMode);
    }
    setSystemTheme(getSystemTheme());
    setIsInitialized(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'night' : 'day');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-day', 'theme-night', 'theme-creand', 'theme-aurora');
    
    // Add current resolved theme class
    root.classList.add(`theme-${resolvedTheme}`);
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
