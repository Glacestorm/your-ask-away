import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Globe, 
  Users, 
  TrendingUp, 
  Building2, 
  Filter,
  Layers,
  Target,
  BarChart3,
  Locate,
  Route
} from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  region: string;
  accounts: number;
  revenue: number;
  growth: number;
  coverage: number;
  manager: string;
  status: 'optimal' | 'undercovered' | 'overcovered';
}

interface HeatmapData {
  zone: string;
  density: number;
  potential: number;
  currentRevenue: number;
}

const mockTerritories: Territory[] = [
  { id: '1', name: 'Madrid Centro', region: 'Comunidad de Madrid', accounts: 156, revenue: 2450000, growth: 12.5, coverage: 85, manager: 'Carlos Ruiz', status: 'optimal' },
  { id: '2', name: 'Barcelona Litoral', region: 'Cataluña', accounts: 134, revenue: 1980000, growth: 8.3, coverage: 72, manager: 'Ana García', status: 'undercovered' },
  { id: '3', name: 'Valencia Sur', region: 'Comunidad Valenciana', accounts: 89, revenue: 1250000, growth: 15.2, coverage: 92, manager: 'Pedro López', status: 'optimal' },
  { id: '4', name: 'Sevilla Metro', region: 'Andalucía', accounts: 67, revenue: 890000, growth: 5.1, coverage: 65, manager: 'María Santos', status: 'undercovered' },
  { id: '5', name: 'Bilbao Industrial', region: 'País Vasco', accounts: 45, revenue: 1120000, growth: 18.7, coverage: 110, manager: 'Iñaki Etxebarria', status: 'overcovered' },
];

const mockHeatmap: HeatmapData[] = [
  { zone: 'Norte', density: 85, potential: 2500000, currentRevenue: 1890000 },
  { zone: 'Centro', density: 92, potential: 4200000, currentRevenue: 3850000 },
  { zone: 'Sur', density: 65, potential: 1800000, currentRevenue: 980000 },
  { zone: 'Este', density: 78, potential: 2100000, currentRevenue: 1650000 },
  { zone: 'Oeste', density: 55, potential: 1200000, currentRevenue: 540000 },
];

export const GISTerritorialDashboard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'territories' | 'heatmap' | 'routes'>('territories');

  const totalAccounts = mockTerritories.reduce((sum, t) => sum + t.accounts, 0);
  const totalRevenue = mockTerritories.reduce((sum, t) => sum + t.revenue, 0);
  const avgCoverage = Math.round(mockTerritories.reduce((sum, t) => sum + t.coverage, 0) / mockTerritories.length);

  const getStatusBadge = (status: Territory['status']) => {
    switch (status) {
      case 'optimal':
        return <Badge className="bg-green-500/20 text-green-600">Óptimo</Badge>;
      case 'undercovered':
        return <Badge className="bg-yellow-500/20 text-yellow-600">Subcubierto</Badge>;
      case 'overcovered':
        return <Badge className="bg-blue-500/20 text-blue-600">Sobrecubierto</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">GIS Territorial</h2>
            <p className="text-sm text-muted-foreground">Análisis geoespacial de cartera y territorios</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar región" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las regiones</SelectItem>
              <SelectItem value="madrid">Comunidad de Madrid</SelectItem>
              <SelectItem value="cataluna">Cataluña</SelectItem>
              <SelectItem value="valencia">Comunidad Valenciana</SelectItem>
              <SelectItem value="andalucia">Andalucía</SelectItem>
              <SelectItem value="pais-vasco">País Vasco</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Territorios Activos</p>
                <p className="text-2xl font-bold">{mockTerritories.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuentas Totales</p>
                <p className="text-2xl font-bold">{totalAccounts}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Total</p>
                <p className="text-2xl font-bold">€{(totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cobertura Media</p>
                <p className="text-2xl font-bold">{avgCoverage}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500/30" />
            </div>
            <Progress value={avgCoverage} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="territories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Territorios
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Mapa de Calor
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Rutas Óptimas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="territories" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Map Placeholder */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Mapa de Territorios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gradient-to-br from-blue-500/10 via-green-500/10 to-purple-500/10 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/30">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Mapa interactivo</p>
                    <p className="text-xs text-muted-foreground/70">Integración con MapLibre/Mapbox</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Territory List */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Lista de Territorios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {mockTerritories.map((territory) => (
                    <div key={territory.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">{territory.name}</span>
                        </div>
                        {getStatusBadge(territory.status)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cuentas</p>
                          <p className="font-medium">{territory.accounts}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-medium">€{(territory.revenue / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cobertura</p>
                          <p className="font-medium">{territory.coverage}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {territory.manager}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Mapa de Densidad de Oportunidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gradient-to-br from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/30">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Mapa de calor de oportunidades</p>
                    <p className="text-xs text-muted-foreground/70">Visualización de densidad territorial</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Zonas por Potencial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockHeatmap.map((zone) => (
                    <div key={zone.zone} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{zone.zone}</span>
                        <span className="text-sm text-muted-foreground">{zone.density}%</span>
                      </div>
                      <Progress value={zone.density} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>€{(zone.currentRevenue / 1000).toFixed(0)}K actual</span>
                        <span>€{(zone.potential / 1000).toFixed(0)}K potencial</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Route className="h-4 w-4" />
                Optimización de Rutas Comerciales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/30">
                  <div className="text-center">
                    <Route className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Rutas optimizadas por IA</p>
                    <p className="text-xs text-muted-foreground/70">Algoritmo de TSP + restricciones de tiempo</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Card className="bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Locate className="h-4 w-4 text-primary" />
                        <span className="font-medium">Ruta Óptima Hoy</span>
                      </div>
                      <p className="text-2xl font-bold">8 visitas</p>
                      <p className="text-sm text-muted-foreground">125 km • 4.5h estimado</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium mb-2">Próximas visitas</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>09:00 - Banco Santander</span>
                          <Badge variant="outline">15 min</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>10:30 - BBVA</span>
                          <Badge variant="outline">25 min</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>12:00 - CaixaBank</span>
                          <Badge variant="outline">20 min</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button className="w-full">
                    <Route className="h-4 w-4 mr-2" />
                    Recalcular Ruta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GISTerritorialDashboard;
