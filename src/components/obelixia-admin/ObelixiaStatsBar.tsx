import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  className?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/10'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    glow: 'shadow-emerald-500/10'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/10'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/10'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
    glow: 'shadow-cyan-500/10'
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: 'text-rose-400',
    glow: 'shadow-rose-500/10'
  }
};

const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ 
  value, 
  prefix = '', 
  suffix = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formattedValue = typeof value === 'number' && value >= 1000 
    ? displayValue.toLocaleString() 
    : displayValue;

  return <span>{prefix}{formattedValue}{suffix}</span>;
};

export const ObelixiaStatsBar: React.FC<ObelixiaStatsBarProps> = ({ stats, className }) => {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3', className)}>
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
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.2 }
            }}
            className={cn(
              'relative group cursor-default',
              'p-4 rounded-xl border backdrop-blur-sm',
              'bg-gradient-to-br from-slate-900/90 to-slate-800/80',
              colors.border,
              'hover:shadow-lg transition-shadow duration-300',
              colors.glow
            )}
          >
            {/* Subtle glow effect on hover */}
            <div className={cn(
              'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
              colors.bg
            )} />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate mb-1">
                  {stat.label}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    <AnimatedNumber 
                      value={numericValue} 
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </span>
                  
                  {stat.trend && (
                    <motion.span 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={cn(
                        'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
                        stat.trend.isPositive 
                          ? 'text-emerald-400 bg-emerald-500/20' 
                          : 'text-rose-400 bg-rose-500/20'
                      )}
                    >
                      {stat.trend.isPositive 
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />
                      }
                      {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                    </motion.span>
                  )}
                </div>
              </div>

              <motion.div 
                className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-xl',
                  colors.bg,
                  'border',
                  colors.border
                )}
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className={cn('w-5 h-5', colors.icon)} />
              </motion.div>
            </div>

            {/* Animated bottom line */}
            <motion.div 
              className={cn(
                'absolute bottom-0 left-4 right-4 h-0.5 rounded-full',
                colors.bg.replace('/10', '/30')
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default ObelixiaStatsBar;
