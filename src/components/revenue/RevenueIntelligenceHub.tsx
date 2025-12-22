import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Zap, 
  PieChart, 
  Activity,
  Target
} from 'lucide-react';
// Navigation Component
import RevenueTabsNavigation from './RevenueTabsNavigation';
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <RevenueIntelligenceDashboard />;
      case 'expansion':
        return <ExpansionOpportunitiesPanel />;
      case 'churn':
        return <ChurnRevenueProtection />;
      case 'benchmarks':
        return <BenchmarkingDashboard />;
      case 'cohorts':
        return <CohortAnalysisChart />;
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    MRR Waterfall
                  </CardTitle>
                  <CardDescription>Desglose de movimientos de MRR</CardDescription>
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
                  <CardDescription>Salud de ingresos en tiempo real</CardDescription>
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
                  <CardDescription>Señales de crecimiento detectadas</CardDescription>
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
                  <CardDescription>Atribución de ingresos por canal</CardDescription>
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
                  <CardDescription>Cuentas con mayor valor de vida</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] overflow-auto">
                  <LTVAnalysisPanel />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'forecast':
        return <RevenueForecastDashboard />;
      case 'ltv':
        return <LTVAnalysisPanel />;
      case 'plg':
        return <PLGSignalsTracker />;
      case 'scoring':
        return <RevenueScoreCard />;
      case 'priority':
        return <PrioritizationMatrix />;
      case 'attribution':
        return <RevenueAttributionChart />;
      case 'montecarlo':
        return <MonteCarloSimulator />;
      default:
        return <RevenueIntelligenceDashboard />;
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Premium Navigation */}
      <RevenueTabsNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      {/* Content Area with Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RevenueIntelligenceHub;
