/**
 * KB 4.5 - Web Worker Management
 * Phase 19: Advanced State & Communication
 * 
 * Features:
 * - Worker pool management
 * - Task queuing
 * - Load balancing
 * - Inline workers
 * - Transferable objects
 * - Progress tracking
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type WorkerStatus = 'idle' | 'busy' | 'terminated' | 'error';

export interface WorkerTask<TInput = unknown, TOutput = unknown> {
  id: string;
  type: string;
  input: TInput;
  transferables?: Transferable[];
  priority?: number;
  timeout?: number;
  onProgress?: (progress: number) => void;
  resolve: (output: TOutput) => void;
  reject: (error: Error) => void;
  createdAt: number;
  startedAt?: number;
}

export interface WorkerInfo {
  id: string;
  worker: Worker;
  status: WorkerStatus;
  currentTask: string | null;
  tasksCompleted: number;
  errorCount: number;
  avgProcessingTime: number;
  lastActiveAt: number;
}

export interface WorkerPoolConfig {
  workerScript?: string | URL;
  workerFactory?: () => Worker;
  minWorkers?: number;
  maxWorkers?: number;
  idleTimeout?: number;
  taskTimeout?: number;
  enableAutoScale?: boolean;
  scaleUpThreshold?: number;
  scaleDownThreshold?: number;
  onError?: (error: Error, task?: WorkerTask) => void;
}

export interface WorkerMessage<T = unknown> {
  type: 'result' | 'error' | 'progress' | 'ready';
  taskId: string;
  data?: T;
  error?: string;
  progress?: number;
}

export interface WorkerPoolMetrics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgWaitTime: number;
  avgProcessingTime: number;
}

// =============================================================================
// UTILITIES
// =============================================================================

const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateWorkerId = (): string => {
  return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create inline worker from function
export const createInlineWorker = (fn: Function): Worker => {
  const blob = new Blob([`
    const workerFn = ${fn.toString()};
    
    self.onmessage = async (event) => {
      const { taskId, type, input } = event.data;
      
      try {
        const result = await workerFn(input, (progress) => {
          self.postMessage({ type: 'progress', taskId, progress });
        });
        
        self.postMessage({ type: 'result', taskId, data: result });
      } catch (error) {
        self.postMessage({ type: 'error', taskId, error: error.message });
      }
    };
    
    self.postMessage({ type: 'ready' });
  `], { type: 'application/javascript' });
  
  return new Worker(URL.createObjectURL(blob));
};

// =============================================================================
// WORKER POOL
// =============================================================================

class WorkerPool {
  private workers: Map<string, WorkerInfo> = new Map();
  private taskQueue: WorkerTask[] = [];
  private config: Required<WorkerPoolConfig>;
  private metrics: WorkerPoolMetrics;
  private waitTimes: number[] = [];
  private processingTimes: number[] = [];

  constructor(config: WorkerPoolConfig) {
    this.config = {
      workerScript: config.workerScript || '',
      workerFactory: config.workerFactory || (() => {
        if (!config.workerScript) {
          throw new Error('Either workerScript or workerFactory must be provided');
        }
        return new Worker(config.workerScript);
      }),
      minWorkers: config.minWorkers !== undefined ? config.minWorkers : 1,
      maxWorkers: config.maxWorkers ?? (navigator.hardwareConcurrency || 4),
      idleTimeout: config.idleTimeout ?? 60000,
      taskTimeout: config.taskTimeout ?? 30000,
      enableAutoScale: config.enableAutoScale ?? true,
      scaleUpThreshold: config.scaleUpThreshold ?? 5,
      scaleDownThreshold: config.scaleDownThreshold ?? 0,
      onError: config.onError ?? console.error,
    };

    this.metrics = {
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      queuedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgWaitTime: 0,
      avgProcessingTime: 0,
    };

    // Initialize minimum workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.addWorker();
    }
  }

  private addWorker(): WorkerInfo | null {
    if (this.workers.size >= this.config.maxWorkers) return null;

    const id = generateWorkerId();
    const worker = this.config.workerFactory();
    
    const info: WorkerInfo = {
      id,
      worker,
      status: 'idle',
      currentTask: null,
      tasksCompleted: 0,
      errorCount: 0,
      avgProcessingTime: 0,
      lastActiveAt: Date.now(),
    };

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      this.handleWorkerMessage(id, event.data);
    };

    worker.onerror = (error) => {
      this.handleWorkerError(id, error);
    };

    this.workers.set(id, info);
    this.updateMetrics();
    
    return info;
  }

  private removeWorker(id: string): void {
    const info = this.workers.get(id);
    if (info) {
      info.worker.terminate();
      info.status = 'terminated';
      this.workers.delete(id);
      this.updateMetrics();
    }
  }

  private handleWorkerMessage(workerId: string, message: WorkerMessage): void {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;

    if (message.type === 'ready') return;

    const taskId = message.taskId;
    const taskIndex = this.taskQueue.findIndex(t => t.id === taskId);
    
    // Find in queue or check current task
    let task: WorkerTask | undefined;
    if (taskIndex >= 0) {
      task = this.taskQueue[taskIndex];
    }
    
    // Task might be the current one
    if (!task && workerInfo.currentTask === taskId) {
      // Task was already dequeued, need to track separately
      return;
    }

    switch (message.type) {
      case 'result':
        if (task) {
          const processingTime = Date.now() - (task.startedAt || task.createdAt);
          this.processingTimes.push(processingTime);
          if (this.processingTimes.length > 100) this.processingTimes.shift();
          
          task.resolve(message.data);
          this.metrics.completedTasks++;
          workerInfo.tasksCompleted++;
          
          const times = [...this.processingTimes];
          workerInfo.avgProcessingTime = times.reduce((a, b) => a + b, 0) / times.length;
        }
        break;

      case 'error':
        if (task) {
          task.reject(new Error(message.error));
          this.metrics.failedTasks++;
          workerInfo.errorCount++;
          this.config.onError(new Error(message.error), task);
        }
        break;

      case 'progress':
        if (task?.onProgress && message.progress !== undefined) {
          task.onProgress(message.progress);
        }
        return; // Don't mark worker as idle
    }

    // Mark worker as idle
    workerInfo.status = 'idle';
    workerInfo.currentTask = null;
    workerInfo.lastActiveAt = Date.now();
    
    // Remove completed task
    if (taskIndex >= 0) {
      this.taskQueue.splice(taskIndex, 1);
    }
    
    this.updateMetrics();
    this.processQueue();
  }

  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    const workerInfo = this.workers.get(workerId);
    if (workerInfo) {
      workerInfo.status = 'error';
      workerInfo.errorCount++;
      this.config.onError(new Error(error.message));

      // Replace failed worker
      this.removeWorker(workerId);
      if (this.workers.size < this.config.minWorkers) {
        this.addWorker();
      }
    }
  }

  private getIdleWorker(): WorkerInfo | null {
    for (const [, info] of this.workers) {
      if (info.status === 'idle') {
        return info;
      }
    }
    return null;
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    // Auto-scale up
    if (
      this.config.enableAutoScale &&
      this.taskQueue.filter(t => !t.startedAt).length >= this.config.scaleUpThreshold &&
      this.workers.size < this.config.maxWorkers
    ) {
      this.addWorker();
    }

    // Find pending tasks (not yet started)
    const pendingTasks = this.taskQueue
      .filter(t => !t.startedAt)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const task of pendingTasks) {
      const worker = this.getIdleWorker();
      if (!worker) break;

      worker.status = 'busy';
      worker.currentTask = task.id;
      task.startedAt = Date.now();

      const waitTime = task.startedAt - task.createdAt;
      this.waitTimes.push(waitTime);
      if (this.waitTimes.length > 100) this.waitTimes.shift();

      worker.worker.postMessage(
        { taskId: task.id, type: task.type, input: task.input },
        task.transferables || []
      );

      // Set timeout
      if (task.timeout || this.config.taskTimeout) {
        setTimeout(() => {
          if (!task.startedAt || this.taskQueue.includes(task)) {
            task.reject(new Error('Task timeout'));
            this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
            if (worker.currentTask === task.id) {
              worker.status = 'idle';
              worker.currentTask = null;
            }
            this.updateMetrics();
          }
        }, task.timeout || this.config.taskTimeout);
      }
    }

    this.updateMetrics();
  }

  private updateMetrics(): void {
    let active = 0;
    let idle = 0;
    
    this.workers.forEach(info => {
      if (info.status === 'busy') active++;
      if (info.status === 'idle') idle++;
    });

    this.metrics = {
      ...this.metrics,
      totalWorkers: this.workers.size,
      activeWorkers: active,
      idleWorkers: idle,
      queuedTasks: this.taskQueue.filter(t => !t.startedAt).length,
      avgWaitTime: this.waitTimes.length > 0
        ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
        : 0,
      avgProcessingTime: this.processingTimes.length > 0
        ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
        : 0,
    };
  }

  execute<TInput, TOutput>(
    type: string,
    input: TInput,
    options: {
      transferables?: Transferable[];
      priority?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<TInput, TOutput> = {
        id: generateTaskId(),
        type,
        input,
        transferables: options.transferables,
        priority: options.priority,
        timeout: options.timeout,
        onProgress: options.onProgress,
        resolve: resolve as (output: unknown) => void,
        reject,
        createdAt: Date.now(),
      };

      this.taskQueue.push(task as WorkerTask);
      this.processQueue();
    });
  }

  getMetrics(): WorkerPoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getWorkerStats(): WorkerInfo[] {
    return Array.from(this.workers.values());
  }

  scale(count: number): void {
    const current = this.workers.size;
    
    if (count > current) {
      const toAdd = Math.min(count - current, this.config.maxWorkers - current);
      for (let i = 0; i < toAdd; i++) {
        this.addWorker();
      }
    } else if (count < current) {
      const toRemove = Math.min(current - count, current - this.config.minWorkers);
      const idleWorkers = Array.from(this.workers.entries())
        .filter(([, info]) => info.status === 'idle')
        .slice(0, toRemove);
      
      idleWorkers.forEach(([id]) => this.removeWorker(id));
    }
  }

  terminate(): void {
    this.workers.forEach((info, id) => {
      info.worker.terminate();
    });
    this.workers.clear();
    this.taskQueue.forEach(task => task.reject(new Error('Pool terminated')));
    this.taskQueue = [];
    this.updateMetrics();
  }
}

// =============================================================================
// HOOKS
// =============================================================================

export function useKBWorkerPool(config: WorkerPoolConfig) {
  const poolRef = useRef<WorkerPool | null>(null);
  const [metrics, setMetrics] = useState<WorkerPoolMetrics>({
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    queuedTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgWaitTime: 0,
    avgProcessingTime: 0,
  });

  // Initialize pool
  useEffect(() => {
    poolRef.current = new WorkerPool(config);
    
    const interval = setInterval(() => {
      if (poolRef.current) {
        setMetrics(poolRef.current.getMetrics());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      poolRef.current?.terminate();
    };
  }, []);

  const execute = useCallback(<TInput, TOutput>(
    type: string,
    input: TInput,
    options?: {
      transferables?: Transferable[];
      priority?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<TOutput> => {
    if (!poolRef.current) {
      return Promise.reject(new Error('Worker pool not initialized'));
    }
    return poolRef.current.execute(type, input, options);
  }, []);

  const scale = useCallback((count: number) => {
    poolRef.current?.scale(count);
  }, []);

  const getWorkerStats = useCallback(() => {
    return poolRef.current?.getWorkerStats() || [];
  }, []);

  return {
    execute,
    scale,
    getWorkerStats,
    metrics,
    terminate: () => poolRef.current?.terminate(),
  };
}

export function useKBInlineWorker<TInput, TOutput>(
  workerFn: (input: TInput, reportProgress?: (progress: number) => void) => TOutput | Promise<TOutput>
) {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const pendingRef = useRef<{
    resolve: (value: TOutput) => void;
    reject: (error: Error) => void;
  } | null>(null);

  useEffect(() => {
    workerRef.current = createInlineWorker(workerFn);

    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage<TOutput>>) => {
      const { type, data, error: errorMsg, progress: prog } = event.data;

      switch (type) {
        case 'result':
          setIsProcessing(false);
          setProgress(100);
          pendingRef.current?.resolve(data as TOutput);
          pendingRef.current = null;
          break;

        case 'error':
          setIsProcessing(false);
          const err = new Error(errorMsg);
          setError(err);
          pendingRef.current?.reject(err);
          pendingRef.current = null;
          break;

        case 'progress':
          if (prog !== undefined) setProgress(prog);
          break;
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const execute = useCallback((input: TInput): Promise<TOutput> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      setIsProcessing(true);
      setProgress(0);
      setError(null);
      pendingRef.current = { resolve, reject };

      workerRef.current.postMessage({
        taskId: generateTaskId(),
        type: 'execute',
        input,
      });
    });
  }, []);

  return {
    execute,
    isProcessing,
    progress,
    error,
    terminate: () => workerRef.current?.terminate(),
  };
}

export function useKBWorkerTask<TInput, TOutput>(
  pool: ReturnType<typeof useKBWorkerPool>,
  taskType: string
) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<TOutput | null>(null);

  const execute = useCallback(async (
    input: TInput,
    options?: { priority?: number; timeout?: number }
  ): Promise<TOutput> => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const output = await pool.execute<TInput, TOutput>(taskType, input, {
        ...options,
        onProgress: setProgress,
      });
      setResult(output);
      return output;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pool, taskType]);

  return {
    execute,
    isLoading,
    progress,
    error,
    result,
  };
}

export default useKBWorkerPool;
