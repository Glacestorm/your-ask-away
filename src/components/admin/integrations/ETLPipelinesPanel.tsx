import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, GitBranch, Play } from 'lucide-react';
import { useETLPipelines } from '@/hooks/admin/integrations/useETLPipelines';
import { cn } from '@/lib/utils';

export function ETLPipelinesPanel({ className }: { className?: string }) {
  const { pipelines, isLoading, fetchPipelines, runPipeline } = useETLPipelines();

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            ETL Pipelines
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => fetchPipelines()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {pipelines.map((p) => (
              <div key={p.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.stages?.length || 0} stages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => runPipeline(p.id)}><Play className="h-4 w-4" /></Button>
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

export default ETLPipelinesPanel;
