/**
 * @fileoverview useKBGraphQL - GraphQL Query & Mutation Hook
 * @description Enterprise GraphQL client with caching, batching, and subscriptions
 * @version 1.0.0
 * @phase 20 - Advanced Data Patterns
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type OperationType = 'query' | 'mutation' | 'subscription';

export interface GraphQLVariable {
  name: string;
  type: string;
  value: unknown;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLOperation<TData = unknown, TVariables = Record<string, unknown>> {
  id: string;
  query: string;
  variables?: TVariables;
  operationType: OperationType;
  operationName?: string;
  timestamp: number;
  result?: GraphQLResponse<TData>;
  status: 'pending' | 'success' | 'error' | 'cancelled';
  duration?: number;
}

export interface BatchConfig {
  enabled: boolean;
  maxSize: number;
  windowMs: number;
  deduplicateQueries: boolean;
}

export interface CachePolicy {
  type: 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'cache-and-network';
  maxAge: number;
  staleWhileRevalidate: boolean;
}

export interface GraphQLConfig {
  endpoint: string;
  headers?: Record<string, string>;
  batch?: Partial<BatchConfig>;
  cache?: Partial<CachePolicy>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onError?: (errors: GraphQLError[]) => void;
  onSuccess?: (data: unknown) => void;
}

export interface QueryOptions<TVariables = Record<string, unknown>> {
  variables?: TVariables;
  skip?: boolean;
  pollInterval?: number;
  cachePolicy?: CachePolicy['type'];
  context?: Record<string, unknown>;
  onCompleted?: (data: unknown) => void;
  onError?: (errors: GraphQLError[]) => void;
}

export interface MutationOptions<TVariables = Record<string, unknown>> {
  variables?: TVariables;
  optimisticResponse?: unknown;
  refetchQueries?: string[];
  awaitRefetchQueries?: boolean;
  context?: Record<string, unknown>;
  onCompleted?: (data: unknown) => void;
  onError?: (errors: GraphQLError[]) => void;
}

export interface SubscriptionOptions<TVariables = Record<string, unknown>> {
  variables?: TVariables;
  onData?: (data: unknown) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export interface GraphQLMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  cacheHits: number;
  cacheMisses: number;
  averageLatency: number;
  batchedOperations: number;
  activeSubscriptions: number;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  expiresAt: number;
  variables?: Record<string, unknown>;
}

interface BatchedQuery {
  id: string;
  query: string;
  variables?: Record<string, unknown>;
  resolve: (value: GraphQLResponse) => void;
  reject: (error: Error) => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  enabled: true,
  maxSize: 10,
  windowMs: 10,
  deduplicateQueries: true,
};

const DEFAULT_CACHE_POLICY: CachePolicy = {
  type: 'cache-first',
  maxAge: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
};

const DEFAULT_CONFIG: GraphQLConfig = {
  endpoint: '/graphql',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCacheKey(query: string, variables?: Record<string, unknown>): string {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  const variablesKey = variables ? JSON.stringify(variables) : '';
  return `gql:${normalizedQuery}:${variablesKey}`;
}

function extractOperationName(query: string): string | undefined {
  const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
  return match?.[1];
}

function extractOperationType(query: string): OperationType {
  if (query.trim().startsWith('mutation')) return 'mutation';
  if (query.trim().startsWith('subscription')) return 'subscription';
  return 'query';
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

const queryCache = new Map<string, CacheEntry>();
const activeSubscriptions = new Map<string, WebSocket>();
const pendingBatches = new Map<string, BatchedQuery[]>();
let batchTimeout: NodeJS.Timeout | null = null;

// ============================================================================
// MAIN HOOK: useKBGraphQL
// ============================================================================

export function useKBGraphQL<TData = unknown>(config: GraphQLConfig) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GraphQLError[] | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const [metrics, setMetrics] = useState<GraphQLMetrics>({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLatency: 0,
    batchedOperations: 0,
    activeSubscriptions: 0,
  });

  const configRef = useRef(config);
  const abortControllerRef = useRef<AbortController | null>(null);
  const operationsRef = useRef<GraphQLOperation[]>([]);
  const latenciesRef = useRef<number[]>([]);
  const isMountedRef = useRef(true);

  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
    batch: { ...DEFAULT_BATCH_CONFIG, ...config.batch },
    cache: { ...DEFAULT_CACHE_POLICY, ...config.cache },
  }), [config]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Update config ref
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Execute single operation
  const executeOperation = useCallback(async <T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ): Promise<GraphQLResponse<T>> => {
    const startTime = Date.now();

    try {
      const response = await fetch(mergedConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...mergedConfig.headers,
        },
        body: JSON.stringify({
          query,
          variables,
          operationName: extractOperationName(query),
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();
      const duration = Date.now() - startTime;

      // Update latencies for metrics
      latenciesRef.current.push(duration);
      if (latenciesRef.current.length > 100) {
        latenciesRef.current.shift();
      }

      return result;
    } catch (err) {
      throw err;
    }
  }, [mergedConfig]);

  // Execute with retry
  const executeWithRetry = useCallback(async <T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
    retries = mergedConfig.retries || 3
  ): Promise<GraphQLResponse<T>> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        abortControllerRef.current = new AbortController();
        
        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, mergedConfig.timeout);

        const result = await executeOperation<T>(
          query,
          variables,
          { signal: abortControllerRef.current.signal }
        );

        clearTimeout(timeoutId);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        if (attempt < retries) {
          await new Promise(resolve => 
            setTimeout(resolve, (mergedConfig.retryDelay || 1000) * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError;
  }, [executeOperation, mergedConfig]);

  // Check cache
  const checkCache = useCallback((
    query: string,
    variables?: Record<string, unknown>
  ): CacheEntry | null => {
    const cacheKey = generateCacheKey(query, variables);
    const entry = queryCache.get(cacheKey);

    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      queryCache.delete(cacheKey);
      return null;
    }

    return entry;
  }, []);

  // Set cache
  const setCache = useCallback((
    query: string,
    variables: Record<string, unknown> | undefined,
    data: unknown
  ) => {
    const cacheKey = generateCacheKey(query, variables);
    const maxAge = mergedConfig.cache?.maxAge || DEFAULT_CACHE_POLICY.maxAge;
    
    queryCache.set(cacheKey, {
      data,
      variables,
      timestamp: Date.now(),
      expiresAt: Date.now() + maxAge,
    });
  }, [mergedConfig.cache]);

  // Query
  const query = useCallback(async <T = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    queryString: string,
    options?: QueryOptions<TVariables>
  ): Promise<GraphQLResponse<T>> => {
    if (options?.skip) {
      return { data: undefined };
    }

    const operationId = generateOperationId();
    const cachePolicy = options?.cachePolicy || mergedConfig.cache?.type || 'cache-first';

    // Check cache for cache-first policies
    if (cachePolicy === 'cache-first' || cachePolicy === 'cache-only') {
      const cached = checkCache(queryString, options?.variables as Record<string, unknown>);
      if (cached) {
        if (isMountedRef.current) {
          setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
        }
        return { data: cached.data as T };
      }

      if (cachePolicy === 'cache-only') {
        return { data: undefined };
      }
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
      setMetrics(prev => ({ 
        ...prev, 
        cacheMisses: prev.cacheMisses + 1,
        totalOperations: prev.totalOperations + 1 
      }));
    }

    try {
      const result = await executeWithRetry<T>(queryString, options?.variables as Record<string, unknown>);

      if (result.errors?.length) {
        if (isMountedRef.current) {
          setError(result.errors);
          setMetrics(prev => ({ ...prev, failedOperations: prev.failedOperations + 1 }));
        }
        options?.onError?.(result.errors);
        mergedConfig.onError?.(result.errors);
      } else {
        // Cache successful results
        if (result.data && cachePolicy !== 'network-only') {
          setCache(queryString, options?.variables as Record<string, unknown>, result.data);
        }

        if (isMountedRef.current) {
          setData(result.data as TData);
          setMetrics(prev => ({ ...prev, successfulOperations: prev.successfulOperations + 1 }));
        }
        options?.onCompleted?.(result.data);
        mergedConfig.onSuccess?.(result.data);
      }

      return result;
    } catch (err) {
      const error: GraphQLError = {
        message: err instanceof Error ? err.message : String(err),
      };

      if (isMountedRef.current) {
        setError([error]);
        setMetrics(prev => ({ ...prev, failedOperations: prev.failedOperations + 1 }));
      }
      options?.onError?.([error]);
      
      return { errors: [error] };
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [mergedConfig, checkCache, setCache, executeWithRetry]);

  // Mutation
  const mutate = useCallback(async <T = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    mutationString: string,
    options?: MutationOptions<TVariables>
  ): Promise<GraphQLResponse<T>> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
      setMetrics(prev => ({ ...prev, totalOperations: prev.totalOperations + 1 }));
    }

    // Handle optimistic response
    if (options?.optimisticResponse) {
      if (isMountedRef.current) {
        setData(options.optimisticResponse as TData);
      }
    }

    try {
      const result = await executeWithRetry<T>(mutationString, options?.variables as Record<string, unknown>);

      if (result.errors?.length) {
        if (isMountedRef.current) {
          setError(result.errors);
          setMetrics(prev => ({ ...prev, failedOperations: prev.failedOperations + 1 }));
        }
        options?.onError?.(result.errors);
        mergedConfig.onError?.(result.errors);
      } else {
        // Invalidate related caches if refetchQueries specified
        if (options?.refetchQueries?.length) {
          for (const queryName of options.refetchQueries) {
            for (const [key] of queryCache) {
              if (key.includes(queryName)) {
                queryCache.delete(key);
              }
            }
          }
        }

        if (isMountedRef.current) {
          setData(result.data as TData);
          setMetrics(prev => ({ ...prev, successfulOperations: prev.successfulOperations + 1 }));
        }
        options?.onCompleted?.(result.data);
        mergedConfig.onSuccess?.(result.data);
      }

      return result;
    } catch (err) {
      // Rollback optimistic update
      if (options?.optimisticResponse && isMountedRef.current) {
        setData(null);
      }

      const error: GraphQLError = {
        message: err instanceof Error ? err.message : String(err),
      };

      if (isMountedRef.current) {
        setError([error]);
        setMetrics(prev => ({ ...prev, failedOperations: prev.failedOperations + 1 }));
      }
      options?.onError?.([error]);
      
      return { errors: [error] };
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [mergedConfig, executeWithRetry]);

  // Subscribe
  const subscribe = useCallback(<T = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    subscriptionString: string,
    options?: SubscriptionOptions<TVariables>
  ): () => void => {
    const subscriptionId = generateOperationId();
    const wsEndpoint = mergedConfig.endpoint.replace(/^http/, 'ws');

    try {
      const ws = new WebSocket(wsEndpoint, 'graphql-ws');

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'connection_init',
          payload: mergedConfig.headers || {},
        }));

        ws.send(JSON.stringify({
          id: subscriptionId,
          type: 'start',
          payload: {
            query: subscriptionString,
            variables: options?.variables,
          },
        }));

        activeSubscriptions.set(subscriptionId, ws);
        if (isMountedRef.current) {
          setMetrics(prev => ({ ...prev, activeSubscriptions: prev.activeSubscriptions + 1 }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'data' && message.id === subscriptionId) {
            options?.onData?.(message.payload.data);
            if (isMountedRef.current) {
              setData(message.payload.data as TData);
            }
          } else if (message.type === 'complete') {
            options?.onComplete?.();
          } else if (message.type === 'error') {
            options?.onError?.(new Error(message.payload?.message || 'Subscription error'));
          }
        } catch (err) {
          console.error('[useKBGraphQL] Message parse error:', err);
        }
      };

      ws.onerror = (event) => {
        options?.onError?.(new Error('WebSocket error'));
      };

      ws.onclose = () => {
        activeSubscriptions.delete(subscriptionId);
        if (isMountedRef.current) {
          setMetrics(prev => ({ 
            ...prev, 
            activeSubscriptions: Math.max(0, prev.activeSubscriptions - 1) 
          }));
        }
      };

      // Return unsubscribe function
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            id: subscriptionId,
            type: 'stop',
          }));
        }
        ws.close();
        activeSubscriptions.delete(subscriptionId);
      };
    } catch (err) {
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
      return () => {};
    }
  }, [mergedConfig]);

  // Clear cache
  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      for (const [key] of queryCache) {
        if (key.includes(pattern)) {
          queryCache.delete(key);
        }
      }
    } else {
      queryCache.clear();
    }
  }, []);

  // Refetch
  const refetch = useCallback(async <T = unknown>(
    queryString: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse<T>> => {
    // Clear cache for this query
    const cacheKey = generateCacheKey(queryString, variables);
    queryCache.delete(cacheKey);

    // Execute fresh query
    return query<T>(queryString, { 
      variables: variables as Record<string, unknown>, 
      cachePolicy: 'network-only' 
    });
  }, [query]);

  // Cancel
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Get average latency
  const getAverageLatency = useCallback((): number => {
    if (latenciesRef.current.length === 0) return 0;
    const sum = latenciesRef.current.reduce((a, b) => a + b, 0);
    return Math.round(sum / latenciesRef.current.length);
  }, []);

  return {
    // State
    loading,
    error,
    data,
    metrics: {
      ...metrics,
      averageLatency: getAverageLatency(),
    },

    // Operations
    query,
    mutate,
    subscribe,

    // Cache
    clearCache,
    checkCache,

    // Utils
    refetch,
    cancel,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * useKBQuery - Simplified query hook
 */
