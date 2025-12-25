import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Clock, Play, Pause, Trash2 } from 'lucide-react';
import { useScheduler } from '@/hooks/admin/automation/useScheduler';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function SchedulerPanel({ className }: { className?: string }) {
  const { isLoading, jobs, metrics, lastRefresh, fetchJobs, runJobNow, toggleJob, deleteJob } = useScheduler();

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">Scheduler</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchJobs()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        {metrics && (
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>Activos: {metrics.active_jobs}</span>
            <span>Hoy: {metrics.jobs_today}</span>
            <span>Éxito: {metrics.success_rate}%</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate max-w-[160px]">{job.job_name}</span>
                  <Badge variant={job.is_active ? "default" : "secondary"} className="text-xs">
                    {job.job_type}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  <div>Próxima: {job.next_run_at ? format(new Date(job.next_run_at), 'dd/MM HH:mm', { locale: es }) : '-'}</div>
                  <div className="font-mono text-[10px]">{job.schedule}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => runJobNow(job.id)}>
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => toggleJob(job.id, !job.is_active)}>
                    {job.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-destructive" onClick={() => deleteJob(job.id)}>
                    <Trash2 className="h-3 w-3" />
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
