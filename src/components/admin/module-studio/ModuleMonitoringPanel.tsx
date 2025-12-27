import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Activity, 
  RefreshCw,
  Search,
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Terminal,
  Cpu,
  Sparkles,
  Wrench,
  Play,
  Shield,
  Zap,
  GitBranch,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle,
  Settings,
  Loader2
} from 'lucide-react';
import { useModuleMonitoring, ModuleLog, HealthCheck, FailurePrediction, RemediationAction, EventCorrelation } from '@/hooks/admin/useModuleMonitoring';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleMonitoringPanelProps {
  className?: string;
  moduleKey?: string;
}

export function ModuleMonitoringPanel({ className, moduleKey }: ModuleMonitoringPanelProps) {
  const [activeTab, setActiveTab] = useState('logs');
  const [selectedModule, setSelectedModule] = useState(moduleKey || 'all');
  const [showConfigModal, setShowConfigModal] = useState(false);

  const {
    logs,
    healthChecks,
    diagnostics,
    isLoading,
    isRunningDiagnostics,
    logFilter,
    setLogFilter,
    fetchLogs,
    fetchHealthChecks,
    runDiagnostics,
    applyAutoFix,
    startAutoRefresh,
    stopAutoRefresh,
    // Self-Healing
    predictions,
    predictionSummary,
    activeRemediations,
    remediationHistory,
    remediationStats,
    eventCorrelations,
    rootCauseAnalysis,
    selfHealingConfig,
    isPredicting,
    isRemediating,
    isCorrelating,
    isAnalyzingRootCause,
    predictFailures,
    executeRemediation,
    rollbackRemediation,
    correlateEvents,
    getRootCause,
    getRemediationHistory,
    configureSelfHealing
  } = useModuleMonitoring();

  useEffect(() => {
    startAutoRefresh(10000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  const getLogLevelColor = (level: ModuleLog['level']) => {
    switch (level) {
      case 'debug': return 'text-muted-foreground bg-muted';
      case 'info': return 'text-blue-500 bg-blue-500/10';
      case 'warn': return 'text-yellow-500 bg-yellow-500/10';
      case 'error': return 'text-destructive bg-destructive/10';
      case 'fatal': return 'text-white bg-destructive';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getHealthStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCheckStatusColor = (status: 'pass' | 'fail' | 'warn') => {
    switch (status) {
      case 'pass': return 'text-green-500';
      case 'warn': return 'text-yellow-500';
      case 'fail': return 'text-destructive';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-3 w-3 text-green-500" />;
      case 'degrading': return <TrendingUp className="h-3 w-3 text-red-500" />;
      default: return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getRemediationStatusColor = (status: RemediationAction['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'executing': return 'bg-blue-500';
      case 'rolled_back': return 'bg-orange-500';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Monitoreo Avanzado
                {selfHealingConfig.enabled && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Self-Healing
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Logs, health checks, predicciones y auto-remediación
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowConfigModal(true)}
              title="Configurar Self-Healing"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                fetchLogs(logFilter);
                fetchHealthChecks();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-3">
            <TabsTrigger value="logs" className="text-xs">
              <Terminal className="h-3 w-3 mr-1" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs">
              <Heart className="h-3 w-3 mr-1" />
              Health
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Predicciones
            </TabsTrigger>
            <TabsTrigger value="healing" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Auto-Healing
            </TabsTrigger>
            <TabsTrigger value="correlations" className="text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              Correlaciones
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-xs">
              <Cpu className="h-3 w-3 mr-1" />
              Diagnóstico
            </TabsTrigger>
          </TabsList>

          {/* TAB: LOGS */}
          <TabsContent value="logs" className="mt-0">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar logs..."
                  className="pl-8 h-8 text-sm"
                  value={logFilter.search || ''}
                  onChange={(e) => {
                    setLogFilter({ ...logFilter, search: e.target.value });
                    fetchLogs({ ...logFilter, search: e.target.value });
                  }}
                />
              </div>
              <Select 
                value={logFilter.level || 'all'}
                onValueChange={(value) => {
                  const level = value === 'all' ? undefined : value as ModuleLog['level'];
                  setLogFilter({ ...logFilter, level });
                  fetchLogs({ ...logFilter, level });
                }}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[280px]">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log) => (
                  <div 
                    key={log.id}
                    className={cn(
                      "p-2 rounded border bg-card hover:bg-muted/50 transition-colors",
                      log.correlationGroupId && "border-l-2 border-l-orange-500"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Badge className={cn("text-[10px] uppercase shrink-0", getLogLevelColor(log.level))}>
                        {log.level}
                      </Badge>
                      <span className="text-muted-foreground shrink-0">[{log.moduleKey}]</span>
                      <span className="flex-1">{log.message}</span>
                      <span className="text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(log.timestamp), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                    {log.stackTrace && (
                      <pre className="mt-2 p-2 bg-muted/50 rounded text-[10px] overflow-x-auto">
                        {log.stackTrace}
                      </pre>
                    )}
                    {log.correlationGroupId && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        <GitBranch className="h-2 w-2 mr-1" />
                        Correlacionado
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB: HEALTH */}
          <TabsContent value="health" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-3">
                {healthChecks.map((health) => (
                  <div key={health.moduleKey} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getHealthStatusIcon(health.status)}
                        <span className="font-medium text-sm">{health.moduleKey}</span>
                      </div>
                      <Badge variant={
                        health.status === 'healthy' ? 'default' :
                        health.status === 'degraded' ? 'secondary' : 'destructive'
                      }>
                        {health.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {health.checks.map((check, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{check.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{check.latency}ms</span>
                            <span className={getCheckStatusColor(check.status)}>
                              {check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Última verificación: {formatDistanceToNow(new Date(health.lastChecked), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB: PREDICTIONS */}
          <TabsContent value="predictions" className="mt-0">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {predictionSummary && (
                  <>
                    <Badge className={getRiskColor(
                      predictionSummary.overallRiskScore > 70 ? 'critical' :
                      predictionSummary.overallRiskScore > 50 ? 'high' :
                      predictionSummary.overallRiskScore > 30 ? 'medium' : 'low'
                    )}>
                      Riesgo: {predictionSummary.overallRiskScore}%
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getTrendIcon(predictionSummary.systemHealthTrend)}
                      <span className="capitalize">{predictionSummary.systemHealthTrend}</span>
                    </div>
                  </>
                )}
              </div>
              <Button 
                size="sm"
                onClick={() => predictFailures(selectedModule === 'all' ? undefined : selectedModule)}
                disabled={isPredicting}
              >
                {isPredicting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Predecir Fallos
              </Button>
            </div>

            <ScrollArea className="h-[280px]">
              {predictions.length > 0 ? (
                <div className="space-y-2">
                  {predictions.map((pred) => (
                    <div 
                      key={pred.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getRiskColor(pred.riskLevel))}>
                            {pred.probability}%
                          </Badge>
                          <span className="font-medium text-sm">{pred.issue}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {pred.estimatedTimeframe}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <Progress value={pred.probability} className="h-1" />
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {pred.indicators.slice(0, 3).map((ind, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {ind}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getTrendIcon(pred.trend)}
                          <span>Confianza: {pred.confidence}%</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => executeRemediation(
                            pred.preventiveActions[0]?.includes('cache') ? 'cache_clear' :
                            pred.preventiveActions[0]?.includes('restart') ? 'restart' : 'circuit_breaker',
                            pred.moduleKey,
                            pred.issue,
                            'prediction'
                          )}
                          disabled={isRemediating}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Prevenir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Target className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Ejecuta el análisis predictivo para detectar posibles fallos
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* TAB: AUTO-HEALING */}
          <TabsContent value="healing" className="mt-0">
            <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={selfHealingConfig.enabled}
                  onCheckedChange={(enabled) => configureSelfHealing({ enabled })}
                />
                <Label className="text-sm">Auto-Healing Activo</Label>
              </div>
              <Badge variant="outline">
                Umbral: {selfHealingConfig.autoRemediateThreshold}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(['restart', 'cache_clear', 'scale', 'circuit_breaker'] as const).map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={!selfHealingConfig.enabledActions.includes(action) || isRemediating}
                  onClick={() => executeRemediation(action, selectedModule === 'all' ? 'sistema' : selectedModule)}
                >
                  {action === 'restart' && <RotateCcw className="h-3 w-3 mr-1" />}
                  {action === 'cache_clear' && <Zap className="h-3 w-3 mr-1" />}
                  {action === 'scale' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {action === 'circuit_breaker' && <Shield className="h-3 w-3 mr-1" />}
                  {action.replace('_', ' ')}
                </Button>
              ))}
            </div>

            <ScrollArea className="h-[230px]">
              {/* Active Remediations */}
              {activeRemediations.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Remediaciones Activas
                  </h4>
                  {activeRemediations.map((rem) => (
                    <div key={rem.id} className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/30 mb-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-sm font-medium">{rem.actionType}</span>
                          <span className="text-xs text-muted-foreground">en {rem.moduleKey}</span>
                        </div>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Remediation History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium">Historial de Remediaciones</h4>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => getRemediationHistory()}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Cargar
                  </Button>
                </div>
                
                {remediationHistory.length > 0 ? (
                  <div className="space-y-1">
                    {remediationHistory.map((rem) => (
                      <div key={rem.id} className="p-2 rounded-lg border bg-card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", getRemediationStatusColor(rem.status))} />
                            <span className="text-sm">{rem.actionType}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {rem.triggeredBy}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {rem.metricsImprovement && (
                              <span className="text-xs text-green-500">+{rem.metricsImprovement}%</span>
                            )}
                            {rem.rollbackAvailable && rem.status === 'success' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => rollbackRemediation(rem.id)}
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{rem.issue}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Sin remediaciones recientes
                  </div>
                )}
              </div>

              {/* Statistics */}
              {remediationStats && (
                <div className="mt-3 p-2 rounded-lg bg-muted/50">
                  <h4 className="text-xs font-medium mb-2">Estadísticas</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Total:</span> {remediationStats.totalRemediations}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Éxito:</span> {remediationStats.successRate}%
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tiempo promedio:</span> {remediationStats.avgResolutionTimeMs}ms
                    </div>
                    <div>
                      <span className="text-muted-foreground">Más común:</span> {remediationStats.mostCommonAction}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* TAB: CORRELATIONS */}
          <TabsContent value="correlations" className="mt-0">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-muted-foreground">
                Agrupa eventos relacionados y encuentra la causa raíz
              </p>
              <Button 
                size="sm"
                onClick={() => correlateEvents('5m')}
                disabled={isCorrelating}
              >
                {isCorrelating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <GitBranch className="h-3 w-3 mr-1" />
                )}
                Correlacionar
              </Button>
            </div>

            <ScrollArea className="h-[280px]">
              {eventCorrelations.length > 0 ? (
                <div className="space-y-3">
                  {eventCorrelations.map((corr) => (
                    <div key={corr.groupId} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge className={getRiskColor(corr.priority)} >
                            {corr.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            {corr.events.length} eventos
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => getRootCause(corr.groupId)}
                          disabled={isAnalyzingRootCause}
                        >
                          {isAnalyzingRootCause ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Search className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Root Cause */}
                      <div className="p-2 rounded bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 mb-2">
                        <div className="flex items-center gap-1 text-xs font-medium mb-1">
                          <AlertCircle className="h-3 w-3 text-orange-500" />
                          Causa Raíz
                        </div>
                        <p className="text-sm">{corr.rootCause.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {corr.rootCause.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Confianza: {corr.rootCause.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* Events */}
                      <div className="space-y-1 mb-2">
                        {corr.events.slice(0, 3).map((event, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <Badge className={cn("text-[10px]", getLogLevelColor(event.level as any))}>
                              {event.level}
                            </Badge>
                            <span className="text-muted-foreground">[{event.moduleKey}]</span>
                            <span className="truncate flex-1">{event.message}</span>
                          </div>
                        ))}
                      </div>

                      {/* Suggested Action */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{corr.suggestedAction}</span>
                        </div>
                        <div className="flex gap-1">
                          {corr.impactedModules.slice(0, 2).map((mod, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              {mod}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <GitBranch className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Ejecuta la correlación para agrupar eventos relacionados
                  </p>
                </div>
              )}

              {/* Root Cause Analysis Detail */}
              {rootCauseAnalysis && (
                <div className="mt-3 p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-accent/5">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Análisis Detallado de Causa Raíz
                  </h4>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium">{rootCauseAnalysis.rootCause.summary}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {rootCauseAnalysis.rootCause.category} - {rootCauseAnalysis.rootCause.confidence}% confianza
                    </Badge>
                  </div>

                  {/* 5 Whys */}
                  <div className="space-y-2 mb-3">
                    {rootCauseAnalysis.analysisChain.map((step, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted/50 text-xs">
                        <p className="font-medium text-orange-500">{step.question}</p>
                        <p className="text-muted-foreground">{step.answer}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h5 className="text-xs font-medium mb-1">Recomendaciones</h5>
                    {rootCauseAnalysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <span>{rec.action}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[10px]">{rec.priority}</Badge>
                          <Badge variant="outline" className="text-[10px]">{rec.effort}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* TAB: DIAGNOSTICS */}
          <TabsContent value="diagnostics" className="mt-0">
            <div className="mb-3">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Seleccionar módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los módulos</SelectItem>
                  <SelectItem value="crm">CRM Core</SelectItem>
                  <SelectItem value="analytics">Analytics Suite</SelectItem>
                  <SelectItem value="ai-copilot">AI Copilot</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full mb-3"
              onClick={() => runDiagnostics(selectedModule)}
              disabled={isRunningDiagnostics || selectedModule === 'all'}
            >
              {isRunningDiagnostics ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ejecutar Diagnóstico IA
                </>
              )}
            </Button>

            <ScrollArea className="h-[240px]">
              {diagnostics ? (
                <div className="space-y-3">
                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Performance</p>
                      <p className="text-lg font-bold text-blue-500">{diagnostics.performanceScore}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Seguridad</p>
                      <p className="text-lg font-bold text-green-500">{diagnostics.securityScore}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Fiabilidad</p>
                      <p className="text-lg font-bold text-purple-500">{diagnostics.reliabilityScore}</p>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Análisis IA</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{diagnostics.aiAnalysis}</p>
                  </div>

                  {/* Issues */}
                  {diagnostics.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Problemas detectados</h4>
                      {diagnostics.issues.map((issue, idx) => (
                        <div key={idx} className="p-2 rounded-lg border bg-card">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant={
                                issue.severity === 'critical' ? 'destructive' :
                                issue.severity === 'high' ? 'destructive' :
                                issue.severity === 'medium' ? 'secondary' : 'outline'
                              } className="text-xs mb-1">
                                {issue.severity}
                              </Badge>
                              <p className="text-sm">{issue.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{issue.recommendation}</p>
                            </div>
                            {issue.autoFixAvailable && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => applyAutoFix(diagnostics.moduleKey, idx)}
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Fix
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Cpu className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Selecciona un módulo y ejecuta el diagnóstico</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleMonitoringPanel;
