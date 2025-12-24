/**
 * KB 4.0 - Signals Integration
 * Fine-grained Reactivity with @preact/signals-react
 * 
 * Features:
 * - Fine-grained reactivity without re-renders
 * - Computed values with automatic dependency tracking
 * - Signal-based state machines
 * - Integration with KB patterns (Circuit Breaker, Retry, etc.)
 * - Batch updates support
 * - React 19+ compatible
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { signal, computed, batch, effect, Signal, ReadonlySignal } from '@preact/signals-react';
import { KBError, KBStatus, KBRetryConfig, KB_DEFAULT_RETRY_CONFIG, KBCircuitState } from './types';
import { createKBError, parseError, isRetryableError } from './useKBBase';

// === SIGNAL TYPES ===
export interface KBSignalState<T> {
  data: Signal<T | null>;
  status: Signal<KBStatus>;
  error: Signal<KBError | null>;
  retryCount: Signal<number>;
  lastRefresh: Signal<Date | null>;
  circuitState: Signal<KBCircuitState>;
}

export interface KBSignalComputed<T> {
  isIdle: ReadonlySignal<boolean>;
  isLoading: ReadonlySignal<boolean>;
  isSuccess: ReadonlySignal<boolean>;
  isError: ReadonlySignal<boolean>;
  isRetrying: ReadonlySignal<boolean>;
  canRetry: ReadonlySignal<boolean>;
  isCircuitOpen: ReadonlySignal<boolean>;
  dataWithFallback: ReadonlySignal<T | null>;
}

export interface KBSignalConfig<T> {
  /** Initial data value */
  initialData?: T | null;
  /** Retry configuration */
  retry?: Partial<KBRetryConfig>;
  /** Enable circuit breaker */
  circuitBreaker?: boolean;
  /** Stale time in ms */
  staleTime?: number;
  /** Transform data before setting */
  transform?: (data: T) => T;
  /** Error transformer */
  transformError?: (error: unknown) => KBError;
  /** Equality function */
  equals?: (a: T | null, b: T | null) => boolean;
}

export interface KBSignalReturn<T> {
  // Signals (fine-grained)
  signals: KBSignalState<T>;
  computed: KBSignalComputed<T>;
  
  // Value accessors (for compatibility)
  data: T | null;
  status: KBStatus;
  error: KBError | null;
  
  // Actions
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  setData: (data: T | null) => void;
  setError: (error: KBError | null) => void;
  setStatus: (status: KBStatus) => void;
  reset: () => void;
  
  // Batch operations
  batchUpdate: (updates: () => void) => void;
  
  // Subscriptions
  subscribe: (callback: (state: { data: T | null; status: KBStatus; error: KBError | null }) => void) => () => void;
  
  // Circuit breaker
  resetCircuit: () => void;
}

// === SIGNAL STORE ===
const signalStores = new Map<string, KBSignalState<unknown>>();

function getOrCreateSignalStore<T>(
  key: string,
  initialData: T | null = null
): KBSignalState<T> {
  if (!signalStores.has(key)) {
    const store: KBSignalState<T> = {
      data: signal(initialData),
      status: signal<KBStatus>('idle'),
      error: signal<KBError | null>(null),
      retryCount: signal(0),
      lastRefresh: signal<Date | null>(null),
      circuitState: signal<KBCircuitState>('CLOSED'),
    };
    signalStores.set(key, store as KBSignalState<unknown>);
  }
  return signalStores.get(key) as KBSignalState<T>;
}

