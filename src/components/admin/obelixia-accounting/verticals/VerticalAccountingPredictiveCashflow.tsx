// Vertical Accounting - Predictive Cashflow
// Fase 12 - Módulo Disruptivo: Cashflow Predictivo con IA Generativa

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Brain,
  Sparkles,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Settings,
  Play,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Gauge,
  Bell,
  Shield,
  Clock,
  Layers,
  GitBranch
} from 'lucide-react';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';

interface CashflowForecast {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
  actual?: number;
  confidence: number;
}

interface CashflowDriver {
  id: string;
  name: string;
  category: 'inflow' | 'outflow';
  impact: number;
  trend: 'up' | 'down' | 'stable';
  volatility: 'low' | 'medium' | 'high';
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'optimistic' | 'base' | 'pessimistic' | 'custom';
  parameters: Record<string, number>;
  endingCash: number;
  minCash: number;
  runwayDays: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  date: string;
  amount?: number;
  recommendation?: string;
}

export function VerticalAccountingPredictiveCashflow() {
  const [activeTab, setActiveTab] = useState('forecast');
  const [forecastHorizon, setForecastHorizon] = useState([90]);
  const [selectedScenario, setSelectedScenario] = useState('base');

  // Mock data - Forecasts
  const forecasts: CashflowForecast[] = [
    { date: '2024-01-15', predicted: 485000, lower: 460000, upper: 510000, actual: 492000, confidence: 95 },
    { date: '2024-01-31', predicted: 520000, lower: 485000, upper: 555000, actual: 518000, confidence: 92 },
    { date: '2024-02-15', predicted: 475000, lower: 430000, upper: 520000, confidence: 88 },
    { date: '2024-02-28', predicted: 510000, lower: 455000, upper: 565000, confidence: 85 },
    { date: '2024-03-15', predicted: 545000, lower: 480000, upper: 610000, confidence: 82 },
    { date: '2024-03-31', predicted: 580000, lower: 500000, upper: 660000, confidence: 78 },
    { date: '2024-04-15', predicted: 560000, lower: 470000, upper: 650000, confidence: 75 },
    { date: '2024-04-30', predicted: 595000, lower: 490000, upper: 700000, confidence: 72 }
  ];

  // Mock data - Drivers
  const drivers: CashflowDriver[] = [
    { id: '1', name: 'Ventas Recurrentes', category: 'inflow', impact: 35, trend: 'up', volatility: 'low' },
    { id: '2', name: 'Cobros a Clientes', category: 'inflow', impact: 28, trend: 'stable', volatility: 'medium' },
    { id: '3', name: 'Nuevos Contratos', category: 'inflow', impact: 15, trend: 'up', volatility: 'high' },
    { id: '4', name: 'Nóminas', category: 'outflow', impact: -25, trend: 'up', volatility: 'low' },
    { id: '5', name: 'Proveedores', category: 'outflow', impact: -18, trend: 'stable', volatility: 'medium' },
    { id: '6', name: 'Impuestos', category: 'outflow', impact: -12, trend: 'stable', volatility: 'low' },
    { id: '7', name: 'Inversiones', category: 'outflow', impact: -8, trend: 'down', volatility: 'high' }
  ];

  // Mock data - Scenarios
  const scenarios: Scenario[] = [
    {
      id: 'optimistic',
      name: 'Optimista',
      description: 'Ventas +20%, cobros acelerados, costos controlados',
      type: 'optimistic',
      parameters: { salesGrowth: 20, collectionDays: -5, costReduction: 5 },
      endingCash: 720000,
      minCash: 450000,
      runwayDays: 365
    },
    {
      id: 'base',
      name: 'Base',
      description: 'Proyección basada en tendencias actuales',
      type: 'base',
      parameters: { salesGrowth: 8, collectionDays: 0, costReduction: 0 },
      endingCash: 595000,
      minCash: 380000,
      runwayDays: 280
    },
    {
      id: 'pessimistic',
      name: 'Pesimista',
      description: 'Ventas -15%, retrasos en cobros, costos +10%',
      type: 'pessimistic',
      parameters: { salesGrowth: -15, collectionDays: 15, costReduction: -10 },
      endingCash: 320000,
      minCash: 180000,
      runwayDays: 145
    }
  ];

  // Mock data - Alerts
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Posible déficit de liquidez',
      description: 'El modelo predice un punto bajo de €180K en semana 12',
      date: '2024-03-18',
      amount: 180000,
      recommendation: 'Considerar línea de crédito standby o acelerar cobros pendientes'
    },
    {
      id: '2',
      type: 'critical',
      title: 'Concentración de pagos',
      description: '€125K en pagos a proveedores concentrados el día 15',
      date: '2024-02-15',
      amount: 125000,
      recommendation: 'Negociar escalonamiento con proveedores principales'
    },
    {
      id: '3',
      type: 'info',
      title: 'Oportunidad de inversión',
      description: 'Excedente proyectado de €150K en abril',
      date: '2024-04-01',
      amount: 150000,
      recommendation: 'Evaluar opciones de inversión a corto plazo'
    }
  ];

  const currentCash = 492000;
  const projectedEndCash = 595000;
  const avgConfidence = Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length);
  const runway = 280;

  return (
    <div className="space-y-6 p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cashflow Predictivo IA</h1>
            <p className="text-muted-foreground">
              Predicciones de flujo de caja con IA generativa y análisis de escenarios
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Modelo
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600">
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Insights
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cash Actual</p>
                <p className="text-2xl font-bold">€{currentCash.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +8.2% vs mes anterior
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyección 90d</p>
                <p className="text-2xl font-bold">€{projectedEndCash.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Escenario base</p>
              </div>
              <Target className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confianza Modelo</p>
                <p className="text-2xl font-bold">{avgConfidence}%</p>
                <Progress value={avgConfidence} className="h-1.5 mt-1" />
              </div>
              <Brain className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Runway</p>
                <p className="text-2xl font-bold">{runway} días</p>
                <p className="text-xs text-muted-foreground">~{Math.round(runway / 30)} meses</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="forecast" className="flex items-center gap-1">
            <LineChart className="h-4 w-4" />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            Escenarios
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Proyección de Flujo de Caja
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Horizonte:</span>
                    <Slider
                      value={forecastHorizon}
                      onValueChange={setForecastHorizon}
                      max={365}
                      min={30}
                      step={30}
                      className="w-32"
                    />
                    <span className="text-sm font-medium">{forecastHorizon[0]}d</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {forecasts.map((forecast, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{new Date(forecast.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={forecast.confidence >= 85 ? 'default' : forecast.confidence >= 75 ? 'secondary' : 'outline'}>
                            {forecast.confidence}% confianza
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Predicción</p>
                          <p className="text-lg font-bold">€{forecast.predicted.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rango Inferior</p>
                          <p className="text-sm text-muted-foreground">€{forecast.lower.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rango Superior</p>
                          <p className="text-sm text-muted-foreground">€{forecast.upper.toLocaleString()}</p>
                        </div>
                        {forecast.actual !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className={`text-sm font-medium ${
                              forecast.actual >= forecast.lower && forecast.actual <= forecast.upper 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              €{forecast.actual.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30"
                            style={{ 
                              left: `${((forecast.lower - 400000) / 400000) * 100}%`,
                              width: `${((forecast.upper - forecast.lower) / 400000) * 100}%`
                            }}
                          />
                          <div 
                            className="absolute h-full w-1 bg-emerald-500"
                            style={{ left: `${((forecast.predicted - 400000) / 400000) * 100}%` }}
                          />
                          {forecast.actual && (
                            <div 
                              className="absolute h-full w-1 bg-blue-500"
                              style={{ left: `${((forecast.actual - 400000) / 400000) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all ${
                  selectedScenario === scenario.id 
                    ? 'ring-2 ring-emerald-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedScenario(scenario.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {scenario.type === 'optimistic' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {scenario.type === 'base' && <Activity className="h-4 w-4 text-blue-500" />}
                      {scenario.type === 'pessimistic' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {scenario.name}
                    </CardTitle>
                    <Badge variant={
                      scenario.type === 'optimistic' ? 'default' :
                      scenario.type === 'base' ? 'secondary' : 'destructive'
                    }>
                      {scenario.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Cash Final</p>
                        <p className="text-lg font-bold">€{scenario.endingCash.toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Cash Mínimo</p>
                        <p className={`text-lg font-bold ${scenario.minCash < 200000 ? 'text-red-600' : ''}`}>
                          €{scenario.minCash.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Runway</span>
                        <span className="font-bold">{scenario.runwayDays} días</span>
                      </div>
                      <Progress 
                        value={(scenario.runwayDays / 365) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Crecimiento Ventas</span>
                        <span className={scenario.parameters.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {scenario.parameters.salesGrowth > 0 ? '+' : ''}{scenario.parameters.salesGrowth}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Días de Cobro</span>
                        <span className={scenario.parameters.collectionDays <= 0 ? 'text-green-600' : 'text-red-600'}>
                          {scenario.parameters.collectionDays > 0 ? '+' : ''}{scenario.parameters.collectionDays}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reducción Costos</span>
                        <span className={scenario.parameters.costReduction >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {scenario.parameters.costReduction > 0 ? '+' : ''}{scenario.parameters.costReduction}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Simulador What-If
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Crecimiento de Ventas</label>
                  <Slider defaultValue={[8]} min={-30} max={50} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-30%</span>
                    <span>+50%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Días de Cobro (DSO)</label>
                  <Slider defaultValue={[45]} min={15} max={90} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15 días</span>
                    <span>90 días</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Variación de Costos</label>
                  <Slider defaultValue={[0]} min={-20} max={30} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-20%</span>
                    <span>+30%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Simulación
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Inflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="h-5 w-5" />
                  Drivers de Entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {drivers.filter(d => d.category === 'inflow').map((driver) => (
                    <div key={driver.id} className="p-3 rounded-lg border bg-green-500/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{driver.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={driver.volatility === 'low' ? 'default' : driver.volatility === 'medium' ? 'secondary' : 'destructive'}>
                            {driver.volatility}
                          </Badge>
                          {driver.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {driver.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {driver.trend === 'stable' && <Activity className="h-4 w-4 text-blue-500" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={driver.impact} className="h-2 flex-1" />
                        <span className="text-sm font-medium text-green-600">+{driver.impact}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Outflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <ArrowDownRight className="h-5 w-5" />
                  Drivers de Salida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {drivers.filter(d => d.category === 'outflow').map((driver) => (
                    <div key={driver.id} className="p-3 rounded-lg border bg-red-500/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{driver.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={driver.volatility === 'low' ? 'default' : driver.volatility === 'medium' ? 'secondary' : 'destructive'}>
                            {driver.volatility}
                          </Badge>
                          {driver.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {driver.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                          {driver.trend === 'stable' && <Activity className="h-4 w-4 text-blue-500" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.abs(driver.impact)} className="h-2 flex-1" />
                        <span className="text-sm font-medium text-red-600">{driver.impact}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas Predictivas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${
                    alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-blue-500/10 border-blue-500/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        alert.type === 'critical' ? 'bg-red-500/20' :
                        alert.type === 'warning' ? 'bg-yellow-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {alert.type === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        {alert.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant="outline">{new Date(alert.date).toLocaleDateString()}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        {alert.amount && (
                          <p className="text-sm font-medium">Importe: €{alert.amount.toLocaleString()}</p>
                        )}
                        {alert.recommendation && (
                          <div className="mt-2 p-2 rounded bg-background/50">
                            <p className="text-xs text-muted-foreground">Recomendación IA:</p>
                            <p className="text-sm">{alert.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Insights Generativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Análisis del Modelo
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    El modelo de IA ha identificado un patrón estacional en los flujos de caja con picos 
                    en Q1 y Q3, y valles en Q2 y Q4. La precisión del modelo en los últimos 6 meses ha 
                    sido del 94.2% dentro del intervalo de confianza del 90%.
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded bg-background/50">
                      <p className="text-lg font-bold">94.2%</p>
                      <p className="text-xs text-muted-foreground">Precisión histórica</p>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <p className="text-lg font-bold">1.2M</p>
                      <p className="text-xs text-muted-foreground">Datapoints analizados</p>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <p className="text-lg font-bold">LSTM</p>
                      <p className="text-xs text-muted-foreground">Arquitectura</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Oportunidades Detectadas
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Acelerar cobros de 3 clientes grandes podría inyectar €85K adicionales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Renegociar términos con proveedores principales (ahorro potencial: €12K/mes)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Ventana óptima para inversión: semanas 15-18</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      Riesgos Identificados
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>Concentración del 35% de ingresos en 2 clientes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>DSO aumentando: de 42 a 48 días en 3 meses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Posible gap de liquidez en semana 12 (escenario pesimista)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Help Button & AI Agent Panel */}
      <VerticalHelpButton verticalType="predictive_cashflow" />
      <VerticalAIAgentPanel verticalType="predictive_cashflow" />
    </div>
  );
}

export default VerticalAccountingPredictiveCashflow;
