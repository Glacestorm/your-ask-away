/**
 * KB 4.5 - Analytics & Telemetry
 * Fase 14 - Tracking OpenTelemetry compliant
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBAnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface KBAnalyticsContext {
  sessionId: string;
  userId?: string;
  deviceId?: string;
  userAgent?: string;
  language?: string;
  timezone?: string;
  screenResolution?: string;
  referrer?: string;
  pathname?: string;
}

export interface KBMetricData {
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: number;
}

export interface KBSpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: 'internal' | 'client' | 'server' | 'producer' | 'consumer';
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, unknown>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
  }>;
}

export interface KBAnalyticsProvider {
  name: string;
  trackEvent: (event: KBAnalyticsEvent) => void | Promise<void>;
  trackMetric: (metric: KBMetricData) => void | Promise<void>;
  trackSpan: (span: KBSpanData) => void | Promise<void>;
  flush?: () => Promise<void>;
}

export interface KBAnalyticsConfig {
  providers: KBAnalyticsProvider[];
  batchSize?: number;
  flushInterval?: number;
  sampleRate?: number;
  enableAutoTracking?: boolean;
  excludePatterns?: RegExp[];
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// ANALYTICS MANAGER
// ============================================================================

class KBAnalyticsManager {
  private config: KBAnalyticsConfig;
  private eventQueue: KBAnalyticsEvent[] = [];
  private metricQueue: KBMetricData[] = [];
  private spanQueue: KBSpanData[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private context: KBAnalyticsContext;
  private activeSpans: Map<string, KBSpanData> = new Map();

  constructor(config: KBAnalyticsConfig) {
    this.config = {
      batchSize: 10,
      flushInterval: 30000,
      sampleRate: 1,
      enableAutoTracking: true,
      ...config,
    };

    this.context = {
      sessionId: generateId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: typeof window !== 'undefined' 
        ? `${window.screen.width}x${window.screen.height}` 
        : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    this.startFlushTimer();
    this.setupAutoTracking();
  }

  private shouldSample(): boolean {
    return Math.random() < (this.config.sampleRate ?? 1);
  }

  private isExcluded(name: string): boolean {
    return this.config.excludePatterns?.some(pattern => pattern.test(name)) ?? false;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupAutoTracking(): void {
    if (!this.config.enableAutoTracking || typeof window === 'undefined') return;

    // Track page views
    const trackPageView = () => {
      this.context.pathname = window.location.pathname;
      this.trackEvent({
        name: 'page_view',
        category: 'navigation',
        action: 'view',
        properties: {
          path: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        },
      });
    };

    // Initial page view
    trackPageView();

    // Track navigation
    window.addEventListener('popstate', trackPageView);

    // Track errors
    window.addEventListener('error', (event) => {
      this.trackEvent({
        name: 'error',
        category: 'error',
        action: 'uncaught',
        properties: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent({
        name: 'unhandled_rejection',
        category: 'error',
        action: 'promise_rejection',
        properties: {
          reason: String(event.reason),
        },
      });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent({
        name: 'visibility_change',
        category: 'engagement',
        action: document.visibilityState,
      });

      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  setDeviceId(deviceId: string): void {
    this.context.deviceId = deviceId;
  }

  updateContext(updates: Partial<KBAnalyticsContext>): void {
    this.context = { ...this.context, ...updates };
  }

  trackEvent(event: Omit<KBAnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    if (!this.shouldSample() || this.isExcluded(event.name)) return;

    const fullEvent: KBAnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.context.sessionId,
      userId: this.context.userId,
    };

    this.eventQueue.push(fullEvent);

    if (this.eventQueue.length >= (this.config.batchSize ?? 10)) {
      this.flush();
    }
  }

  trackMetric(
    name: string,
    value: number,
    unit: string = 'count',
    tags: Record<string, string> = {}
  ): void {
    if (!this.shouldSample() || this.isExcluded(name)) return;

    const metric: KBMetricData = {
      name,
      value,
      unit,
      tags: {
        ...tags,
        sessionId: this.context.sessionId,
        userId: this.context.userId || '',
      },
      timestamp: Date.now(),
    };

    this.metricQueue.push(metric);

    if (this.metricQueue.length >= (this.config.batchSize ?? 10)) {
      this.flush();
    }
  }

  startSpan(
    name: string,
    options: {
      kind?: KBSpanData['kind'];
      parentSpanId?: string;
      attributes?: Record<string, unknown>;
    } = {}
  ): string {
    const spanId = generateSpanId();
    const traceId = options.parentSpanId 
      ? this.activeSpans.get(options.parentSpanId)?.traceId || generateTraceId()
      : generateTraceId();

    const span: KBSpanData = {
      traceId,
      spanId,
      parentSpanId: options.parentSpanId,
      name,
      kind: options.kind || 'internal',
      startTime: Date.now(),
      status: 'unset',
      attributes: options.attributes || {},
      events: [],
    };

    this.activeSpans.set(spanId, span);
    return spanId;
  }

  addSpanEvent(
    spanId: string,
    name: string,
    attributes?: Record<string, unknown>
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  setSpanAttribute(spanId: string, key: string, value: unknown): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.attributes[key] = value;
  }

  endSpan(spanId: string, status: KBSpanData['status'] = 'ok'): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.status = status;

    this.activeSpans.delete(spanId);
    this.spanQueue.push(span);

    if (this.spanQueue.length >= (this.config.batchSize ?? 10)) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    const events = [...this.eventQueue];
    const metrics = [...this.metricQueue];
    const spans = [...this.spanQueue];

    this.eventQueue = [];
    this.metricQueue = [];
    this.spanQueue = [];

    const promises: Promise<void>[] = [];

    for (const provider of this.config.providers) {
      // Track events
      for (const event of events) {
        const result = provider.trackEvent(event);
        if (result instanceof Promise) {
          promises.push(result.catch(console.error));
        }
      }

      // Track metrics
      for (const metric of metrics) {
        const result = provider.trackMetric(metric);
        if (result instanceof Promise) {
          promises.push(result.catch(console.error));
        }
      }

      // Track spans
      for (const span of spans) {
        const result = provider.trackSpan(span);
        if (result instanceof Promise) {
          promises.push(result.catch(console.error));
        }
      }

      // Flush provider
      if (provider.flush) {
        promises.push(provider.flush().catch(console.error));
      }
    }

    await Promise.all(promises);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let analyticsInstance: KBAnalyticsManager | null = null;

export function initKBAnalytics(config: KBAnalyticsConfig): KBAnalyticsManager {
  if (analyticsInstance) {
    analyticsInstance.destroy();
  }
  analyticsInstance = new KBAnalyticsManager(config);
  return analyticsInstance;
}

export function getKBAnalytics(): KBAnalyticsManager | null {
  return analyticsInstance;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook principal de analytics
 */
