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
  Shield,
  FileText,
  Users,
  BarChart3,
  Rocket,
  Store,
  Tags,
  RotateCcw,
  FlaskConical,
  Download,
  Layout
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
  ModuleAutonomousAgentPanel,
  ModuleTestingPanel,
  ModuleSecurityPanel,
  ModuleDocumentationPanel,
  ModuleCollaborationPanel,
  ModuleAnalyticsPanel,
  ModuleDeploymentPanel,
  ModuleMarketplacePanel,
  ModuleVersioningPanel,
  ModuleRollbackPanel,
  ModuleABTestingPanel,
  ModuleExportImportPanel,
  ModuleTemplatesPanel,
  ModuleStudioHelpButton
} from '@/components/admin/module-studio';
import type { ModuleContext } from '@/hooks/admin/useModuleCopilot';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { IMPLEMENTED_MODULE_KEYS } from '@/components/admin/modules/implementedModules';


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

  // Layout: ensure columns always add up to 12 so panels don't wrap off-screen
  const copilotCols = showCopilot ? (showPreview ? 2 : 3) : 0;
  const previewCols = showPreview ? 2 : 0;
  const agentCols = showAgent ? 2 : 0;
  const mainCols = 12 - 2 - copilotCols - previewCols - agentCols;

  const mainColSpanClass = (
    {
      10: 'col-span-10',
      8: 'col-span-8',
      7: 'col-span-7',
      6: 'col-span-6',
      5: 'col-span-5',
      4: 'col-span-4',
    } as const
  )[mainCols as 4 | 5 | 6 | 7 | 8 | 10] ?? 'col-span-6';

  // Header actions for GlobalNavHeader
  const headerTitleActions = (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1 text-xs">
        <Network className="h-3 w-3" />
        {graph.nodes.size} módulos
      </Badge>
      <Badge variant="outline" className="gap-1 text-xs">
        <GitBranch className="h-3 w-3" />
        {dependencies.length} dependencias
      </Badge>
    </div>
  );

  const headerRightSlot = (
    <div className="flex items-center gap-1.5">
      <ModuleStudioHelpButton />
      <Button variant="outline" size="sm" onClick={handleRefreshAll} className="h-8">
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Refrescar
      </Button>
      <Button 
        variant={showPreview ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setShowPreview(!showPreview)}
        className="h-8"
      >
        <Eye className="h-3.5 w-3.5 mr-1.5" />
        Preview
      </Button>
      <Button 
        variant={showCopilot ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setShowCopilot(!showCopilot)}
        className="h-8"
      >
        <Bot className="h-3.5 w-3.5 mr-1.5" />
        Copilot
      </Button>
      <Button 
        variant={showAgent ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setShowAgent(!showAgent)}
        className="h-8"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        Agent
      </Button>
    </div>
  );

  return (
    <DashboardLayout
      title="Module Studio"
      subtitle="Editor visual con análisis de impacto y sandbox"
      titleActions={headerTitleActions}
      rightSlot={headerRightSlot}
    >
      <div className="space-y-4">
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
                        const hasDeps = depCount > 0;
                        const isImplemented = IMPLEMENTED_MODULE_KEYS.has(mod.module_key);
                        
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
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm truncate flex-1">{mod.module_name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge
                                  variant={isImplemented ? 'default' : 'outline'}
                                  className="h-5 px-1.5 text-[10px]"
                                  title={isImplemented ? 'Implementado' : 'No implementado'}
                                >
                                  {isImplemented ? '✓' : '○'}
                                </Badge>

                                <Badge
                                  variant={hasDeps ? 'secondary' : 'outline'}
                                  className="h-5 px-1.5 text-[10px] gap-1"
                                  title={hasDeps ? `${depCount} dependencias` : 'Sin dependencias'}
                                >
                                  <GitBranch className="h-3 w-3" />
                                  {depCount}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {mod.is_core && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Core</Badge>}
                              {mod.is_required && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Req</Badge>}
                            </div>
                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                ↓{depCount} ↑{depByCount}
                              </span>
                              <span>v{mod.version || '1.0.0'}</span>
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
          <div className={mainColSpanClass}>
            {selectedModule && selectedModuleData ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                  <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="overview">
                      <Package className="h-4 w-4 mr-1" />
                      Info
                    </TabsTrigger>
                    <TabsTrigger value="dependencies">
                      <GitBranch className="h-4 w-4 mr-1" />
                      Deps
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-1" />
                      Historial
                    </TabsTrigger>
                    <TabsTrigger value="sandbox">
                      <TestTube2 className="h-4 w-4 mr-1" />
                      Sandbox
                    </TabsTrigger>
                    <TabsTrigger value="testing">
                      <TestTube2 className="h-4 w-4 mr-1" />
                      Tests
                    </TabsTrigger>
                    <TabsTrigger value="security">
                      <Shield className="h-4 w-4 mr-1" />
                      Seguridad
                    </TabsTrigger>
                    <TabsTrigger value="docs">
                      <FileText className="h-4 w-4 mr-1" />
                      Docs
                    </TabsTrigger>
                    <TabsTrigger value="collaboration">
                      <Users className="h-4 w-4 mr-1" />
                      Equipo
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="deployment">
                      <Rocket className="h-4 w-4 mr-1" />
                      Deploy
                    </TabsTrigger>
                    <TabsTrigger value="marketplace">
                      <Store className="h-4 w-4 mr-1" />
                      Market
                    </TabsTrigger>
                    <TabsTrigger value="versioning">
                      <Tags className="h-4 w-4 mr-1" />
                      Versiones
                    </TabsTrigger>
                    <TabsTrigger value="rollback">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Rollback
                    </TabsTrigger>
                    <TabsTrigger value="abtesting">
                      <FlaskConical className="h-4 w-4 mr-1" />
                      A/B Test
                    </TabsTrigger>
                    <TabsTrigger value="export">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                      <Layout className="h-4 w-4 mr-1" />
                      Templates
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

                <TabsContent value="testing" className="mt-0">
                  <ModuleTestingPanel 
                    context={selectedModuleData ? { moduleKey: selectedModule, moduleName: selectedModuleData.module_name } : null}
                  />
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                  <ModuleSecurityPanel 
                    context={selectedModuleData ? { moduleKey: selectedModule, moduleName: selectedModuleData.module_name } : null}
                  />
                </TabsContent>

                <TabsContent value="docs" className="mt-0">
                  <ModuleDocumentationPanel 
                    context={selectedModuleData ? { moduleKey: selectedModule, moduleName: selectedModuleData.module_name } : null}
                  />
                </TabsContent>

                <TabsContent value="collaboration" className="mt-0">
                  <ModuleCollaborationPanel 
                    context={selectedModuleData ? { moduleKey: selectedModule, moduleName: selectedModuleData.module_name } : null}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <ModuleAnalyticsPanel moduleKey={selectedModule} />
                </TabsContent>

                <TabsContent value="deployment" className="mt-0">
                  <ModuleDeploymentPanel moduleKey={selectedModule} />
                </TabsContent>

                <TabsContent value="marketplace" className="mt-0">
                  <ModuleMarketplacePanel 
                    onInstall={(key) => {
                      refetchModules();
                      toast.success(`Módulo ${key} instalado correctamente`);
                    }}
                  />
                </TabsContent>

                <TabsContent value="versioning" className="mt-0">
                  <ModuleVersioningPanel moduleKey={selectedModule} />
                </TabsContent>

                <TabsContent value="rollback" className="mt-0">
                  <ModuleRollbackPanel moduleKey={selectedModule} />
                </TabsContent>

                <TabsContent value="abtesting" className="mt-0">
                  <ModuleABTestingPanel moduleKey={selectedModule} />
                </TabsContent>

                <TabsContent value="export" className="mt-0">
                  <ModuleExportImportPanel moduleKey={selectedModule} />
                </TabsContent>

                <TabsContent value="templates" className="mt-0">
                  <ModuleTemplatesPanel onCreateModule={(key) => {
                    setSelectedModule(key);
                    refetchModules();
                  }} />
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
