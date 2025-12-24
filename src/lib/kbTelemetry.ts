/**
 * KB 2.5 - OpenTelemetry Compatible Telemetry System
 * Distributed tracing and observability utilities
 */

import { KBTelemetry, KBSpan, KBSpanEvent } from '@/hooks/core/types';

// === TRACE ID GENERATION ===
function generateId(length: 16 | 32 = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateTraceId(): string {
  return generateId(32);
}

export function generateSpanId(): string {
  return generateId(16);
}

// === TRACE CONTEXT ===
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

let currentTraceContext: TraceContext | null = null;

export function createTraceContext(parentContext?: Partial<TraceContext>): TraceContext {
  return {
    traceId: parentContext?.traceId || generateTraceId(),
    spanId: generateSpanId(),
    parentSpanId: parentContext?.spanId,
    sampled: parentContext?.sampled ?? true,
  };
}

export function getCurrentTraceContext(): TraceContext | null {
  return currentTraceContext;
}

export function setCurrentTraceContext(context: TraceContext | null): void {
  currentTraceContext = context;
}

export function withTraceContext<T>(context: TraceContext, fn: () => T): T {
  const previous = currentTraceContext;
  currentTraceContext = context;
  try {
    return fn();
  } finally {
    currentTraceContext = previous;
  }
}

// === SPAN MANAGEMENT ===
const activeSpans: Map<string, KBSpan> = new Map();
const completedSpans: KBSpan[] = [];
const MAX_COMPLETED_SPANS = 1000;

export function startSpan(
  name: string,
  options?: {
    parentSpanId?: string;
    attributes?: Record<string, string | number | boolean>;
  }
): KBSpan {
  const context = currentTraceContext || createTraceContext();
  
  const span: KBSpan = {
    traceId: context.traceId,
    spanId: generateSpanId(),
    parentSpanId: options?.parentSpanId || context.parentSpanId,
    name,
    startTime: Date.now(),
    status: 'UNSET',
    attributes: options?.attributes || {},
    events: [],
  };

  activeSpans.set(span.spanId, span);
  
  // Update current context
  setCurrentTraceContext({
    ...context,
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
  });

  return span;
}

export function endSpan(
  spanId: string,
  status: 'OK' | 'ERROR' = 'OK',
  attributes?: Record<string, string | number | boolean>
): KBSpan | null {
  const span = activeSpans.get(spanId);
  if (!span) return null;

  span.endTime = Date.now();
  span.status = status;
  if (attributes) {
    span.attributes = { ...span.attributes, ...attributes };
  }

  activeSpans.delete(spanId);
  completedSpans.push(span);

  // Trim completed spans if necessary
  if (completedSpans.length > MAX_COMPLETED_SPANS) {
    completedSpans.splice(0, completedSpans.length - MAX_COMPLETED_SPANS);
  }

  return span;
}

export function addSpanEvent(
  spanId: string,
  name: string,
  attributes?: Record<string, string | number | boolean>
): void {
  const span = activeSpans.get(spanId);
  if (!span) return;

  span.events.push({
    name,
    timestamp: Date.now(),
    attributes,
  });
}

export function setSpanAttribute(
  spanId: string,
  key: string,
  value: string | number | boolean
): void {
  const span = activeSpans.get(spanId);
  if (!span) return;

  span.attributes[key] = value;
}

// === SPAN UTILITIES ===
export function getActiveSpans(): KBSpan[] {
  return Array.from(activeSpans.values());
}

export function getCompletedSpans(): KBSpan[] {
  return [...completedSpans];
}

export function clearCompletedSpans(): void {
  completedSpans.length = 0;
}

// === TELEMETRY ENRICHMENT ===
export function enrichTelemetry(telemetry: KBTelemetry): KBTelemetry {
  const context = getCurrentTraceContext();
  if (!context) return telemetry;

  return {
    ...telemetry,
    traceId: context.traceId,
    spanId: context.spanId,
    parentSpanId: context.parentSpanId,
  };
}

// === HTTP HEADER PROPAGATION ===
export function injectTraceHeaders(headers: Headers | Record<string, string>): void {
  const context = getCurrentTraceContext();
  if (!context || !context.sampled) return;

  const traceparent = `00-${context.traceId}-${context.spanId}-01`;
  
  if (headers instanceof Headers) {
    headers.set('traceparent', traceparent);
  } else {
    headers['traceparent'] = traceparent;
  }
}

export function extractTraceContext(headers: Headers | Record<string, string>): TraceContext | null {
  const traceparent = headers instanceof Headers 
    ? headers.get('traceparent')
    : headers['traceparent'];

  if (!traceparent) return null;

  const parts = traceparent.split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, parentSpanId, flags] = parts;
  if (version !== '00') return null;

  return {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    sampled: flags === '01',
  };
}

