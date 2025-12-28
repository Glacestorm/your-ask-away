/**
 * LicenseContext - Provider para protección de funcionalidades
 * Fase 5 - Enterprise SaaS 2025-2026
 */

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useLicenseClient, type LicenseState, type FeatureAccess } from '@/hooks/admin/enterprise/useLicenseClient';
import { toast } from 'sonner';

interface LicenseContextValue {
  // State
  state: LicenseState;
  isLoading: boolean;
  isValid: boolean;
  isActivated: boolean;
  plan: string | null;
  features: string[];
  remainingDays: number | null;
  // Actions
  activateLicense: (key: string, metadata?: Record<string, unknown>) => Promise<any>;
  deactivateLicense: () => Promise<boolean>;
  validateLicense: (force?: boolean) => Promise<boolean>;
  checkFeature: (feature: string) => FeatureAccess;
  // Helpers
  requireFeature: (feature: string, onDenied?: () => void) => boolean;
  requireLicense: (onDenied?: () => void) => boolean;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

interface LicenseProviderProps {
  children: ReactNode;
  onLicenseRequired?: () => void;
  onFeatureDenied?: (feature: string) => void;
}

export function LicenseProvider({ 
  children, 
  onLicenseRequired,
  onFeatureDenied 
}: LicenseProviderProps) {
  const license = useLicenseClient();

  // === REQUIRE FEATURE ===
  const requireFeature = useCallback((
    feature: string, 
    onDenied?: () => void
  ): boolean => {
    const access = license.checkFeature(feature);
    
    if (!access.hasAccess) {
      toast.error(access.reason || 'No tienes acceso a esta función');
      if (onDenied) onDenied();
      else if (onFeatureDenied) onFeatureDenied(feature);
      return false;
    }
    
    return true;
  }, [license, onFeatureDenied]);

  // === REQUIRE LICENSE ===
  const requireLicense = useCallback((onDenied?: () => void): boolean => {
    if (!license.isValid || !license.isActivated) {
      toast.error('Se requiere una licencia activa');
      if (onDenied) onDenied();
      else if (onLicenseRequired) onLicenseRequired();
      return false;
    }
    
    return true;
  }, [license.isValid, license.isActivated, onLicenseRequired]);

  const value: LicenseContextValue = {
    state: license.state,
    isLoading: license.isLoading,
    isValid: license.isValid,
    isActivated: license.isActivated,
    plan: license.plan,
    features: license.features,
    remainingDays: license.remainingDays,
    activateLicense: license.activateLicense,
    deactivateLicense: license.deactivateLicense,
    validateLicense: license.validateLicense,
    checkFeature: license.checkFeature,
    requireFeature,
    requireLicense
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
}

// === HOOK ===
export function useLicense() {
  const context = useContext(LicenseContext);
  
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  
  return context;
}

// === HOC FOR PROTECTED COMPONENTS ===
interface WithLicenseOptions {
  requiredFeature?: string;
  requireAnyLicense?: boolean;
  fallback?: ReactNode;
}

export function withLicense<P extends object>(
  Component: React.ComponentType<P>,
  options: WithLicenseOptions = {}
) {
  return function ProtectedComponent(props: P) {
    const { isValid, isActivated, checkFeature } = useLicense();
    const { requiredFeature, requireAnyLicense = true, fallback } = options;

    // Check license requirement
    if (requireAnyLicense && (!isValid || !isActivated)) {
      return fallback || <LicenseRequiredFallback />;
    }

    // Check feature requirement
    if (requiredFeature) {
      const access = checkFeature(requiredFeature);
      if (!access.hasAccess) {
        return fallback || <FeatureDeniedFallback feature={requiredFeature} reason={access.reason} />;
      }
    }

    return <Component {...props} />;
  };
}

// === FALLBACK COMPONENTS ===
function LicenseRequiredFallback() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="font-semibold mb-2">Licencia Requerida</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Necesitas una licencia activa para acceder a esta funcionalidad
      </p>
      <a 
        href="/store" 
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Obtener Licencia
      </a>
    </div>
  );
}

function FeatureDeniedFallback({ feature, reason }: { feature: string; reason?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h3 className="font-semibold mb-2">Función No Disponible</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {reason || `La función "${feature}" no está incluida en tu plan actual`}
      </p>
      <a 
        href="/store" 
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Mejorar Plan
      </a>
    </div>
  );
}

// === PROTECTED ROUTE COMPONENT ===
interface ProtectedByLicenseProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
}

export function ProtectedByLicense({ children, feature, fallback }: ProtectedByLicenseProps) {
  const { isValid, isActivated, checkFeature } = useLicense();

  if (!isValid || !isActivated) {
    return fallback || <LicenseRequiredFallback />;
  }

  if (feature) {
    const access = checkFeature(feature);
    if (!access.hasAccess) {
      return fallback || <FeatureDeniedFallback feature={feature} reason={access.reason} />;
    }
  }

  return <>{children}</>;
}

export default LicenseContext;
