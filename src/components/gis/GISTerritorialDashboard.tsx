import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Route,
  Download,
  FileText,
  Printer,
  Flame
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

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
  lat?: number;
  lng?: number;
}

interface HeatmapData {
  zone: string;
  density: number;
  potential: number;
  currentRevenue: number;
  lat?: number;
  lng?: number;
  x?: number;
  y?: number;
}

interface RoutePoint {
  id: string;
  name: string;
  address: string;
  time: string;
  duration: string;
  distance: number;
  priority: 'high' | 'medium' | 'low';
}

const mockTerritories: Territory[] = [
  { id: '1', name: 'Madrid Centro', region: 'Comunidad de Madrid', accounts: 156, revenue: 2450000, growth: 12.5, coverage: 85, manager: 'Carlos Ruiz', status: 'optimal', lat: 40.4168, lng: -3.7038 },
  { id: '2', name: 'Barcelona Litoral', region: 'Cataluña', accounts: 134, revenue: 1980000, growth: 8.3, coverage: 72, manager: 'Ana García', status: 'undercovered', lat: 41.3851, lng: 2.1734 },
  { id: '3', name: 'Valencia Sur', region: 'Comunidad Valenciana', accounts: 89, revenue: 1250000, growth: 15.2, coverage: 92, manager: 'Pedro López', status: 'optimal', lat: 39.4699, lng: -0.3763 },
  { id: '4', name: 'Sevilla Metro', region: 'Andalucía', accounts: 67, revenue: 890000, growth: 5.1, coverage: 65, manager: 'María Santos', status: 'undercovered', lat: 37.3891, lng: -5.9845 },
  { id: '5', name: 'Bilbao Industrial', region: 'País Vasco', accounts: 45, revenue: 1120000, growth: 18.7, coverage: 110, manager: 'Iñaki Etxebarria', status: 'overcovered', lat: 43.263, lng: -2.935 },
];

const mockHeatmap: HeatmapData[] = [
  { zone: 'Norte', density: 85, potential: 2500000, currentRevenue: 1890000, x: 30, y: 20 },
  { zone: 'Centro', density: 92, potential: 4200000, currentRevenue: 3850000, x: 50, y: 50 },
  { zone: 'Sur', density: 65, potential: 1800000, currentRevenue: 980000, x: 50, y: 80 },
  { zone: 'Este', density: 78, potential: 2100000, currentRevenue: 1650000, x: 80, y: 50 },
  { zone: 'Oeste', density: 55, potential: 1200000, currentRevenue: 540000, x: 20, y: 50 },
];

const mockRoutes: RoutePoint[] = [
  { id: '1', name: 'Banco Santander Madrid', address: 'Paseo de la Castellana, 75', time: '09:00', duration: '45 min', distance: 0, priority: 'high' },
  { id: '2', name: 'BBVA Torre Picasso', address: 'Plaza Pablo Ruiz Picasso, s/n', time: '10:00', duration: '30 min', distance: 3.2, priority: 'high' },
  { id: '3', name: 'CaixaBank Diagonal', address: 'Av. Diagonal, 621', time: '11:00', duration: '25 min', distance: 5.8, priority: 'medium' },
  { id: '4', name: 'Bankinter Serrano', address: 'Calle Serrano, 45', time: '12:00', duration: '20 min', distance: 2.1, priority: 'medium' },
  { id: '5', name: 'Sabadell Centro', address: 'Calle Alcalá, 123', time: '13:30', duration: '35 min', distance: 4.5, priority: 'low' },
];

const COLORS = ['#22c55e', '#eab308', '#3b82f6', '#ef4444', '#8b5cf6'];

