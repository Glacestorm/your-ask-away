import { Sun, Moon, Building2, Sparkles, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const themes: { value: ThemeMode; labelKey: string; icon: typeof Sun }[] = [
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
  { value: 'day', labelKey: 'theme.day', icon: Sun },
  { value: 'night', labelKey: 'theme.night', icon: Moon },
  { value: 'creand', labelKey: 'theme.creand', icon: Building2 },
  { value: 'aurora', labelKey: 'theme.aurora', icon: Sparkles },
];

export function ThemeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  const currentTheme = themes.find(th => th.value === theme) || themes[0];
  
  // Show resolved theme icon when in system mode
  const displayIcon = theme === 'system' 
    ? (resolvedTheme === 'night' ? Moon : Sun)
    : currentTheme.icon;
  const Icon = displayIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border">
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon;
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="cursor-pointer"
            >
              <ThemeIcon className="mr-2 h-4 w-4" />
              {t(themeOption.labelKey)}
              {theme === themeOption.value && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
