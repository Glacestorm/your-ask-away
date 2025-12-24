/**
 * KB 4.5 - Phase 6: Performance Monitoring
 * 
 * Features:
 * - Core Web Vitals (LCP, FID, CLS, INP, TTFB)
 * - Resource Timing API integration
 * - Long Task detection
 * - Memory monitoring
 * - Frame rate monitoring
 * - Performance budget alerts
 * - Telemetry integration
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { onCLS, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import type { KBTelemetry } from './types';
import { collectTelemetry } from './useKBBase';

// ============================================================================
// TYPES
// ============================================================================

export type WebVitalName = 'CLS' | 'LCP' | 'TTFB' | 'INP';

export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

export interface PerformanceBudget {
  LCP?: number;      // Largest Contentful Paint (ms)
  CLS?: number;      // Cumulative Layout Shift
  INP?: number;      // Interaction to Next Paint (ms)
  TTFB?: number;     // Time to First Byte (ms)
  resourceSize?: number;  // Total resource size (bytes)
  resourceCount?: number; // Max number of resources
  longTaskThreshold?: number; // Long task threshold (ms)
}

export interface BudgetViolation {
  metric: string;
  actual: number;
  budget: number;
  severity: 'warning' | 'critical';
  timestamp: number;
}

export interface ResourceTiming {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  startTime: number;
  responseEnd: number;
  cached: boolean;
}

export interface LongTask {
  name: string;
  duration: number;
  startTime: number;
  attribution: string[];
  timestamp: number;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  timestamp: number;
}

export interface FrameRateInfo {
  fps: number;
  dropped: number;
  timestamp: number;
}

export interface PerformanceSnapshot {
  webVitals: Record<WebVitalName, WebVitalMetric | null>;
  resources: ResourceTiming[];
  longTasks: LongTask[];
  memory: MemoryInfo | null;
  frameRate: FrameRateInfo | null;
  violations: BudgetViolation[];
  score: number;
  timestamp: number;
}

export interface UseKBPerformanceOptions {
  /** Enable Core Web Vitals monitoring */
  webVitals?: boolean;
  /** Enable resource timing monitoring */
  resourceTiming?: boolean;
  /** Enable long task detection */
  longTasks?: boolean;
  /** Enable memory monitoring */
  memory?: boolean;
  /** Enable frame rate monitoring */
  frameRate?: boolean;
  /** Performance budget configuration */
  budget?: PerformanceBudget;
  /** Callback when budget is violated */
  onBudgetViolation?: (violation: BudgetViolation) => void;
  /** Callback when web vital is reported */
  onWebVital?: (metric: WebVitalMetric) => void;
  /** Enable telemetry reporting */
  telemetry?: boolean;
  /** Sample rate for telemetry (0-1) */
  sampleRate?: number;
}

