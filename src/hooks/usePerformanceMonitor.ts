import { useState, useEffect, useCallback, useRef } from 'react';
import { KBStatus, KBError } from '@/hooks/core/types';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  fid: number | null;
}

interface PerformanceObserverCallback {
  (metrics: Partial<PerformanceMetrics>): void;
}

/**
 * Hook for monitoring Core Web Vitals and performance metrics
 * Provides real-time performance data for debugging and optimization
 */
export function usePerformanceMonitor(onMetricUpdate?: PerformanceObserverCallback) {
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    inp: null,
    ttfb: null,
    fid: null,
  });
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isRetrying = status === 'retrying';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);

  const updateMetric = useCallback((name: keyof PerformanceMetrics, value: number) => {
    metricsRef.current[name] = value;
    setLastRefresh(new Date());
    setLastSuccess(new Date());
    setStatus('success');
    onMetricUpdate?.({ [name]: value });
  }, [onMetricUpdate]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }

    setStatus('loading');
    const observers: PerformanceObserver[] = [];

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            updateMetric('fcp', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      observers.push(fcpObserver);
    } catch (e) {
      console.debug('FCP observer not supported');
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (lastEntry) {
          updateMetric('lcp', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch (e) {
      console.debug('LCP observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            updateMetric('cls', clsValue);
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);
    } catch (e) {
      console.debug('CLS observer not supported');
    }

    // Interaction to Next Paint (INP) - React 19 priority
    try {
      let maxINP = 0;
      const inpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as (PerformanceEntry & { duration: number })[]) {
          if (entry.duration > maxINP) {
            maxINP = entry.duration;
            updateMetric('inp', maxINP);
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
      observers.push(inpObserver);
    } catch (e) {
      console.debug('INP observer not supported');
    }

    // Time to First Byte (TTFB)
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        updateMetric('ttfb', navigationEntry.responseStart - navigationEntry.requestStart);
      }
    } catch (e) {
      console.debug('TTFB not available');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as (PerformanceEntry & { processingStart: number; startTime: number })[]) {
          updateMetric('fid', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      observers.push(fidObserver);
    } catch (e) {
      console.debug('FID observer not supported');
    }

    setStatus('success');
    setLastSuccess(new Date());

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [updateMetric]);

  const getMetrics = useCallback(() => metricsRef.current, []);

  const getPerformanceScore = useCallback(() => {
    const metrics = metricsRef.current;
    let score = 100;

    // LCP scoring (Good < 2.5s, Needs Improvement < 4s, Poor >= 4s)
    if (metrics.lcp !== null) {
      if (metrics.lcp > 4000) score -= 30;
      else if (metrics.lcp > 2500) score -= 15;
    }

    // CLS scoring (Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25)
    if (metrics.cls !== null) {
      if (metrics.cls > 0.25) score -= 30;
      else if (metrics.cls > 0.1) score -= 15;
    }

    // INP scoring (Good < 200ms, Needs Improvement < 500ms, Poor >= 500ms)
    if (metrics.inp !== null) {
      if (metrics.inp > 500) score -= 30;
      else if (metrics.inp > 200) score -= 15;
    }

    return Math.max(0, score);
  }, []);

  return {
    getMetrics,
    getPerformanceScore,
    metrics: metricsRef.current,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isRetrying,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
  };
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const renderTime = lastRenderTime.current ? now - lastRenderTime.current : 0;
    lastRenderTime.current = now;

    if (import.meta.env.DEV && renderCount.current > 1) {
      console.debug(`[Performance] ${componentName} re-rendered (${renderCount.current}x) in ${renderTime.toFixed(2)}ms`);
    }
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  };
}

/**
 * Hook for lazy loading with intersection observer
 * Improves LCP by deferring off-screen content
 */
export function useLazyLoad(options?: IntersectionObserverInit) {
  const elementRef = useRef<HTMLElement | null>(null);
  const isVisible = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        isVisible.current = true;
        observer.disconnect();
      }
    }, {
      rootMargin: '100px',
      threshold: 0.1,
      ...options,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return { ref: elementRef, isVisible: isVisible.current };
}
