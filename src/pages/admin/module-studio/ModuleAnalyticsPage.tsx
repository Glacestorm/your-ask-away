/**
 * ModuleAnalyticsPage - Analytics de módulos
 * Métricas, Gráficos históricos, Performance y Logs en vivo
 */

import { ModuleStudioLayout } from '@/layouts/ModuleStudioLayout';
import { useModuleStudioContext } from '@/contexts/ModuleStudioContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  LineChart, 
  Zap, 
  ScrollText,
  Cpu,
  Package
} from 'lucide-react';
import { 
  ModuleAnalyticsPanel,
  ModuleHistoricalChartsPanel,
  ModulePerformancePanel,
  ModuleResourceMetricsPanel,
  ModuleLiveLogsPanel
} from '@/components/admin/module-studio';

export default function ModuleAnalyticsPage() {
  const { selectedModule, selectedModuleKey, copilotContext } = useModuleStudioContext();

  if (!selectedModule) {
    return (
      <ModuleStudioLayout title="Analytics">
        <Card className="border-dashed h-[calc(100vh-280px)] flex items-center justify-center">
          <CardContent className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Selecciona un módulo</h3>
            <p className="text-muted-foreground text-sm">
              Elige un módulo del panel izquierdo para ver sus analytics.
            </p>
          </CardContent>
        </Card>
      </ModuleStudioLayout>
    );
  }

  return (
    <ModuleStudioLayout title="Analytics">
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="historical" className="gap-2">
            <LineChart className="h-4 w-4" />
            Históricos
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Cpu className="h-4 w-4" />
            Recursos
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-0">
          <ModuleAnalyticsPanel moduleKey={selectedModuleKey!} />
        </TabsContent>

        <TabsContent value="historical" className="mt-0">
          <ModuleHistoricalChartsPanel moduleKey={selectedModuleKey!} />
        </TabsContent>

        <TabsContent value="performance" className="mt-0">
          <ModulePerformancePanel />
        </TabsContent>

        <TabsContent value="resources" className="mt-0">
          <ModuleResourceMetricsPanel />
        </TabsContent>

        <TabsContent value="logs" className="mt-0">
          <ModuleLiveLogsPanel moduleKey={selectedModuleKey} />
        </TabsContent>
      </Tabs>
    </ModuleStudioLayout>
  );
}
