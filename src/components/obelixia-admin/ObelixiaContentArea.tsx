import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ObelixiaContentAreaProps {
  children: React.ReactNode;
  activeTab: string;
  className?: string;
}

export const ObelixiaContentArea: React.FC<ObelixiaContentAreaProps> = ({
  children,
  activeTab,
  className
}) => {
  return (
    <div className={cn(
      'relative rounded-2xl overflow-hidden',
      'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95',
      'border border-slate-700/50 backdrop-blur-xl',
      'shadow-2xl shadow-slate-950/50',
      className
    )}>
      {/* Decorative gradient corners */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-tl-2xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-tr-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-bl-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-500/10 to-transparent rounded-br-2xl pointer-events-none" />

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 p-6"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" 
        style={{
          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 -1px 0 0 rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

export default ObelixiaContentArea;
