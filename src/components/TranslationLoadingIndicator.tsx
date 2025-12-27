import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Languages } from 'lucide-react';
import { useGlobalTranslationState } from '@/hooks/useDynamicTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  ca: 'Català',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  'zh-CN': '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  ru: 'Русский',
};

/**
 * Global loading indicator that shows when translations are in progress.
 * Appears as a subtle toast at the bottom of the screen.
 */
export function TranslationLoadingIndicator() {
  const { isTranslating } = useGlobalTranslationState();
  const { language, loadingDynamic } = useLanguage();
  const [showIndicator, setShowIndicator] = useState(false);
  const [displayLang, setDisplayLang] = useState(language);

  // Show indicator when translating or loading dynamic translations
  const isLoading = isTranslating || loadingDynamic;

  // Debounce to avoid flickering
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      setDisplayLang(language);
      timeout = setTimeout(() => setShowIndicator(true), 200);
    } else {
      timeout = setTimeout(() => setShowIndicator(false), 300);
    }

    return () => clearTimeout(timeout);
  }, [isLoading, language]);

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
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-background/95 backdrop-blur-lg border border-border/60 shadow-lg shadow-black/10">
            <div className="relative">
              <Languages className="w-4 h-4 text-primary" />
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-full h-full rounded-full border-2 border-transparent border-t-primary/30" />
              </motion.div>
            </div>
            
            <span className="text-sm font-medium text-foreground/90">
              Traduciendo a {langName}
            </span>
            
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TranslationLoadingIndicator;
