/**
 * useLicenseClient - Hook para validación de licencia en cliente
 * Fase 5 - Enterprise SaaS 2025-2026
 * 
 * Uso en aplicaciones cliente para:
 * - Activar licencias
 * - Validar estado de licencia
 * - Verificar acceso a features
 * - Heartbeat automático
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDeviceFingerprint } from './useDeviceFingerprint';

// === INTERFACES ===
export interface LicenseState {
  isValid: boolean;
  isActivated: boolean;
  licenseKey: string | null;
  licenseId: string | null;
  expiresAt: string | null;
  plan: string | null;
  features: string[];
  limits: Record<string, number>;
  lastValidated: string | null;
  offlineValidUntil: string | null;
  deviceId: string | null;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  licenseId?: string;
  expiresAt?: string;
  features?: string[];
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  limit?: number;
  used?: number;
  remaining?: number;
}

// === STORAGE KEYS ===
const STORAGE_KEYS = {
  LICENSE_STATE: 'lov_license_state',
  LICENSE_KEY: 'lov_license_key',
  DEVICE_ID: 'lov_device_id',
  OFFLINE_TOKEN: 'lov_offline_token'
};

// === DEFAULT STATE ===
const DEFAULT_STATE: LicenseState = {
  isValid: false,
  isActivated: false,
  licenseKey: null,
  licenseId: null,
  expiresAt: null,
  plan: null,
  features: [],
  limits: {},
  lastValidated: null,
  offlineValidUntil: null,
  deviceId: null
};

// === HOOK ===
export function useLicenseClient() {
  const [state, setState] = useState<LicenseState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LICENSE_STATE);
      return stored ? JSON.parse(stored) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { fingerprint, generateFingerprint } = useDeviceFingerprint();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const isOnline = useRef(navigator.onLine);

  // === PERSIST STATE ===
  const persistState = useCallback((newState: LicenseState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEYS.LICENSE_STATE, JSON.stringify(newState));
    } catch (e) {
      console.error('[LicenseClient] Error persisting state:', e);
    }
  }, []);

  // === ACTIVATE LICENSE ===
  const activateLicense = useCallback(async (
    licenseKey: string,
    metadata?: Record<string, unknown>
  ): Promise<ActivationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate device fingerprint
      const fpResult = fingerprint.fingerprint || (await generateFingerprint()).fingerprint;
      const deviceFp = fpResult;
      
      if (!deviceFp) {
        throw new Error('No se pudo generar la huella del dispositivo');
      }

      const { data, error: fnError } = await supabase.functions.invoke('license-manager', {
        body: {
          action: 'activate',
          license_key: licenseKey,
          device_fingerprint: deviceFp,
          device_name: navigator.userAgent.slice(0, 50),
          device_type: getDeviceType(),
          metadata: {
            ...metadata,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        const newState: LicenseState = {
          isValid: true,
          isActivated: true,
          licenseKey: licenseKey,
          licenseId: data.license_id,
          expiresAt: data.expires_at,
          plan: data.plan || 'standard',
          features: data.features || [],
          limits: data.limits || {},
          lastValidated: new Date().toISOString(),
          offlineValidUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h
          deviceId: data.device_id
        };

        persistState(newState);
        localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, licenseKey);
        
        // Start heartbeat
        startHeartbeat();

        toast.success('Licencia activada correctamente');
        
        return {
          success: true,
          message: 'Licencia activada correctamente',
          licenseId: data.license_id,
          expiresAt: data.expires_at,
          features: data.features
        };
      }

      throw new Error(data?.message || 'Error al activar la licencia');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, [fingerprint, generateFingerprint, persistState]);

  // === VALIDATE LICENSE ===
  const validateLicense = useCallback(async (force = false): Promise<boolean> => {
    // Check if we can use cached validation
    if (!force && state.isValid && state.lastValidated) {
      const lastCheck = new Date(state.lastValidated).getTime();
      const now = Date.now();
      
      // If validated within last 5 minutes, use cache
      if (now - lastCheck < 5 * 60 * 1000) {
        return true;
      }
    }

    // If offline, check offline validity
    if (!navigator.onLine) {
      return checkOfflineValidity();
    }

    if (!state.licenseKey) {
      return false;
    }

    setIsLoading(true);

    try {
      const fpResult = fingerprint.fingerprint || (await generateFingerprint()).fingerprint;
      const deviceFp = fpResult;

      const { data, error: fnError } = await supabase.functions.invoke('license-manager', {
        body: {
          action: 'validate',
          license_key: state.licenseKey,
          device_fingerprint: deviceFp
        }
      });

      if (fnError) throw fnError;

      const isValid = data?.valid === true;

      persistState({
        ...state,
        isValid,
        lastValidated: new Date().toISOString(),
        offlineValidUntil: isValid 
          ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() 
          : null,
        features: data?.features || state.features,
        limits: data?.limits || state.limits
      });

      return isValid;
    } catch (err) {
      console.error('[LicenseClient] Validation error:', err);
      // Fall back to offline check on network error
      return checkOfflineValidity();
    } finally {
      setIsLoading(false);
    }
  }, [state, fingerprint, generateFingerprint, persistState]);

  // === CHECK OFFLINE VALIDITY ===
  const checkOfflineValidity = useCallback((): boolean => {
    if (!state.offlineValidUntil) return false;
    
    const offlineUntil = new Date(state.offlineValidUntil).getTime();
    const now = Date.now();
    
    return now < offlineUntil;
  }, [state.offlineValidUntil]);

  // === CHECK FEATURE ACCESS ===
  const checkFeature = useCallback((featureKey: string): FeatureAccess => {
    if (!state.isValid || !state.isActivated) {
      return { 
        hasAccess: false, 
        reason: 'Licencia no válida o no activada' 
      };
    }

    // Check if feature is in the allowed list
    if (state.features.length > 0 && !state.features.includes(featureKey)) {
      return { 
        hasAccess: false, 
        reason: 'Esta función no está incluida en tu plan' 
      };
    }

    // Check limits
    const limit = state.limits[featureKey];
    if (typeof limit === 'number') {
      // For now, assume no usage tracking - just return the limit
      return {
        hasAccess: true,
        limit,
        used: 0,
        remaining: limit
      };
    }

    return { hasAccess: true };
  }, [state]);

  // === DEACTIVATE LICENSE ===
  const deactivateLicense = useCallback(async (): Promise<boolean> => {
    if (!state.deviceId || !state.licenseId) {
      persistState(DEFAULT_STATE);
      return true;
    }

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('license-manager', {
        body: {
          action: 'deactivate_device',
          license_id: state.licenseId,
          device_id: state.deviceId
        }
      });

      if (fnError) throw fnError;

      // Clear local state
      persistState(DEFAULT_STATE);
      localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
      localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
      
      stopHeartbeat();
      
      toast.success('Licencia desactivada correctamente');
      return true;
    } catch (err) {
      console.error('[LicenseClient] Deactivation error:', err);
      // Still clear local state
      persistState(DEFAULT_STATE);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [state, persistState]);

  // === HEARTBEAT ===
  const sendHeartbeat = useCallback(async () => {
    if (!state.isValid || !state.licenseKey || !navigator.onLine) {
      return;
    }

    try {
      const deviceFp = fingerprint.fingerprint;

      await supabase.functions.invoke('license-manager', {
        body: {
          action: 'heartbeat',
          license_key: state.licenseKey,
          device_fingerprint: deviceFp
        }
      });

      // Extend offline validity
      persistState({
        ...state,
        lastValidated: new Date().toISOString(),
        offlineValidUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      });
    } catch (err) {
      console.error('[LicenseClient] Heartbeat error:', err);
    }
  }, [state, fingerprint, persistState]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    // Send heartbeat every 30 minutes
    heartbeatInterval.current = setInterval(sendHeartbeat, 30 * 60 * 1000);
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // === GET REMAINING DAYS ===
  const getRemainingDays = useCallback((): number | null => {
    if (!state.expiresAt) return null;
    
    const expires = new Date(state.expiresAt).getTime();
    const now = Date.now();
    const diffMs = expires - now;
    
    if (diffMs <= 0) return 0;
    
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [state.expiresAt]);

  // === ONLINE/OFFLINE HANDLING ===
  useEffect(() => {
    const handleOnline = () => {
      isOnline.current = true;
      // Revalidate when coming back online
      validateLicense(true);
    };

    const handleOffline = () => {
      isOnline.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [validateLicense]);

  // === INITIAL VALIDATION & HEARTBEAT ===
  useEffect(() => {
    if (state.isActivated && state.licenseKey) {
      validateLicense();
      startHeartbeat();
    }

    return () => stopHeartbeat();
  }, []);

  return {
    // State
    state,
    isLoading,
    error,
    isValid: state.isValid,
    isActivated: state.isActivated,
    plan: state.plan,
    features: state.features,
    remainingDays: getRemainingDays(),
    // Actions
    activateLicense,
    validateLicense,
    deactivateLicense,
    checkFeature,
    checkOfflineValidity,
    sendHeartbeat
  };
}

// === HELPERS ===
function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'mobile';
  }
  
  return 'desktop';
}

export default useLicenseClient;
