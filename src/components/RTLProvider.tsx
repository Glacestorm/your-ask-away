import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { isRTLLocale } from '@/hooks/useSupportedLanguages';

interface RTLProviderProps {
  children: React.ReactNode;
}

/**
 * RTLProvider - Manages RTL (Right-to-Left) direction for Arabic, Hebrew, Persian, Urdu
 * Automatically sets the document direction based on current language
 */
export function RTLProvider({ children }: RTLProviderProps) {
  const { language } = useLanguage();

  useEffect(() => {
    const isRTL = isRTLLocale(language);
    
    // Update document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add/remove RTL class for Tailwind utilities
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }

    return () => {
      // Cleanup is handled by the next effect run
    };
  }, [language]);

  return <>{children}</>;
}

export default RTLProvider;
