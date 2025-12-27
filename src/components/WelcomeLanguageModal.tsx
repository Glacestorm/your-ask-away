import React, { useState, useEffect, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, Sparkles, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { RegionalFlag, hasRegionalFlag } from '@/components/ui/RegionalFlag';

const STORAGE_KEY = 'obelixia_welcome_language_shown';
const REMEMBER_KEY = 'obelixia_language_remembered';

type RegionKey = 'europe' | 'spain' | 'americas' | 'asia' | 'middleEast' | 'africa';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
  regionGroup: RegionKey;
}

interface RegionConfig {
  key: RegionKey;
  label: string;
  emoji: string;
}

const REGIONS: RegionConfig[] = [
  { key: 'europe', label: 'Europa', emoji: '🌍' },
  { key: 'spain', label: 'España & Regiones', emoji: '🇪🇸' },
  { key: 'americas', label: 'Américas', emoji: '🌎' },
  { key: 'asia', label: 'Asia & Pacífico', emoji: '🌏' },
  { key: 'middleEast', label: 'Oriente Medio', emoji: '🕌' },
  { key: 'africa', label: 'África', emoji: '🌍' },
];

// All available languages with flags and region groups
const ALL_LANGUAGES: LanguageOption[] = [
  // Spain & Regional languages
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'España', regionGroup: 'spain' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿', region: 'Catalunya', regionGroup: 'spain' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸', region: 'País Vasco', regionGroup: 'spain' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸', region: 'Galicia', regionGroup: 'spain' },
  { code: 'oc', name: 'Occitan', nativeName: 'Occitan', flag: '🇪🇸', region: "Val d'Aran", regionGroup: 'spain' },
  { code: 'ast', name: 'Asturian', nativeName: 'Asturianu', flag: '🇪🇸', region: 'Asturias', regionGroup: 'spain' },
  { code: 'an', name: 'Aragonese', nativeName: 'Aragonés', flag: '🇪🇸', region: 'Aragón', regionGroup: 'spain' },
  // European languages
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'UK', regionGroup: 'europe' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'France', regionGroup: 'europe' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Deutschland', regionGroup: 'europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'Portugal', regionGroup: 'europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Italia', regionGroup: 'europe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Nederland', regionGroup: 'europe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'Polska', regionGroup: 'europe' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', region: 'Česko', regionGroup: 'europe' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', region: 'România', regionGroup: 'europe' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', region: 'Magyarország', regionGroup: 'europe' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'Sverige', regionGroup: 'europe' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', region: 'Danmark', regionGroup: 'europe' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', region: 'Norge', regionGroup: 'europe' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', region: 'Suomi', regionGroup: 'europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', region: 'Ελλάδα', regionGroup: 'europe' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', region: 'Türkiye', regionGroup: 'europe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', region: 'Україна', regionGroup: 'europe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'Россия', regionGroup: 'europe' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', region: 'България', regionGroup: 'europe' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', region: 'Hrvatska', regionGroup: 'europe' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', region: 'Slovensko', regionGroup: 'europe' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮', region: 'Slovenija', regionGroup: 'europe' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', region: 'Eesti', regionGroup: 'europe' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', region: 'Latvija', regionGroup: 'europe' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹', region: 'Lietuva', regionGroup: 'europe' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', region: 'Éire', regionGroup: 'europe' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸', region: 'Ísland', regionGroup: 'europe' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', region: 'Malta', regionGroup: 'europe' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺', region: 'Lëtzebuerg', regionGroup: 'europe' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', region: 'BiH', regionGroup: 'europe' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸', region: 'Србија', regionGroup: 'europe' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰', region: 'Македонија', regionGroup: 'europe' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', region: 'Shqipëri', regionGroup: 'europe' },
  // Asian languages
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', region: '中国', regionGroup: 'asia' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', region: '台灣', regionGroup: 'asia' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: '日本', regionGroup: 'asia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: '한국', regionGroup: 'asia' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', region: 'ประเทศไทย', regionGroup: 'asia' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'Việt Nam', regionGroup: 'asia' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Indonesia', regionGroup: 'asia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', region: 'Malaysia', regionGroup: 'asia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'भारत', regionGroup: 'asia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', region: 'বাংলাদেশ', regionGroup: 'asia' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', region: 'Pilipinas', regionGroup: 'asia' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', region: 'नेपाल', regionGroup: 'asia' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰', region: 'Sri Lanka', regionGroup: 'asia' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲', region: 'Myanmar', regionGroup: 'asia' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭', region: 'កម្ពុជា', regionGroup: 'asia' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦', region: 'ລາວ', regionGroup: 'asia' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪', region: 'საქართველო', regionGroup: 'asia' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հdelays', flag: '🇦🇲', region: 'Հdelays', regionGroup: 'asia' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿', region: 'Azərbaycan', regionGroup: 'asia' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', region: 'Қazaқстан', regionGroup: 'asia' },
  { code: 'uz', name: 'Uzbek', nativeName: "O'zbek", flag: '🇺🇿', region: "O'zbekiston", regionGroup: 'asia' },
  // Middle Eastern & RTL languages
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'العربية', regionGroup: 'middleEast' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', region: 'ישראל', regionGroup: 'middleEast' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', region: 'ایران', regionGroup: 'middleEast' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', region: 'پاکستان', regionGroup: 'middleEast' },
  // African languages
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', region: 'ኢትዮጵያ', regionGroup: 'africa' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', region: 'Kenya', regionGroup: 'africa' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', region: 'Nigeria', regionGroup: 'africa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', region: 'Nigeria', regionGroup: 'africa' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', region: 'Nigeria', regionGroup: 'africa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', region: 'Suid-Afrika', regionGroup: 'africa' },
  // Americas variants
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português', flag: '🇧🇷', region: 'Brasil', regionGroup: 'americas' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español', flag: '🇲🇽', region: 'México', regionGroup: 'americas' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español', flag: '🇦🇷', region: 'Argentina', regionGroup: 'americas' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English', flag: '🇺🇸', region: 'USA', regionGroup: 'americas' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français', flag: '🇨🇦', region: 'Canada', regionGroup: 'americas' },
];

