/**
 * KB 4.5 - Query Batching & DataLoader
 * Fase 14 - Batching eficiente de requests
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBDataLoaderConfig<TKey, TValue> {
  batchFn: (keys: TKey[]) => Promise<Map<TKey, TValue> | TValue[]>;
  maxBatchSize?: number;
  batchDelay?: number;
  cache?: boolean;
  cacheMaxAge?: number;
  cacheMaxSize?: number;
}

export interface KBBatchedRequest<TKey, TValue> {
  key: TKey;
  resolve: (value: TValue) => void;
  reject: (error: Error) => void;
}

export interface KBDataLoaderStats {
  batchCount: number;
  loadCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageBatchSize: number;
}

// ============================================================================
// DATALOADER CLASS
// ============================================================================

class KBDataLoader<TKey, TValue> {
  private config: Required<KBDataLoaderConfig<TKey, TValue>>;
  private cache: Map<string, { value: TValue; timestamp: number }> = new Map();
  private pendingBatch: KBBatchedRequest<TKey, TValue>[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private stats: KBDataLoaderStats = {
    batchCount: 0,
    loadCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageBatchSize: 0,
  };

  constructor(config: KBDataLoaderConfig<TKey, TValue>) {
    this.config = {
      batchFn: config.batchFn,
      maxBatchSize: config.maxBatchSize ?? 100,
      batchDelay: config.batchDelay ?? 0,
      cache: config.cache ?? true,
      cacheMaxAge: config.cacheMaxAge ?? 60000,
      cacheMaxSize: config.cacheMaxSize ?? 1000,
    };
  }

  private getCacheKey(key: TKey): string {
    return typeof key === 'object' ? JSON.stringify(key) : String(key);
  }

  private getCachedValue(key: TKey): TValue | undefined {
    if (!this.config.cache) return undefined;

    const cacheKey = this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.config.cacheMaxAge) {
      this.cache.delete(cacheKey);
      return undefined;
    }

    this.stats.cacheHits++;
    return entry.value;
  }

  private setCachedValue(key: TKey, value: TValue): void {
    if (!this.config.cache) return;

    const cacheKey = this.getCacheKey(key);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.config.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, { value, timestamp: Date.now() });
  }

  async load(key: TKey): Promise<TValue> {
    this.stats.loadCount++;

    // Check cache first
    const cached = this.getCachedValue(key);
    if (cached !== undefined) {
      return cached;
    }

    this.stats.cacheMisses++;

    // Add to pending batch
    return new Promise<TValue>((resolve, reject) => {
      this.pendingBatch.push({ key, resolve, reject });

      // Schedule batch execution
      if (this.pendingBatch.length >= this.config.maxBatchSize) {
        this.executeBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.executeBatch();
        }, this.config.batchDelay);
      }
    });
  }

  async loadMany(keys: TKey[]): Promise<TValue[]> {
    return Promise.all(keys.map(key => this.load(key)));
  }

  private async executeBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.pendingBatch.length === 0) return;

    const batch = this.pendingBatch;
    this.pendingBatch = [];

    // Update stats
    this.stats.batchCount++;
    this.stats.averageBatchSize = 
      (this.stats.averageBatchSize * (this.stats.batchCount - 1) + batch.length) / 
      this.stats.batchCount;

    const keys = batch.map(req => req.key);

    try {
      const result = await this.config.batchFn(keys);

      // Handle Map result
      if (result instanceof Map) {
        for (const request of batch) {
          const value = result.get(request.key);
          if (value !== undefined) {
            this.setCachedValue(request.key, value);
            request.resolve(value);
          } else {
            request.reject(new Error(`No value for key: ${String(request.key)}`));
          }
        }
      } 
      // Handle array result (assumes same order as keys)
      else if (Array.isArray(result)) {
        for (let i = 0; i < batch.length; i++) {
          const request = batch[i];
          const value = result[i];
          if (value !== undefined) {
            this.setCachedValue(request.key, value);
            request.resolve(value);
          } else {
            request.reject(new Error(`No value for key: ${String(request.key)}`));
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      for (const request of batch) {
        request.reject(err);
      }
    }
  }

  prime(key: TKey, value: TValue): void {
    this.setCachedValue(key, value);
  }

  clear(key?: TKey): void {
    if (key !== undefined) {
      this.cache.delete(this.getCacheKey(key));
    } else {
      this.cache.clear();
    }
  }

  getStats(): KBDataLoaderStats {
    return { ...this.stats };
  }
}

// ============================================================================
// DATALOADER HOOK
// ============================================================================

/**
 * Hook para DataLoader (batching automático de requests)
 */
