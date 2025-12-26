/**
 * Real-Time Insights Panel - FASE 12
 * Live AI-generated insights and alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Maximize2,
  Minimize2,
  Zap,
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useRealTimeInsights, RealTimeInsight } from '@/hooks/admin/advanced/useRealTimeInsights';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealTimeInsightsPanelProps {
  context?: {
    entityId: string;
    entityType?: string;
  } | null;
  className?: string;
}

const severityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500'
};

const typeIcons = {
  alert: <AlertTriangle className="h-4 w-4 text-white" />,
  opportunity: <TrendingUp className="h-4 w-4 text-white" />,
  risk: <AlertTriangle className="h-4 w-4 text-white" />,
  trend: <TrendingUp className="h-4 w-4 text-white" />,
  anomaly: <AlertTriangle className="h-4 w-4 text-white" />,
  milestone: <CheckCircle className="h-4 w-4 text-white" />,
  info: <Info className="h-4 w-4 text-white" />
};

export function RealTimeInsightsPanel({ context, className }: RealTimeInsightsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const {
    isConnected,
    insights,
    stats,
    connect,
    disconnect,
    acknowledgeInsight,
    clearInsights
  } = useRealTimeInsights();

  useEffect(() => {
    if (context?.entityId) {
      connect({
        organizationId: context.entityId
      });
    }
    return () => { 
      disconnect(); 
    };
  }, [context?.entityId, connect, disconnect]);

  const unreadCount = insights.filter(i => !i.acknowledged).length;

  const handleDismiss = useCallback((insightId: string) => {
    acknowledgeInsight(insightId);
  }, [acknowledgeInsight]);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600",
              isConnected && "animate-pulse"
            )}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Insights en Tiempo Real
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="h-8 w-8"
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-red-500/10">
              <p className="text-lg font-bold text-red-500">{stats.bySeverity?.critical || 0}</p>
              <p className="text-xs text-muted-foreground">Críticos</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-orange-500/10">
              <p className="text-lg font-bold text-orange-500">{stats.bySeverity?.high || 0}</p>
              <p className="text-xs text-muted-foreground">Alto</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-500/10">
              <p className="text-lg font-bold text-yellow-500">{stats.bySeverity?.medium || 0}</p>
              <p className="text-xs text-muted-foreground">Medio</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-500/10">
              <p className="text-lg font-bold text-blue-500">{stats.bySeverity?.low || 0}</p>
              <p className="text-xs text-muted-foreground">Bajo</p>
            </div>
          </div>
        )}

        <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[280px]"}>
          <div className="space-y-2">
            {insights.map((insight: RealTimeInsight) => (
              <div 
                key={insight.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  !insight.acknowledged && "bg-primary/5 border-primary/20",
                  insight.acknowledged && "bg-card opacity-75"
                )}
                onClick={() => !insight.acknowledged && acknowledgeInsight(insight.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-1.5 rounded-full shrink-0",
                    severityColors[insight.severity as keyof typeof severityColors]
                  )}>
                    {typeIcons[insight.type as keyof typeof typeIcons] || <Info className="h-4 w-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{insight.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(insight.id);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.source.table}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(insight.createdAt), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                    {insight.actions && insight.actions.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {insight.actions.map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {insights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay insights recientes</p>
                <p className="text-xs mt-1">
                  {isConnected ? 'Esperando nuevos eventos...' : 'Conectando...'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RealTimeInsightsPanel;
