/**
 * KB 4.5 - useKBSpan Hook
 * React hook for manual OpenTelemetry tracing with full W3C support
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startEnhancedSpan,
  endEnhancedSpan,
  addEnhancedSpanEvent,
  setEnhancedSpanAttribute,
  setEnhancedSpanAttributes,
  addSpanLink,
  getCurrentContext,
  pushContext,
  popContext,
  createEnhancedContext,
  setBaggageEntry,
  getBaggageEntry,
  getAllBaggage,
  SpanKind,
  SpanLink,
  SpanAttributeValue,
  KBEnhancedSpan,
  SemanticAttributes,
  span as spanBuilder,
} from '@/lib/kbTelemetryEnhanced';

// === TYPES ===
export interface UseKBSpanOptions {
  /** Component or operation name for the root span */
  name: string;
  /** Whether to automatically start a span on mount */
  autoStart?: boolean;
  /** Whether to automatically end the span on unmount */
  autoEnd?: boolean;
  /** Span kind (INTERNAL, CLIENT, SERVER, etc.) */
  kind?: SpanKind;
  /** Initial attributes for the span */
  attributes?: Record<string, SpanAttributeValue>;
  /** Links to other spans */
  links?: SpanLink[];
  /** Track render count as events */
  trackRenders?: boolean;
  /** Track time to interactive */
  trackTTI?: boolean;
}

export interface SpanEventOptions {
  timestamp?: number;
  attributes?: Record<string, SpanAttributeValue>;
}

export interface UseKBSpanReturn {
  /** Current span (if started) */
  span: KBEnhancedSpan | null;
  /** Whether the span is active */
  isActive: boolean;
  /** Duration so far (ms) */
  duration: number;
  
  // Span lifecycle
  startSpan: (name?: string, options?: Partial<UseKBSpanOptions>) => KBEnhancedSpan;
  endSpan: (status?: 'OK' | 'ERROR', message?: string) => void;
  
  // Span manipulation
  addEvent: (name: string, options?: SpanEventOptions) => void;
  setAttribute: (key: string, value: SpanAttributeValue) => void;
  setAttributes: (attributes: Record<string, SpanAttributeValue>) => void;
  addLink: (link: SpanLink) => void;
  
  // Child spans
  startChildSpan: (name: string, options?: Partial<UseKBSpanOptions>) => KBEnhancedSpan;
  
  // Baggage
  setBaggage: (key: string, value: string, metadata?: string) => void;
  getBaggage: (key: string) => string | undefined;
  getAllBaggage: () => Map<string, { value: string; metadata?: string }>;
  
  // Tracing wrappers
  traceFunction: <T>(name: string, fn: () => T, attributes?: Record<string, SpanAttributeValue>) => T;
  traceAsync: <T>(name: string, fn: () => Promise<T>, attributes?: Record<string, SpanAttributeValue>) => Promise<T>;
  
  // Semantic attributes helper
  semantic: typeof SemanticAttributes;
  
  // Stats
  stats: {
    eventCount: number;
    childSpanCount: number;
    renderCount: number;
  };
}

