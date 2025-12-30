import { useState } from 'react';
import { useSystemModules } from '@/hooks/useUnifiedMarketplace';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Layers, 
  ChevronRight, 
  Package, 
  Sparkles,
  Building2,
  BarChart3,
  Shield,
  Zap,
  Search,
  Bot,
  MessageSquare,
  Users,
  FileText,
  Settings,
  Database,
  Globe,
  Mail,
  Calendar,
  CreditCard,
  Truck,
  ShoppingCart,
  PieChart,
  TrendingUp,
  Lock,
  Key,
  Briefcase,
  type LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mapeig de noms d'icones a components Lucide
const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Search,
  Bot,
  MessageSquare,
  Users,
  Shield,
  Package,
  Layers,
  Building2,
  Zap,
  FileText,
  Settings,
  Database,
  Globe,
  Mail,
  Calendar,
  CreditCard,
  Truck,
  ShoppingCart,
  PieChart,
  TrendingUp,
  Lock,
  Key,
  Briefcase,
  Sparkles,
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  core: { label: 'Core', icon: Package, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  vertical: { label: 'Verticales', icon: Building2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  horizontal: { label: 'Horizontal', icon: Layers, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  addon: { label: 'Add-ons', icon: Zap, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  analytics: { label: 'Analytics', icon: BarChart3, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  security: { label: 'Seguridad', icon: Shield, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

interface SystemModulesSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export function SystemModulesSection({ limit = 6, showViewAll = true }: SystemModulesSectionProps) {
  const { data: modules, isLoading } = useSystemModules(undefined, limit);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Módulos del Sistema
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return null;
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Incluido';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price) + '/mes';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          Módulos del Sistema
          <Badge variant="secondary" className="ml-2">{modules.length}+</Badge>
        </h3>
        {showViewAll && (
          <Link to="/store/modules">
            <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80">
              Ver catálogo completo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module, index) => {
          const categoryConfig = CATEGORY_CONFIG[module.category] || CATEGORY_CONFIG.addon;
          const CategoryIcon = categoryConfig.icon;
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={`/store/modules/${module.module_key}`}>
                <Card 
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 border-border/50 ${
                    hoveredId === module.id ? 'border-primary/30' : ''
                  }`}
                  onMouseEnter={() => setHoveredId(module.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardContent className="p-4 relative">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10 group-hover:scale-110 transition-transform">
                        {(() => {
                          const iconName = module.module_icon;
                          const IconComponent = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Package;
                          return <IconComponent className="h-5 w-5 text-primary" />;
                        })()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {module.module_name}
                          </h4>
                          {module.is_core && (
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {module.description || 'Módulo del sistema'}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${categoryConfig.color}`}
                          >
                            <CategoryIcon className="h-2.5 w-2.5 mr-1" />
                            {categoryConfig.label}
                          </Badge>
                          
                          <span className="text-xs font-medium text-primary">
                            {formatPrice(module.base_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default SystemModulesSection;
