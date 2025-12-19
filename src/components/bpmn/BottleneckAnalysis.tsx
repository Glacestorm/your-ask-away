import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, TrendingDown, ArrowUpRight } from 'lucide-react';
import type { ProcessEvent, BottleneckData } from '@/types/bpmn';

interface RawBottleneck {
  avg_duration_ms?: number;
  bottleneck_score?: number;
  event_count?: number;
  max_duration_ms?: number;
  min_duration_ms?: number;
  node_id?: string;
}

interface BottleneckAnalysisProps {
  bottlenecks: BottleneckData[] | RawBottleneck[] | undefined;
  events: ProcessEvent[];
}

export function BottleneckAnalysis({ bottlenecks = [], events }: BottleneckAnalysisProps) {
  const normalizedBottlenecks = (bottlenecks || []).map((b: BottleneckData | RawBottleneck) => ({
    nodeId: ('node_id' in b ? b.node_id : (b as BottleneckData).nodeId) || 'unknown',
    avgDurationMs: ('avg_duration_ms' in b ? b.avg_duration_ms : (b as BottleneckData).avgDurationMs) || 0,
    maxDurationMs: ('max_duration_ms' in b ? b.max_duration_ms : (b as BottleneckData).maxDurationMs) || 0,
    minDurationMs: ('min_duration_ms' in b ? b.min_duration_ms : (b as BottleneckData).minDurationMs) || 0,
    eventCount: ('event_count' in b ? b.event_count : (b as BottleneckData).eventCount) || 0,
    bottleneckScore: ('bottleneck_score' in b ? b.bottleneck_score : (b as BottleneckData).bottleneckScore) || 0,
  }));

  const getSeverityColor = (score: number) => {
    if (score >= 0.8) return 'text-destructive';
    if (score >= 0.5) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getSeverityBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="destructive">Crítico</Badge>;
    if (score >= 0.5) return <Badge className="bg-warning text-warning-foreground">Moderado</Badge>;
    return <Badge variant="secondary">Bajo</Badge>;
  };

  const formatDuration = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) return `${Math.round(ms / (1000 * 60))} min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  // Calculate additional metrics from events
  const stateMetrics = React.useMemo(() => {
    const metrics = new Map<string, { 
      entries: number; 
      exits: number; 
      avgStay: number;
      stuck: number;
    }>();

    const byEntity = new Map<string, ProcessEvent[]>();
    events.forEach(e => {
      if (!byEntity.has(e.entity_id)) byEntity.set(e.entity_id, []);
      byEntity.get(e.entity_id)!.push(e);
    });

    byEntity.forEach(entityEvents => {
      const sorted = entityEvents.sort(
        (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
      );

      for (let i = 0; i < sorted.length; i++) {
        const state = sorted[i].to_state || sorted[i].action;
        if (!metrics.has(state)) {
          metrics.set(state, { entries: 0, exits: 0, avgStay: 0, stuck: 0 });
        }
        const m = metrics.get(state)!;
        m.entries++;

        if (i < sorted.length - 1) {
          m.exits++;
          const stayTime = new Date(sorted[i + 1].occurred_at).getTime() - 
                          new Date(sorted[i].occurred_at).getTime();
          m.avgStay = (m.avgStay * (m.exits - 1) + stayTime) / m.exits;
        } else {
          const age = Date.now() - new Date(sorted[i].occurred_at).getTime();
          if (age > 24 * 60 * 60 * 1000) {
            m.stuck++;
          }
        }
      }
    });

    return metrics;
  }, [events]);

  const stuckStates = Array.from(stateMetrics.entries())
    .filter(([_, m]) => m.stuck > 0)
    .sort((a, b) => b[1].stuck - a[1].stuck);

  return (
    <div className="space-y-6">
      {/* Bottleneck Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {normalizedBottlenecks.filter(b => b.bottleneckScore >= 0.8).length}
                </div>
                <p className="text-sm text-muted-foreground">Cuellos críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-warning/10">
                <TrendingDown className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stuckStates.reduce((acc, [_, m]) => acc + m.stuck, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Casos atascados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {normalizedBottlenecks.length > 0 
                    ? formatDuration(
                        normalizedBottlenecks.reduce((acc, b) => acc + b.avgDurationMs, 0) / normalizedBottlenecks.length
                      )
                    : '--'}
                </div>
                <p className="text-sm text-muted-foreground">Tiempo promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cuellos de Botella Detectados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {normalizedBottlenecks.length > 0 ? (
            <div className="space-y-4">
              {normalizedBottlenecks
                .sort((a, b) => b.bottleneckScore - a.bottleneckScore)
                .map((bottleneck, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{bottleneck.nodeId}</h4>
                        <p className="text-sm text-muted-foreground">
                          {bottleneck.eventCount} ocurrencias
                        </p>
                      </div>
                      {getSeverityBadge(bottleneck.bottleneckScore)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                        <p className="font-medium">
                          {formatDuration(bottleneck.avgDurationMs)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Máximo</p>
                        <p className="font-medium">
                          {formatDuration(bottleneck.maxDurationMs)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className={`font-medium ${getSeverityColor(bottleneck.bottleneckScore)}`}>
                          {(bottleneck.bottleneckScore * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <Progress 
                      value={bottleneck.bottleneckScore * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No se han detectado cuellos de botella
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stuck Cases */}
      {stuckStates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Estados con Casos Atascados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stuckStates.slice(0, 5).map(([state, metrics]) => (
                <div 
                  key={state}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <span className="font-medium">{state}</span>
                    <p className="text-sm text-muted-foreground">
                      {metrics.entries} entradas, {metrics.exits} salidas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {metrics.stuck} atascados
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
