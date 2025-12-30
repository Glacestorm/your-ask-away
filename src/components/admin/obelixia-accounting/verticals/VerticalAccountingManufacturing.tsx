import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Factory, Settings, Package, Wrench,
  BarChart3, TrendingUp, Calculator, Receipt,
  Cog, Layers, Timer, Gauge,
  ArrowUpRight, ArrowDownRight, Sparkles, Brain,
  CircleDollarSign, AlertTriangle, CheckCircle, Zap
} from 'lucide-react';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';

export function VerticalAccountingManufacturing() {
  const kpis = [
    { label: 'OEE', value: '84.2%', change: '+2.1%', positive: true, icon: Gauge },
    { label: 'Coste Hora Máq.', value: '€45.60', change: '-1.8%', positive: true, icon: Timer },
    { label: 'WIP Value', value: '€234K', change: '+5.4%', positive: false, icon: Layers },
    { label: 'Scrap Rate', value: '2.1%', change: '-0.3%', positive: true, icon: AlertTriangle },
  ];

  const productionOrders = [
    { id: 'OP-2025-001', product: 'Motor Eléctrico ME-500', quantity: 150, completed: 89, status: 'in_progress', cost: 45000 },
    { id: 'OP-2025-002', product: 'Bomba Hidráulica BH-200', quantity: 200, completed: 200, status: 'completed', cost: 28000 },
    { id: 'OP-2025-003', product: 'Reductor Velocidad RV-100', quantity: 75, completed: 0, status: 'pending', cost: 18500 },
  ];

  const costCenters = [
    { name: 'Línea de Mecanizado', budget: 120000, actual: 115400, variance: -3.8 },
    { name: 'Línea de Ensamblaje', budget: 85000, actual: 89200, variance: 4.9 },
    { name: 'Control de Calidad', budget: 35000, actual: 33800, variance: -3.4 },
    { name: 'Mantenimiento', budget: 45000, actual: 48600, variance: 8.0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
            <Factory className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Industrial</h1>
            <p className="text-muted-foreground">Cost Accounting, MES Integration & Industry 4.0</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-orange-500/10 text-orange-600">Industry 4.0</Badge>
          <Badge variant="outline" className="animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            MES Conectado
          </Badge>
        </div>
      </div>

      {/* KPIs en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-orange-600" />
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

      <Tabs defaultValue="costing" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="costing">Cost Accounting</TabsTrigger>
          <TabsTrigger value="orders">Órdenes Prod.</TabsTrigger>
          <TabsTrigger value="wip">WIP & Inventario</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
          <TabsTrigger value="quality">Costes Calidad</TabsTrigger>
          <TabsTrigger value="analytics">Analytics IA</TabsTrigger>
        </TabsList>

        <TabsContent value="costing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-orange-600" />
                  Activity-Based Costing (ABC)
                </CardTitle>
                <CardDescription>
                  Imputación de costes por actividad con cost drivers automáticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {costCenters.map((cc, idx) => (
                    <div key={idx} className="p-3 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{cc.name}</span>
                        <Badge variant={cc.variance < 0 ? 'default' : cc.variance > 5 ? 'destructive' : 'secondary'}>
                          {cc.variance > 0 ? '+' : ''}{cc.variance}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Presupuesto: €{cc.budget.toLocaleString()}</span>
                        <span className="font-medium">Real: €{cc.actual.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={(cc.actual / cc.budget) * 100} 
                        className={`h-2 ${cc.variance > 5 ? 'bg-red-200' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-orange-600" />
                  Estructura de Costes de Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span>Materiales Directos</span>
                      <span className="font-bold">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span>Mano de Obra Directa</span>
                      <span className="font-bold">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span>Costes Indirectos Fab.</span>
                      <span className="font-bold">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span>Costes Generales</span>
                      <span className="font-bold">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalcular Costes Estándar
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Órdenes de Producción - Costes en Tiempo Real
              </CardTitle>
              <CardDescription>
                Tracking de costes por orden con integración MES
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-4">
                  {productionOrders.map((order, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      order.status === 'completed' ? 'bg-green-500/5 border-green-500/20' :
                      order.status === 'in_progress' ? 'bg-blue-500/5 border-blue-500/20' :
                      'bg-muted/30'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-bold">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.product}</p>
                        </div>
                        <Badge variant={
                          order.status === 'completed' ? 'default' :
                          order.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {order.status === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                          {order.status === 'completed' ? 'Completada' :
                           order.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cantidad</p>
                          <p className="font-medium">{order.quantity} uds</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Completado</p>
                          <p className="font-medium">{order.completed} uds</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coste Acumulado</p>
                          <p className="font-medium">€{order.cost.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coste/Unidad</p>
                          <p className="font-medium">€{order.completed > 0 ? (order.cost / order.completed).toFixed(2) : '-'}</p>
                        </div>
                      </div>
                      <Progress value={(order.completed / order.quantity) * 100} className="h-2 mt-3" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wip" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-orange-600" />
                  Work in Progress (WIP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Materiales en Proceso</p>
                  <p className="text-2xl font-bold">€156,400</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">MOD Imputada</p>
                  <p className="text-2xl font-bold">€45,200</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">CIF Aplicados</p>
                  <p className="text-2xl font-bold">€32,800</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm text-muted-foreground">Total WIP</p>
                  <p className="text-2xl font-bold text-orange-600">€234,400</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Producto Terminado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">En Almacén</p>
                  <p className="text-2xl font-bold">€456,780</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">En Tránsito</p>
                  <p className="text-2xl font-bold">€89,200</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Reservado</p>
                  <p className="text-2xl font-bold">€234,500</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog className="h-5 w-5 text-orange-600" />
                  Materias Primas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Stock Actual</p>
                  <p className="text-2xl font-bold">€345,600</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">En Pedido</p>
                  <p className="text-2xl font-bold">€128,900</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Bajo Mínimos</p>
                  <p className="text-2xl font-bold">12 items</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                Costes de Mantenimiento Industrial
              </CardTitle>
              <CardDescription>
                Mantenimiento preventivo, correctivo y predictivo con IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4 text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Preventivo</p>
                    <p className="text-xl font-bold">€28,400</p>
                    <p className="text-xs text-green-600">58% del total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4 text-center">
                    <Wrench className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-sm text-muted-foreground">Correctivo</p>
                    <p className="text-xl font-bold">€15,200</p>
                    <p className="text-xs text-amber-600">31% del total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <CardContent className="pt-4 text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-muted-foreground">Predictivo IA</p>
                    <p className="text-xl font-bold">€5,400</p>
                    <p className="text-xs text-purple-600">11% del total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <CardContent className="pt-4 text-center">
                    <Timer className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Downtime Cost</p>
                    <p className="text-xl font-bold">€8,900</p>
                    <p className="text-xs text-red-600">-15% vs mes ant.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Settings className="h-5 w-5" />
                  <span className="text-xs">Plan Mantenim. Anual</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Brain className="h-5 w-5" />
                  <span className="text-xs">Predicción Fallos IA</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                Cost of Quality (CoQ)
              </CardTitle>
              <CardDescription>
                Análisis de costes de prevención, evaluación y fallos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Prevención</p>
                    <p className="text-2xl font-bold">€12,400</p>
                    <p className="text-xs">Formación, procesos</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Evaluación</p>
                    <p className="text-2xl font-bold">€18,600</p>
                    <p className="text-xs">Inspección, testing</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Fallos Internos</p>
                    <p className="text-2xl font-bold">€8,900</p>
                    <p className="text-xs">Scrap, retrabajo</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Fallos Externos</p>
                    <p className="text-2xl font-bold">€4,200</p>
                    <p className="text-xs">Garantías, devoluc.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg border border-orange-500/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Total Cost of Quality</p>
                    <p className="text-sm text-muted-foreground">2.8% de las ventas</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">€44,100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-600" />
                Analytics & IA Industrial
              </CardTitle>
              <CardDescription>
                Machine Learning para optimización de producción y costes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Gauge className="h-5 w-5" />
                  <span className="text-xs">OEE Predictor</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Calculator className="h-5 w-5" />
                  <span className="text-xs">Cost Variance AI</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Demand Planning</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Brain className="h-5 w-5" />
                  <span className="text-xs">Process Mining</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VerticalAIAgentPanel verticalType="manufacturing" className="mt-6" />
      <VerticalHelpButton verticalType="manufacturing" />
    </div>
  );
}
