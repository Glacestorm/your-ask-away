import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Euro, Package, Plus, Edit, Trash2, 
  Search, Filter, Download, Upload, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCNAEPricing } from '@/hooks/useCNAEPricing';

interface CNAEPricing {
  id: string;
  cnae_code: string;
  base_price: number;
  complexity_tier: string;
  sector_category: string;
  includes_features: string[];
  is_active: boolean;
}

interface CNAEBundle {
  id: string;
  bundle_name: string;
  bundle_description: string;
  cnae_codes: string[];
  discount_percentage: number;
  min_cnaes_required: number;
  is_active: boolean;
}

export function CNAEPricingAdmin() {
  const [pricings, setPricings] = useState<CNAEPricing[]>([]);
  const [bundles, setBundles] = useState<CNAEBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [isAddPricingOpen, setIsAddPricingOpen] = useState(false);
  const [isAddBundleOpen, setIsAddBundleOpen] = useState(false);
  const { toast } = useToast();
  const { getComplexityTierColor } = useCNAEPricing();

  // Form states
  const [newPricing, setNewPricing] = useState({
    cnae_code: '',
    base_price: 15000,
    complexity_tier: 'standard',
    sector_category: '',
    includes_features: [] as string[]
  });

  const [newBundle, setNewBundle] = useState({
    bundle_name: '',
    bundle_description: '',
    cnae_codes: [] as string[],
    discount_percentage: 20,
    min_cnaes_required: 2
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pricingRes, bundlesRes] = await Promise.all([
        supabase.from('cnae_pricing').select('*').order('sector_category'),
        supabase.from('cnae_bundles').select('*').order('discount_percentage', { ascending: false })
      ]);

      setPricings(pricingRes.data || []);
      setBundles(bundlesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPricing = async () => {
    try {
      const { error } = await supabase.from('cnae_pricing').insert(newPricing);
      if (error) throw error;

      toast({ title: 'Precio añadido', description: `CNAE ${newPricing.cnae_code} configurado` });
      setIsAddPricingOpen(false);
      setNewPricing({
        cnae_code: '',
        base_price: 15000,
        complexity_tier: 'standard',
        sector_category: '',
        includes_features: []
      });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddBundle = async () => {
    try {
      const { error } = await supabase.from('cnae_bundles').insert(newBundle);
      if (error) throw error;

      toast({ title: 'Bundle añadido', description: `${newBundle.bundle_name} creado` });
      setIsAddBundleOpen(false);
      setNewBundle({
        bundle_name: '',
        bundle_description: '',
        cnae_codes: [],
        discount_percentage: 20,
        min_cnaes_required: 2
      });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const togglePricingActive = async (id: string, currentState: boolean) => {
    try {
      await supabase.from('cnae_pricing').update({ is_active: !currentState }).eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error toggling pricing:', error);
    }
  };

  const toggleBundleActive = async (id: string, currentState: boolean) => {
    try {
      await supabase.from('cnae_bundles').update({ is_active: !currentState }).eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error toggling bundle:', error);
    }
  };

  const deletePricing = async (id: string) => {
    try {
      await supabase.from('cnae_pricing').delete().eq('id', id);
      toast({ title: 'Eliminado', description: 'Precio eliminado correctamente' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      await supabase.from('cnae_bundles').delete().eq('id', id);
      toast({ title: 'Eliminado', description: 'Bundle eliminado correctamente' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const sectors = [...new Set(pricings.map(p => p.sector_category).filter(Boolean))];

  const filteredPricings = pricings.filter(p => {
    const matchesSearch = p.cnae_code.includes(searchTerm) || 
                          p.sector_category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'all' || p.sector_category === sectorFilter;
    return matchesSearch && matchesSector;
  });

  // Stats
  const totalRevenue = pricings.filter(p => p.is_active).reduce((sum, p) => sum + p.base_price, 0);
  const avgPrice = pricings.length > 0 ? totalRevenue / pricings.filter(p => p.is_active).length : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">CNAEs Configurados</div>
            <div className="text-2xl font-bold">{pricings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Bundles Activos</div>
            <div className="text-2xl font-bold">{bundles.filter(b => b.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Precio Medio</div>
            <div className="text-2xl font-bold">{avgPrice.toLocaleString()}€</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Sectores</div>
            <div className="text-2xl font-bold">{sectors.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pricing">
            <Euro className="h-4 w-4 mr-2" />
            Precios CNAE
          </TabsTrigger>
          <TabsTrigger value="bundles">
            <Package className="h-4 w-4 mr-2" />
            Bundles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4">
          {/* Filters & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar CNAE..."
                  className="pl-9"
                />
              </div>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los sectores</SelectItem>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Dialog open={isAddPricingOpen} onOpenChange={setIsAddPricingOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir CNAE
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Añadir Precio CNAE</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Código CNAE</Label>
                        <Input
                          value={newPricing.cnae_code}
                          onChange={(e) => setNewPricing({...newPricing, cnae_code: e.target.value})}
                          placeholder="Ej: 6419"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio Base (€)</Label>
                        <Input
                          type="number"
                          value={newPricing.base_price}
                          onChange={(e) => setNewPricing({...newPricing, base_price: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Complejidad</Label>
                        <Select 
                          value={newPricing.complexity_tier} 
                          onValueChange={(v) => setNewPricing({...newPricing, complexity_tier: v})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sector</Label>
                        <Input
                          value={newPricing.sector_category}
                          onChange={(e) => setNewPricing({...newPricing, sector_category: e.target.value})}
                          placeholder="Ej: finance"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddPricing} className="w-full">
                      Añadir
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Pricing Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CNAE</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Complejidad</TableHead>
                      <TableHead>Precio Base</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPricings.map((pricing) => (
                      <TableRow key={pricing.id}>
                        <TableCell className="font-mono">{pricing.cnae_code}</TableCell>
                        <TableCell>{pricing.sector_category}</TableCell>
                        <TableCell>
                          <Badge className={getComplexityTierColor(pricing.complexity_tier)}>
                            {pricing.complexity_tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {pricing.base_price.toLocaleString()}€
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={pricing.is_active}
                            onCheckedChange={() => togglePricingActive(pricing.id, pricing.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePricing(pricing.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundles" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddBundleOpen} onOpenChange={setIsAddBundleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Bundle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Bundle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre del Bundle</Label>
                    <Input
                      value={newBundle.bundle_name}
                      onChange={(e) => setNewBundle({...newBundle, bundle_name: e.target.value})}
                      placeholder="Ej: Pack Financiero"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={newBundle.bundle_description}
                      onChange={(e) => setNewBundle({...newBundle, bundle_description: e.target.value})}
                      placeholder="Descripción del bundle"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Descuento (%)</Label>
                      <Input
                        type="number"
                        value={newBundle.discount_percentage}
                        onChange={(e) => setNewBundle({...newBundle, discount_percentage: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNAEs Mínimos</Label>
                      <Input
                        type="number"
                        value={newBundle.min_cnaes_required}
                        onChange={(e) => setNewBundle({...newBundle, min_cnaes_required: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CNAEs (separados por coma)</Label>
                    <Input
                      value={newBundle.cnae_codes.join(', ')}
                      onChange={(e) => setNewBundle({
                        ...newBundle, 
                        cnae_codes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="6419, 6420, 6430"
                    />
                  </div>
                  <Button onClick={handleAddBundle} className="w-full">
                    Añadir Bundle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Bundles Grid */}
          <div className="grid grid-cols-2 gap-4">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className={!bundle.is_active ? 'opacity-50' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{bundle.bundle_name}</CardTitle>
                    <Badge variant="default" className="bg-green-600">
                      -{bundle.discount_percentage}%
                    </Badge>
                  </div>
                  <CardDescription>{bundle.bundle_description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {bundle.cnae_codes.map((cnae) => (
                        <Badge key={cnae} variant="outline" className="text-xs">
                          {cnae}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        Mín. {bundle.min_cnaes_required} CNAEs
                      </span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={bundle.is_active}
                          onCheckedChange={() => toggleBundleActive(bundle.id, bundle.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBundle(bundle.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