interface WelcomeLanguageModalProps {
  mode?: 'welcome' | 'selector';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WelcomeLanguageModal({ 
  mode = 'welcome',
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange
}: WelcomeLanguageModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [rememberChoice, setRememberChoice] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<RegionKey>>(
    new Set(['spain', 'europe'])
  );
  const { language, setLanguage, refreshTranslations } = useLanguage();
  const { clearCache: clearDynamicCache } = useDynamicTranslation();

  // Control de estado: externo para selector, interno para welcome
  const isOpen = mode === 'selector' ? (externalIsOpen ?? false) : internalIsOpen;
  const setIsOpen = mode === 'selector' 
    ? (externalOnOpenChange ?? setInternalIsOpen) 
    : setInternalIsOpen;

  // Solo mostrar automáticamente en modo welcome
  useEffect(() => {
    if (mode !== 'welcome') return;
    
    const wasShown = localStorage.getItem(STORAGE_KEY);
    const wasRemembered = localStorage.getItem(REMEMBER_KEY);

    if (!wasShown && !wasRemembered) {
      const timer = setTimeout(() => setInternalIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  // Pre-seleccionar idioma actual en modo selector
  useEffect(() => {
    if (mode === 'selector' && isOpen && !selectedLanguage) {
      setSelectedLanguage(language);
    }
  }, [mode, isOpen, language, selectedLanguage]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedLanguage(null);
    }
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return ALL_LANGUAGES;

    const query = searchQuery.toLowerCase().trim();
    return ALL_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query) ||
        (lang.region && lang.region.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const groupedLanguages = useMemo(() => {
    const groups: Record<RegionKey, LanguageOption[]> = {
      europe: [],
      spain: [],
      americas: [],
      asia: [],
      middleEast: [],
      africa: [],
    };

    filteredLanguages.forEach((lang) => {
      groups[lang.regionGroup].push(lang);
    });

    return groups;
  }, [filteredLanguages]);

  const toggleRegion = (region: RegionKey) => {
    setExpandedRegions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(region)) {
        newSet.delete(region);
      } else {
        newSet.add(region);
      }
      return newSet;
    });
  };

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleConfirm = () => {
    if (selectedLanguage) {
      // Clear dynamic translation cache to force re-translation
      clearDynamicCache();
      setLanguage(selectedLanguage);
      // Refresh translations after a short delay to ensure state is updated
      setTimeout(() => {
        refreshTranslations();
      }, 100);
      if (mode === 'welcome' && rememberChoice) {
        localStorage.setItem(REMEMBER_KEY, 'true');
      }
    }
    if (mode === 'welcome') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  const handleSkip = () => {
    if (mode === 'welcome') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  // Textos según el modo
  const title = mode === 'welcome' 
    ? '¡Bienvenido! Welcome!' 
    : 'Selecciona tu idioma';
  const skipText = mode === 'welcome' ? 'Omitir / Skip' : 'Cancelar';
  const confirmText = mode === 'welcome' ? 'Continuar / Continue' : 'Aplicar';

  const isSearching = searchQuery.trim().length > 0;

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
            {title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {mode === 'welcome' 
              ? `Selecciona tu idioma preferido (${ALL_LANGUAGES.length} idiomas disponibles)`
              : `${ALL_LANGUAGES.length} idiomas disponibles`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar idioma... / Search language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        <div className="relative px-6 py-2">
          <ScrollArea className="h-[400px] pr-4">
            {isSearching ? (
              // Flat list when searching
              <div className="space-y-1">
                {filteredLanguages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron idiomas / No languages found
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {filteredLanguages.map((lang) => (
                      <LanguageButton
                        key={lang.code}
                        lang={lang}
                        isSelected={selectedLanguage === lang.code}
                        onSelect={handleSelectLanguage}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Grouped by region when not searching
              <div className="space-y-2">
                {REGIONS.map((region) => {
                  const languages = groupedLanguages[region.key];
                  if (languages.length === 0) return null;

                  const isExpanded = expandedRegions.has(region.key);

                  return (
                    <div key={region.key} className="border border-border/40 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleRegion(region.key)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{region.emoji}</span>
                          <span className="font-medium text-sm">{region.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({languages.length})
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 p-2 bg-background/50">
                              {languages.map((lang) => (
                                <LanguageButton
                                  key={lang.code}
                                  lang={lang}
                                  isSelected={selectedLanguage === lang.code}
                                  onSelect={handleSelectLanguage}
                                  compact
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {mode === 'welcome' && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <Checkbox
                id="remember"
                checked={rememberChoice}
                onCheckedChange={(checked) => setRememberChoice(checked === true)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                Recordar mi elección / Remember my choice
              </label>
            </div>
          )}
        </div>

        <div className="relative flex gap-3 p-6 pt-2">
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            {skipText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLanguage}
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Sparkles className="w-4 h-4" />
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Extracted Language Button Component
function LanguageButton({
  lang,
  isSelected,
  onSelect,
  compact = false,
}: {
  lang: LanguageOption;
  isSelected: boolean;
  onSelect: (code: Language) => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(lang.code)}
      className={cn(
        'relative flex flex-col items-center rounded-lg border-2 transition-all duration-200',
        'hover:border-primary/50 hover:bg-primary/5',
        compact ? 'p-1.5' : 'p-2.5',
        isSelected
          ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
          : 'border-border/50 bg-card/50'
      )}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center z-10"
        >
          <Check className="w-2.5 h-2.5 text-white" />
        </motion.div>
      )}

      <div className={compact ? 'mb-0.5' : 'mb-1'}>
        <RegionalFlag code={lang.code} size={compact ? 'sm' : 'md'} />
      </div>
      <span
        className={cn(
          'font-medium text-foreground truncate w-full text-center leading-tight',
          compact ? 'text-[10px]' : 'text-[11px]'
        )}
      >
        {lang.nativeName}
      </span>
      {lang.region && !compact && (
        <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">
          {lang.region}
        </span>
      )}
    </motion.button>
  );
}

export default WelcomeLanguageModal;
