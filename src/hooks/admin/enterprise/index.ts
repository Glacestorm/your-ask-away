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
