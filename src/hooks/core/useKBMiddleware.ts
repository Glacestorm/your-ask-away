/**
 * KB 4.5 - Phase 9: Middleware & Interceptors
 * 
 * Features:
 * - Request Interceptors
 * - Response Interceptors
 * - Error Interceptors
 * - Auth Token Injection
 * - Retry Middleware
 * - Logging Middleware
 * - Caching Middleware
 * - Composable Middleware Chains
 * - Rate Limiting
 * - Request Deduplication
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { KBError } from './types';
import { createKBError } from './useKBBase';

// ============================================================================
// Types
// ============================================================================

export interface MiddlewareContext<T = unknown> {
  id: string;
  timestamp: Date;
  hookName: string;
  operation: 'query' | 'mutation' | 'stream';
  attempt: number;
  metadata: Record<string, unknown>;
  signal?: AbortSignal;
  cache?: Map<string, unknown>;
}

export interface RequestContext<TInput = unknown> extends MiddlewareContext {
  input: TInput;
  headers?: Record<string, string>;
  url?: string;
  method?: string;
}

export interface ResponseContext<TOutput = unknown> extends MiddlewareContext {
  output: TOutput;
  duration: number;
  fromCache?: boolean;
  status?: number;
}

export interface ErrorContext extends MiddlewareContext {
  error: KBError;
  shouldRetry: boolean;
  retryDelay: number;
}

export type NextFunction<T = unknown> = () => Promise<T>;

export type RequestInterceptor<TInput = unknown> = (
  context: RequestContext<TInput>,
  next: NextFunction<RequestContext<TInput>>
) => Promise<RequestContext<TInput>>;

export type ResponseInterceptor<TOutput = unknown> = (
  context: ResponseContext<TOutput>,
  next: NextFunction<ResponseContext<TOutput>>
) => Promise<ResponseContext<TOutput>>;

export type ErrorInterceptor = (
  context: ErrorContext,
  next: NextFunction<ErrorContext>
) => Promise<ErrorContext>;

export interface MiddlewareConfig {
  name: string;
  enabled?: boolean;
  order?: number;
  requestInterceptor?: RequestInterceptor;
  responseInterceptor?: ResponseInterceptor;
  errorInterceptor?: ErrorInterceptor;
}

export interface MiddlewareChainOptions {
  onError?: (error: KBError, context: MiddlewareContext) => void;
  onRequest?: (context: RequestContext) => void;
  onResponse?: (context: ResponseContext) => void;
}

// ============================================================================
// Middleware Chain
// ============================================================================

export class MiddlewareChain {
  private middlewares: MiddlewareConfig[] = [];
  private options: MiddlewareChainOptions;

  constructor(options: MiddlewareChainOptions = {}) {
    this.options = options;
  }

  use(middleware: MiddlewareConfig): this {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return this;
  }

  remove(name: string): this {
    this.middlewares = this.middlewares.filter(m => m.name !== name);
    return this;
  }

  clear(): this {
    this.middlewares = [];
    return this;
  }

  getMiddlewares(): MiddlewareConfig[] {
    return [...this.middlewares];
  }

  async executeRequest<TInput>(
    context: RequestContext<TInput>
  ): Promise<RequestContext<TInput>> {
    const enabledMiddlewares = this.middlewares.filter(
      m => m.enabled !== false && m.requestInterceptor
    );

    let index = 0;
    let currentContext = context;

    const next = async (): Promise<RequestContext<TInput>> => {
      if (index >= enabledMiddlewares.length) {
        return currentContext;
      }

      const middleware = enabledMiddlewares[index++];
      
      try {
        const result = await middleware.requestInterceptor!(
          currentContext as RequestContext<unknown>,
          next as NextFunction<RequestContext<unknown>>
        ) as RequestContext<TInput>;
        currentContext = result;
        this.options.onRequest?.(result as RequestContext<unknown>);
        return result;
      } catch (error) {
        throw error;
      }
    };

    return next();
  }

  async executeResponse<TOutput>(
    context: ResponseContext<TOutput>
  ): Promise<ResponseContext<TOutput>> {
    const enabledMiddlewares = this.middlewares
      .filter(m => m.enabled !== false && m.responseInterceptor)
      .reverse(); // Response interceptors run in reverse order

    let index = 0;
    let currentContext = context;

    const next = async (): Promise<ResponseContext<TOutput>> => {
      if (index >= enabledMiddlewares.length) {
        return currentContext;
      }

      const middleware = enabledMiddlewares[index++];
      
      try {
        const result = await middleware.responseInterceptor!(
          currentContext as ResponseContext<unknown>,
          next as NextFunction<ResponseContext<unknown>>
        ) as ResponseContext<TOutput>;
        currentContext = result;
        this.options.onResponse?.(result as ResponseContext<unknown>);
        return result;
      } catch (error) {
        throw error;
      }
    };

    return next();
  }

  async executeError(context: ErrorContext): Promise<ErrorContext> {
    const enabledMiddlewares = this.middlewares.filter(
      m => m.enabled !== false && m.errorInterceptor
    );

    let index = 0;

    const next = async (): Promise<ErrorContext> => {
      if (index >= enabledMiddlewares.length) {
        return context;
      }

      const middleware = enabledMiddlewares[index++];
      
      try {
        return await middleware.errorInterceptor!(context, next);
      } catch (error) {
        this.options.onError?.(context.error, context);
        throw error;
      }
    };

    return next();
  }
}

// ============================================================================
// Built-in Middlewares
// ============================================================================

/**
 * Logging Middleware - Logs all requests and responses
 */
