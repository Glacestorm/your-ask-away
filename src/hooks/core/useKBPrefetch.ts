/**
 * KB 4.5 - Prefetching & Preloading Hooks
 * 
 * Hooks for intelligent data prefetching and preloading strategies.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getCacheEntry, setCacheEntry } from '@/lib/kbCache';

// ============================================================================
// TYPES
// ============================================================================

export interface KBPrefetchConfig {
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Priority level (higher = more important) */
  priority?: number;
  /** Whether to prefetch on hover */
  prefetchOnHover?: boolean;
  /** Delay before prefetch on hover (ms) */
  hoverDelay?: number;
  /** Whether to prefetch on focus */
  prefetchOnFocus?: boolean;
  /** Whether to prefetch on visible */
  prefetchOnVisible?: boolean;
  /** Intersection observer threshold */
  visibilityThreshold?: number;
  /** Maximum concurrent prefetches */
  maxConcurrent?: number;
  /** Enable predictive prefetching */
  predictive?: boolean;
}

export interface KBPrefetchState<T> {
  data: T | null;
  isPrefetching: boolean;
  isPrefetched: boolean;
  error: Error | null;
  lastPrefetchedAt: Date | null;
}

export interface KBPrefetchReturn<T> {
  state: KBPrefetchState<T>;
  prefetch: () => Promise<T | null>;
  invalidate: () => void;
  getHoverProps: () => {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  getFocusProps: () => {
    onFocus: () => void;
    onBlur: () => void;
  };
  getVisibilityRef: () => React.RefObject<HTMLElement>;
}

export interface KBPreloadConfig {
  /** Resources to preload */
  resources: KBPreloadResource[];
  /** Whether to preload immediately */
  immediate?: boolean;
  /** Priority order */
  priority?: 'high' | 'low' | 'auto';
  /** Timeout for preloading */
  timeout?: number;
}

export interface KBPreloadResource {
  type: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'module';
  url: string;
  /** Cross-origin setting */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Integrity hash */
  integrity?: string;
  /** Media query for conditional loading */
  media?: string;
  /** Custom fetch options for 'fetch' type */
  fetchOptions?: RequestInit;
}

export interface KBPreloadState {
  loaded: Map<string, boolean>;
  errors: Map<string, Error>;
  isLoading: boolean;
  progress: number;
}

export interface KBLinkPrefetchConfig {
  /** Selector for links to prefetch */
  selector?: string;
  /** Intersection observer options */
  observerOptions?: IntersectionObserverInit;
  /** Maximum number of prefetches */
  maxPrefetches?: number;
  /** Delay before prefetching */
  delay?: number;
  /** Filter function for links */
  filter?: (url: string) => boolean;
}

export interface KBPredictivePrefetchConfig<T> {
  /** Prediction model */
  predict: (context: KBPredictionContext) => string[];
  /** Fetcher for each prediction */
  fetcher: (key: string) => Promise<T>;
  /** Maximum predictions to prefetch */
  maxPredictions?: number;
  /** Confidence threshold (0-1) */
  confidenceThreshold?: number;
  /** Context update interval */
  contextUpdateInterval?: number;
}

export interface KBPredictionContext {
  currentPath: string;
  navigationHistory: string[];
  userBehavior: Map<string, number>;
  timeOfDay: number;
  sessionDuration: number;
}

// ============================================================================
// PREFETCH QUEUE
// ============================================================================

interface PrefetchItem {
  key: string;
  fetcher: () => Promise<unknown>;
  priority: number;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

class PrefetchQueue {
  private queue: PrefetchItem[] = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  add<T>(key: string, fetcher: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        key,
        fetcher,
        priority,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.running++;

    try {
      const result = await item.fetcher();
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.running--;
      this.process();
    }
  }

