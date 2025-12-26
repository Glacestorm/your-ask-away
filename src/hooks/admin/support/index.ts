// Support AI Hooks - Enterprise Module
export { useKnowledgeBase, type KnowledgeDocument } from './useKnowledgeBase';
export { useReinforcementLearning } from './useReinforcementLearning';
export { useSupportAgentOrchestrator } from './useSupportAgentOrchestrator';
export { useActionExecutionEngine } from './useActionExecutionEngine';
export { 
  useSupportPredictiveAnalytics, 
  type LoadPrediction, 
  type WeekForecast, 
  type SeasonalPatterns,
  type StaffingRecommendation,
  type TrendInsight,
  type Anomaly,
  type HealthMetrics,
  type RealtimeStatus
} from './useSupportPredictiveAnalytics';

// Phase 6: Security, Reports, Integrations
export { useSupportAuditLogger, type AuditEntry, type SecurityAnalysis, type ComplianceReport } from './useSupportAuditLogger';
export { useSupportReportGenerator, type MetricsReport, type SessionReport, type PerformanceReport, type ReportTemplate } from './useSupportReportGenerator';
export { useSupportExternalIntegrations, type Integration, type ExternalTicket, type WebhookResult, type NotificationResult } from './useSupportExternalIntegrations';

// Phase 7B: Metrics Dashboard
export { useSupportMetricsDashboard, type SupportMetrics, type AgentPerformance, type TrendData, type RealTimeEvent, type DashboardFilters } from './useSupportMetricsDashboard';
