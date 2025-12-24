/**
 * KB 4.5 - Enhanced OpenTelemetry System
 * W3C Trace Context compliant with span links, baggage, and auto-instrumentation
 */

import { KBSpan, KBSpanEvent, KBTelemetry } from '@/hooks/core/types';

// === W3C TRACE CONTEXT TYPES ===
export interface W3CTraceContext {
  version: '00';
  traceId: string;
  spanId: string;
  traceFlags: TraceFlags;
}

export interface TraceBaggage {
  entries: Map<string, BaggageEntry>;
}

export interface BaggageEntry {
  value: string;
  metadata?: string;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  traceState?: string;
  attributes?: Record<string, SpanAttributeValue>;
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: TraceFlags;
  traceState?: string;
  isRemote?: boolean;
}

export type SpanAttributeValue = string | number | boolean | string[] | number[] | boolean[];

export enum TraceFlags {
  NONE = 0x00,
  SAMPLED = 0x01,
}

export enum SpanKind {
  INTERNAL = 'INTERNAL',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER',
}

// === ENHANCED SPAN TYPE ===
export interface KBEnhancedSpan extends Omit<KBSpan, 'attributes'> {
  kind: SpanKind;
  context: SpanContext;
  links: SpanLink[];
  attributes: Record<string, SpanAttributeValue>;
  resource: ResourceAttributes;
  instrumentationScope: InstrumentationScope;
  droppedAttributesCount: number;
  droppedEventsCount: number;
  droppedLinksCount: number;
}

export interface ResourceAttributes {
  'service.name': string;
  'service.version'?: string;
  'service.instance.id'?: string;
  'deployment.environment'?: string;
  'telemetry.sdk.name': string;
  'telemetry.sdk.version': string;
  'telemetry.sdk.language': string;
  [key: string]: SpanAttributeValue | undefined;
}

export interface InstrumentationScope {
  name: string;
  version?: string;
  schemaUrl?: string;
}

// === ID GENERATION (CRYPTO-SAFE) ===
function generateSecureId(bytes: number): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(bytes);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for non-browser environments
  let result = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateTraceId(): string {
  return generateSecureId(16); // 32 hex chars
}

export function generateSpanId(): string {
  return generateSecureId(8); // 16 hex chars
}

// === RESOURCE CONFIGURATION ===
let globalResource: ResourceAttributes = {
  'service.name': 'kb-application',
  'telemetry.sdk.name': 'kb-telemetry',
  'telemetry.sdk.version': '4.5.0',
  'telemetry.sdk.language': 'typescript',
};

export function configureResource(resource: Partial<ResourceAttributes>): void {
  globalResource = { ...globalResource, ...resource };
}

export function getResource(): ResourceAttributes {
  return { ...globalResource };
}

// === BAGGAGE MANAGEMENT ===
let currentBaggage: TraceBaggage = { entries: new Map() };

export function setBaggageEntry(key: string, value: string, metadata?: string): void {
  currentBaggage.entries.set(key, { value, metadata });
}

export function getBaggageEntry(key: string): BaggageEntry | undefined {
  return currentBaggage.entries.get(key);
}

export function removeBaggageEntry(key: string): boolean {
  return currentBaggage.entries.delete(key);
}

export function clearBaggage(): void {
  currentBaggage.entries.clear();
}

export function getAllBaggage(): Map<string, BaggageEntry> {
  return new Map(currentBaggage.entries);
}

export function serializeBaggage(): string {
  const parts: string[] = [];
  currentBaggage.entries.forEach((entry, key) => {
    let item = `${encodeURIComponent(key)}=${encodeURIComponent(entry.value)}`;
    if (entry.metadata) {
      item += `;${entry.metadata}`;
    }
    parts.push(item);
  });
  return parts.join(',');
}

