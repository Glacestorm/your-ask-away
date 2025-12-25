import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ObelixiaPulseIconProps {
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'teal' | 'rose' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    pulse: 'bg-blue-500/30',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    pulse: 'bg-emerald-500/30',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    pulse: 'bg-purple-500/30',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    pulse: 'bg-amber-500/30',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
    pulse: 'bg-cyan-500/30',
  },
  teal: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    icon: 'text-teal-400',
    pulse: 'bg-teal-500/30',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: 'text-rose-400',
    pulse: 'bg-rose-500/30',
  },
  slate: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    icon: 'text-slate-400',
    pulse: 'bg-slate-500/30',
  },
};

const sizeVariants = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6' },
};

export const ObelixiaPulseIcon: React.FC<ObelixiaPulseIconProps> = ({
  icon: Icon,
  color = 'blue',
  size = 'md',
  pulse = true,
  className
}) => {
  const colors = colorVariants[color];
  const sizes = sizeVariants[size];

  return (
    <div className={cn('relative', className)}>
      {/* Pulse rings */}
      {pulse && (
        <>
          <motion.div
            className={cn(
              'absolute inset-0 rounded-xl',
              colors.pulse
            )}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className={cn(
              'absolute inset-0 rounded-xl',
              colors.pulse
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
        </>
      )}

      {/* Icon container */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-xl border',
          sizes.container,
          colors.bg,
          colors.border
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon className={cn(sizes.icon, colors.icon)} />
      </motion.div>
    </div>
  );
};

export default ObelixiaPulseIcon;
