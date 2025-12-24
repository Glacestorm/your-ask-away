/**
 * KB 4.5 - Multi-Tenant Isolation Hook (Phase 17)
 * Tenant context, data isolation, and resource management
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
  features: string[];
  quotas: TenantQuotas;
  metadata: Record<string, unknown>;
  createdAt: Date;
  status: TenantStatus;
}

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'pending' | 'archived';

export interface TenantSettings {
  theme?: string;
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  customDomain?: string;
  branding?: TenantBranding;
  security?: TenantSecuritySettings;
}

export interface TenantBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  favicon?: string;
  companyName?: string;
}

export interface TenantSecuritySettings {
  mfaRequired?: boolean;
  passwordPolicy?: PasswordPolicy;
  sessionTimeout?: number;
  ipWhitelist?: string[];
  allowedDomains?: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // last N passwords
}

export interface TenantQuotas {
  maxUsers?: number;
  maxStorage?: number; // bytes
  maxApiCalls?: number; // per day
  maxProjects?: number;
  customQuotas?: Record<string, number>;
}

export interface TenantContext {
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  setTenant: (tenant: Tenant | null) => void;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
}

export interface TenantProviderProps {
  children: React.ReactNode;
  initialTenant?: Tenant | null;
  fetchTenant?: (id: string) => Promise<Tenant>;
  onTenantChange?: (tenant: Tenant | null) => void;
  persistKey?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContextInstance = createContext<TenantContext | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function TenantProvider({
  children,
  initialTenant = null,
  fetchTenant,
  onTenantChange,
  persistKey = 'kb_current_tenant',
}: TenantProviderProps): React.ReactElement {
  const [tenant, setTenantState] = useState<Tenant | null>(() => {
    if (initialTenant) return initialTenant;
    
    // Try to restore from storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setTenant = useCallback((newTenant: Tenant | null) => {
    setTenantState(newTenant);
    setError(null);
    
    if (typeof window !== 'undefined') {
      if (newTenant) {
        localStorage.setItem(persistKey, JSON.stringify(newTenant));
      } else {
        localStorage.removeItem(persistKey);
      }
    }
    
    onTenantChange?.(newTenant);
  }, [onTenantChange, persistKey]);

  const switchTenant = useCallback(async (tenantId: string) => {
    if (!fetchTenant) {
      throw new Error('fetchTenant function not provided');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newTenant = await fetchTenant(tenantId);
      setTenant(newTenant);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTenant, setTenant]);

  const refreshTenant = useCallback(async () => {
    if (!tenant || !fetchTenant) return;
    
    setIsLoading(true);
    try {
      const refreshedTenant = await fetchTenant(tenant.id);
      setTenant(refreshedTenant);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [tenant, fetchTenant, setTenant]);

  const contextValue = useMemo((): TenantContext => ({
    tenant,
    isLoading,
    error,
    setTenant,
    switchTenant,
    refreshTenant,
  }), [tenant, isLoading, error, setTenant, switchTenant, refreshTenant]);

  return React.createElement(
    TenantContextInstance.Provider,
    { value: contextValue },
    children
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useTenant(): TenantContext {
  const context = useContext(TenantContextInstance);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

export function useTenantId(): string | null {
  const { tenant } = useTenant();
  return tenant?.id || null;
}

export function useTenantSettings(): TenantSettings | null {
  const { tenant } = useTenant();
  return tenant?.settings || null;
}

export function useTenantFeature(featureName: string): boolean {
  const { tenant } = useTenant();
  return tenant?.features.includes(featureName) ?? false;
}

export function useTenantQuota(quotaName: keyof TenantQuotas | string): number | undefined {
  const { tenant } = useTenant();
  if (!tenant) return undefined;
  
  if (quotaName in tenant.quotas) {
    return tenant.quotas[quotaName as keyof TenantQuotas] as number;
  }
  
  return tenant.quotas.customQuotas?.[quotaName];
}

// ============================================================================
// DATA ISOLATION HOOK
// ============================================================================

export interface DataIsolationConfig<T> {
  baseQuery: () => Promise<T[]>;
  tenantIdField?: string;
  additionalFilters?: (tenant: Tenant) => Record<string, unknown>;
  transformResult?: (data: T[], tenant: Tenant) => T[];
}

export function useKBTenantData<T>(config: DataIsolationConfig<T>): {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { tenant } = useTenant();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenant) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result = await config.baseQuery();
      
      // Apply tenant filter
      if (config.tenantIdField) {
        result = result.filter(
          (item: T) => (item as Record<string, unknown>)[config.tenantIdField!] === tenant.id
        );
      }

      // Apply additional filters
      if (config.additionalFilters) {
        const filters = config.additionalFilters(tenant);
        result = result.filter((item: T) => {
          return Object.entries(filters).every(
            ([key, value]) => (item as Record<string, unknown>)[key] === value
          );
        });
      }

      // Transform result
      if (config.transformResult) {
        result = config.transformResult(result, tenant);
      }

      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [tenant, config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// RESOURCE ISOLATION
// ============================================================================

export interface TenantResourceUsage {
  users: { current: number; max: number };
  storage: { current: number; max: number };
  apiCalls: { current: number; max: number };
  custom: Record<string, { current: number; max: number }>;
}

export function useKBTenantResources(): {
  usage: TenantResourceUsage | null;
  isNearLimit: (resource: string) => boolean;
  isOverLimit: (resource: string) => boolean;
  canUse: (resource: string, amount?: number) => boolean;
  getUsagePercentage: (resource: string) => number;
} {
  const { tenant } = useTenant();
  const [usage, setUsage] = useState<TenantResourceUsage | null>(null);

  // In a real implementation, this would fetch from an API
  useEffect(() => {
    if (!tenant) {
      setUsage(null);
      return;
    }

    // Simulated usage data
    setUsage({
      users: { current: 5, max: tenant.quotas.maxUsers || 10 },
      storage: { current: 1024 * 1024 * 100, max: tenant.quotas.maxStorage || 1024 * 1024 * 1024 },
      apiCalls: { current: 500, max: tenant.quotas.maxApiCalls || 10000 },
      custom: Object.entries(tenant.quotas.customQuotas || {}).reduce((acc, [key, max]) => {
        acc[key] = { current: 0, max };
        return acc;
      }, {} as Record<string, { current: number; max: number }>),
    });
  }, [tenant]);

  const getResourceUsage = useCallback((resource: string): { current: number; max: number } | null => {
    if (!usage) return null;
    
    if (resource in usage) {
      return usage[resource as keyof Omit<TenantResourceUsage, 'custom'>] as { current: number; max: number };
    }
    
    return usage.custom[resource] || null;
  }, [usage]);

  const getUsagePercentage = useCallback((resource: string): number => {
    const resourceUsage = getResourceUsage(resource);
    if (!resourceUsage || resourceUsage.max === 0) return 0;
    return (resourceUsage.current / resourceUsage.max) * 100;
  }, [getResourceUsage]);

  const isNearLimit = useCallback((resource: string, threshold = 80): boolean => {
    return getUsagePercentage(resource) >= threshold;
  }, [getUsagePercentage]);

  const isOverLimit = useCallback((resource: string): boolean => {
    return getUsagePercentage(resource) >= 100;
  }, [getUsagePercentage]);

  const canUse = useCallback((resource: string, amount = 1): boolean => {
    const resourceUsage = getResourceUsage(resource);
    if (!resourceUsage) return true;
    return resourceUsage.current + amount <= resourceUsage.max;
  }, [getResourceUsage]);

  return {
    usage,
    isNearLimit,
    isOverLimit,
    canUse,
    getUsagePercentage,
  };
}

// ============================================================================
// TENANT SCOPED STORAGE
// ============================================================================

export function useKBTenantStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { tenant } = useTenant();
  const tenantKey = tenant ? `tenant_${tenant.id}_${key}` : key;

  const [value, setValueState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    const stored = localStorage.getItem(tenantKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  });

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueState(prev => {
      const resolved = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(tenantKey, JSON.stringify(resolved));
      }
      
      return resolved;
    });
  }, [tenantKey]);

  const clearValue = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(tenantKey);
    }
    setValueState(defaultValue);
  }, [tenantKey, defaultValue]);

  // Update when tenant changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(tenantKey);
    if (stored) {
      try {
        setValueState(JSON.parse(stored));
      } catch {
        setValueState(defaultValue);
      }
    } else {
      setValueState(defaultValue);
    }
  }, [tenantKey, defaultValue]);

  return [value, setValue, clearValue];
}

// ============================================================================
// TENANT SWITCHING GUARD
// ============================================================================

export function useKBTenantGuard(
  allowedStatuses: TenantStatus[] = ['active', 'trial']
): {
  isAllowed: boolean;
  reason: string | null;
  requireStatus: (status: TenantStatus[]) => boolean;
} {
  const { tenant } = useTenant();

  const isAllowed = useMemo(() => {
    if (!tenant) return false;
    return allowedStatuses.includes(tenant.status);
  }, [tenant, allowedStatuses]);

  const reason = useMemo(() => {
    if (!tenant) return 'No tenant selected';
    if (!allowedStatuses.includes(tenant.status)) {
      return `Tenant status '${tenant.status}' is not allowed`;
    }
    return null;
  }, [tenant, allowedStatuses]);

  const requireStatus = useCallback((statuses: TenantStatus[]): boolean => {
    if (!tenant) return false;
    return statuses.includes(tenant.status);
  }, [tenant]);

  return { isAllowed, reason, requireStatus };
}

// ============================================================================
// TENANT AUDIT LOG
// ============================================================================

export interface TenantAuditEntry {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function useKBTenantAudit(): {
  log: (action: string, resource: string, details?: Record<string, unknown>) => void;
  getAuditLog: (filters?: Partial<TenantAuditEntry>) => TenantAuditEntry[];
} {
  const { tenant } = useTenant();
  const auditLogRef = useRef<TenantAuditEntry[]>([]);

  const log = useCallback((
    action: string,
    resource: string,
    details?: Record<string, unknown>
  ) => {
    if (!tenant) return;

    const entry: TenantAuditEntry = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      action,
      resource,
      details,
      timestamp: new Date(),
    };

    auditLogRef.current.push(entry);

    // Keep only last 1000 entries in memory
    if (auditLogRef.current.length > 1000) {
      auditLogRef.current = auditLogRef.current.slice(-1000);
    }

    // In production, this would send to a backend
    console.debug('[TenantAudit]', entry);
  }, [tenant]);

  const getAuditLog = useCallback((filters?: Partial<TenantAuditEntry>): TenantAuditEntry[] => {
    if (!filters) return [...auditLogRef.current];

    return auditLogRef.current.filter(entry => {
      return Object.entries(filters).every(([key, value]) => {
        return entry[key as keyof TenantAuditEntry] === value;
      });
    });
  }, []);

  return { log, getAuditLog };
}

export default useTenant;