export function parseBaggage(baggageHeader: string): void {
  clearBaggage();
  if (!baggageHeader) return;
  
  const pairs = baggageHeader.split(',');
  for (const pair of pairs) {
    const [keyValue, ...metadataParts] = pair.trim().split(';');
    const [key, value] = keyValue.split('=');
    if (key && value) {
      setBaggageEntry(
        decodeURIComponent(key.trim()),
        decodeURIComponent(value.trim()),
        metadataParts.length > 0 ? metadataParts.join(';') : undefined
      );
    }
  }
}

// === ENHANCED TRACE CONTEXT ===
interface EnhancedTraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: TraceFlags;
  traceState?: string;
  isRemote: boolean;
}

let currentContext: EnhancedTraceContext | null = null;
const contextStack: EnhancedTraceContext[] = [];

export function createEnhancedContext(parent?: Partial<EnhancedTraceContext>): EnhancedTraceContext {
  return {
    traceId: parent?.traceId || generateTraceId(),
    spanId: generateSpanId(),
    parentSpanId: parent?.spanId,
    traceFlags: parent?.traceFlags ?? TraceFlags.SAMPLED,
    traceState: parent?.traceState,
    isRemote: false,
  };
}

export function getCurrentContext(): EnhancedTraceContext | null {
  return currentContext;
}

export function setCurrentContext(context: EnhancedTraceContext | null): void {
  currentContext = context;
}

export function pushContext(context: EnhancedTraceContext): void {
  if (currentContext) {
    contextStack.push(currentContext);
  }
  currentContext = context;
}

export function popContext(): EnhancedTraceContext | null {
  const previous = currentContext;
  currentContext = contextStack.pop() || null;
  return previous;
}

export function withContext<T>(context: EnhancedTraceContext, fn: () => T): T {
  pushContext(context);
  try {
    return fn();
  } finally {
    popContext();
  }
}

// === SPAN MANAGEMENT ===
const activeSpans: Map<string, KBEnhancedSpan> = new Map();
const completedSpans: KBEnhancedSpan[] = [];
const MAX_COMPLETED_SPANS = 1000;
const MAX_SPAN_ATTRIBUTES = 128;
const MAX_SPAN_EVENTS = 128;
const MAX_SPAN_LINKS = 128;

export interface StartSpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, SpanAttributeValue>;
  links?: SpanLink[];
  startTime?: number;
  parentContext?: EnhancedTraceContext;
  scope?: InstrumentationScope;
}

export function startEnhancedSpan(
  name: string,
  options: StartSpanOptions = {}
): KBEnhancedSpan {
  const parentContext = options.parentContext || currentContext;
  const context = createEnhancedContext(parentContext ?? undefined);
  
  const span: KBEnhancedSpan = {
    traceId: context.traceId,
    spanId: context.spanId,
    parentSpanId: context.parentSpanId,
    name,
    startTime: options.startTime || Date.now(),
    status: 'UNSET',
    kind: options.kind || SpanKind.INTERNAL,
    context: {
      traceId: context.traceId,
      spanId: context.spanId,
      traceFlags: context.traceFlags,
      traceState: context.traceState,
      isRemote: false,
    },
    links: (options.links || []).slice(0, MAX_SPAN_LINKS),
    attributes: {},
    events: [],
    resource: getResource(),
    instrumentationScope: options.scope || {
      name: 'kb-telemetry',
      version: '4.5.0',
    },
    droppedAttributesCount: 0,
    droppedEventsCount: 0,
    droppedLinksCount: Math.max(0, (options.links?.length || 0) - MAX_SPAN_LINKS),
  };

  // Add initial attributes
  if (options.attributes) {
    const entries = Object.entries(options.attributes);
    const toAdd = entries.slice(0, MAX_SPAN_ATTRIBUTES);
    span.droppedAttributesCount = Math.max(0, entries.length - MAX_SPAN_ATTRIBUTES);
    toAdd.forEach(([key, value]) => {
      span.attributes[key] = value;
    });
  }

  activeSpans.set(span.spanId, span);
  pushContext(context);

  return span;
}

