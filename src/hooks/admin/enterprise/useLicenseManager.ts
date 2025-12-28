/**
 * useLicenseManager Hook
 * Fase 1 - Sistema de Licencias Enterprise
 * 
 * Hook completo para gestión de licencias con:
 * - Generación de licencias con Ed25519
 * - Validación online/offline
 * - Activación de dispositivos
 * - Gestión de entitlements
 * - Heartbeat automático
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// INTERFACES
// ============================================

export interface LicensePlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  features: Record<string, boolean | number>;
  price_monthly: number | null;
  price_yearly: number | null;
  max_users_default: number;
  max_devices_default: number;
  max_api_calls_month: number | null;
  trial_days: number;
  is_active: boolean;
  display_order: number;
}

export interface License {
  id: string;
  license_key?: string; // Solo disponible al generar
  license_type: 'trial' | 'freemium' | 'subscription' | 'perpetual' | 'usage_based' | 'floating' | 'node_locked' | 'enterprise';
  plan_id: string | null;
  licensee_email: string;
  licensee_name: string | null;
  licensee_company: string | null;
  max_users: number;
  max_devices: number;
  max_api_calls_month: number | null;
  max_concurrent_sessions: number;
  issued_at: string;
  valid_from: string;
  expires_at: string | null;
  last_validated_at: string | null;
  last_heartbeat_at: string | null;
  status: 'pending' | 'active' | 'suspended' | 'expired' | 'revoked' | 'cancelled';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  plan?: LicensePlan;
  entitlements?: LicenseEntitlement[];
  devices?: DeviceActivation[];
}

export interface LicenseEntitlement {
  id: string;
  license_id: string;
  feature_key: string;
  feature_name: string | null;
  is_enabled: boolean;
  usage_limit: number | null;
  usage_current: number;
  reset_period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  last_reset_at: string | null;
  valid_from: string;
  valid_until: string | null;
  metadata: Record<string, unknown>;
}

export interface DeviceActivation {
  id: string;
  license_id: string;
  device_fingerprint: string;
  device_name: string | null;
  device_type: 'desktop' | 'web' | 'mobile' | 'server' | 'vm';
  hardware_info: Record<string, unknown>;
  first_activated_at: string;
  last_seen_at: string;
  is_active: boolean;
  session_count: number;
}

export interface DeviceFingerprint {
  cpuHash?: string;
  screenFingerprint?: string;
  timezoneHash?: string;
  languageHash?: string;
  webGLHash?: string;
  canvasHash?: string;
  audioHash?: string;
  storageQuotaHash?: string;
}

export interface GenerateLicenseParams {
  planId?: string;
  planCode?: string;
  licenseeEmail: string;
  licenseeName?: string;
  licenseeCompany?: string;
  licenseType?: License['license_type'];
  maxUsers?: number;
  maxDevices?: number;
  maxApiCallsMonth?: number;
  validDays?: number;
  features?: Record<string, boolean | number>;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  result: string;
  details: Record<string, unknown>;
  license: License | null;
  publicKey?: string;
}

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number | null;
  limit?: number;
}

// ============================================
// DEVICE FINGERPRINTING
// ============================================

async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];
  
  // Screen info
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform || 'unknown');
  
  // Hardware concurrency
  components.push(String(navigator.hardwareConcurrency || 0));
  
  // Device memory (if available)
  components.push(String((navigator as { deviceMemory?: number }).deviceMemory || 0));
  
  // WebGL renderer (if available)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push((gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown');
      }
    }
  } catch {
    components.push('no-webgl');
  }
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Obelixia License Fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('no-canvas');
  }

  // Generate hash
  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// OFFLINE STORAGE
// ============================================

const LICENSE_STORAGE_KEY = 'obelixia_license_cache';
const GRACE_PERIOD_HOURS = 72;

interface CachedLicense {
  license: License;
  publicKey: string;
  cachedAt: number;
  lastOnlineValidation: number;
}

function getCachedLicense(): CachedLicense | null {
  try {
    const cached = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function setCachedLicense(license: License, publicKey: string): void {
  try {
    const cache: CachedLicense = {
      license,
      publicKey,
      cachedAt: Date.now(),
      lastOnlineValidation: Date.now(),
    };
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    console.warn('[useLicenseManager] Failed to cache license');
  }
}

function clearCachedLicense(): void {
  try {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

function isWithinGracePeriod(cachedLicense: CachedLicense): boolean {
  const hoursSinceValidation = (Date.now() - cachedLicense.lastOnlineValidation) / (1000 * 60 * 60);
  return hoursSinceValidation < GRACE_PERIOD_HOURS;
}

// ============================================
// HOOK
// ============================================

export function useLicenseManager() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [currentLicense, setCurrentLicense] = useState<License | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Refs
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const licenseKeyRef = useRef<string | null>(null);

  // ============================================
  // INITIALIZATION
  // ============================================

  // Generate device fingerprint on mount
  useEffect(() => {
    generateDeviceFingerprint().then(setDeviceFingerprint);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================
  // API CALLS
  // ============================================

  const callLicenseAPI = useCallback(async <T>(
    action: string, 
    params?: Record<string, unknown>
  ): Promise<T> => {
    const { data, error: fnError } = await supabase.functions.invoke('license-manager', {
      body: { action, params }
    });

    if (fnError) throw fnError;
    if (!data?.success) throw new Error(data?.error || 'Unknown error');
    
    return data.data as T;
  }, []);

  // ============================================
  // PLANS
  // ============================================

  const fetchPlans = useCallback(async (): Promise<LicensePlan[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await callLicenseAPI<{ plans: LicensePlan[] }>('get_plans');
      setPlans(result.plans);
      return result.plans;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching plans';
      setError(message);
      console.error('[useLicenseManager] fetchPlans error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [callLicenseAPI]);

  // ============================================
  // GENERATE LICENSE
  // ============================================

  const generateLicense = useCallback(async (
    params: GenerateLicenseParams
  ): Promise<{ license: License; licenseKey: string; publicKey: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await callLicenseAPI<{ 
        license: License & { licenseKey: string }; 
        publicKey: string 
      }>('generate', params as unknown as Record<string, unknown>);

      toast.success('Licencia generada correctamente');
      console.log('[useLicenseManager] License generated:', result.license.id);

      return {
        license: result.license,
        licenseKey: result.license.licenseKey,
        publicKey: result.publicKey,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating license';
      setError(message);
      toast.error(message);
      console.error('[useLicenseManager] generateLicense error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [callLicenseAPI]);

  // ============================================
  // VALIDATE LICENSE
  // ============================================

  const validateLicense = useCallback(async (
    licenseKey: string,
    options?: { activateDevice?: boolean }
  ): Promise<ValidationResult> => {
    setError(null);

    // Try online validation first
    if (isOnline) {
      try {
        const result = await callLicenseAPI<ValidationResult>('validate', {
          licenseKey,
          deviceFingerprint: options?.activateDevice ? deviceFingerprint : undefined,
        });

        if (result.valid && result.license) {
          setCurrentLicense(result.license);
          licenseKeyRef.current = licenseKey;
          
          // Cache for offline use
          if (result.publicKey) {
            setCachedLicense(result.license, result.publicKey);
          }

          // Activate device if requested
          if (options?.activateDevice && deviceFingerprint) {
            await activateDevice(licenseKey, deviceFingerprint);
          }
        }

        return result;
      } catch (err) {
        console.error('[useLicenseManager] Online validation failed:', err);
        // Fall through to offline validation
      }
    }

    // Offline validation
    const cached = getCachedLicense();
    if (cached && isWithinGracePeriod(cached)) {
      console.log('[useLicenseManager] Using cached license (offline mode)');
      setCurrentLicense(cached.license);
      
      // Check if license is still valid
      const isExpired = cached.license.expires_at && 
        new Date(cached.license.expires_at) < new Date();
      
      return {
        valid: cached.license.status === 'active' && !isExpired,
        result: isExpired ? 'expired' : 'offline_grace',
        details: { offlineMode: true, gracePeriodHours: GRACE_PERIOD_HOURS },
        license: cached.license,
        publicKey: cached.publicKey,
      };
    }

    // No valid cache
    return {
      valid: false,
      result: 'offline_no_cache',
      details: { message: 'No internet connection and no valid cached license' },
      license: null,
    };
  }, [isOnline, deviceFingerprint, callLicenseAPI]);

  // ============================================
  // ACTIVATE/DEACTIVATE DEVICE
  // ============================================

  const activateDevice = useCallback(async (
    licenseKey: string,
    fingerprint?: string,
    deviceInfo?: { deviceName?: string; deviceType?: DeviceActivation['device_type'] }
  ): Promise<boolean> => {
    const fp = fingerprint || deviceFingerprint;
    if (!fp) {
      toast.error('No se pudo generar fingerprint del dispositivo');
      return false;
    }

    try {
      await callLicenseAPI('activate_device', {
        licenseKey,
        deviceFingerprint: fp,
        deviceName: deviceInfo?.deviceName || `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`,
        deviceType: deviceInfo?.deviceType || 'web',
      });

      toast.success('Dispositivo activado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error activating device';
      toast.error(message);
      return false;
    }
  }, [deviceFingerprint, callLicenseAPI]);

  const deactivateDevice = useCallback(async (
    params: { licenseKey?: string; deviceFingerprint?: string; deviceId?: string; reason?: string }
  ): Promise<boolean> => {
    try {
      await callLicenseAPI('deactivate_device', params);
      toast.success('Dispositivo desactivado');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deactivating device';
      toast.error(message);
      return false;
    }
  }, [callLicenseAPI]);

  // ============================================
  // REVOKE LICENSE
  // ============================================

  const revokeLicense = useCallback(async (
    licenseId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      await callLicenseAPI('revoke', { licenseId, reason });
      toast.success('Licencia revocada');
      
      if (currentLicense?.id === licenseId) {
        setCurrentLicense(null);
        clearCachedLicense();
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error revoking license';
      toast.error(message);
      return false;
    }
  }, [currentLicense, callLicenseAPI]);

  // ============================================
  // ENTITLEMENTS & FEATURES
  // ============================================

  const getEntitlements = useCallback(async (
    licenseId?: string,
    licenseKey?: string
  ): Promise<LicenseEntitlement[]> => {
    try {
      const result = await callLicenseAPI<{ entitlements: LicenseEntitlement[] }>(
        'get_entitlements', 
        { licenseId, licenseKey }
      );
      return result.entitlements;
    } catch (err) {
      console.error('[useLicenseManager] getEntitlements error:', err);
      return [];
    }
  }, [callLicenseAPI]);

  const checkFeature = useCallback(async (
    featureKey: string,
    licenseKey?: string
  ): Promise<FeatureCheckResult> => {
    const key = licenseKey || licenseKeyRef.current;
    if (!key) {
      return { allowed: false, reason: 'no_license' };
    }

    // Check cache first for quick response
    if (currentLicense?.entitlements) {
      const entitlement = currentLicense.entitlements.find(e => e.feature_key === featureKey);
      if (entitlement) {
        if (!entitlement.is_enabled) {
          return { allowed: false, reason: 'feature_disabled' };
        }
        if (entitlement.usage_limit && entitlement.usage_current >= entitlement.usage_limit) {
          return { allowed: false, reason: 'usage_limit_exceeded', limit: entitlement.usage_limit };
        }
        return { 
          allowed: true, 
          remaining: entitlement.usage_limit ? entitlement.usage_limit - entitlement.usage_current : null 
        };
      }
    }

    // Online check
    if (isOnline) {
      try {
        return await callLicenseAPI<FeatureCheckResult>('check_feature', {
          licenseKey: key,
          featureKey,
        });
      } catch {
        // Fall through
      }
    }

    return { allowed: false, reason: 'unknown' };
  }, [currentLicense, isOnline, callLicenseAPI]);

  const logUsage = useCallback(async (
    featureKey: string,
    action: string,
    quantity: number = 1,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    const key = licenseKeyRef.current;
    if (!key || !isOnline) return;

    try {
      await callLicenseAPI('log_usage', {
        licenseKey: key,
        featureKey,
        action,
        quantity,
        metadata,
      });
    } catch (err) {
      console.warn('[useLicenseManager] logUsage error:', err);
    }
  }, [isOnline, callLicenseAPI]);

  // ============================================
  // LICENSE INFO
  // ============================================

  const getLicenseInfo = useCallback(async (
    licenseId?: string,
    licenseKey?: string
  ): Promise<License | null> => {
    try {
      const result = await callLicenseAPI<{ license: License }>(
        'get_license_info',
        { licenseId, licenseKey }
      );
      return result.license;
    } catch (err) {
      console.error('[useLicenseManager] getLicenseInfo error:', err);
      return null;
    }
  }, [callLicenseAPI]);

  // ============================================
  // HEARTBEAT
  // ============================================

  const sendHeartbeat = useCallback(async (): Promise<boolean> => {
    const key = licenseKeyRef.current;
    if (!key || !isOnline) return false;

    try {
      const result = await callLicenseAPI<{ valid: boolean; status: string }>('heartbeat', {
        licenseKey: key,
        deviceFingerprint,
      });

      if (!result.valid && currentLicense) {
        // License became invalid
        toast.warning('Tu licencia ha expirado o fue revocada');
        setCurrentLicense(null);
        clearCachedLicense();
      }

      return result.valid;
    } catch (err) {
      console.warn('[useLicenseManager] heartbeat error:', err);
      return false;
    }
  }, [isOnline, deviceFingerprint, currentLicense, callLicenseAPI]);

  const startHeartbeat = useCallback((intervalMs: number = 60000 * 5) => { // 5 minutes default
    stopHeartbeat();
    sendHeartbeat();
    heartbeatInterval.current = setInterval(sendHeartbeat, intervalMs);
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => stopHeartbeat();
  }, [stopHeartbeat]);

  // ============================================
  // UTILITY
  // ============================================

  const clearError = useCallback(() => setError(null), []);

  const logout = useCallback(() => {
    stopHeartbeat();
    setCurrentLicense(null);
    licenseKeyRef.current = null;
    clearCachedLicense();
  }, [stopHeartbeat]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    isLoading,
    error,
    plans,
    currentLicense,
    deviceFingerprint,
    isOnline,

    // Plans
    fetchPlans,

    // License lifecycle
    generateLicense,
    validateLicense,
    revokeLicense,
    getLicenseInfo,

    // Device management
    activateDevice,
    deactivateDevice,

    // Features & entitlements
    getEntitlements,
    checkFeature,
    logUsage,

    // Heartbeat
    sendHeartbeat,
    startHeartbeat,
    stopHeartbeat,

    // Utilities
    clearError,
    logout,
  };
}

export default useLicenseManager;
