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
  Brain,
  Shield,
  LineChart,
  Layers,
  Rocket
} from 'lucide-react';
// Phase 1-2 Components
import RevenueIntelligenceDashboard from './RevenueIntelligenceDashboard';
import ExpansionOpportunitiesPanel from './ExpansionOpportunitiesPanel';
import ChurnRevenueProtection from './ChurnRevenueProtection';
import BenchmarkingDashboard from './BenchmarkingDashboard';
import CohortAnalysisChart from './CohortAnalysisChart';
// Phase 3-4 Components
import MRRWaterfallChart from './MRRWaterfallChart';
import RevenueForecastDashboard from './RevenueForecastDashboard';
import LTVAnalysisPanel from './LTVAnalysisPanel';
import PLGSignalsTracker from './PLGSignalsTracker';
import RevenueScoreCard from './RevenueScoreCard';
import PrioritizationMatrix from './PrioritizationMatrix';
import RevenueAttributionChart from './RevenueAttributionChart';
import MonteCarloSimulator from './MonteCarloSimulator';

const RevenueIntelligenceHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-13 h-auto gap-1">
          {/* Phase 1-2 Tabs */}
          <TabsTrigger value="dashboard" className="flex flex-col gap-1 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="expansion" className="flex flex-col gap-1 py-3">
            <Rocket className="h-4 w-4" />
            <span className="text-xs">Expansion</span>
          </TabsTrigger>
          <TabsTrigger value="churn" className="flex flex-col gap-1 py-3">
            <Shield className="h-4 w-4" />
            <span className="text-xs">Churn</span>
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex flex-col gap-1 py-3">
            <LineChart className="h-4 w-4" />
            <span className="text-xs">Benchmarks</span>
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="flex flex-col gap-1 py-3">
            <Layers className="h-4 w-4" />
            <span className="text-xs">Cohorts</span>
          </TabsTrigger>
          {/* Phase 3-4 Tabs */}
          <TabsTrigger value="overview" className="flex flex-col gap-1 py-3">
            <Activity className="h-4 w-4" />
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
            <Users className="h-4 w-4" />
            <span className="text-xs">Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex flex-col gap-1 py-3">
            <PieChart className="h-4 w-4" />
            <span className="text-xs">Priority</span>
          </TabsTrigger>
          <TabsTrigger value="attribution" className="flex flex-col gap-1 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Attribution</span>
          </TabsTrigger>
          <TabsTrigger value="montecarlo" className="flex flex-col gap-1 py-3">
            <Brain className="h-4 w-4" />
            <span className="text-xs">Monte Carlo</span>
          </TabsTrigger>
        </TabsList>

        {/* Phase 1-2 Content */}
        <TabsContent value="dashboard">
          <RevenueIntelligenceDashboard />
        </TabsContent>

        <TabsContent value="expansion">
          <ExpansionOpportunitiesPanel />
        </TabsContent>

        <TabsContent value="churn">
          <ChurnRevenueProtection />
        </TabsContent>

        <TabsContent value="benchmarks">
          <BenchmarkingDashboard />
        </TabsContent>

        <TabsContent value="cohorts">
          <CohortAnalysisChart />
        </TabsContent>

        {/* Phase 3-4 Content */}
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
