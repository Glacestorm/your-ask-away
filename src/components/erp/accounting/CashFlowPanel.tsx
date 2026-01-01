/**
 * CashFlowPanel - Panel de gestión de flujo de caja
 * Fase 3: Cash Flow Management
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Maximize2,
  Minimize2,
  X,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useERPCashFlow, CashFlowAlert, AIInsight } from '@/hooks/erp/useERPCashFlow';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface CashFlowPanelProps {
  className?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CashFlowPanel({ className }: CashFlowPanelProps) {
  const { currentCompany } = useERPContext();
  const currentYear = new Date().getFullYear();
  const {
    isLoading,
    cashFlowItems,
    projections,
    liquidityMetrics,
    alerts,
    summary,
    categoryBreakdown,
    aiInsights,
    error,
    lastRefresh,
    fetchCashFlowData,
    dismissAlert,
  } = useERPCashFlow();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [projectionHorizon, setProjectionHorizon] = useState('90');

  // Contexto para las llamadas
  const context = useMemo(() => {
    if (!currentCompany) return null;
    const today = new Date();
    const startOfYear = new Date(currentYear, 0, 1);
    
    return {
      companyId: currentCompany.id,
      fiscalYear: currentYear,
      startDate: format(startOfYear, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      currency: currentCompany.currency || 'EUR'
    };
  }, [currentCompany, currentFiscalYear]);

  // Cargar datos al montar
  useEffect(() => {
    if (context) {
      fetchCashFlowData(context);
    }
  }, [context, fetchCashFlowData]);

  const handleRefresh = useCallback(async () => {
    if (context) {
      await fetchCashFlowData(context);
      toast.success('Datos de flujo de caja actualizados');
    }
  }, [context, fetchCashFlowData]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [currentCompany?.currency]);

  // Alertas activas (no descartadas)
  const activeAlerts = useMemo(() => 
    alerts.filter(a => !a.is_dismissed), 
    [alerts]
  );

  // Datos para gráficos
  const projectionChartData = useMemo(() => 
    projections.slice(0, parseInt(projectionHorizon)).map((p, idx) => ({
      date: format(addDays(new Date(), idx), 'dd/MM'),
      inflows: p.projected_inflows,
      outflows: p.projected_outflows,
      netFlow: p.net_cash_flow,
      balance: p.cumulative_balance,
      confidence: p.confidence_level
    })),
    [projections, projectionHorizon]
  );

  const categoryChartData = useMemo(() => 
    categoryBreakdown.map(c => ({
      name: c.category,
      value: c.amount,
      type: c.type,
      percentage: c.percentage
    })),
    [categoryBreakdown]
  );

  // Render de alerta individual
  const renderAlert = (alert: CashFlowAlert) => (
    <div
      key={alert.id}
      className={cn(
        "p-3 rounded-lg border flex items-start gap-3 transition-all",
        alert.type === 'critical' && 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
        alert.type === 'warning' && 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        alert.type === 'info' && 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
      )}
    >
      {alert.type === 'critical' && <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
      {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
      {alert.type === 'info' && <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{alert.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => dismissAlert(alert.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {alert.recommendations.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Recomendaciones:</p>
            <ul className="text-xs space-y-0.5 ml-3">
              {alert.recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="list-disc">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // Render de insight de IA
  const renderInsight = (insight: AIInsight) => (
    <div
      key={insight.id}
      className="p-3 rounded-lg border bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          insight.type === 'prediction' && 'bg-blue-100 dark:bg-blue-900/30',
          insight.type === 'recommendation' && 'bg-green-100 dark:bg-green-900/30',
          insight.type === 'warning' && 'bg-amber-100 dark:bg-amber-900/30',
          insight.type === 'opportunity' && 'bg-purple-100 dark:bg-purple-900/30'
        )}>
          {insight.type === 'prediction' && <TrendingUp className="h-4 w-4 text-blue-600" />}
          {insight.type === 'recommendation' && <Zap className="h-4 w-4 text-green-600" />}
          {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {insight.type === 'opportunity' && <Sparkles className="h-4 w-4 text-purple-600" />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{insight.title}</p>
            <Badge variant="outline" className="text-xs">
              {insight.confidence}% confianza
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
          
          {insight.suggested_actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insight.suggested_actions.slice(0, 2).map((action, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!currentCompany) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Seleccione una empresa para ver el flujo de caja</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Cash Flow Management
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {activeAlerts.length} alertas
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Cargando datos...'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Actualizar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-4", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        {isLoading && !liquidityMetrics ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Analizando flujo de caja...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
              Reintentar
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="overview" className="text-xs gap-1">
                <Activity className="h-3 w-3" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="projections" className="text-xs gap-1">
                <TrendingUp className="h-3 w-3" />
                Proyecciones
              </TabsTrigger>
              <TabsTrigger value="liquidity" className="text-xs gap-1">
                <BarChart3 className="h-3 w-3" />
                Liquidez
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs gap-1 relative">
                <AlertTriangle className="h-3 w-3" />
                Alertas
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                    {activeAlerts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                IA
              </TabsTrigger>
            </TabsList>

            {/* Tab: Resumen */}
            <TabsContent value="overview" className="flex-1 mt-0 space-y-4">
              {/* KPIs principales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Efectivo Actual</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(liquidityMetrics?.current_cash || 0)}
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Días de Runway</p>
                      <p className={cn(
                        "text-lg font-bold",
                        (liquidityMetrics?.cash_runway_days || 0) > 90 ? 'text-emerald-600' :
                        (liquidityMetrics?.cash_runway_days || 0) > 30 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {liquidityMetrics?.cash_runway_days || 0} días
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Burn Rate Diario</p>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(liquidityMetrics?.cash_burn_rate || 0)}
                      </p>
                    </div>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Ratio Liquidez</p>
                      <p className={cn(
                        "text-lg font-bold",
                        (liquidityMetrics?.liquidity_ratio || 0) >= 1.5 ? 'text-emerald-600' :
                        (liquidityMetrics?.liquidity_ratio || 0) >= 1 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {(liquidityMetrics?.liquidity_ratio || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Gráfico de flujo de caja */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">Proyección de Flujo de Caja</h3>
                  <Select value={projectionHorizon} onValueChange={setProjectionHorizon}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="60">60 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionChartData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: 'var(--foreground)' }}
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        name="Saldo"
                        stroke="#10b981"
                        fill="url(#colorBalance)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="inflows"
                        name="Entradas"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="outflows"
                        name="Salidas"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Resumen del período */}
              {summary && (
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Cash Flow Operativo</p>
                    <p className={cn(
                      "text-lg font-bold",
                      summary.operating_cash_flow >= 0 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {formatCurrency(summary.operating_cash_flow)}
                    </p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Cash Flow Inversión</p>
                    <p className={cn(
                      "text-lg font-bold",
                      summary.investing_cash_flow >= 0 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {formatCurrency(summary.investing_cash_flow)}
                    </p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Cash Flow Financiación</p>
                    <p className={cn(
                      "text-lg font-bold",
                      summary.financing_cash_flow >= 0 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {formatCurrency(summary.financing_cash_flow)}
                    </p>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Tab: Proyecciones */}
            <TabsContent value="projections" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-medium text-sm mb-4">Proyección Detallada</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectionChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="inflows" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="outflows" name="Salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Tabla de proyecciones */}
                  <Card className="p-4">
                    <h3 className="font-medium text-sm mb-3">Detalle por Período</h3>
                    <div className="space-y-2">
                      {projectionChartData.slice(0, 10).map((p, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium w-12">{p.date}</span>
                            <Badge variant="outline" className="text-xs">
                              {p.confidence}% conf.
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-emerald-600 flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3" />
                              {formatCurrency(p.inflows)}
                            </span>
                            <span className="text-red-600 flex items-center gap-1">
                              <ArrowDownRight className="h-3 w-3" />
                              {formatCurrency(p.outflows)}
                            </span>
                            <span className={cn(
                              "font-medium",
                              p.balance >= 0 ? 'text-foreground' : 'text-red-600'
                            )}>
                              {formatCurrency(p.balance)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab: Liquidez */}
            <TabsContent value="liquidity" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
                <div className="space-y-4">
                  {/* Métricas de liquidez */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Ratio Corriente</p>
                        <Badge variant={
                          (liquidityMetrics?.liquidity_ratio || 0) >= 1.5 ? 'default' :
                          (liquidityMetrics?.liquidity_ratio || 0) >= 1 ? 'secondary' : 'destructive'
                        }>
                          {(liquidityMetrics?.liquidity_ratio || 0) >= 1.5 ? 'Óptimo' :
                           (liquidityMetrics?.liquidity_ratio || 0) >= 1 ? 'Aceptable' : 'Bajo'}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{(liquidityMetrics?.liquidity_ratio || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Meta: &gt; 1.50</p>
                      <Progress 
                        value={Math.min((liquidityMetrics?.liquidity_ratio || 0) / 2 * 100, 100)} 
                        className="h-1.5 mt-2"
                      />
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Ratio Rápido</p>
                        <Badge variant={
                          (liquidityMetrics?.quick_ratio || 0) >= 1 ? 'default' :
                          (liquidityMetrics?.quick_ratio || 0) >= 0.7 ? 'secondary' : 'destructive'
                        }>
                          {(liquidityMetrics?.quick_ratio || 0) >= 1 ? 'Óptimo' :
                           (liquidityMetrics?.quick_ratio || 0) >= 0.7 ? 'Aceptable' : 'Bajo'}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{(liquidityMetrics?.quick_ratio || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Meta: &gt; 1.00</p>
                      <Progress 
                        value={Math.min((liquidityMetrics?.quick_ratio || 0) / 1.5 * 100, 100)} 
                        className="h-1.5 mt-2"
                      />
                    </Card>

                    <Card className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Ciclo Conversión</p>
                        <Badge variant="outline">
                          {(liquidityMetrics?.cash_conversion_cycle || 0)} días
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{liquidityMetrics?.cash_conversion_cycle || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">días promedio</p>
                    </Card>

                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Capital de Trabajo</p>
                      <p className={cn(
                        "text-xl font-bold",
                        (liquidityMetrics?.working_capital || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {formatCurrency(liquidityMetrics?.working_capital || 0)}
                      </p>
                    </Card>

                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Free Cash Flow</p>
                      <p className={cn(
                        "text-xl font-bold",
                        (liquidityMetrics?.free_cash_flow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {formatCurrency(liquidityMetrics?.free_cash_flow || 0)}
                      </p>
                    </Card>

                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Días Efectivo</p>
                      <p className="text-xl font-bold">{liquidityMetrics?.days_cash_available || 0}</p>
                      <p className="text-xs text-muted-foreground">días disponibles</p>
                    </Card>
                  </div>

                  {/* Desglose por categorías */}
                  <Card className="p-4">
                    <h3 className="font-medium text-sm mb-4">Desglose por Categoría</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={categoryChartData.filter(c => c.type === 'inflow')}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoryChartData.filter(c => c.type === 'inflow').map((_, idx) => (
                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                        <p className="text-center text-xs text-muted-foreground">Entradas</p>
                      </div>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={categoryChartData.filter(c => c.type === 'outflow')}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoryChartData.filter(c => c.type === 'outflow').map((_, idx) => (
                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                        <p className="text-center text-xs text-muted-foreground">Salidas</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab: Alertas */}
            <TabsContent value="alerts" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
                <div className="space-y-3">
                  {activeAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                      <p className="text-muted-foreground">No hay alertas activas</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tu flujo de caja está en buen estado
                      </p>
                    </div>
                  ) : (
                    <>
                      {activeAlerts.filter(a => a.type === 'critical').map(renderAlert)}
                      {activeAlerts.filter(a => a.type === 'warning').map(renderAlert)}
                      {activeAlerts.filter(a => a.type === 'info').map(renderAlert)}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab: Insights IA */}
            <TabsContent value="insights" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
                <div className="space-y-3">
                  {aiInsights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Sparkles className="h-12 w-12 text-purple-500 mb-4" />
                      <p className="text-muted-foreground">Generando insights...</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        El análisis de IA estará disponible pronto
                      </p>
                    </div>
                  ) : (
                    aiInsights.map(renderInsight)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default CashFlowPanel;
