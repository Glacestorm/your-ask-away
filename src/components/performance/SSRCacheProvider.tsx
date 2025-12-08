import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
  tags: string[];
}

interface SSRCacheContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }) => void;
  invalidate: (key: string) => void;
  invalidateByTag: (tag: string) => void;
  prefetch: <T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number; tags?: string[] }) => Promise<T>;
  getStats: () => { hits: number; misses: number; entries: number };
}

const SSRCacheContext = createContext<SSRCacheContextType | null>(null);

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * SSR Cache Provider - Provides cache integration for React 19 streaming SSR
 * Implements stale-while-revalidate pattern for optimal perceived performance
 */
export function SSRCacheProvider({ children }: { children: ReactNode }) {
  const [cache] = useState(() => new Map<string, CacheEntry>());
  const [stats, setStats] = useState({ hits: 0, misses: 0 });

  // Cleanup expired entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > entry.ttl * 2) {
          cache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, 60000);
    return () => clearInterval(interval);
  }, [cache]);

  const get = useCallback(<T,>(key: string): T | null => {
    const entry = cache.get(key);
    
    if (!entry) {
      setStats(s => ({ ...s, misses: s.misses + 1 }));
      return null;
    }

    const isValid = Date.now() - entry.timestamp < entry.ttl;
    
    if (isValid) {
      setStats(s => ({ ...s, hits: s.hits + 1 }));
      return entry.data as T;
    }

    setStats(s => ({ ...s, misses: s.misses + 1 }));
    return entry.data as T; // Return stale data for stale-while-revalidate
  }, [cache]);

  const set = useCallback(<T,>(
    key: string, 
    data: T, 
    options: { ttl?: number; tags?: string[] } = {}
  ) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options.ttl ?? DEFAULT_TTL,
      tags: options.tags ?? [],
    });
  }, [cache]);

  const invalidate = useCallback((key: string) => {
    cache.delete(key);
  }, [cache]);

  const invalidateByTag = useCallback((tag: string) => {
    for (const [key, entry] of cache.entries()) {
      if (entry.tags.includes(tag)) {
        cache.delete(key);
      }
    }
  }, [cache]);

  const prefetch = useCallback(async <T,>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<T> => {
    const existing = get<T>(key);
    
    if (existing !== null) {
      // Check if we need to revalidate in background
      const entry = cache.get(key);
      if (entry && Date.now() - entry.timestamp >= entry.ttl) {
        // Stale - revalidate in background
        fetcher().then(data => set(key, data, options)).catch(console.error);
      }
      return existing;
    }

    const data = await fetcher();
    set(key, data, options);
    return data;
  }, [cache, get, set]);

  const getStats = useCallback(() => ({
    hits: stats.hits,
    misses: stats.misses,
    entries: cache.size,
  }), [stats, cache]);

  return (
    <SSRCacheContext.Provider value={{ get, set, invalidate, invalidateByTag, prefetch, getStats }}>
      {children}
    </SSRCacheContext.Provider>
  );
}

export function useSSRCache() {
  const context = useContext(SSRCacheContext);
  if (!context) {
    throw new Error('useSSRCache must be used within SSRCacheProvider');
  }
  return context;
}

/**
 * Higher-order component for SSR cache integration
 */
export function withSSRCache<P extends object>(
  Component: React.ComponentType<P>,
  cacheKey: (props: P) => string,
  options: { ttl?: number; tags?: string[] } = {}
) {
  return function CachedComponent(props: P) {
    const cache = useSSRCache();
    const key = cacheKey(props);

    useEffect(() => {
      // Prefetch on mount
      cache.prefetch(key, async () => props, options);
    }, [key, props, cache]);

    return <Component {...props} />;
  };
}

/**
 * Hook for module-specific caching (GIS, IA modules)
 */
export function useModuleCache(moduleName: 'gis' | 'ia' | 'accounting' | 'dashboard') {
  const cache = useSSRCache();
  
  const cacheKey = useCallback((subKey: string) => `${moduleName}:${subKey}`, [moduleName]);
  
  const prefetchModule = useCallback(async <T,>(
    subKey: string,
    fetcher: () => Promise<T>
  ) => {
    return cache.prefetch(cacheKey(subKey), fetcher, { 
      tags: [moduleName],
      ttl: moduleName === 'gis' ? 10 * 60 * 1000 : 5 * 60 * 1000 // GIS data cached longer
    });
  }, [cache, cacheKey, moduleName]);

  const invalidateModule = useCallback(() => {
    cache.invalidateByTag(moduleName);
  }, [cache, moduleName]);

  return {
    get: <T,>(subKey: string) => cache.get<T>(cacheKey(subKey)),
    set: <T,>(subKey: string, data: T) => cache.set(cacheKey(subKey), data, { tags: [moduleName] }),
    prefetch: prefetchModule,
    invalidate: (subKey: string) => cache.invalidate(cacheKey(subKey)),
    invalidateAll: invalidateModule,
  };
}
