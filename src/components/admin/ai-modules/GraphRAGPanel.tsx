/**
 * GraphRAG Panel
 * 
 * Panel de Knowledge Graph con RAG para soporte:
 * - Grafo de conocimiento dinámico
 * - Contexto de cliente 360°
 * - Patrones de aprendizaje
 * - Consultas semánticas
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Network,
  Search,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sparkles,
  AlertTriangle,
  Users,
  Lightbulb,
  Link,
  Brain,
} from 'lucide-react';
import { useGraphRAG } from '@/hooks/admin/support/useGraphRAG';
import { cn } from '@/lib/utils';

interface GraphRAGPanelProps {
  context: {
    entityId: string;
    entityType?: string;
    customerId?: string;
  } | null;
  className?: string;
}

export function GraphRAGPanel({ context, className }: GraphRAGPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    nodes,
    edges,
    customerContext,
    learningPatterns,
    isLoading,
    error,
    searchGraph,
    getCustomerContext,
  } = useGraphRAG();

  useEffect(() => {
    if (context?.customerId) {
      getCustomerContext(context.customerId);
    }
  }, [context?.customerId, getCustomerContext]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    await searchGraph({
      query: searchQuery,
      maxDepth: 3,
      minConfidence: 0.5,
      includeContext: true,
    });
  }, [searchQuery, searchGraph]);

  const handleRefresh = useCallback(async () => {
    if (context?.customerId) {
      await getCustomerContext(context.customerId);
    }
  }, [context?.customerId, getCustomerContext]);

  // Inactive state
  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Network className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            GraphRAG inactivo
          </p>
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
      <CardHeader className="pb-2 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-primary">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                GraphRAG
                <Badge variant="secondary" className="text-xs">Fase 3</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Knowledge Graph Inteligente
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
        <ScrollArea className={isExpanded ? "h-[calc(100vh-200px)]" : "h-[280px]"}>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Buscar en el grafo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleSearch} disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Graph Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-primary">{nodes.length}</div>
                <div className="text-xs text-muted-foreground">Nodos</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold text-accent">{edges.length}</div>
                <div className="text-xs text-muted-foreground">Relaciones</div>
              </div>
            </div>

            {/* Customer Context */}
            {customerContext && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Contexto Cliente</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interacciones</span>
                    <span className="font-medium">{customerContext.totalInteractions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Satisfacción</span>
                    <Badge variant={customerContext.satisfactionTrend > 0 ? "default" : "destructive"}>
                      {customerContext.satisfactionTrend > 0 ? '+' : ''}{customerContext.satisfactionTrend}%
                    </Badge>
                  </div>
                  {customerContext.knownIssues.length > 0 && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Issues conocidos:</span>
                      <div className="flex flex-wrap gap-1">
                        {customerContext.knownIssues.slice(0, 3).map((issue, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{issue}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Learning Patterns */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  Patrones Aprendidos
                </span>
              </div>

              {learningPatterns.length > 0 ? (
                <div className="space-y-2">
                  {learningPatterns.slice(0, 3).map((pattern) => (
                    <div key={pattern.id} className="p-2 rounded-lg border text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {pattern.patternType.replace('_', ' ')}
                        </Badge>
                        <span className="text-muted-foreground">
                          {Math.round(pattern.confidence * 100)}% confianza
                        </span>
                      </div>
                      <p className="text-muted-foreground">{pattern.description}</p>
                      {pattern.actionable && pattern.suggestedAction && (
                        <div className="flex items-center gap-1 text-primary">
                          <Sparkles className="h-3 w-3" />
                          {pattern.suggestedAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Sin patrones detectados
                </p>
              )}
            </div>

            {/* Recent Nodes */}
            {nodes.length > 0 && (
              <div className="pt-4 border-t">
                <span className="text-sm font-medium mb-2 block">Nodos Recientes</span>
                <div className="space-y-1">
                  {nodes.slice(0, 4).map((node) => (
                    <div key={node.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-xs">
                      <Link className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">{node.type}</Badge>
                      <span className="truncate flex-1">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {error}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default GraphRAGPanel;
