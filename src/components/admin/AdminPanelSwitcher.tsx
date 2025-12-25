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
      <Button 
        variant="outline" 
        size="sm"
        className={cn(
          "gap-2 h-9 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all",
          !isObelixiaAdmin && "hover:border-emerald-500/50"
        )}
      >
        <TargetIcon className="h-4 w-4" />
        <span>Ir a {targetLabel}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </Link>
  );
}

export default AdminPanelSwitcher;
