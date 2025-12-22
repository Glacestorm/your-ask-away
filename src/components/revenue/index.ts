export { default as RevenueIntelligenceDashboard } from './RevenueIntelligenceDashboard';
export { default as ExpansionOpportunitiesPanel } from './ExpansionOpportunitiesPanel';
export { default as ChurnRevenueProtection } from './ChurnRevenueProtection';
export { default as BenchmarkingDashboard } from './BenchmarkingDashboard';
export { default as CohortAnalysisChart } from './CohortAnalysisChart';

// Phase 4 - Revenue Intelligence Hub
export { default as RevenueIntelligenceHub } from './RevenueIntelligenceHub';

// Phase 4 Components
export { default as MRRWaterfallChart } from './MRRWaterfallChart';
export { default as RevenueForecastDashboard } from './RevenueForecastDashboard';
export { default as LTVAnalysisPanel } from './LTVAnalysisPanel';
export { default as PLGSignalsTracker } from './PLGSignalsTracker';
export { default as RevenueScoreCard } from './RevenueScoreCard';
export { default as PrioritizationMatrix } from './PrioritizationMatrix';
export { default as RevenueAttributionChart } from './RevenueAttributionChart';
export { default as MonteCarloSimulator } from './MonteCarloSimulator';

// Re-export hooks
export { useRevenueForecast } from '@/hooks/useRevenueForecast';
export { useLTVPrediction } from '@/hooks/useLTVPrediction';
export { usePLGSignals } from '@/hooks/usePLGSignals';
export { useRevenueScoring } from '@/hooks/useRevenueScoring';
export { useSmartPrioritization } from '@/hooks/useSmartPrioritization';
export { useRevenueAttribution } from '@/hooks/useRevenueAttribution';
export { useMonteCarloSimulation } from '@/hooks/useMonteCarloSimulation';
