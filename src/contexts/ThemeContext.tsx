import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'day' | 'night' | 'creand' | 'aurora';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeMode) || 'day';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-day', 'theme-night', 'theme-creand', 'theme-aurora');
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
