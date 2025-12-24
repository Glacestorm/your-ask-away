/**
 * KB 4.5 - Optimistic Mutations
 * Native optimistic updates with automatic rollback and server reconciliation
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { KBStatus, KBError, KBTelemetry } from './types';
import { createKBError } from './useKBBase';
import { 
  startEnhancedSpan, 
  endEnhancedSpan, 
  addEnhancedSpanEvent,
  SpanKind 
} from '@/lib/kbTelemetryEnhanced';

// === TYPES ===
export interface OptimisticMutationOptions<TData, TVariables, TContext = unknown> {
  /** The mutation function that calls the server */
  mutationFn: (variables: TVariables) => Promise<TData>;
  
  /** Generate optimistic data before server response */
  optimisticUpdate?: (variables: TVariables, currentData: TData | null) => TData;
  
  /** Prepare context before mutation (for rollback) */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
  
  /** Called on successful mutation */
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void | Promise<void>;
  
  /** Called on error - return true to prevent rollback */
  onError?: (error: KBError, variables: TVariables, context: TContext) => boolean | void | Promise<boolean | void>;
  
  /** Called after mutation settles (success or error) */
  onSettled?: (data: TData | null, error: KBError | null, variables: TVariables, context: TContext) => void | Promise<void>;
  
  /** Custom rollback function */
  rollback?: (context: TContext, variables: TVariables) => void | Promise<void>;
  
  /** Reconcile server data with optimistic data */
  reconcile?: (serverData: TData, optimisticData: TData, variables: TVariables) => TData;
  
  /** Whether to rollback on error (default: true) */
  rollbackOnError?: boolean;
  
  /** Retry configuration */
  retry?: {
    count: number;
    delay?: number;
    backoff?: 'linear' | 'exponential';
  };
  
  /** Debounce time in ms for rapid mutations */
  debounceMs?: number;
  
  /** Unique key for this mutation (for deduplication) */
  mutationKey?: string;
  
  /** Enable telemetry */
  telemetry?: boolean;
}

export interface OptimisticMutationState<TData> {
  /** Current data (optimistic or server) */
  data: TData | null;
  /** Whether currently mutating */
  isPending: boolean;
  /** Whether mutation succeeded */
  isSuccess: boolean;
  /** Whether mutation failed */
  isError: boolean;
  /** Current error if any */
  error: KBError | null;
  /** Whether showing optimistic data */
  isOptimistic: boolean;
  /** Number of pending mutations */
  pendingCount: number;
  /** Last mutation timestamp */
  lastMutationAt: Date | null;
  /** Mutation history */
  history: MutationHistoryEntry<TData>[];
}

export interface MutationHistoryEntry<TData> {
  id: string;
  timestamp: Date;
  type: 'optimistic' | 'success' | 'error' | 'rollback';
  data: TData | null;
  error?: KBError;
}

export interface OptimisticMutationReturn<TData, TVariables, TContext> {
  /** Current state */
  state: OptimisticMutationState<TData>;
  
  /** Execute the mutation */
  mutate: (variables: TVariables) => void;
  
  /** Execute the mutation and return a promise */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  
  /** Reset mutation state */
  reset: () => void;
  
  /** Manually set data */
  setData: (data: TData | ((prev: TData | null) => TData)) => void;
  
  /** Manually rollback to previous state */
  rollbackManual: () => void;
  
  /** Cancel pending mutation */
  cancel: () => void;
  
  /** Get mutation statistics */
  stats: MutationStats;
}

export interface MutationStats {
  totalMutations: number;
  successfulMutations: number;
  failedMutations: number;
  rollbacks: number;
  averageDuration: number;
  lastDuration: number | null;
}

// === GLOBAL STATE ===
const pendingMutations = new Map<string, AbortController>();
const mutationStats = new Map<string, MutationStats>();

