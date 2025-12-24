/**
 * KB 4.5 - Hydration & SSR Hooks
 * 
 * Hooks for server-side rendering hydration and client-side rehydration.
 */

import { useState, useCallback, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBHydrationConfig<T> {
  /** Initial server data */
  serverData?: T;
  /** Hydration key for matching */
  key: string;
  /** Skip hydration */
  skip?: boolean;
  /** Validate hydration data */
  validate?: (data: T) => boolean;
  /** Transform hydration data */
  transform?: (data: T) => T;
  /** Fallback value if hydration fails */
  fallback?: T;
  /** Mismatch handling strategy */
  mismatchStrategy?: 'warn' | 'error' | 'silent' | 'revalidate';
}

export interface KBHydrationState<T> {
  data: T | null;
  isHydrated: boolean;
  isHydrating: boolean;
  hydrationError: Error | null;
  hasMismatch: boolean;
}

export interface KBHydrationReturn<T> {
  state: KBHydrationState<T>;
  hydrate: (data: T) => void;
  rehydrate: () => Promise<void>;
  dehydrate: () => string;
  setData: (data: T | ((prev: T | null) => T)) => void;
}

// ============================================================================
// HYDRATION STORE
// ============================================================================

interface HydrationStore {
  data: Map<string, unknown>;
  isClient: boolean;
  isHydrated: Set<string>;
}

const hydrationStore: HydrationStore = {
  data: new Map(),
  isClient: typeof window !== 'undefined',
  isHydrated: new Set(),
};

// Populate from window.__HYDRATION_DATA__ if available
if (typeof window !== 'undefined') {
  const windowWithHydration = window as Window & { __HYDRATION_DATA__?: Record<string, unknown> };
  const hydrationData = windowWithHydration.__HYDRATION_DATA__;
  if (hydrationData) {
    Object.entries(hydrationData).forEach(([key, value]) => {
      hydrationStore.data.set(key, value);
    });
  }
}

export function getHydrationData<T>(key: string): T | undefined {
  return hydrationStore.data.get(key) as T | undefined;
}

export function setHydrationData<T>(key: string, data: T): void {
  hydrationStore.data.set(key, data);
}

export function markHydrated(key: string): void {
  hydrationStore.isHydrated.add(key);
}

export function isHydrated(key: string): boolean {
  return hydrationStore.isHydrated.has(key);
}

export function dehydrateAll(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  hydrationStore.data.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// ============================================================================
// useKBHydration
// ============================================================================

export function useKBHydration<T>(
  config: KBHydrationConfig<T>
): KBHydrationReturn<T> {
  const {
    serverData,
    key,
    skip = false,
    validate,
    transform,
    fallback,
    mismatchStrategy = 'warn',
  } = config;

  const [state, setState] = useState<KBHydrationState<T>>(() => {
    // Check for existing hydration data
    const existingData = getHydrationData<T>(key);
    const initialData = existingData ?? serverData ?? fallback ?? null;
    
    return {
      data: initialData,
      isHydrated: !!existingData || skip,
      isHydrating: false,
      hydrationError: null,
      hasMismatch: false,
    };
  });

  const hydrate = useCallback((data: T) => {
    setState(prev => ({ ...prev, isHydrating: true }));

    try {
      // Validate data if validator provided
      if (validate && !validate(data)) {
        throw new Error(`Hydration validation failed for key: ${key}`);
      }

      // Transform data if transformer provided
      const finalData = transform ? transform(data) : data;

      // Check for mismatch with existing data
      const existingData = getHydrationData<T>(key);
      if (existingData !== undefined) {
        const existingJson = JSON.stringify(existingData);
        const newJson = JSON.stringify(finalData);
        
        if (existingJson !== newJson) {
          const hasMismatch = true;
          
          switch (mismatchStrategy) {
            case 'error':
              throw new Error(`Hydration mismatch for key: ${key}`);
            case 'warn':
              console.warn(`Hydration mismatch for key: ${key}`, { existing: existingData, new: finalData });
              break;
            case 'revalidate':
              // Will trigger rehydration
              break;
            case 'silent':
            default:
              break;
          }

          setState(prev => ({ ...prev, hasMismatch }));
        }
      }

      setHydrationData(key, finalData);
      markHydrated(key);

      setState({
        data: finalData,
        isHydrated: true,
        isHydrating: false,
        hydrationError: null,
        hasMismatch: false,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isHydrating: false,
        hydrationError: error instanceof Error ? error : new Error(String(error)),
        data: fallback ?? null,
      }));
    }
  }, [key, validate, transform, fallback, mismatchStrategy]);

  const rehydrate = useCallback(async () => {
    const existingData = getHydrationData<T>(key);
    if (existingData) {
      hydrate(existingData);
    }
  }, [key, hydrate]);

  const dehydrate = useCallback((): string => {
    return JSON.stringify(state.data);
  }, [state.data]);

  const setData = useCallback((data: T | ((prev: T | null) => T)) => {
    setState(prev => {
      const newData = typeof data === 'function' 
        ? (data as (prev: T | null) => T)(prev.data) 
        : data;
      
      setHydrationData(key, newData);
      
      return { ...prev, data: newData };
    });
  }, [key]);

  // Initial hydration from serverData
  useEffect(() => {
    if (!skip && serverData !== undefined && !isHydrated(key)) {
      hydrate(serverData);
    }
  }, [skip, serverData, key, hydrate]);

  return {
    state,
    hydrate,
    rehydrate,
    dehydrate,
    setData,
  };
}

// ============================================================================
// useKBIsomorphic
// ============================================================================

export function useKBIsomorphic() {
  const [isClient, setIsClient] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
  }, []);

  const isServer = !isClient;
  const canUseDOM = isClient && typeof window !== 'undefined';
  const canUseWorkers = canUseDOM && typeof Worker !== 'undefined';
  const canUseServiceWorker = canUseDOM && 'serviceWorker' in navigator;

  return {
    isClient,
    isServer,
    isMounted,
    canUseDOM,
    canUseWorkers,
    canUseServiceWorker,
  };
}

