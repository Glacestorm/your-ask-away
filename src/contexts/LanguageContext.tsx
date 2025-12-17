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

const translations: Record<Language, Record<string, string>> = {
  ca: caTranslations,
  es: esTranslations,
  fr: frTranslations,
  en: enTranslations,
};

const getTranslations = (lang: Language): Record<string, string> => {
  return translations[lang] || translations.ca;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

const getInitialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['ca', 'es', 'fr', 'en'].includes(stored)) {
      return stored as Language;
    }
  } catch (e) {
    console.error('Error reading language from localStorage:', e);
  }
  return 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error('Error saving language to localStorage:', e);
    }
  };

  const t = (key: string): string => {
    const currentTranslations = getTranslations(language);
    return currentTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
