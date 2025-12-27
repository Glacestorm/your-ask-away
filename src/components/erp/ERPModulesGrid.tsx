import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  Users, 
  Receipt, 
  Wallet, 
  FileText, 
  TrendingUp,
  Shield,
  Leaf,
  Bot,
  Workflow,
  BarChart3,
  Building,
  ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ERPModule {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  base_price: number | null;
  category: string;
  sector: string | null;
  module_icon: string | null;
  is_core: boolean | null;
}

const iconMap: Record<string, React.ElementType> = {
  'Calculator': Calculator,
  'Users': Users,
  'Receipt': Receipt,
  'Wallet': Wallet,
  'FileText': FileText,
  'TrendingUp': TrendingUp,
  'Shield': Shield,
  'Leaf': Leaf,
  'Bot': Bot,
  'Workflow': Workflow,
  'BarChart3': BarChart3,
  'Building': Building,
};

const getModuleIcon = (iconName: string | null): React.ElementType => {
  if (!iconName) return Calculator;
  return iconMap[iconName] || Calculator;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'vertical': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'core': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'analytics': 'bg-green-500/10 text-green-600 border-green-500/20',
    'compliance': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
};

export const ERPModulesGrid: React.FC = () => {
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['erp-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .or('module_key.ilike.%accounting%,module_key.ilike.%erp%,module_key.ilike.%compliance%,module_key.ilike.%revenue%,module_key.ilike.%workflow%,module_key.ilike.%intelligence%,module_key.ilike.%esg%')
        .order('module_name');
      
      if (error) throw error;
      return data as ERPModule[];
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-3/4 mt-2" />
              <Skeleton className="h-4 w-full mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Error cargando módulos ERP</p>
        </CardContent>
      </Card>
    );
  }

  if (!modules?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No hay módulos ERP disponibles</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/store/modules">Ver todos los módulos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Módulos ERP Disponibles</h3>
          <p className="text-sm text-muted-foreground">
            {modules.length} módulos de contabilidad, finanzas y gestión empresarial
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/store/modules" className="gap-2">
            Ver catálogo completo
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const IconComponent = getModuleIcon(module.module_icon);
          return (
            <Card key={module.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${getCategoryColor(module.category)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    {module.is_core && (
                      <Badge variant="secondary" className="text-xs">Core</Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {module.category}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
                  {module.module_name}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {module.description || 'Módulo de gestión empresarial'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between">
                  {module.base_price !== null && module.base_price > 0 ? (
                    <span className="text-lg font-bold text-primary">
                      {module.base_price.toLocaleString('es-ES')} €
                      <span className="text-xs font-normal text-muted-foreground">/mes</span>
                    </span>
                  ) : (
                    <Badge variant="secondary">Incluido</Badge>
                  )}
                  {module.sector && (
                    <Badge variant="outline" className="text-xs">
                      {module.sector}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ERPModulesGrid;
