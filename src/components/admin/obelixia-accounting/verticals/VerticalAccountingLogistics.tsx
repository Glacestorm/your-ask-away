import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Truck, Package, MapPin, Clock, 
  Route, Warehouse, Ship, Plane,
  BarChart3, TrendingUp, Calculator, Receipt,
  Fuel, Leaf, Globe, Boxes,
  ArrowUpRight, ArrowDownRight, Sparkles, Brain,
  Container, CircleDollarSign
} from 'lucide-react';

export function VerticalAccountingLogistics() {
  const kpis = [
    { label: 'Envíos Hoy', value: '1,245', change: '+8.2%', positive: true, icon: Package },
    { label: 'Coste por Km', value: '€1.24', change: '-3.1%', positive: true, icon: Route },
    { label: 'On-Time Delivery', value: '96.8%', change: '+1.2%', positive: true, icon: Clock },
    { label: 'Fill Rate', value: '87.4%', change: '-2.3%', positive: false, icon: Boxes },
  ];

  const fleetData = [
    { vehicle: 'Camión 40T - MAT-1234', status: 'en_ruta', km: 45230, fuel: 78, lastMaintenance: '2024-11-15' },
    { vehicle: 'Furgoneta - MAT-5678', status: 'descargando', km: 123450, fuel: 45, lastMaintenance: '2024-12-01' },
    { vehicle: 'Trailer Frigorífico - MAT-9012', status: 'mantenimiento', km: 89000, fuel: 100, lastMaintenance: '2025-01-02' },
  ];

  const warehouseCosts = [
    { warehouse: 'Madrid Hub', occupancy: 85, costPerPallet: 4.5, monthly: 45000 },
    { warehouse: 'Barcelona Logistics', occupancy: 72, costPerPallet: 5.2, monthly: 38000 },
    { warehouse: 'Valencia Port', occupancy: 91, costPerPallet: 3.8, monthly: 52000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Logística</h1>
            <p className="text-muted-foreground">Supply Chain Finance con IA y tracking en tiempo real</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-500/10 text-blue-600">Logistics 4.0</Badge>
          <Badge variant="outline" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            IoT Conectado
          </Badge>
        </div>
      </div>

      {/* KPIs en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-blue-600" />
                <Badge variant={kpi.positive ? "default" : "destructive"} className="text-xs">
                  {kpi.positive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {kpi.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="fleet" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="fleet">Flota TCO</TabsTrigger>
          <TabsTrigger value="warehouse">Almacenes</TabsTrigger>
          <TabsTrigger value="shipping">Envíos/Costes</TabsTrigger>
          <TabsTrigger value="international">Comercio Intl.</TabsTrigger>
          <TabsTrigger value="sustainability">ESG Logístico</TabsTrigger>
          <TabsTrigger value="optimization">Optimización IA</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Total Cost of Ownership (TCO) Flota
                </CardTitle>
                <CardDescription>
                  Análisis completo: Combustible, mantenimiento, seguros, amortización
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {fleetData.map((vehicle, idx) => (
                      <div key={idx} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium">{vehicle.vehicle}</p>
                          <Badge variant={
                            vehicle.status === 'en_ruta' ? 'default' :
                            vehicle.status === 'descargando' ? 'secondary' : 'outline'
                          }>
                            {vehicle.status === 'en_ruta' ? '🚛 En Ruta' :
                             vehicle.status === 'descargando' ? '📦 Descargando' : '🔧 Mantenimiento'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Kilómetros</p>
                            <p className="font-medium">{vehicle.km.toLocaleString()} km</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Combustible</p>
                            <Progress value={vehicle.fuel} className="h-2 mt-1" />
                          </div>
                          <div>
                            <p className="text-muted-foreground">Últ. Mantenim.</p>
                            <p className="font-medium">{vehicle.lastMaintenance}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-blue-600" />
                  Desglose de Costes de Flota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-amber-600" />
                      <span>Combustible</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€42,350</p>
                      <p className="text-xs text-muted-foreground">38% del TCO</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <span>Mantenimiento</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€28,900</p>
                      <p className="text-xs text-muted-foreground">26% del TCO</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-purple-600" />
                      <span>Seguros</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€18,200</p>
                      <p className="text-xs text-muted-foreground">16% del TCO</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Amortización</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€22,100</p>
                      <p className="text-xs text-muted-foreground">20% del TCO</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warehouse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-blue-600" />
                Costes de Almacenamiento por Centro
              </CardTitle>
              <CardDescription>
                Análisis de ocupación, coste por pallet y productividad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {warehouseCosts.map((wh, idx) => (
                  <div key={idx} className="p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{wh.warehouse}</span>
                      </div>
                      <Badge variant={wh.occupancy > 85 ? 'destructive' : wh.occupancy > 70 ? 'secondary' : 'outline'}>
                        {wh.occupancy}% Ocupación
                      </Badge>
                    </div>
                    <Progress value={wh.occupancy} className="h-2 mb-3" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Coste/Pallet</p>
                        <p className="font-bold">€{wh.costPerPallet}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Coste Mensual</p>
                        <p className="font-bold">€{wh.monthly.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pallets Activos</p>
                        <p className="font-bold">{Math.round(wh.monthly / wh.costPerPallet / 30)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Análisis de Costes de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                    <CardContent className="pt-4 text-center">
                      <Truck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-muted-foreground">Terrestre</p>
                      <p className="text-xl font-bold">€2.45/kg</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10">
                    <CardContent className="pt-4 text-center">
                      <Ship className="h-8 w-8 mx-auto mb-2 text-cyan-600" />
                      <p className="text-sm text-muted-foreground">Marítimo</p>
                      <p className="text-xl font-bold">€0.85/kg</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    <CardContent className="pt-4 text-center">
                      <Plane className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                      <p className="text-sm text-muted-foreground">Aéreo</p>
                      <p className="text-xl font-bold">€8.90/kg</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <CardContent className="pt-4 text-center">
                      <Container className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-muted-foreground">Intermodal</p>
                      <p className="text-xl font-bold">€1.65/kg</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Última Milla - Análisis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between">
                    <span>Coste promedio entrega</span>
                    <span className="font-bold">€4.85</span>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between">
                    <span>Entregas fallidas (%)</span>
                    <span className="font-bold text-amber-600">8.2%</span>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between">
                    <span>Coste re-entrega</span>
                    <span className="font-bold text-red-600">€12.40</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Brain className="h-4 w-4 mr-2" />
                  Optimizar Rutas IA
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="international" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Comercio Internacional - Incoterms y Aduanas
              </CardTitle>
              <CardDescription>
                Gestión de DUA, aranceles, IVA diferido y costes de importación/exportación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Aranceles Pagados</p>
                    <p className="text-2xl font-bold">€45,670</p>
                    <p className="text-xs text-muted-foreground">Este trimestre</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">IVA Diferido</p>
                    <p className="text-2xl font-bold">€128,400</p>
                    <p className="text-xs text-muted-foreground">Por compensar</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Valor Importaciones</p>
                    <p className="text-2xl font-bold">€890K</p>
                    <p className="text-xs text-muted-foreground">FOB + Costes</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Receipt className="h-5 w-5" />
                  <span className="text-xs">Nuevo DUA</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Calculator className="h-5 w-5" />
                  <span className="text-xs">Calcular Aranceles</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                ESG & Sostenibilidad Logística
              </CardTitle>
              <CardDescription>
                Huella de carbono, compensaciones CO2 y reporting ESG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4 text-center">
                    <Leaf className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Emisiones CO2</p>
                    <p className="text-xl font-bold">245 Tn</p>
                    <p className="text-xs text-green-600">-12% vs año anterior</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <CardContent className="pt-4 text-center">
                    <CircleDollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Coste CO2</p>
                    <p className="text-xl font-bold">€18,500</p>
                    <p className="text-xs">Compensaciones</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4 text-center">
                    <Truck className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-sm text-muted-foreground">Flota Eléctrica</p>
                    <p className="text-xl font-bold">15%</p>
                    <p className="text-xs">3 de 20 vehículos</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <CardContent className="pt-4 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-muted-foreground">Score ESG</p>
                    <p className="text-xl font-bold">B+</p>
                    <p className="text-xs text-green-600">Mejorando</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Optimización con IA & Machine Learning
              </CardTitle>
              <CardDescription>
                Predicción de demanda, optimización de rutas y gestión de capacidad inteligente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Route className="h-5 w-5" />
                  <span className="text-xs">Route Optimizer</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Package className="h-5 w-5" />
                  <span className="text-xs">Demand Forecast</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Warehouse className="h-5 w-5" />
                  <span className="text-xs">Capacity Planning</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs">Cost Predictor</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
