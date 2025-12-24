/**
 * KB 4.5 - React 19 Hooks Integration
 * Enterprise-grade wrappers for React 19 features
 * 
 * Features:
 * - useKBOptimistic: Optimistic updates with Circuit Breaker + Rollback
 * - useKBFormAction: Form actions with validation + status tracking
 * - useKBUse: Suspense-ready resource consumption with error handling
 */

import { 
  useOptimistic, 
  useActionState, 
  useTransition,
  use,
  useState,
  useCallback,
  useRef,
  useEffect,
  startTransition,
} from 'react';
import type { KBError, KBStatus, KBCircuitBreakerState, KBCircuitState } from './types';
import { KB_DEFAULT_CIRCUIT_BREAKER_CONFIG, KB_ERROR_CODES } from './types';
import { createKBError, collectTelemetry } from './useKBBase';

// ============================================================================
// Types
// ============================================================================

export interface KBOptimisticOptions<T, TOptimistic> {
  /** Circuit breaker configuration */
  circuitBreaker?: Partial<typeof KB_DEFAULT_CIRCUIT_BREAKER_CONFIG>;
  /** Rollback delay in ms before reverting optimistic state */
  rollbackDelay?: number;
  /** Called when optimistic update is applied */
  onOptimisticApply?: (optimisticValue: TOptimistic) => void;
  /** Called when rollback occurs */
  onRollback?: (originalValue: T, error?: Error) => void;
  /** Called on successful commit */
  onCommit?: (newValue: T) => void;
  /** Telemetry operation name */
  operationName?: string;
  /** Enable telemetry collection */
  enableTelemetry?: boolean;
}

export interface KBOptimisticReturn<T, TOptimistic> {
  /** Current optimistic state */
  optimisticState: T;
  /** Apply optimistic update */
  applyOptimistic: (action: TOptimistic) => void;
  /** Execute action with optimistic update */
  execute: (
    action: TOptimistic,
    asyncAction: () => Promise<T>
  ) => Promise<T | null>;
  /** Whether an optimistic update is pending */
  isPending: boolean;
  /** Circuit breaker state */
  circuitState: KBCircuitBreakerState;
  /** Last error if any */
  error: KBError | null;
  /** Clear error state */
  clearError: () => void;
  /** Reset to base state */
  reset: () => void;
}

export interface KBFormActionOptions<TInput, TResult> {
  /** Zod schema or validation function */
  validate?: (input: TInput) => TInput | Promise<TInput>;
  /** Called on validation error */
  onValidationError?: (error: Error) => void;
  /** Called on success */
  onSuccess?: (result: TResult) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Success toast message */
  successMessage?: string;
  /** Error toast message */
  errorMessage?: string;
  /** Operation name for telemetry */
  operationName?: string;
  /** Enable telemetry */
  enableTelemetry?: boolean;
  /** Initial state */
  initialState?: TResult | null;
  /** Transform form data before action */
  transformInput?: (formData: FormData) => TInput;
}

export interface KBFormActionReturn<TInput, TResult> {
  /** Current form state/result */
  state: TResult | null;
  /** Form action to pass to form */
  formAction: (formData: FormData) => void;
  /** Direct action execution */
  execute: (input: TInput) => Promise<TResult | null>;
  /** Whether action is pending */
  isPending: boolean;
  /** Form status details */
  status: KBStatus;
  /** Last error */
  error: KBError | null;
  /** Validation errors by field */
  validationErrors: Record<string, string>;
  /** Clear all errors */
  clearErrors: () => void;
  /** Reset form state */
  reset: () => void;
}

export interface KBUseOptions<T> {
  /** Fallback value if resource fails */
  fallback?: T;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Transform the resolved value */
  transform?: (value: T) => T;
  /** Enable suspense (default: true) */
  suspense?: boolean;
  /** Cache key for deduplication */
  cacheKey?: string;
  /** Cache TTL in ms */
  cacheTTL?: number;
  /** Operation name for telemetry */
  operationName?: string;
}

export interface KBUseReturn<T> {
  /** Resolved data */
  data: T | null;
  /** Loading state (when suspense is disabled) */
  isLoading: boolean;
  /** Error state */
  error: KBError | null;
  /** Status */
  status: KBStatus;
}

// ============================================================================
// Circuit Breaker State Management
// ============================================================================

