/**
 * KB 4.5 - Request Cancellation Hooks
 * 
 * Hooks for managing request cancellation with AbortController.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBCancellationToken {
  id: string;
  abortController: AbortController;
  signal: AbortSignal;
  isCancelled: boolean;
  reason?: string;
  createdAt: Date;
  cancelledAt?: Date;
}

export interface KBCancellationConfig {
  /** Timeout in milliseconds (0 = no timeout) */
  timeout?: number;
  /** Cancel on component unmount */
  cancelOnUnmount?: boolean;
  /** Maximum concurrent requests */
  maxConcurrent?: number;
  /** Cancel previous on new request */
  cancelPrevious?: boolean;
}

export interface KBCancellationState {
  activeRequests: number;
  cancelledRequests: number;
  tokens: Map<string, KBCancellationToken>;
}

export interface KBCancellationReturn {
  state: KBCancellationState;
  createToken: (id?: string) => KBCancellationToken;
  cancel: (id: string, reason?: string) => boolean;
  cancelAll: (reason?: string) => void;
  isActive: (id: string) => boolean;
  isCancelled: (id: string) => boolean;
  getToken: (id: string) => KBCancellationToken | undefined;
  cleanup: (id: string) => void;
  withCancellation: <T>(
    fn: (signal: AbortSignal) => Promise<T>,
    id?: string
  ) => Promise<T>;
}

// ============================================================================
// CANCELLATION ERROR
// ============================================================================

export class KBCancellationError extends Error {
  constructor(
    message: string = 'Request was cancelled',
    public readonly reason?: string,
    public readonly tokenId?: string
  ) {
    super(message);
    this.name = 'KBCancellationError';
  }

  static isCancellationError(error: unknown): error is KBCancellationError {
    return error instanceof KBCancellationError || 
           (error instanceof Error && error.name === 'AbortError');
  }
}

// ============================================================================
// useKBCancellation
// ============================================================================

const DEFAULT_CONFIG: Required<KBCancellationConfig> = {
  timeout: 0,
  cancelOnUnmount: true,
  maxConcurrent: Infinity,
  cancelPrevious: false,
};

