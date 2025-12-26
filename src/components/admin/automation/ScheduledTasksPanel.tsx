import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play, RefreshCw } from 'lucide-react';
import { useScheduledTasks } from '@/hooks/admin/automation';
import { useEffect } from 'react';

export default function ScheduledTasksPanel() {
  const { tasks, stats, isLoading, fetchTasks, executeNow } = useScheduledTasks();

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Tareas Programadas
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => fetchTasks()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {stats && (
          <div className="text-xs text-muted-foreground mb-2">
            {stats.active_tasks} activas · {stats.success_rate}% éxito
          </div>
        )}
        {tasks.slice(0, 4).map((t) => (
          <div key={t.id} className="flex items-center justify-between p-2 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{t.name}</p>
              <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-xs">{t.task_type}</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => executeNow(t.id)}>
              <Play className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
