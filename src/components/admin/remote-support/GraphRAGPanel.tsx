import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Network, 
  Search, 
  Database, 
  Brain,
  GitBranch,
  Lightbulb,
  History,
  RefreshCw,
  Plus,
  Link2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useGraphRAG, GraphQuery } from '@/hooks/admin/support/useGraphRAG';
import { cn } from '@/lib/utils';

interface GraphRAGPanelProps {
  customerId?: string;
  sessionId?: string;
  className?: string;
}

export function GraphRAGPanel({ customerId, sessionId, className }: GraphRAGPanelProps) {
  const [activeTab, setActiveTab] = useState('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const {
    isLoading,
    nodes: graphNodes,
    edges: graphEdges,
    customerContext,
    learningPatterns: learnedPatterns,
    graphStats,
    searchGraph,
    getCustomerContext,
    learnFromResolution,
    fetchGraphStats
  } = useGraphRAG();

  useEffect(() => {
    if (customerId) {
      getCustomerContext(customerId);
    }
  }, [customerId, getCustomerContext]);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      const query: GraphQuery = {
        query: searchQuery,
        maxDepth: 3,
        minConfidence: 0.5,
        includeContext: true
      };
      const result = await searchGraph(query);
      if (result) {
        setSearchResults(result.nodes.map(node => ({
          title: node.label,
          content: JSON.stringify(node.properties),
          relevance: node.relevanceScore,
          relatedNodes: result.edges
            .filter(e => e.sourceId === node.id || e.targetId === node.id)
            .map(e => e.relationship)
        })));
      }
    }
  }, [searchGraph, searchQuery]);

  const handleRefreshGraph = useCallback(async () => {
    await fetchGraphStats();
  }, [fetchGraphStats]);

  const handleLearnPattern = useCallback(async () => {
    if (sessionId) {
      await learnFromResolution(
        'Ejemplo de problema',
        'Ejemplo de solución',
        ['Paso 1', 'Paso 2'],
        0.8,
        sessionId
      );
    }
  }, [learnFromResolution, sessionId]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-indigo-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                GraphRAG
                <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 text-xs">
                  Knowledge Graph
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Memoria contextual infinita con aprendizaje continuo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshGraph} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <Database className="h-4 w-4 mx-auto text-purple-400" />
            <p className="text-lg font-bold">{graphStats?.totalNodes || graphNodes.length}</p>
            <p className="text-xs text-muted-foreground">Nodos</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <Link2 className="h-4 w-4 mx-auto text-violet-400" />
            <p className="text-lg font-bold">{graphStats?.totalEdges || graphEdges.length}</p>
            <p className="text-xs text-muted-foreground">Relaciones</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <Brain className="h-4 w-4 mx-auto text-indigo-400" />
            <p className="text-lg font-bold">{learnedPatterns.length}</p>
            <p className="text-xs text-muted-foreground">Patrones</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <History className="h-4 w-4 mx-auto text-cyan-400" />
            <p className="text-lg font-bold">{customerContext?.totalInteractions || 0}</p>
            <p className="text-xs text-muted-foreground">Historial</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="graph" className="text-xs">
              <GitBranch className="h-3 w-3 mr-1" />
              Grafo
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              Búsqueda
            </TabsTrigger>
            <TabsTrigger value="context" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              Contexto
            </TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Patrones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="space-y-4">
            {/* Graph Visualization Placeholder */}
            <div className="h-[250px] rounded-lg border bg-gradient-to-br from-purple-500/5 to-violet-500/5 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {graphNodes.length > 0 ? (
                  <div className="relative w-full h-full p-4">
                    {/* Simplified graph visualization */}
                    {graphNodes.slice(0, 10).map((node, idx) => (
                      <div
                        key={node.id}
                        className="absolute p-2 rounded-full bg-primary/20 border border-primary/30 text-xs"
                        style={{
                          left: `${20 + (idx % 5) * 18}%`,
                          top: `${20 + Math.floor(idx / 5) * 40}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <span className="truncate max-w-[60px] block">{node.label}</span>
                      </div>
                    ))}
                    {/* Draw some edges */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {graphEdges.slice(0, 5).map((edge, idx) => (
                        <line
                          key={idx}
                          x1={`${25 + (idx % 3) * 20}%`}
                          y1={`${30 + Math.floor(idx / 3) * 30}%`}
                          x2={`${45 + (idx % 2) * 15}%`}
                          y2={`${50 + Math.floor(idx / 2) * 20}%`}
                          stroke="hsl(var(--primary))"
                          strokeOpacity="0.3"
                          strokeWidth="1"
                        />
                      ))}
                    </svg>
                  </div>
                ) : (
                  <div className="text-center">
                    <Network className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Construye el grafo de conocimiento
                    </p>
                    <Button onClick={handleRefreshGraph} className="mt-3" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Construir Grafo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Node Types Legend */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-purple-400 mr-1" />
                Problemas
              </Badge>
              <Badge variant="outline" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-1" />
                Soluciones
              </Badge>
              <Badge variant="outline" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-1" />
                Clientes
              </Badge>
              <Badge variant="outline" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1" />
                Productos
              </Badge>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            {/* Semantic Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Buscar en el knowledge graph..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[250px]">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Busca en el grafo de conocimiento</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">{result.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {result.content}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(result.relevance * 100)}%
                        </Badge>
                      </div>
                      {result.relatedNodes && result.relatedNodes.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {result.relatedNodes.slice(0, 3).map((node: string, nIdx: number) => (
                            <Badge key={nIdx} variant="outline" className="text-xs">
                              {node}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="context" className="space-y-4">
            {customerContext ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Contexto del Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Historial:</span>
                      <span className="ml-2 font-medium">{customerContext.sessionHistory?.length || 0} sesiones</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tendencia:</span>
                      <span className="ml-2 font-medium">{customerContext.satisfactionTrend}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Interacciones:</span>
                      <span className="ml-2 font-medium">{customerContext.totalInteractions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Última:</span>
                      <span className="ml-2 font-medium">{customerContext.lastInteraction || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-medium text-sm mb-3">Patrones de Interacción</h4>
                  <div className="space-y-2">
                    {customerContext.interactionPatterns?.map((pattern, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{pattern.patternType}</span>
                        <Badge variant="outline" className="text-xs">
                          {pattern.frequency}x
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-xs text-muted-foreground">Sin patrones registrados</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecciona un cliente para ver su contexto</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Patrones Aprendidos</h4>
              <Button size="sm" variant="outline" onClick={handleLearnPattern}>
                <Plus className="h-3 w-3 mr-1" />
                Registrar
              </Button>
            </div>

            <ScrollArea className="h-[280px]">
              {learnedPatterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay patrones registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {learnedPatterns.map((pattern, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="font-medium text-sm">{pattern.patternType}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            pattern.confidence >= 0.8 ? "border-green-500/50 text-green-400" :
                            pattern.confidence >= 0.5 ? "border-yellow-500/50 text-yellow-400" :
                            "border-red-500/50 text-red-400"
                          )}
                        >
                          {Math.round(pattern.confidence * 100)}% confianza
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Validaciones: {pattern.validationCount}</span>
                        <span>•</span>
                        <span>{pattern.actionable ? 'Accionable' : 'Informativo'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default GraphRAGPanel;
