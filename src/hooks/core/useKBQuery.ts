/**
 * KB 2.0 - Query Hook Wrapper
 * For data fetching operations with caching and auto-refresh
 */

import { useEffect, useCallback, useRef } from 'react';
import { useKBBase, createKBError } from './useKBBase';
import {
  KBQueryOptions,
  KBHookReturn,
  KB_DEFAULT_QUERY_OPTIONS,
  KBError,
} from './types';

interface UseKBQueryOptions<T> extends KBQueryOptions<T> {
  hookName: string;
  operationName?: string;
  queryFn: () => Promise<T>;
  deps?: unknown[];
}

export function useKBQuery<T>(options: UseKBQueryOptions<T>): KBHookReturn<T> {
  const {
    hookName,
    operationName = 'fetch',
    queryFn,
    deps = [],
    enabled = KB_DEFAULT_QUERY_OPTIONS.enabled,
    staleTime = KB_DEFAULT_QUERY_OPTIONS.staleTime,
    refetchOnMount = KB_DEFAULT_QUERY_OPTIONS.refetchOnMount,
    refetchOnWindowFocus = KB_DEFAULT_QUERY_OPTIONS.refetchOnWindowFocus,
    refetchInterval = KB_DEFAULT_QUERY_OPTIONS.refetchInterval,
    onSuccess,
    onError,
    onSettled,
  } = options;

  const base = useKBBase<T>({
    hookName,
    operationName,
    onSuccess: (data) => {
      onSuccess?.(data);
      onSettled?.(data, null);
    },
    onError: (error) => {
      onError?.(error);
      onSettled?.(null, error);
    },
  });

  const lastFetchTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Register query function
  useEffect(() => {
    (base as any)._registerExecuteFn(queryFn);
  }, [queryFn]);

  // Check if data is stale
  const isStale = useCallback(() => {
    if (!staleTime) return true;
    return Date.now() - lastFetchTimeRef.current > staleTime;
  }, [staleTime]);

  // Fetch data
  const fetch = useCallback(async () => {
    if (!enabled) return null;
    
    lastFetchTimeRef.current = Date.now();
    return base.execute();
  }, [enabled, base.execute]);

  // Initial fetch
  useEffect(() => {
    if (enabled && (refetchOnMount || isInitialMount.current)) {
      fetch();
    }
    isInitialMount.current = false;
  }, [enabled, ...deps]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      if (isStale()) {
        fetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, isStale, fetch]);

  // Auto refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      fetch();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refetchInterval, enabled, fetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Expose refetch as execute
  return {
    ...base,
    execute: fetch as any,
    refetch: fetch,
  } as KBHookReturn<T> & { refetch: () => Promise<T | null> };
}

export default useKBQuery;