export function endEnhancedSpan(
  spanId: string,
  status: 'OK' | 'ERROR' | 'UNSET' = 'OK',
  options?: {
    endTime?: number;
    attributes?: Record<string, SpanAttributeValue>;
    statusMessage?: string;
  }
): KBEnhancedSpan | null {
  const span = activeSpans.get(spanId);
  if (!span) return null;

  span.endTime = options?.endTime || Date.now();
  span.status = status;

  if (options?.attributes) {
    const currentCount = Object.keys(span.attributes).length;
    const entries = Object.entries(options.attributes);
    const spaceLeft = MAX_SPAN_ATTRIBUTES - currentCount;
    const toAdd = entries.slice(0, spaceLeft);
    span.droppedAttributesCount += Math.max(0, entries.length - spaceLeft);
    toAdd.forEach(([key, value]) => {
      span.attributes[key] = value;
    });
  }

  if (options?.statusMessage) {
    span.attributes['status.message'] = options.statusMessage;
  }

  activeSpans.delete(spanId);
  completedSpans.push(span);
  popContext();

  // Trim completed spans
  if (completedSpans.length > MAX_COMPLETED_SPANS) {
    completedSpans.splice(0, completedSpans.length - MAX_COMPLETED_SPANS);
  }

  return span;
}

export function addEnhancedSpanEvent(
  spanId: string,
  name: string,
  attributes?: Record<string, SpanAttributeValue>,
  timestamp?: number
): void {
  const span = activeSpans.get(spanId);
  if (!span) return;

  if (span.events.length >= MAX_SPAN_EVENTS) {
    span.droppedEventsCount++;
    return;
  }

  span.events.push({
    name,
    timestamp: timestamp || Date.now(),
    attributes: attributes as Record<string, string | number | boolean> | undefined,
  });
}

export function addSpanLink(spanId: string, link: SpanLink): void {
  const span = activeSpans.get(spanId);
  if (!span) return;

  if (span.links.length >= MAX_SPAN_LINKS) {
    span.droppedLinksCount++;
    return;
  }

  span.links.push(link);
}

export function setEnhancedSpanAttribute(
  spanId: string,
  key: string,
  value: SpanAttributeValue
): void {
  const span = activeSpans.get(spanId);
  if (!span) return;

  const currentCount = Object.keys(span.attributes).length;
  if (!(key in span.attributes) && currentCount >= MAX_SPAN_ATTRIBUTES) {
    span.droppedAttributesCount++;
    return;
  }

  span.attributes[key] = value;
}

export function setEnhancedSpanAttributes(
  spanId: string,
  attributes: Record<string, SpanAttributeValue>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    setEnhancedSpanAttribute(spanId, key, value);
  });
}

// === SPAN UTILITIES ===
export function getActiveEnhancedSpans(): KBEnhancedSpan[] {
  return Array.from(activeSpans.values());
}

export function getCompletedEnhancedSpans(): KBEnhancedSpan[] {
  return [...completedSpans];
}

export function clearCompletedEnhancedSpans(): void {
  completedSpans.length = 0;
}

export function getSpanById(spanId: string): KBEnhancedSpan | undefined {
  return activeSpans.get(spanId) || completedSpans.find(s => s.spanId === spanId);
}

// === W3C TRACE CONTEXT PROPAGATION ===
export function serializeTraceparent(context: EnhancedTraceContext): string {
  const flags = context.traceFlags.toString(16).padStart(2, '0');
  return `00-${context.traceId}-${context.spanId}-${flags}`;
}

export function parseTraceparent(header: string): EnhancedTraceContext | null {
  const parts = header.split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, spanId, flags] = parts;
  if (version !== '00') return null;
  if (traceId.length !== 32 || spanId.length !== 16) return null;

  return {
    traceId,
    spanId: generateSpanId(), // Generate new span ID for this context
    parentSpanId: spanId, // The incoming span becomes parent
    traceFlags: parseInt(flags, 16),
    isRemote: true,
  };
}

