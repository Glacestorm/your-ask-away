import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, LayoutDashboard } from 'lucide-react';
import { FinancialModel } from '@/components/strategic-planning/FinancialModel';
import { ScenarioSimulator } from '@/components/strategic-planning/ScenarioSimulator';
import { ExecutiveDashboard } from '@/components/strategic-planning/ExecutiveDashboard';
import { StrategicAssistantChat } from '@/components/strategic-planning/StrategicAssistantChat';

export default function FinancialViabilityPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calculator className="h-8 w-8 text-primary" />
              Viabilidad Financiera
            </h1>
            <p className="text-muted-foreground mt-1">
              Modelo financiero a 5 años con simulador de escenarios y análisis de viabilidad
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Panel</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Modelo Financiero</span>
              <span className="sm:hidden">Financiero</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Escenarios</span>
              <span className="sm:hidden">Escenarios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ExecutiveDashboard onNavigate={handleNavigate} />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialModel />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenarioSimulator />
          </TabsContent>
        </Tabs>

        {/* AI Assistant Chat */}
        <StrategicAssistantChat 
          context={activeTab as 'dafo' | 'business-plan' | 'financial' | 'scenarios'} 
        />
      </div>
    </div>
  );
}
