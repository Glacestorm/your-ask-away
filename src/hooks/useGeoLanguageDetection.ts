import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// Storage keys
const GEO_DETECTION_DONE_KEY = 'obelixia_geo_detection_done';
const LANGUAGE_PREFERENCE_KEY = 'preferred_language';

// Valid languages that can be set via geo detection
const VALID_GEO_LANGUAGES: Language[] = [
  'es', 'en', 'ca', 'eu', 'gl', 'fr', 'pt', 'pt-BR', 'de', 'it', 
  'nl', 'pl', 'ru', 'ar', 'zh-CN', 'zh-TW', 'ja', 'ko', 'sv', 'no', 
  'da', 'fi', 'el', 'he', 'hi', 'id', 'ms', 'tl', 'ro', 'hu', 'cs', 
  'tr', 'th', 'vi', 'uk'
];

interface GeoDetectionResult {
  success: boolean;
  detectedLocale: string;
  country: string;
  region: string;
  isRegionalLanguage: boolean;
  languageName: string;
  languageNativeName: string;
}

interface UseGeoLanguageDetectionReturn {
  isDetecting: boolean;
  detectedLocale: string | null;
  detectionDone: boolean;
  error: string | null;
  dismissSuggestion: () => void;
  acceptSuggestion: () => void;
  showingSuggestion: boolean;
}

// Messages for different detected languages
const SUGGESTION_MESSAGES: Record<string, { title: string; message: string; accept: string; decline: string }> = {
  ca: {
    title: 'Idioma detectat',
    message: 'Hem detectat que ets a una zona catalanoparlant. Vols veure el contingut en Català?',
    accept: 'Sí, en Català',
    decline: 'No, prefereixo un altre idioma',
  },
  eu: {
    title: 'Hizkuntza detektatua',
    message: 'Euskal Herriko zonaldean zaudela detektatu dugu. Edukia euskaraz ikusi nahi duzu?',
    accept: 'Bai, euskaraz',
    decline: 'Ez, beste hizkuntza bat nahiago dut',
  },
  gl: {
    title: 'Idioma detectado',
    message: 'Detectamos que estás nunha zona galego-falante. Queres ver o contido en Galego?',
    accept: 'Si, en Galego',
    decline: 'Non, prefiro outro idioma',
  },
  en: {
    title: 'Language detected',
    message: 'We detected you\'re in an English-speaking region. Would you like to view content in English?',
    accept: 'Yes, in English',
    decline: 'No, I prefer another language',
  },
  fr: {
    title: 'Langue détectée',
    message: 'Nous avons détecté que vous êtes dans une région francophone. Voulez-vous voir le contenu en Français?',
    accept: 'Oui, en Français',
    decline: 'Non, je préfère une autre langue',
  },
  pt: {
    title: 'Idioma detectado',
    message: 'Detectamos que você está em uma região lusófona. Gostaria de ver o conteúdo em Português?',
    accept: 'Sim, em Português',
    decline: 'Não, prefiro outro idioma',
  },
  de: {
    title: 'Sprache erkannt',
    message: 'Wir haben erkannt, dass Sie sich in einer deutschsprachigen Region befinden. Möchten Sie den Inhalt auf Deutsch sehen?',
    accept: 'Ja, auf Deutsch',
    decline: 'Nein, ich bevorzuge eine andere Sprache',
  },
  it: {
    title: 'Lingua rilevata',
    message: 'Abbiamo rilevato che ti trovi in una regione di lingua italiana. Vuoi vedere il contenuto in Italiano?',
    accept: 'Sì, in Italiano',
    decline: 'No, preferisco un\'altra lingua',
  },
  // Default fallback (Spanish)
  default: {
    title: 'Idioma detectado',
    message: 'Hemos detectado tu ubicación. ¿Te gustaría cambiar el idioma?',
    accept: 'Aceptar',
    decline: 'No, gracias',
  },
};

