/**
 * Advanced AI Hooks - Barrel Export
 * Fase 12 - Advanced AI & Automation
 */

export { useAdvancedCopilot } from './useAdvancedCopilot';
export type {
  CopilotMessage,
  CopilotAttachment,
  CopilotCapability,
  CopilotContext,
  CopilotSuggestion
} from './useAdvancedCopilot';

export { useAIOrchestrator } from './useAIOrchestrator';
export type {
  AIAgent,
  AgentTask,
  AgentWorkflow,
  WorkflowStep,
  WorkflowCondition,
  OrchestratorContext
} from './useAIOrchestrator';

export { useSmartAnalytics } from './useSmartAnalytics';
export type {
  SmartMetric,
  AnalyticsInsight,
  DataPattern,
  AnalyticsQuery,
  AnalyticsContext
} from './useSmartAnalytics';

export { useRealTimeInsights } from './useRealTimeInsights';
export type {
  RealTimeInsight,
  InsightAction,
  InsightStream,
  InsightFilter,
  InsightStats,
  InsightsContext
} from './useRealTimeInsights';
