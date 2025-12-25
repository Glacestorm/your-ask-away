import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, GitBranch, Play, Pause, Sparkles } from 'lucide-react';
import { useWorkflowAutomation } from '@/hooks/admin/automation/useWorkflowAutomation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function WorkflowAutomationPanel({ className }: { className?: string }) {
  const { isLoading, workflows, lastRefresh, fetchWorkflows, toggleWorkflow, executeWorkflow } = useWorkflowAutomation();

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Workflow Automation</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchWorkflows()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        {lastRefresh && <p className="text-xs text-muted-foreground">Actualizado {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}</p>}
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {workflows.map((wf) => (
              <div key={wf.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{wf.name}</span>
                  <Badge variant={wf.is_active ? "default" : "secondary"}>{wf.is_active ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{wf.trigger_type}</span>
                  <span>•</span>
                  <span>{wf.run_count} ejecuciones</span>
                  <span>•</span>
                  <span>{wf.success_rate}% éxito</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => executeWorkflow(wf.id)}>
                    <Play className="h-3 w-3 mr-1" />Ejecutar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleWorkflow(wf.id, !wf.is_active)}>
                    {wf.is_active ? <Pause className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
