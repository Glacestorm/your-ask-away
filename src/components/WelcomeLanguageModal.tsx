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
import { ScrollArea } from '@/components/ui/scroll-area';
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

// All available languages with flags
const ALL_LANGUAGES: LanguageOption[] = [
  // Featured / Most common
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'España' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'UK' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿', region: 'Catalunya' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'France' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Deutschland' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'Portugal' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Italia' },
  // Spanish regional languages
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸', region: 'País Vasco' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸', region: 'Galicia' },
  { code: 'oc', name: 'Occitan', nativeName: 'Occitan', flag: '🇪🇸', region: 'Val d\'Aran' },
  { code: 'ast', name: 'Asturian', nativeName: 'Asturianu', flag: '🇪🇸', region: 'Asturias' },
  { code: 'an', name: 'Aragonese', nativeName: 'Aragonés', flag: '🇪🇸', region: 'Aragón' },
  // European languages
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Nederland' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'Polska' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', region: 'Česko' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', region: 'România' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', region: 'Magyarország' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'Sverige' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', region: 'Danmark' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', region: 'Norge' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', region: 'Suomi' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', region: 'Ελλάδα' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', region: 'Türkiye' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', region: 'Україна' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'Россия' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', region: 'България' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', region: 'Hrvatska' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', region: 'Slovensko' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮', region: 'Slovenija' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', region: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', region: 'Latvija' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹', region: 'Lietuva' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', region: 'Éire' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸', region: 'Ísland' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', region: 'Malta' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺', region: 'Lëtzebuerg' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', region: 'BiH' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸', region: 'Србија' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰', region: 'Македонија' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', region: 'Shqipëri' },
  // Asian languages
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', region: '中国' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', region: '台灣' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: '日本' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: '한국' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', region: 'ประเทศไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'Việt Nam' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', region: 'Malaysia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'भारत' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', region: 'বাংলাদেশ' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', region: 'Pilipinas' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', region: 'नेपाल' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰', region: 'Sri Lanka' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲', region: 'Myanmar' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭', region: 'កម្ពុជា' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦', region: 'ລາວ' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪', region: 'საქართველო' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերdelays', flag: '🇦🇲', region: 'Հայdelays' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿', region: 'Azərbaycan' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', region: 'Қazaқстан' },
  { code: 'uz', name: 'Uzbek', nativeName: "O'zbek", flag: '🇺🇿', region: "O'zbekiston" },
  // Middle Eastern & RTL languages
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'العربية' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', region: 'ישראל' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', region: 'ایران' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', region: 'پاکستان' },
  // African languages
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', region: 'ኢትዮጵያ' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', region: 'Kenya' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', region: 'Nigeria' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', region: 'Nigeria' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', region: 'Nigeria' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', region: 'Suid-Afrika' },
  // Americas variants
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português', flag: '🇧🇷', region: 'Brasil' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español', flag: '🇲🇽', region: 'México' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español', flag: '🇦🇷', region: 'Argentina' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English', flag: '🇺🇸', region: 'USA' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français', flag: '🇨🇦', region: 'Canada' },
];

export function WelcomeLanguageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [rememberChoice, setRememberChoice] = useState(true);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    const wasShown = localStorage.getItem(STORAGE_KEY);
    const wasRemembered = localStorage.getItem(REMEMBER_KEY);
    
    if (!wasShown && !wasRemembered) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)] pointer-events-none" />
        
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
            Selecciona tu idioma preferido ({ALL_LANGUAGES.length} idiomas disponibles)
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-6 py-2">
          <ScrollArea className="h-[320px] pr-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
              <AnimatePresence>
                {ALL_LANGUAGES.map((lang, index) => (
                  <motion.button
                    key={lang.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={cn(
                      "relative flex flex-col items-center p-2.5 rounded-xl border-2 transition-all duration-200",
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
                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center z-10"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    
                    <span className="text-xl mb-0.5">{lang.flag}</span>
                    <span className="text-[11px] font-medium text-foreground truncate w-full text-center leading-tight">
                      {lang.nativeName}
                    </span>
                    {lang.region && (
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">
                        {lang.region}
                      </span>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
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
