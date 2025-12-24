/**
 * KB 3.0 - Query Deduplication
 * Automatic deduplication of concurrent identical queries
 * 
 * Features:
 * - Request deduplication by key
 * - Batch request optimization
 * - Automatic refetch coordination
 * - Stale query invalidation
 */

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react';
import { KBStatus, KBError, KBCacheConfig, KB_DEFAULT_CACHE_CONFIG } from './types';
import { parseError, collectTelemetry } from './useKBBase';
import { 
  getCacheEntry, 
  setCacheEntry, 
  isCacheStale, 
  isCacheValid,
  invalidateCacheEntry,
  invalidateCacheByPrefix,
} from '@/lib/kbCache';

// === QUERY STATE ===
interface QueryState<T> {
  data: T | null;
  status: KBStatus;
  error: KBError | null;
  dataUpdatedAt: number | null;
  errorUpdatedAt: number | null;
  fetchStatus: 'idle' | 'fetching';
  isStale: boolean;
}

interface QueryEntry<T> {
  state: QueryState<T>;
  subscribers: Set<() => void>;
  promise: Promise<T> | null;
  abortController: AbortController | null;
  refetchInterval?: NodeJS.Timeout;
}

// === QUERY CACHE ===
const queryCache = new Map<string, QueryEntry<unknown>>();

function getQueryEntry<T>(key: string): QueryEntry<T> | undefined {
  return queryCache.get(key) as QueryEntry<T> | undefined;
}

function createQueryEntry<T>(): QueryEntry<T> {
  return {
    state: {
      data: null,
      status: 'idle',
      error: null,
      dataUpdatedAt: null,
      errorUpdatedAt: null,
      fetchStatus: 'idle',
      isStale: true,
    },
    subscribers: new Set(),
    promise: null,
    abortController: null,
  };
}

function getOrCreateQueryEntry<T>(key: string): QueryEntry<T> {
  if (!queryCache.has(key)) {
    queryCache.set(key, createQueryEntry<T>());
  }
  return queryCache.get(key) as QueryEntry<T>;
}

function notifyQuerySubscribers(key: string): void {
  const entry = queryCache.get(key);
  if (entry) {
    entry.subscribers.forEach(callback => callback());
  }
}

function updateQueryState<T>(
  key: string,
  updater: (prev: QueryState<T>) => Partial<QueryState<T>>
): void {
  const entry = getOrCreateQueryEntry<T>(key);
  const updates = updater(entry.state);
  entry.state = { ...entry.state, ...updates };
  notifyQuerySubscribers(key);
}