// === EXPORTER INTERFACE ===
export interface TelemetryExporter {
  export(spans: KBSpan[]): Promise<void>;
  shutdown(): Promise<void>;
}

// === CONSOLE EXPORTER ===
export class ConsoleExporter implements TelemetryExporter {
  async export(spans: KBSpan[]): Promise<void> {
    for (const span of spans) {
      const duration = span.endTime ? span.endTime - span.startTime : 0;
      const status = span.status === 'ERROR' ? '❌' : '✅';
      
      console.log(
        `${status} [${span.traceId.slice(0, 8)}] ${span.name} (${duration}ms)`,
        {
          spanId: span.spanId,
          parentSpanId: span.parentSpanId,
          attributes: span.attributes,
          events: span.events,
        }
      );
    }
  }

  async shutdown(): Promise<void> {
    // Nothing to clean up for console exporter
  }
}

// === BATCH EXPORTER ===
export class BatchExporter implements TelemetryExporter {
  private buffer: KBSpan[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private readonly endpoint: string;

  constructor(options: {
    endpoint: string;
    batchSize?: number;
    flushIntervalMs?: number;
  }) {
    this.endpoint = options.endpoint;
    this.batchSize = options.batchSize || 100;
    this.flushIntervalMs = options.flushIntervalMs || 5000;
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  async export(spans: KBSpan[]): Promise<void> {
    this.buffer.push(...spans);

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const spansToExport = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spans: spansToExport }),
      });
    } catch (error) {
      console.error('[BatchExporter] Failed to export spans:', error);
      // Put spans back in buffer for retry
      this.buffer.unshift(...spansToExport);
    }
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}

// === TELEMETRY PROVIDER ===
class TelemetryProvider {
  private exporters: TelemetryExporter[] = [];
  private autoExportInterval: NodeJS.Timeout | null = null;

  addExporter(exporter: TelemetryExporter): void {
    this.exporters.push(exporter);
  }

  removeExporter(exporter: TelemetryExporter): void {
    const index = this.exporters.indexOf(exporter);
    if (index !== -1) {
      this.exporters.splice(index, 1);
    }
  }

  startAutoExport(intervalMs: number = 10000): void {
    if (this.autoExportInterval) return;

    this.autoExportInterval = setInterval(() => {
      this.exportCompletedSpans();
    }, intervalMs);
  }

  stopAutoExport(): void {
    if (this.autoExportInterval) {
      clearInterval(this.autoExportInterval);
      this.autoExportInterval = null;
    }
  }

  async exportCompletedSpans(): Promise<void> {
    const spans = getCompletedSpans();
    if (spans.length === 0) return;

    await Promise.all(
      this.exporters.map(exporter => exporter.export(spans))
    );

    clearCompletedSpans();
  }

  async shutdown(): Promise<void> {
    this.stopAutoExport();
    await this.exportCompletedSpans();
    await Promise.all(
      this.exporters.map(exporter => exporter.shutdown())
    );
    this.exporters = [];
  }
}

// === GLOBAL INSTANCE ===
export const telemetryProvider = new TelemetryProvider();

// === CONVENIENCE FUNCTIONS ===
export function trace<T>(name: string, fn: () => T): T {
  const span = startSpan(name);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then((value) => {
          endSpan(span.spanId, 'OK');
          return value;
        })
        .catch((error) => {
          endSpan(span.spanId, 'ERROR', { error: String(error) });
          throw error;
        }) as T;
    }
    endSpan(span.spanId, 'OK');
    return result;
  } catch (error) {
    endSpan(span.spanId, 'ERROR', { error: String(error) });
    throw error;
  }
}

export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = startSpan(name, { attributes });
  try {
    const result = await fn();
    endSpan(span.spanId, 'OK');
    return result;
  } catch (error) {
    endSpan(span.spanId, 'ERROR', { error: String(error) });
    throw error;
  }
}