export interface UseKBPerformanceReturn {
  /** Current web vitals */
  webVitals: Record<WebVitalName, WebVitalMetric | null>;
  /** Resource timing entries */
  resources: ResourceTiming[];
  /** Long tasks detected */
  longTasks: LongTask[];
  /** Current memory info */
  memory: MemoryInfo | null;
  /** Current frame rate */
  frameRate: FrameRateInfo | null;
  /** Budget violations */
  violations: BudgetViolation[];
  /** Overall performance score (0-100) */
  score: number;
  /** Get full performance snapshot */
  getSnapshot: () => PerformanceSnapshot;
  /** Clear collected data */
  clear: () => void;
  /** Mark a custom performance entry */
  mark: (name: string) => void;
  /** Measure between two marks */
  measure: (name: string, startMark: string, endMark?: string) => number | null;
  /** Report custom metric */
  reportMetric: (name: string, value: number, unit?: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BUDGET: PerformanceBudget = {
  LCP: 2500,
  CLS: 0.1,
  INP: 200,
  TTFB: 800,
  resourceSize: 5 * 1024 * 1024, // 5MB
  resourceCount: 100,
  longTaskThreshold: 50,
};

const VITAL_WEIGHTS: Record<WebVitalName, number> = {
  LCP: 30,
  CLS: 30,
  INP: 25,
  TTFB: 15,
};

// ============================================================================
// UTILITIES
// ============================================================================

function getRating(name: WebVitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<WebVitalName, [number, number]> = {
    LCP: [2500, 4000],
    CLS: [0.1, 0.25],
    INP: [200, 500],
    TTFB: [800, 1800],
  };

  const [good, poor] = thresholds[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function calculateScore(vitals: Record<WebVitalName, WebVitalMetric | null>): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const [name, metric] of Object.entries(vitals)) {
    if (metric) {
      const weight = VITAL_WEIGHTS[name as WebVitalName];
      totalWeight += weight;
      
      const ratingScore = metric.rating === 'good' ? 100 : 
                         metric.rating === 'needs-improvement' ? 50 : 0;
      weightedScore += ratingScore * weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

// Helper to create telemetry entry
function createTelemetryEntry(
  hookName: string, 
  operationName: string, 
  durationMs: number, 
  status: 'success' | 'error' | 'idle',
  metadata?: Record<string, unknown>
): KBTelemetry {
  return {
    hookName,
    operationName,
    startTime: new Date(Date.now() - durationMs),
    endTime: new Date(),
    durationMs,
    status,
    retryCount: 0,
    metadata,
  };
}

function parseResourceTiming(entry: PerformanceResourceTiming): ResourceTiming {
  return {
    name: entry.name,
    initiatorType: entry.initiatorType,
    duration: entry.duration,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    startTime: entry.startTime,
    responseEnd: entry.responseEnd,
    cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBPerformance(options: UseKBPerformanceOptions = {}): UseKBPerformanceReturn {
  const {
    webVitals: enableWebVitals = true,
    resourceTiming: enableResourceTiming = true,
    longTasks: enableLongTasks = true,
    memory: enableMemory = true,
    frameRate: enableFrameRate = false,
    budget = DEFAULT_BUDGET,
    onBudgetViolation,
    onWebVital,
    telemetry = true,
    sampleRate = 1,
  } = options;

  // State
  const [vitals, setVitals] = useState<Record<WebVitalName, WebVitalMetric | null>>({
    CLS: null,
    LCP: null,
    TTFB: null,
    INP: null,
  });
  const [resources, setResources] = useState<ResourceTiming[]>([]);
  const [longTasksList, setLongTasks] = useState<LongTask[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [frameRateInfo, setFrameRate] = useState<FrameRateInfo | null>(null);
  const [violations, setViolations] = useState<BudgetViolation[]>([]);

  // Refs
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);

  // Check budget violation
  const checkBudget = useCallback((metric: string, value: number) => {
    const budgetValue = budget[metric as keyof PerformanceBudget];
    if (budgetValue !== undefined && value > budgetValue) {
      const severity = value > budgetValue * 1.5 ? 'critical' : 'warning';
      const violation: BudgetViolation = {
        metric,
        actual: value,
        budget: budgetValue,
        severity,
        timestamp: Date.now(),
      };
      
      setViolations(prev => [...prev, violation]);
      onBudgetViolation?.(violation);

      if (telemetry && Math.random() < sampleRate) {
        collectTelemetry(createTelemetryEntry(
          'useKBPerformance',
          'budget_violation',
          0,
          'error',
          { metric, actual: value, budget: budgetValue, severity }
        ));
      }
    }
  }, [budget, onBudgetViolation, telemetry, sampleRate]);

  // Handle web vital
  const handleWebVital = useCallback((metric: Metric) => {
    const webVitalMetric: WebVitalMetric = {
      name: metric.name as WebVitalName,
      value: metric.value,
      rating: getRating(metric.name as WebVitalName, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
      timestamp: Date.now(),
    };

    setVitals(prev => ({
      ...prev,
      [metric.name]: webVitalMetric,
    }));

    onWebVital?.(webVitalMetric);
    checkBudget(metric.name, metric.value);

    if (telemetry && Math.random() < sampleRate) {
      collectTelemetry(createTelemetryEntry(
        'useKBPerformance',
        `web_vital_${metric.name.toLowerCase()}`,
        metric.value,
        webVitalMetric.rating !== 'poor' ? 'success' : 'error',
        {
          rating: webVitalMetric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
        }
      ));
    }
  }, [onWebVital, checkBudget, telemetry, sampleRate]);

  // Web Vitals monitoring
  useEffect(() => {
    if (!enableWebVitals) return;

    onCLS(handleWebVital);
    onLCP(handleWebVital);
    onTTFB(handleWebVital);
    onINP(handleWebVital);
  }, [enableWebVitals, handleWebVital]);

  // Resource timing monitoring
  useEffect(() => {
    if (!enableResourceTiming) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      const newResources = entries.map(parseResourceTiming);
      
      setResources(prev => {
        const updated = [...prev, ...newResources];
        
        // Check resource budget
        const totalSize = updated.reduce((sum, r) => sum + r.transferSize, 0);
        if (budget.resourceSize) {
          checkBudget('resourceSize', totalSize);
        }
        if (budget.resourceCount) {
          checkBudget('resourceCount', updated.length);
        }
        
        return updated;
      });
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
    } catch {
      // Resource timing not supported
    }

    return () => observer.disconnect();
  }, [enableResourceTiming, budget, checkBudget]);

  // Long task detection
  useEffect(() => {
    if (!enableLongTasks) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.duration > (budget.longTaskThreshold || 50)) {
          const longTask: LongTask = {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: (entry as unknown as { attribution?: { name: string }[] }).attribution?.map(a => a.name) || [],
            timestamp: Date.now(),
          };
          
          setLongTasks(prev => [...prev, longTask]);
          checkBudget('longTaskThreshold', entry.duration);

          if (telemetry && Math.random() < sampleRate) {
            collectTelemetry(createTelemetryEntry(
              'useKBPerformance',
              'long_task',
              entry.duration,
              'error',
              { attribution: longTask.attribution }
            ));
          }
        }
      });
    });

    try {
      observer.observe({ type: 'longtask', buffered: true });
    } catch {
      // Long task observer not supported
    }

    return () => observer.disconnect();
  }, [enableLongTasks, budget, checkBudget, telemetry, sampleRate]);

  // Memory monitoring
  useEffect(() => {
    if (!enableMemory) return;

    const checkMemory = () => {
      const memory = (performance as unknown as { memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;
      
      if (memory) {
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
          timestamp: Date.now(),
        });
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 5000);

    return () => clearInterval(interval);
  }, [enableMemory]);

  // Frame rate monitoring
  useEffect(() => {
    if (!enableFrameRate) return;

    let droppedFrames = 0;
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const measureFrameRate = (timestamp: number) => {
      frameCountRef.current++;
      
      const elapsed = timestamp - lastFrameTimeRef.current;
      
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        const expectedFrames = Math.round(elapsed / frameTime);
        droppedFrames = Math.max(0, expectedFrames - frameCountRef.current);
        
        setFrameRate({
          fps,
          dropped: droppedFrames,
          timestamp: Date.now(),
        });
        
        frameCountRef.current = 0;
        lastFrameTimeRef.current = timestamp;
      }
      
      rafIdRef.current = requestAnimationFrame(measureFrameRate);
    };

    rafIdRef.current = requestAnimationFrame(measureFrameRate);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enableFrameRate]);

  // Calculate score
  const score = useMemo(() => calculateScore(vitals), [vitals]);

  // Get snapshot
  const getSnapshot = useCallback((): PerformanceSnapshot => ({
    webVitals: { ...vitals },
    resources: [...resources],
    longTasks: [...longTasksList],
    memory: memoryInfo,
    frameRate: frameRateInfo,
    violations: [...violations],
    score,
    timestamp: Date.now(),
  }), [vitals, resources, longTasksList, memoryInfo, frameRateInfo, violations, score]);

  // Clear data
  const clear = useCallback(() => {
    setResources([]);
    setLongTasks([]);
    setViolations([]);
  }, []);

  // Mark
  const mark = useCallback((name: string) => {
    performance.mark(`kb_${name}`);
  }, []);

  // Measure
  const measure = useCallback((name: string, startMark: string, endMark?: string): number | null => {
    try {
      const measureName = `kb_measure_${name}`;
      performance.measure(measureName, `kb_${startMark}`, endMark ? `kb_${endMark}` : undefined);
      
      const entries = performance.getEntriesByName(measureName);
      const entry = entries[entries.length - 1];
      
      if (entry) {
        if (telemetry && Math.random() < sampleRate) {
          collectTelemetry(createTelemetryEntry(
            'useKBPerformance',
            `measure_${name}`,
            entry.duration,
            'success'
          ));
        }
        return entry.duration;
      }
      return null;
    } catch {
      return null;
    }
  }, [telemetry, sampleRate]);

  // Report custom metric
  const reportMetric = useCallback((name: string, value: number, unit?: string) => {
    if (telemetry && Math.random() < sampleRate) {
      collectTelemetry(createTelemetryEntry(
        'useKBPerformance',
        `custom_${name}`,
        value,
        'success',
        { unit }
      ));
    }
  }, [telemetry, sampleRate]);

  return {
    webVitals: vitals,
    resources,
    longTasks: longTasksList,
    memory: memoryInfo,
    frameRate: frameRateInfo,
    violations,
    score,
    getSnapshot,
    clear,
    mark,
    measure,
    reportMetric,
  };
}

// ============================================================================
// RESOURCE TIMING HOOK
// ============================================================================

export interface UseKBResourceTimingOptions {
  /** Filter by initiator type */
  initiatorType?: string[];
  /** Filter by URL pattern */
  urlPattern?: RegExp;
  /** Max entries to keep */
  maxEntries?: number;
}

export interface UseKBResourceTimingReturn {
  resources: ResourceTiming[];
  totalSize: number;
  totalDuration: number;
  slowest: ResourceTiming | null;
  largest: ResourceTiming | null;
  byType: Record<string, ResourceTiming[]>;
  clear: () => void;
}

export function useKBResourceTiming(options: UseKBResourceTimingOptions = {}): UseKBResourceTimingReturn {
  const {
    initiatorType,
    urlPattern,
    maxEntries = 500,
  } = options;

  const [resources, setResources] = useState<ResourceTiming[]>([]);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      const filtered = entries.filter(entry => {
        if (initiatorType && !initiatorType.includes(entry.initiatorType)) {
          return false;
        }
        if (urlPattern && !urlPattern.test(entry.name)) {
          return false;
        }
        return true;
      });

      const parsed = filtered.map(parseResourceTiming);
      
      setResources(prev => {
        const updated = [...prev, ...parsed];
        return updated.slice(-maxEntries);
      });
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
    } catch {
      // Not supported
    }

    return () => observer.disconnect();
  }, [initiatorType, urlPattern, maxEntries]);

  const stats = useMemo(() => {
    const totalSize = resources.reduce((sum, r) => sum + r.transferSize, 0);
    const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);
    
    const slowest = resources.length > 0 
      ? resources.reduce((max, r) => r.duration > max.duration ? r : max)
      : null;
    
    const largest = resources.length > 0
      ? resources.reduce((max, r) => r.transferSize > max.transferSize ? r : max)
      : null;

    const byType = resources.reduce((acc, r) => {
      if (!acc[r.initiatorType]) {
        acc[r.initiatorType] = [];
      }
      acc[r.initiatorType].push(r);
      return acc;
    }, {} as Record<string, ResourceTiming[]>);

    return { totalSize, totalDuration, slowest, largest, byType };
  }, [resources]);

  const clear = useCallback(() => setResources([]), []);

  return {
    resources,
    ...stats,
    clear,
  };
}

