/**
 * WorkflowPanel - Phase 11B
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { useObelixiaWorkflow } from '@/hooks/admin/obelixia-accounting';
import { cn } from '@/lib/utils';

export function WorkflowPanel() {
  const { isLoading, tasks, fetchTasks, approveTask, rejectTask } = useObelixiaWorkflow();

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Colaborativo</h2>
          <p className="text-muted-foreground">Aprobaciones, firmas y tareas pendientes</p>
        </div>
        <Button onClick={() => fetchTasks()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{task.assignedToName || 'Sin asignar'}</span>
                </div>
                {task.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => rejectTask(task.id, 'Rechazado')}>
                      <XCircle className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                    <Button size="sm" onClick={() => approveTask(task.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default WorkflowPanel;
