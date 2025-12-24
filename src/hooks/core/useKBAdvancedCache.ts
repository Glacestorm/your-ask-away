/**
 * KB 4.5 Advanced Cache Strategies
 * LRU, dynamic TTL, cache warming, prefetching
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { KBCacheConfig, KBCacheEntry } from './types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LRUCacheConfig {
  /** Maximum number of entries */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTtl?: number;
  /** Enable persistence to localStorage */
  persist?: boolean;
  /** Storage key prefix */
  storagePrefix?: string;
  /** Callback when entry is evicted */
  onEvict?: (key: string, value: unknown) => void;
}

export interface DynamicTTLConfig {
  /** Base TTL in milliseconds */
  baseTtl: number;
  /** Minimum TTL in milliseconds */
  minTtl: number;
  /** Maximum TTL in milliseconds */
  maxTtl: number;
  /** TTL calculation strategy */
  strategy: 'access-frequency' | 'data-volatility' | 'size-based' | 'custom';
  /** Custom TTL calculator */
  customCalculator?: (key: string, value: unknown, metadata: CacheMetadata) => number;
}

export interface CacheMetadata {
  accessCount: number;
  lastAccess: number;
  createdAt: number;
  size: number;
  hitRate: number;
}

export interface CacheWarmingConfig {
  /** Keys to warm on initialization */
  initialKeys?: string[];
  /** Fetcher function for warming */
  fetcher: (key: string) => Promise<unknown>;
  /** Warm in background */
  background?: boolean;
  /** Warming concurrency limit */
  concurrency?: number;
  /** Priority order for warming */
  priority?: 'sequential' | 'parallel' | 'priority-based';
}

export interface PrefetchConfig {
  /** Prefetch threshold (0-1) - when to trigger prefetch */
  threshold?: number;
  /** Keys to prefetch */
  keys?: string[];
  /** Prefetch on mount */
  prefetchOnMount?: boolean;
  /** Prefetch on hover */
  prefetchOnHover?: boolean;
  /** Prefetch debounce in ms */
  debounceMs?: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  avgAccessTime: number;
  memoryUsage: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUNode<T> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  prev: LRUNode<T> | null = null;
  next: LRUNode<T> | null = null;

  constructor(key: string, value: T, ttl: number) {
    this.key = key;
    this.value = value;
    this.ttl = ttl;
    this.createdAt = Date.now();
    this.accessCount = 0;
  }

  isExpired(): boolean {
    return Date.now() > this.createdAt + this.ttl;
  }
}

export class LRUCache<T = unknown> {
  private capacity: number;
  private cache: Map<string, LRUNode<T>> = new Map();
  private head: LRUNode<T> | null = null;
  private tail: LRUNode<T> | null = null;
  private config: LRUCacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(config: LRUCacheConfig) {
    this.capacity = config.maxSize;
    this.config = config;
    
    if (config.persist) {
      this.loadFromStorage();
    }
  }

  private moveToHead(node: LRUNode<T>): void {
    if (node === this.head) return;

    // Remove from current position
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.tail) this.tail = node.prev;

    // Move to head
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private removeTail(): LRUNode<T> | null {
    if (!this.tail) return null;

    const removed = this.tail;
    if (this.tail.prev) {
      this.tail.prev.next = null;
      this.tail = this.tail.prev;
    } else {
      this.head = null;
      this.tail = null;
    }

    this.cache.delete(removed.key);
    this.stats.evictions++;
    this.config.onEvict?.(removed.key, removed.value);

    return removed;
  }