// ============================================================================
// LONG TASK HOOK
// ============================================================================

export interface UseKBLongTaskOptions {
  threshold?: number;
  maxEntries?: number;
  onLongTask?: (task: LongTask) => void;
}

export interface UseKBLongTaskReturn {
  tasks: LongTask[];
  count: number;
  totalDuration: number;
  longest: LongTask | null;
  clear: () => void;
}

export function useKBLongTask(options: UseKBLongTaskOptions = {}): UseKBLongTaskReturn {
  const {
    threshold = 50,
    maxEntries = 100,
    onLongTask,
  } = options;

  const [tasks, setTasks] = useState<LongTask[]>([]);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.duration > threshold) {
          const task: LongTask = {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: (entry as unknown as { attribution?: { name: string }[] }).attribution?.map(a => a.name) || [],
            timestamp: Date.now(),
          };
          
          setTasks(prev => [...prev.slice(-(maxEntries - 1)), task]);
          onLongTask?.(task);
        }
      });
    });

    try {
      observer.observe({ type: 'longtask', buffered: true });
    } catch {
      // Not supported
    }

    return () => observer.disconnect();
  }, [threshold, maxEntries, onLongTask]);

  const stats = useMemo(() => {
    const count = tasks.length;
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
    const longest = tasks.length > 0
      ? tasks.reduce((max, t) => t.duration > max.duration ? t : max)
      : null;

    return { count, totalDuration, longest };
  }, [tasks]);

  const clear = useCallback(() => setTasks([]), []);

  return {
    tasks,
    ...stats,
    clear,
  };
}

