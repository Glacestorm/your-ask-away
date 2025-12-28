/**
 * License Types
 * Fase 1 - Sistema de Licencias Enterprise
 */

// License plan types
export type LicenseType = 
  | 'trial' 
  | 'freemium' 
  | 'subscription' 
  | 'perpetual' 
  | 'usage_based' 
  | 'floating' 
  | 'node_locked' 
  | 'enterprise';

export type LicenseStatus = 
  | 'pending' 
  | 'active' 
  | 'suspended' 
  | 'expired' 
  | 'revoked' 
  | 'cancelled';

export type DeviceType = 
  | 'desktop' 
  | 'web' 
  | 'mobile' 
  | 'server' 
  | 'vm';

export type ResetPeriod = 
  | 'hourly' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly';

export type ValidationResultType = 
  | 'success' 
  | 'expired' 
  | 'revoked' 
  | 'suspended' 
  | 'invalid_signature' 
  | 'device_limit_exceeded' 
  | 'concurrent_limit_exceeded' 
  | 'geo_blocked'
  | 'ip_blocked' 
  | 'invalid_key' 
  | 'suspicious' 
  | 'offline_grace';

export type AnomalyAlertType = 
  | 'multiple_ips' 
  | 'device_limit_attempts' 
  | 'geographic_anomaly'
  | 'usage_spike' 
  | 'suspicious_pattern' 
  | 'concurrent_abuse' 
  | 'offline_extended';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';

// Feature flags type
export interface FeatureFlags {
  // Core features
  'core.dashboard'?: boolean;
  'core.reports'?: boolean;
  'core.basic_analytics'?: boolean;
  
  // Premium features
  'premium.advanced_analytics'?: boolean;
  'premium.api_access'?: boolean;
  'premium.integrations'?: boolean;
  'premium.ai_assistant'?: boolean;
  
  // Enterprise features
  'enterprise.sso'?: boolean;
  'enterprise.audit_logs'?: boolean;
  'enterprise.custom_branding'?: boolean;
  'enterprise.priority_support'?: boolean;
  'enterprise.dedicated_support'?: boolean;
  
  // Limits (number values)
  'limits.max_users'?: number;
  'limits.max_storage_gb'?: number;
  'limits.max_api_calls'?: number;
  
  // Custom features
  [key: string]: boolean | number | undefined;
}

// License plan
export interface LicensePlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  features: FeatureFlags;
  price_monthly: number | null;
  price_yearly: number | null;
  max_users_default: number;
  max_devices_default: number;
  max_api_calls_month: number | null;
  trial_days: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Main license
export interface License {
  id: string;
  license_key?: string;
  license_key_hash: string;
  license_type: LicenseType;
  plan_id: string | null;
  organization_id: string;
  licensee_email: string;
  licensee_name: string | null;
  licensee_company: string | null;
  signed_data: LicenseSignedData;
  signature: string;
  public_key: string;
  max_users: number;
  max_devices: number;
  max_api_calls_month: number | null;
  max_concurrent_sessions: number;
  issued_at: string;
  valid_from: string;
  expires_at: string | null;
  last_validated_at: string | null;
  last_heartbeat_at: string | null;
  status: LicenseStatus;
  revocation_reason: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  allowed_countries: string[] | null;
  blocked_ips: string[] | null;
  metadata: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  plan?: LicensePlan;
  entitlements?: LicenseEntitlement[];
  devices?: DeviceActivation[];
}

// Signed data embedded in license
export interface LicenseSignedData {
  iss: string; // Issuer
  sub: string; // Subject (email)
  email: string;
  name?: string;
  company?: string;
  plan: string;
  type: LicenseType;
  features: FeatureFlags;
  maxUsers: number;
  maxDevices: number;
  maxApiCalls?: number;
  iat: number; // Issued at (unix timestamp)
  exp: number; // Expires (unix timestamp)
  jti: string; // Unique ID
}

// Device activation
export interface DeviceActivation {
  id: string;
  license_id: string;
  device_fingerprint: string;
  device_fingerprint_hash: string;
  device_name: string | null;
  device_type: DeviceType;
  hardware_info: DeviceHardwareInfo;
  cpu_hash: string | null;
  gpu_hash: string | null;
  screen_hash: string | null;
  timezone: string | null;
  locale: string | null;
  ip_address: string | null;
  last_ip_address: string | null;
  user_agent: string | null;
  first_activated_at: string;
  last_seen_at: string;
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceHardwareInfo {
  cpuCores?: number;
  cpuModel?: string;
  memory?: number;
  platform?: string;
  screenResolution?: string;
  colorDepth?: number;
  webglRenderer?: string;
  [key: string]: unknown;
}

// License entitlement
export interface LicenseEntitlement {
  id: string;
  license_id: string;
  feature_key: string;
  feature_name: string | null;
  is_enabled: boolean;
  usage_limit: number | null;
  usage_current: number;
  reset_period: ResetPeriod | null;
  last_reset_at: string | null;
  valid_from: string;
  valid_until: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Validation log
export interface LicenseValidation {
  id: string;
  license_id: string | null;
  license_key_hash: string | null;
  device_fingerprint_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  geo_country: string | null;
  geo_city: string | null;
  validation_result: ValidationResultType;
  validation_details: Record<string, unknown>;
  validation_duration_ms: number | null;
  validated_at: string;
}

// Usage log
export interface LicenseUsageLog {
  id: string;
  license_id: string | null;
  entitlement_id: string | null;
  feature_key: string;
  action: string;
  quantity: number;
  device_fingerprint_hash: string | null;
  ip_address: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
  logged_at: string;
}

// Anomaly alert
export interface LicenseAnomalyAlert {
  id: string;
  license_id: string;
  alert_type: AnomalyAlertType;
  severity: AlertSeverity;
  description: string | null;
  details: Record<string, unknown>;
  status: AlertStatus;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface GenerateLicenseRequest {
  planId?: string;
  planCode?: string;
  licenseeEmail: string;
  licenseeName?: string;
  licenseeCompany?: string;
  licenseType?: LicenseType;
  maxUsers?: number;
  maxDevices?: number;
  maxApiCallsMonth?: number;
  validDays?: number;
  features?: FeatureFlags;
  metadata?: Record<string, unknown>;
}

export interface GenerateLicenseResponse {
  license: License & { licenseKey: string };
  publicKey: string;
}

export interface ValidateLicenseRequest {
  licenseKey: string;
  deviceFingerprint?: string;
  deviceInfo?: {
    deviceName?: string;
    deviceType?: DeviceType;
    cpuHash?: string;
    gpuHash?: string;
    screenHash?: string;
    timezone?: string;
    locale?: string;
    userAgent?: string;
  };
}

export interface ValidateLicenseResponse {
  valid: boolean;
  result: ValidationResultType;
  details: Record<string, unknown>;
  license: License | null;
  publicKey?: string;
}

export interface FeatureCheckResponse {
  allowed: boolean;
  reason?: string;
  remaining?: number | null;
  limit?: number;
}

export interface HeartbeatResponse {
  valid: boolean;
  status: LicenseStatus;
  expiresAt: string | null;
}
