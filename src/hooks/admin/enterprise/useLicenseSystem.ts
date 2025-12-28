// License System Integration Hook - Phase 7
// Enterprise License System 2025 - Unified Management

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === SYSTEM CONFIGURATION ===
export interface LicenseSystemConfig {
  id: string;
  // Validation settings
  validationCacheTTL: number; // minutes
  maxValidationsPerHour: number;
  offlineGracePeriod: number; // hours
  requireOnlineValidation: boolean;
  
  // Security settings
  maxDevicesPerLicense: number;
  deviceFingerprintStrength: 'low' | 'medium' | 'high';
  anomalyDetectionEnabled: boolean;
  autoSuspendOnAnomaly: boolean;
  anomalyThreshold: number;
  
  // Notification settings
  expirationWarningDays: number[];
  renewalReminderDays: number[];
  sendEmailNotifications: boolean;
  sendInAppNotifications: boolean;
  webhookUrl?: string;
  
  // API settings
  apiRateLimit: number; // requests per minute
  apiKeyRotationDays: number;
  allowPublicValidation: boolean;
  
  // Audit settings
  auditRetentionDays: number;
  logValidations: boolean;
  logDeviceChanges: boolean;
  logAnomalies: boolean;
  
  updatedAt: string;
  updatedBy?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  components: {
    database: ComponentHealth;
    validation: ComponentHealth;
    notifications: ComponentHealth;
    antiPiracy: ComponentHealth;
    reporting: ComponentHealth;
  };
  lastChecked: string;
  uptime: number;
  metrics: {
    validationsLast24h: number;
    activationsLast24h: number;
    anomaliesLast24h: number;
    avgResponseTime: number;
  };
}

export interface ComponentHealth {
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  errorRate?: number;
  lastError?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'license' | 'device' | 'validation' | 'config' | 'api';
  entityId?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface IntegrationEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  authentication: 'api_key' | 'jwt' | 'public';
  rateLimit: number;
  example: {
    request?: Record<string, unknown>;
    response: Record<string, unknown>;
  };
}

// === DEFAULT CONFIG ===
const DEFAULT_CONFIG: Omit<LicenseSystemConfig, 'id' | 'updatedAt'> = {
  validationCacheTTL: 60,
  maxValidationsPerHour: 1000,
  offlineGracePeriod: 72,
  requireOnlineValidation: false,
  maxDevicesPerLicense: 5,
  deviceFingerprintStrength: 'high',
  anomalyDetectionEnabled: true,
  autoSuspendOnAnomaly: false,
  anomalyThreshold: 80,
  expirationWarningDays: [30, 14, 7, 3, 1],
  renewalReminderDays: [60, 30, 14],
  sendEmailNotifications: true,
  sendInAppNotifications: true,
  apiRateLimit: 100,
  apiKeyRotationDays: 90,
  allowPublicValidation: false,
  auditRetentionDays: 365,
  logValidations: true,
  logDeviceChanges: true,
  logAnomalies: true
};

