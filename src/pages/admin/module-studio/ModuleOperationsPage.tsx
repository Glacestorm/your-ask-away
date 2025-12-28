/**
 * ModuleOperationsPage - Operaciones de módulos
 * Deploy, Versioning, Rollback, A/B Testing y Configuración
 */

import { ModuleStudioLayout } from '@/layouts/ModuleStudioLayout';
import { useModuleStudioContext } from '@/contexts/ModuleStudioContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Rocket, 
  Tags, 
  RotateCcw, 
  FlaskConical,
  Settings,
  Bell,
  Package
} from 'lucide-react';
import { 
  ModuleDeploymentPanel,
  ModuleVersioningPanel,
  ModuleRollbackPanel,
  ModuleABTestingPanel,
  ModuleConfigurationPanel,
  ModuleAlertsConfigPanel
} from '@/components/admin/module-studio';

export default function ModuleOperationsPage() {
  const { selectedModule, selectedModuleKey } = useModuleStudioContext();

  if (!selectedModule) {
    return (
      <ModuleStudioLayout title="Operations">
        <Card className="border-dashed h-[calc(100vh-280px)] flex items-center justify-center">
          <CardContent className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
            <p className="text-muted-foreground text-sm">
              Elige un módulo del panel izquierdo para gestionar sus operaciones.
            </p>
          </CardContent>
        </Card>
      </ModuleStudioLayout>
    );
  }

  return (
    <ModuleStudioLayout title="Operations">
      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deploy" className="gap-2">
            <Rocket className="h-4 w-4" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="versioning" className="gap-2">
            <Tags className="h-4 w-4" />
            Versiones
          </TabsTrigger>
          <TabsTrigger value="rollback" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Rollback
          </TabsTrigger>
          <TabsTrigger value="abtesting" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            A/B Testing
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="mt-0">
          <ModuleDeploymentPanel moduleKey={selectedModuleKey!} />
        </TabsContent>

        <TabsContent value="versioning" className="mt-0">
          <ModuleVersioningPanel moduleKey={selectedModuleKey!} />
        </TabsContent>

        <TabsContent value="rollback" className="mt-0">
          <ModuleRollbackPanel moduleKey={selectedModuleKey!} />
        </TabsContent>

        <TabsContent value="abtesting" className="mt-0">
          <ModuleABTestingPanel moduleKey={selectedModuleKey!} />
        </TabsContent>

        <TabsContent value="config" className="mt-0">
          <ModuleConfigurationPanel moduleKey={selectedModuleKey!} />
        </TabsContent>

        <TabsContent value="alerts" className="mt-0">
          <ModuleAlertsConfigPanel />
        </TabsContent>
      </Tabs>
    </ModuleStudioLayout>
  );
}