// === HOOK IMPLEMENTATION ===
export function useKBOptimisticMutation<TData, TVariables, TContext = unknown>(
  options: OptimisticMutationOptions<TData, TVariables, TContext>
): OptimisticMutationReturn<TData, TVariables, TContext> {
  const {
    mutationFn,
    optimisticUpdate,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    rollback,
    reconcile,
    rollbackOnError = true,
    retry,
    debounceMs,
    mutationKey,
    telemetry = true,
  } = options;

  // State
  const [data, setDataState] = useState<TData | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<KBError | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastMutationAt, setLastMutationAt] = useState<Date | null>(null);
  const [history, setHistory] = useState<MutationHistoryEntry<TData>[]>([]);

  // Refs
  const previousDataRef = useRef<TData | null>(null);
  const contextRef = useRef<TContext | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutationIdRef = useRef(0);
  const statsRef = useRef<MutationStats>({
    totalMutations: 0,
    successfulMutations: 0,
    failedMutations: 0,
    rollbacks: 0,
    averageDuration: 0,
    lastDuration: null,
  });

  // Add history entry
  const addHistoryEntry = useCallback((
    type: MutationHistoryEntry<TData>['type'],
    entryData: TData | null,
    entryError?: KBError
  ) => {
    const entry: MutationHistoryEntry<TData> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      type,
      data: entryData,
      error: entryError,
    };
    setHistory(prev => [...prev.slice(-9), entry]); // Keep last 10 entries
  }, []);

  // Perform rollback
  const performRollback = useCallback(async (
    context: TContext,
    variables: TVariables
  ) => {
    if (rollback) {
      await rollback(context, variables);
    }
    
    if (previousDataRef.current !== null) {
      setDataState(previousDataRef.current);
      addHistoryEntry('rollback', previousDataRef.current);
    }
    
    setIsOptimistic(false);
    statsRef.current.rollbacks++;
  }, [rollback, addHistoryEntry]);

  // Execute with retry
  const executeWithRetry = useCallback(async (
    fn: () => Promise<TData>,
    retryConfig?: typeof retry
  ): Promise<TData> => {
    if (!retryConfig || retryConfig.count <= 0) {
      return fn();
    }

    let lastError: Error | null = null;
    const maxAttempts = retryConfig.count + 1;
    const baseDelay = retryConfig.delay || 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        
        if (attempt < maxAttempts - 1) {
          const delay = retryConfig.backoff === 'exponential'
            ? baseDelay * Math.pow(2, attempt)
            : baseDelay * (attempt + 1);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }, []);

  // Core mutation logic
  const executeMutation = useCallback(async (
    variables: TVariables
  ): Promise<TData> => {
    const mutationId = ++mutationIdRef.current;
    const startTime = Date.now();
    let span: ReturnType<typeof startEnhancedSpan> | null = null;

    if (telemetry) {
      span = startEnhancedSpan(`mutation.${mutationKey || 'anonymous'}`, {
        kind: SpanKind.CLIENT,
        attributes: {
          'mutation.id': mutationId,
          'mutation.key': mutationKey || 'anonymous',
          'mutation.hasOptimistic': !!optimisticUpdate,
        },
      });
    }

    // Cancel previous pending mutation if same key
    if (mutationKey && pendingMutations.has(mutationKey)) {
      pendingMutations.get(mutationKey)?.abort();
    }

    // Create abort controller
    abortControllerRef.current = new AbortController();
    if (mutationKey) {
      pendingMutations.set(mutationKey, abortControllerRef.current);
    }

    try {
      setIsPending(true);
      setIsError(false);
      setError(null);
      setPendingCount(c => c + 1);
      setLastMutationAt(new Date());

      // Save previous state
      previousDataRef.current = data;

      // Execute onMutate and get context
      let context = undefined as TContext;
      if (onMutate) {
        context = await onMutate(variables);
        contextRef.current = context;
      }

      // Apply optimistic update
      if (optimisticUpdate) {
        const optimisticData = optimisticUpdate(variables, data);
        setDataState(optimisticData);
        setIsOptimistic(true);
        addHistoryEntry('optimistic', optimisticData);

        if (span) {
          addEnhancedSpanEvent(span.spanId, 'optimistic.applied');
        }
      }

      // Execute mutation with retry
      const serverData = await executeWithRetry(
        () => mutationFn(variables),
        retry
      );

      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Mutation aborted');
      }

      // Reconcile if needed
      let finalData: TData = serverData;
      if (reconcile && isOptimistic && data) {
        finalData = reconcile(serverData, data as TData, variables);
        
        if (span) {
          addEnhancedSpanEvent(span.spanId, 'data.reconciled');
        }
      }

      // Update state
      setDataState(finalData);
      setIsOptimistic(false);
      setIsSuccess(true);
      addHistoryEntry('success', finalData);

      // Update stats
      const duration = Date.now() - startTime;
      statsRef.current.totalMutations++;
      statsRef.current.successfulMutations++;
      statsRef.current.lastDuration = duration;
      statsRef.current.averageDuration = 
        (statsRef.current.averageDuration * (statsRef.current.totalMutations - 1) + duration) 
        / statsRef.current.totalMutations;

      // Call onSuccess
      if (onSuccess) {
        await onSuccess(finalData, variables, context);
      }

      // Call onSettled
      if (onSettled) {
        await onSettled(finalData, null, variables, context);
      }

      if (span) {
        endEnhancedSpan(span.spanId, 'OK', {
          attributes: { 'mutation.duration_ms': duration },
        });
      }

      return finalData;
    } catch (err) {
      const kbError = createKBError(
        'MUTATION_ERROR',
        (err as Error).message,
        {
          retryable: true,
          details: { variables, mutationKey },
        }
      );

      setIsError(true);
      setError(kbError);
      addHistoryEntry('error', null, kbError);

      // Update stats
      statsRef.current.totalMutations++;
      statsRef.current.failedMutations++;
      statsRef.current.lastDuration = Date.now() - startTime;

      // Call onError and check if should rollback
      let preventRollback = false;
      if (onError && contextRef.current !== null) {
        const result = await onError(kbError, variables, contextRef.current);
        preventRollback = result === true;
      }

      // Perform rollback if needed
      if (rollbackOnError && !preventRollback && contextRef.current !== null) {
        await performRollback(contextRef.current, variables);
      }

      // Call onSettled
      if (onSettled && contextRef.current !== null) {
        await onSettled(null, kbError, variables, contextRef.current);
      }

      if (span) {
        endEnhancedSpan(span.spanId, 'ERROR', {
          statusMessage: kbError.message,
        });
      }

      throw kbError;
    } finally {
      setIsPending(false);
      setPendingCount(c => Math.max(0, c - 1));
      
      if (mutationKey) {
        pendingMutations.delete(mutationKey);
      }
      abortControllerRef.current = null;
    }
  }, [
    data,
    mutationFn,
    optimisticUpdate,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    rollbackOnError,
    performRollback,
    reconcile,
    isOptimistic,
    retry,
    executeWithRetry,
    mutationKey,
    telemetry,
    addHistoryEntry,
  ]);

  // Debounced mutation
  const debouncedMutate = useCallback((variables: TVariables) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (debounceMs && debounceMs > 0) {
      debounceTimerRef.current = setTimeout(() => {
        executeMutation(variables).catch(() => {});
      }, debounceMs);
    } else {
      executeMutation(variables).catch(() => {});
    }
  }, [executeMutation, debounceMs]);

  // Public mutate function
  const mutate = useCallback((variables: TVariables) => {
    debouncedMutate(variables);
  }, [debouncedMutate]);

  // Public mutateAsync function
  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    return executeMutation(variables);
  }, [executeMutation]);

  // Reset state
  const reset = useCallback(() => {
    setDataState(null);
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setIsOptimistic(false);
    setPendingCount(0);
    setLastMutationAt(null);
    setHistory([]);
    previousDataRef.current = null;
    contextRef.current = null;
  }, []);

  // Manual set data
  const setData = useCallback((
    updater: TData | ((prev: TData | null) => TData)
  ) => {
    setDataState(prev => {
      const newData = typeof updater === 'function' 
        ? (updater as (prev: TData | null) => TData)(prev)
        : updater;
      return newData;
    });
    setIsOptimistic(false);
  }, []);

  // Manual rollback
  const rollbackManual = useCallback(() => {
    if (previousDataRef.current !== null) {
      setDataState(previousDataRef.current);
      setIsOptimistic(false);
      addHistoryEntry('rollback', previousDataRef.current);
      statsRef.current.rollbacks++;
    }
  }, [addHistoryEntry]);

  // Cancel pending mutation
  const cancel = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPending(false);
  }, []);

  // Build state object
  const state = useMemo<OptimisticMutationState<TData>>(() => ({
    data,
    isPending,
    isSuccess,
    isError,
    error,
    isOptimistic,
    pendingCount,
    lastMutationAt,
    history,
  }), [data, isPending, isSuccess, isError, error, isOptimistic, pendingCount, lastMutationAt, history]);

  return {
    state,
    mutate,
    mutateAsync,
    reset,
    setData,
    rollbackManual,
    cancel,
    stats: statsRef.current,
  };
}

