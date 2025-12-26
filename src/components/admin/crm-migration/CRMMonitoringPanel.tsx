import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Database,
  Download,
  Filter,
  Info,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';
import { CRMMigration } from '@/hooks/admin/integrations/useCRMMigration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  category: 'system' | 'validation' | 'transform' | 'insert' | 'mapping' | 'rollback';
  message: string;
  details?: Record<string, unknown>;
  recordIndex?: number;
  field?: string;
}

interface MetricSnapshot {
  timestamp: string;
  recordsPerSecond: number;
  successRate: number;
  memoryUsage: number;
  activeConnections: number;
  queueSize: number;
}

interface CRMMonitoringPanelProps {
  migration: CRMMigration | null;
  className?: string;
}

export function CRMMonitoringPanel({ migration, className }: CRMMonitoringPanelProps) {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>(['info', 'warning', 'error', 'success']);
  const [notifications, setNotifications] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate log streaming
  useEffect(() => {
    if (!migration || isPaused) return;

    const generateLog = (): LogEntry => {
      const levels: LogEntry['level'][] = ['info', 'info', 'info', 'success', 'warning', 'error', 'debug'];
      const categories: LogEntry['category'][] = ['system', 'validation', 'transform', 'insert', 'mapping'];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      const messages: Record<string, string[]> = {
        info: [
          'Procesando lote de registros...',
          'Conexión establecida con la base de datos',
          'Validando esquema de mapeo',
          'Iniciando transformación de datos',
          'Buffer de escritura sincronizado'
        ],
        success: [
          'Registro migrado correctamente',
          'Lote completado: 100 registros',
          'Transformación aplicada exitosamente',
          'Validación superada',
          'Datos insertados en tabla destino'
        ],
        warning: [
          'Campo opcional vacío detectado',
          'Valor fuera de rango normalizado',
          'Duplicado potencial encontrado',
          'Formato de fecha ambiguo',
          'Caracteres especiales removidos'
        ],
        error: [
          'Error de validación: campo requerido vacío',
          'Fallo en transformación de tipo',
          'Violación de restricción de unicidad',
          'Timeout en conexión a BD',
          'Registro rechazado por regla de negocio'
        ],
        debug: [
          'Query ejecutada: SELECT COUNT(*) FROM...',
          'Memoria heap: 245MB / 512MB',
          'Latencia promedio: 15ms',
          'Conexiones activas: 5/10',
          'Cache hit ratio: 94%'
        ]
      };

      return {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        level,
        category,
        message: messages[level][Math.floor(Math.random() * messages[level].length)],
        recordIndex: level !== 'debug' && level !== 'info' ? Math.floor(Math.random() * 1000) : undefined,
        field: level === 'warning' || level === 'error' ? ['email', 'telefono', 'cif', 'fecha'][Math.floor(Math.random() * 4)] : undefined
      };
    };

    const interval = setInterval(() => {
      if (migration.status === 'running') {
        const newLog = generateLog();
        setLogs(prev => [...prev.slice(-500), newLog]);
      }
    }, Math.random() * 2000 + 500);

    return () => clearInterval(interval);
  }, [migration, isPaused]);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  // Simulate metrics
  useEffect(() => {
    if (!migration || migration.status !== 'running') return;

    const metricsInterval = setInterval(() => {
      const newMetric: MetricSnapshot = {
        timestamp: new Date().toISOString(),
        recordsPerSecond: 45 + Math.floor(Math.random() * 30),
        successRate: 95 + Math.random() * 5,
        memoryUsage: 30 + Math.random() * 40,
        activeConnections: 3 + Math.floor(Math.random() * 5),
        queueSize: Math.floor(Math.random() * 200)
      };
      setMetrics(prev => [...prev.slice(-60), newMetric]);
    }, 1000);

    return () => clearInterval(metricsInterval);
  }, [migration]);

  const filteredLogs = logs.filter(log => {
    if (!showDebug && log.level === 'debug') return false;
    if (!levelFilter.includes(log.level)) return false;
    if (logFilter && !log.message.toLowerCase().includes(logFilter.toLowerCase())) return false;
    return true;
  });

  const logStats = {
    total: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    success: logs.filter(l => l.level === 'success').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length
  };

  const latestMetric = metrics[metrics.length - 1];

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="h-3.5 w-3.5" />;
      case 'success': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'warning': return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'error': return <XCircle className="h-3.5 w-3.5" />;
      case 'debug': return <Terminal className="h-3.5 w-3.5" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-500 bg-blue-500/10';
      case 'success': return 'text-green-500 bg-green-500/10';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10';
      case 'error': return 'text-red-500 bg-red-500/10';
      case 'debug': return 'text-gray-500 bg-gray-500/10';
    }
  };

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const handleExportLogs = useCallback(() => {
    const content = filteredLogs.map(log => 
      `[${format(new Date(log.timestamp), 'HH:mm:ss.SSS')}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-logs-${format(new Date(), 'yyyyMMdd-HHmmss')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const toggleLevelFilter = (level: string) => {
    setLevelFilter(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  if (!migration) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Selecciona una migración para ver el monitoreo en tiempo real
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Live Status Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2.5 rounded-xl",
                migration.status === 'running' 
                  ? "bg-green-500/20 animate-pulse" 
                  : "bg-muted"
              )}>
                <Activity className={cn(
                  "h-5 w-5",
                  migration.status === 'running' ? "text-green-500" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {migration.migration_name}
                  <Badge variant={migration.status === 'running' ? 'default' : 'secondary'}>
                    {migration.status === 'running' ? 'En Ejecución' : migration.status}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {migration.migrated_records} de {migration.total_records} registros procesados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {latestMetric && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-500">{latestMetric.recordsPerSecond}</p>
                    <p className="text-xs text-muted-foreground">rec/s</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-500">{latestMetric.successRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">éxito</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-500">{latestMetric.queueSize}</p>
                    <p className="text-xs text-muted-foreground">en cola</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 border-l pl-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotifications(!notifications)}
                  className={cn(notifications && "text-primary")}
                >
                  {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress 
              value={(migration.migrated_records / migration.total_records) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Velocidad</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {latestMetric?.recordsPerSecond || 0} <span className="text-sm font-normal text-muted-foreground">rec/s</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Memoria</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {latestMetric?.memoryUsage.toFixed(0) || 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Conexiones</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {latestMetric?.activeConnections || 0}/10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">ETA</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {latestMetric && migration.total_records > migration.migrated_records
                ? `${Math.ceil((migration.total_records - migration.migrated_records) / latestMetric.recordsPerSecond / 60)}m`
                : '--'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="logs" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  Logs
                  <Badge variant="secondary" className="ml-1">{logs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="errors" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errores
                  <Badge variant="destructive" className="ml-1">{logStats.error}</Badge>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Alertas
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar logs..."
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="pl-9 w-[200px] h-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleExportLogs}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearLogs}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Level Filters */}
            <div className="flex items-center gap-4 mb-3 pb-3 border-b">
              <span className="text-sm text-muted-foreground">Niveles:</span>
              {(['info', 'success', 'warning', 'error'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => toggleLevelFilter(level)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                    levelFilter.includes(level)
                      ? getLevelColor(level)
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {getLevelIcon(level)}
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  <span className="ml-1 opacity-70">({logStats[level]})</span>
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <Switch
                  id="show-debug"
                  checked={showDebug}
                  onCheckedChange={setShowDebug}
                />
                <Label htmlFor="show-debug" className="text-xs">Debug</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-scroll"
                  checked={isAutoScroll}
                  onCheckedChange={setIsAutoScroll}
                />
                <Label htmlFor="auto-scroll" className="text-xs">Auto-scroll</Label>
              </div>
            </div>

            <TabsContent value="logs" className="mt-0">
              <ScrollArea 
                ref={logContainerRef as any}
                className="h-[400px] rounded-lg bg-muted/30 p-2 font-mono text-xs"
              >
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Terminal className="h-8 w-8 mb-2 opacity-50" />
                    <p>No hay logs que mostrar</p>
                    {isPaused && <p className="text-xs mt-1">Los logs están pausados</p>}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors",
                          log.level === 'error' && "bg-red-500/5"
                        )}
                      >
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                        </span>
                        <span className={cn(
                          "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded",
                          getLevelColor(log.level)
                        )}>
                          {getLevelIcon(log.level)}
                          {log.level.toUpperCase().padEnd(7)}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5">
                          {log.category}
                        </Badge>
                        <span className="flex-1">{log.message}</span>
                        {log.recordIndex !== undefined && (
                          <span className="text-muted-foreground shrink-0">
                            #REC:{log.recordIndex}
                          </span>
                        )}
                        {log.field && (
                          <span className="text-muted-foreground shrink-0">
                            @{log.field}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="errors" className="mt-0">
              <ScrollArea className="h-[400px]">
                {logs.filter(l => l.level === 'error').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2 text-green-500 opacity-50" />
                    <p>No hay errores registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.filter(l => l.level === 'error').map((log) => (
                      <Card key={log.id} className="border-red-500/20 bg-red-500/5">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{log.message}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                                <Badge variant="outline">{log.category}</Badge>
                                {log.recordIndex !== undefined && (
                                  <span>Registro #{log.recordIndex}</span>
                                )}
                                {log.field && (
                                  <span>Campo: {log.field}</span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Ver detalle
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0">
              <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p>Sistema de alertas configurado</p>
                <p className="text-xs mt-1">
                  {notifications ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
                </p>
                <div className="mt-4 space-y-2 w-full max-w-md">
                  <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="py-2 px-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Alerta cuando errores &gt; 5%</span>
                      <Switch className="ml-auto" defaultChecked />
                    </CardContent>
                  </Card>
                  <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="py-2 px-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Pausar si errores &gt; 10%</span>
                      <Switch className="ml-auto" defaultChecked />
                    </CardContent>
                  </Card>
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="py-2 px-3 flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Notificar al completar</span>
                      <Switch className="ml-auto" defaultChecked />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

export default CRMMonitoringPanel;
