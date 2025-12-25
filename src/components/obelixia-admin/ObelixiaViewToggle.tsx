import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Sun, Moon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ObelixiaTheme, ObelixiaViewMode } from '@/hooks/useObelixiaAdminPreferences';

interface ObelixiaViewToggleProps {
  viewMode: ObelixiaViewMode;
  theme: ObelixiaTheme;
  onViewModeChange: () => void;
  onThemeChange: () => void;
  className?: string;
}

export const ObelixiaViewToggle: React.FC<ObelixiaViewToggleProps> = ({
  viewMode,
  theme,
  onViewModeChange,
  onThemeChange,
  className
}) => {
  const isDark = theme === 'dark';
  const isCompact = viewMode === 'compact';

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        {/* View Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onViewModeChange}
              className={cn(
                'h-9 w-9 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              )}
            >
              <motion.div
                key={viewMode}
                initial={{ scale: 0.8, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.8, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isCompact ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
          >
            <p>{isCompact ? 'Vista expandida' : 'Vista compacta'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeChange}
              className={cn(
                'h-9 w-9 rounded-xl transition-all duration-300 overflow-hidden',
                isDark 
                  ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-amber-400 border border-slate-700/50'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-blue-600 border border-slate-200 shadow-sm'
              )}
            >
              <motion.div
                key={theme}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }}
                className="relative"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                
                {/* Sparkle effect on toggle */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-2 h-2 text-amber-400" />
                </motion.div>
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
          >
            <p>{isDark ? 'Tema claro' : 'Tema oscuro'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ObelixiaViewToggle;
