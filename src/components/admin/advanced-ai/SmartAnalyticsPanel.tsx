/**
 * Smart Analytics Panel - FASE 12
 * AI-powered analytics with natural language queries
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Maximize2,
  Minimize2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { useSmartAnalytics, SmartMetric, AnalyticsInsight, DataPattern } from '@/hooks/admin/advanced/useSmartAnalytics';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SmartAnalyticsPanelProps {
  context?: {
    entityId: string;
    entityType?: string;
    dateRange?: { start: string; end: string };
  } | null;
  className?: string;
}

const trendIcons = {
  up: <TrendingUp className="h-4 w-4 text-green-500" />,
  down: <TrendingDown className="h-4 w-4 text-red-500" />,
  stable: <Minus className="h-4 w-4 text-muted-foreground" />
};

export function SmartAnalyticsPanel({ context, className }: SmartAnalyticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const {
    isLoading,
    metrics,
    insights,
    patterns,
    lastRefresh,
    initialize,
    queryNaturalLanguage,
    discoverPatterns
  } = useSmartAnalytics();

  const handleAsk = useCallback(async () => {
    if (!query.trim()) return;
    await queryNaturalLanguage(query);
    setQuery('');
  }, [query, queryNaturalLanguage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleRefresh = useCallback(() => {
    if (context?.dateRange) {
      initialize({
        dateRange: context.dateRange,
        granularity: 'daily'
      });
      discoverPatterns();
    }
  }, [context, initialize, discoverPatterns]);

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
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Smart Analytics
                <Badge variant="secondary" className="text-xs">AI</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
        {/* Natural Language Query */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pregunta sobre tus datos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleAsk} disabled={isLoading || !query.trim()}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[280px]"}>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {metrics.slice(0, 4).map((metric: SmartMetric) => (
              <div 
                key={metric.id}
                className="p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{metric.name}</span>
                  {trendIcons[metric.trend as keyof typeof trendIcons]}
                </div>
                <p className="text-lg font-bold">{metric.value}</p>
                <p className={cn(
                  "text-xs",
                  (metric.changePercent || 0) > 0 ? "text-green-500" : (metric.changePercent || 0) < 0 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {(metric.changePercent || 0) > 0 ? '+' : ''}{metric.changePercent || 0}% vs anterior
                </p>
              </div>
            ))}
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Insights AI
              </h4>
              <div className="space-y-2">
                {insights.map((insight: AnalyticsInsight) => (
                  <div 
                    key={insight.id}
                    className={cn(
                      "p-3 rounded-lg border-l-4",
                      insight.severity === 'success' ? "border-l-green-500 bg-green-500/5" :
                      insight.severity === 'warning' ? "border-l-yellow-500 bg-yellow-500/5" :
                      insight.severity === 'critical' ? "border-l-red-500 bg-red-500/5" :
                      "border-l-blue-500 bg-blue-500/5"
                    )}
                  >
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                    {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-primary">
                          💡 {insight.suggestedActions[0]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {patterns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Patrones Detectados</h4>
              <div className="space-y-2">
                {patterns.map((pattern: DataPattern) => (
                  <div 
                    key={pattern.id}
                    className="p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span>{pattern.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {pattern.patternType}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metrics.length === 0 && insights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay datos para analizar</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleRefresh}
              >
                Cargar métricas
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default SmartAnalyticsPanel;
