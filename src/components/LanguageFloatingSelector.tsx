import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { WelcomeLanguageModal } from "@/components/WelcomeLanguageModal";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LANGUAGE_DATA: Record<string, { flag: string; name: string }> = {
  es: { flag: '🇪🇸', name: 'Español' },
  en: { flag: '🇬🇧', name: 'English' },
  ca: { flag: '🏴󠁥󠁳󠁣󠁴󠁿', name: 'Català' },
  fr: { flag: '🇫🇷', name: 'Français' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
  pt: { flag: '🇵🇹', name: 'Português' },
  it: { flag: '🇮🇹', name: 'Italiano' },
  'zh-CN': { flag: '🇨🇳', name: '简体中文' },
  'zh-TW': { flag: '🇹🇼', name: '繁體中文' },
  ja: { flag: '🇯🇵', name: '日本語' },
  ko: { flag: '🇰🇷', name: '한국어' },
  ar: { flag: '🇸🇦', name: 'العربية' },
  ru: { flag: '🇷🇺', name: 'Русский' },
  nl: { flag: '🇳🇱', name: 'Nederlands' },
  pl: { flag: '🇵🇱', name: 'Polski' },
  'pt-BR': { flag: '🇧🇷', name: 'Português (BR)' },
  'es-MX': { flag: '🇲🇽', name: 'Español (MX)' },
  'en-US': { flag: '🇺🇸', name: 'English (US)' },
};

export function LanguageFloatingSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();

  const currentLang = LANGUAGE_DATA[language] || { flag: '🌐', name: 'Language' };

  return (
    <>
      <div className="fixed left-4 bottom-20 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsModalOpen(true)}
                className="h-11 w-11 rounded-full bg-background/90 backdrop-blur-sm border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:border-primary/40 group"
                aria-label={`Idioma actual: ${currentLang.name}. Clic para cambiar`}
              >
                <motion.span 
                  key={language}
                  initial={{ scale: 0.5, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="text-xl group-hover:scale-110 transition-transform"
                >
                  {currentLang.flag}
                </motion.span>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <span>{currentLang.name}</span>
            <span className="text-muted-foreground ml-1.5 text-xs">• Cambiar</span>
          </TooltipContent>
        </Tooltip>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <WelcomeLanguageModal
            mode="selector"
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
}
