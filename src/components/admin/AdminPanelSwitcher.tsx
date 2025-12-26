import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LayoutGrid, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminPanelSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function AdminPanelSwitcher({ className, variant = 'default' }: AdminPanelSwitcherProps) {
  const location = useLocation();
  const isObelixiaAdmin = location.pathname.startsWith('/obelixia-admin');
  const isAdmin = location.pathname.startsWith('/admin');

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Link to="/admin">
          <Button 
            variant={isAdmin ? "default" : "outline"} 
            size="sm"
            className={cn(
              "gap-1.5 h-8",
              isAdmin && "bg-primary text-primary-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Admin
          </Button>
        </Link>
        <Link to="/obelixia-admin">
          <Button 
            variant={isObelixiaAdmin ? "default" : "outline"} 
            size="sm"
            className={cn(
              "gap-1.5 h-8",
              isObelixiaAdmin && "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-0"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            ObelixIA
          </Button>
        </Link>
      </div>
    );
  }

  // Default: Show link to the OTHER panel
  const targetPath = isObelixiaAdmin ? '/admin' : '/obelixia-admin';
  const targetLabel = isObelixiaAdmin ? 'Panel Operativo' : 'ObelixIA Admin';
  const TargetIcon = isObelixiaAdmin ? LayoutGrid : Shield;

  return (
    <Link to={targetPath} className={className}>
      <button 
        className={cn(
          // Base
          "relative inline-flex items-center gap-2 h-10 px-4",
          "font-medium text-sm rounded-xl",
          // 3D Effect with gradient
          "bg-gradient-to-b from-primary via-primary to-primary/85",
          "border border-primary/50",
          "shadow-[0_4px_8px_-2px_hsl(var(--primary)/0.35),0_2px_4px_-2px_hsl(var(--primary)/0.25),inset_0_1px_0_rgba(255,255,255,0.2)]",
          // Hover 3D
          "hover:shadow-[0_2px_4px_-1px_hsl(var(--primary)/0.25),inset_0_1px_0_rgba(255,255,255,0.25)]",
          "hover:translate-y-[1px] hover:brightness-110",
          // Active 3D
          "active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]",
          // Colors
          "text-primary-foreground",
          // Transition
          "transition-all duration-150 ease-out"
        )}
      >
        <TargetIcon className="h-4 w-4" />
        <span>Ir a {targetLabel}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </Link>
  );
}

export default AdminPanelSwitcher;
