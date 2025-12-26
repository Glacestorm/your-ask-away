import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Thermometer,
  HardDrive,
  Wifi,
  Bell,
  RefreshCw,
  TrendingUp,
  Clock,
  Wrench,
  Zap,
  Shield
} from 'lucide-react';
import { usePredictiveMaintenance } from '@/hooks/admin/support/usePredictiveMaintenance';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PredictiveMaintenancePanelProps {
  deviceId?: string;
  customerId?: string;
  className?: string;
}

export function PredictiveMaintenancePanel({ deviceId, customerId, className }: PredictiveMaintenancePanelProps) {
  const [activeTab, setActiveTab] = useState('telemetry');

  const {
    isLoading,
    devices,
    anomalies,
    predictions,
    proactiveSessions,
    fetchDevices,
    runDiagnostics,
    createProactiveSession
  } = usePredictiveMaintenance();

  useEffect(() => {
    fetchDevices(customerId);
  }, [fetchDevices, customerId]);

  const handleRefresh = useCallback(async () => {
    if (deviceId) {
      await runDiagnostics(deviceId);
    } else {
      await fetchDevices(customerId);
    }
  }, [deviceId, customerId, runDiagnostics, fetchDevices]);

  const handleCreateProactiveSession = useCallback(async (predictionId: string) => {
    const prediction = predictions.find(p => p.id === predictionId);
    if (prediction) {
      await createProactiveSession(
        prediction.deviceId,
        customerId || 'demo-customer',
        prediction.predictedIssue,
        prediction.estimatedTimeToFailure,
        prediction.severity,
        prediction.recommendedActions
      );
    }
  }, [createProactiveSession, customerId, predictions]);

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-400';
    if (health >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medio</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Bajo</Badge>;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Mantenimiento Predictivo
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-xs">
                  IoT + AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Telemetría, detección de anomalías y soporte proactivo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <Cpu className="h-4 w-4 mx-auto text-emerald-400" />
            <p className="text-lg font-bold">{devices.length}</p>
            <p className="text-xs text-muted-foreground">Dispositivos</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <AlertTriangle className="h-4 w-4 mx-auto text-amber-400" />
            <p className="text-lg font-bold">{anomalies.length}</p>
            <p className="text-xs text-muted-foreground">Anomalías</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-cyan-400" />
            <p className="text-lg font-bold">{predictions.length}</p>
            <p className="text-xs text-muted-foreground">Predicciones</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <Bell className="h-4 w-4 mx-auto text-violet-400" />
            <p className="text-lg font-bold">{proactiveSessions.length}</p>
            <p className="text-xs text-muted-foreground">Sesiones</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="telemetry" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Telemetría
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Anomalías
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Predicciones
            </TabsTrigger>
            <TabsTrigger value="proactive" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              Proactivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="telemetry" className="space-y-4">
            {/* Devices List */}
            <ScrollArea className="h-[300px]">
              {devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay dispositivos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div key={device.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            device.status === 'online' ? 'bg-green-500/20' : 'bg-gray-500/20'
                          )}>
                            <Cpu className={cn(
                              "h-4 w-4",
                              device.status === 'online' ? 'text-green-400' : 'text-gray-400'
                            )} />
                          </div>
                          <div>
                            <span className="font-medium text-sm">{device.name}</span>
                            <p className="text-xs text-muted-foreground">{device.deviceType}</p>
                          </div>
                        </div>
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status}
                        </Badge>
                      </div>

                      {/* Health Score */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Salud del dispositivo</span>
                          <span className={getHealthColor(device.healthScore || 0)}>
                            {device.healthScore || 0}%
                          </span>
                        </div>
                        <Progress value={device.healthScore || 0} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-3">
            <ScrollArea className="h-[300px]">
              {anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400 opacity-50" />
                  <p className="text-sm">No se han detectado anomalías</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {anomalies.map((anomaly, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={cn(
                            "h-4 w-4",
                            anomaly.severity === 'critical' ? 'text-red-400' :
                            anomaly.severity === 'high' ? 'text-orange-400' :
                            'text-yellow-400'
                          )} />
                          <span className="font-medium text-sm">{anomaly.type}</span>
                        </div>
                        {getSeverityBadge(anomaly.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-muted-foreground">
                          Dispositivo: {anomaly.deviceId}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(anomaly.detectedAt), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-3">
            <ScrollArea className="h-[300px]">
              {predictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay predicciones de fallo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {predictions.map((prediction, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-amber-400" />
                            <span className="font-medium text-sm">{prediction.predictedIssue}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{prediction.deviceId}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(prediction.confidence * 100)}% confianza
                        </Badge>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/30 mb-3">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Probabilidad de fallo</span>
                          <span className={cn(
                            "font-bold",
                            prediction.confidence >= 0.7 ? 'text-red-400' :
                            prediction.confidence >= 0.4 ? 'text-yellow-400' :
                            'text-green-400'
                          )}>
                            {Math.round(prediction.confidence * 100)}%
                          </span>
                        </div>
                        <Progress value={prediction.confidence * 100} className="h-2 mb-2" />
                        <div className="text-xs text-muted-foreground">
                          <span>Tiempo estimado: {prediction.estimatedTimeToFailure}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {prediction.recommendedActions?.[0] || 'Sin acción recomendada'}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => handleCreateProactiveSession(prediction.id)}
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Crear Sesión
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="proactive" className="space-y-3">
            <ScrollArea className="h-[300px]">
              {proactiveSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay sesiones proactivas programadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proactiveSessions.map((session, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            session.status === 'scheduled' ? 'bg-blue-500/20' :
                            session.status === 'in_progress' ? 'bg-amber-500/20' :
                            'bg-green-500/20'
                          )}>
                            <Shield className={cn(
                              "h-4 w-4",
                              session.status === 'scheduled' ? 'text-blue-400' :
                              session.status === 'in_progress' ? 'text-amber-400' :
                              'text-green-400'
                            )} />
                          </div>
                          <div>
                            <span className="font-medium text-sm">{session.title}</span>
                            <p className="text-xs text-muted-foreground">{session.customerName}</p>
                          </div>
                        </div>
                        <Badge variant={
                          session.status === 'scheduled' ? 'secondary' :
                          session.status === 'in_progress' ? 'default' :
                          'outline'
                        }>
                          {session.status === 'scheduled' ? 'Programada' :
                           session.status === 'in_progress' ? 'En curso' :
                           'Completada'}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">{session.reason}</p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {format(new Date(session.scheduledFor), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                        </span>
                        {session.status === 'scheduled' && (
                          <Button size="sm" variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Reprogramar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PredictiveMaintenancePanel;
