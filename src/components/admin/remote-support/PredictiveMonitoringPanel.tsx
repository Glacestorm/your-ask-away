import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Clock,
  Zap,
  Users,
  Target,
  BarChart3,
  LineChart,
  Bell,
  CheckCircle,
  AlertCircle,
  Gauge,
  Minus
} from 'lucide-react';
import { useSupportPredictiveAnalytics } from '@/hooks/admin/support/useSupportPredictiveAnalytics';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PredictiveMonitoringPanelProps {
  className?: string;
}

export function PredictiveMonitoringPanel({ className }: PredictiveMonitoringPanelProps) {
  const [activeTab, setActiveTab] = useState('realtime');

  const {
    isLoading,
    loadPredictions,
    trendInsights,
    anomalies,
    realtimeStatus,
    healthMetrics,
    lastRefresh,
    predictLoad,
    analyzeTrends,
    detectAnomalies,
    getRealtimeStatus,
    getHealthMetrics,
    generateAlerts,
    refreshAll,
    startAutoRefresh,
    stopAutoRefresh
  } = useSupportPredictiveAnalytics();

  useEffect(() => {
    refreshAll();
    startAutoRefresh(60000);
    return () => stopAutoRefresh();
  }, [refreshAll, startAutoRefresh, stopAutoRefresh]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Crítica</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Advertencia</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Info</Badge>;
    }
  };

  const handlePredictLoad = useCallback(() => {
    predictLoad();
  }, [predictLoad]);

  const handleGetRealtimeStatus = useCallback(() => {
    getRealtimeStatus();
  }, [getRealtimeStatus]);

  const handleGenerateAlerts = useCallback(() => {
    generateAlerts();
  }, [generateAlerts]);

  const healthScore = healthMetrics?.healthScore || 0;

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Monitoreo Predictivo
                <Badge variant="outline" className="text-xs">AI</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshAll}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Health Score Overview */}
        {healthMetrics && (
          <div className="mt-3 p-3 rounded-lg border bg-background/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", getHealthBg(healthScore))}>
                  <Gauge className={cn("h-5 w-5", getHealthColor(healthScore))} />
                </div>
                <div>
                  <p className="text-sm font-medium">Salud del Sistema</p>
                  <p className="text-xs text-muted-foreground">
                    {healthMetrics.metrics?.activeSessions || 0} sesiones activas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("text-2xl font-bold", getHealthColor(healthScore))}>
                  {healthScore}%
                </p>
                <Progress 
                  value={healthScore} 
                  className="w-24 h-1.5 mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="realtime" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Tiempo Real
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Predicciones
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Anomalías
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Tendencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {/* Real-time Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-violet-400" />
                      <span className="text-xs text-muted-foreground">Sesiones Activas</span>
                    </div>
                    <p className="text-xl font-bold text-violet-400">
                      {realtimeStatus?.activeSessions || 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-gradient-to-br from-emerald-500/10 to-green-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">Acciones (30 min)</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">
                      {realtimeStatus?.actionsLast30Min || 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-muted-foreground">Duración Promedio</span>
                    </div>
                    <p className="text-xl font-bold text-amber-400">
                      {realtimeStatus?.avgActiveDuration?.toFixed(1) || '0'}m
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-muted-foreground">Alertas Activas</span>
                    </div>
                    <p className="text-xl font-bold text-blue-400">
                      {realtimeStatus?.activeAlerts || 0}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {realtimeStatus && (
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estado del Sistema</span>
                      <Badge className={cn(
                        realtimeStatus.systemHealth === 'healthy' 
                          ? 'bg-green-500/20 text-green-400' 
                          : realtimeStatus.systemHealth === 'warning'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      )}>
                        {realtimeStatus.systemHealth === 'healthy' ? 'Saludable' : 
                         realtimeStatus.systemHealth === 'warning' ? 'Advertencia' : 'Crítico'}
                      </Badge>
                    </div>
                  </div>
                )}

                {!realtimeStatus && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin datos en tiempo real</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleGetRealtimeStatus}>
                      Cargar datos
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="predictions" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {loadPredictions && loadPredictions.length > 0 ? (
                  <>
                    {loadPredictions.map((prediction, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{prediction.period}</span>
                          <Badge variant="outline" className="text-xs">
                            Confianza: {prediction.confidence}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Sesiones esperadas</span>
                          <span className="text-lg font-bold text-indigo-400">
                            {prediction.expectedSessions}
                          </span>
                        </div>
                        {prediction.peakHours && prediction.peakHours.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Horas pico:</p>
                            <div className="flex flex-wrap gap-1">
                              {prediction.peakHours.map((hour, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">
                                  {hour}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {prediction.reasoning}
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin predicciones disponibles</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handlePredictLoad}>
                      Generar predicción
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="anomalies" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {anomalies && anomalies.length > 0 ? (
                  anomalies.map((anomaly) => (
                    <div 
                      key={anomaly.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className={cn(
                            "h-4 w-4",
                            anomaly.severity === 'critical' ? 'text-red-400' :
                            anomaly.severity === 'warning' ? 'text-orange-400' :
                            'text-yellow-400'
                          )} />
                          <div>
                            <p className="font-medium text-sm">{anomaly.metric}</p>
                            <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                          </div>
                        </div>
                        {getSeverityBadge(anomaly.severity)}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Valor: {anomaly.value}</span>
                        <span>Esperado: {anomaly.expectedValue}</span>
                        <span>Desviación: {anomaly.deviation.toFixed(1)}%</span>
                      </div>
                      {anomaly.recommendedActions && anomaly.recommendedActions.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-muted/50">
                          <p className="text-xs font-medium mb-1">Acciones recomendadas:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {anomaly.recommendedActions.slice(0, 2).map((action, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-400 opacity-50" />
                    <p className="text-sm">No se detectaron anomalías</p>
                    <p className="text-xs">El sistema opera dentro de parámetros normales</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trends" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {trendInsights && trendInsights.length > 0 ? (
                  trendInsights.map((trend, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {trend.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : trend.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{trend.metric}</p>
                            <p className="text-xs text-muted-foreground">{trend.insight}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-sm font-bold",
                            trend.trend === 'up' ? 'text-green-400' : 
                            trend.trend === 'down' ? 'text-red-400' : 
                            'text-muted-foreground'
                          )}>
                            {trend.trend === 'up' ? '+' : trend.trend === 'down' ? '-' : ''}
                            {Math.abs(trend.changePercent)}%
                          </span>
                          <Badge variant="outline" className="text-[10px] ml-2">
                            {trend.significance === 'high' ? 'Alta' : 
                             trend.significance === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin tendencias detectadas</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => analyzeTrends()}>
                      Analizar tendencias
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PredictiveMonitoringPanel;
