import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ObelixiaTheme, ObelixiaViewMode } from '@/hooks/useObelixiaAdminPreferences';

interface ObelixiaContentAreaProps {
  children: React.ReactNode;
  activeTab: string;
  theme?: ObelixiaTheme;
  viewMode?: ObelixiaViewMode;
  className?: string;
}

export const ObelixiaContentArea: React.FC<ObelixiaContentAreaProps> = ({
  children,
  activeTab,
  theme = 'dark',
  viewMode = 'expanded',
  className
}) => {
  const isDark = theme === 'dark';
  const isCompact = viewMode === 'compact';

  return (
    <motion.div 
      className={cn(
        'relative rounded-2xl overflow-hidden',
        isDark
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 border-slate-700/50'
          : 'bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 border-slate-200',
        'border backdrop-blur-xl',
        isDark ? 'shadow-2xl shadow-slate-950/50' : 'shadow-lg shadow-slate-200/50',
        className
      )}
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Decorative gradient corners */}
      <motion.div 
        className={cn(
          'absolute top-0 left-0 w-32 h-32 rounded-tl-2xl pointer-events-none',
          isDark ? 'bg-gradient-to-br from-blue-500/10 to-transparent' : 'bg-gradient-to-br from-blue-100/50 to-transparent'
        )}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-tr-2xl pointer-events-none',
          isDark ? 'bg-gradient-to-bl from-emerald-500/10 to-transparent' : 'bg-gradient-to-bl from-emerald-100/50 to-transparent'
        )}
        animate={{ opacity: [0.8, 0.5, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div 
        className={cn(
          'absolute bottom-0 left-0 w-32 h-32 rounded-bl-2xl pointer-events-none',
          isDark ? 'bg-gradient-to-tr from-purple-500/10 to-transparent' : 'bg-gradient-to-tr from-purple-100/50 to-transparent'
        )}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div 
        className={cn(
          'absolute bottom-0 right-0 w-32 h-32 rounded-br-2xl pointer-events-none',
          isDark ? 'bg-gradient-to-tl from-amber-500/10 to-transparent' : 'bg-gradient-to-tl from-amber-100/50 to-transparent'
        )}
        animate={{ opacity: [0.8, 0.5, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Subtle grid pattern overlay */}
      <div 
        className={cn(
          'absolute inset-0 pointer-events-none',
          isDark ? 'opacity-[0.02]' : 'opacity-[0.03]'
        )}
        style={{
          backgroundImage: `
            linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ 
            duration: 0.25, 
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className={cn(
            'relative z-10',
            isCompact ? 'p-4' : 'p-6'
          )}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Inner glow effect */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none" 
        style={{
          boxShadow: isDark 
            ? 'inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 -1px 0 0 rgba(0,0,0,0.2)'
            : 'inset 0 1px 0 0 rgba(255,255,255,0.8), inset 0 -1px 0 0 rgba(0,0,0,0.05)'
        }}
      />
    </motion.div>
  );
};

export default ObelixiaContentArea;