  clear(): void {
    this.queue = [];
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  get runningCount(): number {
    return this.running;
  }
}

const globalPrefetchQueue = new PrefetchQueue(3);

// ============================================================================
// useKBPrefetch
// ============================================================================

const DEFAULT_PREFETCH_CONFIG: Required<KBPrefetchConfig> = {
  cacheTime: 5 * 60 * 1000,
  staleTime: 30 * 1000,
  priority: 0,
  prefetchOnHover: true,
  hoverDelay: 100,
  prefetchOnFocus: false,
  prefetchOnVisible: false,
  visibilityThreshold: 0.5,
  maxConcurrent: 3,
  predictive: false,
};

export function useKBPrefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: KBPrefetchConfig = {}
): KBPrefetchReturn<T> {
  const mergedConfig = { ...DEFAULT_PREFETCH_CONFIG, ...config };

  const [state, setState] = useState<KBPrefetchState<T>>({
    data: null,
    isPrefetching: false,
    isPrefetched: false,
    error: null,
    lastPrefetchedAt: null,
  });

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const prefetch = useCallback(async (): Promise<T | null> => {
    // Check cache first
    const cached = getCacheEntry<T>(key);
    if (cached) {
      setState(prev => ({
        ...prev,
        data: cached.data,
        isPrefetched: true,
        lastPrefetchedAt: new Date(cached.timestamp),
      }));
      return cached.data;
    }

    setState(prev => ({ ...prev, isPrefetching: true, error: null }));

    try {
      const data = await globalPrefetchQueue.add(key, fetcher, mergedConfig.priority);
      
      setCacheEntry(key, data, {
        staleTime: mergedConfig.staleTime,
        gcTime: mergedConfig.cacheTime,
      });

      setState({
        data: data as T,
        isPrefetching: false,
        isPrefetched: true,
        error: null,
        lastPrefetchedAt: new Date(),
      });

      return data as T;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({
        ...prev,
        isPrefetching: false,
        error: err,
      }));
      return null;
    }
  }, [key, fetcher, mergedConfig.priority, mergedConfig.staleTime, mergedConfig.cacheTime]);

  const invalidate = useCallback(() => {
    setState({
      data: null,
      isPrefetching: false,
      isPrefetched: false,
      error: null,
      lastPrefetchedAt: null,
    });
  }, []);

  const getHoverProps = useCallback(() => ({
    onMouseEnter: () => {
      if (!mergedConfig.prefetchOnHover) return;
      hoverTimeoutRef.current = setTimeout(() => {
        prefetch();
      }, mergedConfig.hoverDelay);
    },
    onMouseLeave: () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    },
  }), [prefetch, mergedConfig.prefetchOnHover, mergedConfig.hoverDelay]);

  const getFocusProps = useCallback(() => ({
    onFocus: () => {
      if (mergedConfig.prefetchOnFocus) {
        prefetch();
      }
    },
    onBlur: () => {},
  }), [prefetch, mergedConfig.prefetchOnFocus]);

  const getVisibilityRef = useCallback(() => visibilityRef, []);

  // Visibility observer
  useEffect(() => {
    if (!mergedConfig.prefetchOnVisible || !visibilityRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetch();
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold: mergedConfig.visibilityThreshold }
    );

    observerRef.current.observe(visibilityRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [prefetch, mergedConfig.prefetchOnVisible, mergedConfig.visibilityThreshold]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    state,
    prefetch,
    invalidate,
    getHoverProps,
    getFocusProps,
    getVisibilityRef,
  };
}

// ============================================================================
// useKBPreload
// ============================================================================

export function useKBPreload(config: KBPreloadConfig) {
  const [state, setState] = useState<KBPreloadState>({
    loaded: new Map(),
    errors: new Map(),
    isLoading: false,
    progress: 0,
  });

  const preloadResource = useCallback(async (resource: KBPreloadResource): Promise<void> => {
    const { type, url, crossOrigin, integrity, media, fetchOptions } = resource;

    try {
      switch (type) {
        case 'script': {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'script';
          link.href = url;
          if (crossOrigin) link.crossOrigin = crossOrigin;
          if (integrity) link.integrity = integrity;
          document.head.appendChild(link);
          break;
        }
        case 'style': {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'style';
          link.href = url;
          if (media) link.media = media;
          document.head.appendChild(link);
          break;
        }
        case 'image': {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
          });
          break;
        }
        case 'font': {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'font';
          link.href = url;
          link.crossOrigin = crossOrigin || 'anonymous';
          document.head.appendChild(link);
          break;
        }
        case 'fetch': {
          await fetch(url, fetchOptions);
          break;
        }
        case 'module': {
          const link = document.createElement('link');
          link.rel = 'modulepreload';
          link.href = url;
          document.head.appendChild(link);
          break;
        }
      }

      setState(prev => {
        const loaded = new Map(prev.loaded);
        loaded.set(url, true);
        return {
          ...prev,
          loaded,
          progress: (loaded.size / config.resources.length) * 100,
        };
      });
    } catch (error) {
      setState(prev => {
        const errors = new Map(prev.errors);
        errors.set(url, error instanceof Error ? error : new Error(String(error)));
        return { ...prev, errors };
      });
    }
  }, [config.resources.length]);

  const preloadAll = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    const resources = [...config.resources];
    
    if (config.priority === 'high') {
      // Load all immediately
      await Promise.allSettled(resources.map(preloadResource));
    } else if (config.priority === 'low') {
      // Load one at a time
      for (const resource of resources) {
        await preloadResource(resource);
      }
    } else {
      // Auto: load in batches of 3
      const batchSize = 3;
      for (let i = 0; i < resources.length; i += batchSize) {
        const batch = resources.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(preloadResource));
      }
    }

    setState(prev => ({ ...prev, isLoading: false }));
  }, [config.resources, config.priority, preloadResource]);

  useEffect(() => {
    if (config.immediate) {
      preloadAll();
    }
  }, [config.immediate, preloadAll]);

  return {
    ...state,
    preloadAll,
    preloadResource,
    isComplete: state.loaded.size === config.resources.length,
  };
}