const circuitBreakerStates = new Map<string, KBCircuitBreakerState>();

function getCircuitBreakerState(key: string): KBCircuitBreakerState {
  if (!circuitBreakerStates.has(key)) {
    circuitBreakerStates.set(key, {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastStateChange: new Date(),
      totalTrips: 0,
    });
  }
  return circuitBreakerStates.get(key)!;
}

function updateCircuitBreaker(
  key: string,
  success: boolean,
  config: typeof KB_DEFAULT_CIRCUIT_BREAKER_CONFIG
): KBCircuitBreakerState {
  const state = getCircuitBreakerState(key);
  const now = new Date();
  
  if (success) {
    if (state.state === 'HALF_OPEN') {
      state.successes++;
      if (state.successes >= config.successThreshold) {
        state.state = 'CLOSED';
        state.failures = 0;
        state.successes = 0;
        state.lastStateChange = now;
      }
    } else {
      state.failures = Math.max(0, state.failures - 1);
    }
  } else {
    state.failures++;
    state.lastFailureTime = now;
    
    if (state.failures >= config.failureThreshold) {
      state.state = 'OPEN';
      state.lastStateChange = now;
      state.totalTrips++;
    }
  }
  
  // Check if we should transition from open to half-open
  if (state.state === 'OPEN' && state.lastStateChange) {
    const timeSinceOpen = now.getTime() - state.lastStateChange.getTime();
    if (timeSinceOpen >= config.resetTimeoutMs) {
      state.state = 'HALF_OPEN';
      state.successes = 0;
      state.lastStateChange = now;
    }
  }
  
  circuitBreakerStates.set(key, state);
  return state;
}

function isCircuitOpen(state: KBCircuitBreakerState, config: typeof KB_DEFAULT_CIRCUIT_BREAKER_CONFIG): boolean {
  if (state.state !== 'OPEN') return false;
  
  const now = Date.now();
  const timeSinceOpen = now - state.lastStateChange.getTime();
  return timeSinceOpen < config.resetTimeoutMs;
}

// ============================================================================
// useKBOptimistic
// ============================================================================

/**
 * React 19 useOptimistic with Circuit Breaker, Telemetry, and Rollback
 * 
 * @example
 * ```tsx
 * const { optimisticState, execute } = useKBOptimistic(items, {
 *   onRollback: (original) => toast.error('Failed, reverting...'),
 *   operationName: 'updateItem'
 * });
 * 
 * const handleUpdate = async (item) => {
 *   await execute(
 *     { type: 'update', item },
 *     async () => api.updateItem(item)
 *   );
 * };
 * ```
 */
