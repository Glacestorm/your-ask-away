import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Languages, Check } from 'lucide-react';
import { useGlobalTranslationState } from '@/hooks/useDynamicTranslation';
import { subscribeToCMSTranslating, getTranslationProgress } from '@/hooks/cms/useCMSTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { RegionalFlag } from '@/components/ui/RegionalFlag';
import { Progress } from '@/components/ui/progress';

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  ca: 'Català',
  eu: 'Euskara',
  gl: 'Galego',
  oc: 'Occitan',
  ast: 'Asturianu',
  an: 'Aragonés',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  'zh-CN': '中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  ru: 'Русский',
  nl: 'Nederlands',
  pl: 'Polski',
  az: 'Azərbaycan',
  tr: 'Türkçe',
  uk: 'Українська',
  cs: 'Čeština',
  ro: 'Română',
  hu: 'Magyar',
  sv: 'Svenska',
  da: 'Dansk',
  no: 'Norsk',
  fi: 'Suomi',
  el: 'Ελληνικά',
  he: 'עברית',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  'pt-BR': 'Português (BR)',
  'es-MX': 'Español (MX)',
  'en-US': 'English (US)',
};

interface TranslationProgress {
  isTranslating: boolean;
  total: number;
  completed: number;
  percentage: number;
}

/**
 * Global loading indicator that shows when translations are in progress.
 * Appears as a subtle toast at the bottom of the screen with flag and progress.
 */
export function TranslationLoadingIndicator() {
  const { isTranslating } = useGlobalTranslationState();
  const { language, loadingDynamic } = useLanguage();
  const [showIndicator, setShowIndicator] = useState(false);
  const [displayLang, setDisplayLang] = useState(language);
  const [cmsProgress, setCmsProgress] = useState<TranslationProgress>(getTranslationProgress());
  const [showComplete, setShowComplete] = useState(false);

  // Subscribe to CMS translation state with progress
  useEffect(() => {
    const unsubscribe = subscribeToCMSTranslating((progress) => {
      setCmsProgress(progress);
    });
    return () => { unsubscribe(); };
  }, []);

  // Show indicator when translating or loading dynamic translations
  const isLoading = isTranslating || loadingDynamic || cmsProgress.isTranslating;
  const percentage = cmsProgress.percentage;

  // Debounce to avoid flickering and show completion message
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      setDisplayLang(language);
      setShowComplete(false);
      timeout = setTimeout(() => setShowIndicator(true), 100);
    } else {
      // Show completion briefly before hiding
      if (showIndicator && cmsProgress.total > 0) {
        setShowComplete(true);
        timeout = setTimeout(() => {
          setShowComplete(false);
          setShowIndicator(false);
        }, 1500);
      } else {
        timeout = setTimeout(() => setShowIndicator(false), 300);
      }
    }

    return () => clearTimeout(timeout);
  }, [isLoading, language, showIndicator, cmsProgress.total]);

  const langName = LANGUAGE_NAMES[displayLang] || displayLang;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex flex-col gap-2 px-5 py-3 rounded-2xl bg-background/95 backdrop-blur-lg border border-border/60 shadow-xl shadow-black/15 min-w-[280px]">
            {/* Header with flag, text, and percentage */}
            <div className="flex items-center gap-3">
              {/* Flag */}
              <RegionalFlag code={displayLang} size="sm" />
              
              {/* Text and status */}
              <div className="flex-1">
                {showComplete ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground/90">
                      ¡Traducción completada!
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-foreground/90">
                    Traduciendo a {langName}
                  </span>
                )}
              </div>
              
              {/* Percentage or spinner */}
              {showComplete ? (
                <span className="text-sm font-bold text-green-500">100%</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{percentage}%</span>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="w-full">
              <Progress 
                value={showComplete ? 100 : percentage} 
                className="h-1.5" 
              />
            </div>
            
            {/* Item count */}
            {cmsProgress.total > 0 && !showComplete && (
              <div className="text-xs text-muted-foreground text-center">
                {cmsProgress.completed} / {cmsProgress.total} elementos
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TranslationLoadingIndicator;