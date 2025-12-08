import { useEffect, useState, useCallback } from 'react';
import { 
  initWebVitals, 
  WebVitalsMetric, 
  logWebVital, 
  sendToAnalytics,
  getStoredMetrics,
  clearStoredMetrics
} from '@/lib/webVitals';

interface WebVitalsState {
  LCP: WebVitalsMetric | null;
  FID: WebVitalsMetric | null;
  CLS: WebVitalsMetric | null;
  INP: WebVitalsMetric | null;
  FCP: WebVitalsMetric | null;
  TTFB: WebVitalsMetric | null;
}

interface UseWebVitalsOptions {
  enableLogging?: boolean;
  enableAnalytics?: boolean;
}

/**
 * Hook for monitoring Core Web Vitals
 */
export function useWebVitals(options: UseWebVitalsOptions = {}) {
  const { enableLogging = false, enableAnalytics = true } = options;
  
  const [metrics, setMetrics] = useState<WebVitalsState>({
    LCP: null,
    FID: null,
    CLS: null,
    INP: null,
    FCP: null,
    TTFB: null,
  });

  useEffect(() => {
    const handleMetric = (metric: WebVitalsMetric) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name]: metric,
      }));

      if (enableLogging) {
        logWebVital(metric);
      }

      if (enableAnalytics) {
        sendToAnalytics(metric);
      }
    };

    initWebVitals(handleMetric);
  }, [enableLogging, enableAnalytics]);

  const getOverallScore = useCallback((): 'good' | 'needs-improvement' | 'poor' => {
    const coreVitals = [metrics.LCP, metrics.CLS, metrics.INP || metrics.FID];
    const ratings = coreVitals.filter(Boolean).map(m => m?.rating);
    
    if (ratings.length === 0) return 'good';
    if (ratings.some(r => r === 'poor')) return 'poor';
    if (ratings.some(r => r === 'needs-improvement')) return 'needs-improvement';
    return 'good';
  }, [metrics]);

  const getHistory = useCallback(() => {
    return getStoredMetrics();
  }, []);

  const clearHistory = useCallback(() => {
    clearStoredMetrics();
  }, []);

  return {
    metrics,
    overallScore: getOverallScore(),
    getHistory,
    clearHistory,
  };
}

export default useWebVitals;