export function useKBDataLoader<TKey, TValue>(
  config: KBDataLoaderConfig<TKey, TValue>
): {
  load: (key: TKey) => Promise<TValue>;
  loadMany: (keys: TKey[]) => Promise<TValue[]>;
  prime: (key: TKey, value: TValue) => void;
  clear: (key?: TKey) => void;
  stats: KBDataLoaderStats;
} {
  const loaderRef = useRef<KBDataLoader<TKey, TValue> | null>(null);
  const [stats, setStats] = useState<KBDataLoaderStats>({
    batchCount: 0,
    loadCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageBatchSize: 0,
  });

  if (!loaderRef.current) {
    loaderRef.current = new KBDataLoader(config);
  }

  const load = useCallback(async (key: TKey): Promise<TValue> => {
    const result = await loaderRef.current!.load(key);
    setStats(loaderRef.current!.getStats());
    return result;
  }, []);

  const loadMany = useCallback(async (keys: TKey[]): Promise<TValue[]> => {
    const result = await loaderRef.current!.loadMany(keys);
    setStats(loaderRef.current!.getStats());
    return result;
  }, []);

  const prime = useCallback((key: TKey, value: TValue) => {
    loaderRef.current!.prime(key, value);
  }, []);

  const clear = useCallback((key?: TKey) => {
    loaderRef.current!.clear(key);
  }, []);

  return { load, loadMany, prime, clear, stats };
}

// ============================================================================
// QUERY BATCHER
// ============================================================================

export interface KBQueryBatcherConfig<TQuery, TResult> {
  executeFn: (queries: TQuery[]) => Promise<TResult[]>;
  maxBatchSize?: number;
  batchWindow?: number;
  deduplicateQueries?: boolean;
  getQueryKey?: (query: TQuery) => string;
}

interface PendingQuery<TQuery, TResult> {
  query: TQuery;
  key: string;
  resolve: (result: TResult) => void;
  reject: (error: Error) => void;
}

/**
 * Hook para batching de queries arbitrarias
 */