export const GISTerritorialDashboard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'territories' | 'heatmap' | 'routes'>('territories');

  const totalAccounts = mockTerritories.reduce((sum, t) => sum + t.accounts, 0);
  const totalRevenue = mockTerritories.reduce((sum, t) => sum + t.revenue, 0);
  const avgCoverage = Math.round(mockTerritories.reduce((sum, t) => sum + t.coverage, 0) / mockTerritories.length);
  const totalDistance = mockRoutes.reduce((sum, r) => sum + r.distance, 0);

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

  const getPriorityBadge = (priority: RoutePoint['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500/20 text-red-600">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-600">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-500/20 text-green-600">Baja</Badge>;
    }
  };

  // Export territories to PDF
  const exportTerritoriesToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Informe GIS Territorial', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);

    // KPIs
    doc.setFontSize(12);
    doc.text('Resumen Ejecutivo', 14, 42);
    doc.setFontSize(10);
    doc.text(`Territorios Activos: ${mockTerritories.length}`, 14, 50);
    doc.text(`Cuentas Totales: ${totalAccounts}`, 14, 56);
    doc.text(`Revenue Total: €${(totalRevenue / 1000000).toFixed(2)}M`, 14, 62);
    doc.text(`Cobertura Media: ${avgCoverage}%`, 14, 68);

    // Territories table
    autoTable(doc, {
      startY: 78,
      head: [['Territorio', 'Región', 'Cuentas', 'Revenue', 'Crecimiento', 'Cobertura', 'Manager', 'Estado']],
      body: mockTerritories.map(t => [
        t.name,
        t.region,
        t.accounts.toString(),
        `€${(t.revenue / 1000).toFixed(0)}K`,
        `${t.growth}%`,
        `${t.coverage}%`,
        t.manager,
        t.status === 'optimal' ? 'Óptimo' : t.status === 'undercovered' ? 'Subcubierto' : 'Sobrecubierto'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('informe_gis_territorial.pdf');
    toast.success('PDF exportado correctamente');
  };

  // Export routes to PDF
  const exportRoutesToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Planificación de Rutas Comerciales', 14, 22);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);

    doc.setFontSize(12);
    doc.text('Resumen de Ruta', 14, 42);
    doc.setFontSize(10);
    doc.text(`Total de visitas: ${mockRoutes.length}`, 14, 50);
    doc.text(`Distancia total: ${totalDistance.toFixed(1)} km`, 14, 56);
    doc.text(`Tiempo estimado: 4.5 horas`, 14, 62);

    autoTable(doc, {
      startY: 72,
      head: [['#', 'Cliente', 'Dirección', 'Hora', 'Duración', 'Distancia', 'Prioridad']],
      body: mockRoutes.map((r, idx) => [
        (idx + 1).toString(),
        r.name,
        r.address,
        r.time,
        r.duration,
        `${r.distance} km`,
        r.priority === 'high' ? 'Alta' : r.priority === 'medium' ? 'Media' : 'Baja'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save('planificacion_rutas.pdf');
    toast.success('Ruta exportada a PDF');
  };

  // Territory distribution chart data
  const territoryDistribution = mockTerritories.map(t => ({
    name: t.name.split(' ')[0],
    accounts: t.accounts,
    revenue: t.revenue / 1000,
  }));

  // Heatmap scatter data for visualization
  const heatmapScatter = mockHeatmap.map(h => ({
    x: h.x,
    y: h.y,
    z: h.density,
    name: h.zone,
  }));

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
          <Button variant="outline" size="icon" onClick={exportTerritoriesToPDF} title="Exportar PDF">
            <FileText className="h-4 w-4" />
          </Button>
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
            <Flame className="h-4 w-4" />
            Mapa de Calor
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Rutas Óptimas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="territories" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Territory Distribution Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Distribución por Territorio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={territoryDistribution}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="accounts" name="Cuentas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue (K€)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                <ScrollArea className="h-80">
                  <div className="space-y-3 pr-4">
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
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Heatmap Visualization */}
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Mapa de Densidad de Oportunidades
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Flame className="h-3 w-3 mr-1" /> Densidad en tiempo real
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                      <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                      <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-muted-foreground">Densidad: {data.z}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter data={heatmapScatter} fill="#ef4444">
                        {heatmapScatter.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.z > 80 ? '#ef4444' : entry.z > 60 ? '#eab308' : '#22c55e'} 
                            fillOpacity={0.7}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500/70" />
                    <span className="text-xs text-muted-foreground">Alta densidad (&gt;80%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500/70" />
                    <span className="text-xs text-muted-foreground">Media (60-80%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500/70" />
                    <span className="text-xs text-muted-foreground">Baja (&lt;60%)</span>
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
                  {mockHeatmap.map((zone, idx) => (
                    <div key={zone.zone} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="font-medium">{zone.zone}</span>
                        </div>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Route className="h-4 w-4" />
                Optimización de Rutas Comerciales
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportRoutesToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Ruta
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Route Visualization */}
                <div className="col-span-2 space-y-4">
                  <Card className="bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Locate className="h-5 w-5 text-primary" />
                          <span className="font-medium">Ruta Óptima - {new Date().toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{mockRoutes.length}</p>
                            <p className="text-xs text-muted-foreground">visitas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{totalDistance.toFixed(1)} km</p>
                            <p className="text-xs text-muted-foreground">distancia</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">4.5h</p>
                            <p className="text-xs text-muted-foreground">estimado</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <ScrollArea className="h-64">
                    <div className="space-y-2 pr-4">
                      {mockRoutes.map((route, idx) => (
                        <div 
                          key={route.id} 
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium">{route.name}</p>
                                <p className="text-xs text-muted-foreground">{route.address}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getPriorityBadge(route.priority)}
                              <div className="text-right">
                                <p className="font-medium">{route.time}</p>
                                <p className="text-xs text-muted-foreground">{route.duration}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Route Summary */}
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium mb-3">Distribución por Prioridad</p>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Alta', value: mockRoutes.filter(r => r.priority === 'high').length, fill: '#ef4444' },
                                { name: 'Media', value: mockRoutes.filter(r => r.priority === 'medium').length, fill: '#eab308' },
                                { name: 'Baja', value: mockRoutes.filter(r => r.priority === 'low').length, fill: '#22c55e' },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={45}
                              dataKey="value"
                            >
                              {[
                                { name: 'Alta', value: mockRoutes.filter(r => r.priority === 'high').length, fill: '#ef4444' },
                                { name: 'Media', value: mockRoutes.filter(r => r.priority === 'medium').length, fill: '#eab308' },
                                { name: 'Baja', value: mockRoutes.filter(r => r.priority === 'low').length, fill: '#22c55e' },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium mb-2">Estadísticas</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prioridad Alta</span>
                          <span className="font-medium">{mockRoutes.filter(r => r.priority === 'high').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prioridad Media</span>
                          <span className="font-medium">{mockRoutes.filter(r => r.priority === 'medium').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prioridad Baja</span>
                          <span className="font-medium">{mockRoutes.filter(r => r.priority === 'low').length}</span>
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
