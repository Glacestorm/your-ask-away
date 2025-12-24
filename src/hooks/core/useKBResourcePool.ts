/**
 * KB 4.5 - Resource Pool Management
 * 
 * Connection pooling and resource management for optimized resource usage.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PooledResource<T> {
  id: string;
  resource: T;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
  isAvailable: boolean;
  metadata?: Record<string, unknown>;
}

export interface ResourcePoolConfig<T> {
  /** Minimum pool size */
  minSize?: number;
  /** Maximum pool size */
  maxSize?: number;
  /** Resource factory */
  factory: () => T | Promise<T>;
  /** Resource validator */
  validate?: (resource: T) => boolean | Promise<boolean>;
  /** Resource destroyer */
  destroy?: (resource: T) => void | Promise<void>;
  /** Resource reset (prepare for reuse) */
  reset?: (resource: T) => void | Promise<void>;
  /** Idle timeout in ms (release idle resources) */
  idleTimeout?: number;
  /** Max resource lifetime in ms */
  maxLifetime?: number;
  /** Acquire timeout in ms */
  acquireTimeout?: number;
  /** Enable FIFO (first in, first out) vs LIFO */
  fifo?: boolean;
  /** Enable eviction on idle */
  evictOnIdle?: boolean;
  /** Health check interval in ms */
  healthCheckInterval?: number;
}

export interface PoolStats {
  size: number;
  available: number;
  inUse: number;
  pending: number;
  totalAcquired: number;
  totalReleased: number;
  totalCreated: number;
  totalDestroyed: number;
  avgAcquireTime: number;
  avgUseTime: number;
}

export interface AcquireOptions {
  timeout?: number;
  priority?: number;
}

// ============================================================================
// RESOURCE POOL
// ============================================================================

class ResourcePool<T> {
  private resources: Map<string, PooledResource<T>> = new Map();
  private waitQueue: Array<{
    resolve: (resource: PooledResource<T>) => void;
    reject: (error: Error) => void;
    priority: number;
    timeout?: NodeJS.Timeout;
  }> = [];
  private config: Required<ResourcePoolConfig<T>>;
  private stats: PoolStats = {
    size: 0,
    available: 0,
    inUse: 0,
    pending: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalCreated: 0,
    totalDestroyed: 0,
    avgAcquireTime: 0,
    avgUseTime: 0,
  };
  private acquireTimes: number[] = [];
  private useTimes: number[] = [];
  private idleTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor(config: ResourcePoolConfig<T>) {
    this.config = {
      minSize: config.minSize ?? 0,
      maxSize: config.maxSize ?? 10,
      factory: config.factory,
      validate: config.validate ?? (() => true),
      destroy: config.destroy ?? (() => {}),
      reset: config.reset ?? (() => {}),
      idleTimeout: config.idleTimeout ?? 60000,
      maxLifetime: config.maxLifetime ?? 0,
      acquireTimeout: config.acquireTimeout ?? 30000,
      fifo: config.fifo ?? false,
      evictOnIdle: config.evictOnIdle ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
    };

    // Initialize minimum resources
    this.ensureMinimum();

    // Start idle eviction
    if (this.config.evictOnIdle && this.config.idleTimeout > 0) {
      this.startIdleEviction();
    }

    // Start health checks
    if (this.config.healthCheckInterval > 0) {
      this.startHealthCheck();
    }
  }

