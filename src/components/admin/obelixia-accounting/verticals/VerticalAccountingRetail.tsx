import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, TrendingUp, Package, BarChart3,
  CreditCard, Wallet, Receipt, Store, 
  Truck, Users, Target, Zap, Brain,
  RefreshCw, Globe, Smartphone, QrCode,
  ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';

export function VerticalAccountingRetail() {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const kpis = [
    { label: 'Ventas Hoy', value: '€24,580', change: '+12.4%', positive: true, icon: ShoppingCart },
    { label: 'Ticket Medio', value: '€45.20', change: '+3.2%', positive: true, icon: Receipt },
    { label: 'Margen Bruto', value: '32.5%', change: '-0.8%', positive: false, icon: TrendingUp },
    { label: 'Rotación Stock', value: '4.2x', change: '+0.3x', positive: true, icon: Package },
  ];

  const omniChannelData = [
    { channel: 'Tienda Física', revenue: 145000, percentage: 45, growth: 8 },
    { channel: 'E-commerce Web', revenue: 98000, percentage: 30, growth: 24 },
    { channel: 'App Móvil', revenue: 52000, percentage: 16, growth: 45 },
    { channel: 'Marketplace', revenue: 29000, percentage: 9, growth: 32 },
  ];

  const inventoryAlerts = [
    { product: 'iPhone 15 Pro 256GB', stock: 3, reorder: 15, status: 'critical' },
    { product: 'AirPods Pro 2', stock: 8, reorder: 20, status: 'warning' },
    { product: 'MacBook Air M3', stock: 12, reorder: 10, status: 'ok' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Retail</h1>
            <p className="text-muted-foreground">Gestión financiera omnicanal con IA predictiva</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-purple-500/10 text-purple-600">Retail 4.0</Badge>
          <Badge variant="outline" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            IA Activa
          </Badge>
        </div>
      </div>

      {/* KPIs en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-purple-600" />
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

      <Tabs defaultValue="omnichannel" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="omnichannel">Omnicanal</TabsTrigger>
          <TabsTrigger value="inventory">Inventario IA</TabsTrigger>
          <TabsTrigger value="payments">Pagos Unificados</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Dinámico</TabsTrigger>
          <TabsTrigger value="loyalty">Fidelización</TabsTrigger>
          <TabsTrigger value="analytics">Analytics 360°</TabsTrigger>
        </TabsList>

        <TabsContent value="omnichannel" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Consolidación Omnicanal en Tiempo Real
                </CardTitle>
                <CardDescription>
                  Unified Commerce: Contabilidad integrada de todos los canales de venta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {omniChannelData.map((channel, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Store className="h-4 w-4" />}
                        {idx === 1 && <Globe className="h-4 w-4" />}
                        {idx === 2 && <Smartphone className="h-4 w-4" />}
                        {idx === 3 && <Package className="h-4 w-4" />}
                        <span className="font-medium">{channel.channel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">€{channel.revenue.toLocaleString()}</span>
                        <Badge variant="outline" className="text-green-600">+{channel.growth}%</Badge>
                      </div>
                    </div>
                    <Progress value={channel.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  IA: Predicción de Demanda
                </CardTitle>
                <CardDescription>
                  Machine Learning para forecasting de ventas por canal y producto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">Ventas Próx. Semana</p>
                      <p className="text-2xl font-bold">€82,400</p>
                      <p className="text-xs text-green-600">Confianza: 94%</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">Stock Óptimo Sugerido</p>
                      <p className="text-2xl font-bold">€156K</p>
                      <p className="text-xs text-blue-600">-12% vs actual</p>
                    </CardContent>
                  </Card>
                </div>
                <Button className="w-full" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ejecutar Análisis Predictivo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Gestión Inteligente de Inventario
                </CardTitle>
                <CardDescription>
                  Valoración FIFO/LIFO/PMP automática con alertas de reposición IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {inventoryAlerts.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-lg border ${
                          item.status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                          item.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                          'bg-green-500/10 border-green-500/30'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.product}</p>
                            <p className="text-sm text-muted-foreground">
                              Stock: {item.stock} unidades | Punto de pedido: {item.reorder}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={item.status === 'critical' ? 'destructive' : item.status === 'warning' ? 'secondary' : 'outline'}>
                              {item.status === 'critical' ? 'Crítico' : item.status === 'warning' ? 'Atención' : 'OK'}
                            </Badge>
                            {item.status !== 'ok' && (
                              <Button size="sm" variant="outline">
                                <Truck className="h-3 w-3 mr-1" />
                                Pedir
                              </Button>
                            )}
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
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Valoración de Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Método FIFO</span>
                    <span className="font-bold">€245,890</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Método PMP</span>
                    <span className="font-bold">€243,120</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Coste Reposición</span>
                    <span className="font-bold">€258,400</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalcular Valoración
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Conciliación de Pagos Unificada
              </CardTitle>
              <CardDescription>
                Stripe, PayPal, BNPL, Bizum, Apple Pay, Google Pay - Todo en uno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                  <CardContent className="pt-4 text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                    <p className="text-sm text-muted-foreground">Tarjeta</p>
                    <p className="text-xl font-bold">€156K</p>
                    <p className="text-xs text-muted-foreground">68% del total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <CardContent className="pt-4 text-center">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Wallet Digital</p>
                    <p className="text-xl font-bold">€45K</p>
                    <p className="text-xs text-muted-foreground">19% del total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-sm text-muted-foreground">BNPL</p>
                    <p className="text-xl font-bold">€22K</p>
                    <p className="text-xs text-muted-foreground">9% del total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4 text-center">
                    <QrCode className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Bizum/QR</p>
                    <p className="text-xl font-bold">€9K</p>
                    <p className="text-xs text-muted-foreground">4% del total</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Conciliar Automático
                </Button>
                <Button variant="outline">
                  Ver Descuadres
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Pricing Dinámico con IA
              </CardTitle>
              <CardDescription>
                Optimización de precios en tiempo real basada en demanda, competencia y márgenes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Margen Optimizado</p>
                    <p className="text-2xl font-bold text-green-600">+4.2%</p>
                    <p className="text-xs">vs. precios fijos</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Productos Monitorizados</p>
                    <p className="text-2xl font-bold">2,450</p>
                    <p className="text-xs">SKUs activos</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Ajustes Automáticos/Día</p>
                    <p className="text-2xl font-bold">127</p>
                    <p className="text-xs">precios actualizados</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Brain className="h-5 w-5" />
                  <span className="text-xs">Analizar Competencia</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs">Optimizar Márgenes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Programa de Fidelización Contable
              </CardTitle>
              <CardDescription>
                Provisiones y contabilización de puntos, cashback y promociones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Provisión Puntos</p>
                    <p className="text-xl font-bold">€45,200</p>
                    <p className="text-xs text-muted-foreground">Pasivo por redimir</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Cashback Pendiente</p>
                    <p className="text-xl font-bold">€12,800</p>
                    <p className="text-xs text-muted-foreground">Por liquidar</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">CLV Promedio</p>
                    <p className="text-xl font-bold">€890</p>
                    <p className="text-xs text-green-600">+15% YoY</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Analytics Financiero 360°
              </CardTitle>
              <CardDescription>
                Análisis completo: Basket Analysis, RFM, Cohortes, Attribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs">Basket Analysis</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Segmentación RFM</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Análisis Cohortes</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Target className="h-5 w-5" />
                  <span className="text-xs">Attribution Model</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VerticalAIAgentPanel verticalType="retail" className="mt-6" />
      <VerticalHelpButton verticalType="retail" />
    </div>
  );
}
