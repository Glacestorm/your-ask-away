import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package2, 
  ChevronRight, 
  Sparkles,
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
  CreditCard,
  Check,
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
  banking: CreditCard,
};

const SECTOR_COLORS: Record<string, string> = {
  health: 'from-rose-500 to-pink-600',
  realestate: 'from-blue-500 to-indigo-600',
  education: 'from-violet-500 to-purple-600',
  hospitality: 'from-amber-500 to-orange-600',
  professional: 'from-slate-500 to-gray-600',
  retail: 'from-emerald-500 to-green-600',
  industry: 'from-cyan-500 to-blue-600',
  logistics: 'from-orange-500 to-red-600',
  agriculture: 'from-lime-500 to-green-600',
  energy: 'from-yellow-500 to-amber-600',
  banking: 'from-indigo-500 to-blue-600',
};

interface SectorPacksSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export function SectorPacksSection({ limit = 6, showViewAll = true }: SectorPacksSectionProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: packs, isLoading } = useQuery({
    queryKey: ['sector-packs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .like('module_key', 'pack-%')
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
            <Package2 className="h-5 w-5 text-primary" />
            Packs Sectoriales 360°
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!packs || packs.length === 0) {
    return null;
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Consultar';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price) + '/mes';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
            <Package2 className="h-5 w-5 text-primary" />
          </div>
          Packs Sectoriales 360°
          <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </h3>
        {showViewAll && (
          <Link to="/store/modules?filter=packs">
            <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80">
              Ver todos los packs
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.map((pack, index) => {
          const sector = pack.sector || 'industry';
          const SectorIcon = SECTOR_ICONS[sector] || Factory;
          const gradientColor = SECTOR_COLORS[sector] || 'from-primary to-secondary';
          
          return (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={`/store/modules/${pack.module_key}`}>
                <Card 
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 border-border/50 bg-gradient-to-br from-card to-card/80 ${
                    hoveredId === pack.id ? 'border-primary/50 shadow-lg' : ''
                  }`}
                  onMouseEnter={() => setHoveredId(pack.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  {/* Premium badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={`bg-gradient-to-r ${gradientColor} text-white border-0 text-[10px]`}>
                      360°
                    </Badge>
                  </div>
                  
                  <CardContent className="p-5 relative">
                    <div className="flex flex-col gap-4">
                      {/* Icon and title */}
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientColor} shadow-lg group-hover:scale-110 transition-transform`}>
                          <SectorIcon className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                            {pack.module_name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            CRM + ERP + Contabilidad
                          </p>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {pack.description || 'Suite completa sectorial'}
                      </p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5">
                        {['CRM', 'ERP', 'Contabilidad', 'IA'].map((feature) => (
                          <Badge 
                            key={feature}
                            variant="outline" 
                            className="text-[10px] px-1.5 py-0 bg-background/50"
                          >
                            <Check className="h-2.5 w-2.5 mr-0.5 text-green-500" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">Desde</span>
                        <span className={`text-lg font-bold bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent`}>
                          {formatPrice(pack.base_price)}
                        </span>
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

export default SectorPacksSection;
