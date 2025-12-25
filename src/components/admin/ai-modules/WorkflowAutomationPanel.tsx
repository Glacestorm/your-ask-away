import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw, 
  Workflow,
  Play,
  Maximize2,
  Minimize2,
  Zap,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useWorkflowAutomation } from '@/hooks/admin/useWorkflowAutomation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface WorkflowAutomationPanelProps {
  className?: string;
}

export function WorkflowAutomationPanel({ className }: WorkflowAutomationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const {
    isLoading,
    workflows,
    executions,
    error,
    fetchWorkflows,
    toggleWorkflow,
    executeWorkflow,
    fetchExecutions
  } = useWorkflowAutomation();

  useEffect(() => {
    fetchWorkflows();
    fetchExecutions();
    setLastRefresh(new Date());
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchWorkflows(), fetchExecutions()]);
    setLastRefresh(new Date());
  }, [fetchWorkflows, fetchExecutions]);

  const handleToggle = useCallback(async (id: string, currentState: boolean) => {
    await toggleWorkflow(id, !currentState);
  }, [toggleWorkflow]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><Zap className="h-3 w-3 mr-1 animate-pulse" />Ejecutando</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  const getTriggerLabel = (trigger: { type: string }) => {
    switch (trigger.type) {
      case 'event': return 'Evento';
      case 'schedule': return 'Programado';
      case 'condition': return 'Condición';
      case 'manual': return 'Manual';
      default: return trigger.type;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Automatización de Flujos</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
          {error ? (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
              <XCircle className="h-4 w-4 text-destructive" />
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Workflows */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Flujos Activos ({workflows.length})
                </h4>
                {workflows.length > 0 ? (
                  workflows.map((workflow) => (
                    <div key={workflow.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{workflow.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {workflow.description || 'Sin descripción'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={workflow.is_active}
                            onCheckedChange={() => handleToggle(workflow.id, workflow.is_active)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => executeWorkflow(workflow.id)}
                            disabled={!workflow.is_active}
                            className="h-8 w-8"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Trigger: {getTriggerLabel(workflow.trigger)}</span>
                        <span>•</span>
                        <span>{workflow.actions?.length || 0} pasos</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-3 text-center">
                    No hay flujos configurados
                  </p>
                )}
              </div>

              {/* Recent Executions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Ejecuciones Recientes
                </h4>
                {executions.length > 0 ? (
                  executions.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="p-2 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate">{execution.workflow_id}</span>
                        {getStatusBadge(execution.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(execution.started_at), { locale: es, addSuffix: true })}
                        </span>
                        {execution.completed_at && (
                          <>
                            <span>•</span>
                            <span>{execution.actions_executed} acciones</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-3 text-center">
                    Sin ejecuciones recientes
                  </p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default WorkflowAutomationPanel;