// ============================================================================
// COMPONENT PERFORMANCE HOOK
// ============================================================================

export interface UseKBComponentPerfOptions {
  name: string;
  trackRenders?: boolean;
  trackMounts?: boolean;
  warnThreshold?: number;
}

export interface UseKBComponentPerfReturn {
  renderCount: number;
  lastRenderDuration: number | null;
  averageRenderDuration: number;
  slowRenders: number;
  startRender: () => void;
  endRender: () => void;
}

export function useKBComponentPerf(options: UseKBComponentPerfOptions): UseKBComponentPerfReturn {
  const {
    name,
    trackRenders = true,
    trackMounts = true,
    warnThreshold = 16, // 60fps frame budget
  } = options;

  const [renderCount, setRenderCount] = useState(0);
  const [renderDurations, setRenderDurations] = useState<number[]>([]);
  const renderStartRef = useRef<number | null>(null);

  // Track mount
  useEffect(() => {
    if (trackMounts) {
      const mountTime = performance.now();
      performance.mark(`kb_component_${name}_mount`);
      
      collectTelemetry(createTelemetryEntry(
        'useKBComponentPerf',
        'mount',
        mountTime,
        'success',
        { component: name }
      ));

      return () => {
        performance.mark(`kb_component_${name}_unmount`);
        try {
          performance.measure(
            `kb_component_${name}_lifetime`,
            `kb_component_${name}_mount`,
            `kb_component_${name}_unmount`
          );
        } catch {
          // Ignore
        }
      };
    }
  }, [name, trackMounts]);

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      setRenderCount(c => c + 1);
    }
  });

  const startRender = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartRef.current !== null) {
      const duration = performance.now() - renderStartRef.current;
      
      setRenderDurations(prev => [...prev.slice(-99), duration]);

      if (duration > warnThreshold) {
        console.warn(`[KB Performance] Slow render in ${name}: ${duration.toFixed(2)}ms`);
      }

      renderStartRef.current = null;
    }
  }, [name, warnThreshold]);

  const stats = useMemo(() => {
    const lastRenderDuration = renderDurations.length > 0 
      ? renderDurations[renderDurations.length - 1] 
      : null;
    
    const averageRenderDuration = renderDurations.length > 0
      ? renderDurations.reduce((a, b) => a + b, 0) / renderDurations.length
      : 0;

    const slowRenders = renderDurations.filter(d => d > warnThreshold).length;

    return { lastRenderDuration, averageRenderDuration, slowRenders };
  }, [renderDurations, warnThreshold]);

  return {
    renderCount,
    ...stats,
    startRender,
    endRender,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useKBPerformance;