export function useKBQuery<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  endpoint: string,
  queryString: string,
  options?: QueryOptions<TVariables> & { headers?: Record<string, string> }
) {
  const { query, loading, error, data, refetch, cancel } = useKBGraphQL<TData>({
    endpoint,
    headers: options?.headers,
  });

  useEffect(() => {
    if (!options?.skip) {
      query(queryString, options);
    }
  }, [queryString, JSON.stringify(options?.variables), options?.skip]);

  return {
    loading,
    error,
    data,
    refetch: () => refetch<TData>(queryString, options?.variables as Record<string, unknown>),
    cancel,
  };
}

/**
 * useKBMutationGQL - Simplified mutation hook
 */
export function useKBMutationGQL<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  endpoint: string,
  mutationString: string,
  baseOptions?: MutationOptions<TVariables> & { headers?: Record<string, string> }
) {
  const { mutate, loading, error, data, cancel } = useKBGraphQL<TData>({
    endpoint,
    headers: baseOptions?.headers,
  });

  const executeMutation = useCallback((
    options?: MutationOptions<TVariables>
  ) => {
    return mutate<TData, TVariables>(mutationString, {
      ...baseOptions,
      ...options,
      variables: { ...baseOptions?.variables, ...options?.variables } as TVariables,
    });
  }, [mutate, mutationString, baseOptions]);

  return {
    mutate: executeMutation,
    loading,
    error,
    data,
    cancel,
  };
}

/**
 * useKBSubscriptionGQL - Simplified subscription hook
 */
export function useKBSubscriptionGQL<TData = unknown, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  endpoint: string,
  subscriptionString: string,
  options?: SubscriptionOptions<TVariables> & { headers?: Record<string, string>; skip?: boolean }
) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const { subscribe } = useKBGraphQL<TData>({
    endpoint,
    headers: options?.headers,
  });

  useEffect(() => {
    if (options?.skip) return;

    unsubscribeRef.current = subscribe(subscriptionString, {
      ...options,
      onData: (newData) => {
        setData(newData as TData);
        setConnected(true);
        options?.onData?.(newData);
      },
      onError: (err) => {
        setError(err);
        setConnected(false);
        options?.onError?.(err);
      },
      onComplete: () => {
        setConnected(false);
        options?.onComplete?.();
      },
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [subscriptionString, JSON.stringify(options?.variables), options?.skip]);

  return {
    data,
    error,
    connected,
    unsubscribe: () => unsubscribeRef.current?.(),
  };
}

export default useKBGraphQL;
