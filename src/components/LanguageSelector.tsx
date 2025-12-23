import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { NavButton3D } from '@/components/ui/NavButton3D';
import { useSupportedLanguages } from '@/hooks/useSupportedLanguages';

// Base languages always shown at the top
const baseLanguages = [
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'ca' as Language, name: 'Català', flag: '🇦🇩' },
];

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

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const { activeLanguages, loading } = useSupportedLanguages();
  
  // Build language list: base languages first, then others from DB
  const allLanguages = [
    ...baseLanguages,
    ...activeLanguages
      .filter(l => !baseLanguages.some(b => b.code === l.locale))
      .map(l => ({
        code: l.locale as Language,
        name: l.native_name,
        flag: l.flag_emoji || '🌐',
      })),
  ];

  const currentLanguage = allLanguages.find(lang => lang.code === language) || baseLanguages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NavButton3D
          variant="primary"
          size="md"
          className={`bg-gradient-to-r ${getLanguageGradient(language)} border-0 text-white shadow-md`}
          icon={<Languages className="h-4 w-4" />}
          label={`${currentLanguage?.flag} ${currentLanguage?.name}`}
          aria-label="Change language"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border min-w-[180px] max-h-[400px] overflow-y-auto">
        {/* Base languages */}
        {baseLanguages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`cursor-pointer gap-2 ${isActive ? 'bg-accent' : ''}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {isActive && <span className="text-primary text-xs">✓</span>}
            </DropdownMenuItem>
          );
        })}
        
        {/* Divider if there are more languages */}
        {!loading && activeLanguages.length > 4 && (
          <div className="my-1 border-t border-border" />
        )}
        
        {/* Additional languages from DB */}
        {!loading && activeLanguages
          .filter(l => !baseLanguages.some(b => b.code === l.locale))
          .map((lang) => {
            const isActive = language === lang.locale;
            return (
              <DropdownMenuItem
                key={lang.locale}
                onClick={() => setLanguage(lang.locale as Language)}
                className={`cursor-pointer gap-2 ${isActive ? 'bg-accent' : ''}`}
              >
                <span className="text-lg">{lang.flag_emoji || '🌐'}</span>
                <span className="flex-1">{lang.native_name}</span>
                {lang.translation_progress < 100 && (
                  <span className="text-muted-foreground text-xs">{lang.translation_progress}%</span>
                )}
                {isActive && <span className="text-primary text-xs">✓</span>}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
