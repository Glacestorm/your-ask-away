import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Zap, Activity } from 'lucide-react';
import { useEventProcessor } from '@/hooks/admin/automation/useEventProcessor';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function EventProcessorPanel({ className }: { className?: string }) {
  const { isLoading, events, metrics, lastRefresh, fetchEvents } = useEventProcessor();

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Event Processor</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchEvents()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        {metrics && (
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>{metrics.events_per_minute}/min</span>
            <span>Avg: {metrics.avg_processing_time_ms}ms</span>
            <span>DLQ: {metrics.dead_letter_count}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{event.event_name}</span>
                  <Badge variant={event.is_active ? "default" : "secondary"} className="text-xs">
                    {event.event_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{event.handlers?.length || 0} handlers</span>
                  <span>•</span>
                  <span>{event.source}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