export function useKBQueryBatcher<TQuery, TResult>(
  config: KBQueryBatcherConfig<TQuery, TResult>
): {
  execute: (query: TQuery) => Promise<TResult>;
  executeMany: (queries: TQuery[]) => Promise<TResult[]>;
  flush: () => Promise<void>;
  pendingCount: number;
} {
  const {
    executeFn,
    maxBatchSize = 50,
    batchWindow = 10,
    deduplicateQueries = true,
    getQueryKey = (q) => JSON.stringify(q),
  } = config;

  const pendingRef = useRef<PendingQuery<TQuery, TResult>[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (pendingRef.current.length === 0) return;

    const pending = pendingRef.current;
    pendingRef.current = [];
    setPendingCount(0);

    // Deduplicate if enabled
    let queriesToExecute: TQuery[];
    let queryMap: Map<string, PendingQuery<TQuery, TResult>[]>;

    if (deduplicateQueries) {
      queryMap = new Map();
      for (const p of pending) {
        if (!queryMap.has(p.key)) {
          queryMap.set(p.key, []);
        }
        queryMap.get(p.key)!.push(p);
      }
      queriesToExecute = Array.from(queryMap.entries()).map(([_, items]) => items[0].query);
    } else {
      queriesToExecute = pending.map(p => p.query);
      queryMap = new Map(pending.map(p => [p.key, [p]]));
    }

    try {
      const results = await executeFn(queriesToExecute);

      // Map results back to pending requests
      let resultIndex = 0;
      for (const [key, requests] of queryMap) {
        const result = results[resultIndex++];
        for (const request of requests) {
          request.resolve(result);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      for (const request of pending) {
        request.reject(err);
      }
    }
  }, [executeFn, deduplicateQueries]);

  const scheduleBatch = useCallback(() => {
    if (pendingRef.current.length >= maxBatchSize) {
      flush();
    } else if (!timerRef.current) {
      timerRef.current = setTimeout(flush, batchWindow);
    }
  }, [maxBatchSize, batchWindow, flush]);

  const execute = useCallback((query: TQuery): Promise<TResult> => {
    return new Promise((resolve, reject) => {
      const key = getQueryKey(query);
      pendingRef.current.push({ query, key, resolve, reject });
      setPendingCount(pendingRef.current.length);
      scheduleBatch();
    });
  }, [getQueryKey, scheduleBatch]);

  const executeMany = useCallback((queries: TQuery[]): Promise<TResult[]> => {
    return Promise.all(queries.map(execute));
  }, [execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { execute, executeMany, flush, pendingCount };
}

// ============================================================================
// REQUEST DEDUPLICATOR
// ============================================================================

export interface KBRequestDeduplicatorConfig<TKey, TValue> {
  keyFn: (request: TKey) => string;
  ttl?: number;
}

/**
 * Hook para deduplicación de requests en vuelo
 */
export function useKBRequestDeduplicator<TKey, TValue>(
  config: KBRequestDeduplicatorConfig<TKey, TValue>
): {
  dedupe: (key: TKey, fn: () => Promise<TValue>) => Promise<TValue>;
  clear: (key?: string) => void;
  inflight: number;
} {
  const { keyFn, ttl = 0 } = config;

  const inflightRef = useRef<Map<string, { promise: Promise<TValue>; timestamp: number }>>(new Map());
  const [inflight, setInflight] = useState(0);

  const dedupe = useCallback(async (key: TKey, fn: () => Promise<TValue>): Promise<TValue> => {
    const cacheKey = keyFn(key);
    const existing = inflightRef.current.get(cacheKey);

    // Check if request is in-flight and not expired
    if (existing) {
      if (ttl === 0 || Date.now() - existing.timestamp < ttl) {
        return existing.promise;
      }
    }

    // Execute new request
    const promise = fn().finally(() => {
      // Remove from in-flight after completion (with optional TTL delay)
      if (ttl > 0) {
        setTimeout(() => {
          inflightRef.current.delete(cacheKey);
          setInflight(inflightRef.current.size);
        }, ttl);
      } else {
        inflightRef.current.delete(cacheKey);
        setInflight(inflightRef.current.size);
      }
    });

    inflightRef.current.set(cacheKey, { promise, timestamp: Date.now() });
    setInflight(inflightRef.current.size);

    return promise;
  }, [keyFn, ttl]);

  const clear = useCallback((key?: string) => {
    if (key) {
      inflightRef.current.delete(key);
    } else {
      inflightRef.current.clear();
    }
    setInflight(inflightRef.current.size);
  }, []);

  return { dedupe, clear, inflight };
}

// ============================================================================
// AGGREGATE LOADER
// ============================================================================

export interface KBAggregateLoaderConfig<TKey, TValue> {
  loaders: Record<string, KBDataLoaderConfig<TKey, TValue>>;
}

/**
 * Hook para múltiples DataLoaders agregados
 */
export function useKBAggregateLoader<TKey, TValue>(
  config: KBAggregateLoaderConfig<TKey, TValue>
): {
  load: (loaderName: string, key: TKey) => Promise<TValue>;
  loadMany: (loaderName: string, keys: TKey[]) => Promise<TValue[]>;
  loadFromAll: (key: TKey) => Promise<Record<string, TValue>>;
  clear: (loaderName?: string, key?: TKey) => void;
} {
  const loadersRef = useRef<Map<string, KBDataLoader<TKey, TValue>>>(new Map());

  // Initialize loaders
  useMemo(() => {
    for (const [name, loaderConfig] of Object.entries(config.loaders)) {
      if (!loadersRef.current.has(name)) {
        loadersRef.current.set(name, new KBDataLoader(loaderConfig));
      }
    }
  }, [config.loaders]);

  const load = useCallback(async (loaderName: string, key: TKey): Promise<TValue> => {
    const loader = loadersRef.current.get(loaderName);
    if (!loader) {
      throw new Error(`Loader "${loaderName}" not found`);
    }
    return loader.load(key);
  }, []);

  const loadMany = useCallback(async (loaderName: string, keys: TKey[]): Promise<TValue[]> => {
    const loader = loadersRef.current.get(loaderName);
    if (!loader) {
      throw new Error(`Loader "${loaderName}" not found`);
    }
    return loader.loadMany(keys);
  }, []);

  const loadFromAll = useCallback(async (key: TKey): Promise<Record<string, TValue>> => {
    const results: Record<string, TValue> = {};
    const promises = Array.from(loadersRef.current.entries()).map(
      async ([name, loader]) => {
        try {
          results[name] = await loader.load(key);
        } catch {
          // Ignore errors for individual loaders
        }
      }
    );
    await Promise.all(promises);
    return results;
  }, []);

  const clear = useCallback((loaderName?: string, key?: TKey) => {
    if (loaderName) {
      loadersRef.current.get(loaderName)?.clear(key);
    } else {
      for (const loader of loadersRef.current.values()) {
        loader.clear(key);
      }
    }
  }, []);

  return { load, loadMany, loadFromAll, clear };
}

// ============================================================================
// PRIORITY QUEUE LOADER
// ============================================================================

export interface KBPriorityItem<TKey> {
  key: TKey;
  priority: number;
}

/**
 * Hook para carga con prioridad
 */
export function useKBPriorityLoader<TKey, TValue>(
  loadFn: (key: TKey) => Promise<TValue>,
  options: {
    concurrency?: number;
    retries?: number;
  } = {}
): {
  load: (key: TKey, priority?: number) => Promise<TValue>;
  cancel: (key: TKey) => void;
  clear: () => void;
  queueSize: number;
} {
  const { concurrency = 3, retries = 2 } = options;

  type QueueItem = {
    key: TKey;
    priority: number;
    resolve: (value: TValue) => void;
    reject: (error: Error) => void;
    retries: number;
  };

  const queueRef = useRef<QueueItem[]>([]);
  const activeRef = useRef<Set<string>>(new Set());
  const cancelledRef = useRef<Set<string>>(new Set());
  const [queueSize, setQueueSize] = useState(0);

  const getKeyString = (key: TKey): string => 
    typeof key === 'object' ? JSON.stringify(key) : String(key);

  const processQueue = useCallback(async () => {
    while (
      queueRef.current.length > 0 && 
      activeRef.current.size < concurrency
    ) {
      // Sort by priority (higher = more important)
      queueRef.current.sort((a, b) => b.priority - a.priority);
      
      const item = queueRef.current.shift();
      if (!item) break;

      const keyString = getKeyString(item.key);
      
      // Skip if cancelled
      if (cancelledRef.current.has(keyString)) {
        cancelledRef.current.delete(keyString);
        continue;
      }

      activeRef.current.add(keyString);
      setQueueSize(queueRef.current.length);

      try {
        const result = await loadFn(item.key);
        activeRef.current.delete(keyString);
        item.resolve(result);
      } catch (error) {
        activeRef.current.delete(keyString);
        
        if (item.retries > 0) {
          // Re-queue with decremented retry count
          queueRef.current.push({ ...item, retries: item.retries - 1 });
        } else {
          item.reject(error instanceof Error ? error : new Error(String(error)));
        }
      }

      setQueueSize(queueRef.current.length);
      
      // Continue processing
      processQueue();
    }
  }, [loadFn, concurrency]);

  const load = useCallback((key: TKey, priority: number = 0): Promise<TValue> => {
    return new Promise((resolve, reject) => {
      queueRef.current.push({ key, priority, resolve, reject, retries });
      setQueueSize(queueRef.current.length);
      processQueue();
    });
  }, [processQueue, retries]);

  const cancel = useCallback((key: TKey) => {
    const keyString = getKeyString(key);
    cancelledRef.current.add(keyString);
    queueRef.current = queueRef.current.filter(
      item => getKeyString(item.key) !== keyString
    );
    setQueueSize(queueRef.current.length);
  }, []);

  const clear = useCallback(() => {
    for (const item of queueRef.current) {
      item.reject(new Error('Queue cleared'));
    }
    queueRef.current = [];
    cancelledRef.current.clear();
    setQueueSize(0);
  }, []);

  return { load, cancel, clear, queueSize };
}

export default useKBDataLoader;
