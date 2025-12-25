import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Radio, Wifi, WifiOff, Maximize2, Minimize2 } from 'lucide-react';
import { useRealtimeMetrics } from '@/hooks/admin/analytics';
import { cn } from '@/lib/utils';

interface RealtimeMetricsPanelProps {
  streamIds?: string[];
  className?: string;
}

export function RealtimeMetricsPanel({ streamIds, className }: RealtimeMetricsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isConnected, metrics, streams, alerts, error, connect, disconnect, startPolling, stopPolling } = useRealtimeMetrics();

  useEffect(() => {
    if (streamIds?.length) {
      connect(streamIds);
      startPolling(5000);
    }
    return () => { disconnect(); stopPolling(); };
  }, [streamIds?.join(',')]);

  return (
    <Card className={cn("transition-all duration-300", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", isConnected ? "bg-gradient-to-br from-green-500 to-emerald-500" : "bg-muted")}>
              <Radio className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Realtime Metrics
                {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{streams.length} streams activos</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => connect(streamIds)} className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className={isExpanded ? "h-[calc(100vh-200px)]" : "h-[300px]"}>
          {error ? (
            <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">{error}</div>
          ) : (
            <div className="space-y-3">
              {metrics.map((m) => (
                <div key={m.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{m.metric_name}</span>
                    <Badge variant={m.change_rate > 0 ? "default" : m.change_rate < 0 ? "destructive" : "secondary"}>
                      {m.change_rate > 0 ? '+' : ''}{m.change_rate.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-xl font-bold">{m.current_value} <span className="text-xs text-muted-foreground">{m.unit}</span></p>
                </div>
              ))}
              {alerts.filter(a => a.triggered).map((a) => (
                <div key={a.id} className="p-3 rounded-lg border-2 border-destructive bg-destructive/10">
                  <Badge variant="destructive" className="mb-1">{a.severity}</Badge>
                  <p className="text-sm">Threshold: {a.threshold}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RealtimeMetricsPanel;
