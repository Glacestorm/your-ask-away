/**
 * Hook para Validación Híbrida de Licencias - Fase 2
 * Soporta validación online y offline con grace period
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceFingerprint } from './useDeviceFingerprint';
import { toast } from 'sonner';

export interface LicenseValidationResult {
  isValid: boolean;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'invalid' | 'grace_period' | 'offline';
  message: string;
  license?: {
    id: string;
    planCode: string;
    planName: string;
    expiresAt: string | null;
    maxUsers: number;
    maxDevices: number;
    features: Record<string, boolean>;
  };
  validation: {
    mode: 'online' | 'offline';
    timestamp: string;
    nextValidationAt: string;
    gracePeriodEndsAt?: string;
  };
  device?: {
    isActivated: boolean;
    activationCount: number;
    maxActivations: number;
  };
}

interface CachedValidation {
  result: LicenseValidationResult;
  licenseKey: string;
  validatedAt: string;
  expiresAt: string;
}

const GRACE_PERIOD_HOURS = 72;
const HEARTBEAT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const VALIDATION_CACHE_KEY = 'obelixia_license_validation';

export function useLicenseValidation() {
  const [validationResult, setValidationResult] = useState<LicenseValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  
  const { fingerprint, generateFingerprint } = useDeviceFingerprint();

  // Get cached validation from localStorage
  const getCachedValidation = useCallback((): CachedValidation | null => {
    try {
      const cached = localStorage.getItem(VALIDATION_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Save validation to cache
  const cacheValidation = useCallback((result: LicenseValidationResult, licenseKey: string) => {
    try {
      const cached: CachedValidation = {
        result,
        licenseKey,
        validatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + GRACE_PERIOD_HOURS * 60 * 60 * 1000).toISOString()
      };
      localStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify(cached));
    } catch { /* localStorage might be disabled */ }
  }, []);

  // Clear cached validation
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(VALIDATION_CACHE_KEY);
    } catch { /* ignore */ }
  }, []);

  // Validate license online
  const validateOnline = useCallback(async (
    licenseKey: string,
    deviceFingerprint?: string
  ): Promise<LicenseValidationResult> => {
    const fp = deviceFingerprint || fingerprint?.fingerprint;
    
    if (!fp) {
      // Generate fingerprint if not available
      const newFp = await generateFingerprint();
      if (!newFp) {
        throw new Error('No se pudo generar la huella del dispositivo');
      }
    }

    const { data, error } = await supabase.functions.invoke('license-manager', {
      body: {
        action: 'validate',
        params: {
          licenseKey,
          deviceFingerprint: fp || fingerprint?.fingerprint,
          checkDevice: true
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.success) {
      throw new Error(data?.message || 'Error de validación');
    }

    const validationData = data.data;
    
    const result: LicenseValidationResult = {
      isValid: validationData.isValid,
      status: validationData.status,
      message: validationData.message,
      license: validationData.license ? {
        id: validationData.license.id,
        planCode: validationData.license.planCode,
        planName: validationData.license.planName,
        expiresAt: validationData.license.expiresAt,
        maxUsers: validationData.license.maxUsers,
        maxDevices: validationData.license.maxDevices,
        features: validationData.license.features || {}
      } : undefined,
      validation: {
        mode: 'online',
        timestamp: new Date().toISOString(),
        nextValidationAt: new Date(Date.now() + HEARTBEAT_INTERVAL_MS).toISOString()
      },
      device: validationData.device
    };

    return result;
  }, [fingerprint, generateFingerprint]);

  // Validate license offline using cached data
  const validateOffline = useCallback((licenseKey: string): LicenseValidationResult | null => {
    const cached = getCachedValidation();
    
    if (!cached || cached.licenseKey !== licenseKey) {
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(cached.expiresAt);
    const validatedAt = new Date(cached.validatedAt);
    
    // Check if still within grace period
    if (now > expiresAt) {
      return {
        isValid: false,
        status: 'offline',
        message: 'Período de gracia expirado. Se requiere conexión para validar la licencia.',
        validation: {
          mode: 'offline',
          timestamp: now.toISOString(),
          nextValidationAt: now.toISOString(),
          gracePeriodEndsAt: expiresAt.toISOString()
        }
      };
    }

    // Return cached result with updated metadata
    return {
      ...cached.result,
      status: 'grace_period',
      message: `Modo offline. Validación en caché del ${validatedAt.toLocaleDateString()}.`,
      validation: {
        mode: 'offline',
        timestamp: now.toISOString(),
        nextValidationAt: expiresAt.toISOString(),
        gracePeriodEndsAt: expiresAt.toISOString()
      }
    };
  }, [getCachedValidation]);

  // Main validation function with hybrid online/offline support
  const validateLicense = useCallback(async (
    licenseKey: string,
    options: { forceOnline?: boolean } = {}
  ): Promise<LicenseValidationResult> => {
    setIsValidating(true);

    try {
      // Try online validation first
      try {
        const result = await validateOnline(licenseKey);
        setValidationResult(result);
        setLastValidation(new Date());
        
        // Cache successful validation for offline use
        if (result.isValid) {
          cacheValidation(result, licenseKey);
        }
        
        return result;
      } catch (onlineError) {
        console.warn('[useLicenseValidation] Online validation failed, trying offline:', onlineError);
        
        // If online fails and not forcing online, try offline
        if (!options.forceOnline) {
          const offlineResult = validateOffline(licenseKey);
          
          if (offlineResult) {
            setValidationResult(offlineResult);
            toast.info('Validación offline activa', {
              description: 'Se usará la licencia en caché hasta que se restablezca la conexión.'
            });
            return offlineResult;
          }
        }
        
        throw onlineError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de validación';
      
      const errorResult: LicenseValidationResult = {
        isValid: false,
        status: 'invalid',
        message,
        validation: {
          mode: 'online',
          timestamp: new Date().toISOString(),
          nextValidationAt: new Date().toISOString()
        }
      };
      
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [validateOnline, validateOffline, cacheValidation]);

  // Heartbeat for periodic validation
  const startHeartbeat = useCallback((licenseKey: string) => {
    // Clear existing heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    // Initial validation
    validateLicense(licenseKey);

    // Set up periodic validation
    heartbeatRef.current = setInterval(() => {
      console.log('[useLicenseValidation] Heartbeat validation');
      validateLicense(licenseKey);
    }, HEARTBEAT_INTERVAL_MS);
  }, [validateLicense]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Check entitlement for a specific feature
  const checkEntitlement = useCallback((featureKey: string): boolean => {
    if (!validationResult?.isValid || !validationResult.license?.features) {
      return false;
    }
    return validationResult.license.features[featureKey] === true;
  }, [validationResult]);

  // Get remaining grace period time
  const getGracePeriodRemaining = useCallback((): number | null => {
    if (validationResult?.validation.gracePeriodEndsAt) {
      const endsAt = new Date(validationResult.validation.gracePeriodEndsAt);
      const remaining = endsAt.getTime() - Date.now();
      return Math.max(0, remaining);
    }
    return null;
  }, [validationResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopHeartbeat();
  }, [stopHeartbeat]);

  return {
    validationResult,
    isValidating,
    lastValidation,
    validateLicense,
    validateOnline,
    validateOffline,
    startHeartbeat,
    stopHeartbeat,
    checkEntitlement,
    getGracePeriodRemaining,
    clearCache
  };
}

export default useLicenseValidation;
