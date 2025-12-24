/**
 * Partytown Hook
 * Manages third-party script offloading to web workers
 */

import { useEffect, useState, useCallback } from 'react';
import { 
  canOffloadScript, 
  trackScriptLoad, 
  getPartytownMetrics,
  createPartytownScript,
  type PartytownMetrics 
} from '@/lib/partytown/config';

// === ERROR TIPADO KB ===
export interface PartytownError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface UsePartytownReturn {
  isSupported: boolean;
  metrics: PartytownMetrics;
  loadScript: (src: string, options?: ScriptLoadOptions) => Promise<void>;
  offloadAnalytics: (analyticsId: string, provider: 'plausible' | 'gtag') => void;
  // === KB ADDITIONS ===
  error: PartytownError | null;
  lastRefresh: Date | null;
  clearError: () => void;
}

interface ScriptLoadOptions {
  async?: boolean;
  defer?: boolean;
  id?: string;
  forceMainThread?: boolean;
}

export function usePartytown(): UsePartytownReturn {
  const [isSupported] = useState(() => typeof Worker !== 'undefined');
  const [metrics, setMetrics] = useState<PartytownMetrics>(getPartytownMetrics());
  // === ESTADO KB ===
  const [error, setError] = useState<PartytownError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getPartytownMetrics());
      setLastRefresh(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadScript = useCallback(async (
    src: string, 
    options: ScriptLoadOptions = {}
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const shouldOffload = !options.forceMainThread && canOffloadScript(src);
      
      const script = createPartytownScript(src, {
        async: options.async ?? true,
        defer: options.defer,
        id: options.id,
        onLoad: () => {
          const loadTime = performance.now() - startTime;
          trackScriptLoad(shouldOffload, loadTime);
          setMetrics(getPartytownMetrics());
          resolve();
        },
      });

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }, []);

  const offloadAnalytics = useCallback((
    analyticsId: string, 
    provider: 'plausible' | 'gtag'
  ) => {
    if (!isSupported) {
      console.warn('[Partytown] Web Workers not supported');
      return;
    }

    switch (provider) {
      case 'plausible':
        // Plausible is already configured in index.html
        // This function ensures it's tracked
        if (typeof (window as any).plausible !== 'undefined') {
          console.log('[Partytown] Plausible analytics active');
        }
        break;

      case 'gtag':
        // Google Analytics setup
        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
          (window as any).dataLayer.push(args);
        }
        gtag('js', new Date());
        gtag('config', analyticsId);
        
        loadScript(
          `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`,
          { async: true }
        ).catch(console.error);
        break;
    }
  }, [isSupported, loadScript]);

  return {
    isSupported,
    metrics,
    loadScript,
    offloadAnalytics,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

export type { UsePartytownReturn, ScriptLoadOptions };
