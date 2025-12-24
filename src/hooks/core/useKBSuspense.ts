/**
 * KB 3.0 - Suspense-First Hook
 * React 18/19 Suspense integration for cleaner data fetching
 * 
 * Features:
 * - Native Suspense support with throw Promise pattern
 * - Resource caching and deduplication
 * - Automatic error boundaries integration
 * - Streaming SSR ready
 */

import { useCallback, useSyncExternalStore, useRef, useEffect } from 'react';
import { KBError, KBCacheConfig, KB_DEFAULT_CACHE_CONFIG } from './types';
import { parseError, collectTelemetry } from './useKBBase';
import { generateCacheKey, getCacheEntry, setCacheEntry, isCacheStale } from '@/lib/kbCache';

// === RESOURCE TYPES ===
type ResourceStatus = 'pending' | 'success' | 'error';

interface Resource<T> {
  read(): T;
  preload(): void;
  refresh(): void;
}

interface ResourceState<T> {
  status: ResourceStatus;
  data: T | null;
  error: KBError | null;
  promise: Promise<T> | null;
  timestamp: number;
}

// === RESOURCE CACHE ===
const resourceCache = new Map<string, ResourceState<unknown>>();
const subscribers = new Map<string, Set<() => void>>();

function getResourceSnapshot<T>(key: string): ResourceState<T> | null {
  return resourceCache.get(key) as ResourceState<T> | null;
}

function subscribeToResource(key: string, callback: () => void): () => void {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(callback);
  
  return () => {
    const subs = subscribers.get(key);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        subscribers.delete(key);
      }
    }
  };
}

function notifySubscribers(key: string): void {
  const subs = subscribers.get(key);
  if (subs) {
    subs.forEach(callback => callback());
  }
}

function updateResourceState<T>(
  key: string, 
  updater: (prev: ResourceState<T> | null) => ResourceState<T>
): void {
  const prev = resourceCache.get(key) as ResourceState<T> | null;
  const next = updater(prev);
  resourceCache.set(key, next);
  notifySubscribers(key);
}

// === DEDUPLICATION ===
const pendingRequests = new Map<string, Promise<unknown>>();

async function fetchWithDedup<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check for pending request
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  // Create new request
  const promise = fetcher();
  pendingRequests.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
}

// === CREATE RESOURCE ===
export function createResource<T>(
  fetcher: () => Promise<T>,
  options: {
    key: string;
    cache?: Partial<KBCacheConfig>;
    hookName?: string;
  }
): Resource<T> {
  const { key, cache: cacheConfig, hookName = 'useKBSuspense' } = options;
  const mergedCache = { ...KB_DEFAULT_CACHE_CONFIG, ...cacheConfig };

  const fetchData = async (): Promise<T> => {
    const startTime = Date.now();

    try {
      const data = await fetchWithDedup(key, fetcher);
      
      updateResourceState<T>(key, () => ({
        status: 'success',
        data,
        error: null,
        promise: null,
        timestamp: Date.now(),
      }));

      // Cache the result
      if (mergedCache.enabled) {
        setCacheEntry(key, data, mergedCache);
      }

      collectTelemetry({
        hookName,
        operationName: 'fetch',
        startTime: new Date(startTime),
        endTime: new Date(),
        durationMs: Date.now() - startTime,
        status: 'success',
        retryCount: 0,
      });

      return data;
    } catch (err) {
      const parsedError = parseError(err);
      
      updateResourceState<T>(key, () => ({
        status: 'error',
        data: null,
        error: parsedError,
        promise: null,
        timestamp: Date.now(),
      }));

      collectTelemetry({
        hookName,
        operationName: 'fetch',
        startTime: new Date(startTime),
        endTime: new Date(),
        durationMs: Date.now() - startTime,
        status: 'error',
        error: parsedError,
        retryCount: 0,
      });

      throw parsedError;
    }
  };

  const initiate = (): void => {
    const current = getResourceSnapshot<T>(key);
    
    // Check cache first
    if (mergedCache.enabled) {
      const cached = getCacheEntry<T>(key);
      if (cached && !isCacheStale(cached)) {
        updateResourceState<T>(key, () => ({
          status: 'success',
          data: cached.data,
          error: null,
          promise: null,
          timestamp: cached.timestamp,
        }));
        return;
      }
    }

    // Already pending
    if (current?.status === 'pending' && current.promise) {
      return;
    }

    const promise = fetchData();
    
    updateResourceState<T>(key, () => ({
      status: 'pending',
      data: null,
      error: null,
      promise,
      timestamp: Date.now(),
    }));
  };

  return {
    read(): T {
      const state = getResourceSnapshot<T>(key);

      if (!state) {
        initiate();
        const newState = getResourceSnapshot<T>(key);
        if (newState?.promise) {
          throw newState.promise;
        }
      }

      if (state?.status === 'pending' && state.promise) {
        throw state.promise;
      }

      if (state?.status === 'error' && state.error) {
        throw state.error;
      }

      if (state?.status === 'success' && state.data !== null) {
        return state.data;
      }

      // Shouldn't reach here, but initiate if needed
      initiate();
      const newState = getResourceSnapshot<T>(key);
      if (newState?.promise) {
        throw newState.promise;
      }

      throw new Error('Resource not available');
    },

    preload(): void {
      initiate();
    },

    refresh(): void {
      resourceCache.delete(key);
      initiate();
    },
  };
}