export function injectW3CHeaders(headers: Headers | Record<string, string>): void {
  const context = currentContext;
  if (!context) return;

  const traceparent = serializeTraceparent(context);
  const baggage = serializeBaggage();

  if (headers instanceof Headers) {
    headers.set('traceparent', traceparent);
    if (context.traceState) {
      headers.set('tracestate', context.traceState);
    }
    if (baggage) {
      headers.set('baggage', baggage);
    }
  } else {
    headers['traceparent'] = traceparent;
    if (context.traceState) {
      headers['tracestate'] = context.traceState;
    }
    if (baggage) {
      headers['baggage'] = baggage;
    }
  }
}

export function extractW3CContext(headers: Headers | Record<string, string>): EnhancedTraceContext | null {
  const traceparent = headers instanceof Headers 
    ? headers.get('traceparent')
    : headers['traceparent'];

  if (!traceparent) return null;

  const context = parseTraceparent(traceparent);
  if (!context) return null;

  const tracestate = headers instanceof Headers
    ? headers.get('tracestate')
    : headers['tracestate'];

  if (tracestate) {
    context.traceState = tracestate;
  }

  const baggage = headers instanceof Headers
    ? headers.get('baggage')
    : headers['baggage'];

  if (baggage) {
    parseBaggage(baggage);
  }

  return context;
}

// === FETCH AUTO-INSTRUMENTATION ===
let originalFetch: typeof fetch | null = null;
let fetchInstrumentationEnabled = false;

export interface FetchInstrumentationConfig {
  propagateContext?: boolean;
  recordResponseSize?: boolean;
  recordRequestSize?: boolean;
  ignoreUrls?: (string | RegExp)[];
  enrichSpan?: (span: KBEnhancedSpan, request: Request, response?: Response) => void;
}

const defaultFetchConfig: FetchInstrumentationConfig = {
  propagateContext: true,
  recordResponseSize: true,
  recordRequestSize: true,
  ignoreUrls: [],
};

export function enableFetchInstrumentation(config: FetchInstrumentationConfig = {}): void {
  if (fetchInstrumentationEnabled) return;
  
  const finalConfig = { ...defaultFetchConfig, ...config };
  originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const url = request.url;

    // Check if URL should be ignored
    const shouldIgnore = finalConfig.ignoreUrls?.some(pattern => {
      if (typeof pattern === 'string') {
        return url.includes(pattern);
      }
      return pattern.test(url);
    });

    if (shouldIgnore || !originalFetch) {
      return originalFetch!(input, init);
    }

    const parsedUrl = new URL(url);
    const spanName = `HTTP ${request.method} ${parsedUrl.pathname}`;

    const span = startEnhancedSpan(spanName, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': request.method,
        'http.url': url,
        'http.host': parsedUrl.host,
        'http.scheme': parsedUrl.protocol.replace(':', ''),
        'http.target': parsedUrl.pathname + parsedUrl.search,
        'net.peer.name': parsedUrl.hostname,
        'net.peer.port': parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      },
    });

    // Inject context into headers
    if (finalConfig.propagateContext) {
      const headers = new Headers(init?.headers);
      injectW3CHeaders(headers);
      init = { ...init, headers };
    }

    // Record request size
    if (finalConfig.recordRequestSize && init?.body) {
      const bodySize = typeof init.body === 'string' 
        ? new Blob([init.body]).size 
        : init.body instanceof Blob 
          ? init.body.size 
          : 0;
      setEnhancedSpanAttribute(span.spanId, 'http.request_content_length', bodySize);
    }

    try {
      const response = await originalFetch(input, init);
      
      setEnhancedSpanAttribute(span.spanId, 'http.status_code', response.status);
      setEnhancedSpanAttribute(span.spanId, 'http.status_text', response.statusText);

      // Record response size
      if (finalConfig.recordResponseSize) {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          setEnhancedSpanAttribute(span.spanId, 'http.response_content_length', parseInt(contentLength, 10));
        }
      }

      // Custom enrichment
      if (finalConfig.enrichSpan) {
        finalConfig.enrichSpan(span, request, response);
      }

      const status = response.ok ? 'OK' : 'ERROR';
      endEnhancedSpan(span.spanId, status);

      return response;
    } catch (error) {
      setEnhancedSpanAttribute(span.spanId, 'error', true);
      setEnhancedSpanAttribute(span.spanId, 'error.type', (error as Error).name);
      setEnhancedSpanAttribute(span.spanId, 'error.message', (error as Error).message);
      endEnhancedSpan(span.spanId, 'ERROR', { statusMessage: (error as Error).message });
      throw error;
    }
  };

  fetchInstrumentationEnabled = true;
}