// === HOOK IMPLEMENTATION ===
export function useKBSpan(options: UseKBSpanOptions): UseKBSpanReturn {
  const {
    name,
    autoStart = false,
    autoEnd = true,
    kind = SpanKind.INTERNAL,
    attributes = {},
    links = [],
    trackRenders = false,
    trackTTI = false,
  } = options;

  const [currentSpan, setCurrentSpan] = useState<KBEnhancedSpan | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [childSpanCount, setChildSpanCount] = useState(0);
  
  const renderCount = useRef(0);
  const childSpans = useRef<Set<string>>(new Set());
  const ttiMeasured = useRef(false);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Duration tracking
  useEffect(() => {
    if (isActive && currentSpan) {
      durationInterval.current = setInterval(() => {
        setDuration(Date.now() - currentSpan.startTime);
      }, 100);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isActive, currentSpan]);

  // Track renders
  useEffect(() => {
    if (trackRenders && currentSpan && isActive) {
      renderCount.current += 1;
      addEnhancedSpanEvent(currentSpan.spanId, 'component.render', {
        'render.count': renderCount.current,
      });
    }
  });

  // Track TTI
  useEffect(() => {
    if (trackTTI && currentSpan && isActive && !ttiMeasured.current) {
      const tti = performance.now();
      setEnhancedSpanAttribute(currentSpan.spanId, 'component.tti_ms', tti);
      addEnhancedSpanEvent(currentSpan.spanId, 'component.interactive', {
        'tti_ms': tti,
      });
      ttiMeasured.current = true;
    }
  }, [trackTTI, currentSpan, isActive]);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart) {
      startSpan();
    }

    return () => {
      if (autoEnd && currentSpan && isActive) {
        endSpan('OK');
      }
    };
  }, []); // Only on mount/unmount

  // === SPAN LIFECYCLE ===
  const startSpan = useCallback((
    spanName?: string,
    spanOptions?: Partial<UseKBSpanOptions>
  ): KBEnhancedSpan => {
    const finalName = spanName || name;
    const finalKind = spanOptions?.kind || kind;
    const finalAttributes = { ...attributes, ...spanOptions?.attributes };
    const finalLinks = [...links, ...(spanOptions?.links || [])];

    const newSpan = startEnhancedSpan(finalName, {
      kind: finalKind,
      attributes: {
        'component.name': finalName,
        ...finalAttributes,
      },
      links: finalLinks,
    });

    setCurrentSpan(newSpan);
    setIsActive(true);
    setDuration(0);
    setEventCount(0);
    renderCount.current = 0;
    ttiMeasured.current = false;

    return newSpan;
  }, [name, kind, attributes, links]);

  const endSpan = useCallback((
    status: 'OK' | 'ERROR' = 'OK',
    message?: string
  ): void => {
    if (!currentSpan || !isActive) return;

    // End all child spans first
    childSpans.current.forEach(childId => {
      endEnhancedSpan(childId, status);
    });
    childSpans.current.clear();

    // Add final attributes
    setEnhancedSpanAttribute(currentSpan.spanId, 'component.render_count', renderCount.current);
    setEnhancedSpanAttribute(currentSpan.spanId, 'component.event_count', eventCount);
    setEnhancedSpanAttribute(currentSpan.spanId, 'component.child_span_count', childSpanCount);

    endEnhancedSpan(currentSpan.spanId, status, {
      statusMessage: message,
    });

    setIsActive(false);
    setDuration(Date.now() - currentSpan.startTime);
  }, [currentSpan, isActive, eventCount, childSpanCount]);

  // === SPAN MANIPULATION ===
  const addEvent = useCallback((
    eventName: string,
    eventOptions?: SpanEventOptions
  ): void => {
    if (!currentSpan || !isActive) return;

    addEnhancedSpanEvent(
      currentSpan.spanId,
      eventName,
      eventOptions?.attributes,
      eventOptions?.timestamp
    );
    setEventCount(c => c + 1);
  }, [currentSpan, isActive]);

  const setAttribute = useCallback((
    key: string,
    value: SpanAttributeValue
  ): void => {
    if (!currentSpan || !isActive) return;
    setEnhancedSpanAttribute(currentSpan.spanId, key, value);
  }, [currentSpan, isActive]);

  const setAttributesWrapper = useCallback((
    attrs: Record<string, SpanAttributeValue>
  ): void => {
    if (!currentSpan || !isActive) return;
    setEnhancedSpanAttributes(currentSpan.spanId, attrs);
  }, [currentSpan, isActive]);

  const addLinkWrapper = useCallback((link: SpanLink): void => {
    if (!currentSpan || !isActive) return;
    addSpanLink(currentSpan.spanId, link);
  }, [currentSpan, isActive]);

  // === CHILD SPANS ===
  const startChildSpan = useCallback((
    childName: string,
    childOptions?: Partial<UseKBSpanOptions>
  ): KBEnhancedSpan => {
    const parentContext = getCurrentContext();
    
    const child = startEnhancedSpan(`${name}.${childName}`, {
      kind: childOptions?.kind || SpanKind.INTERNAL,
      attributes: {
        'parent.name': name,
        ...childOptions?.attributes,
      },
      links: childOptions?.links,
      parentContext: parentContext || undefined,
    });

    childSpans.current.add(child.spanId);
    setChildSpanCount(c => c + 1);

    return child;
  }, [name]);

  // === BAGGAGE ===
  const setBaggageWrapper = useCallback((
    key: string,
    value: string,
    metadata?: string
  ): void => {
    setBaggageEntry(key, value, metadata);
  }, []);

  const getBaggageWrapper = useCallback((key: string): string | undefined => {
    const entry = getBaggageEntry(key);
    return entry?.value;
  }, []);

  const getAllBaggageWrapper = useCallback(() => {
    return getAllBaggage();
  }, []);

  // === TRACING WRAPPERS ===
  const traceFunction = useCallback(<T>(
    fnName: string,
    fn: () => T,
    fnAttributes?: Record<string, SpanAttributeValue>
  ): T => {
    const childSpan = startChildSpan(fnName, { attributes: fnAttributes });

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then(value => {
            endEnhancedSpan(childSpan.spanId, 'OK');
            childSpans.current.delete(childSpan.spanId);
            return value;
          })
          .catch(error => {
            endEnhancedSpan(childSpan.spanId, 'ERROR', {
              statusMessage: String(error),
            });
            childSpans.current.delete(childSpan.spanId);
            throw error;
          }) as T;
      }

      endEnhancedSpan(childSpan.spanId, 'OK');
      childSpans.current.delete(childSpan.spanId);
      return result;
    } catch (error) {
      endEnhancedSpan(childSpan.spanId, 'ERROR', {
        statusMessage: String(error),
      });
      childSpans.current.delete(childSpan.spanId);
      throw error;
    }
  }, [startChildSpan]);

  const traceAsync = useCallback(async <T>(
    fnName: string,
    fn: () => Promise<T>,
    fnAttributes?: Record<string, SpanAttributeValue>
  ): Promise<T> => {
    const childSpan = startChildSpan(fnName, { attributes: fnAttributes });

    try {
      const result = await fn();
      endEnhancedSpan(childSpan.spanId, 'OK');
      childSpans.current.delete(childSpan.spanId);
      return result;
    } catch (error) {
      endEnhancedSpan(childSpan.spanId, 'ERROR', {
        statusMessage: String(error),
      });
      childSpans.current.delete(childSpan.spanId);
      throw error;
    }
  }, [startChildSpan]);

  return {
    span: currentSpan,
    isActive,
    duration,
    
    startSpan,
    endSpan,
    
    addEvent,
    setAttribute,
    setAttributes: setAttributesWrapper,
    addLink: addLinkWrapper,
    
    startChildSpan,
    
    setBaggage: setBaggageWrapper,
    getBaggage: getBaggageWrapper,
    getAllBaggage: getAllBaggageWrapper,
    
    traceFunction,
    traceAsync,
    
    semantic: SemanticAttributes,
    
    stats: {
      eventCount,
      childSpanCount,
      renderCount: renderCount.current,
    },
  };
}