export function useKBOptimistic<T, TOptimistic>(
  baseState: T,
  updateFn: (state: T, action: TOptimistic) => T,
  options: KBOptimisticOptions<T, TOptimistic> = {}
): KBOptimisticReturn<T, TOptimistic> {
  const {
    circuitBreaker = KB_DEFAULT_CIRCUIT_BREAKER_CONFIG,
    rollbackDelay = 0,
    onOptimisticApply,
    onRollback,
    onCommit,
    operationName = 'optimistic_update',
    enableTelemetry = true,
  } = options;

  const cbConfig = { ...KB_DEFAULT_CIRCUIT_BREAKER_CONFIG, ...circuitBreaker };
  const cbKey = `kb_optimistic_${operationName}`;
  
  const [optimisticState, addOptimistic] = useOptimistic(baseState, updateFn);
  const [isPending, startTransitionLocal] = useTransition();
  const [error, setError] = useState<KBError | null>(null);
  const [circuitState, setCircuitState] = useState<KBCircuitBreakerState>(
    getCircuitBreakerState(cbKey)
  );
  
  const originalStateRef = useRef<T>(baseState);
  const rollbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync base state
  useEffect(() => {
    originalStateRef.current = baseState;
  }, [baseState]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rollbackTimeoutRef.current) {
        clearTimeout(rollbackTimeoutRef.current);
      }
    };
  }, []);

  const applyOptimistic = useCallback((action: TOptimistic) => {
    startTransitionLocal(() => {
      addOptimistic(action);
      onOptimisticApply?.(action);
    });
  }, [addOptimistic, onOptimisticApply]);

  const execute = useCallback(async (
    action: TOptimistic,
    asyncAction: () => Promise<T>
  ): Promise<T | null> => {
    const startTime = Date.now();
    const currentCircuitState = getCircuitBreakerState(cbKey);
    
    // Check circuit breaker
    if (isCircuitOpen(currentCircuitState, cbConfig)) {
      const cbError = createKBError(
        KB_ERROR_CODES.CIRCUIT_OPEN,
        'Circuit breaker is open',
        { retryable: false }
      );
      setError(cbError);
      return null;
    }

    // Apply optimistic update
    startTransitionLocal(() => {
      addOptimistic(action);
      onOptimisticApply?.(action);
    });

    try {
      const result = await asyncAction();
      
      // Success - update circuit breaker
      const newState = updateCircuitBreaker(cbKey, true, cbConfig);
      setCircuitState(newState);
      setError(null);
      onCommit?.(result);

      // Collect telemetry
      if (enableTelemetry) {
        collectTelemetry('useKBOptimistic', operationName, 'success', Date.now() - startTime);
      }

      return result;
    } catch (err) {
      // Failure - update circuit breaker
      const newState = updateCircuitBreaker(cbKey, false, cbConfig);
      setCircuitState(newState);

      const kbError = createKBError(
        KB_ERROR_CODES.SERVER_ERROR,
        err instanceof Error ? err.message : 'Optimistic update failed',
        { retryable: true, originalError: err }
      );
      setError(kbError);

      // Schedule rollback
      if (rollbackDelay > 0) {
        rollbackTimeoutRef.current = setTimeout(() => {
          onRollback?.(originalStateRef.current, err instanceof Error ? err : undefined);
        }, rollbackDelay);
      } else {
        onRollback?.(originalStateRef.current, err instanceof Error ? err : undefined);
      }

      // Collect telemetry
      if (enableTelemetry) {
        collectTelemetry('useKBOptimistic', operationName, 'error', Date.now() - startTime, kbError);
      }

      return null;
    }
  }, [
    cbKey, cbConfig, addOptimistic, onOptimisticApply, 
    onCommit, onRollback, rollbackDelay, operationName, enableTelemetry
  ]);

  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setError(null);
    if (rollbackTimeoutRef.current) {
      clearTimeout(rollbackTimeoutRef.current);
    }
  }, []);

  return {
    optimisticState,
    applyOptimistic,
    execute,
    isPending,
    circuitState,
    error,
    clearError,
    reset,
  };
}

// ============================================================================
// useKBFormAction
// ============================================================================

/**
 * React 19 useActionState + useFormStatus with validation and KB integration
 * 
 * @example
 * ```tsx
 * const { formAction, isPending, error, validationErrors } = useKBFormAction(
 *   async (input) => api.createUser(input),
 *   {
 *     validate: userSchema.parse,
 *     onSuccess: () => toast.success('User created!'),
 *   }
 * );
 * 
 * return (
 *   <form action={formAction}>
 *     <input name="email" />
 *     {validationErrors.email && <span>{validationErrors.email}</span>}
 *     <button disabled={isPending}>Submit</button>
 *   </form>
 * );
 * ```
 */
