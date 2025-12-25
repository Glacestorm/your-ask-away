import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Database, Play } from 'lucide-react';
import { useDataSync } from '@/hooks/admin/integrations/useDataSync';
import { cn } from '@/lib/utils';

export function DataSyncPanel({ className }: { className?: string }) {
  const { jobs, metrics, isLoading, fetchJobs, fetchMetrics, runJob } = useDataSync();

  useEffect(() => { fetchJobs(); fetchMetrics(); }, [fetchJobs, fetchMetrics]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Sync
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => fetchJobs()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {metrics && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-lg font-bold">{metrics.active_jobs}</p>
              <p className="text-xs text-muted-foreground">Active Jobs</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-lg font-bold">{metrics.success_rate}%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-lg font-bold">{metrics.records_synced_today?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Records Today</p>
            </div>
          </div>
        )}
        <ScrollArea className="h-[220px]">
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{j.name}</p>
                    <p className="text-xs text-muted-foreground">{j.source_type} → {j.destination_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={j.is_active ? 'default' : 'secondary'}>{j.sync_mode}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => runJob(j.id)}><Play className="h-4 w-4" /></Button>
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

export default DataSyncPanel;