  get(key: string): T | null {
    const node = this.cache.get(key);
    
    if (!node) {
      this.stats.misses++;
      return null;
    }

    if (node.isExpired()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    node.accessCount++;
    this.moveToHead(node);
    this.stats.hits++;
    
    return node.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const existingNode = this.cache.get(key);
    const nodeTtl = ttl || this.config.defaultTtl || 300000; // 5 min default

    if (existingNode) {
      existingNode.value = value;
      existingNode.ttl = nodeTtl;
      existingNode.createdAt = Date.now();
      this.moveToHead(existingNode);
      return;
    }

    const newNode = new LRUNode(key, value, nodeTtl);

    if (this.cache.size >= this.capacity) {
      this.removeTail();
    }

    this.cache.set(key, newNode);
    newNode.next = this.head;
    if (this.head) this.head.prev = newNode;
    this.head = newNode;
    if (!this.tail) this.tail = newNode;

    if (this.config.persist) {
      this.saveToStorage();
    }
  }

  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;

    this.cache.delete(key);
    
    if (this.config.persist) {
      this.saveToStorage();
    }

    return true;
  }

  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    if (node.isExpired()) {
      this.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats = { hits: 0, misses: 0, evictions: 0 };

    if (this.config.persist) {
      localStorage.removeItem(`${this.config.storagePrefix}_lru_cache`);
    }
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    return Array.from(this.cache.values())
      .filter(node => !node.isExpired())
      .map(node => node.value);
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    let totalAccessTime = 0;

    this.cache.forEach(node => {
      if (oldestEntry === null || node.createdAt < oldestEntry) {
        oldestEntry = node.createdAt;
      }
      if (newestEntry === null || node.createdAt > newestEntry) {
        newestEntry = node.createdAt;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.capacity,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      missRate: total > 0 ? this.stats.misses / total : 0,
      evictionCount: this.stats.evictions,
      avgAccessTime: totalAccessTime / Math.max(this.cache.size, 1),
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry,
      newestEntry,
    };
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    this.cache.forEach((node, key) => {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(node.value).length * 2;
    });
    return size;
  }

  private saveToStorage(): void {
    try {
      const data: Array<{ key: string; value: T; ttl: number; createdAt: number }> = [];
      this.cache.forEach((node, key) => {
        if (!node.isExpired()) {
          data.push({
            key,
            value: node.value,
            ttl: node.ttl,
            createdAt: node.createdAt,
          });
        }
      });
      localStorage.setItem(
        `${this.config.storagePrefix}_lru_cache`,
        JSON.stringify(data)
      );
    } catch (e) {
      console.warn('[LRUCache] Failed to persist to storage:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(`${this.config.storagePrefix}_lru_cache`);
      if (!stored) return;

      const data = JSON.parse(stored) as Array<{ key: string; value: T; ttl: number; createdAt: number }>;
      const now = Date.now();

      data.forEach(({ key, value, ttl, createdAt }) => {
        if (now < createdAt + ttl) {
          this.set(key, value, ttl - (now - createdAt));
        }
      });
    } catch (e) {
      console.warn('[LRUCache] Failed to load from storage:', e);
    }
  }

  // Cleanup expired entries
  gc(): number {
    let cleaned = 0;
    this.cache.forEach((node, key) => {
      if (node.isExpired()) {
        this.delete(key);
        cleaned++;
      }
    });
    return cleaned;
  }
}

// ============================================================================
// DYNAMIC TTL CALCULATOR
// ============================================================================

export function calculateDynamicTTL(
  config: DynamicTTLConfig,
  key: string,
  value: unknown,
  metadata: CacheMetadata
): number {
  switch (config.strategy) {
    case 'access-frequency': {
      // More accesses = longer TTL
      const frequencyMultiplier = Math.min(metadata.accessCount / 10, 2);
      return Math.min(
        Math.max(config.baseTtl * frequencyMultiplier, config.minTtl),
        config.maxTtl
      );
    }
    case 'data-volatility': {
      // Higher hit rate = data is stable = longer TTL
      const stabilityMultiplier = 0.5 + metadata.hitRate;
      return Math.min(
        Math.max(config.baseTtl * stabilityMultiplier, config.minTtl),
        config.maxTtl
      );
    }
    case 'size-based': {
      // Larger data = shorter TTL to manage memory
      const sizeFactor = Math.max(0.5, 1 - (metadata.size / 1000000)); // 1MB baseline
      return Math.min(
        Math.max(config.baseTtl * sizeFactor, config.minTtl),
        config.maxTtl
      );
    }
    case 'custom': {
      if (config.customCalculator) {
        return Math.min(
          Math.max(config.customCalculator(key, value, metadata), config.minTtl),
          config.maxTtl
        );
      }
      return config.baseTtl;
    }
    default:
      return config.baseTtl;
  }
}

// ============================================================================
// HOOK: useKBLRUCache
// ============================================================================

export function useKBLRUCache<T>(config: LRUCacheConfig) {
  const cacheRef = useRef<LRUCache<T>>(new LRUCache(config));
  const [stats, setStats] = useState<CacheStats>(cacheRef.current.getStats());

  const updateStats = useCallback(() => {
    setStats(cacheRef.current.getStats());
  }, []);

  const get = useCallback((key: string): T | null => {
    const value = cacheRef.current.get(key);
    updateStats();
    return value;
  }, [updateStats]);

  const set = useCallback((key: string, value: T, ttl?: number) => {
    cacheRef.current.set(key, value, ttl);
    updateStats();
  }, [updateStats]);

  const remove = useCallback((key: string): boolean => {
    const result = cacheRef.current.delete(key);
    updateStats();
    return result;
  }, [updateStats]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    updateStats();
  }, [updateStats]);

  const has = useCallback((key: string): boolean => {
    return cacheRef.current.has(key);
  }, []);

  // GC interval
  useEffect(() => {
    const interval = setInterval(() => {
      cacheRef.current.gc();
      updateStats();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    get,
    set,
    remove,
    clear,
    has,
    keys: () => cacheRef.current.keys(),
    values: () => cacheRef.current.values(),
    size: () => cacheRef.current.size(),
    stats,
    gc: () => cacheRef.current.gc(),
  };
}

// ============================================================================
// HOOK: useKBCacheWarming
// ============================================================================

export interface CacheWarmingStatus {
  isWarming: boolean;
  progress: number;
  warmedKeys: string[];
  failedKeys: string[];
  totalKeys: number;
}

export function useKBCacheWarming<T>(
  cache: ReturnType<typeof useKBLRUCache<T>>,
  config: CacheWarmingConfig
) {
  const [status, setStatus] = useState<CacheWarmingStatus>({
    isWarming: false,
    progress: 0,
    warmedKeys: [],
    failedKeys: [],
    totalKeys: config.initialKeys?.length || 0,
  });

  const warm = useCallback(async (keys: string[]) => {
    setStatus(prev => ({
      ...prev,
      isWarming: true,
      progress: 0,
      totalKeys: keys.length,
      warmedKeys: [],
      failedKeys: [],
    }));

    const concurrency = config.concurrency || 3;
    const warmedKeys: string[] = [];
    const failedKeys: string[] = [];

    const processKey = async (key: string) => {
      try {
        const value = await config.fetcher(key);
        cache.set(key, value as T);
        warmedKeys.push(key);
      } catch {
        failedKeys.push(key);
      }
      
      setStatus(prev => ({
        ...prev,
        progress: (warmedKeys.length + failedKeys.length) / keys.length,
        warmedKeys: [...warmedKeys],
        failedKeys: [...failedKeys],
      }));
    };

    if (config.priority === 'sequential') {
      for (const key of keys) {
        await processKey(key);
      }
    } else {
      // Parallel with concurrency limit
      const chunks: string[][] = [];
      for (let i = 0; i < keys.length; i += concurrency) {
        chunks.push(keys.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(processKey));
      }
    }

    setStatus(prev => ({
      ...prev,
      isWarming: false,
      progress: 1,
    }));

    return { warmedKeys, failedKeys };
  }, [cache, config]);

  // Auto-warm on mount
  useEffect(() => {
    if (config.initialKeys && config.initialKeys.length > 0) {
      if (config.background) {
        setTimeout(() => warm(config.initialKeys!), 0);
      } else {
        warm(config.initialKeys);
      }
    }
  }, []);

  return {
    warm,
    status,
    isWarming: status.isWarming,
    progress: status.progress,
  };
}

// ============================================================================
// HOOK: useKBPrefetch
// ============================================================================

export function useKBPrefetch<T>(
  cache: ReturnType<typeof useKBLRUCache<T>>,
  fetcher: (key: string) => Promise<T>,
  config?: PrefetchConfig
) {
  const prefetchedRef = useRef<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(async (key: string) => {
    if (prefetchedRef.current.has(key) || cache.has(key)) {
      return;
    }

    prefetchedRef.current.add(key);

    try {
      const value = await fetcher(key);
      cache.set(key, value);
    } catch (e) {
      prefetchedRef.current.delete(key);
      console.warn(`[Prefetch] Failed to prefetch ${key}:`, e);
    }
  }, [cache, fetcher]);

  const prefetchMultiple = useCallback(async (keys: string[]) => {
    await Promise.all(keys.map(prefetch));
  }, [prefetch]);

  const debouncedPrefetch = useCallback((key: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      prefetch(key);
    }, config?.debounceMs || 200);
  }, [prefetch, config?.debounceMs]);

  // Prefetch on mount
  useEffect(() => {
    if (config?.prefetchOnMount && config.keys) {
      prefetchMultiple(config.keys);
    }
  }, []);

  // Create hover handler for prefetch on hover
  const createHoverHandler = useCallback((key: string) => {
    if (!config?.prefetchOnHover) {
      return undefined;
    }
    return () => debouncedPrefetch(key);
  }, [config?.prefetchOnHover, debouncedPrefetch]);

  return {
    prefetch,
    prefetchMultiple,
    createHoverHandler,
    isPrefetched: (key: string) => prefetchedRef.current.has(key),
    clearPrefetched: () => prefetchedRef.current.clear(),
  };
}

// ============================================================================
// HOOK: useKBSmartCache (combines all strategies)
// ============================================================================

export interface SmartCacheConfig<T> extends LRUCacheConfig {
  dynamicTTL?: DynamicTTLConfig;
  warming?: CacheWarmingConfig;
  prefetch?: PrefetchConfig;
  fetcher: (key: string) => Promise<T>;
}

export function useKBSmartCache<T>(config: SmartCacheConfig<T>) {
  const cache = useKBLRUCache<T>(config);
  
  const warming = useKBCacheWarming(cache, {
    fetcher: config.fetcher,
    ...config.warming,
  });
  
  const prefetcher = useKBPrefetch(cache, config.fetcher, config.prefetch);

  const metadataRef = useRef<Map<string, CacheMetadata>>(new Map());

  const getWithDynamicTTL = useCallback(async (key: string): Promise<T | null> => {
    const cached = cache.get(key);
    if (cached !== null) {
      // Update metadata
      const metadata = metadataRef.current.get(key) || {
        accessCount: 0,
        lastAccess: Date.now(),
        createdAt: Date.now(),
        size: 0,
        hitRate: 0,
      };
      metadata.accessCount++;
      metadata.lastAccess = Date.now();
      metadataRef.current.set(key, metadata);
      return cached;
    }

    // Fetch and cache with dynamic TTL
    try {
      const value = await config.fetcher(key);
      
      const metadata: CacheMetadata = {
        accessCount: 1,
        lastAccess: Date.now(),
        createdAt: Date.now(),
        size: JSON.stringify(value).length,
        hitRate: cache.stats.hitRate,
      };
      metadataRef.current.set(key, metadata);

      let ttl = config.defaultTtl || 300000;
      if (config.dynamicTTL) {
        ttl = calculateDynamicTTL(config.dynamicTTL, key, value, metadata);
      }

      cache.set(key, value, ttl);
      return value;
    } catch (e) {
      console.error(`[SmartCache] Failed to fetch ${key}:`, e);
      return null;
    }
  }, [cache, config]);

  return {
    // Core cache operations
    get: getWithDynamicTTL,
    set: cache.set,
    remove: cache.remove,
    clear: cache.clear,
    has: cache.has,
    stats: cache.stats,
    
    // Warming
    warm: warming.warm,
    isWarming: warming.isWarming,
    warmingProgress: warming.progress,
    
    // Prefetching
    prefetch: prefetcher.prefetch,
    prefetchMultiple: prefetcher.prefetchMultiple,
    createHoverHandler: prefetcher.createHoverHandler,
    
    // Utilities
    gc: cache.gc,
    keys: cache.keys,
    values: cache.values,
  };
}

export default useKBSmartCache;
