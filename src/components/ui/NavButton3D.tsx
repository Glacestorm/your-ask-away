import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavButton3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  label?: string;
  showLabel?: boolean;
  active?: boolean;
}

const variantStyles = {
  default: `
    bg-gradient-to-b from-background via-background to-muted/80
    border-border/60
    text-foreground
    shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]
    hover:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]
    hover:translate-y-[1px]
    active:translate-y-[2px]
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]
  `,
  primary: `
    bg-gradient-to-b from-primary via-primary to-primary/80
    border-primary/50
    text-primary-foreground
    shadow-[0_4px_8px_-2px_hsl(var(--primary)/0.4),0_2px_4px_-2px_hsl(var(--primary)/0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:shadow-[0_2px_4px_-1px_hsl(var(--primary)/0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:translate-y-[1px]
    active:translate-y-[2px]
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
  `,
  success: `
    bg-gradient-to-b from-emerald-500 via-emerald-500 to-emerald-600
    border-emerald-400/50
    text-white
    shadow-[0_4px_8px_-2px_rgba(16,185,129,0.4),0_2px_4px_-2px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:shadow-[0_2px_4px_-1px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:translate-y-[1px]
    active:translate-y-[2px]
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
  `,
  warning: `
    bg-gradient-to-b from-amber-500 via-amber-500 to-amber-600
    border-amber-400/50
    text-white
    shadow-[0_4px_8px_-2px_rgba(245,158,11,0.4),0_2px_4px_-2px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:shadow-[0_2px_4px_-1px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:translate-y-[1px]
    active:translate-y-[2px]
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
  `,
  danger: `
    bg-gradient-to-b from-rose-500 via-rose-500 to-rose-600
    border-rose-400/50
    text-white
    shadow-[0_4px_8px_-2px_rgba(244,63,94,0.4),0_2px_4px_-2px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:shadow-[0_2px_4px_-1px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:translate-y-[1px]
    active:translate-y-[2px]
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
  `,
  ghost: `
    bg-transparent
    border-transparent
    text-foreground
    hover:bg-accent/50
    active:bg-accent/70
  `,
};

const sizeStyles = {
  sm: 'h-8 min-w-8 px-2 text-xs gap-1.5 rounded-lg',
  md: 'h-9 min-w-9 px-2.5 text-sm gap-2 rounded-xl',
  lg: 'h-10 min-w-10 px-3 text-sm gap-2 rounded-xl',
};

export const NavButton3D = forwardRef<HTMLButtonElement, NavButton3DProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    icon, 
    label, 
    showLabel = true,
    active = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center font-medium',
          'border transition-all duration-150 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          // Active state
          active && 'ring-2 ring-primary/50 ring-offset-1',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {label && showLabel && <span className="hidden sm:inline">{label}</span>}
        {children}
      </button>
    );
  }
);

NavButton3D.displayName = 'NavButton3D';