// ============================================================================
// useKBClientOnly
// ============================================================================

export function useKBClientOnly<T>(
  clientValue: T | (() => T),
  serverValue?: T
): T | undefined {
  const { isClient } = useKBIsomorphic();
  const [value, setValue] = useState<T | undefined>(serverValue);

  useEffect(() => {
    if (isClient) {
      setValue(typeof clientValue === 'function' 
        ? (clientValue as () => T)() 
        : clientValue
      );
    }
  }, [isClient, clientValue]);

  return value;
}

// ============================================================================
// useKBSSRSafe
// ============================================================================

export function useKBSSRSafe<T>(
  effect: () => T,
  dependencies: unknown[] = [],
  fallback?: T
): T | undefined {
  const [value, setValue] = useState<T | undefined>(fallback);
  const { isClient } = useKBIsomorphic();

  useEffect(() => {
    if (isClient) {
      setValue(effect());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, ...dependencies]);

  return value;
}

// ============================================================================
// useKBHydratedState
// ============================================================================

export function useKBHydratedState<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    storage?: 'localStorage' | 'sessionStorage';
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    storage = 'localStorage',
  } = options;

  const { isClient } = useKBIsomorphic();

  const [state, setState] = useState<T>(() => {
    // Check hydration store first
    const hydrated = getHydrationData<T>(key);
    if (hydrated !== undefined) return hydrated;
    
    // On server, return initial value
    if (typeof window === 'undefined') return initialValue;
    
    // On client, try to load from storage
    try {
      const stored = window[storage].getItem(key);
      if (stored) {
        return deserialize(stored);
      }
    } catch {
      // Ignore storage errors
    }
    
    return initialValue;
  });

  // Persist to storage on change
  useEffect(() => {
    if (isClient) {
      try {
        window[storage].setItem(key, serialize(state));
        setHydrationData(key, state);
      } catch {
        // Ignore storage errors
      }
    }
  }, [isClient, key, state, serialize, storage]);

  return [state, setState] as const;
}

// ============================================================================
// useKBDeferred
// ============================================================================

export function useKBDeferred<T>(value: T, delay = 0): T {
  const [deferredValue, setDeferredValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return deferredValue;
}

// ============================================================================
// useKBWindowEvent
// ============================================================================

export function useKBWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eventListener = (event: WindowEventMap[K]) => savedHandler.current(event);
    window.addEventListener(type, eventListener, options);
    
    return () => {
      window.removeEventListener(type, eventListener, options);
    };
  }, [type, options]);
}

// ============================================================================
// useKBMediaQuery
// ============================================================================

export function useKBMediaQuery(query: string, defaultValue = false): boolean {
  const getMatches = useCallback(() => {
    if (typeof window === 'undefined') return defaultValue;
    return window.matchMedia(query).matches;
  }, [query, defaultValue]);

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    const handleChange = () => setMatches(mediaQuery.matches);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query]);

  return matches;
}

// ============================================================================
// useKBPrefersDarkMode
// ============================================================================

export function useKBPrefersDarkMode(): boolean {
  return useKBMediaQuery('(prefers-color-scheme: dark)');
}

// ============================================================================
// useKBPrefersReducedMotion
// ============================================================================

export function useKBPrefersReducedMotion(): boolean {
  return useKBMediaQuery('(prefers-reduced-motion: reduce)');
}

// ============================================================================
// useKBDocumentVisibility
// ============================================================================

export function useKBDocumentVisibility(): DocumentVisibilityState {
  const getVisibility = useCallback(() => {
    if (typeof document === 'undefined') return 'visible';
    return document.visibilityState;
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    if (typeof document === 'undefined') return () => {};
    
    document.addEventListener('visibilitychange', callback);
    return () => document.removeEventListener('visibilitychange', callback);
  }, []);

  return useSyncExternalStore(subscribe, getVisibility, () => 'visible');
}

// ============================================================================
// useKBNetworkStatus
// ============================================================================

export interface KBNetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useKBNetworkStatus(): KBNetworkStatus {
  const [status, setStatus] = useState<KBNetworkStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = () => {
      const connection = (navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
          saveData?: boolean;
        };
      }).connection;

      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      });
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = (navigator as Navigator & {
      connection?: EventTarget;
    }).connection;
    
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}

// ============================================================================
// useKBScrollRestoration
// ============================================================================

export function useKBScrollRestoration(key: string) {
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore scroll position
    const saved = sessionStorage.getItem(`scroll_${key}`);
    if (saved) {
      const position = parseInt(saved, 10);
      requestAnimationFrame(() => {
        window.scrollTo(0, position);
      });
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Save position before unload
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll_${key}`, String(scrollPositionRef.current));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionStorage.setItem(`scroll_${key}`, String(scrollPositionRef.current));
    };
  }, [key]);

  const savePosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`scroll_${key}`, String(window.scrollY));
    }
  }, [key]);

  const restorePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const saved = sessionStorage.getItem(`scroll_${key}`);
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }
  }, [key]);

  return {
    savePosition,
    restorePosition,
  };
}

// ============================================================================
// SSR Script Component Helper
// ============================================================================

export function createHydrationScript(data: Record<string, unknown>): string {
  return `<script>window.__HYDRATION_DATA__=${JSON.stringify(data)};</script>`;
}

export default useKBHydration;
