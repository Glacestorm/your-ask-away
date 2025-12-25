import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ObelixiaAdminCard3DProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'teal' | 'rose' | 'slate';
  value?: string | number;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
  isActive?: boolean;
  badge?: string;
  className?: string;
}

const colorVariants = {
  blue: {
    gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    ring: 'ring-blue-500/30'
  },
  emerald: {
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    ring: 'ring-emerald-500/30'
  },
  purple: {
    gradient: 'from-purple-500/20 via-purple-500/10 to-transparent',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    ring: 'ring-purple-500/30'
  },
  amber: {
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    icon: 'bg-gradient-to-br from-amber-500 to-amber-600',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    ring: 'ring-amber-500/30'
  },
  cyan: {
    gradient: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    icon: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    ring: 'ring-cyan-500/30'
  },
  teal: {
    gradient: 'from-teal-500/20 via-teal-500/10 to-transparent',
    border: 'border-teal-500/30 hover:border-teal-400/60',
    icon: 'bg-gradient-to-br from-teal-500 to-teal-600',
    text: 'text-teal-400',
    glow: 'shadow-teal-500/20',
    ring: 'ring-teal-500/30'
  },
  rose: {
    gradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-400/60',
    icon: 'bg-gradient-to-br from-rose-500 to-rose-600',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
    ring: 'ring-rose-500/30'
  },
  slate: {
    gradient: 'from-slate-500/20 via-slate-500/10 to-transparent',
    border: 'border-slate-500/30 hover:border-slate-400/60',
    icon: 'bg-gradient-to-br from-slate-500 to-slate-600',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/20',
    ring: 'ring-slate-500/30'
  }
};

export const ObelixiaAdminCard3D: React.FC<ObelixiaAdminCard3DProps> = ({
  title,
  description,
  icon: Icon,
  color,
  value,
  trend,
  onClick,
  isActive,
  badge,
  className
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const colorStyle = colorVariants[color];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const rotateXValue = ((mouseY - centerY) / (rect.height / 2)) * -8;
    const rotateYValue = ((mouseX - centerX) / (rect.width / 2)) * 8;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'relative cursor-pointer group perspective-1000',
        className
      )}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className={cn(
          'relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300',
          'bg-gradient-to-br from-slate-900/90 to-slate-800/80',
          colorStyle.border,
          isActive && `ring-2 ${colorStyle.ring}`,
          isHovered && `shadow-lg ${colorStyle.glow}`
        )}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Glow effect overlay */}
        <div 
          className={cn(
            'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            `bg-gradient-to-br ${colorStyle.gradient}`
          )} 
        />

        {/* Badge */}
        {badge && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className={cn(
              'px-2 py-0.5 text-xs font-semibold rounded-full',
              colorStyle.icon,
              'text-white shadow-lg'
            )}>
              {badge}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex items-start gap-4">
          {/* Icon with 3D effect */}
          <motion.div 
            className={cn(
              'flex-shrink-0 p-3 rounded-xl shadow-lg',
              colorStyle.icon
            )}
            style={{
              transform: 'translateZ(20px)',
            }}
            animate={{
              boxShadow: isHovered 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-semibold text-base', colorStyle.text)}>
              {title}
            </h4>
            {description && (
              <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
            
            {/* Value and trend */}
            {value && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-bold text-white">{value}</span>
                {trend && (
                  <span className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    trend.isPositive 
                      ? 'text-emerald-400 bg-emerald-500/20' 
                      : 'text-rose-400 bg-rose-500/20'
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hover indicator line */}
        <motion.div 
          className={cn(
            'absolute bottom-0 left-1/2 h-0.5 rounded-full',
            colorStyle.icon
          )}
          initial={{ width: 0, x: '-50%' }}
          animate={{ 
            width: isHovered ? '60%' : 0,
            x: '-50%'
          }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
};

export default ObelixiaAdminCard3D;
