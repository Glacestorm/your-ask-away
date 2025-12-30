import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  ChevronRight, 
  Heart,
  Building,
  GraduationCap,
  Hotel,
  Gavel,
  ShoppingCart,
  Factory,
  Truck,
  Wheat,
  Zap,
  HardHat,
  type LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const SECTOR_ICONS: Record<string, LucideIcon> = {
  health: Heart,
  realestate: Building,
  education: GraduationCap,
  hospitality: Hotel,
  professional: Gavel,
  retail: ShoppingCart,
  industry: Factory,
  logistics: Truck,
  agriculture: Wheat,
  energy: Zap,
};

interface SectorERPSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export function SectorERPSection({ limit = 6, showViewAll = true }: SectorERPSectionProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['sector-erp', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .like('module_key', 'erp-%')
        .not('module_key', 'in', '("erp-invoicing","erp-payroll")')
        .order('base_price', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            ERP Sectoriales
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
          ERP Sectoriales
          <Badge variant="secondary" className="ml-2">{modules.length}</Badge>
        </h3>
        {showViewAll && (
          <Link to="/store/modules?filter=erp">
            <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80">
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {modules.map((module, index) => {
          const sector = module.sector || 'industry';
          const SectorIcon = SECTOR_ICONS[sector] || Building2;
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
            >
              <Link to={`/store/modules/${module.module_key}`}>
                <Card 
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${
                    hoveredId === module.id ? 'border-blue-500/50' : ''
                  }`}
                  onMouseEnter={() => setHoveredId(module.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardContent className="p-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <SectorIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight line-clamp-1 group-hover:text-blue-500 transition-colors">
                          {module.module_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatPrice(module.base_price)}
                        </p>
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

export default SectorERPSection;
