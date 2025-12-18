/**
 * Observability System - OpenTelemetry-compatible instrumentation
 * Provides end-to-end tracing, metrics, and logs across all application layers
 */

// Trace context for distributed tracing
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

// Span represents a unit of work
interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: 'client' | 'server' | 'internal' | 'producer' | 'consumer';
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number | boolean>;
}

// Metric types
interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

// Log entry
interface LogEntry {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: number;
  traceId?: string;
  spanId?: string;
  attributes?: Record<string, unknown>;
}

// Generate unique IDs
function generateTraceId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSpanId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Observability configuration
interface ObservabilityConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  samplingRate: number;
  enableConsoleExporter: boolean;
  enablePerformanceMetrics: boolean;
  enableUserInteractionTracing: boolean;
  enableNetworkTracing: boolean;
  batchSize: number;
  flushInterval: number;
}

const defaultConfig: ObservabilityConfig = {
  serviceName: 'obelixia-frontend',
  serviceVersion: '1.0.0',
  environment: import.meta.env.MODE || 'development',
  samplingRate: 1.0,
  enableConsoleExporter: import.meta.env.DEV,
  enablePerformanceMetrics: true,
  enableUserInteractionTracing: true,
  enableNetworkTracing: true,
  batchSize: 100,
  flushInterval: 30000, // 30 seconds
};

