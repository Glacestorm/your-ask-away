// XAMA Context Provider
// Provides XAMA authentication state and methods throughout the application

import React, { createContext, useContext, ReactNode } from 'react';
import { useXAMA, UseXAMAReturn } from '@/hooks/useXAMA';
import { ContinuousAuthConfig } from '@/lib/xama/continuousAuth';

const XAMAContext = createContext<UseXAMAReturn | null>(null);

interface XAMAProviderProps {
  children: ReactNode;
  config?: Partial<ContinuousAuthConfig>;
}

export function XAMAProvider({ children, config }: XAMAProviderProps) {
  const xama = useXAMA(config);
  
  return (
    <XAMAContext.Provider value={xama}>
      {children}
    </XAMAContext.Provider>
  );
}

export function useXAMAContext(): UseXAMAReturn {
  const context = useContext(XAMAContext);
  if (!context) {
    throw new Error('useXAMAContext must be used within a XAMAProvider');
  }
  return context;
}

// HOC for protecting components with XAMA
export function withXAMAProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredSensitivity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  return function XAMAProtectedComponent(props: P) {
    const { isAuthorizedForResource, state, verifyForResource } = useXAMAContext();
    
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    
    React.useEffect(() => {
      const checkAuthorization = async () => {
        if (isAuthorizedForResource(requiredSensitivity)) {
          setIsAuthorized(true);
        } else {
          setIsVerifying(true);
          const result = await verifyForResource(requiredSensitivity);
          setIsAuthorized(result);
          setIsVerifying(false);
        }
      };
      
      if (state.profile) {
        checkAuthorization();
      }
    }, [state.profile]);
    
    if (!state.profile) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Inicialitzant autenticació XAMA...</p>
          </div>
        </div>
      );
    }
    
    if (isVerifying) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verificant atributs de seguretat...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthorized) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Accés Denegat</h3>
            <p className="text-muted-foreground mb-4">
              No tens els atributs d'autenticació suficients per accedir a aquest recurs.
            </p>
            <p className="text-sm text-muted-foreground">
              Nivell requerit: <span className="font-medium">{requiredSensitivity.toUpperCase()}</span>
            </p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}