// === MAIN HOOK ===
export function useKBSignal<T>(
  key: string,
  config: KBSignalConfig<T> = {}
): KBSignalReturn<T> {
  const {
    initialData = null,
    retry = KB_DEFAULT_RETRY_CONFIG,
    circuitBreaker = true,
    transform,
    transformError = parseError,
    equals = (a, b) => a === b,
  } = config;

  const retryConfig: KBRetryConfig = { ...KB_DEFAULT_RETRY_CONFIG, ...retry };
  
  // Get or create signal store
  const signals = useMemo(
    () => getOrCreateSignalStore<T>(key, initialData),
    [key, initialData]
  );

  // Circuit breaker state
  const circuitFailures = useRef(0);
  const lastCircuitTrip = useRef<Date | null>(null);

  // Create computed values
  const computedValues = useMemo(() => ({
    isIdle: computed(() => signals.status.value === 'idle'),
    isLoading: computed(() => signals.status.value === 'loading'),
    isSuccess: computed(() => signals.status.value === 'success'),
    isError: computed(() => signals.status.value === 'error'),
    isRetrying: computed(() => signals.status.value === 'retrying'),
    canRetry: computed(() => 
      signals.error.value?.retryable === true && 
      signals.retryCount.value < retryConfig.maxRetries
    ),
    isCircuitOpen: computed(() => signals.circuitState.value === 'OPEN'),
    dataWithFallback: computed(() => signals.data.value ?? initialData),
  }), [signals, retryConfig.maxRetries, initialData]);

  // Circuit breaker logic
  const checkCircuit = useCallback((): boolean => {
    if (!circuitBreaker) return true;
    
    const state = signals.circuitState.value;
    
    if (state === 'CLOSED') return true;
    
    if (state === 'OPEN') {
      const timeSinceTrip = lastCircuitTrip.current 
        ? Date.now() - lastCircuitTrip.current.getTime() 
        : Infinity;
      
      if (timeSinceTrip > 30000) {
        signals.circuitState.value = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    
    return true; // HALF_OPEN allows attempt
  }, [circuitBreaker, signals]);

  const recordSuccess = useCallback(() => {
    if (circuitBreaker) {
      circuitFailures.current = 0;
      if (signals.circuitState.value !== 'CLOSED') {
        signals.circuitState.value = 'CLOSED';
      }
    }
  }, [circuitBreaker, signals]);

  const recordFailure = useCallback(() => {
    if (circuitBreaker) {
      circuitFailures.current++;
      if (circuitFailures.current >= 5) {
        signals.circuitState.value = 'OPEN';
        lastCircuitTrip.current = new Date();
      }
    }
  }, [circuitBreaker, signals]);

  // Execute function with retry and circuit breaker
  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    // Check circuit breaker
    if (!checkCircuit()) {
      const error: KBError = {
        code: 'CIRCUIT_OPEN',
        message: 'Circuit breaker is open. Request blocked.',
        details: { circuitState: signals.circuitState.value },
        timestamp: new Date(),
        retryable: false,
      };
      batch(() => {
        signals.error.value = error;
        signals.status.value = 'error';
      });
      return null;
    }

    batch(() => {
      signals.status.value = 'loading';
      signals.error.value = null;
    });

    let lastError: KBError | null = null;
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
      try {
        const result = await fn();
        const transformedResult = transform ? transform(result) : result;
        
        batch(() => {
          if (!equals(signals.data.value, transformedResult)) {
            signals.data.value = transformedResult;
          }
          signals.status.value = 'success';
          signals.lastRefresh.value = new Date();
          signals.retryCount.value = attempt;
        });
        
        recordSuccess();
        return transformedResult;
      } catch (err) {
        lastError = transformError(err);
        
        if (attempt < retryConfig.maxRetries && lastError.retryable) {
          attempt++;
          signals.status.value = 'retrying';
          signals.retryCount.value = attempt;
          
          const delay = Math.min(
            retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
            retryConfig.maxDelayMs
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    // All retries failed
    batch(() => {
      signals.error.value = lastError;
      signals.status.value = 'error';
    });
    recordFailure();
    
    return null;
  }, [signals, retryConfig, transform, transformError, equals, checkCircuit, recordSuccess, recordFailure]);

  // Setters
  const setData = useCallback((data: T | null) => {
    signals.data.value = data;
  }, [signals]);

  const setError = useCallback((error: KBError | null) => {
    signals.error.value = error;
  }, [signals]);

  const setStatus = useCallback((status: KBStatus) => {
    signals.status.value = status;
  }, [signals]);

  const reset = useCallback(() => {
    batch(() => {
      signals.data.value = initialData;
      signals.status.value = 'idle';
      signals.error.value = null;
      signals.retryCount.value = 0;
      signals.lastRefresh.value = null;
    });
  }, [signals, initialData]);

  const resetCircuit = useCallback(() => {
    circuitFailures.current = 0;
    lastCircuitTrip.current = null;
    signals.circuitState.value = 'CLOSED';
  }, [signals]);

  // Batch update helper
  const batchUpdate = useCallback((updates: () => void) => {
    batch(updates);
  }, []);

  // Subscribe to changes
  const subscribe = useCallback((
    callback: (state: { data: T | null; status: KBStatus; error: KBError | null }) => void
  ) => {
    const dispose = effect(() => {
      callback({
        data: signals.data.value,
        status: signals.status.value,
        error: signals.error.value,
      });
    });
    return dispose;
  }, [signals]);

  return {
    // Signals
    signals,
    computed: computedValues,
    
    // Value accessors
    get data() { return signals.data.value; },
    get status() { return signals.status.value; },
    get error() { return signals.error.value; },
    
    // Actions
    execute,
    setData,
    setError,
    setStatus,
    reset,
    batchUpdate,
    subscribe,
    resetCircuit,
  };
}

// === COMPUTED SIGNAL HOOK ===
export function useKBComputed<T, R>(
  signalFn: () => T,
  computeFn: (value: T) => R
): ReadonlySignal<R> {
  return useMemo(() => {
    const source = computed(signalFn);
    return computed(() => computeFn(source.value));
  }, []);
}

// === SIGNAL EFFECT HOOK ===
export function useKBEffect(effectFn: () => void | (() => void)): void {
  useEffect(() => {
    return effect(effectFn);
  }, []);
}

// === BATCH ACTIONS HOOK ===
export function useKBBatch() {
  return useCallback(<T>(fn: () => T): T => {
    return batch(fn);
  }, []);
}

// === SIGNAL STORE UTILITIES ===
export function createSignal<T>(initialValue: T): Signal<T> {
  return signal(initialValue);
}

export function createComputed<T>(fn: () => T): ReadonlySignal<T> {
  return computed(fn);
}

export function clearSignalStore(key?: string): void {
  if (key) {
    signalStores.delete(key);
  } else {
    signalStores.clear();
  }
}

export function getSignalStoreStats(): { count: number; keys: string[] } {
  return {
    count: signalStores.size,
    keys: Array.from(signalStores.keys()),
  };
}

// === SIGNAL SELECTORS ===
export function useKBSignalSelector<T, R>(
  signals: KBSignalState<T>,
  selector: (state: KBSignalState<T>) => Signal<R> | ReadonlySignal<R>
): R {
  const selectedSignal = useMemo(() => selector(signals), [signals, selector]);
  return selectedSignal.value;
}

// === DERIVED SIGNALS ===
export function deriveSignal<T, R>(
  source: Signal<T> | ReadonlySignal<T>,
  deriveFn: (value: T) => R
): ReadonlySignal<R> {
  return computed(() => deriveFn(source.value));
}

// === SIGNAL FAMILY ===
const signalFamilies = new Map<string, Map<string, Signal<unknown>>>();

export function useKBSignalFamily<T>(
  familyKey: string,
  itemKey: string,
  initialValue: T
): [Signal<T>, (value: T) => void] {
  const familySignals = useMemo(() => {
    if (!signalFamilies.has(familyKey)) {
      signalFamilies.set(familyKey, new Map());
    }
    return signalFamilies.get(familyKey)!;
  }, [familyKey]);

  const itemSignal = useMemo(() => {
    if (!familySignals.has(itemKey)) {
      familySignals.set(itemKey, signal(initialValue));
    }
    return familySignals.get(itemKey) as Signal<T>;
  }, [familySignals, itemKey, initialValue]);

  const setValue = useCallback((value: T) => {
    itemSignal.value = value;
  }, [itemSignal]);

  return [itemSignal, setValue];
}

export default useKBSignal;