export const createLoggingMiddleware = (options: {
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  logger?: (message: string, data?: unknown) => void;
} = {}): MiddlewareConfig => {
  const {
    logRequests = true,
    logResponses = true,
    logErrors = true,
    logger = console.log,
  } = options;

  return {
    name: 'logging',
    order: -100, // Run first
    requestInterceptor: async (context, next) => {
      if (logRequests) {
        logger(`[KB:Request] ${context.hookName}`, {
          id: context.id,
          operation: context.operation,
          input: context.input,
        });
      }
      return next();
    },
    responseInterceptor: async (context, next) => {
      if (logResponses) {
        logger(`[KB:Response] ${context.hookName}`, {
          id: context.id,
          duration: context.duration,
          fromCache: context.fromCache,
        });
      }
      return next();
    },
    errorInterceptor: async (context, next) => {
      if (logErrors) {
        logger(`[KB:Error] ${context.hookName}`, {
          id: context.id,
          error: context.error,
          attempt: context.attempt,
        });
      }
      return next();
    },
  };
};

/**
 * Auth Middleware - Injects authentication token
 */
export const createAuthMiddleware = (options: {
  getToken: () => string | null | Promise<string | null>;
  headerName?: string;
  tokenPrefix?: string;
  onTokenExpired?: () => void;
  refreshToken?: () => Promise<string | null>;
}): MiddlewareConfig => {
  const {
    getToken,
    headerName = 'Authorization',
    tokenPrefix = 'Bearer',
    onTokenExpired,
    refreshToken,
  } = options;

  return {
    name: 'auth',
    order: -50,
    requestInterceptor: async (context, next) => {
      const token = await getToken();
      
      if (token) {
        context.headers = {
          ...context.headers,
          [headerName]: tokenPrefix ? `${tokenPrefix} ${token}` : token,
        };
      }
      
      return next();
    },
    errorInterceptor: async (context, next) => {
      // Handle 401 errors
      if (context.error.code === 'UNAUTHORIZED' || context.error.code === '401') {
        if (refreshToken && context.attempt === 1) {
          const newToken = await refreshToken();
          if (newToken) {
            context.shouldRetry = true;
            context.retryDelay = 0;
            return next();
          }
        }
        onTokenExpired?.();
      }
      return next();
    },
  };
};

/**
 * Retry Middleware - Configurable retry logic
 */
export const createRetryMiddleware = (options: {
  maxRetries?: number;
  retryDelay?: number | ((attempt: number) => number);
  retryOn?: (error: KBError) => boolean;
  onRetry?: (attempt: number, error: KBError) => void;
} = {}): MiddlewareConfig => {
  const {
    maxRetries = 3,
    retryDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt - 1), 30000),
    retryOn = (error) => error.retryable,
    onRetry,
  } = options;

  return {
    name: 'retry',
    order: 0,
    errorInterceptor: async (context, next) => {
      if (context.attempt <= maxRetries && retryOn(context.error)) {
        context.shouldRetry = true;
        context.retryDelay = typeof retryDelay === 'function' 
          ? retryDelay(context.attempt) 
          : retryDelay;
        onRetry?.(context.attempt, context.error);
      }
      return next();
    },
  };
};

/**
 * Cache Middleware - In-memory response caching
 */
