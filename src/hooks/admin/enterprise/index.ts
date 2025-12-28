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