export function useKBAnalytics(): {
  trackEvent: (event: Omit<KBAnalyticsEvent, 'timestamp' | 'sessionId'>) => void;
  trackMetric: (name: string, value: number, unit?: string, tags?: Record<string, string>) => void;
  setUserId: (userId: string) => void;
  flush: () => Promise<void>;
} {
  const trackEvent = useCallback((event: Omit<KBAnalyticsEvent, 'timestamp' | 'sessionId'>) => {
    analyticsInstance?.trackEvent(event);
  }, []);

  const trackMetric = useCallback((
    name: string,
    value: number,
    unit: string = 'count',
    tags: Record<string, string> = {}
  ) => {
    analyticsInstance?.trackMetric(name, value, unit, tags);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analyticsInstance?.setUserId(userId);
  }, []);

  const flush = useCallback(async () => {
    await analyticsInstance?.flush();
  }, []);

  return { trackEvent, trackMetric, setUserId, flush };
}

/**
 * Hook para tracking de spans (distributed tracing)
 */
export function useKBTracing(): {
  startSpan: (name: string, options?: { kind?: KBSpanData['kind']; parentSpanId?: string; attributes?: Record<string, unknown> }) => string;
  endSpan: (spanId: string, status?: KBSpanData['status']) => void;
  addSpanEvent: (spanId: string, name: string, attributes?: Record<string, unknown>) => void;
  setSpanAttribute: (spanId: string, key: string, value: unknown) => void;
  withSpan: <T>(name: string, fn: (spanId: string) => Promise<T>) => Promise<T>;
} {
  const startSpan = useCallback((
    name: string,
    options?: { kind?: KBSpanData['kind']; parentSpanId?: string; attributes?: Record<string, unknown> }
  ) => {
    return analyticsInstance?.startSpan(name, options) ?? '';
  }, []);

  const endSpan = useCallback((spanId: string, status: KBSpanData['status'] = 'ok') => {
    analyticsInstance?.endSpan(spanId, status);
  }, []);

  const addSpanEvent = useCallback((spanId: string, name: string, attributes?: Record<string, unknown>) => {
    analyticsInstance?.addSpanEvent(spanId, name, attributes);
  }, []);

  const setSpanAttribute = useCallback((spanId: string, key: string, value: unknown) => {
    analyticsInstance?.setSpanAttribute(spanId, key, value);
  }, []);

  const withSpan = useCallback(async <T>(name: string, fn: (spanId: string) => Promise<T>): Promise<T> => {
    const spanId = startSpan(name);
    try {
      const result = await fn(spanId);
      endSpan(spanId, 'ok');
      return result;
    } catch (error) {
      endSpan(spanId, 'error');
      throw error;
    }
  }, [startSpan, endSpan]);

  return { startSpan, endSpan, addSpanEvent, setSpanAttribute, withSpan };
}

/**
 * Hook para métricas de componentes
 */