export function disableFetchInstrumentation(): void {
  if (!fetchInstrumentationEnabled || !originalFetch) return;
  globalThis.fetch = originalFetch;
  originalFetch = null;
  fetchInstrumentationEnabled = false;
}

export function isFetchInstrumentationEnabled(): boolean {
  return fetchInstrumentationEnabled;
}

// === ENHANCED EXPORTER ===
export interface EnhancedTelemetryExporter {
  export(spans: KBEnhancedSpan[]): Promise<ExportResult>;
  shutdown(): Promise<void>;
}

export enum ExportResult {
  SUCCESS = 0,
  FAILED = 1,
}

// === OTLP EXPORTER ===
export class OTLPExporter implements EnhancedTelemetryExporter {
  private endpoint: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(options: {
    endpoint: string;
    headers?: Record<string, string>;
    timeout?: number;
  }) {
    this.endpoint = options.endpoint;
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
  }

  async export(spans: KBEnhancedSpan[]): Promise<ExportResult> {
    if (spans.length === 0) return ExportResult.SUCCESS;

    const resourceSpans = this.formatOTLP(spans);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({ resourceSpans }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok ? ExportResult.SUCCESS : ExportResult.FAILED;
    } catch {
      clearTimeout(timeoutId);
      return ExportResult.FAILED;
    }
  }

  private formatOTLP(spans: KBEnhancedSpan[]): unknown[] {
    const grouped = new Map<string, KBEnhancedSpan[]>();

    // Group by resource
    for (const span of spans) {
      const resourceKey = JSON.stringify(span.resource);
      const group = grouped.get(resourceKey) || [];
      group.push(span);
      grouped.set(resourceKey, group);
    }

    return Array.from(grouped.entries()).map(([resourceKey, resourceSpans]) => {
      const resource = JSON.parse(resourceKey);
      
      // Group by instrumentation scope
      const scopeGroups = new Map<string, KBEnhancedSpan[]>();
      for (const span of resourceSpans) {
        const scopeKey = JSON.stringify(span.instrumentationScope);
        const group = scopeGroups.get(scopeKey) || [];
        group.push(span);
        scopeGroups.set(scopeKey, group);
      }

      return {
        resource: {
        attributes: Object.entries(resource).map(([key, value]) => ({
            key,
            value: this.formatAttributeValue(value as SpanAttributeValue),
          })),
        },
        scopeSpans: Array.from(scopeGroups.entries()).map(([scopeKey, scopeSpans]) => ({
          scope: JSON.parse(scopeKey),
          spans: scopeSpans.map(span => this.formatSpan(span)),
        })),
      };
    });
  }

