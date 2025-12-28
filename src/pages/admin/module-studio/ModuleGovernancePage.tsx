/**
 * ModuleGovernancePage - Governance de módulos
 * Seguridad, Documentación y Colaboración
 */

import { ModuleStudioLayout } from '@/layouts/ModuleStudioLayout';
import { useModuleStudioContext } from '@/contexts/ModuleStudioContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  FileText, 
  Users,
  Package
} from 'lucide-react';
import { 
  ModuleSecurityPanel,
  ModuleDocumentationPanel,
  ModuleCollaborationPanel
} from '@/components/admin/module-studio';

export default function ModuleGovernancePage() {
  const { selectedModule, selectedModuleKey } = useModuleStudioContext();

  if (!selectedModule) {
    return (
      <ModuleStudioLayout title="Governance">
        <Card className="border-dashed h-[calc(100vh-280px)] flex items-center justify-center">
          <CardContent className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
            <p className="text-muted-foreground text-sm">
              Elige un módulo del panel izquierdo para gestionar su governance.
            </p>
          </CardContent>
        </Card>
      </ModuleStudioLayout>
    );
  }

  return (
    <ModuleStudioLayout title="Governance">
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentación
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-0">
          <ModuleSecurityPanel context={{ moduleKey: selectedModuleKey!, moduleName: selectedModule.module_name }} />
        </TabsContent>

        <TabsContent value="docs" className="mt-0">
          <ModuleDocumentationPanel context={{ moduleKey: selectedModuleKey!, moduleName: selectedModule.module_name }} />
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <ModuleCollaborationPanel context={{ moduleKey: selectedModuleKey!, moduleName: selectedModule.module_name }} />
        </TabsContent>
      </Tabs>
    </ModuleStudioLayout>
  );
}
