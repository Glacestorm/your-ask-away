import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { WelcomeLanguageModal } from "@/components/WelcomeLanguageModal";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RegionalFlag, hasRegionalFlag } from "@/components/ui/RegionalFlag";

const LANGUAGE_DATA: Record<string, { name: string }> = {
  es: { name: 'Español' },
  en: { name: 'English' },
  ca: { name: 'Català' },
  eu: { name: 'Euskara' },
  gl: { name: 'Galego' },
  oc: { name: 'Occitan' },
  ast: { name: 'Asturianu' },
  an: { name: 'Aragonés' },
  fr: { name: 'Français' },
  de: { name: 'Deutsch' },
  pt: { name: 'Português' },
  it: { name: 'Italiano' },
  'zh-CN': { name: '简体中文' },
  'zh-TW': { name: '繁體中文' },
  ja: { name: '日本語' },
  ko: { name: '한국어' },
  ar: { name: 'العربية' },
  ru: { name: 'Русский' },
  nl: { name: 'Nederlands' },
  pl: { name: 'Polski' },
  'pt-BR': { name: 'Português (BR)' },
  'es-MX': { name: 'Español (MX)' },
  'en-US': { name: 'English (US)' },
};

export function LanguageFloatingSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();

  const currentLang = LANGUAGE_DATA[language] || { name: 'Language' };

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
              <motion.div 
                key={language}
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="group-hover:scale-110 transition-transform"
              >
                <RegionalFlag code={language} size="md" />
              </motion.div>
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
