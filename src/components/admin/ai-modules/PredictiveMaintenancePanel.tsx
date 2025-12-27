/**
 * Predictive Maintenance Panel
 * 
 * Panel de mantenimiento predictivo IoT:
 * - Monitoreo de dispositivos IoT
 * - Detección de anomalías
 * - Predicción de fallos
 * - Sesiones proactivas
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Gauge,
  RefreshCw,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle,
  Activity,
  Cpu,
  Thermometer,
  Wifi,
  WifiOff,
  Bell,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { usePredictiveMaintenance } from '@/hooks/admin/support/usePredictiveMaintenance';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PredictiveMaintenancePanelProps {
  context: {
    entityId: string;
    systemType?: string;
    customerId?: string;
  } | null;
  className?: string;
}

export function PredictiveMaintenancePanel({ context, className }: PredictiveMaintenancePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    devices,
    anomalies,
    predictions,
    proactiveSessions,
    isLoading,
    error,
    fetchDevices,
    detectAnomalies,
    predictFailures,
  } = usePredictiveMaintenance();

  useEffect(() => {
    if (context?.customerId) {
      fetchDevices(context.customerId);
    }
  }, [context?.customerId, fetchDevices]);

  const handleRefresh = useCallback(async () => {
    if (context?.customerId) {
      await fetchDevices(context.customerId);
      await detectAnomalies();
      await predictFailures();
    }
  }, [context?.customerId, fetchDevices, detectAnomalies, predictFailures]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'maintenance': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-3 w-3" />;
      case 'offline': return <WifiOff className="h-3 w-3" />;
      case 'warning': return <AlertTriangle className="h-3 w-3" />;
      case 'critical': return <AlertTriangle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  // Inactive state
  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Gauge className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Predictive Maintenance inactivo
          </p>
        </CardContent>
      </Card>
    );
  }

  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
  const activePredictions = predictions.filter(p => p.failureProbability > 0.5);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-secondary/10 via-accent/10 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-secondary to-accent">
              <Gauge className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Predictive Maintenance
                <Badge variant="secondary" className="text-xs">Fase 3</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                IoT & Mantenimiento Proactivo
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
        <ScrollArea className={isExpanded ? "h-[calc(100vh-200px)]" : "h-[280px]"}>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <div className="text-xl font-bold">{devices.length}</div>
                <div className="text-xs text-muted-foreground">Dispositivos</div>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10 text-center">
                <div className="text-xl font-bold text-destructive">{criticalAnomalies.length}</div>
                <div className="text-xs text-muted-foreground">Anomalías</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
                <div className="text-xl font-bold text-yellow-600">{activePredictions.length}</div>
                <div className="text-xs text-muted-foreground">Predicciones</div>
              </div>
            </div>

            {/* Devices */}
            {devices.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  Dispositivos Monitoreados
                </span>
                {devices.slice(0, 3).map((device) => (
                  <div key={device.id} className="p-2 rounded-lg border text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{device.name}</span>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(device.status))}>
                        {getStatusIcon(device.status)}
                        <span className="ml-1">{device.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Health:</span>
                      <Progress value={device.healthScore} className="h-1.5 flex-1" />
                      <span>{device.healthScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Anomalies */}
            {anomalies.length > 0 && (
              <div className="pt-4 border-t">
                <span className="text-sm font-medium flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Anomalías Detectadas
                </span>
                <div className="space-y-2">
                  {anomalies.slice(0, 3).map((anomaly) => (
                    <div key={anomaly.id} className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'outline'}>
                          {anomaly.severity}
                        </Badge>
                        <span className="text-muted-foreground">
                          {Math.round(anomaly.confidence * 100)}% confianza
                        </span>
                      </div>
                      <p className="text-muted-foreground">{anomaly.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predictions */}
            {predictions.length > 0 && (
              <div className="pt-4 border-t">
                <span className="text-sm font-medium flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  Predicciones de Fallo
                </span>
                <div className="space-y-2">
                  {predictions.slice(0, 2).map((pred) => (
                    <div key={pred.id} className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pred.componentPredicted}</span>
                        <Badge variant="outline" className="text-yellow-600">
                          {Math.round(pred.failureProbability * 100)}% prob.
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Tiempo estimado: {pred.estimatedTimeToFailure}h
                      </div>
                      {pred.recommendedActions.length > 0 && (
                        <div className="text-primary mt-1">
                          → {pred.recommendedActions[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proactive Sessions */}
            {proactiveSessions.length > 0 && (
              <div className="pt-4 border-t">
                <span className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Sesiones Proactivas
                </span>
                <div className="space-y-1">
                  {proactiveSessions.slice(0, 2).map((session) => (
                    <div key={session.id} className="flex items-center gap-2 p-2 rounded-lg border text-xs">
                      <Badge variant="outline">{session.status}</Badge>
                      <span className="text-muted-foreground">{session.triggerType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {devices.length === 0 && anomalies.length === 0 && predictions.length === 0 && (
              <div className="text-center py-6">
                <Gauge className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">
                  Sin dispositivos monitoreados
                </p>
                <Button size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Buscar Dispositivos
                </Button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {error}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default PredictiveMaintenancePanel;
