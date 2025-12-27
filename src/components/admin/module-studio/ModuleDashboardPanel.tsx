import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Activity, 
  Layers, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  MoreVertical,
  Play,
  Square,
  RotateCcw,
  ArrowUpCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useModuleDashboard, ModuleStatus } from '@/hooks/admin/useModuleDashboard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleDashboardPanelProps {
  className?: string;
}

export function ModuleDashboardPanel({ className }: ModuleDashboardPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    isLoading,
    modules,
    metrics,
    alerts,
    lastRefresh,
    fetchDashboardData,
    acknowledgeAlert,
    triggerModuleAction,
    startAutoRefresh,
    stopAutoRefresh
  } = useModuleDashboard();

  useEffect(() => {
    startAutoRefresh(30000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  const getStatusColor = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-muted';
      case 'error': return 'bg-destructive';
      case 'updating': return 'bg-yellow-500';
      case 'deploying': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-500';
    if (health >= 70) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Dashboard de Módulos</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Métricas principales */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalModules}</p>
              <p className="text-xs text-green-500">{metrics.activeModules} activos</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Salud</span>
              </div>
              <p className="text-2xl font-bold">{metrics.avgHealth}%</p>
              <Progress value={metrics.avgHealth} className="h-1 mt-1" />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Usuarios</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalUsers}</p>
              <p className="text-xs text-muted-foreground">activos ahora</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Respuesta</span>
              </div>
              <p className="text-2xl font-bold">{metrics.avgResponseTime}ms</p>
              <p className="text-xs text-muted-foreground">promedio</p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="overview" className="text-xs">Módulos</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs relative">
              Alertas
              {alerts.filter(a => !a.acknowledged).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                  {alerts.filter(a => !a.acknowledged).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {modules.map((module) => (
                  <div 
                    key={module.moduleKey}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-2 w-2 rounded-full", getStatusColor(module.status))} />
                        <div>
                          <p className="font-medium text-sm">{module.moduleName}</p>
                          <p className="text-xs text-muted-foreground">v{module.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", getHealthColor(module.health))}>
                          {module.health}%
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => triggerModuleAction(module.moduleKey, 'restart')}>
                              <Play className="h-4 w-4 mr-2" />
                              Reiniciar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => triggerModuleAction(module.moduleKey, 'stop')}>
                              <Square className="h-4 w-4 mr-2" />
                              Detener
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => triggerModuleAction(module.moduleKey, 'update')}>
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Actualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => triggerModuleAction(module.moduleKey, 'rollback')}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Rollback
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {module.activeUsers} usuarios
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {module.performance.responseTime}ms
                      </span>
                      {module.errorCount > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {module.errorCount} errores
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <ScrollArea className="h-[300px]">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin alertas activas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        alert.acknowledged ? "bg-muted/30 opacity-60" : "bg-card"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={cn(
                            "h-4 w-4 mt-0.5",
                            alert.type === 'error' ? 'text-destructive' : 'text-yellow-500'
                          )} />
                          <div>
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(alert.timestamp), { locale: es, addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {!alert.acknowledged && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {modules.map((module) => (
                  <div key={module.moduleKey} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{module.moduleName}</span>
                      <Badge variant="outline" className="text-xs">
                        {module.performance.uptime}% uptime
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Respuesta</p>
                        <p className="font-medium">{module.performance.responseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Memoria</p>
                        <p className="font-medium">{module.performance.memoryUsage}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-medium">{module.performance.uptime}%</p>
                      </div>
                    </div>
                    <Progress 
                      value={module.performance.uptime} 
                      className="h-1 mt-2" 
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleDashboardPanel;
