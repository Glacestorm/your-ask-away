/**
 * Financial Guardian Panel - Phase 15
 * Real-time AI monitoring and proactive financial advice
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Eye, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  Brain,
  Target,
  Sparkles
} from 'lucide-react';
import { useObelixiaFinancialGuardian } from '@/hooks/admin/obelixia-accounting';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function FinancialGuardianPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  
  const {
    isLoading,
    alerts,
    insights,
    recommendations,
    stats,
    fetchAlerts,
    fetchInsights,
    fetchRecommendations,
    fetchStats,
    resolveAlert,
    implementRecommendation
  } = useObelixiaFinancialGuardian();

  useEffect(() => {
    fetchAlerts();
    fetchInsights();
    fetchRecommendations();
    fetchStats();
  }, [fetchAlerts, fetchInsights, fetchRecommendations, fetchStats]);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const pendingRecommendations = recommendations.filter(r => r.status === 'pending');
  const healthScore = stats?.healthScore || 78;
  const lastAnalysis = stats?.lastAnalysis ? new Date(stats.lastAnalysis) : null;

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-destructive text-destructive-foreground';
    if (severity >= 6) return 'bg-orange-500 text-white';
    if (severity >= 4) return 'bg-yellow-500 text-black';
    return 'bg-blue-500 text-white';
  };

  const getAlertIcon = (category: string) => {
    switch (category) {
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'compliance': return <Shield className="h-4 w-4" />;
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <XCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const handleRefresh = () => {
    fetchAlerts();
    fetchInsights();
    fetchRecommendations();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Guardián Financiero IA</h1>
            <p className="text-muted-foreground">
              Monitoreo en tiempo real y asesoramiento proactivo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Monitoreo</span>
            <Switch 
              checked={monitoringEnabled} 
              onCheckedChange={setMonitoringEnabled}
            />
            {monitoringEnabled && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Activo
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Analizar
          </Button>
        </div>
      </div>

      {/* Health Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                    className={cn(
                      "transition-all duration-1000",
                      healthScore >= 80 ? "text-green-500" :
                      healthScore >= 60 ? "text-yellow-500" :
                      healthScore >= 40 ? "text-orange-500" : "text-destructive"
                    )}
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{healthScore}%</span>
              </div>
              <p className="mt-2 text-sm font-medium">Salud Financiera</p>
              <p className="text-xs text-muted-foreground">
                {lastAnalysis && `Última: ${formatDistanceToNow(lastAnalysis, { locale: es, addSuffix: true })}`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Alertas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.length}</p>
                <p className="text-sm text-muted-foreground">Insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRecommendations.length}</p>
                <p className="text-sm text-muted-foreground">Recomendaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recomendaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Actividad Reciente del Guardián
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className={cn("p-2 rounded-lg", getSeverityColor(alert.severity))}>
                          {getAlertIcon(alert.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.createdAt), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                        <p>Todo en orden. El guardián está vigilando.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Guardian Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Estado del Guardián
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: 'Detección de Anomalías', status: 'active', icon: AlertTriangle },
                    { label: 'Análisis de Cumplimiento', status: 'active', icon: Shield },
                    { label: 'Optimización Fiscal', status: 'active', icon: TrendingUp },
                    { label: 'Predicción de Riesgos', status: 'active', icon: Target },
                    { label: 'Alertas en Tiempo Real', status: monitoringEnabled ? 'active' : 'inactive', icon: Bell },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <feature.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{feature.label}</span>
                      </div>
                      <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                        {feature.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", getSeverityColor(alert.severity))}>
                            {getAlertIcon(alert.category)}
                          </div>
                          <div>
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{alert.category}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(alert.createdAt), { locale: es, addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {alert.status === 'active' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => resolveAlert(alert.id, 'dismissed')}
                          >
                            Descartar
                          </Button>
                        )}
                      </div>
                      {alert.suggestedAction && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50">
                          <p className="text-sm">
                            <strong>Acción sugerida:</strong> {alert.suggestedAction}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                      <p className="text-lg font-medium">Sin alertas activas</p>
                      <p className="text-sm">El guardián está vigilando tus finanzas</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights Financieros</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div key={insight.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Lightbulb className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{insight.type}</Badge>
                            <Badge variant={
                              insight.priority === 'critical' ? 'destructive' :
                              insight.priority === 'high' ? 'default' : 'secondary'
                            }>
                              {insight.priority}
                            </Badge>
                          </div>
                          <h4 className="font-medium mt-2">{insight.title}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
                          {insight.recommendation && (
                            <p className="mt-2 text-xs text-primary">
                              <strong>Recomendación:</strong> {insight.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p>Analizando datos para generar insights...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recomendaciones del Asesor IA</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="text-xs">
                                <span className="text-muted-foreground">Categoría: </span>
                                <Badge variant="outline">{rec.category}</Badge>
                              </div>
                              <div className="text-xs">
                                <span className="text-muted-foreground">Urgencia: </span>
                                <span className="font-medium">{rec.urgency}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {rec.implementationSteps && rec.implementationSteps.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/50">
                          <p className="text-xs font-medium mb-2">Pasos a seguir:</p>
                          <ul className="space-y-1">
                            {rec.implementationSteps.slice(0, 3).map((step) => (
                              <li key={step.step} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="font-medium text-primary">{step.step}.</span>
                                {step.action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rec.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            onClick={() => implementRecommendation(rec.id, 'Implementado por usuario')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Implementar
                          </Button>
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                        </div>
                      )}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Implementar
                          </Button>
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {recommendations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p>Generando recomendaciones personalizadas...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FinancialGuardianPanel;