  private formatSpan(span: KBEnhancedSpan): unknown {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      name: span.name,
      kind: this.spanKindToNumber(span.kind),
      startTimeUnixNano: span.startTime * 1000000,
      endTimeUnixNano: span.endTime ? span.endTime * 1000000 : undefined,
      attributes: Object.entries(span.attributes).map(([key, value]) => ({
        key,
        value: this.formatAttributeValue(value),
      })),
      events: span.events.map(event => ({
        name: event.name,
        timeUnixNano: event.timestamp * 1000000,
        attributes: event.attributes 
          ? Object.entries(event.attributes).map(([key, value]) => ({
              key,
              value: this.formatAttributeValue(value),
            }))
          : [],
      })),
      links: span.links.map(link => ({
        traceId: link.traceId,
        spanId: link.spanId,
        traceState: link.traceState,
        attributes: link.attributes
          ? Object.entries(link.attributes).map(([key, value]) => ({
              key,
              value: this.formatAttributeValue(value),
            }))
          : [],
      })),
      status: {
        code: span.status === 'ERROR' ? 2 : span.status === 'OK' ? 1 : 0,
        message: span.attributes['status.message'] as string | undefined,
      },
      droppedAttributesCount: span.droppedAttributesCount,
      droppedEventsCount: span.droppedEventsCount,
      droppedLinksCount: span.droppedLinksCount,
    };
  }

  private spanKindToNumber(kind: SpanKind): number {
    const mapping: Record<SpanKind, number> = {
      [SpanKind.INTERNAL]: 1,
      [SpanKind.SERVER]: 2,
      [SpanKind.CLIENT]: 3,
      [SpanKind.PRODUCER]: 4,
      [SpanKind.CONSUMER]: 5,
    };
    return mapping[kind] || 1;
  }

  private formatAttributeValue(value: SpanAttributeValue): unknown {
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') {
      return Number.isInteger(value) 
        ? { intValue: value } 
        : { doubleValue: value };
    }
    if (typeof value === 'boolean') return { boolValue: value };
    if (Array.isArray(value)) {
      if (value.length === 0) return { arrayValue: { values: [] } };
      const firstType = typeof value[0];
      if (firstType === 'string') {
        return { arrayValue: { values: value.map(v => ({ stringValue: v })) } };
      }
      if (firstType === 'number') {
        return { 
          arrayValue: { 
            values: value.map(v => 
              Number.isInteger(v) ? { intValue: v } : { doubleValue: v }
            ) 
          } 
        };
      }
      if (firstType === 'boolean') {
        return { arrayValue: { values: value.map(v => ({ boolValue: v })) } };
      }
    }
    return { stringValue: String(value) };
  }

  async shutdown(): Promise<void> {
    // Flush remaining spans if needed
  }
}

// === CONSOLE EXPORTER (ENHANCED) ===
export class EnhancedConsoleExporter implements EnhancedTelemetryExporter {
  private verbose: boolean;

  constructor(options?: { verbose?: boolean }) {
    this.verbose = options?.verbose ?? false;
  }

  async export(spans: KBEnhancedSpan[]): Promise<ExportResult> {
    for (const span of spans) {
      const duration = span.endTime ? span.endTime - span.startTime : 0;
      const status = span.status === 'ERROR' ? '❌' : span.status === 'OK' ? '✅' : '⏳';
      
      console.log(
        `${status} [${span.context.traceId.slice(0, 8)}:${span.spanId.slice(0, 8)}] ${span.name} (${duration}ms) [${span.kind}]`
      );

      if (this.verbose) {
        console.log('  Attributes:', span.attributes);
        if (span.events.length > 0) {
          console.log('  Events:', span.events);
        }
        if (span.links.length > 0) {
          console.log('  Links:', span.links);
        }
        if (span.droppedAttributesCount > 0 || span.droppedEventsCount > 0 || span.droppedLinksCount > 0) {
          console.log('  Dropped:', {
            attributes: span.droppedAttributesCount,
            events: span.droppedEventsCount,
            links: span.droppedLinksCount,
          });
        }
      }
    }
    return ExportResult.SUCCESS;
  }

  async shutdown(): Promise<void> {}
}

// === TELEMETRY PROVIDER (ENHANCED) ===
class EnhancedTelemetryProvider {
  private exporters: EnhancedTelemetryExporter[] = [];
  private autoExportInterval: ReturnType<typeof setInterval> | null = null;
  private isShutdown = false;

  addExporter(exporter: EnhancedTelemetryExporter): void {
    if (this.isShutdown) {
      console.warn('[EnhancedTelemetryProvider] Cannot add exporter after shutdown');
      return;
    }
    this.exporters.push(exporter);
  }

  removeExporter(exporter: EnhancedTelemetryExporter): void {
    const index = this.exporters.indexOf(exporter);
    if (index !== -1) {
      this.exporters.splice(index, 1);
    }
  }

