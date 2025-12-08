import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'ca' as Language, name: 'Català', flag: '🇦🇩' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
];

// Flag gradient backgrounds for each language
const languageGradients: Record<Language, string> = {
  ca: 'bg-gradient-to-r from-[hsl(220,80%,45%)] via-[hsl(45,100%,50%)] to-[hsl(0,70%,50%)]', // Andorra: blue, yellow, red
  es: 'bg-gradient-to-r from-[hsl(0,70%,50%)] via-[hsl(45,100%,50%)] to-[hsl(0,70%,50%)]', // Spain: red, yellow, red
  fr: 'bg-gradient-to-r from-[hsl(220,80%,45%)] via-[hsl(0,0%,100%)] to-[hsl(0,70%,50%)]', // France: blue, white, red
  en: 'bg-gradient-to-r from-[hsl(220,80%,35%)] via-[hsl(0,0%,100%)] to-[hsl(0,70%,45%)]', // UK: blue, white, red
};

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  
  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 border-0 text-white font-medium shadow-md hover:opacity-90 hover:text-white ${languageGradients[language]}`}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage?.flag} {currentLanguage?.name}</span>
          <span className="sm:hidden">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