// === DEDUP FETCHER ===
async function fetchWithDedup<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: KBCacheConfig,
  hookName: string
): Promise<T> {
  const entry = getOrCreateQueryEntry<T>(key);

  // If already fetching, return the existing promise (deduplication)
  if (entry.promise) {
    return entry.promise;
  }

  // Create abort controller
  entry.abortController = new AbortController();

  // Start fetch
  const startTime = Date.now();
  updateQueryState<T>(key, () => ({
    fetchStatus: 'fetching',
    status: entry.state.data !== null ? 'success' : 'loading',
  }));

  entry.promise = (async () => {
    try {
      const data = await fetcher();

      // Update state
      updateQueryState<T>(key, () => ({
        data,
        status: 'success',
        error: null,
        dataUpdatedAt: Date.now(),
        fetchStatus: 'idle',
        isStale: false,
      }));

      // Update cache
      if (cache.enabled) {
        setCacheEntry(key, data, cache);
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

      updateQueryState<T>(key, () => ({
        status: 'error',
        error: parsedError,
        errorUpdatedAt: Date.now(),
        fetchStatus: 'idle',
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
    } finally {
      entry.promise = null;
      entry.abortController = null;
    }
  })();

  return entry.promise;
}

// === QUERY DEDUP HOOK ===
export interface UseKBQueryDedupOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number | false;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  cache?: Partial<KBCacheConfig>;
  hookName?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: KBError) => void;
}

export interface UseKBQueryDedupReturn<T> {
  // Data
  data: T | null;
  
  // Status
  status: KBStatus;
  fetchStatus: 'idle' | 'fetching';
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  isStale: boolean;
  
  // Error
  error: KBError | null;
  
  // Timestamps
  dataUpdatedAt: Date | null;
  errorUpdatedAt: Date | null;
  
  // Actions
  refetch: () => Promise<T | null>;
  invalidate: () => void;
  reset: () => void;
}

export function useKBQueryDedup<T>(
  options: UseKBQueryDedupOptions<T>
): UseKBQueryDedupReturn<T> {
  const {
    key,
    fetcher,
    enabled = true,
    staleTime = KB_DEFAULT_CACHE_CONFIG.staleTime,
    gcTime = KB_DEFAULT_CACHE_CONFIG.gcTime,
    refetchInterval = false,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    cache: cacheConfig,
    hookName = 'useKBQueryDedup',
    onSuccess,
    onError,
  } = options;

  const cache: KBCacheConfig = {
    ...KB_DEFAULT_CACHE_CONFIG,
    staleTime,
    gcTime,
    ...cacheConfig,
  };

  const isMountedRef = useRef(true);
  const hasCalledOnSuccessRef = useRef(false);
  const hasCalledOnErrorRef = useRef(false);

  // Subscribe to query updates
  const state = useSyncExternalStore(
    useCallback((onStoreChange) => {
      const entry = getOrCreateQueryEntry<T>(key);
      entry.subscribers.add(onStoreChange);
      return () => {
        entry.subscribers.delete(onStoreChange);
        // Cleanup if no subscribers and past gcTime
        if (entry.subscribers.size === 0) {
          setTimeout(() => {
            const current = queryCache.get(key);
            if (current?.subscribers.size === 0) {
              queryCache.delete(key);
            }
          }, gcTime);
        }
      };
    }, [key, gcTime]),
    useCallback(() => {
      const entry = getQueryEntry<T>(key);
      return entry?.state ?? createQueryEntry<T>().state;
    }, [key]),
    useCallback(() => createQueryEntry<T>().state, [])
  );

  // Refetch function
  const refetch = useCallback(async (): Promise<T | null> => {
    if (!isMountedRef.current) return null;

    try {
      const data = await fetchWithDedup(key, fetcher, cache, hookName);
      hasCalledOnSuccessRef.current = true;
      onSuccess?.(data);
      return data;
    } catch (err) {
      hasCalledOnErrorRef.current = true;
      onError?.(err as KBError);
      return null;
    }
  }, [key, fetcher, cache, hookName, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) return;

    // Check cache first
    const entry = getOrCreateQueryEntry<T>(key);
    const cached = getCacheEntry<T>(key);

    if (cached && isCacheValid(cached)) {
      // Use cached data
      updateQueryState<T>(key, () => ({
        data: cached.data,
        status: 'success',
        dataUpdatedAt: cached.timestamp,
        isStale: isCacheStale(cached),
      }));

      // Refetch in background if stale
      if (isCacheStale(cached) && refetchOnMount) {
        refetch();
      }
    } else if (refetchOnMount) {
      refetch();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [key, enabled, refetchOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    const entry = getOrCreateQueryEntry<T>(key);
    entry.refetchInterval = setInterval(() => {
      if (isMountedRef.current) {
        refetch();
      }
    }, refetchInterval);

    return () => {
      if (entry.refetchInterval) {
        clearInterval(entry.refetchInterval);
      }
    };
  }, [key, enabled, refetchInterval, refetch]);

  // Window focus refetch
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return;

    const handleFocus = () => {
      const entry = getQueryEntry<T>(key);
      if (entry?.state.isStale && isMountedRef.current) {
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, enabled, refetchOnWindowFocus, refetch]);

  // Callback effects
  useEffect(() => {
    if (state.status === 'success' && state.data !== null && !hasCalledOnSuccessRef.current) {
      hasCalledOnSuccessRef.current = true;
      onSuccess?.(state.data);
    }
    if (state.status === 'error' && state.error !== null && !hasCalledOnErrorRef.current) {
      hasCalledOnErrorRef.current = true;
      onError?.(state.error);
    }
  }, [state.status, state.data, state.error, onSuccess, onError]);

  // Reset callbacks when key changes
  useEffect(() => {
    hasCalledOnSuccessRef.current = false;
    hasCalledOnErrorRef.current = false;
  }, [key]);

  const invalidate = useCallback(() => {
    invalidateCacheEntry(key);
    updateQueryState<T>(key, () => ({ isStale: true }));
    refetch();
  }, [key, refetch]);

  const reset = useCallback(() => {
    const entry = getQueryEntry<T>(key);
    if (entry?.abortController) {
      entry.abortController.abort();
    }
    queryCache.delete(key);
    invalidateCacheEntry(key);
  }, [key]);

  return {
    data: state.data,
    status: state.status,
    fetchStatus: state.fetchStatus,
    isLoading: state.status === 'loading',
    isFetching: state.fetchStatus === 'fetching',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isStale: state.isStale,
    error: state.error,
    dataUpdatedAt: state.dataUpdatedAt ? new Date(state.dataUpdatedAt) : null,
    errorUpdatedAt: state.errorUpdatedAt ? new Date(state.errorUpdatedAt) : null,
    refetch,
    invalidate,
    reset,
  };
}

// === UTILITIES ===
export function invalidateQueries(keyOrPrefix: string): void {
  if (keyOrPrefix.endsWith('*')) {
    const prefix = keyOrPrefix.slice(0, -1);
    invalidateCacheByPrefix(prefix);
    queryCache.forEach((entry, key) => {
      if (key.startsWith(prefix)) {
        entry.state.isStale = true;
        notifyQuerySubscribers(key);
      }
    });
  } else {
    invalidateCacheEntry(keyOrPrefix);
    const entry = queryCache.get(keyOrPrefix);
    if (entry) {
      entry.state.isStale = true;
      notifyQuerySubscribers(keyOrPrefix);
    }
  }
}

export function prefetchQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache?: Partial<KBCacheConfig>
): Promise<T> {
  const mergedCache = { ...KB_DEFAULT_CACHE_CONFIG, ...cache };
  return fetchWithDedup(key, fetcher, mergedCache, 'prefetch');
}

export function getQueryData<T>(key: string): T | null {
  const entry = getQueryEntry<T>(key);
  return entry?.state.data ?? null;
}

export function setQueryData<T>(key: string, data: T): void {
  updateQueryState<T>(key, () => ({
    data,
    status: 'success',
    dataUpdatedAt: Date.now(),
    isStale: false,
  }));
}

export function getQueryCacheStats(): {
  queries: number;
  fetching: number;
  stale: number;
} {
  let fetching = 0;
  let stale = 0;

  queryCache.forEach((entry) => {
    if (entry.state.fetchStatus === 'fetching') fetching++;
    if (entry.state.isStale) stale++;
  });

  return {
    queries: queryCache.size,
    fetching,
    stale,
  };
}

export default useKBQueryDedup;