export const createCacheMiddleware = (options: {
  ttl?: number;
  maxSize?: number;
  keyGenerator?: (context: RequestContext) => string;
  shouldCache?: (context: ResponseContext) => boolean;
} = {}): MiddlewareConfig => {
  const {
    ttl = 60000,
    maxSize = 100,
    keyGenerator = (ctx) => `${ctx.hookName}:${JSON.stringify(ctx.input)}`,
    shouldCache = () => true,
  } = options;

  const cache = new Map<string, { data: unknown; timestamp: number }>();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key);
      }
    }
    
    // Enforce max size
    if (cache.size > maxSize) {
      const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxSize);
      keysToDelete.forEach(key => cache.delete(key));
    }
  };

  return {
    name: 'cache',
    order: -80,
    requestInterceptor: async (context, next) => {
      if (context.operation !== 'query') {
        return next();
      }

      cleanup();
      
      const key = keyGenerator(context);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        context.metadata.cacheHit = true;
        context.metadata.cachedData = cached.data;
      }
      
      context.cache = cache;
      return next();
    },
    responseInterceptor: async (context, next) => {
      if (context.operation === 'query' && shouldCache(context)) {
        const key = `${context.hookName}:${JSON.stringify(context.metadata.input || {})}`;
        cache.set(key, { data: context.output, timestamp: Date.now() });
      }
      return next();
    },
  };
};

/**
 * Rate Limit Middleware - Client-side rate limiting
 */
export const createRateLimitMiddleware = (options: {
  maxRequests: number;
  windowMs: number;
  onRateLimited?: (waitTime: number) => void;
  keyGenerator?: (context: RequestContext) => string;
} = { maxRequests: 10, windowMs: 1000 }): MiddlewareConfig => {
  const { maxRequests, windowMs, onRateLimited, keyGenerator } = options;
  
  const windows = new Map<string, number[]>();

  return {
    name: 'rateLimit',
    order: -90,
    requestInterceptor: async (context, next) => {
      const key = keyGenerator?.(context) ?? 'global';
      const now = Date.now();
      
      let timestamps = windows.get(key) || [];
      timestamps = timestamps.filter(t => now - t < windowMs);
      
      if (timestamps.length >= maxRequests) {
        const oldestRequest = timestamps[0];
        const waitTime = windowMs - (now - oldestRequest);
        
        onRateLimited?.(waitTime);
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, waitTime));
        timestamps = timestamps.filter(t => Date.now() - t < windowMs);
      }
      
      timestamps.push(now);
      windows.set(key, timestamps);
      
      return next();
    },
  };
};

/**
 * Deduplication Middleware - Prevents duplicate concurrent requests
 */
export const createDeduplicationMiddleware = (options: {
  keyGenerator?: (context: RequestContext) => string;
  windowMs?: number;
} = {}): MiddlewareConfig => {
  const {
    keyGenerator = (ctx) => `${ctx.hookName}:${JSON.stringify(ctx.input)}`,
    windowMs = 100,
  } = options;
  
  const pending = new Map<string, { promise: Promise<unknown>; timestamp: number }>();

  return {
    name: 'deduplication',
    order: -85,
    requestInterceptor: async (context, next) => {
      const key = keyGenerator(context);
      const now = Date.now();
      
      // Clean old entries
      for (const [k, v] of pending.entries()) {
        if (now - v.timestamp > windowMs) {
          pending.delete(k);
        }
      }
      
      const existing = pending.get(key);
      if (existing && now - existing.timestamp < windowMs) {
        context.metadata.deduplicated = true;
        context.metadata.originalPromise = existing.promise;
      }
      
      return next();
    },
  };
};

/**
 * Timeout Middleware - Request timeout handling
 */
export const createTimeoutMiddleware = (options: {
  timeout: number;
  onTimeout?: (context: RequestContext) => void;
} = { timeout: 30000 }): MiddlewareConfig => {
  const { timeout, onTimeout } = options;

  return {
    name: 'timeout',
    order: -70,
    requestInterceptor: async (context, next) => {
      context.metadata.timeout = timeout;
      context.metadata.timeoutStart = Date.now();
      return next();
    },
    errorInterceptor: async (context, next) => {
      const timeoutStart = context.metadata.timeoutStart as number | undefined;
      if (timeoutStart && Date.now() - timeoutStart >= timeout) {
        context.error = createKBError(
          'TIMEOUT',
          `Request timed out after ${timeout}ms`,
          { retryable: false, originalError: context.error.originalError }
        );
        onTimeout?.(context as unknown as RequestContext);
      }
      return next();
    },
  };
};

