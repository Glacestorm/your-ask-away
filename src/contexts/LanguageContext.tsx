import { createContext, useContext, useState, ReactNode } from 'react';
import caTranslations from '@/locales/ca';
import esTranslations from '@/locales/es';
import frTranslations from '@/locales/fr';
import enTranslations from '@/locales/en';

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

const translations: Record<Language, Record<string, string>> = {
  ca: caTranslations,
  es: esTranslations,
  fr: frTranslations,
  en: enTranslations,
};

const getTranslations = (lang: Language): Record<string, string> => {
  return translations[lang] || translations.ca;
};
