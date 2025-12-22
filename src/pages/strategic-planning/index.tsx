import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, FileText, Calculator, TrendingUp, Sparkles } from 'lucide-react';
import { DafoBoard } from '@/components/strategic-planning/DafoBoard';
import { BusinessPlanEvaluator } from '@/components/strategic-planning/BusinessPlanEvaluator';
import { FinancialModel } from '@/components/strategic-planning/FinancialModel';
import { ScenarioSimulator } from '@/components/strategic-planning/ScenarioSimulator';

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
              Planificación Estratégica & Viabilidad
            </h1>
            <p className="text-muted-foreground mt-1">
              Análisis DAFO, evaluación de planes de negocio y proyecciones financieras
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Asistente IA
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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

          <TabsContent value="dafo">
            <DafoBoard />
          </TabsContent>

          <TabsContent value="business-plan">
            <BusinessPlanEvaluator />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialModel />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenarioSimulator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
