/**
 * ModuleStudioPage - Enterprise Module Management System
 * Editor visual completo para módulos con análisis de impacto, grafo de dependencias y sandbox
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  Package, 
  GitBranch, 
  History, 
  TestTube2, 
  RefreshCw,
  Network,
  Search,
  Edit3,
  Sparkles,
  Eye,
  Bot,
  PanelRightClose,
  PanelRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModuleDependencyGraph } from '@/hooks/admin/useModuleDependencyGraph';
import { useModuleChangeHistory } from '@/hooks/admin/useModuleChangeHistory';
import { 
  ModuleDependencyGraph,
  ModuleEditor,
  ModuleSandboxPanel,
  ModuleImpactAnalysis,
  ModuleCopilotPanel,
  ModulePreviewPanel,
  ModuleAutonomousAgentPanel
} from '@/components/admin/module-studio';
import type { ModuleContext } from '@/hooks/admin/useModuleCopilot';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export default function ModuleStudioPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [showCopilot, setShowCopilot] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showAgent, setShowAgent] = useState(true);
  const { graph, dependencies, isLoading: graphLoading, refetch: refetchGraph } = useModuleDependencyGraph();
  const { history, versions, refetch: refetchHistory } = useModuleChangeHistory(selectedModule || undefined);

  // Fetch modules
  const { data: modules, isLoading, refetch: refetchModules } = useQuery({
    queryKey: ['app-modules-studio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('module_name');
      if (error) throw error;
      return data;
    },
  });

  // Filtrar módulos por búsqueda
  const filteredModules = useMemo(() => {
    if (!modules) return [];
    if (!searchQuery.trim()) return modules;
    const query = searchQuery.toLowerCase();
    return modules.filter(m => 
      m.module_name.toLowerCase().includes(query) ||
      m.module_key.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query) ||
      m.category?.toLowerCase().includes(query)
    );
  }, [modules, searchQuery]);

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const selectedModuleData = modules?.find(m => m.module_key === selectedModule);

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchModules(),
      refetchGraph(),
      refetchHistory()
    ]);
    toast.success('Datos actualizados');
  };

  const handleSaveModule = async (data: Record<string, unknown>) => {
    if (!selectedModule) return;
    
    try {
      const { error } = await supabase
        .from('app_modules')
        .update({
          module_name: data.module_name as string,
          description: data.description as string,
          features: data.features as Json,
          version: data.version as string,
          dependencies: data.dependencies as string[],
          base_price: data.base_price as number,
          updated_at: new Date().toISOString()
        })
        .eq('module_key', selectedModule);
      
      if (error) throw error;
      
      await refetchModules();
      setIsEditing(false);
      toast.success('Módulo actualizado correctamente');
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Error al guardar el módulo');
    }
  };

  // Create module data object for components
  const moduleDataForComponents = selectedModuleData ? {
    module_key: selectedModuleData.module_key,
    module_name: selectedModuleData.module_name,
    description: selectedModuleData.description,
    features: selectedModuleData.features,
    version: selectedModuleData.version,
    dependencies: selectedModuleData.dependencies,
    category: selectedModuleData.category,
    base_price: selectedModuleData.base_price,
    sector: selectedModuleData.sector,
    is_core: selectedModuleData.is_core,
    is_required: selectedModuleData.is_required,
  } : {};

  // Create copilot context (compatible with both ModuleContext and ModuleAgentContext)
  const copilotContext: ModuleContext | null = selectedModuleData ? {
    moduleKey: selectedModuleData.module_key,
    moduleName: selectedModuleData.module_name,
    currentState: moduleDataForComponents,
    dependencies: selectedModuleData.dependencies || [],
    dependents: graph.nodes.get(selectedModuleData.module_key)?.dependents || [],
  } : null;

  // Create agent context (same structure as copilotContext but typed for agent)
  const agentContext = copilotContext ? {
    moduleKey: copilotContext.moduleKey,
    moduleName: copilotContext.moduleName,
    currentState: copilotContext.currentState,
    dependencies: copilotContext.dependencies,
    dependents: copilotContext.dependents,
  } : null;

  return (
    <DashboardLayout
      title="Module Studio"
      subtitle="Sistema de gestión de módulos enterprise"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Module Studio</h1>
              <p className="text-muted-foreground">Editor visual con análisis de impacto y sandbox</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="gap-1">
              <Network className="h-3 w-3" />
              {graph.nodes.size} módulos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <GitBranch className="h-3 w-3" />
              {dependencies.length} dependencias
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefreshAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refrescar
            </Button>
            <Button 
              variant={showPreview ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant={showCopilot ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setShowCopilot(!showCopilot)}
            >
              <Bot className="h-4 w-4 mr-2" />
              Copilot
            </Button>
            <Button 
              variant={showAgent ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setShowAgent(!showAgent)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Agent
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar - Module List */}
          <div className="col-span-2">
            <Card className="h-[calc(100vh-240px)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Módulos ({filteredModules.length})</span>
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar módulos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-360px)]">
                  <div className="p-2 space-y-1">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredModules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No se encontraron módulos
                      </div>
                    ) : (
                      filteredModules.map(mod => {
                        const node = graph.nodes.get(mod.module_key);
                        const depCount = node?.dependencies.length || 0;
                        const depByCount = node?.dependents.length || 0;
                        
                        return (
                          <button
                            key={mod.id}
                            onClick={() => {
                              setSelectedModule(mod.module_key);
                              setIsEditing(false);
                              setShowImpactAnalysis(false);
                            }}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              selectedModule === mod.module_key 
                                ? 'bg-primary/10 border border-primary/30 shadow-sm' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{mod.module_name}</span>
                              <div className="flex gap-1">
                                {mod.is_core && <Badge variant="secondary" className="text-xs">Core</Badge>}
                                {mod.is_required && <Badge variant="destructive" className="text-xs">Req</Badge>}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                              <span>↓{depCount} ↑{depByCount}</span>
                              <span>v{mod.version || '1.0.0'}</span>
                              <span className="capitalize">{mod.category}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className={`${showCopilot && showPreview ? 'col-span-6' : showCopilot || showPreview ? 'col-span-8' : 'col-span-10'}`}>
            {selectedModule && selectedModuleData ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="overview">
                      <Package className="h-4 w-4 mr-2" />
                      Información
                    </TabsTrigger>
                    <TabsTrigger value="dependencies">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Dependencias
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-2" />
                      Historial
                    </TabsTrigger>
                    <TabsTrigger value="sandbox">
                      <TestTube2 className="h-4 w-4 mr-2" />
                      Sandbox
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowImpactAnalysis(!showImpactAnalysis)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Análisis IA
                    </Button>
                    <Button 
                      variant={isEditing ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  </div>
                </div>

                {/* Impact Analysis Panel */}
                {showImpactAnalysis && (
                  <ModuleImpactAnalysis
                    moduleKey={selectedModule}
                    currentState={moduleDataForComponents}
                    proposedState={moduleDataForComponents}
                  />
                )}

                <TabsContent value="overview" className="mt-0">
                  {isEditing ? (
                    <ModuleEditor
                      module={selectedModuleData}
                      onSave={handleSaveModule}
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {selectedModuleData.module_name}
                          {selectedModuleData.is_core && <Badge>Core</Badge>}
                          {selectedModuleData.is_required && <Badge variant="destructive">Requerido</Badge>}
                        </CardTitle>
                        <CardDescription>{selectedModuleData.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Versión</p>
                            <p className="text-xl font-bold">{selectedModuleData.version || '1.0.0'}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Categoría</p>
                            <p className="text-xl font-bold capitalize">{selectedModuleData.category}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Precio Base</p>
                            <p className="text-xl font-bold">
                              {selectedModuleData.base_price ? `${selectedModuleData.base_price}€` : 'Gratis'}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Sector</p>
                            <p className="text-xl font-bold capitalize">{selectedModuleData.sector || 'General'}</p>
                          </div>
                        </div>

                        {/* Features */}
                        {selectedModuleData.features && (
                          <div>
                            <h4 className="font-medium mb-3">Características</h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(selectedModuleData.features) 
                                ? (selectedModuleData.features as string[]).map((feat, i) => (
                                    <Badge key={i} variant="outline">{String(feat)}</Badge>
                                  ))
                                : typeof selectedModuleData.features === 'object'
                                  ? Object.entries(selectedModuleData.features).map(([key, value]) => (
                                      <Badge key={key} variant="outline">{key}: {String(value)}</Badge>
                                    ))
                                  : null
                              }
                            </div>
                          </div>
                        )}

                        {/* Dependencies */}
                        {selectedModuleData.dependencies && selectedModuleData.dependencies.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3">Dependencias Declaradas</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedModuleData.dependencies.map((dep, i) => (
                                <Badge key={i} variant="secondary">{dep}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="dependencies" className="mt-0">
                  <ModuleDependencyGraph
                    selectedModule={selectedModule}
                    onModuleSelect={setSelectedModule}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Cambios</CardTitle>
                      <CardDescription>Versiones y modificaciones del módulo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {versions.length > 0 ? (
                        <div className="space-y-3">
                          {versions.map(v => (
                            <div key={v.id} className="p-4 border rounded-lg flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={v.is_latest ? 'default' : 'outline'}>v{v.version}</Badge>
                                  {v.is_latest && <Badge variant="secondary">Latest</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {v.release_notes || 'Sin notas de versión'}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(v.published_at).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>Sin historial de versiones registrado</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sandbox" className="mt-0">
                  <ModuleSandboxPanel
                    moduleKey={selectedModule}
                    moduleData={moduleDataForComponents}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-[calc(100vh-240px)] flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Elige un módulo de la lista para ver sus detalles, editar configuración,
                    analizar dependencias y probar cambios en sandbox
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* AI Copilot Panel */}
          {showCopilot && (
            <div className={showPreview ? "col-span-2" : "col-span-3"}>
              <ModuleCopilotPanel
                moduleContext={copilotContext}
                className="h-[calc(100vh-240px)] sticky top-4"
              />
            </div>
          )}

          {/* Live Preview Panel */}
          {showPreview && (
            <div className="col-span-2">
              <ModulePreviewPanel
                moduleData={moduleDataForComponents}
                className="h-[calc(100vh-240px)] sticky top-4"
              />
            </div>
          )}

          {/* Autonomous Agent Panel */}
          {showAgent && (
            <div className="col-span-2">
              <ModuleAutonomousAgentPanel
                context={agentContext}
                className="h-[calc(100vh-240px)] sticky top-4"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
