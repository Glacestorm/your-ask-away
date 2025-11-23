import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ca' | 'es' | 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Language) || 'ca';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    const translations = getTranslations(language);
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const getTranslations = (lang: Language): Record<string, string> => {
  switch (lang) {
    case 'ca':
      return require('@/locales/ca').default;
    case 'es':
      return require('@/locales/es').default;
    case 'fr':
      return require('@/locales/fr').default;
    case 'en':
      return require('@/locales/en').default;
    default:
      return require('@/locales/ca').default;
  }
};
