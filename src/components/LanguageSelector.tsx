import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Languages, Check, Globe } from 'lucide-react';
import { navButton3DClassName } from '@/components/ui/NavButton3D';
import { useSupportedLanguages } from '@/hooks/useSupportedLanguages';
import { ScrollArea } from '@/components/ui/scroll-area';

// Base languages with static translations (always 100%)
const BASE_LANGUAGE_CODES = ['en', 'es', 'fr', 'ca', 'eu', 'gl'];

// Default gradient for languages not explicitly defined
const getLanguageGradient = (locale: string): string => {
  const gradients: Record<string, string> = {
    ca: 'from-blue-600 via-yellow-400 to-red-500',
    es: 'from-red-500 via-yellow-400 to-red-500',
    fr: 'from-blue-600 via-white to-red-500',
    en: 'from-blue-700 via-white to-red-600',
    de: 'from-black via-red-600 to-yellow-400',
    it: 'from-green-600 via-white to-red-600',
    pt: 'from-green-600 via-yellow-400 to-red-600',
    'pt-BR': 'from-green-600 via-yellow-400 to-blue-600',
    'zh-CN': 'from-red-600 via-yellow-400 to-red-600',
    ja: 'from-white via-red-600 to-white',
    ko: 'from-white via-red-600 to-blue-600',
    ru: 'from-white via-blue-600 to-red-600',
    ar: 'from-green-600 via-white to-black',
    he: 'from-blue-600 via-white to-blue-600',
  };
  return gradients[locale] || 'from-primary via-secondary to-primary';
};

const getTierLabel = (tier: number): string => {
  switch (tier) {
    case 1: return 'Core Languages';
    case 2: return 'Extended Languages';
    case 3: return 'Regional Languages';
    case 4: return 'Specialized Languages';
    default: return 'Other Languages';
  }
};

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const { activeLanguages, loading } = useSupportedLanguages();
  
  // Get current language info
  const currentLang = activeLanguages.find(l => l.locale === language);
  const currentFlag = currentLang?.flag_emoji || '🌐';
  const currentName = currentLang?.native_name || currentLang?.name || language.toUpperCase();

  // Group languages by tier
  const groupedLanguages = activeLanguages.reduce((acc, lang) => {
    const tier = lang.tier || 1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(lang);
    return acc;
  }, {} as Record<number, typeof activeLanguages>);

  const tiers = Object.keys(groupedLanguages)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={navButton3DClassName({
            variant: 'primary',
            size: 'md',
            className: `bg-gradient-to-r ${getLanguageGradient(language)} border-0 text-white shadow-md`,
          })}
          aria-label="Change language"
        >
          <span className="flex-shrink-0">
            <Languages className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">{`${currentFlag} ${currentName}`}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border w-[240px] p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Globe className="h-5 w-5 animate-pulse text-muted-foreground" />
              </div>
            ) : (
              tiers.map((tier, tierIndex) => (
                <div key={tier}>
                  {tierIndex > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
                    {getTierLabel(tier)}
                  </DropdownMenuLabel>
                  {groupedLanguages[tier].map((lang) => {
                    const isActive = language === lang.locale;
                    const isBase = BASE_LANGUAGE_CODES.includes(lang.locale);
                    const progress = isBase ? 100 : (lang.translation_progress || 0);
                    
                    return (
                      <DropdownMenuItem
                        key={lang.locale}
                        onClick={() => setLanguage(lang.locale as Language)}
                        className={`cursor-pointer gap-2 mx-1 rounded-md ${isActive ? 'bg-accent' : ''}`}
                      >
                        <span className="text-base">{lang.flag_emoji || '🌐'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate font-medium text-sm">
                              {lang.native_name}
                            </span>
                            {lang.is_rtl && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                RTL
                              </span>
                            )}
                          </div>
                          {!isBase && progress < 100 && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary/60 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground w-7">
                                {progress}%
                              </span>
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
