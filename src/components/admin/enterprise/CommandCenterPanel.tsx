/**
 * CommandCenterPanel
 * Centro de Comando Ejecutivo - Vista unificada tipo "Mission Control"
 * Fase 11 - Enterprise SaaS 2025-2026
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
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Bell,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  AlertOctagon,
  ArrowUp
} from 'lucide-react';
import { useCommandCenter, type CommandCenterContext } from '@/hooks/admin/useCommandCenter';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommandCenterPanelProps {
  context?: CommandCenterContext;
  className?: string;
}

export function CommandCenterPanel({ 
  context = { organizationId: 'default', includeMetrics: true, includeAlerts: true },
  className 
}: CommandCenterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    isLoading,
    metrics,
    alerts,
    systemHealth,
    liveActivity,
    error,
    lastRefresh,
    getDashboardData,
    acknowledgeAlert,
    escalateAlert,
    startAutoRefresh,
    stopAutoRefresh
  } = useCommandCenter();

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    startAutoRefresh(context, 30000);
    return () => stopAutoRefresh();
  }, [context.organizationId]);

  const handleRefresh = useCallback(async () => {
    await getDashboardData(context);
  }, [context, getDashboardData]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'critical': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Crítico</Badge>;
      case 'high': return <Badge className="bg-orange-500 text-white">Alto</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 text-black">Medio</Badge>;
      default: return <Badge variant="secondary">Bajo</Badge>;
    }
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Command Center
                {systemHealth && (
                  <div className={cn("h-2 w-2 rounded-full animate-pulse", getHealthBg(systemHealth.overall >= 80 ? 'healthy' : systemHealth.overall >= 50 ? 'degraded' : 'critical'))} />
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
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse mr-2">
                <Bell className="h-3 w-3 mr-1" />
                {activeAlerts.length}
              </Badge>
            )}
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
        {error ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-3">
              <TabsTrigger value="overview" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">Métricas</TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">
                Alertas
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                    {activeAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">Actividad</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                <div className="space-y-4">
                  {/* System Health */}
                  {systemHealth && (
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Salud del Sistema</span>
                        <Badge className={cn(
                          systemHealth.overall >= 80 ? 'bg-green-500' :
                          systemHealth.overall >= 50 ? 'bg-yellow-500' : 'bg-destructive'
                        )}>
                          {systemHealth.overall >= 80 ? 'Saludable' :
                           systemHealth.overall >= 50 ? 'Degradado' : 'Crítico'}
                        </Badge>
                      </div>
                      <Progress value={systemHealth.overall} className="h-2 mb-4" />
                      
                      {/* Components Health */}
                      <div className="grid grid-cols-2 gap-2">
                        {systemHealth.components?.slice(0, 4).map((comp) => (
                          <div key={comp.name} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                            <div className={cn("h-2 w-2 rounded-full", getHealthBg(comp.status))} />
                            <span className="text-xs">{comp.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    {metrics.slice(0, 4).map((metric) => (
                      <div key={metric.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-1">
                          {metric.id.includes('cpu') ? <Cpu className="h-4 w-4 text-muted-foreground" /> :
                           metric.id.includes('memory') ? <HardDrive className="h-4 w-4 text-muted-foreground" /> :
                           metric.id.includes('latency') ? <Wifi className="h-4 w-4 text-muted-foreground" /> :
                           <Activity className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground">{metric.name}</span>
                        </div>
                        <p className="text-xl font-bold">{metric.value}{metric.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="metrics" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                <div className="space-y-2">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="text-lg font-bold">{metric.value}{metric.unit}</span>
                      </div>
                      {metric.status && (
                        <Progress 
                          value={metric.status === 'healthy' ? 100 : metric.status === 'warning' ? 60 : 30} 
                          className="h-1.5"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                    <p className="text-sm">Sin alertas activas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={cn(
                        "p-3 rounded-lg border bg-card transition-colors",
                        !alert.acknowledged && alert.severity === 'critical' && "border-destructive/50 animate-pulse"
                      )}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {alert.severity === 'critical' ? 
                              <AlertOctagon className="h-4 w-4 text-destructive" /> :
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            }
                            <span className="text-sm font-medium">{alert.title}</span>
                          </div>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                        {!alert.acknowledged && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="h-7 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Reconocer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => escalateAlert(alert.id)}
                              className="h-7 text-xs"
                            >
                              <ArrowUp className="h-3 w-3 mr-1" />
                              Escalar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {liveActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Clock className="h-8 w-8 mb-2" />
                    <p className="text-sm">Sin actividad reciente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.action} - {activity.target}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default CommandCenterPanel;
