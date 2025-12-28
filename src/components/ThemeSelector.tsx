import { Sun, Moon, Building2, Sparkles, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { navButton3DClassName } from '@/components/ui/NavButton3D';

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
        <button
          type="button"
          className={navButton3DClassName({ variant: 'default', size: 'md' })}
          aria-label="Cambiar tema"
        >
          <span className="flex-shrink-0">
            <Icon className="h-4 w-4" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border min-w-[160px]">
        {themes.map((themeOption) => {
          const ThemeIcon = themeOption.icon;
          const isActive = theme === themeOption.value;
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`cursor-pointer gap-2 ${isActive ? 'bg-accent' : ''}`}
            >
              <ThemeIcon className="h-4 w-4" />
              <span className="flex-1">{t(themeOption.labelKey)}</span>
              {isActive && (
                <span className="text-primary text-xs">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
