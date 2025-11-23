import { Sun, Moon, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const themes = [
  { value: 'day' as ThemeMode, label: 'Día', icon: Sun },
  { value: 'night' as ThemeMode, label: 'Noche', icon: Moon },
  { value: 'creand' as ThemeMode, label: 'Creand', icon: Building2 },
  { value: 'aurora' as ThemeMode, label: 'Aurora', icon: Sparkles },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const Icon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon;
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="cursor-pointer"
            >
              <ThemeIcon className="mr-2 h-4 w-4" />
              {themeOption.label}
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
