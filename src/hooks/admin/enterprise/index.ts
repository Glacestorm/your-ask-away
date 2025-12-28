/**
 * Enterprise Hooks - Barrel Export
 * Fase 11 - Enterprise SaaS 2025-2026
 */

export { useComplianceMonitor } from './useComplianceMonitor';
export type { 
  ComplianceItem, 
  ComplianceFramework, 
  ComplianceContext, 
  ComplianceAnalysis 
} from './useComplianceMonitor';

export { useCommandCenter } from './useCommandCenter';
export type { 
  CommandMetric, 
  ActiveAlert, 
  SystemStatus, 
  CommandContext 
} from './useCommandCenter';

export { useBusinessIntelligence } from './useBusinessIntelligence';
export type { 
  BIMetric, 
  BIInsight, 
  BIPrediction, 
  BIDashboard, 
  BIContext 
} from './useBusinessIntelligence';

export { useLicenseManager } from './useLicenseManager';
export type {
  LicensePlan,
  License,
  LicenseEntitlement,
  DeviceActivation,
  DeviceFingerprint,
  GenerateLicenseParams,
  ValidationResult,
  FeatureCheckResult
} from './useLicenseManager';

export { useDeviceFingerprint } from './useDeviceFingerprint';
export type {
  DeviceFingerprint as DeviceFingerprintData,
  FingerprintResult
} from './useDeviceFingerprint';

export { useLicenseValidation } from './useLicenseValidation';
export type {
  LicenseValidationResult
} from './useLicenseValidation';

export { useLicenseAntiPiracy } from './useLicenseAntiPiracy';
export type {
  AnomalyPattern,
  RiskAssessment,
  RiskFactor,
  SuspiciousActivity,
  AntiPiracyConfig
} from './useLicenseAntiPiracy';

export { useLicenseClient } from './useLicenseClient';
export type {
  LicenseState,
  ActivationResult,
  FeatureAccess
} from './useLicenseClient';

export { useLicenseReporting } from './useLicenseReporting';
export type {
  LicenseMetrics,
  LicenseUsageTrend,
  LicenseTierDistribution,
  ExpirationForecast,
  LicenseReport,
  AutomationRule,
  ScheduledNotification
} from './useLicenseReporting';

export { useLicenseSystem } from './useLicenseSystem';
export type {
  LicenseSystemConfig,
  SystemHealth,
  ComponentHealth,
  AuditLogEntry,
  APIKey,
  IntegrationEndpoint
} from './useLicenseSystem';

export { useLicenseAIAgent } from './useLicenseAIAgent';
export type {
  AgentConfig,
  LicensePrediction,
  LicenseAnomaly,
  AgentAction,
  AgentInsight,
  AgentMetrics,
  NLQueryResult
} from './useLicenseAIAgent';

// New License Enhancement Hooks
export { useLicenseWebhooks } from './useLicenseWebhooks';
export type { LicenseWebhook, WebhookLog, CreateWebhookParams } from './useLicenseWebhooks';

export { useLicenseAudit } from './useLicenseAudit';
export type { LicenseAuditLog, AuditFilters } from './useLicenseAudit';

export { useLicenseGrace } from './useLicenseGrace';
export type { LicenseGracePeriod, CreateGracePeriodParams } from './useLicenseGrace';

export { useLicenseTransfer } from './useLicenseTransfer';
export type { LicenseTransfer, InitiateTransferParams } from './useLicenseTransfer';

export { useLicenseBulkOperations } from './useLicenseBulkOperations';
export type { BulkGenerateParams, BulkImportRow, BulkOperationResult } from './useLicenseBulkOperations';

export { useLicenseScheduledReports } from './useLicenseScheduledReports';
export type { ScheduledReport, ReportHistory, CreateScheduledReportParams } from './useLicenseScheduledReports';