export function useKBCancellation(config: KBCancellationConfig = {}): KBCancellationReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<KBCancellationState>({
    activeRequests: 0,
    cancelledRequests: 0,
    tokens: new Map(),
  });

  const tokensRef = useRef<Map<string, KBCancellationToken>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const createToken = useCallback((id?: string): KBCancellationToken => {
    const tokenId = id || `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cancel previous if configured
    if (mergedConfig.cancelPrevious && id) {
      const existing = tokensRef.current.get(id);
      if (existing && !existing.isCancelled) {
        existing.abortController.abort('Replaced by new request');
        existing.isCancelled = true;
        existing.cancelledAt = new Date();
      }
    }

    // Check max concurrent
    const activeCount = Array.from(tokensRef.current.values())
      .filter(t => !t.isCancelled).length;
    
    if (activeCount >= mergedConfig.maxConcurrent) {
      // Cancel oldest active request
      const oldest = Array.from(tokensRef.current.entries())
        .filter(([, t]) => !t.isCancelled)
        .sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime())[0];
      
      if (oldest) {
        oldest[1].abortController.abort('Max concurrent exceeded');
        oldest[1].isCancelled = true;
        oldest[1].cancelledAt = new Date();
      }
    }

    const abortController = new AbortController();
    
    const token: KBCancellationToken = {
      id: tokenId,
      abortController,
      signal: abortController.signal,
      isCancelled: false,
      createdAt: new Date(),
    };

    tokensRef.current.set(tokenId, token);

    // Set timeout if configured
    if (mergedConfig.timeout > 0) {
      const timeoutId = setTimeout(() => {
        if (!token.isCancelled) {
          token.abortController.abort('Timeout');
          token.isCancelled = true;
          token.reason = 'Timeout';
          token.cancelledAt = new Date();
          updateState();
        }
      }, mergedConfig.timeout);
      
      timeoutsRef.current.set(tokenId, timeoutId);
    }

    updateState();
    return token;
  }, [mergedConfig.cancelPrevious, mergedConfig.maxConcurrent, mergedConfig.timeout]);

  const updateState = useCallback(() => {
    const tokens = new Map(tokensRef.current);
    const activeRequests = Array.from(tokens.values()).filter(t => !t.isCancelled).length;
    const cancelledRequests = Array.from(tokens.values()).filter(t => t.isCancelled).length;
    
    setState({ tokens, activeRequests, cancelledRequests });
  }, []);

  const cancel = useCallback((id: string, reason?: string): boolean => {
    const token = tokensRef.current.get(id);
    if (!token || token.isCancelled) return false;

    token.abortController.abort(reason);
    token.isCancelled = true;
    token.reason = reason;
    token.cancelledAt = new Date();

    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    updateState();
    return true;
  }, [updateState]);

  const cancelAll = useCallback((reason?: string) => {
    tokensRef.current.forEach((token, id) => {
      if (!token.isCancelled) {
        token.abortController.abort(reason);
        token.isCancelled = true;
        token.reason = reason;
        token.cancelledAt = new Date();
      }

      const timeout = timeoutsRef.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
      }
    });
    
    timeoutsRef.current.clear();
    updateState();
  }, [updateState]);

  const isActive = useCallback((id: string): boolean => {
    const token = tokensRef.current.get(id);
    return token ? !token.isCancelled : false;
  }, []);

  const isCancelled = useCallback((id: string): boolean => {
    const token = tokensRef.current.get(id);
    return token?.isCancelled ?? false;
  }, []);

  const getToken = useCallback((id: string): KBCancellationToken | undefined => {
    return tokensRef.current.get(id);
  }, []);

  const cleanup = useCallback((id: string) => {
    tokensRef.current.delete(id);
    
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    updateState();
  }, [updateState]);

  const withCancellation = useCallback(async <T>(
    fn: (signal: AbortSignal) => Promise<T>,
    id?: string
  ): Promise<T> => {
    const token = createToken(id);
    
    try {
      const result = await fn(token.signal);
      cleanup(token.id);
      return result;
    } catch (error) {
      cleanup(token.id);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new KBCancellationError(error.message, token.reason, token.id);
      }
      throw error;
    }
  }, [createToken, cleanup]);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (mergedConfig.cancelOnUnmount) {
        cancelAll('Component unmounted');
      }
    };
  }, [mergedConfig.cancelOnUnmount, cancelAll]);

  return {
    state,
    createToken,
    cancel,
    cancelAll,
    isActive,
    isCancelled,
    getToken,
    cleanup,
    withCancellation,
  };
}

// ============================================================================
// useKBAbortableFetch
// ============================================================================

export interface KBAbortableFetchConfig extends KBCancellationConfig {
  retryOnAbort?: boolean;
  maxRetries?: number;
}

export function useKBAbortableFetch(config: KBAbortableFetchConfig = {}) {
  const { retryOnAbort = false, maxRetries = 3, ...cancellationConfig } = config;
  
  const cancellation = useKBCancellation(cancellationConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);

  const fetchWithAbort = useCallback(async <T>(
    url: string,
    options?: RequestInit,
    id?: string
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await cancellation.withCancellation(async (signal) => {
        const response = await fetch(url, { ...options, signal });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json() as Promise<T>;
      }, id);

      retryCountRef.current = 0;
      return result;
    } catch (err) {
      if (KBCancellationError.isCancellationError(err)) {
        if (retryOnAbort && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          return fetchWithAbort(url, options, id);
        }
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [cancellation, retryOnAbort, maxRetries]);

  return {
    ...cancellation,
    isLoading,
    error,
    fetch: fetchWithAbort,
  };
}

// ============================================================================
// useKBRaceCondition
// ============================================================================

export function useKBRaceCondition<T>() {
  const latestRequestIdRef = useRef<string | null>(null);
  const pendingRef = useRef<Map<string, AbortController>>(new Map());

  const race = useCallback(async <R>(
    fn: (signal: AbortSignal) => Promise<R>
  ): Promise<R | null> => {
    // Cancel previous requests
    pendingRef.current.forEach((controller) => {
      controller.abort('Superseded by newer request');
    });
    pendingRef.current.clear();

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const controller = new AbortController();
    
    latestRequestIdRef.current = requestId;
    pendingRef.current.set(requestId, controller);

    try {
      const result = await fn(controller.signal);
      
      // Only return result if this is still the latest request
      if (latestRequestIdRef.current === requestId) {
        return result;
      }
      
      return null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      throw error;
    } finally {
      pendingRef.current.delete(requestId);
    }
  }, []);

  const cancelAll = useCallback(() => {
    pendingRef.current.forEach((controller) => {
      controller.abort('Manually cancelled');
    });
    pendingRef.current.clear();
    latestRequestIdRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAll();
  }, [cancelAll]);

  return {
    race,
    cancelAll,
    hasPending: pendingRef.current.size > 0,
  };
}

// ============================================================================
// useKBDebounceCancel
// ============================================================================

export function useKBDebounceCancel<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Debounced');
    }

    setIsDebouncing(true);

    return new Promise<ReturnType<T>>((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        setIsDebouncing(false);
        setIsPending(true);
        
        abortControllerRef.current = new AbortController();

        try {
          const result = await fn(...args);
          resolve(result as ReturnType<T>);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Silently ignore abort errors
            return;
          }
          reject(error);
        } finally {
          setIsPending(false);
        }
      }, delay);
    });
  }, [fn, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Cancelled');
      abortControllerRef.current = null;
    }
    setIsDebouncing(false);
    setIsPending(false);
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsDebouncing(false);
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    fn: debouncedFn,
    cancel,
    flush,
    isDebouncing,
    isPending,
    signal: abortControllerRef.current?.signal,
  };
}

// ============================================================================
// useKBSequentialCancel
// ============================================================================

export function useKBSequentialCancel() {
  const queueRef = useRef<Array<{
    id: string;
    fn: (signal: AbortSignal) => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    controller: AbortController;
  }>>([]);
  
  const isProcessingRef = useRef(false);
  const [queueLength, setQueueLength] = useState(0);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;
    
    isProcessingRef.current = true;

    while (queueRef.current.length > 0) {
      const item = queueRef.current[0];
      
      try {
        const result = await item.fn(item.controller.signal);
        item.resolve(result);
      } catch (error) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
      
      queueRef.current.shift();
      setQueueLength(queueRef.current.length);
    }

    isProcessingRef.current = false;
  }, []);

  const enqueue = useCallback(<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    id?: string
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      
      queueRef.current.push({
        id: id || `seq_${Date.now()}`,
        fn: fn as (signal: AbortSignal) => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        controller,
      });
      
      setQueueLength(queueRef.current.length);
      processQueue();
    });
  }, [processQueue]);

  const cancel = useCallback((id: string) => {
    const index = queueRef.current.findIndex(item => item.id === id);
    if (index === -1) return false;

    const item = queueRef.current[index];
    item.controller.abort('Cancelled');
    item.reject(new KBCancellationError('Request cancelled', 'Cancelled', id));
    queueRef.current.splice(index, 1);
    setQueueLength(queueRef.current.length);
    
    return true;
  }, []);

  const cancelAll = useCallback(() => {
    queueRef.current.forEach(item => {
      item.controller.abort('All cancelled');
      item.reject(new KBCancellationError('All requests cancelled'));
    });
    queueRef.current = [];
    setQueueLength(0);
  }, []);

  useEffect(() => {
    return () => cancelAll();
  }, [cancelAll]);

  return {
    enqueue,
    cancel,
    cancelAll,
    queueLength,
    isProcessing: isProcessingRef.current,
  };
}

// ============================================================================
// useKBCancellablePromise
// ============================================================================

export function useKBCancellablePromise() {
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const makeCancellable = useCallback(<T>(
    promise: Promise<T>,
    id?: string
  ): { promise: Promise<T>; cancel: () => void } => {
    const promiseId = id || `promise_${Date.now()}`;
    const controller = new AbortController();
    
    abortControllersRef.current.set(promiseId, controller);

    const wrappedPromise = new Promise<T>((resolve, reject) => {
      controller.signal.addEventListener('abort', () => {
        reject(new KBCancellationError('Promise cancelled', undefined, promiseId));
      });

      promise
        .then((result) => {
          if (!controller.signal.aborted) {
            resolve(result);
          }
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            reject(error);
          }
        })
        .finally(() => {
          abortControllersRef.current.delete(promiseId);
        });
    });

    return {
      promise: wrappedPromise,
      cancel: () => controller.abort(),
    };
  }, []);

  const cancelAll = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => cancelAll();
  }, [cancelAll]);

  return {
    makeCancellable,
    cancelAll,
    activeCount: abortControllersRef.current.size,
  };
}

export default useKBCancellation;
