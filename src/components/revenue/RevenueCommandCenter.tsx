import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LayoutDashboard, Calculator, AlertTriangle, Workflow, Bot, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { RevenueCopilotChat } from './RevenueCopilotChat';
import { RevenueScenarioPlanner } from './RevenueScenarioPlanner';
import { RevenueAnomalyMonitor } from './RevenueAnomalyMonitor';
import { RevenueWorkflowManager } from './RevenueWorkflowManager';
import { useRevenueAnomalyAlerts } from '@/hooks/useRevenueAnomalyAlerts';

const mockMetrics = {
  mrr: 125000,
  mrrChange: 4.2,
  nrr: 112,
  churnRate: 2.8,
  expansionRate: 8.5,
};

export const RevenueCommandCenter = () => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const { alerts } = useRevenueAnomalyAlerts();
  const openAlertsCount = alerts?.filter(a => a.status === 'open').length || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="h-full flex flex-col">
      {/* Header con métricas clave */}
      <div className="border-b bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Revenue Command Center</h1>
            <p className="text-sm text-muted-foreground">Centro de control avanzado para operaciones de revenue</p>
          </div>
          <Sheet open={isCopilotOpen} onOpenChange={setIsCopilotOpen}>
            <SheetTrigger asChild>
              <Button variant="default" className="gap-2">
                <Bot className="h-4 w-4" />
                AI Copilot
                <Badge variant="secondary" className="ml-1">Beta</Badge>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[450px] p-0">
              <RevenueCopilotChat />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              MRR
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{formatCurrency(mockMetrics.mrr)}</span>
              <Badge variant={mockMetrics.mrrChange >= 0 ? 'default' : 'destructive'} className="text-xs">
                {mockMetrics.mrrChange >= 0 ? '+' : ''}{mockMetrics.mrrChange}%
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              NRR
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{mockMetrics.nrr}%</span>
              <Badge variant="outline" className="text-xs">Target: 110%</Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5" />
              Churn Rate
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{mockMetrics.churnRate}%</span>
              <Badge variant="secondary" className="text-xs">Mensual</Badge>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Expansion
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{mockMetrics.expansionRate}%</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Alertas
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{openAlertsCount}</span>
              {openAlertsCount > 0 && (
                <Badge variant="destructive" className="text-xs">Abiertas</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="scenarios" className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="scenarios" className="gap-2">
                <Calculator className="h-4 w-4" />
                Scenario Planner
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Anomalías
                {openAlertsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {openAlertsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="workflows" className="gap-2">
                <Workflow className="h-4 w-4" />
                Workflows
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="scenarios" className="mt-0 h-full">
              <RevenueScenarioPlanner />
            </TabsContent>

            <TabsContent value="anomalies" className="mt-0 h-full">
              <RevenueAnomalyMonitor />
            </TabsContent>

            <TabsContent value="workflows" className="mt-0 h-full">
              <RevenueWorkflowManager />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default RevenueCommandCenter;
