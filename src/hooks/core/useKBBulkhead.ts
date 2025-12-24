/**
 * KB 3.0 - Bulkhead Pattern
 * Resource isolation and concurrent request limiting
 * 
 * Features:
 * - Concurrency limiting per domain/resource
 * - Request queuing with priority
 * - Timeout handling
 * - Resource pool management
 * - Semaphore-based execution
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { KBError, KBStatus, KB_ERROR_CODES } from './types';
import { createKBError, parseError, collectTelemetry } from './useKBBase';

// === BULKHEAD CONFIG ===
export interface KBBulkheadConfig {
  /** Maximum concurrent executions */
  maxConcurrent: number;
  /** Maximum queue size */
  maxQueueSize: number;
  /** Queue timeout in ms */
  queueTimeoutMs: number;
  /** Execution timeout in ms */
  executionTimeoutMs: number;
  /** Priority levels (higher = more priority) */
  defaultPriority: number;
  /** Enable bulkhead */
  enabled: boolean;
  /** Bulkhead name for isolation */
  name: string;
}

export const KB_DEFAULT_BULKHEAD_CONFIG: KBBulkheadConfig = {
  maxConcurrent: 5,
  maxQueueSize: 100,
  queueTimeoutMs: 30000,
  executionTimeoutMs: 60000,
  defaultPriority: 5,
  enabled: true,
  name: 'default',
};

// === BULKHEAD STATE ===
export interface KBBulkheadState {
  name: string;
  activeCount: number;
  queuedCount: number;
  completedCount: number;
  rejectedCount: number;
  timedOutCount: number;
  availablePermits: number;
}

// === QUEUED ITEM ===
interface QueuedItem<T> {
  id: string;
  priority: number;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  queuedAt: number;
  timeoutId?: NodeJS.Timeout;
}

// === BULKHEAD POOL ===
class BulkheadPool {
  private config: KBBulkheadConfig;
  private activeCount = 0;
  private queue: QueuedItem<unknown>[] = [];
  private completedCount = 0;
  private rejectedCount = 0;
  private timedOutCount = 0;
  private subscribers = new Set<() => void>();

  constructor(config: KBBulkheadConfig) {
    this.config = config;
  }

  getState(): KBBulkheadState {
    return {
      name: this.config.name,
      activeCount: this.activeCount,
      queuedCount: this.queue.length,
      completedCount: this.completedCount,
      rejectedCount: this.rejectedCount,
      timedOutCount: this.timedOutCount,
      availablePermits: Math.max(0, this.config.maxConcurrent - this.activeCount),
    };
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    this.subscribers.forEach(cb => cb());
  }

  async execute<T>(
    fn: () => Promise<T>,
    options?: { priority?: number; timeoutMs?: number }
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    const priority = options?.priority ?? this.config.defaultPriority;
    const timeoutMs = options?.timeoutMs ?? this.config.executionTimeoutMs;

    // Try immediate execution
    if (this.activeCount < this.config.maxConcurrent) {
      return this.executeImmediate(fn, timeoutMs);
    }

    // Check queue capacity
    if (this.queue.length >= this.config.maxQueueSize) {
      this.rejectedCount++;
      this.notify();
      throw createKBError(
        'BULKHEAD_QUEUE_FULL',
        `Bulkhead queue is full (${this.config.name})`,
        { retryable: true }
      );
    }

    // Queue the request
    return this.queueRequest(fn, priority, timeoutMs);
  }

  private async executeImmediate<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    this.activeCount++;
    this.notify();