// ============================================================================
// useKBLinkPrefetch
// ============================================================================

export function useKBLinkPrefetch(config: KBLinkPrefetchConfig = {}) {
  const {
    selector = 'a[href^="/"]',
    observerOptions = { rootMargin: '100px' },
    maxPrefetches = 10,
    delay = 0,
    filter = () => true,
  } = config;

  const prefetchedUrls = useRef(new Set<string>());
  const prefetchCount = useRef(0);

  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>(selector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        
        const link = entry.target as HTMLAnchorElement;
        const href = link.href;

        if (
          prefetchedUrls.current.has(href) ||
          prefetchCount.current >= maxPrefetches ||
          !filter(href)
        ) {
          return;
        }

        const doPrefetch = () => {
          prefetchedUrls.current.add(href);
          prefetchCount.current++;

          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = href;
          document.head.appendChild(prefetchLink);

          observer.unobserve(link);
        };

        if (delay > 0) {
          setTimeout(doPrefetch, delay);
        } else {
          doPrefetch();
        }
      });
    }, observerOptions);

    links.forEach((link) => observer.observe(link));

    return () => {
      observer.disconnect();
    };
  }, [selector, observerOptions, maxPrefetches, delay, filter]);

  return {
    prefetchedCount: prefetchCount.current,
    prefetchedUrls: Array.from(prefetchedUrls.current),
    reset: () => {
      prefetchedUrls.current.clear();
      prefetchCount.current = 0;
    },
  };
}

// ============================================================================
// useKBPredictivePrefetch
// ============================================================================

export function useKBPredictivePrefetch<T>(config: KBPredictivePrefetchConfig<T>) {
  const {
    predict,
    fetcher,
    maxPredictions = 3,
    confidenceThreshold = 0.5,
    contextUpdateInterval = 5000,
  } = config;

  const [predictions, setPredictions] = useState<string[]>([]);
  const [prefetched, setPrefetched] = useState<Map<string, T>>(new Map());
  const navigationHistory = useRef<string[]>([]);
  const userBehavior = useRef(new Map<string, number>());
  const sessionStart = useRef(Date.now());

  const getContext = useCallback((): KBPredictionContext => ({
    currentPath: window.location.pathname,
    navigationHistory: navigationHistory.current,
    userBehavior: userBehavior.current,
    timeOfDay: new Date().getHours(),
    sessionDuration: Date.now() - sessionStart.current,
  }), []);

  const updatePredictions = useCallback(async () => {
    const context = getContext();
    const newPredictions = predict(context)
      .slice(0, maxPredictions);
    
    setPredictions(newPredictions);

    // Prefetch predictions
    for (const key of newPredictions) {
      if (!prefetched.has(key)) {
        try {
          const data = await fetcher(key);
          setPrefetched(prev => new Map(prev).set(key, data));
        } catch (error) {
          console.warn(`Failed to prefetch prediction: ${key}`, error);
        }
      }
    }
  }, [getContext, predict, maxPredictions, fetcher, prefetched]);

  const recordNavigation = useCallback((path: string) => {
    navigationHistory.current.push(path);
    if (navigationHistory.current.length > 20) {
      navigationHistory.current.shift();
    }
    
    const count = userBehavior.current.get(path) || 0;
    userBehavior.current.set(path, count + 1);
    
    updatePredictions();
  }, [updatePredictions]);

  const recordInteraction = useCallback((key: string, weight = 1) => {
    const count = userBehavior.current.get(key) || 0;
    userBehavior.current.set(key, count + weight);
  }, []);

  // Periodic prediction updates
  useEffect(() => {
    const interval = setInterval(updatePredictions, contextUpdateInterval);
    return () => clearInterval(interval);
  }, [updatePredictions, contextUpdateInterval]);

  // Initial prediction
  useEffect(() => {
    updatePredictions();
  }, []);

  return {
    predictions,
    prefetched,
    recordNavigation,
    recordInteraction,
    getContext,
    refreshPredictions: updatePredictions,
  };
}