// === COMPONENT TRACING HOOK ===
export interface UseComponentTracingOptions {
  componentName: string;
  trackMounts?: boolean;
  trackRenders?: boolean;
  trackInteractions?: boolean;
  attributes?: Record<string, SpanAttributeValue>;
}

export interface UseComponentTracingReturn {
  /** Trace a user interaction */
  traceInteraction: (interactionName: string, details?: Record<string, SpanAttributeValue>) => void;
  /** Trace a state change */
  traceStateChange: (stateName: string, oldValue: unknown, newValue: unknown) => void;
  /** Trace an effect */
  traceEffect: (effectName: string) => () => void;
  /** Record a component error */
  recordError: (error: Error, context?: Record<string, SpanAttributeValue>) => void;
  /** Get component trace ID */
  traceId: string | null;
}

export function useComponentTracing(options: UseComponentTracingOptions): UseComponentTracingReturn {
  const {
    componentName,
    trackMounts = true,
    trackRenders = false,
    trackInteractions = true,
    attributes = {},
  } = options;

  const mountSpan = useRef<KBEnhancedSpan | null>(null);
  const renderCount = useRef(0);

  // Track mounts
  useEffect(() => {
    if (!trackMounts) return;

    mountSpan.current = startEnhancedSpan(`component.lifecycle.${componentName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'component.name': componentName,
        'component.type': 'react',
        ...attributes,
      },
    });

    addEnhancedSpanEvent(mountSpan.current.spanId, 'component.mounted');

    return () => {
      if (mountSpan.current) {
        addEnhancedSpanEvent(mountSpan.current.spanId, 'component.unmounted', {
          'total_renders': renderCount.current,
        });
        endEnhancedSpan(mountSpan.current.spanId, 'OK');
        mountSpan.current = null;
      }
    };
  }, [componentName, trackMounts]);

  // Track renders
  useEffect(() => {
    if (!trackRenders || !mountSpan.current) return;

    renderCount.current += 1;
    addEnhancedSpanEvent(mountSpan.current.spanId, 'component.rendered', {
      'render.count': renderCount.current,
    });
  });

  const traceInteraction = useCallback((
    interactionName: string,
    details?: Record<string, SpanAttributeValue>
  ): void => {
    if (!trackInteractions) return;

    const interactionSpan = startEnhancedSpan(`interaction.${componentName}.${interactionName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'component.name': componentName,
        'interaction.name': interactionName,
        ...details,
      },
    });

    // Auto-end after a short delay (for simple interactions)
    setTimeout(() => {
      endEnhancedSpan(interactionSpan.spanId, 'OK');
    }, 100);
  }, [componentName, trackInteractions]);

  const traceStateChange = useCallback((
    stateName: string,
    oldValue: unknown,
    newValue: unknown
  ): void => {
    if (!mountSpan.current) return;

    addEnhancedSpanEvent(mountSpan.current.spanId, 'state.changed', {
      'state.name': stateName,
      'state.old_value': String(oldValue),
      'state.new_value': String(newValue),
    });
  }, []);

  const traceEffect = useCallback((effectName: string): (() => void) => {
    const effectSpan = startEnhancedSpan(`effect.${componentName}.${effectName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'component.name': componentName,
        'effect.name': effectName,
      },
    });

    return () => {
      endEnhancedSpan(effectSpan.spanId, 'OK');
    };
  }, [componentName]);

  const recordError = useCallback((
    error: Error,
    context?: Record<string, SpanAttributeValue>
  ): void => {
    if (mountSpan.current) {
      addEnhancedSpanEvent(mountSpan.current.spanId, 'exception', {
        [SemanticAttributes.EXCEPTION_TYPE]: error.name,
        [SemanticAttributes.EXCEPTION_MESSAGE]: error.message,
        [SemanticAttributes.EXCEPTION_STACKTRACE]: error.stack || '',
        ...context,
      });
    }
  }, []);

  return {
    traceInteraction,
    traceStateChange,
    traceEffect,
    recordError,
    traceId: mountSpan.current?.traceId || null,
  };
}

// === DATABASE OPERATION TRACING ===
export interface UseDBTracingOptions {
  system: string;
  dbName?: string;
}

export function useDBTracing(options: UseDBTracingOptions) {
  const { system, dbName } = options;

  const traceQuery = useCallback(async <T>(
    operation: string,
    statement: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const querySpan = startEnhancedSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        [SemanticAttributes.DB_SYSTEM]: system,
        [SemanticAttributes.DB_NAME]: dbName || 'unknown',
        [SemanticAttributes.DB_OPERATION]: operation,
        [SemanticAttributes.DB_STATEMENT]: statement,
      },
    });

    try {
      const result = await fn();
      endEnhancedSpan(querySpan.spanId, 'OK');
      return result;
    } catch (error) {
      endEnhancedSpan(querySpan.spanId, 'ERROR', {
        statusMessage: (error as Error).message,
        attributes: {
          [SemanticAttributes.EXCEPTION_MESSAGE]: (error as Error).message,
        },
      });
      throw error;
    }
  }, [system, dbName]);

  return { traceQuery };
}

// === HTTP REQUEST TRACING ===
export function useHTTPTracing() {
  const traceRequest = useCallback(async <T>(
    method: string,
    url: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const parsedUrl = new URL(url, window.location.origin);
    
    const requestSpan = startEnhancedSpan(`HTTP ${method}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        [SemanticAttributes.HTTP_METHOD]: method,
        [SemanticAttributes.HTTP_URL]: url,
        [SemanticAttributes.HTTP_HOST]: parsedUrl.host,
        [SemanticAttributes.HTTP_TARGET]: parsedUrl.pathname,
        [SemanticAttributes.HTTP_SCHEME]: parsedUrl.protocol.replace(':', ''),
      },
    });

    try {
      const result = await fn();
      endEnhancedSpan(requestSpan.spanId, 'OK');
      return result;
    } catch (error) {
      endEnhancedSpan(requestSpan.spanId, 'ERROR', {
        statusMessage: (error as Error).message,
      });
      throw error;
    }
  }, []);

  return { traceRequest };
}

// === EXPORTS ===
export {
  SpanKind,
  SemanticAttributes,
  spanBuilder as span,
};

export type {
  SpanLink,
  SpanAttributeValue,
  KBEnhancedSpan,
};
