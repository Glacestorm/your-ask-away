import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  RotateCcw,
  Terminal,
  FileCode,
  Settings,
  Activity
} from 'lucide-react';
import { useActionExecutionEngine } from '@/hooks/admin/support/useActionExecutionEngine';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ActionExecutionDashboardProps {
  sessionId?: string;
  onActionComplete?: (executionId: string, success: boolean) => void;
  className?: string;
}

export function ActionExecutionDashboard({ 
  sessionId,
  onActionComplete,
  className 
}: ActionExecutionDashboardProps) {
  const [activeTab, setActiveTab] = useState('actions');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const {
    isLoading,
    isExecuting,
    actions,
    executions,
    fetchActions,
    fetchExecutions,
    executeAction,
    rollbackExecution,
    approveExecution
  } = useActionExecutionEngine();

  const availableActions = actions;
  const currentExecution = executions.find(e => e.status === 'executing') || null;

  useEffect(() => {
    fetchActions();
    if (sessionId) {
      fetchExecutions(sessionId);
    }
  }, [fetchActions, fetchExecutions, sessionId]);

  const handleExecuteAction = useCallback(async (actionKey: string) => {
    if (!sessionId) {
      toast.error('No hay sesión activa');
      return;
    }

    const result = await executeAction({
      actionKey,
      params: {},
      sessionId
    });
    if (result) {
      onActionComplete?.(result.executionId, result.success);
    }
  }, [sessionId, executeAction, onActionComplete]);

  const handleRollback = useCallback(async (executionId: string) => {
    const success = await rollbackExecution(executionId);
    if (success) {
      onActionComplete?.(executionId, false);
    }
  }, [rollbackExecution, onActionComplete]);

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Bajo</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medio</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Alto</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'rolled_back':
        return <RotateCcw className="h-4 w-4 text-orange-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Terminal className="h-4 w-4" />;
      case 'configuration':
        return <Settings className="h-4 w-4" />;
      case 'diagnostic':
        return <Activity className="h-4 w-4" />;
      default:
        return <FileCode className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Motor de Ejecución
                <Badge variant="outline" className="text-xs">Sandbox</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {availableActions.length} acciones • {executions.length} ejecuciones
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { fetchActions(); if (sessionId) fetchExecutions(sessionId); }}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="actions" className="text-xs">
              <FileCode className="h-3 w-3 mr-1" />
              Acciones
            </TabsTrigger>
            <TabsTrigger value="executions" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Ejecuciones
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {availableActions.map((action) => (
                  <div 
                    key={action.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors cursor-pointer",
                      selectedAction === action.id 
                        ? "border-emerald-500/50 bg-emerald-500/5" 
                        : "bg-card hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded-md",
                          action.is_active 
                            ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {getActionIcon(action.action_category)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{action.action_name}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      {getRiskBadge(action.risk_level)}
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{action.max_execution_time_seconds}s máx
                        </span>
                        {action.requires_approval && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Shield className="h-3 w-3" />
                            Requiere aprobación
                          </span>
                        )}
                        {action.rollback_action_key && (
                          <span className="flex items-center gap-1 text-green-400">
                            <RotateCcw className="h-3 w-3" />
                            Reversible
                          </span>
                        )}
                      </div>

                      {selectedAction === action.id && sessionId && (
                        <Button 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleExecuteAction(action.action_key); }}
                          className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Ejecutar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {availableActions.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCode className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay acciones disponibles</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="executions" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {currentExecution && (
                  <div className="p-3 rounded-lg border-2 border-emerald-500/50 bg-emerald-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                        <span className="text-sm font-medium text-emerald-400">En Progreso</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {currentExecution.started_at ? format(new Date(currentExecution.started_at), 'HH:mm:ss') : '--:--:--'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Ejecutando...</span>
                      </div>
                      <Progress value={50} className="h-1.5 animate-pulse" />
                    </div>

                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pause className="h-3 w-3 mr-1" />
                        Pausar
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {executions.map((exec) => (
                  <div 
                    key={exec.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exec.status)}
                        <div>
                          <p className="text-sm font-medium">Ejecución #{exec.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {exec.started_at ? formatDistanceToNow(new Date(exec.started_at), { locale: es, addSuffix: true }) : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exec.status === 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleRollback(exec.id)}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        {exec.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => approveExecution(exec.id)}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprobar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {executions.length === 0 && !currentExecution && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay ejecuciones registradas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">Sandbox Activo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Todas las acciones se ejecutan en un entorno aislado con snapshots automáticos para rollback.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-muted-foreground">Exitosas</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {executions.filter(e => e.status === 'completed').length}
                  </p>
                </div>

                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-muted-foreground">Fallidas</span>
                  </div>
                  <p className="text-xl font-bold text-red-400">
                    {executions.filter(e => e.status === 'failed').length}
                  </p>
                </div>

                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-muted-foreground">Rollbacks</span>
                  </div>
                  <p className="text-xl font-bold text-orange-400">
                    {executions.filter(e => e.status === 'rolled_back').length}
                  </p>
                </div>

                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">Pendientes</span>
                  </div>
                  <p className="text-xl font-bold text-yellow-400">
                    {executions.filter(e => e.status === 'pending').length}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Políticas de Seguridad</span>
                  <Badge className="bg-green-500/20 text-green-400">Activas</Badge>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Acciones de alto riesgo requieren aprobación
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Snapshots automáticos antes de ejecución
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Timeout máximo de 120 segundos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Auditoría completa de todas las acciones
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ActionExecutionDashboard;