/**
 * Transform Middleware - Transform request/response data
 */
export const createTransformMiddleware = <TInput = unknown, TOutput = unknown>(options: {
  transformRequest?: (input: TInput) => TInput | Promise<TInput>;
  transformResponse?: (output: TOutput) => TOutput | Promise<TOutput>;
}): MiddlewareConfig => {
  const { transformRequest, transformResponse } = options;

  return {
    name: 'transform',
    order: -60,
    requestInterceptor: transformRequest
      ? async (context, next) => {
          context.input = await transformRequest(context.input as TInput);
          return next();
        }
      : undefined,
    responseInterceptor: transformResponse
      ? async (context, next) => {
          context.output = await transformResponse(context.output as TOutput);
          return next();
        }
      : undefined,
  };
};

/**
 * Metrics Middleware - Collect performance metrics
 */
export const createMetricsMiddleware = (options: {
  onMetric?: (metric: {
    hookName: string;
    operation: string;
    duration: number;
    success: boolean;
    fromCache: boolean;
    attempt: number;
  }) => void;
} = {}): MiddlewareConfig => {
  const { onMetric } = options;

  return {
    name: 'metrics',
    order: 100, // Run last
    requestInterceptor: async (context, next) => {
      context.metadata.metricsStart = performance.now();
      return next();
    },
    responseInterceptor: async (context, next) => {
      if (onMetric) {
        onMetric({
          hookName: context.hookName,
          operation: context.operation,
          duration: context.duration,
          success: true,
          fromCache: context.fromCache ?? false,
          attempt: context.attempt,
        });
      }
      return next();
    },
    errorInterceptor: async (context, next) => {
      if (onMetric) {
        const start = context.metadata.metricsStart as number | undefined;
        onMetric({
          hookName: context.hookName,
          operation: context.operation,
          duration: start ? performance.now() - start : 0,
          success: false,
          fromCache: false,
          attempt: context.attempt,
        });
      }
      return next();
    },
  };
};

// ============================================================================
// Global Middleware Registry
// ============================================================================

const globalChain = new MiddlewareChain();

export const KBMiddleware = {
  use: (middleware: MiddlewareConfig) => globalChain.use(middleware),
  remove: (name: string) => globalChain.remove(name),
  clear: () => globalChain.clear(),
  getChain: () => globalChain,
  getMiddlewares: () => globalChain.getMiddlewares(),
};

// ============================================================================
// Hooks
// ============================================================================

export interface UseKBMiddlewareOptions {
  chain?: MiddlewareChain;
  middlewares?: MiddlewareConfig[];
  useGlobal?: boolean;
}

export interface UseKBMiddlewareReturn {
  chain: MiddlewareChain;
  executeRequest: <TInput>(context: RequestContext<TInput>) => Promise<RequestContext<TInput>>;
  executeResponse: <TOutput>(context: ResponseContext<TOutput>) => Promise<ResponseContext<TOutput>>;
  executeError: (context: ErrorContext) => Promise<ErrorContext>;
  addMiddleware: (middleware: MiddlewareConfig) => void;
  removeMiddleware: (name: string) => void;
  getMiddlewares: () => MiddlewareConfig[];
}

export function useKBMiddleware(options: UseKBMiddlewareOptions = {}): UseKBMiddlewareReturn {
  const { chain: externalChain, middlewares = [], useGlobal = true } = options;

  const chain = useMemo(() => {
    const c = externalChain ?? new MiddlewareChain();
    
    // Add global middlewares
    if (useGlobal) {
      globalChain.getMiddlewares().forEach(m => c.use(m));
    }
    
    // Add local middlewares
    middlewares.forEach(m => c.use(m));
    
    return c;
  }, [externalChain, useGlobal]);

  const addMiddleware = useCallback((middleware: MiddlewareConfig) => {
    chain.use(middleware);
  }, [chain]);

  const removeMiddleware = useCallback((name: string) => {
    chain.remove(name);
  }, [chain]);

  const getMiddlewares = useCallback(() => {
    return chain.getMiddlewares();
  }, [chain]);

  return {
    chain,
    executeRequest: chain.executeRequest.bind(chain),
    executeResponse: chain.executeResponse.bind(chain),
    executeError: chain.executeError.bind(chain),
    addMiddleware,
    removeMiddleware,
    getMiddlewares,
  };
}

