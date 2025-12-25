import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Layers, XCircle, RotateCcw } from 'lucide-react';
import { useTaskOrchestrator } from '@/hooks/admin/automation/useTaskOrchestrator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function TaskOrchestratorPanel({ className }: { className?: string }) {
  const { isLoading, tasks, metrics, lastRefresh, fetchTasks, cancelTask, retryTask } = useTaskOrchestrator();

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const statusColors: Record<string, string> = {
    queued: 'bg-yellow-500', running: 'bg-blue-500', completed: 'bg-green-500',
    failed: 'bg-red-500', cancelled: 'bg-gray-500', paused: 'bg-orange-500'
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Task Orchestrator</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchTasks()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        {metrics && (
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>En cola: {metrics.tasks_in_queue}</span>
            <span>Workers: {metrics.active_workers}</span>
            <span>Éxito: {metrics.success_rate}%</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate max-w-[180px]">{task.task_name}</span>
                  <div className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", statusColors[task.status])} />
                    <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                  </div>
                </div>
                <Progress value={task.progress} className="h-1.5 mb-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{task.progress}% • {task.task_type}</span>
                  <div className="flex gap-1">
                    {task.status === 'failed' && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => retryTask(task.id)}>
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    {['queued', 'running'].includes(task.status) && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => cancelTask(task.id)}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
