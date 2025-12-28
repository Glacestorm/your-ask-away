/**
 * ModuleDevelopmentPage - Desarrollo de módulos
 * Editor, Sandbox, Tests y Dependencias
 */

import { useState } from 'react';
import { useModuleStudioContext } from '@/contexts/ModuleStudioContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  TestTube2, 
  GitBranch, 
  Code,
  Sparkles,
  Package
} from 'lucide-react';
import { 
  ModuleEditor, 
  ModuleSandboxPanel, 
  ModuleTestingPanel, 
  ModuleDependencyGraph,
  ModuleDependenciesPanel,
  ModuleImpactAnalysis
} from '@/components/admin/module-studio';
import { Json } from '@/integrations/supabase/types';

export default function ModuleDevelopmentPage() {
  const { 
    selectedModule, 
    selectedModuleKey,
    saveModule,
    graph 
  } = useModuleStudioContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);

  const handleSaveModule = async (data: Record<string, unknown>) => {
    const success = await saveModule({
      module_name: data.module_name as string,
      description: data.description as string,
      features: data.features as Json,
      version: data.version as string,
      dependencies: data.dependencies as string[],
      base_price: data.base_price as number,
    });
    if (success) {
      setIsEditing(false);
    }
  };

  // Datos del módulo para componentes
  const moduleDataForComponents = selectedModule ? {
    module_key: selectedModule.module_key,
    module_name: selectedModule.module_name,
    description: selectedModule.description,
    features: selectedModule.features,
    version: selectedModule.version,
    dependencies: selectedModule.dependencies,
    category: selectedModule.category,
    base_price: selectedModule.base_price,
    sector: selectedModule.sector,
    is_core: selectedModule.is_core,
    is_required: selectedModule.is_required,
  } : {};

  if (!selectedModule) {
    return (
      <Card className="border-dashed h-[calc(100vh-280px)] flex items-center justify-center">
        <CardContent className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
          <p className="text-muted-foreground text-sm">
            Elige un módulo del panel izquierdo para comenzar a desarrollar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="editor" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="editor" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="gap-2">
            <Code className="h-4 w-4" />
            Sandbox
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <TestTube2 className="h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Dependencias
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

      {/* Impact Analysis */}
      {showImpactAnalysis && selectedModuleKey && (
        <ModuleImpactAnalysis
          moduleKey={selectedModuleKey}
          currentState={moduleDataForComponents}
          proposedState={moduleDataForComponents}
        />
      )}

      {/* Editor Tab */}
      <TabsContent value="editor" className="mt-0">
        {isEditing ? (
          <ModuleEditor
            module={selectedModule as any}
            onSave={handleSaveModule}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedModule.module_name}
                {selectedModule.is_core && <Badge>Core</Badge>}
                {selectedModule.is_required && <Badge variant="destructive">Requerido</Badge>}
              </CardTitle>
              <CardDescription>{selectedModule.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Versión</p>
                  <p className="text-lg font-semibold">{selectedModule.version || '1.0.0'}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <p className="text-lg font-semibold capitalize">{selectedModule.category}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sector</p>
                  <p className="text-lg font-semibold capitalize">{selectedModule.sector || 'General'}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Precio Base</p>
                  <p className="text-lg font-semibold">
                    {selectedModule.base_price ? `€${selectedModule.base_price}` : 'Incluido'}
                  </p>
                </div>
              </div>

              {/* Features */}
              {selectedModule.features && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Características</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(selectedModule.features) 
                      ? (selectedModule.features as string[]).map((f, i) => (
                          <Badge key={i} variant="outline">{f}</Badge>
                        ))
                      : <Badge variant="outline">Ver JSON</Badge>
                    }
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {selectedModule.dependencies && selectedModule.dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Dependencias</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.dependencies.map((dep, i) => (
                      <Badge key={i} variant="secondary">{dep}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Sandbox Tab */}
      <TabsContent value="sandbox" className="mt-0">
        <ModuleSandboxPanel 
          moduleKey={selectedModuleKey!} 
          moduleData={moduleDataForComponents}
        />
      </TabsContent>

      {/* Tests Tab */}
      <TabsContent value="tests" className="mt-0">
        <ModuleTestingPanel context={{ moduleKey: selectedModuleKey!, moduleName: selectedModule.module_name }} />
      </TabsContent>

      {/* Dependencies Tab */}
      <TabsContent value="dependencies" className="mt-0 space-y-4">
        <ModuleDependencyGraph 
          selectedModule={selectedModuleKey}
          onModuleSelect={(key) => {}} 
        />
        <ModuleDependenciesPanel moduleKey={selectedModuleKey!} />
      </TabsContent>
    </Tabs>
  );
}
