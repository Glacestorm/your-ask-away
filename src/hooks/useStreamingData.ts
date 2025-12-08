import { useState, useEffect, useCallback, useTransition, useDeferredValue } from 'react';

interface StreamingChunk<T> {
  data: T[];
  isComplete: boolean;
  progress: number;
}

/**
 * useStreamingData - Hook for progressive data loading with React 19
 * Simulates streaming SSR behavior for improved TTI
 */
export function useStreamingData<T>(
  fetchFn: () => Promise<T[]>,
  options: {
    chunkSize?: number;
    enabled?: boolean;
    onChunk?: (chunk: T[]) => void;
  } = {}
) {
  const { chunkSize = 10, enabled = true, onChunk } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  // Deferred value for smooth UI updates
  const deferredData = useDeferredValue(data);

  const streamData = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    setData([]);
    setProgress(0);
    setIsComplete(false);

    try {
      const allData = await fetchFn();
      const totalChunks = Math.ceil(allData.length / chunkSize);

      // Stream data in chunks using transitions
      for (let i = 0; i < totalChunks; i++) {
        const chunk = allData.slice(i * chunkSize, (i + 1) * chunkSize);
        
        startTransition(() => {
          setData(prev => [...prev, ...chunk]);
          setProgress(((i + 1) / totalChunks) * 100);
          onChunk?.(chunk);
        });

        // Small delay between chunks for visual streaming effect
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Streaming failed'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, chunkSize, enabled, onChunk]);

  useEffect(() => {
    streamData();
  }, [streamData]);

  return {
    data: deferredData,
    isLoading,
    isComplete,
    progress,
    error,
    isPending,
    refetch: streamData,
  };
}

/**
 * useProgressiveHydration - Delays hydration of non-critical components
 * Improves TTI by prioritizing interactive elements
 */
export function useProgressiveHydration(priority: 'critical' | 'high' | 'low' = 'high') {
  const [isHydrated, setIsHydrated] = useState(priority === 'critical');

  useEffect(() => {
    if (priority === 'critical') return;

    const delay = priority === 'high' ? 100 : 500;
    
    // Use requestIdleCallback for low priority
    if (priority === 'low' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setIsHydrated(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }

    const timer = setTimeout(() => setIsHydrated(true), delay);
    return () => clearTimeout(timer);
  }, [priority]);

  return isHydrated;
}

/**
 * useChunkedRender - Renders large lists in chunks to avoid blocking
 */
export function useChunkedRender<T>(
  items: T[],
  options: { chunkSize?: number; initialChunks?: number } = {}
) {
  const { chunkSize = 20, initialChunks = 1 } = options;
  
  const [visibleCount, setVisibleCount] = useState(initialChunks * chunkSize);
  const [isPending, startTransition] = useTransition();

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const progress = (visibleCount / items.length) * 100;

  const loadMore = useCallback(() => {
    startTransition(() => {
      setVisibleCount(prev => Math.min(prev + chunkSize, items.length));
    });
  }, [items.length, chunkSize]);

  const loadAll = useCallback(() => {
    startTransition(() => {
      setVisibleCount(items.length);
    });
  }, [items.length]);

  // Auto-load remaining items in background
  useEffect(() => {
    if (hasMore && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(() => loadMore(), { timeout: 1000 });
      return () => cancelIdleCallback(id);
    }
  }, [hasMore, loadMore]);

  return {
    visibleItems,
    hasMore,
    progress,
    isPending,
    loadMore,
    loadAll,
    totalCount: items.length,
    visibleCount,
  };
}

/**
 * useSSRSafeState - State that's safe for SSR streaming
 */
export function useSSRSafeState<T>(initialValue: T, ssrValue?: T) {
  const [isClient, setIsClient] = useState(false);
  const [value, setValue] = useState(ssrValue ?? initialValue);

  useEffect(() => {
    setIsClient(true);
    setValue(initialValue);
  }, [initialValue]);

  return [isClient ? value : (ssrValue ?? value), setValue, isClient] as const;
}

/**
 * usePrefetchOnHover - Prefetch data when user hovers over element
 */
export function usePrefetchOnHover<T>(
  fetchFn: () => Promise<T>,
  options: { delay?: number } = {}
) {
  const { delay = 200 } = options;
  
  const [prefetchedData, setPrefetchedData] = useState<T | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  const prefetch = useCallback(() => {
    if (prefetchedData || isPrefetching) return;

    const timer = setTimeout(async () => {
      setIsPrefetching(true);
      try {
        const data = await fetchFn();
        setPrefetchedData(data);
      } catch (error) {
        console.warn('Prefetch failed:', error);
      } finally {
        setIsPrefetching(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [fetchFn, delay, prefetchedData, isPrefetching]);

  return {
    prefetchedData,
    isPrefetching,
    onMouseEnter: prefetch,
    clearPrefetch: () => setPrefetchedData(null),
  };
}
