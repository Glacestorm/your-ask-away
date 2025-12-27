import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'obelixia_welcome_language_shown';
const REMEMBER_KEY = 'obelixia_language_remembered';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
}

const FEATURED_LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'España' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'UK' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿', region: 'Catalunya' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'France' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Deutschland' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'Portugal' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Italia' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸', region: 'País Vasco' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸', region: 'Galicia' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Nederland' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', region: '中国' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: '日本' },
];

export function WelcomeLanguageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [rememberChoice, setRememberChoice] = useState(true);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    // Check if modal was already shown or if language was remembered
    const wasShown = localStorage.getItem(STORAGE_KEY);
    const wasRemembered = localStorage.getItem(REMEMBER_KEY);
    
    if (!wasShown && !wasRemembered) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleConfirm = () => {
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
      if (rememberChoice) {
        localStorage.setItem(REMEMBER_KEY, 'true');
      }
    }
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)]" />
        
        <DialogHeader className="relative p-6 pb-2 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Globe className="w-8 h-8 text-white" />
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            ¡Bienvenido! Welcome!
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Selecciona tu idioma preferido para una mejor experiencia
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-6 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <AnimatePresence>
              {FEATURED_LANGUAGES.map((lang, index) => (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={cn(
                    "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200",
                    "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                    selectedLanguage === lang.code
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-border/50 bg-card/50"
                  )}
                >
                  {selectedLanguage === lang.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  
                  <span className="text-2xl mb-1">{lang.flag}</span>
                  <span className="text-xs font-medium text-foreground truncate w-full text-center">
                    {lang.nativeName}
                  </span>
                  {lang.region && (
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {lang.region}
                    </span>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
            <Checkbox
              id="remember"
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked === true)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Recordar mi elección / Remember my choice
            </label>
          </div>
        </div>

        <div className="relative flex gap-3 p-6 pt-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1"
          >
            Omitir / Skip
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLanguage}
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Sparkles className="w-4 h-4" />
            Continuar / Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeLanguageModal;
