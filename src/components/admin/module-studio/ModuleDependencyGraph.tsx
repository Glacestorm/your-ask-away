/**
 * ModuleDependencyGraph - Grafo visual de dependencias entre módulos
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Network, 
  Package, 
  GitBranch, 
  AlertTriangle, 
  CheckCircle2,
  Circle,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModuleDependencyGraph, DependencyNode } from '@/hooks/admin/useModuleDependencyGraph';

interface ModuleDependencyGraphProps {
  selectedModule?: string | null;
  onModuleSelect?: (moduleKey: string) => void;
  className?: string;
}

export function ModuleDependencyGraph({ 
  selectedModule, 
  onModuleSelect,
  className 
}: ModuleDependencyGraphProps) {
  const { graph, dependencies, isLoading, checkCompatibility } = useModuleDependencyGraph();
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);

  // Organizar nodos por nivel
  const nodesByLevel = useMemo(() => {
    const levels: Map<number, DependencyNode[]> = new Map();
    graph.nodes.forEach(node => {
      const level = node.level;
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level)!.push(node);
    });
    return levels;
  }, [graph.nodes]);

  // Calcular posiciones de nodos
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const levelCount = nodesByLevel.size;
    const containerWidth = 800;
    const containerHeight = 500;
    const levelHeight = containerHeight / (levelCount + 1);

    nodesByLevel.forEach((nodes, level) => {
      const nodeWidth = containerWidth / (nodes.length + 1);
      nodes.forEach((node, index) => {
        positions.set(node.module_key, {
          x: nodeWidth * (index + 1),
          y: levelHeight * (levelCount - level),
        });
      });
    });

    return positions;
  }, [nodesByLevel]);

  const getNodeColor = (node: DependencyNode) => {
    if (node.isCore) return 'from-violet-500 to-purple-600';
    if (node.module_key === selectedModule) return 'from-blue-500 to-cyan-600';
    if (node.dependents.includes(selectedModule || '')) return 'from-amber-500 to-orange-600';
    if (node.dependencies.includes(selectedModule || '')) return 'from-emerald-500 to-green-600';
    return 'from-slate-400 to-slate-500';
  };

  const getEdgeColor = (from: string, to: string) => {
    if (from === selectedModule) return '#3b82f6'; // blue
    if (to === selectedModule) return '#f59e0b'; // amber
    return '#94a3b8'; // slate
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Cargando grafo...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Grafo de Dependencias
            </CardTitle>
            <CardDescription>
              {graph.nodes.size} módulos · {dependencies.length} dependencias
              {graph.hasCycles && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Ciclos detectados
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowLabels(!showLabels)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div 
            className="relative bg-gradient-to-br from-muted/20 to-muted/40"
            style={{ 
              width: 800 * zoom, 
              height: 500 * zoom,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            }}
          >
            {/* SVG para líneas */}
            <svg 
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
              {graph.edges.map((edge, i) => {
                const fromPos = nodePositions.get(edge.from);
                const toPos = nodePositions.get(edge.to);
                if (!fromPos || !toPos) return null;

                return (
                  <line
                    key={i}
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={getEdgeColor(edge.from, edge.to)}
                    strokeWidth={edge.from === selectedModule || edge.to === selectedModule ? 2 : 1}
                    strokeOpacity={0.6}
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>

            {/* Nodos */}
            {Array.from(graph.nodes.values()).map(node => {
              const pos = nodePositions.get(node.module_key);
              if (!pos) return null;

              const isSelected = node.module_key === selectedModule;
              const isRelated = node.dependencies.includes(selectedModule || '') || 
                               node.dependents.includes(selectedModule || '');

              return (
                <Tooltip key={node.module_key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onModuleSelect?.(node.module_key)}
                      className={cn(
                        "absolute flex items-center justify-center rounded-full transition-all duration-200",
                        "bg-gradient-to-br shadow-lg hover:scale-110",
                        getNodeColor(node),
                        isSelected && "ring-2 ring-primary ring-offset-2",
                        isRelated && "ring-1 ring-amber-500"
                      )}
                      style={{
                        left: pos.x - 20,
                        top: pos.y - 20,
                        width: isSelected ? 48 : 40,
                        height: isSelected ? 48 : 40,
                      }}
                    >
                      <Package className="h-4 w-4 text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{node.module_key}</p>
                      <p className="text-xs text-muted-foreground">
                        Nivel: {node.level} · 
                        Deps: {node.dependencies.length} · 
                        Dependientes: {node.dependents.length}
                      </p>
                      {node.isCore && <Badge variant="secondary">Core</Badge>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Labels */}
            {showLabels && Array.from(graph.nodes.values()).map(node => {
              const pos = nodePositions.get(node.module_key);
              if (!pos) return null;

              return (
                <div
                  key={`label-${node.module_key}`}
                  className="absolute text-xs font-medium text-foreground/80 whitespace-nowrap pointer-events-none"
                  style={{
                    left: pos.x - 40,
                    top: pos.y + 24,
                    width: 80,
                    textAlign: 'center',
                  }}
                >
                  {node.module_key.replace('_', ' ').slice(0, 12)}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Leyenda */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 fill-violet-500 text-violet-500" />
            <span>Core</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>Dependiente</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
            <span>Dependencia</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            <span>Depende de</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ModuleDependencyGraph;
