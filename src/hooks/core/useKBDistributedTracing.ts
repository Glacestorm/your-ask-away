/**
 * KB 4.5 - Distributed Tracing Hook (Phase 18)
 * OpenTelemetry-compatible distributed tracing
 */

import { useState, useCallback, useRef, useEffect, useMemo, useContext, createContext } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type SpanStatus = 'unset' | 'ok' | 'error';
export type SpanKindType = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
  traceState?: string;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | boolean[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

export interface SpanLink {
  context: TraceContext;
  attributes?: SpanAttributes;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKindType;
  startTime: number;
  endTime?: number;
  status: SpanStatus;
  statusMessage?: string;
  attributes: SpanAttributes;
  events: SpanEvent[];
  links: SpanLink[];
}

export interface TracerConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  samplingRate?: number;
  exporters?: TracingExporter[];
  propagators?: TracePropagator[];
  resourceAttributes?: SpanAttributes;
  maxSpansPerTrace?: number;
  flushInterval?: number;
}

export interface TracingExporter {
  name: string;
  export: (spans: Span[]) => Promise<void>;
}

export interface TracePropagator {
  inject: (context: TraceContext, carrier: Record<string, string>) => void;
  extract: (carrier: Record<string, string>) => TraceContext | null;
}

export interface TracingMetrics {
  totalSpans: number;
  activeSpans: number;
  exportedSpans: number;
  droppedSpans: number;
  averageSpanDuration: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(length: number = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateTraceId(): string {
  return generateId(32);
}

function generateSpanId(): string {
  return generateId(16);
}

// ============================================================================
// W3C TRACE CONTEXT PROPAGATOR
// ============================================================================

export const w3cTracePropagator: TracePropagator = {
  inject: (context: TraceContext, carrier: Record<string, string>) => {
    const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, '0')}`;
    carrier['traceparent'] = traceparent;
    if (context.traceState) {
      carrier['tracestate'] = context.traceState;
    }
  },
  extract: (carrier: Record<string, string>): TraceContext | null => {
    const traceparent = carrier['traceparent'];
    if (!traceparent) return null;
    
    const parts = traceparent.split('-');
    if (parts.length !== 4) return null;
    
    return {
      traceId: parts[1],
      spanId: parts[2],
      traceFlags: parseInt(parts[3], 16),
      traceState: carrier['tracestate'],
    };
  },
};

// ============================================================================
// CONSOLE EXPORTER
// ============================================================================

export const consoleTracingExporter: TracingExporter = {
  name: 'console',
  export: async (spans: Span[]) => {
    spans.forEach(span => {
      const duration = span.endTime ? span.endTime - span.startTime : 0;
      console.log(`[TRACE] ${span.name}`, {
        traceId: span.traceId,
        spanId: span.spanId,
        duration: `${duration}ms`,
        status: span.status,
        attributes: span.attributes,
      });
    });
  },
};

// ============================================================================
// TRACER CONTEXT
// ============================================================================

interface TracerContextValue {
  config: TracerConfig;
  currentSpan: Span | null;
  startSpan: (name: string, options?: Partial<Span>) => Span;
  endSpan: (span: Span, status?: SpanStatus, message?: string) => void;
  getTraceContext: () => TraceContext | null;
}

const TracerContext = createContext<TracerContextValue | null>(null);

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBDistributedTracing(config: TracerConfig): {
  // State
  currentSpan: Span | null;
  metrics: TracingMetrics;
  
  // Span Operations
  startSpan: (name: string, options?: Partial<Span>) => Span;
  endSpan: (span: Span, status?: SpanStatus, message?: string) => void;
  withSpan: <T>(name: string, fn: (span: Span) => Promise<T>) => Promise<T>;
  
  // Span Modification
  addEvent: (span: Span, name: string, attributes?: SpanAttributes) => void;
  setAttribute: (span: Span, key: string, value: SpanAttributes[string]) => void;
  setAttributes: (span: Span, attributes: SpanAttributes) => void;
  
  // Context
  getTraceContext: () => TraceContext | null;
  injectContext: (carrier: Record<string, string>) => void;
  extractContext: (carrier: Record<string, string>) => TraceContext | null;
  
  // Export
  flush: () => Promise<void>;
} {
  const [currentSpan, setCurrentSpan] = useState<Span | null>(null);
  const spansRef = useRef<Span[]>([]);
  const activeSpansRef = useRef<Map<string, Span>>(new Map());
  const metricsRef = useRef<TracingMetrics>({
    totalSpans: 0,
    activeSpans: 0,
    exportedSpans: 0,
    droppedSpans: 0,
    averageSpanDuration: 0,
  });

  const configRef = useRef(config);
  configRef.current = config;

  // Sampling decision
  const shouldSample = useCallback((): boolean => {
    const rate = configRef.current.samplingRate ?? 1.0;
    return Math.random() < rate;
  }, []);

  // Start a new span
  const startSpan = useCallback((name: string, options?: Partial<Span>): Span => {
    const parentSpan = currentSpan;
    const traceId = parentSpan?.traceId ?? generateTraceId();
    const spanId = generateSpanId();

    const span: Span = {
      traceId,
      spanId,
      parentSpanId: parentSpan?.spanId,
      name,
      kind: options?.kind ?? 'internal',
      startTime: Date.now(),
      status: 'unset',
      attributes: {
        'service.name': configRef.current.serviceName,
        'service.version': configRef.current.serviceVersion ?? '1.0.0',
        ...configRef.current.resourceAttributes,
        ...options?.attributes,
      },
      events: options?.events ?? [],
      links: options?.links ?? [],
    };

    if (shouldSample()) {
      activeSpansRef.current.set(spanId, span);
      metricsRef.current.totalSpans++;
      metricsRef.current.activeSpans = activeSpansRef.current.size;
      setCurrentSpan(span);
    }

    return span;
  }, [currentSpan, shouldSample]);

  // End a span
  const endSpan = useCallback((span: Span, status?: SpanStatus, message?: string) => {
    span.endTime = Date.now();
    span.status = status ?? 'ok';
    if (message) span.statusMessage = message;

    activeSpansRef.current.delete(span.spanId);
    spansRef.current.push(span);

    // Update metrics
    const duration = span.endTime - span.startTime;
    const total = metricsRef.current.totalSpans;
    metricsRef.current.averageSpanDuration = 
      (metricsRef.current.averageSpanDuration * (total - 1) + duration) / total;
    metricsRef.current.activeSpans = activeSpansRef.current.size;

    // Update current span to parent
    if (span.parentSpanId) {
      const parent = activeSpansRef.current.get(span.parentSpanId);
      setCurrentSpan(parent ?? null);
    } else {
      setCurrentSpan(null);
    }

    // Check max spans
    const maxSpans = configRef.current.maxSpansPerTrace ?? 1000;
    if (spansRef.current.length > maxSpans) {
      metricsRef.current.droppedSpans += spansRef.current.length - maxSpans;
      spansRef.current = spansRef.current.slice(-maxSpans);
    }
  }, []);

  // Execute function with span
  const withSpan = useCallback(async <T>(
    name: string,
    fn: (span: Span) => Promise<T>
  ): Promise<T> => {
    const span = startSpan(name);
    try {
      const result = await fn(span);
      endSpan(span, 'ok');
      return result;
    } catch (error) {
      endSpan(span, 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [startSpan, endSpan]);

  // Add event to span
  const addEvent = useCallback((span: Span, name: string, attributes?: SpanAttributes) => {
    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }, []);

  // Set attribute
  const setAttribute = useCallback((span: Span, key: string, value: SpanAttributes[string]) => {
    span.attributes[key] = value;
  }, []);

  // Set multiple attributes
  const setAttributes = useCallback((span: Span, attributes: SpanAttributes) => {
    Object.assign(span.attributes, attributes);
  }, []);

  // Get current trace context
  const getTraceContext = useCallback((): TraceContext | null => {
    if (!currentSpan) return null;
    return {
      traceId: currentSpan.traceId,
      spanId: currentSpan.spanId,
      parentSpanId: currentSpan.parentSpanId,
      traceFlags: 1, // sampled
    };
  }, [currentSpan]);

  // Inject context into carrier
  const injectContext = useCallback((carrier: Record<string, string>) => {
    const context = getTraceContext();
    if (!context) return;
    
    const propagators = configRef.current.propagators ?? [w3cTracePropagator];
    propagators.forEach(p => p.inject(context, carrier));
  }, [getTraceContext]);

  // Extract context from carrier
  const extractContext = useCallback((carrier: Record<string, string>): TraceContext | null => {
    const propagators = configRef.current.propagators ?? [w3cTracePropagator];
    for (const p of propagators) {
      const context = p.extract(carrier);
      if (context) return context;
    }
    return null;
  }, []);

  // Flush spans to exporters
  const flush = useCallback(async () => {
    const spans = [...spansRef.current];
    spansRef.current = [];

    const exporters = configRef.current.exporters ?? [consoleTracingExporter];
    await Promise.all(exporters.map(e => e.export(spans)));
    
    metricsRef.current.exportedSpans += spans.length;
  }, []);

  // Auto-flush interval
  useEffect(() => {
    const interval = configRef.current.flushInterval ?? 30000;
    const timer = setInterval(flush, interval);
    return () => clearInterval(timer);
  }, [flush]);

  return {
    currentSpan,
    metrics: { ...metricsRef.current },
    startSpan,
    endSpan,
    withSpan,
    addEvent,
    setAttribute,
    setAttributes,
    getTraceContext,
    injectContext,
    extractContext,
    flush,
  };
}

// ============================================================================
// HTTP TRACING HOOK
// ============================================================================

export function useKBHTTPTracing(config: TracerConfig): {
  tracedFetch: (url: string, options?: RequestInit) => Promise<Response>;
} {
  const tracer = useKBDistributedTracing(config);

  const tracedFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const span = tracer.startSpan(`HTTP ${options?.method ?? 'GET'}`, {
      kind: 'client',
      attributes: {
        'http.method': options?.method ?? 'GET',
        'http.url': url,
      },
    });

    // Inject trace context into headers
    const headers = new Headers(options?.headers);
    const carrier: Record<string, string> = {};
    tracer.injectContext(carrier);
    Object.entries(carrier).forEach(([k, v]) => headers.set(k, v));

    try {
      const response = await fetch(url, { ...options, headers });
      
      tracer.setAttribute(span, 'http.status_code', response.status);
      tracer.endSpan(span, response.ok ? 'ok' : 'error');
      
      return response;
    } catch (error) {
      tracer.endSpan(span, 'error', error instanceof Error ? error.message : 'Fetch failed');
      throw error;
    }
  }, [tracer]);

  return { tracedFetch };
}

// ============================================================================
// COMPONENT TRACING HOOK
// ============================================================================

export function useKBComponentTracing(
  componentName: string,
  config: TracerConfig
): {
  traceRender: () => void;
  traceEffect: (effectName: string) => () => void;
  traceCallback: <T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T
  ) => T;
} {
  const tracer = useKBDistributedTracing(config);
  const renderCountRef = useRef(0);

  const traceRender = useCallback(() => {
    renderCountRef.current++;
    const span = tracer.startSpan(`${componentName}.render`, {
      attributes: {
        'component.name': componentName,
        'render.count': renderCountRef.current,
      },
    });
    tracer.endSpan(span, 'ok');
  }, [componentName, tracer]);

  const traceEffect = useCallback((effectName: string) => {
    const span = tracer.startSpan(`${componentName}.${effectName}`, {
      attributes: {
        'component.name': componentName,
        'effect.name': effectName,
      },
    });
    
    return () => {
      tracer.endSpan(span, 'ok');
    };
  }, [componentName, tracer]);

  const traceCallback = useCallback(<T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T
  ): T => {
    return ((...args: unknown[]) => {
      const span = tracer.startSpan(`${componentName}.${name}`, {
        attributes: {
          'component.name': componentName,
          'callback.name': name,
        },
      });
      
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result
            .then(r => {
              tracer.endSpan(span, 'ok');
              return r;
            })
            .catch(e => {
              tracer.endSpan(span, 'error', e?.message);
              throw e;
            });
        }
        tracer.endSpan(span, 'ok');
        return result;
      } catch (error) {
        tracer.endSpan(span, 'error', error instanceof Error ? error.message : 'Unknown');
        throw error;
      }
    }) as T;
  }, [componentName, tracer]);

  return { traceRender, traceEffect, traceCallback };
}

export default useKBDistributedTracing;
