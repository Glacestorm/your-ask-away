import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, BarChart3, TrendingUp, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/admin/analytics';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvancedAnalyticsPanelProps {
  context?: { entityId: string; entityType: string; timeRange: string };
  className?: string;
}

export function AdvancedAnalyticsPanel({ context, className }: AdvancedAnalyticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, metrics, dashboards, error, lastRefresh, fetchAnalytics, startAutoRefresh, stopAutoRefresh } = useAdvancedAnalytics();

  useEffect(() => {
    if (context) startAutoRefresh(context, 90000);
    else stopAutoRefresh();
    return () => stopAutoRefresh();
  }, [context?.entityId]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Analytics inactivo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Advanced Analytics</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}` : 'Sincronizando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => fetchAnalytics(context)} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Métricas</span>
                  </div>
                  <p className="text-xl font-bold">{metrics.length}</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Dashboards</span>
                  </div>
                  <p className="text-xl font-bold">{dashboards.length}</p>
                </div>
              </div>
              {metrics.slice(0, 5).map((m) => (
                <div key={m.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{m.metric_name}</span>
                    <Badge variant="outline">{m.metric_type}</Badge>
                  </div>
                  <p className="text-lg font-bold mt-1">{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AdvancedAnalyticsPanel;