// === BATCH MUTATIONS ===
export interface BatchMutationOptions<TData, TVariables> {
  mutations: Array<{
    variables: TVariables;
    optimistic?: TData;
  }>;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (results: TData[]) => void;
  onError?: (errors: KBError[], successfulResults: TData[]) => void;
  concurrency?: number;
  stopOnError?: boolean;
}

export function useKBBatchMutation<TData, TVariables>() {
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, failed: 0 });
  const [results, setResults] = useState<TData[]>([]);
  const [errors, setErrors] = useState<KBError[]>([]);

  const executeBatch = useCallback(async (
    options: BatchMutationOptions<TData, TVariables>
  ): Promise<{ results: TData[]; errors: KBError[] }> => {
    const {
      mutations,
      mutationFn,
      onSuccess,
      onError,
      concurrency = 3,
      stopOnError = false,
    } = options;

    setIsPending(true);
    setProgress({ completed: 0, total: mutations.length, failed: 0 });
    setResults([]);
    setErrors([]);

    const successfulResults: TData[] = [];
    const failedErrors: KBError[] = [];

    // Process in batches
    for (let i = 0; i < mutations.length; i += concurrency) {
      const batch = mutations.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async ({ variables }) => {
        try {
          const result = await mutationFn(variables);
          successfulResults.push(result);
          setProgress(p => ({ ...p, completed: p.completed + 1 }));
          return { success: true, data: result };
        } catch (err) {
          const kbError = createKBError(
            'BATCH_MUTATION_ERROR',
            (err as Error).message,
            { retryable: true }
          );
          failedErrors.push(kbError);
          setProgress(p => ({ ...p, completed: p.completed + 1, failed: p.failed + 1 }));
          return { success: false, error: kbError };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      if (stopOnError && batchResults.some(r => !r.success)) {
        break;
      }
    }

    setResults(successfulResults);
    setErrors(failedErrors);
    setIsPending(false);

    if (failedErrors.length > 0) {
      onError?.(failedErrors, successfulResults);
    } else {
      onSuccess?.(successfulResults);
    }

    return { results: successfulResults, errors: failedErrors };
  }, []);

  return {
    executeBatch,
    isPending,
    progress,
    results,
    errors,
  };
}

// === MUTATION QUEUE ===
interface QueuedMutation<TVariables> {
  id: string;
  variables: TVariables;
  priority: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function useKBMutationQueue<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [queue, setQueue] = useState<QueuedMutation<TVariables>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Map<string, TData>>(new Map());
  const processingRef = useRef(false);

  const enqueue = useCallback((
    variables: TVariables,
    priority: number = 0
  ): string => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    setQueue(prev => {
      const newQueue = [...prev, {
        id,
        variables,
        priority,
        createdAt: new Date(),
        status: 'pending' as const,
      }];
      // Sort by priority (higher first)
      return newQueue.sort((a, b) => b.priority - a.priority);
    });

    return id;
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    while (true) {
      const nextItem = queue.find(item => item.status === 'pending');
      if (!nextItem) break;

      setQueue(prev => prev.map(item => 
        item.id === nextItem.id ? { ...item, status: 'processing' as const } : item
      ));

      try {
        const result = await mutationFn(nextItem.variables);
        setResults(prev => new Map(prev).set(nextItem.id, result));
        setQueue(prev => prev.map(item =>
          item.id === nextItem.id ? { ...item, status: 'completed' as const } : item
        ));
      } catch {
        setQueue(prev => prev.map(item =>
          item.id === nextItem.id ? { ...item, status: 'failed' as const } : item
        ));
      }
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [queue, mutationFn]);

  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(item => 
      item.status !== 'completed' && item.status !== 'failed'
    ));
  }, []);

  const retryFailed = useCallback(() => {
    setQueue(prev => prev.map(item =>
      item.status === 'failed' ? { ...item, status: 'pending' as const } : item
    ));
  }, []);

  return {
    queue,
    isProcessing,
    results,
    enqueue,
    processQueue,
    clearCompleted,
    retryFailed,
    pendingCount: queue.filter(i => i.status === 'pending').length,
    failedCount: queue.filter(i => i.status === 'failed').length,
  };
}

// === EXPORTS ===
export default useKBOptimisticMutation;
