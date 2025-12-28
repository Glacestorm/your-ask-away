/**
 * ModuleLiveLogsPanel - Visor de logs en tiempo real
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Terminal, 
  Pause,
  Play,
  Trash2,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Bug
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleLiveLogsPanelProps {
  moduleKey?: string;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  module: string;
  message: string;
  details?: string;
}

const logLevelColors: Record<LogEntry['level'], string> = {
  debug: 'text-muted-foreground bg-muted',
  info: 'text-blue-600 bg-blue-500/10',
  warn: 'text-yellow-600 bg-yellow-500/10',
  error: 'text-red-600 bg-red-500/10',
  fatal: 'text-white bg-red-600'
};

const logLevelIcons: Record<LogEntry['level'], React.ReactNode> = {
  debug: <Bug className="h-3 w-3" />,
  info: <Info className="h-3 w-3" />,
  warn: <AlertTriangle className="h-3 w-3" />,
  error: <AlertCircle className="h-3 w-3" />,
  fatal: <XCircle className="h-3 w-3" />
};

const sampleMessages = [
  { level: 'info', message: 'Inicializando conexión a base de datos', module: 'crm' },
  { level: 'debug', message: 'Cache hit para usuario id=12345', module: 'analytics' },
  { level: 'info', message: 'Request completado en 45ms', module: 'marketplace' },
  { level: 'warn', message: 'Rate limit cercano al umbral (85%)', module: 'ai-copilot' },
  { level: 'error', message: 'Timeout al conectar con servicio externo', module: 'integrations' },
  { level: 'info', message: 'Nuevo usuario registrado: user@example.com', module: 'auth' },
  { level: 'debug', message: 'Ejecutando query: SELECT * FROM users WHERE...', module: 'crm' },
  { level: 'info', message: 'Webhook enviado correctamente', module: 'notifications' },
  { level: 'warn', message: 'Memoria al 75% de capacidad', module: 'system' },
  { level: 'info', message: 'Sesión iniciada para admin@company.com', module: 'auth' },
];

export function ModuleLiveLogsPanel({ moduleKey, className }: ModuleLiveLogsPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<LogEntry['level'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxLogs = 500;

  // Simulate real-time logs
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const sample = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
      const newLog: LogEntry = {
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
        level: sample.level as LogEntry['level'],
        module: sample.module,
        message: sample.message,
        details: Math.random() > 0.8 ? 'Additional context: Stack trace or request details...' : undefined
      };

      setLogs(prev => {
        const updated = [...prev, newLog];
        return updated.slice(-maxLogs);
      });
    }, 800 + Math.random() * 1200);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (selectedModule !== 'all' && log.module !== selectedModule) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleClear = () => {
    setLogs([]);
  };

  const handleExport = () => {
    const content = filteredLogs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modules = [...new Set(logs.map(l => l.module))];

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-zinc-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-600 to-zinc-600">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Logs en Tiempo Real
                {!isPaused && (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-500 font-normal">Live</span>
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {filteredLogs.length} logs • {logs.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isPaused ? "default" : "outline"} 
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
              className="h-8 w-8"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={handleClear} className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col min-h-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="fatal">Fatal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {modules.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-2">
            <Switch
              id="auto-scroll"
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
              className="scale-75"
            />
            <Label htmlFor="auto-scroll" className="text-xs">Auto-scroll</Label>
          </div>
        </div>

        {/* Level Stats */}
        <div className="flex gap-2 mb-3">
          {(['debug', 'info', 'warn', 'error', 'fatal'] as const).map(level => (
            <Badge 
              key={level} 
              variant="outline" 
              className={cn(
                "text-xs cursor-pointer transition-colors",
                filter === level && "ring-1 ring-primary"
              )}
              onClick={() => setFilter(filter === level ? 'all' : level)}
            >
              {logLevelIcons[level]}
              <span className="ml-1 capitalize">{level}</span>
              <span className="ml-1 opacity-60">{levelCounts[level] || 0}</span>
            </Badge>
          ))}
        </div>

        {/* Logs */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-auto bg-muted/30 rounded-lg border font-mono text-xs"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Terminal className="h-8 w-8 mb-2 opacity-50" />
              <p>No hay logs que mostrar</p>
              <p className="text-[10px]">Los logs aparecerán aquí en tiempo real</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-2 py-1 px-2 hover:bg-muted/50 rounded transition-colors"
                >
                  <span className="text-muted-foreground shrink-0 w-20">
                    {log.timestamp.toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit'
                    })}
                  </span>
                  <Badge className={cn("shrink-0 text-[10px] uppercase w-14 justify-center", logLevelColors[log.level])}>
                    {log.level}
                  </Badge>
                  <span className="text-primary shrink-0 w-20 truncate">[{log.module}]</span>
                  <span className="flex-1 break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ModuleLiveLogsPanel;