// === SUSPENSE QUERY HOOK ===
export interface UseKBSuspenseQueryOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  cache?: Partial<KBCacheConfig>;
  enabled?: boolean;
  hookName?: string;
}

export interface UseKBSuspenseQueryReturn<T> {
  data: T;
  refresh: () => void;
  isRefreshing: boolean;
  lastFetched: Date | null;
}

/**
 * Suspense-first query hook
 * Throws Promise for Suspense, throws Error for ErrorBoundary
 */
export function useKBSuspenseQuery<T>(
  options: UseKBSuspenseQueryOptions<T>
): UseKBSuspenseQueryReturn<T> {
  const { key, fetcher, cache, enabled = true, hookName = 'useKBSuspenseQuery' } = options;
  
  const resourceRef = useRef<Resource<T> | null>(null);
  const [, forceUpdate] = useReducerCompat();

  // Create or get resource
  if (!resourceRef.current) {
    resourceRef.current = createResource(fetcher, { key, cache, hookName });
  }

  // Subscribe to updates
  const state = useSyncExternalStore(
    useCallback((onStoreChange) => subscribeToResource(key, onStoreChange), [key]),
    useCallback(() => getResourceSnapshot<T>(key), [key]),
    useCallback(() => null, [])
  );

  // Preload on mount if enabled
  useEffect(() => {
    if (enabled && resourceRef.current) {
      resourceRef.current.preload();
    }
  }, [enabled, key]);

  const refresh = useCallback(() => {
    if (resourceRef.current) {
      resourceRef.current.refresh();
      forceUpdate();
    }
  }, [forceUpdate]);

  // This will throw if pending or error
  const data = resourceRef.current.read();

  return {
    data,
    refresh,
    isRefreshing: state?.status === 'pending',
    lastFetched: state?.timestamp ? new Date(state.timestamp) : null,
  };
}

// Simple forceUpdate hook
function useReducerCompat(): [number, () => void] {
  const ref = useRef(0);
  const [, setState] = useStateCompat();
  return [ref.current, () => { ref.current++; setState({}); }];
}

function useStateCompat(): [object, (v: object) => void] {
  const { useState } = require('react');
  return useState({});
}

// === SUSPENSE RESOURCE HOOK ===
export interface UseKBResourceOptions<T, TParams = void> {
  key: string | ((params: TParams) => string);
  fetcher: TParams extends void ? () => Promise<T> : (params: TParams) => Promise<T>;
  cache?: Partial<KBCacheConfig>;
  hookName?: string;
}

/**
 * Dynamic resource hook for parameterized queries
 */
export function useKBResource<T, TParams = void>(
  options: UseKBResourceOptions<T, TParams>
): {
  read: TParams extends void ? () => T : (params: TParams) => T;
  preload: TParams extends void ? () => void : (params: TParams) => void;
  refresh: TParams extends void ? () => void : (params: TParams) => void;
  invalidate: (params?: TParams) => void;
} {
  const { key: keyFn, fetcher, cache, hookName = 'useKBResource' } = options;
  
  const resourcesRef = useRef(new Map<string, Resource<T>>());

  const getKey = (params?: TParams): string => {
    if (typeof keyFn === 'function') {
      return (keyFn as (params: TParams) => string)(params as TParams);
    }
    return keyFn;
  };

  const getOrCreateResource = (params?: TParams): Resource<T> => {
    const key = getKey(params);
    
    if (!resourcesRef.current.has(key)) {
      const resource = createResource(
        () => (fetcher as (params?: TParams) => Promise<T>)(params),
        { key, cache, hookName }
      );
      resourcesRef.current.set(key, resource);
    }

    return resourcesRef.current.get(key)!;
  };

  return {
    read: ((params?: TParams) => {
      const resource = getOrCreateResource(params);
      return resource.read();
    }) as TParams extends void ? () => T : (params: TParams) => T,

    preload: ((params?: TParams) => {
      const resource = getOrCreateResource(params);
      resource.preload();
    }) as TParams extends void ? () => void : (params: TParams) => void,

    refresh: ((params?: TParams) => {
      const resource = getOrCreateResource(params);
      resource.refresh();
    }) as TParams extends void ? () => void : (params: TParams) => void,

    invalidate: (params?: TParams) => {
      const key = getKey(params);
      resourceCache.delete(key);
      resourcesRef.current.delete(key);
    },
  };
}

// === PRELOAD UTILITIES ===
export function preloadResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache?: Partial<KBCacheConfig>
): void {
  const resource = createResource(fetcher, { key, cache });
  resource.preload();
}

export function invalidateResource(key: string): void {
  resourceCache.delete(key);
  notifySubscribers(key);
}

export function invalidateResourcesByPrefix(prefix: string): void {
  const keysToDelete: string[] = [];
  resourceCache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => {
    resourceCache.delete(key);
    notifySubscribers(key);
  });
}

// === UTILITIES ===
export function getResourceStats(): {
  resources: number;
  pending: number;
  cached: number;
} {
  let pending = 0;
  let cached = 0;

  resourceCache.forEach((state) => {
    if (state.status === 'pending') pending++;
    if (state.status === 'success') cached++;
  });

  return {
    resources: resourceCache.size,
    pending,
    cached,
  };
}

export default useKBSuspenseQuery;
