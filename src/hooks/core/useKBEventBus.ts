/**
 * KB 4.5 - Event Bus Pattern
 * Phase 19: Advanced State & Communication
 * 
 * Features:
 * - Type-safe event system
 * - Event namespaces
 * - Wildcards & patterns
 * - Event history & replay
 * - Priority queuing
 * - Dead letter queue
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

export interface EventMetadata {
  id: string;
  timestamp: number;
  source: string;
  priority: EventPriority;
  correlationId?: string;
  causationId?: string;
  version?: number;
  ttl?: number;
  retryCount?: number;
  tags?: string[];
}

export interface BusEvent<T = unknown> {
  type: string;
  payload: T;
  metadata: EventMetadata;
}

export interface EventSubscription {
  id: string;
  pattern: string;
  handler: EventHandler<unknown>;
  options: SubscriptionOptions;
  createdAt: number;
}

export interface SubscriptionOptions {
  priority?: EventPriority;
  once?: boolean;
  filter?: (event: BusEvent<unknown>) => boolean;
  transform?: (event: BusEvent<unknown>) => BusEvent<unknown>;
  debounce?: number;
  throttle?: number;
  maxRetries?: number;
  timeout?: number;
}

export type EventHandler<T> = (event: BusEvent<T>) => void | Promise<void>;

export interface EventBusConfig {
  maxHistorySize?: number;
  enableDeadLetter?: boolean;
  maxDeadLetterSize?: number;
  defaultTTL?: number;
  enablePersistence?: boolean;
  persistenceKey?: string;
  enableMetrics?: boolean;
  onError?: (error: Error, event: BusEvent<unknown>) => void;
}

export interface DeadLetterEntry {
  event: BusEvent<unknown>;
  error: Error;
  failedAt: number;
  retryCount: number;
}

export interface EventBusMetrics {
  totalPublished: number;
  totalDelivered: number;
  totalFailed: number;
  activeSubscriptions: number;
  deadLetterCount: number;
  eventsByType: Map<string, number>;
  avgProcessingTime: number;
}

// =============================================================================
// UTILITIES
// =============================================================================

const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const matchPattern = (pattern: string, type: string): boolean => {
  if (pattern === '*') return true;
  if (pattern === type) return true;
  
  // Handle wildcards
  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
  );
  return regex.test(type);
};

const createDebounced = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

const createThrottled = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T => {
  let lastCall = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
};

// =============================================================================
// GLOBAL EVENT BUS
// =============================================================================

class EventBus {
  private subscriptions = new Map<string, EventSubscription>();
  private history: BusEvent<unknown>[] = [];
  private deadLetter: DeadLetterEntry[] = [];
  private config: Required<EventBusConfig>;
  private metrics: EventBusMetrics;
  private processingTimes: number[] = [];

  constructor(config: EventBusConfig = {}) {
    this.config = {
      maxHistorySize: config.maxHistorySize ?? 1000,
      enableDeadLetter: config.enableDeadLetter ?? true,
      maxDeadLetterSize: config.maxDeadLetterSize ?? 100,
      defaultTTL: config.defaultTTL ?? 0,
      enablePersistence: config.enablePersistence ?? false,
      persistenceKey: config.persistenceKey ?? 'kb_event_bus',
      enableMetrics: config.enableMetrics ?? true,
      onError: config.onError ?? console.error,
    };

    this.metrics = {
      totalPublished: 0,
      totalDelivered: 0,
      totalFailed: 0,
      activeSubscriptions: 0,
      deadLetterCount: 0,
      eventsByType: new Map(),
      avgProcessingTime: 0,
    };

    this.loadFromPersistence();
  }

  private loadFromPersistence(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const stored = localStorage.getItem(this.config.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.history = data.history || [];
        this.deadLetter = data.deadLetter || [];
      }
    } catch (e) {
      console.warn('Failed to load event bus state:', e);
    }
  }

  private saveToPersistence(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      localStorage.setItem(this.config.persistenceKey, JSON.stringify({
        history: this.history.slice(-100),
        deadLetter: this.deadLetter,
      }));
    } catch (e) {
      console.warn('Failed to save event bus state:', e);
    }
  }

  subscribe<T>(
    pattern: string,
    handler: EventHandler<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const id = generateEventId();
    
    let wrappedHandler = handler as EventHandler<unknown>;
    
    // Apply debounce
    if (options.debounce) {
      wrappedHandler = createDebounced(wrappedHandler, options.debounce);
    }
    
    // Apply throttle
    if (options.throttle) {
      wrappedHandler = createThrottled(wrappedHandler, options.throttle);
    }

    const subscription: EventSubscription = {
      id,
      pattern,
      handler: wrappedHandler,
      options,
      createdAt: Date.now(),
    };

    this.subscriptions.set(id, subscription);
    this.metrics.activeSubscriptions = this.subscriptions.size;

    return () => {
      this.subscriptions.delete(id);
      this.metrics.activeSubscriptions = this.subscriptions.size;
    };
  }

  async publish<T>(
    type: string,
    payload: T,
    options: Partial<EventMetadata> = {}
  ): Promise<void> {
    const startTime = performance.now();
    
    const event: BusEvent<T> = {
      type,
      payload,
      metadata: {
        id: options.id || generateEventId(),
        timestamp: Date.now(),
        source: options.source || 'unknown',
        priority: options.priority || 'normal',
        correlationId: options.correlationId,
        causationId: options.causationId,
        version: options.version || 1,
        ttl: options.ttl || this.config.defaultTTL,
        retryCount: options.retryCount || 0,
        tags: options.tags,
      },
    };

    // Add to history
    this.history.push(event as BusEvent<unknown>);
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }

    // Update metrics
    this.metrics.totalPublished++;
    const typeCount = this.metrics.eventsByType.get(type) || 0;
    this.metrics.eventsByType.set(type, typeCount + 1);

    // Process subscriptions by priority
    const subscriptionsByPriority = this.getSubscriptionsByPriority(type);
    
    for (const subscription of subscriptionsByPriority) {
      try {
        // Apply filter
        if (subscription.options.filter && !subscription.options.filter(event as BusEvent<unknown>)) {
          continue;
        }

        // Apply transform
        let eventToProcess = event as BusEvent<unknown>;
        if (subscription.options.transform) {
          eventToProcess = subscription.options.transform(eventToProcess);
        }

        // Execute handler with timeout
        if (subscription.options.timeout) {
          await Promise.race([
            subscription.handler(eventToProcess),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Handler timeout')), subscription.options.timeout)
            ),
          ]);
        } else {
          await subscription.handler(eventToProcess);
        }

        this.metrics.totalDelivered++;

        // Remove if once
        if (subscription.options.once) {
          this.subscriptions.delete(subscription.id);
          this.metrics.activeSubscriptions = this.subscriptions.size;
        }
      } catch (error) {
        this.handleError(error as Error, event as BusEvent<unknown>, subscription);
      }
    }

    // Track processing time
    const processingTime = performance.now() - startTime;
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    this.metrics.avgProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;

    this.saveToPersistence();
  }

  private getSubscriptionsByPriority(type: string): EventSubscription[] {
    const matching: EventSubscription[] = [];
    
    this.subscriptions.forEach(sub => {
      if (matchPattern(sub.pattern, type)) {
        matching.push(sub);
      }
    });

    const priorityOrder: Record<EventPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    return matching.sort((a, b) => 
      (priorityOrder[a.options.priority || 'normal'] || 2) - 
      (priorityOrder[b.options.priority || 'normal'] || 2)
    );
  }

  private handleError(
    error: Error,
    event: BusEvent<unknown>,
    subscription: EventSubscription
  ): void {
    this.metrics.totalFailed++;
    this.config.onError(error, event);

    if (this.config.enableDeadLetter) {
      const entry: DeadLetterEntry = {
        event,
        error,
        failedAt: Date.now(),
        retryCount: event.metadata.retryCount || 0,
      };

      this.deadLetter.push(entry);
      if (this.deadLetter.length > this.config.maxDeadLetterSize) {
        this.deadLetter.shift();
      }
      this.metrics.deadLetterCount = this.deadLetter.length;
    }

    // Retry if configured
    if (
      subscription.options.maxRetries &&
      (event.metadata.retryCount || 0) < subscription.options.maxRetries
    ) {
      setTimeout(() => {
        this.publish(event.type, event.payload, {
          ...event.metadata,
          retryCount: (event.metadata.retryCount || 0) + 1,
        });
      }, Math.pow(2, event.metadata.retryCount || 0) * 1000);
    }
  }

  replay(
    filter?: (event: BusEvent<unknown>) => boolean,
    fromTimestamp?: number
  ): void {
    const events = this.history.filter(event => {
      if (fromTimestamp && event.metadata.timestamp < fromTimestamp) return false;
      if (filter && !filter(event)) return false;
      return true;
    });

    events.forEach(event => {
      this.publish(event.type, event.payload, {
        ...event.metadata,
        id: generateEventId(), // New ID for replay
      });
    });
  }

  getHistory(): BusEvent<unknown>[] {
    return [...this.history];
  }

  getDeadLetter(): DeadLetterEntry[] {
    return [...this.deadLetter];
  }

  retryDeadLetter(entryIndex: number): void {
    const entry = this.deadLetter[entryIndex];
    if (entry) {
      this.deadLetter.splice(entryIndex, 1);
      this.metrics.deadLetterCount = this.deadLetter.length;
      this.publish(entry.event.type, entry.event.payload, entry.event.metadata);
    }
  }

  clearDeadLetter(): void {
    this.deadLetter = [];
    this.metrics.deadLetterCount = 0;
    this.saveToPersistence();
  }

  getMetrics(): EventBusMetrics {
    return { ...this.metrics };
  }

  clear(): void {
    this.history = [];
    this.deadLetter = [];
    this.metrics = {
      totalPublished: 0,
      totalDelivered: 0,
      totalFailed: 0,
      activeSubscriptions: this.subscriptions.size,
      deadLetterCount: 0,
      eventsByType: new Map(),
      avgProcessingTime: 0,
    };
    this.saveToPersistence();
  }
}

// Global instance
let globalEventBus: EventBus | null = null;

export const getEventBus = (config?: EventBusConfig): EventBus => {
  if (!globalEventBus) {
    globalEventBus = new EventBus(config);
  }
  return globalEventBus;
};

export const resetEventBus = (): void => {
  globalEventBus = null;
};

// =============================================================================
// HOOKS
// =============================================================================

export function useKBEventBus(config?: EventBusConfig) {
  const bus = useMemo(() => getEventBus(config), []);
  const [metrics, setMetrics] = useState<EventBusMetrics>(bus.getMetrics());

  const publish = useCallback(<T>(
    type: string,
    payload: T,
    options?: Partial<EventMetadata>
  ) => {
    return bus.publish(type, payload, options);
  }, [bus]);

  const subscribe = useCallback(<T>(
    pattern: string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions
  ) => {
    return bus.subscribe(pattern, handler, options);
  }, [bus]);

  const replay = useCallback((
    filter?: (event: BusEvent<unknown>) => boolean,
    fromTimestamp?: number
  ) => {
    bus.replay(filter, fromTimestamp);
  }, [bus]);

  const refreshMetrics = useCallback(() => {
    setMetrics(bus.getMetrics());
  }, [bus]);

  // Auto-refresh metrics
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 5000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return {
    publish,
    subscribe,
    replay,
    getHistory: () => bus.getHistory(),
    getDeadLetter: () => bus.getDeadLetter(),
    retryDeadLetter: (index: number) => bus.retryDeadLetter(index),
    clearDeadLetter: () => bus.clearDeadLetter(),
    metrics,
    refreshMetrics,
    clear: () => bus.clear(),
  };
}

export function useKBEventSubscription<T>(
  pattern: string,
  handler: EventHandler<T>,
  options?: SubscriptionOptions,
  deps: React.DependencyList = []
) {
  const bus = getEventBus();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = bus.subscribe(
      pattern,
      (event) => handlerRef.current(event as BusEvent<T>),
      options
    );
    return unsubscribe;
  }, [pattern, ...deps]);
}

export function useKBEventEmitter<T>(type: string, source?: string) {
  const bus = getEventBus();
  const correlationIdRef = useRef(generateEventId());

  const emit = useCallback((payload: T, options?: Partial<EventMetadata>) => {
    return bus.publish(type, payload, {
      source: source || 'hook',
      correlationId: correlationIdRef.current,
      ...options,
    });
  }, [type, source, bus]);

  const emitWithCausation = useCallback((
    payload: T,
    causationId: string,
    options?: Partial<EventMetadata>
  ) => {
    return bus.publish(type, payload, {
      source: source || 'hook',
      correlationId: correlationIdRef.current,
      causationId,
      ...options,
    });
  }, [type, source, bus]);

  return { emit, emitWithCausation };
}

export default useKBEventBus;