export function useKBFormAction<TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
  options: KBFormActionOptions<TInput, TResult> = {}
): KBFormActionReturn<TInput, TResult> {
  const {
    validate,
    onValidationError,
    onSuccess,
    onError,
    operationName = 'form_action',
    enableTelemetry = true,
    initialState = null,
    transformInput,
  } = options;

  type ActionState = {
    result: TResult | null;
    error: KBError | null;
    validationErrors: Record<string, string>;
    status: KBStatus;
  };

  const initialActionState: ActionState = {
    result: initialState,
    error: null,
    validationErrors: {},
    status: 'idle',
  };

  const wrappedAction = async (
    prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> => {
    const startTime = Date.now();

    try {
      // Transform form data to input
      let input: TInput;
      if (transformInput) {
        input = transformInput(formData);
      } else {
        // Default: convert FormData to object
        input = Object.fromEntries(formData.entries()) as TInput;
      }

      // Validate if validator provided
      if (validate) {
        try {
          input = await validate(input);
        } catch (validationError) {
          const validationErrors: Record<string, string> = {};
          
          // Handle Zod-style errors
          if (validationError && typeof validationError === 'object' && 'errors' in validationError) {
            const zodError = validationError as { errors: Array<{ path: string[]; message: string }> };
            zodError.errors.forEach((err) => {
              const path = err.path.join('.');
              validationErrors[path] = err.message;
            });
          } else if (validationError instanceof Error) {
            validationErrors._form = validationError.message;
          }

          onValidationError?.(validationError instanceof Error ? validationError : new Error('Validation failed'));

          return {
            result: null,
            error: createKBError(
              KB_ERROR_CODES.VALIDATION_ERROR,
              'Validation failed',
              { retryable: true }
            ),
            validationErrors,
            status: 'error',
          };
        }
      }

      // Execute action
      const result = await action(input);

      // Success
      onSuccess?.(result);

      if (enableTelemetry) {
        collectTelemetry('useKBFormAction', operationName, 'success', Date.now() - startTime);
      }

      return {
        result,
        error: null,
        validationErrors: {},
        status: 'success',
      };
    } catch (err) {
      const kbError = createKBError(
        KB_ERROR_CODES.SERVER_ERROR,
        err instanceof Error ? err.message : 'Action failed',
        { retryable: true, originalError: err }
      );

      onError?.(err instanceof Error ? err : new Error('Unknown error'));

      if (enableTelemetry) {
        collectTelemetry('useKBFormAction', operationName, 'error', Date.now() - startTime, kbError);
      }

      return {
        result: null,
        error: kbError,
        validationErrors: {},
        status: 'error',
      };
    }
  };

  const [state, formAction, isPending] = useActionState(wrappedAction, initialActionState);

  const execute = useCallback(async (input: TInput): Promise<TResult | null> => {
    const formData = new FormData();
    if (typeof input === 'object' && input !== null) {
      Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }
    
    // Trigger the form action
    startTransition(() => {
      formAction(formData);
    });
    
    return state.result;
  }, [formAction, state.result]);

  const clearErrors = useCallback(() => {
    // Reset is handled by form resubmission
  }, []);

  const reset = useCallback(() => {
    // Reset is handled by form resubmission  
  }, []);

  return {
    state: state.result,
    formAction,
    execute,
    isPending,
    status: isPending ? 'loading' : state.status,
    error: state.error,
    validationErrors: state.validationErrors,
    clearErrors,
    reset,
  };
}

// ============================================================================
// useKBUse - Suspense-ready resource consumption
// ============================================================================

// Resource cache for deduplication
const resourceCache = new Map<string, { promise: Promise<unknown>; timestamp: number; value?: unknown }>();

/**
 * React 19 use() hook wrapper with caching, error handling, and telemetry
 * 
 * @example
 * ```tsx
 * // With Suspense (default)
 * function UserProfile({ userId }) {
 *   const { data } = useKBUse(
 *     fetchUser(userId),
 *     { cacheKey: `user-${userId}`, cacheTTL: 60000 }
 *   );
 *   return <div>{data.name}</div>;
 * }
 * 
 * // Without Suspense
 * const { data, isLoading, error } = useKBUse(promise, { suspense: false });
 * ```
 */
export function useKBUse<T>(
  resource: Promise<T> | T,
  options: KBUseOptions<T> = {}
): KBUseReturn<T> {
  const {
    fallback,
    onError,
    transform,
    suspense = true,
    cacheKey,
    cacheTTL = 30000,
    operationName = 'use_resource',
  } = options;

  const [manualState, setManualState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: KBError | null;
    status: KBStatus;
  }>({
    data: null,
    isLoading: false,
    error: null,
    status: 'idle',
  });

  const startTimeRef = useRef(Date.now());

  // Check cache first
  if (cacheKey) {
    const cached = resourceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL && cached.value !== undefined) {
      const value = transform ? transform(cached.value as T) : cached.value as T;
      return {
        data: value,
        isLoading: false,
        error: null,
        status: 'success',
      };
    }
  }

  // Handle non-promise values
  if (!(resource instanceof Promise)) {
    const value = transform ? transform(resource) : resource;
    return {
      data: value,
      isLoading: false,
      error: null,
      status: 'success',
    };
  }

  // Suspense mode: use React 19's use() hook
  if (suspense) {
    try {
      // Cache the promise for deduplication
      let cachedPromise = cacheKey ? resourceCache.get(cacheKey)?.promise : null;
      
      if (!cachedPromise || (cacheKey && Date.now() - (resourceCache.get(cacheKey)?.timestamp || 0) >= cacheTTL)) {
        const wrappedPromise = resource.then((result) => {
          if (cacheKey) {
            const entry = resourceCache.get(cacheKey);
            if (entry) {
              entry.value = result;
            }
          }
          return result;
        });

        if (cacheKey) {
          resourceCache.set(cacheKey, {
            promise: wrappedPromise,
            timestamp: Date.now(),
          });
        }
        cachedPromise = wrappedPromise;
      }

      // This will suspend the component
      const data = use(cachedPromise as Promise<T>);
      const transformedData = transform ? transform(data) : data;

      collectTelemetry('useKBUse', operationName, 'success', Date.now() - startTimeRef.current);

      return {
        data: transformedData,
        isLoading: false,
        error: null,
        status: 'success',
      };
    } catch (err) {
      // If it's a promise (pending), let it propagate for Suspense
      if (err instanceof Promise) {
        throw err;
      }

      const kbError = createKBError(
        KB_ERROR_CODES.NETWORK_ERROR,
        err instanceof Error ? err.message : 'Resource fetch failed',
        { retryable: true, originalError: err }
      );

      onError?.(err instanceof Error ? err : new Error('Unknown error'));

      collectTelemetry('useKBUse', operationName, 'error', Date.now() - startTimeRef.current, kbError);

      if (fallback !== undefined) {
        return {
          data: fallback,
          isLoading: false,
          error: kbError,
          status: 'error',
        };
      }

      throw err;
    }
  }

  // Non-suspense mode: manage state manually
  useEffect(() => {
    if (!(resource instanceof Promise)) return;

    let cancelled = false;
    setManualState(prev => ({ ...prev, isLoading: true, status: 'loading' }));

    resource
      .then((data) => {
        if (cancelled) return;
        const transformedData = transform ? transform(data) : data;
        
        if (cacheKey) {
          resourceCache.set(cacheKey, {
            promise: Promise.resolve(data),
            timestamp: Date.now(),
            value: data,
          });
        }

        setManualState({
          data: transformedData,
          isLoading: false,
          error: null,
          status: 'success',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        
        const kbError = createKBError(
          KB_ERROR_CODES.NETWORK_ERROR,
          err instanceof Error ? err.message : 'Resource fetch failed',
          { retryable: true, originalError: err }
        );

        onError?.(err instanceof Error ? err : new Error('Unknown error'));

        setManualState({
          data: fallback ?? null,
          isLoading: false,
          error: kbError,
          status: 'error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [resource, transform, fallback, onError, cacheKey]);

  return manualState;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear the useKBUse resource cache
 */
export function clearKBUseCache(keyPrefix?: string): void {
  if (keyPrefix) {
    for (const key of resourceCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        resourceCache.delete(key);
      }
    }
  } else {
    resourceCache.clear();
  }
}

/**
 * Preload a resource into the cache
 */
export function preloadKBResource<T>(
  cacheKey: string,
  fetcher: () => Promise<T>
): void {
  const promise = fetcher();
  resourceCache.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  });
  
  promise.then((value) => {
    const entry = resourceCache.get(cacheKey);
    if (entry) {
      entry.value = value;
    }
  });
}

/**
 * Get circuit breaker statistics
 */
export function getKBOptimisticStats(): {
  circuits: Array<{ key: string; state: KBCircuitBreakerState }>;
  totalOpen: number;
  totalHalfOpen: number;
  totalClosed: number;
} {
  const circuits: Array<{ key: string; state: KBCircuitBreakerState }> = [];
  let totalOpen = 0;
  let totalHalfOpen = 0;
  let totalClosed = 0;

  circuitBreakerStates.forEach((state, key) => {
    circuits.push({ key, state });
    if (state.state === 'OPEN') totalOpen++;
    else if (state.state === 'HALF_OPEN') totalHalfOpen++;
    else totalClosed++;
  });

  return { circuits, totalOpen, totalHalfOpen, totalClosed };
}

/**
 * Reset all circuit breakers
 */
export function resetKBOptimisticCircuits(): void {
  circuitBreakerStates.clear();
}

// Default export
export default {
  useKBOptimistic,
  useKBFormAction,
  useKBUse,
  clearKBUseCache,
  preloadKBResource,
  getKBOptimisticStats,
  resetKBOptimisticCircuits,
};