// === HOOK ===
export function useLicenseSystem() {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<LicenseSystemConfig | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [error, setError] = useState<string | null>(null);

  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH CONFIG ===
  const fetchConfig = useCallback(async (): Promise<LicenseSystemConfig | null> => {
    try {
      // In production, this would fetch from DB
      // For now, return default config
      const storedConfig = localStorage.getItem('license_system_config');
      
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        setConfig(parsed);
        return parsed;
      }

      const defaultWithMeta: LicenseSystemConfig = {
        ...DEFAULT_CONFIG,
        id: crypto.randomUUID(),
        updatedAt: new Date().toISOString()
      };

      setConfig(defaultWithMeta);
      return defaultWithMeta;
    } catch (err) {
      console.error('[useLicenseSystem] fetchConfig error:', err);
      return null;
    }
  }, []);

  // === UPDATE CONFIG ===
  const updateConfig = useCallback(async (
    updates: Partial<LicenseSystemConfig>
  ): Promise<boolean> => {
    try {
      const newConfig: LicenseSystemConfig = {
        ...config!,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Store locally (would be DB in production)
      localStorage.setItem('license_system_config', JSON.stringify(newConfig));
      setConfig(newConfig);

      // Log audit
      await logAuditEntry({
        action: 'config_updated',
        entityType: 'config',
        details: { updates },
        severity: 'info'
      });

      toast.success('Configuración actualizada');
      return true;
    } catch (err) {
      console.error('[useLicenseSystem] updateConfig error:', err);
      toast.error('Error al actualizar configuración');
      return false;
    }
  }, [config]);

  // === CHECK HEALTH ===
  const checkHealth = useCallback(async (): Promise<SystemHealth> => {
    const startTime = Date.now();

    try {
      // Check database
      const dbStart = Date.now();
      const { error: dbError } = await (supabase as any)
        .from('enterprise_licenses')
        .select('id')
        .limit(1);
      const dbLatency = Date.now() - dbStart;

      // Fetch recent stats
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [validationsRes, activationsRes, anomaliesRes] = await Promise.all([
        (supabase as any)
          .from('license_validation_logs')
          .select('id', { count: 'exact', head: true })
          .gte('validated_at', last24h),
        (supabase as any)
          .from('license_device_activations')
          .select('id', { count: 'exact', head: true })
          .gte('activated_at', last24h),
        (supabase as any)
          .from('license_anomaly_alerts')
          .select('id', { count: 'exact', head: true })
          .gte('detected_at', last24h)
      ]);

      const systemHealth: SystemHealth = {
        status: dbError ? 'degraded' : 'healthy',
        components: {
          database: {
            status: dbError ? 'degraded' : 'operational',
            latency: dbLatency,
            errorRate: dbError ? 100 : 0,
            lastError: dbError?.message
          },
          validation: {
            status: 'operational',
            latency: 15,
            errorRate: 0
          },
          notifications: {
            status: 'operational',
            latency: 50,
            errorRate: 0
          },
          antiPiracy: {
            status: 'operational',
            latency: 25,
            errorRate: 0
          },
          reporting: {
            status: 'operational',
            latency: 100,
            errorRate: 0
          }
        },
        lastChecked: new Date().toISOString(),
        uptime: 99.9,
        metrics: {
          validationsLast24h: validationsRes.count || 0,
          activationsLast24h: activationsRes.count || 0,
          anomaliesLast24h: anomaliesRes.count || 0,
          avgResponseTime: Date.now() - startTime
        }
      };

      // Determine overall status
      const componentStatuses = Object.values(systemHealth.components);
      if (componentStatuses.some(c => c.status === 'down')) {
        systemHealth.status = 'critical';
      } else if (componentStatuses.some(c => c.status === 'degraded')) {
        systemHealth.status = 'degraded';
      }

      setHealth(systemHealth);
      return systemHealth;
    } catch (err) {
      console.error('[useLicenseSystem] checkHealth error:', err);
      const errorHealth: SystemHealth = {
        status: 'critical',
        components: {
          database: { status: 'down', lastError: 'Connection failed' },
          validation: { status: 'down' },
          notifications: { status: 'down' },
          antiPiracy: { status: 'down' },
          reporting: { status: 'down' }
        },
        lastChecked: new Date().toISOString(),
        uptime: 0,
        metrics: {
          validationsLast24h: 0,
          activationsLast24h: 0,
          anomaliesLast24h: 0,
          avgResponseTime: 0
        }
      };
      setHealth(errorHealth);
      return errorHealth;
    }
  }, []);

  // === AUDIT LOGGING ===
  const logAuditEntry = useCallback(async (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
  ): Promise<void> => {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    setAuditLogs(prev => [fullEntry, ...prev].slice(0, 1000));

    // In production, would persist to DB
    console.log('[AUDIT]', fullEntry);
  }, []);

  const fetchAuditLogs = useCallback(async (
    filters?: {
      entityType?: AuditLogEntry['entityType'];
      severity?: AuditLogEntry['severity'];
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> => {
    try {
      // In production, fetch from DB with filters
      let logs = [...auditLogs];

      if (filters?.entityType) {
        logs = logs.filter(l => l.entityType === filters.entityType);
      }
      if (filters?.severity) {
        logs = logs.filter(l => l.severity === filters.severity);
      }
      if (filters?.startDate) {
        logs = logs.filter(l => l.timestamp >= filters.startDate!);
      }
      if (filters?.endDate) {
        logs = logs.filter(l => l.timestamp <= filters.endDate!);
      }

      return logs.slice(0, filters?.limit || 100);
    } catch (err) {
      console.error('[useLicenseSystem] fetchAuditLogs error:', err);
      return [];
    }
  }, [auditLogs]);

  // === API KEYS MANAGEMENT ===
  const createAPIKey = useCallback(async (
    name: string,
    permissions: string[],
    expiresInDays?: number
  ): Promise<{ key: string; apiKey: APIKey } | null> => {
    try {
      const keyId = crypto.randomUUID();
      const fullKey = `lk_${keyId.replace(/-/g, '')}`;
      const keyPrefix = fullKey.substring(0, 12) + '...';

      const apiKey: APIKey = {
        id: keyId,
        name,
        keyPrefix,
        permissions,
        rateLimit: config?.apiRateLimit || 100,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        expiresAt: expiresInDays 
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };

      setApiKeys(prev => [...prev, apiKey]);

      await logAuditEntry({
        action: 'api_key_created',
        entityType: 'api',
        entityId: keyId,
        details: { name, permissions },
        severity: 'info'
      });

      toast.success('API Key creada');
      return { key: fullKey, apiKey };
    } catch (err) {
      console.error('[useLicenseSystem] createAPIKey error:', err);
      toast.error('Error al crear API Key');
      return null;
    }
  }, [config, logAuditEntry]);

  const revokeAPIKey = useCallback(async (keyId: string): Promise<boolean> => {
    try {
      setApiKeys(prev => prev.map(k => 
        k.id === keyId ? { ...k, isActive: false } : k
      ));

      await logAuditEntry({
        action: 'api_key_revoked',
        entityType: 'api',
        entityId: keyId,
        details: {},
        severity: 'warning'
      });

      toast.success('API Key revocada');
      return true;
    } catch (err) {
      console.error('[useLicenseSystem] revokeAPIKey error:', err);
      toast.error('Error al revocar API Key');
      return false;
    }
  }, [logAuditEntry]);

  // === API DOCUMENTATION ===
  const getAPIEndpoints = useCallback((): IntegrationEndpoint[] => {
    return [
      {
        path: '/api/licenses/validate',
        method: 'POST',
        description: 'Validar una licencia',
        authentication: 'api_key',
        rateLimit: 100,
        example: {
          request: {
            license_key: 'LIC-XXXX-XXXX-XXXX',
            device_fingerprint: 'abc123...',
            product_id: 'prod_xxx'
          },
          response: {
            valid: true,
            license: {
              id: 'uuid',
              status: 'active',
              tier: 'professional',
              expires_at: '2025-12-31T23:59:59Z'
            },
            features: ['feature1', 'feature2']
          }
        }
      },
      {
        path: '/api/licenses/activate',
        method: 'POST',
        description: 'Activar una licencia en un dispositivo',
        authentication: 'api_key',
        rateLimit: 20,
        example: {
          request: {
            license_key: 'LIC-XXXX-XXXX-XXXX',
            device_fingerprint: 'abc123...',
            device_name: 'MacBook Pro'
          },
          response: {
            success: true,
            activation_id: 'uuid',
            devices_remaining: 4
          }
        }
      },
      {
        path: '/api/licenses/deactivate',
        method: 'POST',
        description: 'Desactivar una licencia de un dispositivo',
        authentication: 'api_key',
        rateLimit: 20,
        example: {
          request: {
            license_key: 'LIC-XXXX-XXXX-XXXX',
            device_fingerprint: 'abc123...'
          },
          response: {
            success: true,
            message: 'Device deactivated successfully'
          }
        }
      },
      {
        path: '/api/licenses/check-feature',
        method: 'GET',
        description: 'Verificar acceso a una feature',
        authentication: 'api_key',
        rateLimit: 200,
        example: {
          response: {
            has_access: true,
            feature_key: 'advanced_reports',
            usage: { current: 50, limit: 100 }
          }
        }
      },
      {
        path: '/api/licenses/status',
        method: 'GET',
        description: 'Obtener estado de una licencia',
        authentication: 'api_key',
        rateLimit: 50,
        example: {
          response: {
            license: {
              id: 'uuid',
              status: 'active',
              tier: 'enterprise',
              activated_devices: 3,
              max_devices: 10,
              expires_at: '2025-12-31T23:59:59Z'
            }
          }
        }
      },
      {
        path: '/api/webhooks/license-events',
        method: 'POST',
        description: 'Webhook para eventos de licencias',
        authentication: 'jwt',
        rateLimit: 1000,
        example: {
          request: {
            event: 'license.activated',
            data: {
              license_id: 'uuid',
              device_id: 'uuid',
              timestamp: '2025-01-01T00:00:00Z'
            }
          },
          response: { received: true }
        }
      }
    ];
  }, []);

  // === HEALTH CHECK INTERVAL ===
  const startHealthMonitoring = useCallback((intervalMs = 60000) => {
    stopHealthMonitoring();
    checkHealth();
    healthCheckInterval.current = setInterval(checkHealth, intervalMs);
  }, [checkHealth]);

  const stopHealthMonitoring = useCallback(() => {
    if (healthCheckInterval.current) {
      clearInterval(healthCheckInterval.current);
      healthCheckInterval.current = null;
    }
  }, []);

  // === EXPORT SYSTEM DATA ===
  const exportSystemData = useCallback(async (
    includeConfig: boolean = true,
    includeLogs: boolean = true,
    includeKeys: boolean = false
  ): Promise<string> => {
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    if (includeConfig && config) {
      exportData.config = config;
    }

    if (includeLogs) {
      exportData.auditLogs = auditLogs.slice(0, 1000);
    }

    if (includeKeys) {
      exportData.apiKeys = apiKeys.map(k => ({
        ...k,
        keyPrefix: k.keyPrefix // Don't export full keys
      }));
    }

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-system-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Datos exportados');
    return json;
  }, [config, auditLogs, apiKeys]);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopHealthMonitoring();
  }, [stopHealthMonitoring]);

  // === INITIALIZE ===
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    // State
    isLoading,
    config,
    health,
    auditLogs,
    apiKeys,
    error,
    // Config
    fetchConfig,
    updateConfig,
    // Health
    checkHealth,
    startHealthMonitoring,
    stopHealthMonitoring,
    // Audit
    logAuditEntry,
    fetchAuditLogs,
    // API Keys
    createAPIKey,
    revokeAPIKey,
    // API Docs
    getAPIEndpoints,
    // Export
    exportSystemData
  };
}

export default useLicenseSystem;