/**
 * Hook to wrap an async function with middleware
 */
export interface UseKBWithMiddlewareOptions<TInput, TOutput> {
  hookName: string;
  operation?: 'query' | 'mutation' | 'stream';
  fn: (input: TInput, signal?: AbortSignal) => Promise<TOutput>;
  chain?: MiddlewareChain;
  onCacheHit?: (data: TOutput) => void;
}

export interface UseKBWithMiddlewareReturn<TInput, TOutput> {
  execute: (input: TInput, signal?: AbortSignal) => Promise<TOutput>;
  isExecuting: boolean;
  lastDuration: number | null;
  error: KBError | null;
  clearError: () => void;
}

export function useKBWithMiddleware<TInput, TOutput>(
  options: UseKBWithMiddlewareOptions<TInput, TOutput>
): UseKBWithMiddlewareReturn<TInput, TOutput> {
  const { hookName, operation = 'query', fn, chain: externalChain, onCacheHit } = options;

  const [isExecuting, setIsExecuting] = useState(false);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [error, setError] = useState<KBError | null>(null);
  
  const attemptRef = useRef(0);
  const { chain } = useKBMiddleware({ chain: externalChain });

  const execute = useCallback(async (input: TInput, signal?: AbortSignal): Promise<TOutput> => {
    setIsExecuting(true);
    setError(null);
    attemptRef.current = 0;
    
    const startTime = performance.now();
    
    const executeWithRetry = async (): Promise<TOutput> => {
      attemptRef.current++;
      
      const requestContext: RequestContext<TInput> = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        hookName,
        operation,
        attempt: attemptRef.current,
        metadata: { input },
        signal,
        input,
      };
      
      try {
        // Execute request interceptors
        const processedRequest = await chain.executeRequest(requestContext);
        
        // Check for cache hit
        if (processedRequest.metadata.cacheHit && processedRequest.metadata.cachedData) {
          const cachedData = processedRequest.metadata.cachedData as TOutput;
          onCacheHit?.(cachedData);
          setLastDuration(performance.now() - startTime);
          setIsExecuting(false);
          return cachedData;
        }
        
        // Check for deduplication
        if (processedRequest.metadata.deduplicated && processedRequest.metadata.originalPromise) {
          const result = await processedRequest.metadata.originalPromise as TOutput;
          setLastDuration(performance.now() - startTime);
          setIsExecuting(false);
          return result;
        }
        
        // Execute the actual function
        const result = await fn(processedRequest.input, signal);
        
        const duration = performance.now() - startTime;
        
        // Execute response interceptors
        const responseContext: ResponseContext<TOutput> = {
          id: processedRequest.id,
          timestamp: new Date(),
          hookName,
          operation,
          attempt: attemptRef.current,
          metadata: processedRequest.metadata,
          output: result,
          duration,
          fromCache: false,
        };
        
        const processedResponse = await chain.executeResponse(responseContext);
        
        setLastDuration(duration);
        setIsExecuting(false);
        return processedResponse.output;
        
      } catch (err) {
        const kbError = err instanceof Error 
          ? createKBError('UNKNOWN', err.message, { retryable: true, originalError: err })
          : createKBError('UNKNOWN', 'Unknown error', { retryable: false });
        
        // Execute error interceptors
        const errorContext: ErrorContext = {
          id: requestContext.id,
          timestamp: new Date(),
          hookName,
          operation,
          attempt: attemptRef.current,
          metadata: requestContext.metadata,
          error: kbError,
          shouldRetry: false,
          retryDelay: 0,
        };
        
        const processedError = await chain.executeError(errorContext);
        
        if (processedError.shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, processedError.retryDelay));
          return executeWithRetry();
        }
        
        setError(processedError.error);
        setIsExecuting(false);
        throw processedError.error;
      }
    };
    
    return executeWithRetry();
  }, [hookName, operation, fn, chain, onCacheHit]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    isExecuting,
    lastDuration,
    error,
    clearError,
  };
}

// ============================================================================
// Compose Helper
// ============================================================================

export function composeMiddleware(...middlewares: MiddlewareConfig[]): MiddlewareChain {
  const chain = new MiddlewareChain();
  middlewares.forEach(m => chain.use(m));
  return chain;
}

// ============================================================================
// Exports
// ============================================================================

export default useKBMiddleware;
