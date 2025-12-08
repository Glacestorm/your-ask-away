/**
 * Core Web Vitals monitoring and optimization utilities
 * Tracks LCP, FID/INP, CLS metrics
 */

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

type MetricCallback = (metric: WebVitalsMetric) => void;

// Thresholds based on Google's Core Web Vitals
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: keyof typeof thresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Generate unique ID for each metric
function generateId(): string {
  return `v3-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Observe Largest Contentful Paint (LCP)
 */
export function observeLCP(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
    
    if (lastEntry) {
      const value = lastEntry.startTime;
      callback({
        name: 'LCP',
        value,
        rating: getRating('LCP', value),
        delta: value,
        id: generateId(),
      });
    }
  });

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observation not supported:', e);
  }
}

/**
 * Observe First Input Delay (FID)
 */
export function observeFID(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: PerformanceEntry & { processingStart?: number; startTime: number }) => {
      if (entry.processingStart) {
        const value = entry.processingStart - entry.startTime;
        callback({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          delta: value,
          id: generateId(),
        });
      }
    });
  });

  try {
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID observation not supported:', e);
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 */
export function observeCLS(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[];
    
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0] as PerformanceEntry & { startTime: number } | undefined;
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as PerformanceEntry & { startTime: number } | undefined;

        if (sessionValue &&
            entry.startTime - (lastSessionEntry?.startTime || 0) < 1000 &&
            entry.startTime - (firstSessionEntry?.startTime || 0) < 5000) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
        } else {
          sessionValue = entry.value;
          sessionEntries = [entry];
        }

        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          callback({
            name: 'CLS',
            value: clsValue,
            rating: getRating('CLS', clsValue),
            delta: entry.value,
            id: generateId(),
          });
        }
      }
    });
  });

  try {
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observation not supported:', e);
  }
}

/**
 * Observe Interaction to Next Paint (INP)
 */
export function observeINP(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  let maxINP = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as (PerformanceEntry & { duration: number })[];
    
    entries.forEach((entry) => {
      if (entry.duration > maxINP) {
        maxINP = entry.duration;
        callback({
          name: 'INP',
          value: maxINP,
          rating: getRating('INP', maxINP),
          delta: entry.duration,
          id: generateId(),
        });
      }
    });
  });

  try {
    observer.observe({ type: 'event', buffered: true });
  } catch (e) {
    console.warn('INP observation not supported:', e);
  }
}

/**
 * Observe First Contentful Paint (FCP)
 */
export function observeFCP(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint') as PerformanceEntry & { startTime: number } | undefined;
    
    if (fcpEntry) {
      const value = fcpEntry.startTime;
      callback({
        name: 'FCP',
        value,
        rating: getRating('FCP', value),
        delta: value,
        id: generateId(),
      });
    }
  });

  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP observation not supported:', e);
  }
}

/**
 * Observe Time to First Byte (TTFB)
 */
export function observeTTFB(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceNavigationTiming[];
    entries.forEach((entry) => {
      if (entry.responseStart) {
        const value = entry.responseStart;
        callback({
          name: 'TTFB',
          value,
          rating: getRating('TTFB', value),
          delta: value,
          id: generateId(),
        });
      }
    });
  });

  try {
    observer.observe({ type: 'navigation', buffered: true });
  } catch (e) {
    console.warn('TTFB observation not supported:', e);
  }
}

/**
 * Initialize all Web Vitals observers
 */
export function initWebVitals(callback: MetricCallback): void {
  observeLCP(callback);
  observeFID(callback);
  observeCLS(callback);
  observeINP(callback);
  observeFCP(callback);
  observeTTFB(callback);
}

/**
 * Log metrics to console with color coding
 */
export function logWebVital(metric: WebVitalsMetric): void {
  const colors = {
    good: '#0CCE6B',
    'needs-improvement': '#FFA400',
    poor: '#FF4E42',
  };

  console.log(
    `%c${metric.name}%c ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`,
    `background: ${colors[metric.rating]}; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;`,
    'color: inherit;'
  );
}

/**
 * Send metrics to analytics endpoint
 */
export async function sendToAnalytics(metric: WebVitalsMetric): Promise<void> {
  // Store in localStorage for debugging
  const storedMetrics = JSON.parse(localStorage.getItem('web-vitals') || '[]');
  storedMetrics.push({
    ...metric,
    timestamp: Date.now(),
    url: window.location.pathname,
  });
  
  // Keep only last 100 metrics
  if (storedMetrics.length > 100) {
    storedMetrics.splice(0, storedMetrics.length - 100);
  }
  
  localStorage.setItem('web-vitals', JSON.stringify(storedMetrics));
}

/**
 * Get stored Web Vitals metrics
 */
export function getStoredMetrics(): (WebVitalsMetric & { timestamp: number; url: string })[] {
  try {
    return JSON.parse(localStorage.getItem('web-vitals') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored metrics
 */
export function clearStoredMetrics(): void {
  localStorage.removeItem('web-vitals');
}