  startAutoExport(intervalMs: number = 10000): void {
    if (this.autoExportInterval || this.isShutdown) return;

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
    const spans = getCompletedEnhancedSpans();
    if (spans.length === 0) return;

    const results = await Promise.all(
      this.exporters.map(exporter => exporter.export(spans))
    );

    // Only clear if all exporters succeeded
    if (results.every(r => r === ExportResult.SUCCESS)) {
      clearCompletedEnhancedSpans();
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShutdown) return;
    
    this.isShutdown = true;
    this.stopAutoExport();
    await this.exportCompletedSpans();
    await Promise.all(
      this.exporters.map(exporter => exporter.shutdown())
    );
    this.exporters = [];
  }
}

export const enhancedTelemetryProvider = new EnhancedTelemetryProvider();

// === CONVENIENCE FUNCTIONS ===
export function traceEnhanced<T>(
  name: string, 
  fn: () => T,
  options?: StartSpanOptions
): T {
  const span = startEnhancedSpan(name, options);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then((value) => {
          endEnhancedSpan(span.spanId, 'OK');
          return value;
        })
        .catch((error) => {
          endEnhancedSpan(span.spanId, 'ERROR', {
            attributes: { 'error.message': String(error) },
          });
          throw error;
        }) as T;
    }
    endEnhancedSpan(span.spanId, 'OK');
    return result;
  } catch (error) {
    endEnhancedSpan(span.spanId, 'ERROR', {
      attributes: { 'error.message': String(error) },
    });
    throw error;
  }
}

export async function traceAsyncEnhanced<T>(
  name: string,
  fn: () => Promise<T>,
  options?: StartSpanOptions
): Promise<T> {
  const span = startEnhancedSpan(name, options);
  try {
    const result = await fn();
    endEnhancedSpan(span.spanId, 'OK');
    return result;
  } catch (error) {
    endEnhancedSpan(span.spanId, 'ERROR', {
      attributes: { 'error.message': String(error) },
    });
    throw error;
  }
}

// === SPAN BUILDER PATTERN ===
export class SpanBuilder {
  private name: string;
  private options: StartSpanOptions = {};

  constructor(name: string) {
    this.name = name;
  }

  withKind(kind: SpanKind): this {
    this.options.kind = kind;
    return this;
  }

  withAttributes(attributes: Record<string, SpanAttributeValue>): this {
    this.options.attributes = { ...this.options.attributes, ...attributes };
    return this;
  }

  withLink(link: SpanLink): this {
    this.options.links = [...(this.options.links || []), link];
    return this;
  }

  withParent(context: EnhancedTraceContext): this {
    this.options.parentContext = context;
    return this;
  }

  withScope(scope: InstrumentationScope): this {
    this.options.scope = scope;
    return this;
  }

  start(): KBEnhancedSpan {
    return startEnhancedSpan(this.name, this.options);
  }

  async trace<T>(fn: () => Promise<T>): Promise<T> {
    return traceAsyncEnhanced(this.name, fn, this.options);
  }

  traceSync<T>(fn: () => T): T {
    return traceEnhanced(this.name, fn, this.options);
  }
}

export function span(name: string): SpanBuilder {
  return new SpanBuilder(name);
}

// === SEMANTIC CONVENTIONS ===
export const SemanticAttributes = {
  // HTTP
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_TARGET: 'http.target',
  HTTP_HOST: 'http.host',
  HTTP_SCHEME: 'http.scheme',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_REQUEST_CONTENT_LENGTH: 'http.request_content_length',
  HTTP_RESPONSE_CONTENT_LENGTH: 'http.response_content_length',
  
  // Database
  DB_SYSTEM: 'db.system',
  DB_NAME: 'db.name',
  DB_OPERATION: 'db.operation',
  DB_STATEMENT: 'db.statement',
  
  // Error
  EXCEPTION_TYPE: 'exception.type',
  EXCEPTION_MESSAGE: 'exception.message',
  EXCEPTION_STACKTRACE: 'exception.stacktrace',
  
  // Component
  COMPONENT_NAME: 'component.name',
  COMPONENT_TYPE: 'component.type',
  
  // User
  USER_ID: 'user.id',
  USER_ROLE: 'user.role',
  
  // Session
  SESSION_ID: 'session.id',
} as const;
