import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Circle } from 'lucide-react';
import type { ProcessEvent } from '@/types/bpmn';

interface ProcessFlowVisualizationProps {
  events: ProcessEvent[];
  selectedDefinition?: string | null;
}

interface FlowNode {
  state: string;
  count: number;
  avgDuration: number;
}

interface FlowEdge {
  from: string;
  to: string;
  count: number;
  avgDuration: number;
}

export function ProcessFlowVisualization({ 
  events, 
  selectedDefinition 
}: ProcessFlowVisualizationProps) {
  
  const { nodes, edges, maxCount } = useMemo(() => {
    const nodeMap = new Map<string, { count: number; durations: number[] }>();
    const edgeMap = new Map<string, { count: number; durations: number[] }>();

    // Sort events by entity and time
    const sortedEvents = [...events].sort((a, b) => {
      if (a.entity_id !== b.entity_id) return a.entity_id.localeCompare(b.entity_id);
      return new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
    });

    // Group by entity
    const entitiesMap = new Map<string, ProcessEvent[]>();
    sortedEvents.forEach(event => {
      if (!entitiesMap.has(event.entity_id)) {
        entitiesMap.set(event.entity_id, []);
      }
      entitiesMap.get(event.entity_id)!.push(event);
    });

    // Analyze transitions
    entitiesMap.forEach(entityEvents => {
      for (let i = 0; i < entityEvents.length; i++) {
        const event = entityEvents[i];
        const state = event.to_state || event.action;
        
        // Count nodes
        if (!nodeMap.has(state)) {
          nodeMap.set(state, { count: 0, durations: [] });
        }
        const nodeData = nodeMap.get(state)!;
        nodeData.count++;

        // Calculate duration to next state
        if (i < entityEvents.length - 1) {
          const nextEvent = entityEvents[i + 1];
          const duration = new Date(nextEvent.occurred_at).getTime() - 
                          new Date(event.occurred_at).getTime();
          nodeData.durations.push(duration);
          
          const nextState = nextEvent.to_state || nextEvent.action;
          const edgeKey = `${state}|${nextState}`;
          
          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, { count: 0, durations: [] });
          }
          const edgeData = edgeMap.get(edgeKey)!;
          edgeData.count++;
          edgeData.durations.push(duration);
        }
      }
    });

    const nodes: FlowNode[] = Array.from(nodeMap.entries()).map(([state, data]) => ({
      state,
      count: data.count,
      avgDuration: data.durations.length > 0 
        ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length / 1000 / 60 // minutes
        : 0
    }));

    const edges: FlowEdge[] = Array.from(edgeMap.entries()).map(([key, data]) => {
      const [from, to] = key.split('|');
      return {
        from,
        to,
        count: data.count,
        avgDuration: data.durations.length > 0
          ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length / 1000 / 60
          : 0
      };
    });

    const maxCount = Math.max(...nodes.map(n => n.count), 1);

    return { nodes: nodes.sort((a, b) => b.count - a.count), edges, maxCount };
  }, [events]);

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
    return `${(minutes / 1440).toFixed(1)}d`;
  };

  const getNodeColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-primary text-primary-foreground';
    if (intensity > 0.4) return 'bg-primary/70 text-primary-foreground';
    return 'bg-muted text-muted-foreground';
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No hay eventos para visualizar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* States/Nodes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estados del Proceso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nodes.slice(0, 10).map(node => (
              <div 
                key={node.state}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Circle className={`h-3 w-3 ${
                    node.count / maxCount > 0.5 ? 'text-primary fill-primary' : 'text-muted-foreground'
                  }`} />
                  <span className="font-medium">{node.state}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {node.count.toLocaleString()} ocurrencias
                  </Badge>
                  {node.avgDuration > 0 && (
                    <Badge variant="outline">
                      ⏱ {formatDuration(node.avgDuration)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transitions/Edges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transiciones Frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {edges
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map((edge, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium truncate max-w-[120px]" title={edge.from}>
                      {edge.from}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate max-w-[120px]" title={edge.to}>
                      {edge.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary">
                      {edge.count}x
                    </Badge>
                    {edge.avgDuration > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(edge.avgDuration)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            {edges.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No hay transiciones registradas
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flow Diagram (simplified) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Diagrama de Flujo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center py-8">
            {nodes.slice(0, 8).map((node, idx) => (
              <React.Fragment key={node.state}>
                <div 
                  className={`px-4 py-3 rounded-lg border-2 ${getNodeColor(node.count)} 
                    transition-all hover:scale-105 cursor-pointer`}
                  style={{
                    minWidth: '120px',
                    textAlign: 'center'
                  }}
                >
                  <div className="font-medium text-sm">{node.state}</div>
                  <div className="text-xs opacity-80 mt-1">
                    {node.count} casos
                  </div>
                </div>
                {idx < Math.min(nodes.length - 1, 7) && (
                  <ArrowRight className="h-6 w-6 text-muted-foreground self-center" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