    try {
      const result = await this.withTimeout(fn(), timeoutMs);
      this.completedCount++;
      return result;
    } catch (error) {
      if ((error as Error).message?.includes('timeout')) {
        this.timedOutCount++;
      }
      throw error;
    } finally {
      this.activeCount--;
      this.notify();
      this.processQueue();
    }
  }

  private queueRequest<T>(
    fn: () => Promise<T>,
    priority: number,
    executionTimeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = crypto.randomUUID();
      
      const item: QueuedItem<T> = {
        id,
        priority,
        execute: fn,
        resolve,
        reject,
        queuedAt: Date.now(),
      };

      // Set queue timeout
      item.timeoutId = setTimeout(() => {
        const index = this.queue.findIndex(i => i.id === id);
        if (index !== -1) {
          this.queue.splice(index, 1);
          this.timedOutCount++;
          this.notify();
          reject(createKBError(
            'BULKHEAD_QUEUE_TIMEOUT',
            `Request timed out in queue (${this.config.name})`,
            { retryable: true }
          ));
        }
      }, this.config.queueTimeoutMs);

      // Insert by priority (higher priority first)
      const insertIndex = this.queue.findIndex(i => i.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(item as QueuedItem<unknown>);
      } else {
        this.queue.splice(insertIndex, 0, item as QueuedItem<unknown>);
      }

      this.notify();
    });
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;
    if (this.activeCount >= this.config.maxConcurrent) return;

    const item = this.queue.shift();
    if (!item) return;

    // Clear queue timeout
    if (item.timeoutId) {
      clearTimeout(item.timeoutId);
    }

    this.activeCount++;
    this.notify();

    this.withTimeout(
      item.execute(),
      this.config.executionTimeoutMs
    )
      .then((result) => {
        this.completedCount++;
        item.resolve(result);
      })
      .catch((error) => {
        if (error.message?.includes('timeout')) {
          this.timedOutCount++;
        }
        item.reject(error);
      })
      .finally(() => {
        this.activeCount--;
        this.notify();
        this.processQueue();
      });
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(createKBError(
          'BULKHEAD_EXECUTION_TIMEOUT',
          `Execution timed out after ${ms}ms`,
          { retryable: true }
        ));
      }, ms);

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  clear(): void {
    this.queue.forEach(item => {
      if (item.timeoutId) {
        clearTimeout(item.timeoutId);
      }
      item.reject(new Error('Bulkhead was cleared'));
    });
    this.queue = [];
    this.notify();
  }
}

// === GLOBAL POOLS ===
const bulkheadPools = new Map<string, BulkheadPool>();

export function getBulkheadPool(name: string, config?: Partial<KBBulkheadConfig>): BulkheadPool {
  if (!bulkheadPools.has(name)) {
    bulkheadPools.set(
      name,
      new BulkheadPool({ ...KB_DEFAULT_BULKHEAD_CONFIG, ...config, name })
    );
  }
  return bulkheadPools.get(name)!;
}

export function getBulkheadStats(): Record<string, KBBulkheadState> {
  const stats: Record<string, KBBulkheadState> = {};
  bulkheadPools.forEach((pool, name) => {
    stats[name] = pool.getState();
  });
  return stats;
}

export function clearBulkheadPool(name: string): void {
  const pool = bulkheadPools.get(name);
  if (pool) {
    pool.clear();
  }
}

// === BULKHEAD HOOK ===
export interface UseKBBulkheadOptions<T, TParams = void> {
  /** Bulkhead pool name */
  poolName: string;
  /** Bulkhead configuration */
  config?: Partial<KBBulkheadConfig>;
  /** Hook name for telemetry */
  hookName?: string;
  /** Execution function */
  fn: TParams extends void ? () => Promise<T> : (params: TParams) => Promise<T>;
  /** Priority for this execution */
  priority?: number;
  /** Callbacks */
  onSuccess?: (data: T) => void;
  onError?: (error: KBError) => void;
}

export interface UseKBBulkheadReturn<T, TParams = void> {
  // Execution
  execute: TParams extends void ? () => Promise<T | null> : (params: TParams) => Promise<T | null>;
  
  // State
  status: KBStatus;
  data: T | null;
  error: KBError | null;
  
  // Computed
  isIdle: boolean;
  isLoading: boolean;
  isQueued: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // Pool state
  poolState: KBBulkheadState;
  queuePosition: number | null;
  
  // Controls
  reset: () => void;
  clearError: () => void;
}

