import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Users, 
  PieChart, 
  Activity,
  Brain
} from 'lucide-react';
import MRRWaterfallChart from './MRRWaterfallChart';
import RevenueForecastDashboard from './RevenueForecastDashboard';
import LTVAnalysisPanel from './LTVAnalysisPanel';
import PLGSignalsTracker from './PLGSignalsTracker';
import RevenueScoreCard from './RevenueScoreCard';
import PrioritizationMatrix from './PrioritizationMatrix';
import RevenueAttributionChart from './RevenueAttributionChart';
import MonteCarloSimulator from './MonteCarloSimulator';

const RevenueIntelligenceHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Intelligence Hub</h1>
          <p className="text-muted-foreground">
            Centro unificado de inteligencia de ingresos con ML predictivo
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary">
          <Brain className="h-5 w-5" />
          <span className="text-sm font-medium">AI-Powered Analytics</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="overview" className="flex flex-col gap-1 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex flex-col gap-1 py-3">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="ltv" className="flex flex-col gap-1 py-3">
            <Target className="h-4 w-4" />
            <span className="text-xs">LTV</span>
          </TabsTrigger>
          <TabsTrigger value="plg" className="flex flex-col gap-1 py-3">
            <Zap className="h-4 w-4" />
            <span className="text-xs">PLG Signals</span>
          </TabsTrigger>
          <TabsTrigger value="scoring" className="flex flex-col gap-1 py-3">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex flex-col gap-1 py-3">
            <Users className="h-4 w-4" />
            <span className="text-xs">Priority</span>
          </TabsTrigger>
          <TabsTrigger value="attribution" className="flex flex-col gap-1 py-3">
            <PieChart className="h-4 w-4" />
            <span className="text-xs">Attribution</span>
          </TabsTrigger>
          <TabsTrigger value="montecarlo" className="flex flex-col gap-1 py-3">
            <Brain className="h-4 w-4" />
            <span className="text-xs">Monte Carlo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  MRR Waterfall
                </CardTitle>
                <CardDescription>
                  Desglose de movimientos de MRR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MRRWaterfallChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Revenue Score
                </CardTitle>
                <CardDescription>
                  Salud de ingresos en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueScoreCard />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  PLG Signals
                </CardTitle>
                <CardDescription>
                  Señales de crecimiento detectadas
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                <PLGSignalsTracker />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Attribution
                </CardTitle>
                <CardDescription>
                  Atribución de ingresos por canal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueAttributionChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Top LTV Accounts
                </CardTitle>
                <CardDescription>
                  Cuentas con mayor valor de vida
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                <LTVAnalysisPanel />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast">
          <RevenueForecastDashboard />
        </TabsContent>

        <TabsContent value="ltv">
          <LTVAnalysisPanel />
        </TabsContent>

        <TabsContent value="plg">
          <PLGSignalsTracker />
        </TabsContent>

        <TabsContent value="scoring">
          <RevenueScoreCard />
        </TabsContent>

        <TabsContent value="priority">
          <PrioritizationMatrix />
        </TabsContent>

        <TabsContent value="attribution">
          <RevenueAttributionChart />
        </TabsContent>

        <TabsContent value="montecarlo">
          <MonteCarloSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueIntelligenceHub;
