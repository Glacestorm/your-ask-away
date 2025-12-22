import React from 'react';
import { DashboardLayout } from '@/layouts';
import { RevenueIntelligenceDashboard, RevenueMetrics, RevenueForecast, RevenueInsight, CohortData } from '@/components/revenue';

const demoMetrics: RevenueMetrics = {
  mrr: 485000,
  arr: 5820000,
  mrrGrowth: 8.5,
  churnRate: 2.1,
  ltv: 28500,
  cac: 4200,
  ltvCacRatio: 6.8,
  netRevenueRetention: 118,
  avgDealSize: 32000,
  pipelineValue: 2450000,
  forecastedRevenue: 1650000,
  forecastConfidence: 87
};

const demoForecasts: RevenueForecast[] = [
  { month: 'Ene', predicted: 485000, actual: 492000, confidence: 95 },
  { month: 'Feb', predicted: 512000, actual: 508000, confidence: 92 },
  { month: 'Mar', predicted: 545000, confidence: 88 },
  { month: 'Abr', predicted: 578000, confidence: 82 },
  { month: 'May', predicted: 612000, confidence: 75 },
  { month: 'Jun', predicted: 648000, confidence: 68 },
];

const demoInsights: RevenueInsight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Expansión Enterprise',
    description: '12 cuentas con alto potencial de upgrade detectadas por el modelo predictivo',
    impact: 156000,
    priority: 'high',
    action: 'Ver cuentas'
  },
  {
    id: '2',
    type: 'risk',
    title: 'Riesgo de Churn',
    description: '3 cuentas con señales de desengagement en los últimos 30 días',
    impact: -45000,
    priority: 'high',
    action: 'Intervenir'
  },
  {
    id: '3',
    type: 'trend',
    title: 'Sector Fintech +23%',
    description: 'El vertical fintech muestra crecimiento acelerado vs otros sectores',
    impact: 89000,
    priority: 'medium',
    action: 'Analizar'
  },
  {
    id: '4',
    type: 'opportunity',
    title: 'Cross-sell Módulo IA',
    description: '28 clientes activos sin el módulo de IA son candidatos ideales',
    impact: 112000,
    priority: 'medium',
    action: 'Campaña'
  }
];

const demoCohorts: CohortData[] = [
  { cohort: 'Ene 2024', month0: 100, month1: 94, month2: 91, month3: 88, month6: 82, month12: 75 },
  { cohort: 'Dic 2023', month0: 100, month1: 92, month2: 88, month3: 85, month6: 79, month12: 72 },
  { cohort: 'Nov 2023', month0: 100, month1: 95, month2: 92, month3: 89, month6: 84, month12: 78 },
  { cohort: 'Oct 2023', month0: 100, month1: 93, month2: 90, month3: 86, month6: 80, month12: 74 },
  { cohort: 'Sep 2023', month0: 100, month1: 91, month2: 87, month3: 84, month6: 77, month12: 70 },
];

const RevenuePage = () => {
  return (
    <DashboardLayout title="Revenue Intelligence">
      <div className="p-6">
        <RevenueIntelligenceDashboard 
          metrics={demoMetrics}
          forecasts={demoForecasts}
          insights={demoInsights}
          cohorts={demoCohorts}
          onRefreshForecast={() => console.log('Refreshing forecast...')}
        />
      </div>
    </DashboardLayout>
  );
};

export default RevenuePage;
