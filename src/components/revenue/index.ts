export { default as RevenueIntelligenceDashboard } from './RevenueIntelligenceDashboard';
export { default as ExpansionOpportunitiesPanel } from './ExpansionOpportunitiesPanel';
export { default as ChurnRevenueProtection } from './ChurnRevenueProtection';
export { default as BenchmarkingDashboard } from './BenchmarkingDashboard';
export { default as CohortAnalysisChart } from './CohortAnalysisChart';
export { RevenueCommandCenter } from './RevenueCommandCenter';
export { RevenueCopilotChat } from './RevenueCopilotChat';
export { RevenueScenarioPlanner } from './RevenueScenarioPlanner';
export { RevenueAnomalyMonitor } from './RevenueAnomalyMonitor';
export { RevenueWorkflowManager } from './RevenueWorkflowManager';

// Re-export hooks for convenience
export { useRevenueForecast } from '@/hooks/useRevenueForecast';
export { useLTVPrediction } from '@/hooks/useLTVPrediction';
export { usePLGSignals } from '@/hooks/usePLGSignals';
export { useRevenueScoring } from '@/hooks/useRevenueScoring';
export { useSmartPrioritization } from '@/hooks/useSmartPrioritization';
export { useRevenueAttribution } from '@/hooks/useRevenueAttribution';
export { useMonteCarloSimulation } from '@/hooks/useMonteCarloSimulation';

// Phase 5 hooks
export { useRevenueScenarios } from '@/hooks/useRevenueScenarios';
export { useRevenueCopilot } from '@/hooks/useRevenueCopilot';
export { useRevenueAnomalyAlerts } from '@/hooks/useRevenueAnomalyAlerts';
export { useRevenueWorkflows } from '@/hooks/useRevenueWorkflows';
