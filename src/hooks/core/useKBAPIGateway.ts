/**
 * KB 4.5 - API Gateway Pattern Hook (Phase 17)
 * Request routing, transformation, and aggregation
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface APIEndpoint {
  name: string;
  baseUrl: string;
  healthCheck?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  auth?: EndpointAuth;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export type EndpointAuth = 
  | { type: 'none' }
  | { type: 'api-key'; header: string; key: string }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'oauth2'; tokenUrl: string; clientId: string; clientSecret: string };

export interface APIRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  targetPath?: string;
  transforms?: RouteTransforms;
  cache?: RouteCacheConfig;
  fallback?: () => Promise<unknown>;
}

export interface RouteTransforms {
  request?: (req: APIRequest) => APIRequest | Promise<APIRequest>;
  response?: (res: APIResponse) => APIResponse | Promise<APIResponse>;
  error?: (error: Error) => Error;
}

export interface RouteCacheConfig {
  enabled: boolean;
  ttl: number; // ms
  key?: (req: APIRequest) => string;
  invalidateOn?: string[]; // methods that invalidate cache
}

export interface APIRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface GatewayConfig {
  endpoints: APIEndpoint[];
  routes: APIRoute[];
  defaultTimeout?: number;
  defaultRetries?: number;
  logging?: boolean;
  metrics?: boolean;
  cors?: CORSConfig;
}

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export interface GatewayStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  endpointStats: Record<string, EndpointStats>;
}

export interface EndpointStats {
  requests: number;
  errors: number;
  latency: number;
  lastHealthCheck?: Date;
  isHealthy: boolean;
}

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry {
  data: unknown;
  expiry: number;
}

const responseCache = new Map<string, CacheEntry>();

function getCacheKey(req: APIRequest, route: APIRoute): string {
  if (route.cache?.key) {
    return route.cache.key(req);
  }
  return `${req.method}:${req.path}:${JSON.stringify(req.query || {})}`;
}

function getCachedResponse(key: string): unknown | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResponse(key: string, data: unknown, ttl: number): void {
  responseCache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
}

function invalidateCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  
  const regex = new RegExp(pattern);
  for (const key of responseCache.keys()) {
    if (regex.test(key)) {
      responseCache.delete(key);
    }
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBAPIGateway(config: GatewayConfig): {
  // Request methods
  request: <T = unknown>(path: string, options?: RequestOptions) => Promise<APIResponse<T>>;
  get: <T = unknown>(path: string, query?: Record<string, string>) => Promise<APIResponse<T>>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<APIResponse<T>>;
  put: <T = unknown>(path: string, body?: unknown) => Promise<APIResponse<T>>;
  delete: <T = unknown>(path: string) => Promise<APIResponse<T>>;
  patch: <T = unknown>(path: string, body?: unknown) => Promise<APIResponse<T>>;
  
  // Aggregation
  aggregate: <T = unknown>(requests: AggregateRequest[]) => Promise<T[]>;
  
  // Health
  checkHealth: () => Promise<Record<string, boolean>>;
  getStats: () => GatewayStats;
  
  // Cache
  invalidateCache: (pattern?: string) => void;
  
  // Status
  isReady: boolean;
  endpoints: Record<string, boolean>;
} {
  const [isReady, setIsReady] = useState(false);
  const [endpointHealth, setEndpointHealth] = useState<Record<string, boolean>>({});
  const statsRef = useRef<GatewayStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    endpointStats: {},
  });

  // Initialize endpoint stats
  useEffect(() => {
    const health: Record<string, boolean> = {};
    config.endpoints.forEach(ep => {
      health[ep.name] = true;
      statsRef.current.endpointStats[ep.name] = {
        requests: 0,
        errors: 0,
        latency: 0,
        isHealthy: true,
      };
    });
    setEndpointHealth(health);
    setIsReady(true);
  }, [config.endpoints]);

  // Find matching route
  const findRoute = useCallback((path: string, method: string): APIRoute | null => {
    return config.routes.find(route => {
      const pathMatch = new RegExp(`^${route.path.replace(/:[\w]+/g, '[^/]+')}$`).test(path);
      return pathMatch && route.method === method;
    }) || null;
  }, [config.routes]);

  // Get endpoint by name
  const getEndpoint = useCallback((name: string): APIEndpoint | null => {
    return config.endpoints.find(ep => ep.name === name) || null;
  }, [config.endpoints]);

  // Build auth headers
  const getAuthHeaders = useCallback((auth?: EndpointAuth): Record<string, string> => {
    if (!auth || auth.type === 'none') return {};
    
    switch (auth.type) {
      case 'api-key':
        return { [auth.header]: auth.key };
      case 'bearer':
        return { 'Authorization': `Bearer ${auth.token}` };
      case 'basic':
        const credentials = btoa(`${auth.username}:${auth.password}`);
        return { 'Authorization': `Basic ${credentials}` };
      default:
        return {};
    }
  }, []);

  // Main request function
  const request = useCallback(async <T = unknown>(
    path: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> => {
    const method = options.method || 'GET';
    const route = findRoute(path, method);
    
    if (!route) {
      throw new Error(`No route found for ${method} ${path}`);
    }

    const endpoint = getEndpoint(route.endpoint);
    if (!endpoint) {
      throw new Error(`Endpoint '${route.endpoint}' not found`);
    }

    // Check cache for GET requests
    if (method === 'GET' && route.cache?.enabled) {
      const cacheKey = getCacheKey({ path, method, headers: {}, query: options.query }, route);
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return {
          data: cached as T,
          status: 200,
          headers: { 'x-cache': 'HIT' },
          timing: { start: Date.now(), end: Date.now(), duration: 0 },
        };
      }
    }

    // Build request
    let apiRequest: APIRequest = {
      path: route.targetPath || path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...endpoint.headers,
        ...getAuthHeaders(endpoint.auth),
        ...options.headers,
      },
      body: options.body,
      query: options.query,
    };

    // Apply request transform
    if (route.transforms?.request) {
      apiRequest = await route.transforms.request(apiRequest);
    }

    const startTime = Date.now();
    statsRef.current.totalRequests++;
    statsRef.current.endpointStats[endpoint.name].requests++;

    // Build URL with query params
    let url = `${endpoint.baseUrl}${apiRequest.path}`;
    if (apiRequest.query && Object.keys(apiRequest.query).length > 0) {
      const params = new URLSearchParams(apiRequest.query);
      url += `?${params.toString()}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        endpoint.timeout || config.defaultTimeout || 30000
      );

      const response = await fetch(url, {
        method: apiRequest.method,
        headers: apiRequest.headers,
        body: apiRequest.body ? JSON.stringify(apiRequest.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update stats
      statsRef.current.successfulRequests++;
      statsRef.current.averageLatency = 
        (statsRef.current.averageLatency + duration) / 2;
      statsRef.current.endpointStats[endpoint.name].latency =
        (statsRef.current.endpointStats[endpoint.name].latency + duration) / 2;

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data = await response.json() as T;

      let apiResponse: APIResponse<T> = {
        data,
        status: response.status,
        headers: responseHeaders,
        timing: { start: startTime, end: endTime, duration },
      };

      // Apply response transform
      if (route.transforms?.response) {
        apiResponse = await route.transforms.response(apiResponse) as APIResponse<T>;
      }

      // Cache successful GET responses
      if (method === 'GET' && route.cache?.enabled && response.ok) {
        const cacheKey = getCacheKey(apiRequest, route);
        setCachedResponse(cacheKey, apiResponse.data, route.cache.ttl);
      }

      // Invalidate cache for mutations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && route.cache?.invalidateOn) {
        route.cache.invalidateOn.forEach(pattern => invalidateCache(pattern));
      }

      if (config.logging) {
        console.log(`[APIGateway] ${method} ${path} -> ${response.status} (${duration}ms)`);
      }

      return apiResponse;
    } catch (error) {
      statsRef.current.failedRequests++;
      statsRef.current.endpointStats[endpoint.name].errors++;
      statsRef.current.endpointStats[endpoint.name].isHealthy = false;

      // Try fallback
      if (route.fallback) {
        const fallbackData = await route.fallback();
        return {
          data: fallbackData as T,
          status: 200,
          headers: { 'x-fallback': 'true' },
          timing: { start: startTime, end: Date.now(), duration: Date.now() - startTime },
        };
      }

      if (route.transforms?.error) {
        throw route.transforms.error(error as Error);
      }

      throw error;
    }
  }, [findRoute, getEndpoint, getAuthHeaders, config]);

  // Convenience methods
  const get = useCallback(<T = unknown>(path: string, query?: Record<string, string>) => {
    return request<T>(path, { method: 'GET', query });
  }, [request]);

  const post = useCallback(<T = unknown>(path: string, body?: unknown) => {
    return request<T>(path, { method: 'POST', body });
  }, [request]);

  const put = useCallback(<T = unknown>(path: string, body?: unknown) => {
    return request<T>(path, { method: 'PUT', body });
  }, [request]);

  const deleteReq = useCallback(<T = unknown>(path: string) => {
    return request<T>(path, { method: 'DELETE' });
  }, [request]);

  const patch = useCallback(<T = unknown>(path: string, body?: unknown) => {
    return request<T>(path, { method: 'PATCH', body });
  }, [request]);

  // Aggregate multiple requests
  const aggregate = useCallback(async <T = unknown>(
    requests: AggregateRequest[]
  ): Promise<T[]> => {
    const results = await Promise.allSettled(
      requests.map(req => request<T>(req.path, req.options))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value.data;
      }
      if (requests[index].fallback) {
        return requests[index].fallback as T;
      }
      throw result.reason;
    });
  }, [request]);

  // Health check
  const checkHealth = useCallback(async (): Promise<Record<string, boolean>> => {
    const health: Record<string, boolean> = {};

    await Promise.all(
      config.endpoints.map(async endpoint => {
        if (!endpoint.healthCheck) {
          health[endpoint.name] = true;
          return;
        }

        try {
          const response = await fetch(`${endpoint.baseUrl}${endpoint.healthCheck}`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          health[endpoint.name] = response.ok;
          statsRef.current.endpointStats[endpoint.name].isHealthy = response.ok;
          statsRef.current.endpointStats[endpoint.name].lastHealthCheck = new Date();
        } catch {
          health[endpoint.name] = false;
          statsRef.current.endpointStats[endpoint.name].isHealthy = false;
        }
      })
    );

    setEndpointHealth(health);
    return health;
  }, [config.endpoints]);

  const getStats = useCallback(() => ({ ...statsRef.current }), []);

  return {
    request,
    get,
    post,
    put,
    delete: deleteReq,
    patch,
    aggregate,
    checkHealth,
    getStats,
    invalidateCache,
    isReady,
    endpoints: endpointHealth,
  };
}

// ============================================================================
// TYPES FOR OPTIONS
// ============================================================================

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface AggregateRequest {
  path: string;
  options?: RequestOptions;
  fallback?: unknown;
}

// ============================================================================
// API COMPOSITION HOOK
// ============================================================================

export function useKBAPIComposition<T>(
  requests: AggregateRequest[],
  composer: (results: unknown[]) => T
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        requests.map(async req => {
          const response = await fetch(req.path, {
            method: req.options?.method || 'GET',
            headers: req.options?.headers,
            body: req.options?.body ? JSON.stringify(req.options.body) : undefined,
          });
          return response.json();
        })
      );

      const composed = composer(results);
      setData(composed);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [requests, composer]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAll,
  };
}

export default useKBAPIGateway;
