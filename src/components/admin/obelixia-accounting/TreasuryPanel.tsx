/**
 * TreasuryPanel - Fase 8: Intelligent Cash Flow Management & Treasury
 * Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2,
  Bell,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { useObelixiaTreasury, TreasuryContext } from '@/hooks/admin/obelixia-accounting/useObelixiaTreasury';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TreasuryPanelProps {
  context?: TreasuryContext | null;
  className?: string;
}

export function TreasuryPanel({ context, className }: TreasuryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('forecast');

  const {
    isLoading,
    forecasts,
    liquidityPositions,
    paymentOptimizations,
    alerts,
    workingCapital,
    lastRefresh,
    refreshAll,
    resolveAlert,
    simulateScenario,
    startAutoRefresh,
    stopAutoRefresh
  } = useObelixiaTreasury();

  useEffect(() => {
    if (context) {
      startAutoRefresh(context, 120000);
    }
    return () => stopAutoRefresh();
  }, [context, startAutoRefresh, stopAutoRefresh]);

  const handleRefresh = useCallback(() => {
    refreshAll(context || undefined);
  }, [refreshAll, context]);

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const unresolvedAlerts = alerts.filter(a => !a.isResolved);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Tesorería Inteligente
                {unresolvedAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unresolvedAlerts.length} alertas
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 mb-3">
            <TabsTrigger value="forecast" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              Flujo
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="text-xs gap-1">
              <PiggyBank className="h-3 w-3" />
              Liquidez
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs gap-1">
              <CreditCard className="h-3 w-3" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs gap-1 relative">
              <Bell className="h-3 w-3" />
              Alertas
              {unresolvedAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-destructive-foreground">
                  {unresolvedAlerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="working-capital" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              Capital
            </TabsTrigger>
          </TabsList>

          {/* Cash Flow Forecast Tab */}
          <TabsContent value="forecast" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-3">
                {forecasts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cargando proyección de flujo de caja...</p>
                  </div>
                ) : (
                  forecasts.map((forecast) => (
                    <div 
                      key={forecast.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{forecast.periodLabel}</span>
                        <Badge 
                          variant={forecast.riskLevel === 'low' ? 'default' : forecast.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          Riesgo {forecast.riskLevel === 'low' ? 'Bajo' : forecast.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">Entradas:</span>
                          <span className="text-green-600 font-medium">{formatCurrency(forecast.expectedInflows)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                          <span className="text-muted-foreground">Salidas:</span>
                          <span className="text-red-600 font-medium">{formatCurrency(forecast.expectedOutflows)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Neto:</span>
                          <span className={cn("font-medium", forecast.netCashFlow >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(forecast.netCashFlow)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Saldo proyectado: {formatCurrency(forecast.closingBalance)}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Confianza:</span>
                          <Progress value={forecast.confidence} className="w-16 h-1.5" />
                          <span className="font-medium">{forecast.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Liquidity Positions Tab */}
          <TabsContent value="liquidity" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-3">
                {liquidityPositions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PiggyBank className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cargando posiciones de liquidez...</p>
                  </div>
                ) : (
                  liquidityPositions.map((position) => (
                    <div 
                      key={position.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {position.accountType === 'bank' && <PiggyBank className="h-4 w-4 text-blue-500" />}
                          {position.accountType === 'cash' && <DollarSign className="h-4 w-4 text-green-500" />}
                          {position.accountType === 'investment' && <TrendingUp className="h-4 w-4 text-purple-500" />}
                          {position.accountType === 'credit_line' && <CreditCard className="h-4 w-4 text-orange-500" />}
                          <span className="font-medium text-sm">{position.accountName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {position.currency}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold">{formatCurrency(position.currentBalance, position.currency)}</p>
                          <p className="text-xs text-muted-foreground">
                            Disponible: {formatCurrency(position.availableBalance, position.currency)}
                          </p>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-sm",
                          position.trend === 'up' ? 'text-green-600' : position.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                        )}>
                          {position.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                          {position.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                          {position.trend !== 'stable' && (
                            <span>{position.trendPercentage > 0 ? '+' : ''}{position.trendPercentage}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Payment Optimizations Tab */}
          <TabsContent value="payments" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-3">
                {paymentOptimizations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cargando optimizaciones de pago...</p>
                  </div>
                ) : (
                  paymentOptimizations.map((optimization) => (
                    <div 
                      key={optimization.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{optimization.vendorName}</span>
                        <Badge 
                          variant={optimization.priority === 'critical' ? 'destructive' : optimization.priority === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {optimization.priority === 'critical' ? 'Crítico' : optimization.priority === 'high' ? 'Alto' : optimization.priority === 'medium' ? 'Medio' : 'Bajo'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-muted-foreground">Factura:</span>
                          <span className="ml-1 font-medium">{optimization.invoiceRef}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Importe:</span>
                          <span className="ml-1 font-bold">{formatCurrency(optimization.amount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vencimiento:</span>
                          <span className="ml-1">{new Date(optimization.dueDate).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Descuento:</span>
                          <span className="ml-1 text-green-600 font-medium">{optimization.discountAvailable}%</span>
                        </div>
                      </div>

                      {optimization.savingsIfOptimized > 0 && (
                        <div className="flex items-center justify-between p-2 bg-green-500/10 rounded text-xs">
                          <span>Ahorro potencial:</span>
                          <span className="text-green-600 font-bold">{formatCurrency(optimization.savingsIfOptimized)}</span>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {optimization.reasoning}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
                    <p className="text-sm">No hay alertas pendientes</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        alert.isResolved ? "bg-muted/30 opacity-60" : "bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {alert.severity === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {alert.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {alert.severity === 'info' && <Bell className="h-4 w-4 text-blue-500" />}
                          <span className="font-medium text-sm">{alert.title}</span>
                        </div>
                        {!alert.isResolved && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolver
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                      
                      {alert.projectedImpact !== 0 && (
                        <div className={cn(
                          "text-xs font-medium mb-2",
                          alert.projectedImpact < 0 ? "text-red-600" : "text-green-600"
                        )}>
                          Impacto: {formatCurrency(alert.projectedImpact)}
                        </div>
                      )}

                      {alert.suggestedActions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Acciones sugeridas:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {alert.suggestedActions.map((action, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <span className="text-primary">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Working Capital Tab */}
          <TabsContent value="working-capital" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              {!workingCapital ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cargando métricas de capital de trabajo...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Main Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Ratio Corriente</p>
                      <p className="text-xl font-bold">{workingCapital.currentRatio.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Ratio Rápido</p>
                      <p className="text-xl font-bold">{workingCapital.quickRatio.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Capital de Trabajo</p>
                      <p className="text-xl font-bold">{formatCurrency(workingCapital.workingCapital)}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Ciclo de Conversión</p>
                      <p className="text-xl font-bold">{workingCapital.cashConversionCycle} días</p>
                    </div>
                  </div>

                  {/* Cash Conversion Cycle Breakdown */}
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-sm font-medium mb-2">Ciclo de Conversión de Efectivo</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Días Cobro</p>
                        <p className="font-bold text-blue-600">{workingCapital.daysReceivable} días</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Días Inventario</p>
                        <p className="font-bold text-purple-600">{workingCapital.daysInventory} días</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Días Pago</p>
                        <p className="font-bold text-green-600">{workingCapital.daysPayable} días</p>
                      </div>
                    </div>
                  </div>

                  {/* Trend */}
                  <div className={cn(
                    "p-3 rounded-lg border flex items-center justify-between",
                    workingCapital.workingCapitalTrend === 'improving' ? 'bg-green-500/10' : 
                    workingCapital.workingCapitalTrend === 'deteriorating' ? 'bg-red-500/10' : 'bg-muted/50'
                  )}>
                    <div className="flex items-center gap-2">
                      {workingCapital.workingCapitalTrend === 'improving' && <TrendingUp className="h-5 w-5 text-green-600" />}
                      {workingCapital.workingCapitalTrend === 'deteriorating' && <TrendingDown className="h-5 w-5 text-red-600" />}
                      <span className="text-sm font-medium">
                        Tendencia: {workingCapital.workingCapitalTrend === 'improving' ? 'Mejorando' : 
                                    workingCapital.workingCapitalTrend === 'deteriorating' ? 'Deteriorando' : 'Estable'}
                      </span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {workingCapital.recommendations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-sm font-medium mb-2">Recomendaciones IA</p>
                      <ul className="space-y-2">
                        {workingCapital.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <Zap className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default TreasuryPanel;