export function useGeoLanguageDetection(): UseGeoLanguageDetectionReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<string | null>(null);
  const [detectionDone, setDetectionDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showingSuggestion, setShowingSuggestion] = useState(false);
  
  const { language, setLanguage } = useLanguage();

  // Check if detection was already done
  const wasDetectionDone = useCallback(() => {
    try {
      return localStorage.getItem(GEO_DETECTION_DONE_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  // Mark detection as done
  const markDetectionDone = useCallback(() => {
    try {
      localStorage.setItem(GEO_DETECTION_DONE_KEY, 'true');
      setDetectionDone(true);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Accept the language suggestion
  const acceptSuggestion = useCallback(() => {
    if (detectedLocale && VALID_GEO_LANGUAGES.includes(detectedLocale as Language)) {
      setLanguage(detectedLocale as Language);
      markDetectionDone();
      setShowingSuggestion(false);
      toast.dismiss('geo-language-suggestion');
    }
  }, [detectedLocale, setLanguage, markDetectionDone]);

  // Dismiss the suggestion
  const dismissSuggestion = useCallback(() => {
    markDetectionDone();
    setShowingSuggestion(false);
    toast.dismiss('geo-language-suggestion');
  }, [markDetectionDone]);

  // Show language suggestion toast
  const showLanguageSuggestion = useCallback((locale: string, nativeName: string) => {
    const messages = SUGGESTION_MESSAGES[locale] || SUGGESTION_MESSAGES.default;
    
    setShowingSuggestion(true);
    
    toast(messages.title, {
      id: 'geo-language-suggestion',
      description: messages.message,
      duration: 15000, // 15 seconds
      action: {
        label: messages.accept,
        onClick: () => {
          if (VALID_GEO_LANGUAGES.includes(locale as Language)) {
            setLanguage(locale as Language);
          }
          markDetectionDone();
          setShowingSuggestion(false);
        },
      },
      cancel: {
        label: messages.decline,
        onClick: () => {
          markDetectionDone();
          setShowingSuggestion(false);
        },
      },
      onDismiss: () => {
        setShowingSuggestion(false);
      },
    });
  }, [setLanguage, markDetectionDone]);

  // Perform geo detection
  useEffect(() => {
    const detectLanguage = async () => {
      // Skip if already done
      if (wasDetectionDone()) {
        setDetectionDone(true);
        return;
      }

      // Skip if user already has a saved preference that's not default
      try {
        const savedLanguage = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
        if (savedLanguage && savedLanguage !== 'es') {
          markDetectionDone();
          return;
        }
      } catch {
        // Ignore localStorage errors
      }

      setIsDetecting(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke<GeoDetectionResult>(
          'detect-user-locale'
        );

        if (fnError) {
          console.error('[useGeoLanguageDetection] Function error:', fnError);
          setError(fnError.message);
          markDetectionDone();
          return;
        }

        if (data?.success && data.detectedLocale) {
          setDetectedLocale(data.detectedLocale);
          
          // Only show suggestion if detected language is different from current
          // and is not the default (Spanish)
          if (data.detectedLocale !== language && data.detectedLocale !== 'es') {
            console.log(`[useGeoLanguageDetection] Suggesting language: ${data.detectedLocale} (${data.languageNativeName})`);
            showLanguageSuggestion(data.detectedLocale, data.languageNativeName);
          } else {
            // Same language or Spanish default, just mark as done
            markDetectionDone();
          }
        } else {
          markDetectionDone();
        }
      } catch (err) {
        console.error('[useGeoLanguageDetection] Error:', err);
        setError(err instanceof Error ? err.message : 'Detection failed');
        markDetectionDone();
      } finally {
        setIsDetecting(false);
      }
    };

    // Small delay to let the app initialize first
    const timeout = setTimeout(detectLanguage, 2000);
    
    return () => clearTimeout(timeout);
  }, [wasDetectionDone, markDetectionDone, language, showLanguageSuggestion]);

  return {
    isDetecting,
    detectedLocale,
    detectionDone,
    error,
    dismissSuggestion,
    acceptSuggestion,
    showingSuggestion,
  };
}

export default useGeoLanguageDetection;
