/**
 * React Hook for Observability - OpenTelemetry-compatible instrumentation
 * Provides tracing for React components and user interactions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { observability, getObservability, initObservability } from '@/lib/observability';
import { KBStatus, KBError } from '@/hooks/core';

// Re-export for backwards compat
export type ObservabilityError = KBError;

interface UseObservabilityOptions {
  componentName: string;
  trackRenders?: boolean;
  trackMounts?: boolean;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Hook for component-level observability
 */
export function useObservability(options: UseObservabilityOptions) {
  const { componentName, trackRenders = true, trackMounts = true, attributes = {} } = options;
  const renderCount = useRef(0);
  const mountSpanId = useRef<string | null>(null);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Track component mount/unmount
  useEffect(() => {
    if (!trackMounts) return;

    const spanId = observability.startSpan(`component.mount.${componentName}`, {
      kind: 'internal',
      attributes: {
        'component.name': componentName,
        ...attributes,
      },
    });
    mountSpanId.current = spanId;

    observability.recordCounter('component.mount', 1, { component: componentName });

    return () => {
      if (mountSpanId.current) {
        observability.endSpan(mountSpanId.current, 'ok');
      }
      observability.recordCounter('component.unmount', 1, { component: componentName });
    };
  }, [componentName, trackMounts]);

  // Track renders
  useEffect(() => {
    if (!trackRenders) return;

    renderCount.current += 1;
    observability.recordCounter('component.render', 1, { 
      component: componentName,
      renderCount: renderCount.current.toString(),
    });
  });

  // Create a traced function wrapper
  const traceFunction = useCallback(<T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T,
    fnAttributes?: Record<string, string | number | boolean>
  ): T => {
    return ((...args: Parameters<T>) => {
      const spanId = observability.startSpan(`${componentName}.${name}`, {
        kind: 'internal',
        attributes: {
          'component.name': componentName,
          'function.name': name,
          ...fnAttributes,
        },
      });

      try {
        const result = fn(...args);
        
        // Handle promises
        if (result instanceof Promise) {
          return result
            .then((res) => {
              if (spanId) observability.endSpan(spanId, 'ok');
              return res;
            })
            .catch((error) => {
              if (spanId) {
                observability.setSpanAttribute(spanId, 'error', true);
                observability.setSpanAttribute(spanId, 'error.message', error.message);
                observability.endSpan(spanId, 'error');
              }
              throw error;
            });
        }

        if (spanId) observability.endSpan(spanId, 'ok');
        return result;
      } catch (error) {
        if (spanId) {
          observability.setSpanAttribute(spanId, 'error', true);
          observability.setSpanAttribute(spanId, 'error.message', (error as Error).message);
          observability.endSpan(spanId, 'error');
        }
        throw error;
      }
    }) as T;
  }, [componentName]);

  // Record a custom event
  const recordEvent = useCallback((eventName: string, eventAttributes?: Record<string, string | number | boolean>) => {
    observability.recordCounter(`${componentName}.${eventName}`, 1, {
      component: componentName,
      ...Object.fromEntries(
        Object.entries(eventAttributes || {}).map(([k, v]) => [k, String(v)])
      ),
    });
  }, [componentName]);

  // Log with component context
  const log = useCallback((level: 'trace' | 'debug' | 'info' | 'warn' | 'error', message: string, logAttributes?: Record<string, unknown>) => {
    const obs = getObservability();
    obs.log(level, message, {
      'component.name': componentName,
      ...logAttributes,
    });
  }, [componentName]);

  return {
    traceFunction,
    recordEvent,
    log,
    renderCount: renderCount.current,
    // Direct access to observability methods
    startSpan: observability.startSpan,
    endSpan: observability.endSpan,
    recordCounter: observability.recordCounter,
    recordGauge: observability.recordGauge,
    recordHistogram: observability.recordHistogram,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}

/**
 * Hook to initialize observability on app startup
 */
export function useInitObservability() {
  useEffect(() => {
    const obs = initObservability({
      serviceName: 'obelixia-frontend',
      serviceVersion: '1.0.0',
      environment: import.meta.env.MODE || 'development',
      enableConsoleExporter: import.meta.env.DEV,
      enablePerformanceMetrics: true,
      enableUserInteractionTracing: true,
      enableNetworkTracing: true,
    });

    return () => {
      obs.destroy();
    };
  }, []);
}

/**
 * Hook to trace async operations
 */
export function useTracedAsync<T>(
  name: string,
  asyncFn: () => Promise<T>,
  deps: React.DependencyList
): () => Promise<T> {
  return useCallback(async () => {
    const spanId = observability.startSpan(name, { kind: 'client' });
    
    try {
      const result = await asyncFn();
      if (spanId) observability.endSpan(spanId, 'ok');
      return result;
    } catch (error) {
      if (spanId) {
        observability.setSpanAttribute(spanId, 'error', true);
        observability.setSpanAttribute(spanId, 'error.message', (error as Error).message);
        observability.endSpan(spanId, 'error');
      }
      throw error;
    }
  }, deps);
}

/**
 * Hook to measure and report component performance
 */
export function useComponentPerformance(componentName: string) {
  const startTime = useRef(performance.now());
  const measurementTaken = useRef(false);

  useEffect(() => {
    if (!measurementTaken.current) {
      const mountTime = performance.now() - startTime.current;
      observability.recordHistogram('component.mount_time', mountTime, {
        component: componentName,
      });
      measurementTaken.current = true;
    }
  }, [componentName]);

  const measureOperation = useCallback((operationName: string, operation: () => void) => {
    const opStart = performance.now();
    operation();
    const opDuration = performance.now() - opStart;
    observability.recordHistogram(`component.operation.${operationName}`, opDuration, {
      component: componentName,
    });
  }, [componentName]);

  return { measureOperation };
}

export default useObservability;
