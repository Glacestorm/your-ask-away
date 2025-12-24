/**
 * KB 4.5 - Service Mesh Pattern Hook (Phase 17)
 * Service discovery, load balancing, and observability
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceDefinition {
  name: string;
  version: string;
  endpoints: ServiceEndpoint[];
  healthCheck: HealthCheckConfig;
  metadata?: Record<string, unknown>;
  tags?: string[];
  dependencies?: string[];
}

export interface ServiceEndpoint {
  id: string;
  url: string;
  weight?: number;
  zone?: string;
  healthy: boolean;
  metadata?: Record<string, unknown>;
}

export interface HealthCheckConfig {
  path: string;
  interval: number; // ms
  timeout: number; // ms
  healthyThreshold: number;
  unhealthyThreshold: number;
}

export type LoadBalancingStrategy = 
  | 'round-robin'
  | 'weighted'
  | 'least-connections'
  | 'random'
  | 'ip-hash'
  | 'zone-aware';

export interface ServiceMeshConfig {
  services: ServiceDefinition[];
  loadBalancing?: LoadBalancingStrategy;
  retries?: RetryConfig;
  timeout?: number;
  circuitBreaker?: CircuitBreakerConfig;
  tracing?: TracingConfig;
  mtls?: MTLSConfig;
}

export interface RetryConfig {
  maxRetries: number;
  retryOn: string[]; // status codes or error types
  backoff: 'fixed' | 'exponential';
  baseDelay: number;
  maxDelay: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  threshold: number;
  timeout: number;
}

export interface TracingConfig {
  enabled: boolean;
  samplingRate: number;
  propagation: 'b3' | 'w3c' | 'jaeger';
}

export interface MTLSConfig {
  enabled: boolean;
  certificatePath?: string;
  keyPath?: string;
}

export interface ServiceCall {
  service: string;
  endpoint?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ServiceResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  endpoint: string;
  latency: number;
  traceId?: string;
}

export interface ServiceHealth {
  name: string;
  healthy: boolean;
  endpoints: {
    id: string;
    url: string;
    healthy: boolean;
    lastCheck: Date;
    responseTime?: number;
  }[];
  dependencies: {
    name: string;
    healthy: boolean;
  }[];
}

// ============================================================================
// SERVICE REGISTRY
// ============================================================================

class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map();
  private endpointHealth: Map<string, boolean> = new Map();
  private connectionCounts: Map<string, number> = new Map();

  register(service: ServiceDefinition): void {
    this.services.set(service.name, service);
    service.endpoints.forEach(ep => {
      this.endpointHealth.set(ep.id, ep.healthy);
      this.connectionCounts.set(ep.id, 0);
    });
  }

  unregister(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (service) {
      service.endpoints.forEach(ep => {
        this.endpointHealth.delete(ep.id);
        this.connectionCounts.delete(ep.id);
      });
      this.services.delete(serviceName);
    }
  }

  get(serviceName: string): ServiceDefinition | undefined {
    return this.services.get(serviceName);
  }

  getAll(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  getHealthyEndpoints(serviceName: string): ServiceEndpoint[] {
    const service = this.services.get(serviceName);
    if (!service) return [];
    
    return service.endpoints.filter(ep => 
      this.endpointHealth.get(ep.id) !== false
    );
  }

  setEndpointHealth(endpointId: string, healthy: boolean): void {
    this.endpointHealth.set(endpointId, healthy);
  }

  incrementConnections(endpointId: string): void {
    const current = this.connectionCounts.get(endpointId) || 0;
    this.connectionCounts.set(endpointId, current + 1);
  }

  decrementConnections(endpointId: string): void {
    const current = this.connectionCounts.get(endpointId) || 0;
    this.connectionCounts.set(endpointId, Math.max(0, current - 1));
  }

  getConnectionCount(endpointId: string): number {
    return this.connectionCounts.get(endpointId) || 0;
  }
}

// ============================================================================
// LOAD BALANCER
// ============================================================================

class LoadBalancer {
  private roundRobinIndex: Map<string, number> = new Map();

  selectEndpoint(
    endpoints: ServiceEndpoint[],
    strategy: LoadBalancingStrategy,
    clientId?: string
  ): ServiceEndpoint | null {
    if (endpoints.length === 0) return null;

    switch (strategy) {
      case 'round-robin':
        return this.roundRobin(endpoints);
      case 'weighted':
        return this.weighted(endpoints);
      case 'least-connections':
        return this.leastConnections(endpoints);
      case 'random':
        return this.random(endpoints);
      case 'ip-hash':
        return this.ipHash(endpoints, clientId || '');
      case 'zone-aware':
        return this.zoneAware(endpoints);
      default:
        return this.roundRobin(endpoints);
    }
  }

  private roundRobin(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    const key = endpoints.map(e => e.id).join(',');
    const index = this.roundRobinIndex.get(key) || 0;
    const endpoint = endpoints[index % endpoints.length];
    this.roundRobinIndex.set(key, index + 1);
    return endpoint;
  }

  private weighted(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    const totalWeight = endpoints.reduce((sum, ep) => sum + (ep.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight || 1;
      if (random <= 0) return endpoint;
    }
    
    return endpoints[0];
  }

  private leastConnections(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    // This would need connection tracking - simplified version
    return endpoints.reduce((min, ep) => 
      (ep.metadata?.connections || 0) < (min.metadata?.connections || 0) ? ep : min
    );
  }

  private random(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  private ipHash(endpoints: ServiceEndpoint[], clientId: string): ServiceEndpoint {
    let hash = 0;
    for (let i = 0; i < clientId.length; i++) {
      hash = ((hash << 5) - hash) + clientId.charCodeAt(i);
      hash = hash & hash;
    }
    return endpoints[Math.abs(hash) % endpoints.length];
  }

  private zoneAware(endpoints: ServiceEndpoint[]): ServiceEndpoint {
    // Prefer local zone endpoints
    const currentZone = 'default'; // Would be determined by environment
    const localEndpoints = endpoints.filter(ep => ep.zone === currentZone);
    
    if (localEndpoints.length > 0) {
      return this.random(localEndpoints);
    }
    
    return this.random(endpoints);
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

const globalRegistry = new ServiceRegistry();
const globalLoadBalancer = new LoadBalancer();

export function useKBServiceMesh(config: ServiceMeshConfig): {
  // Service calls
  call: <T = unknown>(request: ServiceCall) => Promise<ServiceResponse<T>>;
  
  // Service discovery
  discover: (serviceName: string) => ServiceEndpoint[];
  register: (service: ServiceDefinition) => void;
  unregister: (serviceName: string) => void;
  
  // Health
  getServiceHealth: (serviceName: string) => ServiceHealth | null;
  getAllServicesHealth: () => ServiceHealth[];
  runHealthChecks: () => Promise<void>;
  
  // Stats
  getMetrics: () => ServiceMeshMetrics;
  
  // Status
  isReady: boolean;
} {
  const [isReady, setIsReady] = useState(false);
  const [, forceUpdate] = useState(0);
  const healthCheckTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const metricsRef = useRef<ServiceMeshMetrics>({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageLatency: 0,
    callsByService: {},
    errorsByService: {},
  });

  // Initialize services
  useEffect(() => {
    config.services.forEach(service => {
      globalRegistry.register(service);
    });
    setIsReady(true);

    return () => {
      healthCheckTimers.current.forEach(timer => clearInterval(timer));
    };
  }, [config.services]);

  // Generate trace ID
  const generateTraceId = useCallback((): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Make service call
  const call = useCallback(async <T = unknown>(
    request: ServiceCall
  ): Promise<ServiceResponse<T>> => {
    const service = globalRegistry.get(request.service);
    if (!service) {
      throw new Error(`Service '${request.service}' not found`);
    }

    const healthyEndpoints = globalRegistry.getHealthyEndpoints(request.service);
    if (healthyEndpoints.length === 0) {
      throw new Error(`No healthy endpoints for service '${request.service}'`);
    }

    const endpoint = globalLoadBalancer.selectEndpoint(
      healthyEndpoints,
      config.loadBalancing || 'round-robin'
    );

    if (!endpoint) {
      throw new Error(`Could not select endpoint for service '${request.service}'`);
    }

    const traceId = config.tracing?.enabled ? generateTraceId() : undefined;
    const startTime = Date.now();

    // Track connections
    globalRegistry.incrementConnections(endpoint.id);

    try {
      metricsRef.current.totalCalls++;
      metricsRef.current.callsByService[request.service] = 
        (metricsRef.current.callsByService[request.service] || 0) + 1;

      const url = `${endpoint.url}${request.path}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...request.headers,
      };

      if (traceId && config.tracing) {
        switch (config.tracing.propagation) {
          case 'b3':
            headers['X-B3-TraceId'] = traceId;
            headers['X-B3-SpanId'] = traceId.split('-')[1];
            break;
          case 'w3c':
            headers['traceparent'] = `00-${traceId}-01`;
            break;
          case 'jaeger':
            headers['uber-trace-id'] = traceId;
            break;
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        request.timeout || config.timeout || 30000
      );

      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const latency = Date.now() - startTime;
      metricsRef.current.successfulCalls++;
      metricsRef.current.averageLatency = 
        (metricsRef.current.averageLatency + latency) / 2;

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const data = await response.json() as T;

      return {
        data,
        status: response.status,
        headers: responseHeaders,
        endpoint: endpoint.url,
        latency,
        traceId,
      };
    } catch (error) {
      metricsRef.current.failedCalls++;
      metricsRef.current.errorsByService[request.service] = 
        (metricsRef.current.errorsByService[request.service] || 0) + 1;

      // Mark endpoint as unhealthy on repeated failures
      globalRegistry.setEndpointHealth(endpoint.id, false);

      // Retry logic
      if (config.retries && config.retries.maxRetries > 0) {
        // Simplified retry - in production would be more sophisticated
        const delay = config.retries.backoff === 'exponential' 
          ? config.retries.baseDelay * 2 
          : config.retries.baseDelay;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Try another endpoint
        const retryEndpoints = healthyEndpoints.filter(ep => ep.id !== endpoint.id);
        if (retryEndpoints.length > 0) {
          const retryRequest = { ...request };
          return call<T>(retryRequest);
        }
      }

      throw error;
    } finally {
      globalRegistry.decrementConnections(endpoint.id);
    }
  }, [config, generateTraceId]);

  // Service discovery
  const discover = useCallback((serviceName: string): ServiceEndpoint[] => {
    return globalRegistry.getHealthyEndpoints(serviceName);
  }, []);

  const register = useCallback((service: ServiceDefinition) => {
    globalRegistry.register(service);
    forceUpdate(c => c + 1);
  }, []);

  const unregister = useCallback((serviceName: string) => {
    globalRegistry.unregister(serviceName);
    forceUpdate(c => c + 1);
  }, []);

  // Health checks
  const runHealthChecks = useCallback(async () => {
    const services = globalRegistry.getAll();
    
    await Promise.all(
      services.flatMap(service =>
        service.endpoints.map(async endpoint => {
          try {
            const response = await fetch(
              `${endpoint.url}${service.healthCheck.path}`,
              { 
                method: 'GET',
                signal: AbortSignal.timeout(service.healthCheck.timeout),
              }
            );
            globalRegistry.setEndpointHealth(endpoint.id, response.ok);
          } catch {
            globalRegistry.setEndpointHealth(endpoint.id, false);
          }
        })
      )
    );

    forceUpdate(c => c + 1);
  }, []);

  // Get service health
  const getServiceHealth = useCallback((serviceName: string): ServiceHealth | null => {
    const service = globalRegistry.get(serviceName);
    if (!service) return null;

    return {
      name: serviceName,
      healthy: service.endpoints.some(ep => ep.healthy),
      endpoints: service.endpoints.map(ep => ({
        id: ep.id,
        url: ep.url,
        healthy: ep.healthy,
        lastCheck: new Date(),
      })),
      dependencies: (service.dependencies || []).map(depName => ({
        name: depName,
        healthy: globalRegistry.getHealthyEndpoints(depName).length > 0,
      })),
    };
  }, []);

  const getAllServicesHealth = useCallback((): ServiceHealth[] => {
    return globalRegistry.getAll().map(s => getServiceHealth(s.name)!);
  }, [getServiceHealth]);

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  return {
    call,
    discover,
    register,
    unregister,
    getServiceHealth,
    getAllServicesHealth,
    runHealthChecks,
    getMetrics,
    isReady,
  };
}

// ============================================================================
// TYPES FOR METRICS
// ============================================================================

export interface ServiceMeshMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageLatency: number;
  callsByService: Record<string, number>;
  errorsByService: Record<string, number>;
}

// ============================================================================
// SIDECAR PROXY HOOK
// ============================================================================

export interface SidecarConfig {
  serviceName: string;
  port: number;
  adminPort?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export function useKBSidecar(config: SidecarConfig): {
  intercept: <T>(fn: () => Promise<T>) => Promise<T>;
  getStats: () => { requests: number; errors: number; latency: number };
} {
  const statsRef = useRef({ requests: 0, errors: 0, latency: 0 });

  const intercept = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    statsRef.current.requests++;

    try {
      const result = await fn();
      const latency = Date.now() - startTime;
      statsRef.current.latency = (statsRef.current.latency + latency) / 2;
      return result;
    } catch (error) {
      statsRef.current.errors++;
      throw error;
    }
  }, []);

  const getStats = useCallback(() => ({ ...statsRef.current }), []);

  return { intercept, getStats };
}

export default useKBServiceMesh;