export function useKBComponentMetrics(componentName: string): {
  trackRender: () => void;
  trackMount: () => void;
  trackUnmount: () => void;
  trackInteraction: (action: string, details?: Record<string, unknown>) => void;
} {
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  const trackRender = useCallback(() => {
    renderCountRef.current++;
    analyticsInstance?.trackMetric(
      `component.${componentName}.render`,
      renderCountRef.current,
      'count'
    );
  }, [componentName]);

  const trackMount = useCallback(() => {
    mountTimeRef.current = Date.now();
    analyticsInstance?.trackEvent({
      name: 'component_mount',
      category: 'component',
      action: 'mount',
      label: componentName,
    });
  }, [componentName]);

  const trackUnmount = useCallback(() => {
    const lifetime = Date.now() - mountTimeRef.current;
    analyticsInstance?.trackMetric(
      `component.${componentName}.lifetime`,
      lifetime,
      'ms'
    );
    analyticsInstance?.trackEvent({
      name: 'component_unmount',
      category: 'component',
      action: 'unmount',
      label: componentName,
      value: lifetime,
    });
  }, [componentName]);

  const trackInteraction = useCallback((action: string, details?: Record<string, unknown>) => {
    analyticsInstance?.trackEvent({
      name: 'component_interaction',
      category: 'component',
      action,
      label: componentName,
      properties: details,
    });
  }, [componentName]);

  useEffect(() => {
    trackMount();
    return () => trackUnmount();
  }, [trackMount, trackUnmount]);

  return { trackRender, trackMount, trackUnmount, trackInteraction };
}

/**
 * Hook para tracking de performance
 */
export function useKBPerformanceMetrics(): {
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  measureSync: <T>(name: string, fn: () => T) => T;
  recordTiming: (name: string, duration: number) => void;
} {
  const measureAsync = useCallback(async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      analyticsInstance?.trackMetric(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      analyticsInstance?.trackMetric(`${name}.error`, duration, 'ms');
      throw error;
    }
  }, []);

  const measureSync = useCallback(<T>(name: string, fn: () => T): T => {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      analyticsInstance?.trackMetric(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      analyticsInstance?.trackMetric(`${name}.error`, duration, 'ms');
      throw error;
    }
  }, []);

  const recordTiming = useCallback((name: string, duration: number) => {
    analyticsInstance?.trackMetric(name, duration, 'ms');
  }, []);

  return { measureAsync, measureSync, recordTiming };
}

// ============================================================================
// BUILT-IN PROVIDERS
// ============================================================================

/**
 * Console provider para desarrollo
 */
export function createConsoleProvider(): KBAnalyticsProvider {
  return {
    name: 'console',
    trackEvent: (event) => {
      console.log('[Analytics Event]', event);
    },
    trackMetric: (metric) => {
      console.log('[Analytics Metric]', metric);
    },
    trackSpan: (span) => {
      console.log('[Analytics Span]', span);
    },
  };
}

/**
 * LocalStorage provider para persistencia local
 */
export function createLocalStorageProvider(key: string = 'kb_analytics'): KBAnalyticsProvider {
  const MAX_ITEMS = 1000;

  const getStoredData = () => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : { events: [], metrics: [], spans: [] };
    } catch {
      return { events: [], metrics: [], spans: [] };
    }
  };

  const saveData = (data: { events: KBAnalyticsEvent[]; metrics: KBMetricData[]; spans: KBSpanData[] }) => {
    try {
      // Trim to max items
      data.events = data.events.slice(-MAX_ITEMS);
      data.metrics = data.metrics.slice(-MAX_ITEMS);
      data.spans = data.spans.slice(-MAX_ITEMS);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics to localStorage:', error);
    }
  };

  return {
    name: 'localStorage',
    trackEvent: (event) => {
      const data = getStoredData();
      data.events.push(event);
      saveData(data);
    },
    trackMetric: (metric) => {
      const data = getStoredData();
      data.metrics.push(metric);
      saveData(data);
    },
    trackSpan: (span) => {
      const data = getStoredData();
      data.spans.push(span);
      saveData(data);
    },
  };
}

/**
 * HTTP provider para envío a servidor
 */
export function createHttpProvider(config: {
  endpoint: string;
  headers?: Record<string, string>;
  batchEvents?: boolean;
}): KBAnalyticsProvider {
  const pendingEvents: KBAnalyticsEvent[] = [];
  const pendingMetrics: KBMetricData[] = [];
  const pendingSpans: KBSpanData[] = [];

  const sendData = async (type: string, data: unknown[]) => {
    if (data.length === 0) return;

    try {
      await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({ type, data }),
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  };

  return {
    name: 'http',
    trackEvent: (event) => {
      if (config.batchEvents) {
        pendingEvents.push(event);
      } else {
        sendData('events', [event]);
      }
    },
    trackMetric: (metric) => {
      if (config.batchEvents) {
        pendingMetrics.push(metric);
      } else {
        sendData('metrics', [metric]);
      }
    },
    trackSpan: (span) => {
      if (config.batchEvents) {
        pendingSpans.push(span);
      } else {
        sendData('spans', [span]);
      }
    },
    flush: async () => {
      await Promise.all([
        sendData('events', pendingEvents.splice(0)),
        sendData('metrics', pendingMetrics.splice(0)),
        sendData('spans', pendingSpans.splice(0)),
      ]);
    },
  };
}

export default useKBAnalytics;
