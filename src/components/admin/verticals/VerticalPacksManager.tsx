import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShoppingCart, HardHat, Heart, Truck, Scale,
  Package, Settings, Euro, TrendingUp
} from 'lucide-react';

interface VerticalPack {
  id: string;
  vertical_key: string;
  vertical_name: string;
  description: string;
  cnae_codes: string[];
  included_modules: string[];
  pricing_config: { setup_fee: number; monthly_fee: number };
  is_active: boolean;
}

const iconMap: Record<string, any> = {
  ShoppingCart, HardHat, Heart, Truck, Scale
};

export const VerticalPacksManager: React.FC = () => {
  const [packs, setPacks] = useState<VerticalPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    const { data } = await supabase
      .from('vertical_packs')
      .select('*')
      .order('display_order');
    if (data) setPacks(data as VerticalPack[]);
    setLoading(false);
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Package;
    return Icon;
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Packs Verticales</h2>
          <p className="text-muted-foreground">Gestión de soluciones sectoriales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.map((pack) => {
          const Icon = getIcon(pack.icon_name || 'Package');
          return (
            <Card key={pack.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{pack.vertical_name}</CardTitle>
                  </div>
                  <Badge variant={pack.is_active ? 'default' : 'outline'}>
                    {pack.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{pack.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>CNAEs incluidos:</span>
                  <Badge variant="outline">{pack.cnae_codes?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Módulos:</span>
                  <Badge variant="outline">{pack.included_modules?.length || 0}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Setup</p>
                    <p className="font-bold">{pack.pricing_config?.setup_fee?.toLocaleString() || 0} €</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Mensual</p>
                    <p className="font-bold">{pack.pricing_config?.monthly_fee || 0} €</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