// ============================================================================
// useKBBatchPrefetch
// ============================================================================

export interface KBBatchPrefetchConfig<T> {
  keys: string[];
  fetcher: (key: string) => Promise<T>;
  batchSize?: number;
  delayBetweenBatches?: number;
  onProgress?: (loaded: number, total: number) => void;
}

export function useKBBatchPrefetch<T>(config: KBBatchPrefetchConfig<T>) {
  const {
    keys,
    fetcher,
    batchSize = 5,
    delayBetweenBatches = 100,
    onProgress,
  } = config;

  const [results, setResults] = useState<Map<string, T>>(new Map());
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const prefetchAll = useCallback(async () => {
    setIsLoading(true);
    setProgress(0);
    let loaded = 0;

    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (key) => {
          const data = await fetcher(key);
          return { key, data };
        })
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          setResults(prev => new Map(prev).set(result.value.key, result.value.data));
        } else {
          const key = batch[batchResults.indexOf(result)];
          setErrors(prev => new Map(prev).set(key, result.reason));
        }
        loaded++;
      });

      const currentProgress = (loaded / keys.length) * 100;
      setProgress(currentProgress);
      onProgress?.(loaded, keys.length);

      if (i + batchSize < keys.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    setIsLoading(false);
  }, [keys, fetcher, batchSize, delayBetweenBatches, onProgress]);

  return {
    results,
    errors,
    isLoading,
    progress,
    prefetchAll,
    get: (key: string) => results.get(key),
    has: (key: string) => results.has(key),
    isComplete: results.size === keys.length,
  };
}

// ============================================================================
// useKBRoutePreload
// ============================================================================

export interface KBRoutePreloadConfig {
  routes: Array<{
    path: string;
    component: () => Promise<{ default: React.ComponentType }>;
    preloadData?: () => Promise<unknown>;
  }>;
  preloadOnHover?: boolean;
  preloadOnVisible?: boolean;
}

export function useKBRoutePreload(config: KBRoutePreloadConfig) {
  const {
    routes,
    preloadOnHover = true,
    preloadOnVisible = true,
  } = config;

  const preloadedRoutes = useRef(new Set<string>());
  const preloadedData = useRef(new Map<string, unknown>());

  const preloadRoute = useCallback(async (path: string) => {
    if (preloadedRoutes.current.has(path)) return;

    const route = routes.find(r => r.path === path);
    if (!route) return;

    preloadedRoutes.current.add(path);

    try {
      // Preload component
      await route.component();

      // Preload data if available
      if (route.preloadData) {
        const data = await route.preloadData();
        preloadedData.current.set(path, data);
      }
    } catch (error) {
      console.warn(`Failed to preload route: ${path}`, error);
      preloadedRoutes.current.delete(path);
    }
  }, [routes]);

  const getLinkProps = useCallback((path: string) => ({
    onMouseEnter: preloadOnHover ? () => preloadRoute(path) : undefined,
    onFocus: preloadOnHover ? () => preloadRoute(path) : undefined,
  }), [preloadRoute, preloadOnHover]);

  const getPreloadedData = useCallback((path: string) => 
    preloadedData.current.get(path), []);

  const isPreloaded = useCallback((path: string) => 
    preloadedRoutes.current.has(path), []);

  return {
    preloadRoute,
    getLinkProps,
    getPreloadedData,
    isPreloaded,
    preloadedCount: preloadedRoutes.current.size,
  };
}

export default useKBPrefetch;
