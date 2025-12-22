import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Premium3DTabCardProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  accentColor?: string;
}

export const Premium3DTabCard: React.FC<Premium3DTabCardProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  accentColor = 'hsl(var(--primary))'
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg cursor-pointer",
        "transition-all duration-500 ease-out",
        "backdrop-blur-xl border",
        isActive 
          ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/50 shadow-[0_4px_16px_-4px] shadow-primary/30"
          : "bg-card/40 border-border/30 hover:border-primary/30 hover:bg-card/60"
      )}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      whileHover={{ 
        scale: 1.02,
        rotateX: -1,
        rotateY: 1,
        z: 10,
      }}
      whileTap={{ scale: 0.98 }}
      initial={false}
      animate={isActive ? {
        boxShadow: `0 8px 20px -6px ${accentColor}30, 0 0 0 1px ${accentColor}40`
      } : {
        boxShadow: '0 2px 8px -2px hsl(var(--background) / 0.3)'
      }}
    >
      {/* Glow effect background */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accentColor}15 0%, transparent 70%)`,
        }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
      />
      
      {/* Top light reflection */}
      <div className={cn(
        "absolute inset-x-1 top-0.5 h-px rounded-full transition-opacity duration-300",
        "bg-gradient-to-r from-transparent via-white/20 to-transparent",
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
      )} />
      
      {/* Icon container with 3D effect */}
      <motion.div
        className={cn(
          "relative z-10 flex items-center justify-center w-7 h-7 rounded-md",
          "transition-all duration-300",
          isActive 
            ? "bg-primary/20 shadow-sm shadow-primary/20" 
            : "bg-muted/50 group-hover:bg-primary/10"
        )}
        style={{ transformStyle: 'preserve-3d' }}
        animate={isActive ? { 
          rotateY: [0, 360],
          transition: { duration: 0.6, ease: "easeOut" }
        } : {}}
      >
        <Icon className={cn(
          "h-3.5 w-3.5 transition-all duration-300",
          isActive 
            ? "text-primary drop-shadow-[0_0_4px_currentColor]" 
            : "text-muted-foreground group-hover:text-primary/80"
        )} />
        
        {/* Icon glow */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-md"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`
            }}
          />
        )}
      </motion.div>
      
      {/* Label */}
      <span className={cn(
        "relative z-10 text-[10px] font-medium tracking-wide transition-all duration-300",
        isActive 
          ? "text-foreground" 
          : "text-muted-foreground group-hover:text-foreground/80"
      )}>
        {label}
      </span>
      
      {/* Active indicator line */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        initial={false}
        animate={isActive ? {
          width: '50%',
          x: '-50%',
          opacity: 1
        } : {
          width: '0%',
          x: '-50%',
          opacity: 0
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </motion.button>
  );
};

export default Premium3DTabCard;
