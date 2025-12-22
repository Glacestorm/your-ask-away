import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, FileText } from 'lucide-react';
import { DafoBoard } from '@/components/strategic-planning/DafoBoard';
import { BusinessPlanEvaluator } from '@/components/strategic-planning/BusinessPlanEvaluator';
import { StrategicAssistantChat } from '@/components/strategic-planning/StrategicAssistantChat';

export default function StrategicPlanningPage() {
  const [activeTab, setActiveTab] = useState('dafo');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Planificación Estratégica
            </h1>
            <p className="text-muted-foreground mt-1">
              Análisis DAFO con IA y Evaluador de Business Plan con coaching inteligente
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dafo" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Análisis DAFO</span>
              <span className="sm:hidden">DAFO</span>
            </TabsTrigger>
            <TabsTrigger value="business-plan" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Business Plan</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dafo">
            <DafoBoard />
          </TabsContent>

          <TabsContent value="business-plan">
            <BusinessPlanEvaluator />
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
