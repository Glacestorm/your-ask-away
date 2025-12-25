import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ObelixiaTheme, ObelixiaViewMode } from '@/hooks/useObelixiaAdminPreferences';

interface StatItem {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'rose';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  prefix?: string;
  suffix?: string;
}

interface ObelixiaStatsBarProps {
  stats: StatItem[];
  theme?: ObelixiaTheme;
  viewMode?: ObelixiaViewMode;
  className?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    bgLight: 'bg-blue-50',
    border: 'border-blue-500/30',
    borderLight: 'border-blue-200',
    icon: 'text-blue-400',
    iconLight: 'text-blue-600',
    glow: 'shadow-blue-500/10',
    pulse: 'bg-blue-500'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-500/30',
    borderLight: 'border-emerald-200',
    icon: 'text-emerald-400',
    iconLight: 'text-emerald-600',
    glow: 'shadow-emerald-500/10',
    pulse: 'bg-emerald-500'
  },
  purple: {
    bg: 'bg-purple-500/10',
    bgLight: 'bg-purple-50',
    border: 'border-purple-500/30',
    borderLight: 'border-purple-200',
    icon: 'text-purple-400',
    iconLight: 'text-purple-600',
    glow: 'shadow-purple-500/10',
    pulse: 'bg-purple-500'
  },
  amber: {
    bg: 'bg-amber-500/10',
    bgLight: 'bg-amber-50',
    border: 'border-amber-500/30',
    borderLight: 'border-amber-200',
    icon: 'text-amber-400',
    iconLight: 'text-amber-600',
    glow: 'shadow-amber-500/10',
    pulse: 'bg-amber-500'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    bgLight: 'bg-cyan-50',
    border: 'border-cyan-500/30',
    borderLight: 'border-cyan-200',
    icon: 'text-cyan-400',
    iconLight: 'text-cyan-600',
    glow: 'shadow-cyan-500/10',
    pulse: 'bg-cyan-500'
  },
  rose: {
    bg: 'bg-rose-500/10',
    bgLight: 'bg-rose-50',
    border: 'border-rose-500/30',
    borderLight: 'border-rose-200',
    icon: 'text-rose-400',
    iconLight: 'text-rose-600',
    glow: 'shadow-rose-500/10',
    pulse: 'bg-rose-500'
  }
};

// Animated counter with easing
const AnimatedNumber: React.FC<{ 
  value: number; 
  prefix?: string; 
  suffix?: string;
  shouldAnimate?: boolean;
}> = ({ 
  value, 
  prefix = '', 
  suffix = '',
  shouldAnimate = true
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!shouldAnimate || !isInView) {
      setDisplayValue(value);
      return;
    }

    const duration = 1200;
    const steps = 40;
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = easeOutQuart(frame / steps);
      const current = Math.floor(value * progress);
      
      if (frame >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, shouldAnimate, isInView]);

  const formattedValue = displayValue >= 1000 
    ? displayValue.toLocaleString() 
    : displayValue;

  return <span ref={ref}>{prefix}{formattedValue}{suffix}</span>;
};

export const ObelixiaStatsBar: React.FC<ObelixiaStatsBarProps> = ({ 
  stats, 
  theme = 'dark',
  viewMode = 'expanded',
  className 
}) => {
  const isDark = theme === 'dark';
  const isCompact = viewMode === 'compact';

  return (
    <div className={cn(
      'grid gap-3',
      isCompact 
        ? 'grid-cols-4' 
        : 'grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {stats.map((stat, index) => {
        const colors = colorMap[stat.color];
        const Icon = stat.icon;
        const numericValue = typeof stat.value === 'string' 
          ? parseInt(stat.value.replace(/[^0-9]/g, '')) || 0
          : stat.value;

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.08, 
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={{ 
              scale: 1.03,
              y: -4,
              transition: { duration: 0.2, ease: 'easeOut' }
            }}
            className={cn(
              'relative group cursor-default overflow-hidden',
              'rounded-xl border backdrop-blur-sm',
              isCompact ? 'p-3' : 'p-4',
              isDark 
                ? `bg-gradient-to-br from-slate-900/90 to-slate-800/80 ${colors.border}`
                : `bg-white/90 ${colors.borderLight} shadow-sm`,
              'hover:shadow-lg transition-shadow duration-300',
              isDark && colors.glow
            )}
          >
            {/* Animated pulse ring on hover */}
            <motion.div
              className={cn(
                'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100',
                isDark ? colors.bg : colors.bgLight
              )}
              initial={false}
              animate={{ opacity: 0 }}
              whileHover={{ 
                opacity: 1,
                transition: { duration: 0.3 }
              }}
            />

            {/* Subtle pulse indicator */}
            <div className="absolute top-2 right-2">
              <motion.div
                className={cn('w-1.5 h-1.5 rounded-full', colors.pulse)}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.2,
                }}
              />
            </div>

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium truncate mb-1',
                  isCompact ? 'text-[10px]' : 'text-xs',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}>
                  {stat.label}
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-bold',
                    isCompact ? 'text-lg' : 'text-xl',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}>
                    <AnimatedNumber 
                      value={numericValue} 
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </span>
                  
                  {stat.trend && !isCompact && (
                    <motion.span 
                      initial={{ opacity: 0, x: -5, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.6 + index * 0.1,
                        type: 'spring',
                        stiffness: 200
                      }}
                      className={cn(
                        'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
                        stat.trend.isPositive 
                          ? 'text-emerald-400 bg-emerald-500/20' 
                          : 'text-rose-400 bg-rose-500/20'
                      )}
                    >
                      <motion.span
                        animate={{ y: stat.trend.isPositive ? [-1, 1, -1] : [1, -1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {stat.trend.isPositive 
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />
                        }
                      </motion.span>
                      {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                    </motion.span>
                  )}
                </div>
              </div>

              <motion.div 
                className={cn(
                  'flex items-center justify-center rounded-xl border',
                  isCompact ? 'w-9 h-9' : 'w-11 h-11',
                  isDark ? colors.bg : colors.bgLight,
                  isDark ? colors.border : colors.borderLight
                )}
                whileHover={{ 
                  rotate: [0, -5, 5, 0], 
                  scale: 1.1,
                  transition: { duration: 0.4 }
                }}
              >
                <Icon className={cn(
                  isCompact ? 'w-4 h-4' : 'w-5 h-5', 
                  isDark ? colors.icon : colors.iconLight
                )} />
              </motion.div>
            </div>

            {/* Animated bottom accent */}
            <motion.div 
              className={cn(
                'absolute bottom-0 left-4 right-4 h-0.5 rounded-full',
                colors.pulse
              )}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.3 }}
              transition={{ 
                delay: 0.4 + index * 0.1, 
                duration: 0.6,
                ease: 'easeOut'
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default ObelixiaStatsBar;
