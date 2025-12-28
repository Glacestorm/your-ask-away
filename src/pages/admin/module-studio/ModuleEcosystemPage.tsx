/**
 * ModuleEcosystemPage - Ecosystem de módulos
 * Marketplace, Templates y Export/Import
 */

import { ModuleStudioLayout } from '@/layouts/ModuleStudioLayout';
import { useModuleStudioContext } from '@/contexts/ModuleStudioContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Store, 
  Layout, 
  Download,
  Package
} from 'lucide-react';
import { 
  ModuleMarketplacePanel,
  ModuleTemplatesPanel,
  ModuleExportImportPanel
} from '@/components/admin/module-studio';

export default function ModuleEcosystemPage() {
  const { selectedModule, selectedModuleKey } = useModuleStudioContext();

  if (!selectedModule) {
    return (
      <ModuleStudioLayout title="Ecosystem">
        <Card className="border-dashed h-[calc(100vh-280px)] flex items-center justify-center">
          <CardContent className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
            <p className="text-muted-foreground text-sm">
              Elige un módulo del panel izquierdo para acceder al ecosystem.
            </p>
          </CardContent>
        </Card>
      </ModuleStudioLayout>
    );
  }

  return (
    <ModuleStudioLayout title="Ecosystem">
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marketplace" className="gap-2">
            <Store className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Layout className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Export/Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-0">
          <ModuleMarketplacePanel />
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <ModuleTemplatesPanel />
        </TabsContent>

        <TabsContent value="export" className="mt-0">
          <ModuleExportImportPanel moduleKey={selectedModuleKey} />
        </TabsContent>
      </Tabs>
    </ModuleStudioLayout>
  );
}
