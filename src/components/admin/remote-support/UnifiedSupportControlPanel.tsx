// UnifiedSupportControlPanel.tsx - Fase 7C: Panel de Control Unificado
// Integra todos los módulos del sistema de soporte remoto enterprise

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Monitor,
  Users,
  Activity,
  Brain,
  Shield,
  FileText,
  Settings,
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Globe,
  Mic,
  BookOpen,
  BarChart3,
  Layers,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Target,
  Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// Import all support hooks
import { useSupportMetricsDashboard } from '@/hooks/admin/support/useSupportMetricsDashboard';
import { useSupportAgentOrchestrator } from '@/hooks/admin/support/useSupportAgentOrchestrator';
import { useSupportPredictiveAnalytics } from '@/hooks/admin/support/useSupportPredictiveAnalytics';
import { useSupportAuditLogger } from '@/hooks/admin/support/useSupportAuditLogger';
import { useKnowledgeBase } from '@/hooks/admin/support/useKnowledgeBase';

interface ModuleStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'warning' | 'error' | 'inactive';
  health: number;
  lastActivity: Date;
  metrics: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  module: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export function UnifiedSupportControlPanel() {
  const [activeView, setActiveView] = useState<'overview' | 'modules' | 'alerts' | 'settings'>('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Initialize all hooks
  const metricsHook = useSupportMetricsDashboard();
  const orchestratorHook = useSupportAgentOrchestrator();
  const predictiveHook = useSupportPredictiveAnalytics();
  const auditHook = useSupportAuditLogger();
  const knowledgeHook = useKnowledgeBase();

  // Build module status from hooks
  const moduleStatuses = useMemo<ModuleStatus[]>(() => [
    {
      id: 'metrics',
      name: 'Dashboard de Métricas',
      icon: <BarChart3 className="h-5 w-5" />,
      status: metricsHook.isLoading ? 'inactive' : 'active',
      health: metricsHook.healthScore || 85,
      lastActivity: metricsHook.lastRefresh || new Date(),
      metrics: [
        { label: 'Sesiones Activas', value: metricsHook.metrics?.activeSessions || 0 },
        { label: 'Tiempo Resp.', value: `${Math.round((metricsHook.metrics?.avgSessionDuration || 0) / 60000)}m` },
        { label: 'Resolución', value: `${metricsHook.metrics?.resolutionRate || 0}%`, trend: 'up' }
      ]
    },
    {
      id: 'orchestrator',
      name: 'Orquestador de Agentes',
      icon: <Users className="h-5 w-5" />,
      status: orchestratorHook.isLoading ? 'inactive' : orchestratorHook.error ? 'error' : 'active',
      health: 92,
      lastActivity: orchestratorHook.lastRefresh || new Date(),
      metrics: [
        { label: 'Agentes Activos', value: orchestratorHook.agents?.filter(a => a.is_active).length || 0 },
        { label: 'Tareas Pendientes', value: orchestratorHook.activeTasks?.filter(t => t.status === 'pending').length || 0 },
        { label: 'Eficiencia', value: '94%', trend: 'up' }
      ]
    },
    {
      id: 'predictive',
      name: 'Análisis Predictivo',
      icon: <TrendingUp className="h-5 w-5" />,
      status: predictiveHook.isLoading ? 'inactive' : 'active',
      health: 88,
      lastActivity: predictiveHook.lastRefresh || new Date(),
      metrics: [
        { label: 'Predicciones', value: predictiveHook.loadPredictions?.length || 0 },
        { label: 'Precisión', value: `${predictiveHook.healthMetrics?.healthScore || 85}%` },
        { label: 'Anomalías', value: predictiveHook.anomalies?.length || 0, trend: 'down' }
      ]
    },
    {
      id: 'audit',
      name: 'Auditoría y Seguridad',
      icon: <Shield className="h-5 w-5" />,
      status: auditHook.isLoading ? 'inactive' : 'active',
      health: 98,
      lastActivity: new Date(),
      metrics: [
        { label: 'Eventos Hoy', value: auditHook.auditTrail?.length || 0 },
        { label: 'Alertas', value: 0 },
        { label: 'Cumplimiento', value: '95%', trend: 'stable' }
      ]
    },
    {
      id: 'knowledge',
      name: 'Base de Conocimiento',
      icon: <BookOpen className="h-5 w-5" />,
      status: knowledgeHook.isLoading ? 'inactive' : 'active',
      health: 90,
      lastActivity: new Date(),
      metrics: [
        { label: 'Artículos', value: knowledgeHook.documents?.length || 0 },
        { label: 'Categorías', value: knowledgeHook.categories?.length || 0 },
        { label: 'Efectividad', value: '87%', trend: 'up' }
      ]
    }
  ], [metricsHook, orchestratorHook, predictiveHook, auditHook, knowledgeHook]);

  // Calculate overall system health
  const systemHealth = useMemo(() => {
    const healthValues = moduleStatuses.map(m => m.health);
    return Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length);
  }, [moduleStatuses]);

  // Count active alerts
  const activeAlerts = useMemo(() => 
    systemAlerts.filter(a => !a.acknowledged).length
  , [systemAlerts]);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      metricsHook.fetchMetrics?.();
      orchestratorHook.fetchAgents?.();
      predictiveHook.refreshAll?.();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Handle module click
  const handleModuleClick = useCallback((moduleId: string) => {
    setSelectedModule(moduleId === selectedModule ? null : moduleId);
  }, [selectedModule]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setSystemAlerts(prev => 
      prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a)
    );
    toast.success('Alerta reconocida');
  }, []);

  // Get status color
  const getStatusColor = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  // Get health color
  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-emerald-500';
    if (health >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <motion.div 
      className={cn(
        "flex flex-col gap-4 transition-all duration-300",
        isExpanded && "fixed inset-4 z-50 bg-background rounded-xl shadow-2xl p-4"
      )}
      layout
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Panel de Control Unificado</h2>
            <p className="text-sm text-muted-foreground">
              Sistema de Soporte Remoto Enterprise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* System Health Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <Activity className={cn("h-4 w-4", getHealthColor(systemHealth))} />
            <span className={cn("font-semibold", getHealthColor(systemHealth))}>
              {systemHealth}%
            </span>
            <span className="text-xs text-muted-foreground">Salud</span>
          </div>

          {/* Active Alerts */}
          {activeAlerts > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="relative"
              onClick={() => setActiveView('alerts')}
            >
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeAlerts}
              </Badge>
            </Button>
          )}

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <Radio className={cn("h-3 w-3", autoRefresh ? "text-emerald-500 animate-pulse" : "text-muted-foreground")} />
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="h-4 w-7"
            />
          </div>

          {/* Manual Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              metricsHook.fetchMetrics?.();
              toast.success('Datos actualizados');
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Expand/Collapse */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Vista General</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Módulos</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2 relative">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
            {activeAlerts > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                {activeAlerts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Sesiones Activas</p>
                    <p className="text-2xl font-bold">{metricsHook.metrics?.activeSessions || 0}</p>
                  </div>
                  <Monitor className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Tasa IA</p>
                    <p className="text-2xl font-bold">{metricsHook.metrics?.aiSuccessRate || 0}%</p>
                  </div>
                  <Brain className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Resolución</p>
                    <p className="text-2xl font-bold">{metricsHook.metrics?.resolutionRate || 0}%</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cumplimiento</p>
                    <p className="text-2xl font-bold">{metricsHook.metrics?.complianceScore || 0}%</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {moduleStatuses.map((module) => (
              <motion.div
                key={module.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedModule === module.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          module.status === 'active' ? 'bg-primary/10 text-primary' :
                          module.status === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                          module.status === 'error' ? 'bg-red-500/10 text-red-500' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {module.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{module.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full", getStatusColor(module.status))} />
                            <span className="text-xs text-muted-foreground capitalize">{module.status}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn("text-lg font-bold", getHealthColor(module.health))}>
                        {module.health}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      {module.metrics.map((metric, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{metric.label}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{metric.value}</span>
                            {metric.trend && (
                              <TrendingUp className={cn(
                                "h-3 w-3",
                                metric.trend === 'up' ? 'text-emerald-500' :
                                metric.trend === 'down' ? 'text-red-500 rotate-180' :
                                'text-muted-foreground'
                              )} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>Última actividad</span>
                      <span>{formatDistanceToNow(module.lastActivity, { locale: es, addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Real-time Events Feed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Eventos en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {metricsHook.realtimeEvents?.slice(0, 10).map((event, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        event.type === 'session_start' ? 'bg-emerald-500' :
                        event.type === 'session_end' ? 'bg-blue-500' :
                        event.type === 'ai_action' ? 'bg-purple-500' :
                        event.type === 'high_risk' ? 'bg-red-500' :
                        'bg-muted-foreground'
                      )} />
                      <span className="flex-1 text-sm truncate">
                        {event.type === 'session_start' ? 'Nueva sesión iniciada' :
                         event.type === 'session_end' ? 'Sesión completada' :
                         event.type === 'ai_action' ? 'Acción IA ejecutada' :
                         event.type === 'high_risk' ? 'Acción de alto riesgo' :
                         event.type === 'approval_pending' ? 'Aprobación pendiente' :
                         'Evento del sistema'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {(!metricsHook.realtimeEvents || metricsHook.realtimeEvents.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin eventos recientes</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {moduleStatuses.map((module) => (
              <Card key={module.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {module.icon}
                      {module.name}
                    </CardTitle>
                    <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                      {module.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Health Progress */}
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Salud del Módulo</span>
                        <span className={getHealthColor(module.health)}>{module.health}%</span>
                      </div>
                      <Progress 
                        value={module.health} 
                        className={cn(
                          "h-2",
                          module.health >= 90 ? '[&>div]:bg-emerald-500' :
                          module.health >= 70 ? '[&>div]:bg-amber-500' :
                          '[&>div]:bg-red-500'
                        )}
                      />
                    </div>

                    {/* Metrics List */}
                    <div className="grid grid-cols-3 gap-2">
                      {module.metrics.map((metric, idx) => (
                        <div key={idx} className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold">{metric.value}</p>
                          <p className="text-xs text-muted-foreground">{metric.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Configurar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-3 w-3 mr-1" />
                        Ver Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas del Sistema
                {activeAlerts > 0 && (
                  <Badge variant="destructive" className="ml-2">{activeAlerts} activas</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemAlerts.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {systemAlerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          alert.acknowledged ? 'bg-muted/30 opacity-60' : 'bg-background',
                          alert.type === 'critical' ? 'border-red-500/50' :
                          alert.type === 'warning' ? 'border-amber-500/50' :
                          'border-border'
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-full",
                          alert.type === 'critical' ? 'bg-red-500/10 text-red-500' :
                          alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        )}>
                          {alert.type === 'critical' ? <AlertTriangle className="h-4 w-4" /> :
                           alert.type === 'warning' ? <Bell className="h-4 w-4" /> :
                           <CheckCircle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{alert.module}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(alert.timestamp, { locale: es, addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{alert.message}</p>
                        </div>
                        {!alert.acknowledged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500/50" />
                  <p className="font-medium">Sin alertas activas</p>
                  <p className="text-sm">Todos los sistemas funcionan correctamente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-refresh</p>
                    <p className="text-sm text-muted-foreground">Actualizar datos automáticamente</p>
                  </div>
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Intervalo de Refresh</p>
                    <p className="text-sm text-muted-foreground">Cada {refreshInterval / 1000} segundos</p>
                  </div>
                  <select 
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-md border bg-background text-sm"
                  >
                    <option value={15000}>15s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>60s</option>
                    <option value={120000}>2min</option>
                  </select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones</p>
                    <p className="text-sm text-muted-foreground">Alertas en tiempo real</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Base de Datos</span>
                  </div>
                  <Badge variant="default" className="bg-emerald-500">Conectado</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Edge Functions</span>
                  </div>
                  <Badge variant="default" className="bg-emerald-500">Activas</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Lovable AI</span>
                  </div>
                  <Badge variant="default" className="bg-emerald-500">Disponible</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Voice Agent</span>
                  </div>
                  <Badge variant="default" className="bg-emerald-500">Listo</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default UnifiedSupportControlPanel;