export function useKBBulkhead<T, TParams = void>(
  options: UseKBBulkheadOptions<T, TParams>
): UseKBBulkheadReturn<T, TParams> {
  const {
    poolName,
    config,
    hookName = 'useKBBulkhead',
    fn,
    priority,
    onSuccess,
    onError,
  } = options;

  const pool = getBulkheadPool(poolName, config);

  // State
  const [status, setStatus] = useState<KBStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<KBError | null>(null);
  const [poolState, setPoolState] = useState<KBBulkheadState>(pool.getState());
  const [isQueued, setIsQueued] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  const isMountedRef = useRef(true);
  const executionIdRef = useRef<string | null>(null);

  // Subscribe to pool updates
  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = pool.subscribe(() => {
      if (isMountedRef.current) {
        setPoolState(pool.getState());
      }
    });
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [pool]);

  const execute = useCallback(async (params?: TParams): Promise<T | null> => {
    const startTime = Date.now();
    const execId = crypto.randomUUID();
    executionIdRef.current = execId;

    setStatus('loading');
    setError(null);

    // Check if we'll be queued
    const currentState = pool.getState();
    if (currentState.activeCount >= (config?.maxConcurrent ?? KB_DEFAULT_BULKHEAD_CONFIG.maxConcurrent)) {
      setIsQueued(true);
      setQueuePosition(currentState.queuedCount + 1);
    }

    try {
      const result = await pool.execute(
        () => (fn as (params?: TParams) => Promise<T>)(params),
        { priority }
      );

      if (!isMountedRef.current || executionIdRef.current !== execId) return null;

      setData(result);
      setStatus('success');
      setIsQueued(false);
      setQueuePosition(null);

      collectTelemetry({
        hookName,
        operationName: 'execute',
        startTime: new Date(startTime),
        endTime: new Date(),
        durationMs: Date.now() - startTime,
        status: 'success',
        retryCount: 0,
        metadata: { poolName, wasQueued: isQueued },
      });

      onSuccess?.(result);
      return result;
    } catch (err) {
      if (!isMountedRef.current || executionIdRef.current !== execId) return null;

      const parsedError = parseError(err);
      setError(parsedError);
      setStatus('error');
      setIsQueued(false);
      setQueuePosition(null);

      collectTelemetry({
        hookName,
        operationName: 'execute',
        startTime: new Date(startTime),
        endTime: new Date(),
        durationMs: Date.now() - startTime,
        status: 'error',
        error: parsedError,
        retryCount: 0,
        metadata: { poolName },
      });

      onError?.(parsedError);
      return null;
    }
  }, [pool, fn, priority, hookName, config, onSuccess, onError, isQueued, poolName]);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
    setIsQueued(false);
    setQueuePosition(null);
    executionIdRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    execute: execute as TParams extends void ? () => Promise<T | null> : (params: TParams) => Promise<T | null>,
    status,
    data,
    error,
    isIdle: status === 'idle',
    isLoading: status === 'loading' && !isQueued,
    isQueued,
    isSuccess: status === 'success',
    isError: status === 'error',
    poolState,
    queuePosition,
    reset,
    clearError,
  };
}

// === EXECUTION WRAPPER ===
export async function executeWithBulkhead<T>(
  poolName: string,
  fn: () => Promise<T>,
  options?: {
    priority?: number;
    timeoutMs?: number;
    config?: Partial<KBBulkheadConfig>;
  }
): Promise<T> {
  const pool = getBulkheadPool(poolName, options?.config);
  return pool.execute(fn, {
    priority: options?.priority,
    timeoutMs: options?.timeoutMs,
  });
}

// === DECORATOR ===
export function withBulkhead<T extends (...args: any[]) => Promise<any>>(
  poolName: string,
  fn: T,
  options?: { priority?: number; config?: Partial<KBBulkheadConfig> }
): T {
  return ((...args: Parameters<T>) => {
    return executeWithBulkhead(
      poolName,
      () => fn(...args),
      options
    );
  }) as T;
}

export default useKBBulkhead;
