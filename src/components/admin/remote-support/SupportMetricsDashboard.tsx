/**
 * SupportMetricsDashboard - Enterprise Real-time Metrics Dashboard
 * Comprehensive metrics visualization for support operations
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Users, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bot,
  Shield,
  Target,
  RefreshCw,
  Zap,
  Bell,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  HeartPulse
} from 'lucide-react';
import { useSupportMetricsDashboard, type DashboardFilters } from '@/hooks/admin/support/useSupportMetricsDashboard';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function SupportMetricsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    metrics,
    realtimeEvents,
    isLoading,
    error,
    lastRefresh,
    filters,
    fetchMetrics,
    updateFilters,
    healthScore,
    alerts
  } = useSupportMetricsDashboard();

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            Centro de Control
          </h2>
          <p className="text-muted-foreground">
            Métricas en tiempo real del sistema de soporte
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={filters.dateRange} 
            onValueChange={(v) => updateFilters({ dateRange: v as DashboardFilters['dateRange'] })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Badge variant="outline" className="text-xs">
            {lastRefresh 
              ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
              : 'Sincronizando...'}
          </Badge>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-4 flex-wrap">
              <Bell className="h-5 w-5 text-warning" />
              {alerts.map((alert, i) => (
                <Badge 
                  key={i} 
                  variant={alert.type === 'error' ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {alert.message}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Score Card */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={cn(
                "text-4xl font-bold",
                healthScore >= 80 ? "text-green-500" :
                healthScore >= 60 ? "text-yellow-500" : "text-red-500"
              )}>
                {healthScore}
              </div>
              <div className="flex-1">
                <Progress value={healthScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {healthScore >= 80 ? 'Excelente' : healthScore >= 60 ? 'Bueno' : 'Necesita atención'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main KPIs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sesiones Activas
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalSessionsToday} hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa Resolución
            </CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{metrics.resolutionRate}%</span>
              {metrics.resolutionRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <Progress value={metrics.resolutionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automatización IA
            </CardTitle>
            <Bot className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.automationRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.aiActionsToday} acciones IA hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo Promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(metrics.avgSessionDuration)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por sesión completada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Users className="h-4 w-4 mr-2" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="h-4 w-4 mr-2" />
            IA & Automatización
          </TabsTrigger>
          <TabsTrigger value="realtime">
            <Zap className="h-4 w-4 mr-2" />
            Tiempo Real
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sesiones por Período</CardTitle>
                <CardDescription>Volumen de sesiones de soporte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.sessionsTrend}>
                      <defs>
                        <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))"
                        fill="url(#sessionsGradient)"
                        name="Sesiones"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasa de Resolución</CardTitle>
                <CardDescription>Porcentaje de sesiones completadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.resolutionTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value}%`, 'Resolución']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-2))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Predictions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Carga Predicha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">~{metrics.predictedLoad}</div>
                <p className="text-sm text-muted-foreground">sesiones esperadas hoy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-500" />
                  Horas Pico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {metrics.peakHours.length > 0 ? (
                    metrics.peakHours.map((hour, i) => (
                      <Badge key={i} variant="secondary">{hour}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin datos</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Staff Recomendado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.recommendedStaffing}</div>
                <p className="text-sm text-muted-foreground">agentes para carga óptima</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Agentes por Rendimiento</CardTitle>
              <CardDescription>
                Basado en resolución, velocidad y uso de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.topPerformingAgents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de agentes disponibles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.topPerformingAgents.map((agent, index) => (
                    <div 
                      key={agent.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                    >
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full font-bold",
                        index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                        index === 1 ? "bg-slate-400/20 text-slate-500" :
                        index === 2 ? "bg-orange-500/20 text-orange-500" :
                        "bg-muted text-muted-foreground"
                      )}>
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{agent.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {agent.sessionsToday} hoy
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {agent.resolutionRate}% resolución
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{agent.score}</div>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-500" />
                  Métricas de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Tasa de Éxito IA</span>
                    <span className="text-sm font-bold">{metrics.aiSuccessRate}%</span>
                  </div>
                  <Progress value={metrics.aiSuccessRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Confianza Promedio</span>
                    <span className="text-sm font-bold">{metrics.avgAIConfidence}%</span>
                  </div>
                  <Progress value={metrics.avgAIConfidence} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Automatización</span>
                    <span className="text-sm font-bold">{metrics.automationRate}%</span>
                  </div>
                  <Progress value={metrics.automationRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Riesgo & Cumplimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span>Acciones Alto Riesgo (hoy)</span>
                  </div>
                  <Badge variant={metrics.highRiskActionsToday > 10 ? 'destructive' : 'secondary'}>
                    {metrics.highRiskActionsToday}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span>Aprobaciones Pendientes</span>
                  </div>
                  <Badge variant={metrics.pendingApprovals > 5 ? 'destructive' : 'secondary'}>
                    {metrics.pendingApprovals}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Score Cumplimiento</span>
                  </div>
                  <Badge variant="outline" className="text-green-500">
                    {metrics.complianceScore}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Eventos en Tiempo Real
              </CardTitle>
              <CardDescription>
                Últimos 50 eventos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {realtimeEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Esperando eventos...</p>
                    <p className="text-xs mt-2">Los eventos aparecerán aquí en tiempo real</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {realtimeEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className={cn(
                          "p-2 rounded-full",
                          event.type === 'session_start' && "bg-green-500/20 text-green-500",
                          event.type === 'session_end' && "bg-blue-500/20 text-blue-500",
                          event.type === 'ai_action' && "bg-purple-500/20 text-purple-500",
                          event.type === 'high_risk' && "bg-red-500/20 text-red-500",
                          event.type === 'approval_pending' && "bg-orange-500/20 text-orange-500"
                        )}>
                          {event.type === 'session_start' && <Activity className="h-4 w-4" />}
                          {event.type === 'session_end' && <CheckCircle2 className="h-4 w-4" />}
                          {event.type === 'ai_action' && <Bot className="h-4 w-4" />}
                          {event.type === 'high_risk' && <AlertTriangle className="h-4 w-4" />}
                          {event.type === 'approval_pending' && <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {event.type === 'session_start' && 'Nueva sesión iniciada'}
                            {event.type === 'session_end' && 'Sesión finalizada'}
                            {event.type === 'ai_action' && 'Acción IA ejecutada'}
                            {event.type === 'high_risk' && 'Acción de alto riesgo'}
                            {event.type === 'approval_pending' && 'Aprobación pendiente'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(event.timestamp), { 
                              locale: es, 
                              addSuffix: true 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SupportMetricsDashboard;