  private generateId(): string {
    return `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ensureMinimum(): Promise<void> {
    const needed = this.config.minSize - this.resources.size;
    for (let i = 0; i < needed; i++) {
      await this.createResource();
    }
  }

  private async createResource(): Promise<PooledResource<T>> {
    if (this.resources.size >= this.config.maxSize) {
      throw new Error('Pool maximum size reached');
    }

    const resource = await this.config.factory();
    const pooled: PooledResource<T> = {
      id: this.generateId(),
      resource,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
      isAvailable: true,
    };

    this.resources.set(pooled.id, pooled);
    this.stats.totalCreated++;
    this.updateStats();

    return pooled;
  }

  private async destroyResource(pooled: PooledResource<T>): Promise<void> {
    await this.config.destroy(pooled.resource);
    this.resources.delete(pooled.id);
    this.stats.totalDestroyed++;
    this.updateStats();
  }

  private updateStats(): void {
    let available = 0;
    let inUse = 0;

    this.resources.forEach((r) => {
      if (r.isAvailable) available++;
      else inUse++;
    });

    this.stats.size = this.resources.size;
    this.stats.available = available;
    this.stats.inUse = inUse;
    this.stats.pending = this.waitQueue.length;

    if (this.acquireTimes.length > 0) {
      this.stats.avgAcquireTime = 
        this.acquireTimes.reduce((a, b) => a + b, 0) / this.acquireTimes.length;
    }
    if (this.useTimes.length > 0) {
      this.stats.avgUseTime = 
        this.useTimes.reduce((a, b) => a + b, 0) / this.useTimes.length;
    }
  }

  private getAvailableResource(): PooledResource<T> | null {
    const available = Array.from(this.resources.values())
      .filter((r) => r.isAvailable);

    if (available.length === 0) return null;

    // FIFO vs LIFO
    if (this.config.fifo) {
      available.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
    } else {
      available.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    }

    return available[0];
  }

  private processWaitQueue(): void {
    if (this.waitQueue.length === 0) return;

    // Sort by priority (higher first)
    this.waitQueue.sort((a, b) => b.priority - a.priority);

    const available = this.getAvailableResource();
    if (!available) return;

    const waiter = this.waitQueue.shift();
    if (!waiter) return;

    if (waiter.timeout) {
      clearTimeout(waiter.timeout);
    }

    available.isAvailable = false;
    available.lastUsedAt = Date.now();
    available.useCount++;
    this.stats.totalAcquired++;
    this.updateStats();

    waiter.resolve(available);
  }

  private startIdleEviction(): void {
    this.idleTimer = setInterval(() => {
      const now = Date.now();
      const toEvict: PooledResource<T>[] = [];

      this.resources.forEach((resource) => {
        if (resource.isAvailable && 
            now - resource.lastUsedAt > this.config.idleTimeout &&
            this.resources.size > this.config.minSize) {
          toEvict.push(resource);
        }
      });

      toEvict.forEach((resource) => {
        this.destroyResource(resource);
      });
    }, this.config.idleTimeout / 2);
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      const toCheck = Array.from(this.resources.values())
        .filter((r) => r.isAvailable);

      for (const resource of toCheck) {
        try {
          const isValid = await this.config.validate(resource.resource);
          if (!isValid) {
            await this.destroyResource(resource);
          }
        } catch {
          await this.destroyResource(resource);
        }
      }

      // Ensure minimum after health check
      await this.ensureMinimum();
    }, this.config.healthCheckInterval);
  }

  async acquire(options: AcquireOptions = {}): Promise<PooledResource<T>> {
    if (this.isDestroyed) {
      throw new Error('Pool has been destroyed');
    }

    const start = Date.now();
    const timeout = options.timeout ?? this.config.acquireTimeout;
    const priority = options.priority ?? 0;

    // Try to get available resource
    let available = this.getAvailableResource();
    
    // Check lifetime
    if (available && this.config.maxLifetime > 0) {
      if (Date.now() - available.createdAt > this.config.maxLifetime) {
        await this.destroyResource(available);
        available = null;
      }
    }

    // Validate resource
    if (available) {
      const isValid = await this.config.validate(available.resource);
      if (!isValid) {
        await this.destroyResource(available);
        available = null;
      }
    }

    if (available) {
      available.isAvailable = false;
      available.lastUsedAt = Date.now();
      available.useCount++;
      this.stats.totalAcquired++;
      this.acquireTimes.push(Date.now() - start);
      if (this.acquireTimes.length > 100) this.acquireTimes.shift();
      this.updateStats();
      return available;
    }

    // Try to create new resource
    if (this.resources.size < this.config.maxSize) {
      const newResource = await this.createResource();
      newResource.isAvailable = false;
      this.stats.totalAcquired++;
      this.acquireTimes.push(Date.now() - start);
      if (this.acquireTimes.length > 100) this.acquireTimes.shift();
      this.updateStats();
      return newResource;
    }

    // Wait for available resource
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        priority,
        timeout: undefined as NodeJS.Timeout | undefined,
      };

      if (timeout > 0) {
        waiter.timeout = setTimeout(() => {
          const index = this.waitQueue.indexOf(waiter);
          if (index !== -1) {
            this.waitQueue.splice(index, 1);
            reject(new Error('Acquire timeout'));
          }
        }, timeout);
      }

      this.waitQueue.push(waiter);
      this.updateStats();
    });
  }

  async release(pooled: PooledResource<T>): Promise<void> {
    if (this.isDestroyed) return;

    const resource = this.resources.get(pooled.id);
    if (!resource) return;

    const useTime = Date.now() - resource.lastUsedAt;
    this.useTimes.push(useTime);
    if (this.useTimes.length > 100) this.useTimes.shift();

    // Check lifetime
    if (this.config.maxLifetime > 0 && 
        Date.now() - resource.createdAt > this.config.maxLifetime) {
      await this.destroyResource(resource);
      await this.ensureMinimum();
      this.processWaitQueue();
      return;
    }

    // Validate
    const isValid = await this.config.validate(resource.resource);
    if (!isValid) {
      await this.destroyResource(resource);
      await this.ensureMinimum();
      this.processWaitQueue();
      return;
    }

    // Reset for reuse
    await this.config.reset(resource.resource);

    resource.isAvailable = true;
    resource.lastUsedAt = Date.now();
    this.stats.totalReleased++;
    this.updateStats();

    this.processWaitQueue();
  }

  getStats(): PoolStats {
    return { ...this.stats };
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true;

    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Reject all waiting
    this.waitQueue.forEach((waiter) => {
      if (waiter.timeout) clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool destroyed'));
    });
    this.waitQueue = [];

    // Destroy all resources
    for (const resource of this.resources.values()) {
      await this.config.destroy(resource.resource);
    }
    this.resources.clear();
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Resource Pool Hook
 */
export function useKBResourcePool<T>(config: ResourcePoolConfig<T>) {
  const poolRef = useRef<ResourcePool<T> | null>(null);
  const [stats, setStats] = useState<PoolStats>({
    size: 0,
    available: 0,
    inUse: 0,
    pending: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalCreated: 0,
    totalDestroyed: 0,
    avgAcquireTime: 0,
    avgUseTime: 0,
  });

  // Initialize pool
  useMemo(() => {
    if (!poolRef.current) {
      poolRef.current = new ResourcePool(config);
    }
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (poolRef.current) {
        setStats(poolRef.current.getStats());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      poolRef.current?.destroy();
    };
  }, []);

  const acquire = useCallback(async (options?: AcquireOptions): Promise<PooledResource<T>> => {
    if (!poolRef.current) {
      throw new Error('Pool not initialized');
    }
    return poolRef.current.acquire(options);
  }, []);

  const release = useCallback(async (resource: PooledResource<T>): Promise<void> => {
    if (!poolRef.current) return;
    return poolRef.current.release(resource);
  }, []);

  const withResource = useCallback(async <R>(
    fn: (resource: T) => Promise<R> | R,
    options?: AcquireOptions
  ): Promise<R> => {
    const pooled = await acquire(options);
    try {
      return await fn(pooled.resource);
    } finally {
      await release(pooled);
    }
  }, [acquire, release]);

  return {
    acquire,
    release,
    withResource,
    stats,
    getStats: () => poolRef.current?.getStats() ?? stats,
  };
}

/**
 * Connection Pool Hook (specialized for connections)
 */
export function useKBConnectionPool<T>(config: {
  create: () => T | Promise<T>;
  destroy?: (conn: T) => void | Promise<void>;
  validate?: (conn: T) => boolean | Promise<boolean>;
  minConnections?: number;
  maxConnections?: number;
  idleTimeout?: number;
}) {
  return useKBResourcePool<T>({
    factory: config.create,
    destroy: config.destroy,
    validate: config.validate,
    minSize: config.minConnections ?? 1,
    maxSize: config.maxConnections ?? 10,
    idleTimeout: config.idleTimeout ?? 30000,
  });
}

/**
 * Worker Pool Hook (specialized for workers)
 */
export function useKBWorkerPool(config: {
  workerScript: string;
  minWorkers?: number;
  maxWorkers?: number;
  taskTimeout?: number;
}) {
  const pool = useKBResourcePool<Worker>({
    factory: () => new Worker(config.workerScript),
    destroy: (worker) => worker.terminate(),
    minSize: config.minWorkers ?? 1,
    maxSize: config.maxWorkers ?? navigator.hardwareConcurrency || 4,
  });

  const execute = useCallback(async <TInput, TOutput>(
    task: TInput,
    timeout?: number
  ): Promise<TOutput> => {
    return pool.withResource(async (worker) => {
      return new Promise((resolve, reject) => {
        const timeoutId = timeout ? setTimeout(() => {
          reject(new Error('Worker task timeout'));
        }, timeout) : null;

        const handler = (e: MessageEvent) => {
          if (timeoutId) clearTimeout(timeoutId);
          worker.removeEventListener('message', handler);
          resolve(e.data as TOutput);
        };

        const errorHandler = (e: ErrorEvent) => {
          if (timeoutId) clearTimeout(timeoutId);
          worker.removeEventListener('error', errorHandler);
          reject(new Error(e.message));
        };

        worker.addEventListener('message', handler);
        worker.addEventListener('error', errorHandler);
        worker.postMessage(task);
      });
    }, { timeout: config.taskTimeout });
  }, [pool, config.taskTimeout]);

  return {
    ...pool,
    execute,
  };
}

/**
 * Semaphore Hook (for limiting concurrent operations)
 */
export function useKBSemaphore(maxConcurrent: number) {
  const [running, setRunning] = useState(0);
  const [waiting, setWaiting] = useState(0);
  const queueRef = useRef<Array<() => void>>([]);

  const acquire = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (running < maxConcurrent) {
        setRunning((r) => r + 1);
        resolve();
      } else {
        queueRef.current.push(resolve);
        setWaiting(queueRef.current.length);
      }
    });
  }, [running, maxConcurrent]);

  const release = useCallback(() => {
    const next = queueRef.current.shift();
    setWaiting(queueRef.current.length);

    if (next) {
      next();
    } else {
      setRunning((r) => Math.max(0, r - 1));
    }
  }, []);

  const withLock = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }, [acquire, release]);

  return {
    acquire,
    release,
    withLock,
    running,
    waiting,
    available: maxConcurrent - running,
  };
}

/**
 * Rate Limiter Hook
 */
export function useKBRateLimiter(config: {
  maxRequests: number;
  windowMs: number;
  strategy?: 'sliding' | 'fixed';
}) {
  const requestsRef = useRef<number[]>([]);
  const [remaining, setRemaining] = useState(config.maxRequests);

  const isAllowed = useCallback((): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean old requests
    requestsRef.current = requestsRef.current.filter((t) => t > windowStart);

    if (requestsRef.current.length < config.maxRequests) {
      requestsRef.current.push(now);
      setRemaining(config.maxRequests - requestsRef.current.length);
      return true;
    }

    setRemaining(0);
    return false;
  }, [config.maxRequests, config.windowMs]);

  const waitForSlot = useCallback(async (): Promise<void> => {
    while (!isAllowed()) {
      const oldestRequest = requestsRef.current[0];
      const waitTime = oldestRequest + config.windowMs - Date.now();
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }, [isAllowed, config.windowMs]);

  const withRateLimit = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    await waitForSlot();
    return fn();
  }, [waitForSlot]);

  const reset = useCallback(() => {
    requestsRef.current = [];
    setRemaining(config.maxRequests);
  }, [config.maxRequests]);

  return {
    isAllowed,
    waitForSlot,
    withRateLimit,
    remaining,
    reset,
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createResourcePool<T>(config: ResourcePoolConfig<T>): ResourcePool<T> {
  return new ResourcePool(config);
}

export default useKBResourcePool;
