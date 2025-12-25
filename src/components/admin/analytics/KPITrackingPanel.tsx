import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Target, TrendingUp, TrendingDown, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { useKPITracking } from '@/hooks/admin/analytics';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface KPITrackingPanelProps {
  context?: { entityId?: string; entityType?: string; category?: string; timeRange?: string };
  className?: string;
}

export function KPITrackingPanel({ context, className }: KPITrackingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, kpis, goals, error, lastRefresh, fetchKPIs, startAutoRefresh, stopAutoRefresh } = useKPITracking();

  useEffect(() => {
    if (context) startAutoRefresh(context, 60000);
    else stopAutoRefresh();
    return () => stopAutoRefresh();
  }, [context?.entityId]);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { on_track: 'bg-green-500', at_risk: 'bg-yellow-500', off_track: 'bg-red-500', exceeded: 'bg-blue-500' };
    return colors[status] || 'bg-muted';
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">KPI Tracking inactivo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">KPI Tracking</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}` : 'Sincronizando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => fetchKPIs(context)} disabled={isLoading} className="h-8 w-8">
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
              {kpis.map((kpi) => (
                <div key={kpi.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{kpi.name}</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(kpi.trend)}
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(kpi.status))} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold">{kpi.current_value}</span>
                    <span className="text-xs text-muted-foreground">/ {kpi.target_value} {kpi.unit}</span>
                  </div>
                  <Progress value={(kpi.current_value / kpi.target_value) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default KPITrackingPanel;
