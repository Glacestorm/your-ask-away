/**
 * ModuleStudioPage - Enterprise Module Management System
 * Editor visual completo para módulos con análisis de impacto y sandbox
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  GitBranch, 
  History, 
  TestTube2, 
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Network
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModuleDependencyGraph } from '@/hooks/admin/useModuleDependencyGraph';
import { useModuleChangeHistory } from '@/hooks/admin/useModuleChangeHistory';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ModuleStudioPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  const { graph, dependencies, isLoading: graphLoading } = useModuleDependencyGraph();
  const { history, versions } = useModuleChangeHistory(selectedModule || undefined);

  // Fetch modules
  const { data: modules, isLoading } = useQuery({
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

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const selectedModuleData = modules?.find(m => m.module_key === selectedModule);

  return (
    <DashboardLayout
      title="Module Studio"
      subtitle="Sistema de gestión de módulos enterprise"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Module Studio</h1>
              <p className="text-muted-foreground">Editor visual con análisis de impacto y sandbox</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <Network className="h-3 w-3" />
              {graph.nodes.size} módulos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <GitBranch className="h-3 w-3" />
              {dependencies.length} dependencias
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Module List */}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-240px)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Módulos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="p-2 space-y-1">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      modules?.map(mod => {
                        const node = graph.nodes.get(mod.module_key);
                        const depCount = node?.dependencies.length || 0;
                        const depByCount = node?.dependents.length || 0;
                        
                        return (
                          <button
                            key={mod.id}
                            onClick={() => setSelectedModule(mod.module_key)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedModule === mod.module_key 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{mod.module_name}</span>
                              {mod.is_core && <Badge variant="secondary" className="text-xs">Core</Badge>}
                            </div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                ↓{depCount} ↑{depByCount}
                              </span>
                              <span className="text-xs text-muted-foreground">v{mod.version || '1.0.0'}</span>
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
          <div className="col-span-9">
            {selectedModule && selectedModuleData ? (
              <Tabs defaultValue="overview" className="space-y-4">
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

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {selectedModuleData.module_name}
                        {selectedModuleData.is_core && <Badge>Core</Badge>}
                      </CardTitle>
                      <CardDescription>{selectedModuleData.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
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
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dependencies">
                  <Card>
                    <CardHeader>
                      <CardTitle>Grafo de Dependencias</CardTitle>
                      <CardDescription>Relaciones con otros módulos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Depende de ({graph.nodes.get(selectedModule)?.dependencies.length || 0})
                          </h4>
                          <div className="space-y-2">
                            {graph.nodes.get(selectedModule)?.dependencies.map(dep => (
                              <div key={dep} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <span className="font-medium">{dep}</span>
                              </div>
                            ))}
                            {(graph.nodes.get(selectedModule)?.dependencies.length || 0) === 0 && (
                              <p className="text-muted-foreground text-sm">Sin dependencias</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            Dependientes ({graph.nodes.get(selectedModule)?.dependents.length || 0})
                          </h4>
                          <div className="space-y-2">
                            {graph.nodes.get(selectedModule)?.dependents.map(dep => (
                              <div key={dep} className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <span className="font-medium">{dep}</span>
                              </div>
                            ))}
                            {(graph.nodes.get(selectedModule)?.dependents.length || 0) === 0 && (
                              <p className="text-muted-foreground text-sm">Sin dependientes</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Cambios</CardTitle>
                      <CardDescription>Versiones y modificaciones</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {versions.length > 0 ? versions.map(v => (
                          <div key={v.id} className="p-4 border rounded-lg flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={v.is_latest ? 'default' : 'outline'}>v{v.version}</Badge>
                                {v.is_latest && <Badge variant="secondary">Latest</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{v.release_notes || 'Sin notas'}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(v.published_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                        )) : (
                          <p className="text-muted-foreground text-center py-8">Sin historial de versiones</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sandbox">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sandbox de Pruebas</CardTitle>
                      <CardDescription>Prueba cambios antes de aplicarlos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <TestTube2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">Crear Sandbox</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Crea un entorno de pruebas para modificar el módulo sin afectar producción
                        </p>
                        <Button>
                          <TestTube2 className="h-4 w-4 mr-2" />
                          Nuevo Sandbox
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-[calc(100vh-240px)] flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
                  <p className="text-sm text-muted-foreground">
                    Elige un módulo de la lista para ver sus detalles y editarlo
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
