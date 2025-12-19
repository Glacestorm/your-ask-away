import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { NavButton3D } from '@/components/ui/NavButton3D';

const languages = [
  { code: 'ca' as Language, name: 'Català', flag: '🇦🇩' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
];

// Flag gradient backgrounds for each language
const languageGradients: Record<Language, string> = {
  ca: 'from-blue-600 via-yellow-400 to-red-500',
  es: 'from-red-500 via-yellow-400 to-red-500',
  fr: 'from-blue-600 via-white to-red-500',
  en: 'from-blue-700 via-white to-red-600',
};

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  
  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NavButton3D
          variant="primary"
          size="md"
          className={`bg-gradient-to-r ${languageGradients[language]} border-0 text-white shadow-md`}
          icon={<Languages className="h-4 w-4" />}
          label={`${currentLanguage?.flag} ${currentLanguage?.name}`}
          aria-label="Cambiar idioma"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border min-w-[160px]">
        {languages.map((lang) => {
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