class ObservabilityManager {
  private config: ObservabilityConfig;
  private spans: Span[] = [];
  private metrics: Metric[] = [];
  private logs: LogEntry[] = [];
  private activeSpans: Map<string, Span> = new Map();
  private currentTraceContext: TraceContext | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initialize();
  }

  private initialize(): void {
    // Start flush timer
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Instrument performance metrics
    if (this.config.enablePerformanceMetrics) {
      this.instrumentPerformance();
    }

    // Instrument user interactions
    if (this.config.enableUserInteractionTracing) {
      this.instrumentUserInteractions();
    }

    // Instrument network requests
    if (this.config.enableNetworkTracing) {
      this.instrumentNetwork();
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    this.log('info', 'Observability system initialized', {
      serviceName: this.config.serviceName,
      environment: this.config.environment,
    });
  }

  // Tracing methods
  startSpan(name: string, options: {
    kind?: Span['kind'];
    attributes?: Record<string, string | number | boolean>;
    parentSpanId?: string;
  } = {}): string {
    // Check sampling
    if (Math.random() > this.config.samplingRate) {
      return '';
    }

    const spanId = generateSpanId();
    const traceId = this.currentTraceContext?.traceId || generateTraceId();

    const span: Span = {
      traceId,
      spanId,
      parentSpanId: options.parentSpanId || this.currentTraceContext?.spanId,
      name,
      kind: options.kind || 'internal',
      startTime: performance.now(),
      status: 'unset',
      attributes: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'deployment.environment': this.config.environment,
        ...options.attributes,
      },
      events: [],
    };

    this.activeSpans.set(spanId, span);

    // Update trace context
    this.currentTraceContext = {
      traceId,
      spanId,
      parentSpanId: span.parentSpanId,
      sampled: true,
    };

    return spanId;
  }

  endSpan(spanId: string, status: Span['status'] = 'ok'): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.status = status;

    this.spans.push(span);
    this.activeSpans.delete(spanId);

    // Export if console exporter enabled
    if (this.config.enableConsoleExporter) {
      const duration = span.endTime - span.startTime;
      console.log(`[TRACE] ${span.name} (${duration.toFixed(2)}ms) - ${status}`, {
        traceId: span.traceId,
        spanId: span.spanId,
        attributes: span.attributes,
      });
    }

    // Check batch size
    if (this.spans.length >= this.config.batchSize) {
      this.flush();
    }
  }

  addSpanEvent(spanId: string, name: string, attributes?: Record<string, string | number | boolean>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
  }

  setSpanAttribute(spanId: string, key: string, value: string | number | boolean): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.attributes[key] = value;
  }

  // Metrics methods
  recordCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    this.recordMetric(name, 'counter', value, labels);
  }

  recordGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.recordMetric(name, 'gauge', value, labels);
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    this.recordMetric(name, 'histogram', value, labels);
  }

  private recordMetric(
    name: string,
    type: Metric['type'],
    value: number,
    labels: Record<string, string>
  ): void {
    const metric: Metric = {
      name,
      type,
      value,
      labels: {
        service: this.config.serviceName,
        environment: this.config.environment,
        ...labels,
      },
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    if (this.config.enableConsoleExporter) {
      console.log(`[METRIC] ${name}: ${value}`, labels);
    }

    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Logging methods
  log(level: LogEntry['level'], message: string, attributes?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      traceId: this.currentTraceContext?.traceId,
      spanId: this.currentTraceContext?.spanId,
      attributes: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        ...attributes,
      },
    };

    this.logs.push(entry);

    if (this.config.enableConsoleExporter) {
      const prefix = `[${level.toUpperCase()}]`;
      const traceInfo = entry.traceId ? ` [trace:${entry.traceId.slice(0, 8)}]` : '';
      console.log(`${prefix}${traceInfo} ${message}`, attributes || '');
    }

    if (this.logs.length >= this.config.batchSize) {
      this.flush();
    }
  }

  trace(message: string, attributes?: Record<string, unknown>): void {
    this.log('trace', message, attributes);
  }

  debug(message: string, attributes?: Record<string, unknown>): void {
    this.log('debug', message, attributes);
  }

  info(message: string, attributes?: Record<string, unknown>): void {
    this.log('info', message, attributes);
  }

  warn(message: string, attributes?: Record<string, unknown>): void {
    this.log('warn', message, attributes);
  }

  error(message: string, attributes?: Record<string, unknown>): void {
    this.log('error', message, attributes);
  }

  fatal(message: string, attributes?: Record<string, unknown>): void {
    this.log('fatal', message, attributes);
  }

  // Performance instrumentation
  private instrumentPerformance(): void {
    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordHistogram('web_vitals.lcp', lastEntry.startTime, { metric: 'LCP' });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as PerformanceEventTiming;
            this.recordHistogram('web_vitals.fid', fidEntry.processingStart - fidEntry.startTime, { metric: 'FID' });
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID not supported
      }

      // CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
              this.recordGauge('web_vitals.cls', clsValue, { metric: 'CLS' });
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }

      // Long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordHistogram('performance.long_task', entry.duration, {
              name: entry.name,
            });
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (e) {
        // Long tasks not supported
      }
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.recordHistogram('performance.dns', navigation.domainLookupEnd - navigation.domainLookupStart);
          this.recordHistogram('performance.tcp', navigation.connectEnd - navigation.connectStart);
          this.recordHistogram('performance.ttfb', navigation.responseStart - navigation.requestStart);
          this.recordHistogram('performance.dom_load', navigation.domContentLoadedEventEnd - navigation.responseEnd);
          this.recordHistogram('performance.window_load', navigation.loadEventEnd - navigation.loadEventStart);
        }
      }, 0);
    });
  }

  // User interaction instrumentation
  private instrumentUserInteractions(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;

      const spanId = this.startSpan('user.click', {
        kind: 'client',
        attributes: {
          'user.action': 'click',
          'element.tag': tagName,
          'element.id': id || 'unknown',
          'element.class': typeof className === 'string' ? className : '',
        },
      });

      if (spanId) {
        this.endSpan(spanId, 'ok');
      }

      this.recordCounter('user.interactions', 1, { type: 'click', element: tagName });
    }, { passive: true });

    // Navigation tracking
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.recordCounter('navigation.push_state', 1, { url: args[2]?.toString() || '' });
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.recordCounter('navigation.replace_state', 1, { url: args[2]?.toString() || '' });
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', () => {
      this.recordCounter('navigation.pop_state', 1, { url: window.location.href });
    });
  }

  // Network instrumentation
  private instrumentNetwork(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';

      const spanId = self.startSpan(`HTTP ${method}`, {
        kind: 'client',
        attributes: {
          'http.method': method,
          'http.url': url,
        },
      });

      const startTime = performance.now();

      try {
        const response = await originalFetch.apply(this, [input, init]);
        const duration = performance.now() - startTime;

        if (spanId) {
          self.setSpanAttribute(spanId, 'http.status_code', response.status);
          self.setSpanAttribute(spanId, 'http.response_size', parseInt(response.headers.get('content-length') || '0'));
          self.endSpan(spanId, response.ok ? 'ok' : 'error');
        }

        self.recordHistogram('http.request.duration', duration, {
          method,
          status: response.status.toString(),
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        if (spanId) {
          self.setSpanAttribute(spanId, 'error', true);
          self.setSpanAttribute(spanId, 'error.message', (error as Error).message);
          self.endSpan(spanId, 'error');
        }

        self.recordHistogram('http.request.duration', duration, {
          method,
          status: 'error',
        });

        self.error('HTTP request failed', { url, method, error: (error as Error).message });

        throw error;
      }
    };
  }

  // Flush data to backend
  private async flush(): Promise<void> {
    if (this.spans.length === 0 && this.metrics.length === 0 && this.logs.length === 0) {
      return;
    }

    const payload = {
      spans: [...this.spans],
      metrics: [...this.metrics],
      logs: [...this.logs],
      resource: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'deployment.environment': this.config.environment,
      },
    };

    // Clear buffers
    this.spans = [];
    this.metrics = [];
    this.logs = [];

    // Store locally for debugging
    try {
      const existingData = JSON.parse(localStorage.getItem('observability_data') || '[]');
      existingData.push({
        timestamp: Date.now(),
        ...payload,
      });
      // Keep only last 100 entries
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      localStorage.setItem('observability_data', JSON.stringify(existingData));
    } catch (e) {
      // Storage full or not available
    }

    // In production, send to observability backend
    // This would integrate with Grafana/Loki/Prometheus/Datadog/New Relic
    if (this.config.enableConsoleExporter && import.meta.env.DEV) {
      console.log('[OBSERVABILITY] Flushed data:', {
        spans: payload.spans.length,
        metrics: payload.metrics.length,
        logs: payload.logs.length,
      });
    }
  }

  // Get trace context for propagation
  getTraceContext(): TraceContext | null {
    return this.currentTraceContext;
  }

  // Get stored observability data
  getStoredData(): unknown[] {
    try {
      return JSON.parse(localStorage.getItem('observability_data') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored data
  clearStoredData(): void {
    localStorage.removeItem('observability_data');
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Singleton instance
let observabilityInstance: ObservabilityManager | null = null;

export function initObservability(config?: Partial<ObservabilityConfig>): ObservabilityManager {
  if (!observabilityInstance) {
    observabilityInstance = new ObservabilityManager(config);
  }
  return observabilityInstance;
}

export function getObservability(): ObservabilityManager {
  if (!observabilityInstance) {
    observabilityInstance = new ObservabilityManager();
  }
  return observabilityInstance;
}

// Convenience exports
export const observability = {
  startSpan: (name: string, options?: Parameters<ObservabilityManager['startSpan']>[1]) => 
    getObservability().startSpan(name, options),
  endSpan: (spanId: string, status?: Span['status']) => 
    getObservability().endSpan(spanId, status),
  addSpanEvent: (spanId: string, name: string, attributes?: Record<string, string | number | boolean>) =>
    getObservability().addSpanEvent(spanId, name, attributes),
  setSpanAttribute: (spanId: string, key: string, value: string | number | boolean) =>
    getObservability().setSpanAttribute(spanId, key, value),
  recordCounter: (name: string, value?: number, labels?: Record<string, string>) =>
    getObservability().recordCounter(name, value, labels),
  recordGauge: (name: string, value: number, labels?: Record<string, string>) =>
    getObservability().recordGauge(name, value, labels),
  recordHistogram: (name: string, value: number, labels?: Record<string, string>) =>
    getObservability().recordHistogram(name, value, labels),
  trace: (message: string, attributes?: Record<string, unknown>) =>
    getObservability().trace(message, attributes),
  debug: (message: string, attributes?: Record<string, unknown>) =>
    getObservability().debug(message, attributes),
  info: (message: string, attributes?: Record<string, unknown>) =>
    getObservability().info(message, attributes),
  warn: (message: string, attributes?: Record<string, unknown>) =>
    getObservability().warn(message, attributes),
  error: (message: string, attributes?: Record<string, unknown>) =>
    getObservability().error(message, attributes),
  fatal: (message: string, attributes?: Record<string, unknown>) =>
    getObservability().fatal(message, attributes),
  getTraceContext: () => getObservability().getTraceContext(),
  getStoredData: () => getObservability().getStoredData(),
  clearStoredData: () => getObservability().clearStoredData(),
};

export type { TraceContext, Span, SpanEvent, Metric, LogEntry, ObservabilityConfig };
