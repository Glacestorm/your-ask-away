/**
 * ScheduledTasksPanel - Fase 9
 * Panel completo para gestión de tareas programadas
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  Pause,
  RefreshCw, 
  Plus,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Timer,
  History,
  Settings,
  Trash2,
  MoreVertical,
  Zap
} from 'lucide-react';
import { useScheduledTasks } from '@/hooks/admin/automation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ScheduledTasksPanelProps {
  className?: string;
  expanded?: boolean;
}

export default function ScheduledTasksPanel({ className, expanded = false }: ScheduledTasksPanelProps) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    tasks, 
    executions,
    stats,
    isLoading, 
    error,
    lastRefresh,
    fetchTasks,
    createTask,
    executeNow,
    toggleTask,
    getExecutions,
    deleteTask
  } = useScheduledTasks();

  useEffect(() => { 
    fetchTasks(); 
  }, [fetchTasks]);

  const handleExecuteNow = useCallback(async (taskId: string) => {
    const result = await executeNow(taskId);
    if (result) {
      toast.success('Tarea ejecutada');
      fetchTasks();
    }
  }, [executeNow, fetchTasks]);

  const handleToggleTask = useCallback(async (taskId: string, isActive: boolean) => {
    await toggleTask(taskId, isActive);
    toast.success(isActive ? 'Tarea activada' : 'Tarea pausada');
    fetchTasks();
  }, [toggleTask, fetchTasks]);

  const filteredTasks = tasks.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.task_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScheduleLabel = (schedule: string) => {
    if (schedule?.includes('* * *')) return 'Cada minuto';
    if (schedule?.includes('0 * *')) return 'Cada hora';
    if (schedule?.includes('0 0 *')) return 'Diario';
    if (schedule?.includes('0 0 * * 0')) return 'Semanal';
    if (schedule?.includes('0 0 1 *')) return 'Mensual';
    return schedule || 'Manual';
  };

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Tareas Programadas
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  Fase 9
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchTasks()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Total
            </div>
            <p className="text-2xl font-bold">{stats?.total_tasks || tasks.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="h-3.5 w-3.5" />
              Activas
            </div>
            <p className="text-2xl font-bold">{stats?.active_tasks || tasks.filter(t => t.is_active).length}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Éxito
            </div>
            <p className="text-2xl font-bold">{stats?.success_rate || 0}%</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Timer className="h-3.5 w-3.5" />
              Hoy
            </div>
            <p className="text-lg font-bold truncate">
              {stats?.executions_today || 0}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="tasks" className="text-xs">Tareas</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <ScrollArea className={expanded ? "h-[350px]" : "h-[250px]"}>
              <div className="space-y-2">
                {error ? (
                  <div className="p-4 text-center text-sm text-destructive">{error}</div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay tareas programadas</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={task.is_active}
                            onCheckedChange={(checked) => handleToggleTask(task.id, checked)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{task.name}</p>
                              <Badge 
                                variant={task.is_active ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {task.is_active ? 'Activa' : 'Pausada'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {task.task_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {getScheduleLabel(task.schedule)}
                              </span>
                              {task.last_run_at && (
                                <span className="text-xs text-muted-foreground">
                                  Última: {formatDistanceToNow(new Date(task.last_run_at), { 
                                    locale: es, 
                                    addSuffix: true 
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleExecuteNow(task.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              deleteTask(task.id);
                              toast.success('Tarea eliminada');
                              fetchTasks();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ScrollArea className={expanded ? "h-[350px]" : "h-[280px]"}>
              <div className="space-y-2">
                {executions?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay ejecuciones recientes</p>
                  </div>
                ) : (
                  executions?.map((exec) => (
                    <div key={exec.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(exec.status)}
                          <div>
                            <p className="font-medium text-sm">{exec.task_id || 'Tarea'}</p>
                            <p className="text-xs text-muted-foreground">
                              {exec.started_at && format(new Date(exec.started_at), "dd/MM HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              exec.status === 'completed' ? 'default' : 
                              exec.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {exec.status}
                          </Badge>
                          {exec.duration_ms && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {exec.duration_ms}ms
                            </p>
                          )}
                        </div>
                      </div>
                      {exec.error_message && (
                        <div className="mt-2 p-2 rounded bg-destructive/10 text-xs text-destructive">
                          {exec.error_message}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
