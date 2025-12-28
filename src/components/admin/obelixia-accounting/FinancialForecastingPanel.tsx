/**
 * Financial Forecasting Panel
 * Panel UI para Análisis Predictivo y Pronóstico Financiero
 * Fase 4: Predictive Analytics & Financial Forecasting
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  Target,
  Lightbulb,
  RefreshCw,
  BarChart3,
  LineChart,
  PieChart,
  Sparkles,
  Bell,
  CheckCircle,
  XCircle,
  Plus,
  Play,
  Trash2,
  Settings,
  Eye,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  useObelixiaFinancialForecasting, 
  CashFlowForecast, 
  RevenuePrediction,
  ExpensePrediction,
  TrendAnalysis,
  FinancialAnomaly,
  WhatIfScenario,
  PredictiveAlert,
  ForecastPeriod,
  TrendDirection
} from '@/hooks/admin/obelixia-accounting/useObelixiaFinancialForecasting';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function FinancialForecastingPanel() {
  const [activeTab, setActiveTab] = useState('cashflow');
  const [selectedPeriod, setSelectedPeriod] = useState<ForecastPeriod>('monthly');
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  const {
    isLoading,
    config,
    cashFlowForecasts,
    revenuePredictions,
    expensePredictions,
    trendAnalyses,
    anomalies,
    scenarios,
    alerts,
    metrics,
    updateConfig,
    generateCashFlowForecast,
    predictRevenue,
    predictExpenses,
    generateFullForecast,
    analyzeTrends,
    detectAnomalies,
    resolveAnomaly,
    createScenario,
    runScenario,
    deleteScenario,
    acknowledgeAlert,
    fetchMetrics
  } = useObelixiaFinancialForecasting();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleGenerateForecast = async () => {
    await generateFullForecast();
  };

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'volatile': return <Activity className="h-4 w-4 text-amber-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const pendingAlerts = alerts.filter(a => !a.isAcknowledged);
  const unresolvedAnomalies = anomalies.filter(a => !a.isResolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <LineChart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Análisis Predictivo
              {metrics && (
                <Badge variant="outline" className="ml-2">
                  {metrics.accuracy}% precisión
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              Pronósticos financieros con IA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as ForecastPeriod)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateForecast} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generar Análisis
          </Button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Flujo Proyectado</span>
            </div>
            <p className="text-2xl font-bold">
              {cashFlowForecasts.length > 0 
                ? formatCurrency(cashFlowForecasts[0]?.projectedNetCashFlow || 0)
                : '—'
              }
            </p>
            {cashFlowForecasts[0] && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                {getTrendIcon(cashFlowForecasts[0].trend)}
                <span className={cn(
                  cashFlowForecasts[0].trend === 'up' ? 'text-emerald-600' :
                  cashFlowForecasts[0].trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {cashFlowForecasts[0].confidenceLevel}% confianza
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Ingresos Pred.</span>
            </div>
            <p className="text-2xl font-bold">
              {revenuePredictions.length > 0 
                ? formatCurrency(revenuePredictions.reduce((sum, r) => sum + r.predictedValue, 0))
                : '—'
              }
            </p>
            {revenuePredictions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {revenuePredictions.length} categorías analizadas
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Anomalías</span>
            </div>
            <p className="text-2xl font-bold">{unresolvedAnomalies.length}</p>
            <p className="text-xs text-muted-foreground mt-1">sin resolver</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-violet-500" />
              <span className="text-sm text-muted-foreground">Alertas</span>
            </div>
            <p className="text-2xl font-bold">{pendingAlerts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="cashflow" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Flujo Caja</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Ingresos</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4" />
            <span className="hidden sm:inline">Gastos</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Tendencias</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Escenarios</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
            {pendingAlerts.length > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                {pendingAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pronóstico de Flujo de Caja</CardTitle>
              <CardDescription>Proyecciones basadas en patrones históricos y tendencias</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowForecasts.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {cashFlowForecasts.map((forecast, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(forecast.periodStart), 'MMM yyyy', { locale: es })}
                            </span>
                            {getTrendIcon(forecast.trend)}
                          </div>
                          <Badge variant="outline">{forecast.confidenceLevel}% conf.</Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Ingresos</p>
                            <p className="font-semibold text-emerald-600">
                              {formatCurrency(forecast.projectedIncome)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Gastos</p>
                            <p className="font-semibold text-red-600">
                              {formatCurrency(forecast.projectedExpenses)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Flujo Neto</p>
                            <p className={cn(
                              "font-semibold",
                              forecast.projectedNetCashFlow >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {formatCurrency(forecast.projectedNetCashFlow)}
                            </p>
                          </div>
                        </div>

                        {forecast.factors.length > 0 && (
                          <div className="pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Factores clave:</p>
                            <div className="flex flex-wrap gap-2">
                              {forecast.factors.map((factor, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {factor.name}: {factor.impact > 0 ? '+' : ''}{factor.impact}%
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Sin pronósticos generados</p>
                  <p className="text-sm">Haz clic en "Generar Análisis" para comenzar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Predicción de Ingresos</CardTitle>
              <CardDescription>Proyecciones por categoría de ingreso</CardDescription>
            </CardHeader>
            <CardContent>
              {revenuePredictions.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {revenuePredictions.map((prediction, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{prediction.category}</span>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(prediction.trend)}
                            <Badge variant="outline">{prediction.confidence}%</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="font-semibold">{formatCurrency(prediction.currentValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Proyectado</p>
                            <p className="font-semibold">{formatCurrency(prediction.predictedValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cambio</p>
                            <p className={cn(
                              "font-semibold",
                              prediction.changePercent >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {prediction.changePercent >= 0 ? '+' : ''}{prediction.changePercent}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Sin predicciones de ingresos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Predicción de Gastos</CardTitle>
              <CardDescription>Proyecciones por categoría de gasto</CardDescription>
            </CardHeader>
            <CardContent>
              {expensePredictions.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {expensePredictions.map((prediction, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{prediction.category}</span>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(prediction.trend)}
                            <Badge variant="outline">{prediction.confidence}%</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="font-semibold">{formatCurrency(prediction.currentValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Proyectado</p>
                            <p className="font-semibold">{formatCurrency(prediction.predictedValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Recurrente</p>
                            <p className="text-sm">{formatCurrency(prediction.recurringAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Variable</p>
                            <p className="text-sm">{formatCurrency(prediction.variableAmount)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowDownRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Sin predicciones de gastos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Análisis de Tendencias</CardTitle>
                  <CardDescription>Patrones y direcciones identificados</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => analyzeTrends()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trendAnalyses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendAnalyses.map((trend, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium capitalize">{trend.metric}</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(trend.direction)}
                          <span className="text-sm text-muted-foreground">
                            Fuerza: {trend.strength}%
                          </span>
                        </div>
                      </div>
                      <Progress value={trend.strength} className="mb-3" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Velocidad</p>
                          <p className={trend.velocity >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {trend.velocity >= 0 ? '+' : ''}{trend.velocity}%/mes
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Cambio Proy.</p>
                          <p>{trend.projectedChange >= 0 ? '+' : ''}{trend.projectedChange}%</p>
                        </div>
                      </div>
                      {trend.seasonality && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Estacionalidad:</p>
                          <p className="text-sm">
                            Picos: {trend.seasonality.peakPeriods.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Sin análisis de tendencias</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anomalies Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Anomalías Detectadas</CardTitle>
                  <CardDescription>Patrones inusuales identificados</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => detectAnomalies()}>
                  <Eye className="h-4 w-4 mr-2" />
                  Escanear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {anomalies.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {anomalies.map((anomaly) => (
                      <div 
                        key={anomaly.id} 
                        className={cn(
                          "p-3 rounded-lg border flex items-center justify-between",
                          anomaly.isResolved ? "opacity-50" : ""
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={cn(
                            "h-4 w-4",
                            anomaly.severity === 'critical' ? "text-red-500" :
                            anomaly.severity === 'high' ? "text-orange-500" :
                            "text-amber-500"
                          )} />
                          <div>
                            <p className="text-sm font-medium">{anomaly.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {anomaly.affectedAccount} • Desviación: {anomaly.deviation}%
                            </p>
                          </div>
                        </div>
                        {!anomaly.isResolved && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => resolveAnomaly(anomaly.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                  <p className="text-sm">No hay anomalías detectadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Escenarios What-If</CardTitle>
                  <CardDescription>Simula diferentes escenarios financieros</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowNewScenario(!showNewScenario)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Nuevo Escenario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showNewScenario && (
                <div className="p-4 mb-4 rounded-lg border bg-muted/30 space-y-3">
                  <div>
                    <Label htmlFor="scenarioName">Nombre del escenario</Label>
                    <Input 
                      id="scenarioName"
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      placeholder="Ej: Expansión Q2 2025"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={async () => {
                        if (newScenarioName) {
                          await createScenario(newScenarioName, 'realistic', []);
                          setNewScenarioName('');
                          setShowNewScenario(false);
                        }
                      }}
                    >
                      Crear
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewScenario(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {scenarios.length > 0 ? (
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <div key={scenario.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{scenario.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Tipo: {scenario.type} • Creado: {format(new Date(scenario.createdAt), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => runScenario(scenario.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Ejecutar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteScenario(scenario.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      
                      {scenario.results && (
                        <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Ingresos Proy.</p>
                            <p className="font-semibold text-emerald-600">
                              {formatCurrency(scenario.results.projectedRevenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Gastos Proy.</p>
                            <p className="font-semibold text-red-600">
                              {formatCurrency(scenario.results.projectedExpenses)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Beneficio</p>
                            <p className="font-semibold">
                              {formatCurrency(scenario.results.projectedProfit)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Riesgo</p>
                            <Badge variant={
                              scenario.results.riskLevel === 'high' ? 'destructive' :
                              scenario.results.riskLevel === 'medium' ? 'secondary' : 'outline'
                            }>
                              {scenario.results.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No hay escenarios creados</p>
                  <p className="text-sm">Crea un escenario para simular diferentes situaciones</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alertas Predictivas</CardTitle>
              <CardDescription>Situaciones que requieren atención anticipada</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={cn(
                          "p-4 rounded-lg border",
                          alert.isAcknowledged ? "opacity-50 bg-muted/30" : "bg-card"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              alert.severity === 'critical' ? "bg-red-100 dark:bg-red-950" :
                              alert.severity === 'high' ? "bg-orange-100 dark:bg-orange-950" :
                              alert.severity === 'medium' ? "bg-amber-100 dark:bg-amber-950" :
                              "bg-blue-100 dark:bg-blue-950"
                            )}>
                              {alert.type === 'opportunity' ? (
                                <Lightbulb className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <AlertTriangle className={cn(
                                  "h-4 w-4",
                                  alert.severity === 'critical' ? "text-red-600" :
                                  alert.severity === 'high' ? "text-orange-600" :
                                  "text-amber-600"
                                )} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{alert.title}</p>
                                <Badge variant={getSeverityColor(alert.severity) as 'destructive' | 'secondary' | 'outline'}>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Probabilidad: {alert.probability}%</span>
                                <span>Impacto: {formatCurrency(alert.potentialImpact)}</span>
                                <span>Fecha prev.: {format(new Date(alert.predictedDate), 'dd MMM', { locale: es })}</span>
                              </div>
                              {alert.suggestedActions.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs font-medium mb-1">Acciones sugeridas:</p>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                                    {alert.suggestedActions.map((action, i) => (
                                      <li key={i}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          {!alert.isAcknowledged && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceptar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No hay alertas activas</p>
                  <p className="text-sm">El sistema monitorea constantemente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FinancialForecastingPanel;
