export { default as RevenueIntelligenceDashboard } from './RevenueIntelligenceDashboard';
export { default as ExpansionOpportunitiesPanel } from './ExpansionOpportunitiesPanel';
export { default as ChurnRevenueProtection } from './ChurnRevenueProtection';
export { default as BenchmarkingDashboard } from './BenchmarkingDashboard';
export { default as CohortAnalysisChart } from './CohortAnalysisChart';

// Re-export hooks for convenience
export { useRevenueForecast } from '@/hooks/useRevenueForecast';
export { useLTVPrediction } from '@/hooks/useLTVPrediction';
export { usePLGSignals } from '@/hooks/usePLGSignals';
export { useRevenueScoring } from '@/hooks/useRevenueScoring';
export { useSmartPrioritization } from '@/hooks/useSmartPrioritization';
export { useRevenueAttribution } from '@/hooks/useRevenueAttribution';
export { useMonteCarloSimulation } from '@/hooks/useMonteCarloSimulation';
