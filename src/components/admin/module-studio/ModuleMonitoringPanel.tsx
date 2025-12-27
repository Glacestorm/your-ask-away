import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Play
} from 'lucide-react';
import { useModuleMonitoring, ModuleLog, HealthCheck } from '@/hooks/admin/useModuleMonitoring';
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
    stopAutoRefresh
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

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Monitoreo Avanzado</CardTitle>
              <p className="text-xs text-muted-foreground">
                Logs, health checks y diagnósticos IA
              </p>
            </div>
          </div>
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
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="logs" className="text-xs">
              <Terminal className="h-3 w-3 mr-1" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs">
              <Heart className="h-3 w-3 mr-1" />
              Health
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-xs">
              <Cpu className="h-3 w-3 mr-1" />
              Diagnóstico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-0">
            {/* Filtros */}
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
                    className="p-2 rounded border bg-card hover:bg-muted/50 transition-colors"
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
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

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
