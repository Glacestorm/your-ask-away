/**
 * KB 4.5 - Phase 7: Testing Utilities
 * 
 * Features:
 * - Test wrappers and providers
 * - Mock factories for queries/mutations
 * - State simulation utilities
 * - Async helpers (waitFor, act)
 * - Snapshot testing support
 * - Performance testing utilities
 */

import { ReactNode, createElement, useRef, useEffect, useCallback, useState } from 'react';
import type { KBStatus, KBError, KBHookReturn } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface MockQueryOptions<T> {
  /** Initial data */
  data?: T;
  /** Initial status */
  status?: KBStatus;
  /** Initial error */
  error?: KBError | null;
  /** Delay before resolving (ms) */
  delay?: number;
  /** Should fail */
  shouldFail?: boolean;
  /** Fail after N calls */
  failAfter?: number;
  /** Success after N retries */
  successAfterRetries?: number;
}

export interface MockMutationOptions<T, TInput> {
  /** Transform input to output */
  transform?: (input: TInput) => T;
  /** Initial status */
  status?: KBStatus;
  /** Delay before resolving (ms) */
  delay?: number;
  /** Should fail */
  shouldFail?: boolean;
  /** Validation function */
  validate?: (input: TInput) => boolean | string;
}

export interface MockStoreOptions<T> {
  /** Initial state */
  initialState: T;
  /** Enable history tracking */
  trackHistory?: boolean;
  /** Max history entries */
  maxHistory?: number;
}

export interface TestWrapperOptions {
  /** Initial route */
  route?: string;
  /** Mock user */
  user?: { id: string; email?: string; role?: string };
  /** Additional providers */
  providers?: Array<{
    Provider: React.ComponentType<{ children: ReactNode }>;
    props?: Record<string, unknown>;
  }>;
}

export interface KBTestContext {
  /** Reset all mocks */
  resetAll: () => void;
  /** Get call history */
  getCallHistory: () => CallHistoryEntry[];
  /** Clear call history */
  clearHistory: () => void;
  /** Simulate network conditions */
  simulateNetwork: (online: boolean, latency?: number) => void;
  /** Advance timers */
  advanceTimers: (ms: number) => void;
  /** Flush pending promises */
  flushPromises: () => Promise<void>;
}

export interface CallHistoryEntry {
  hookName: string;
  operation: string;
  args: unknown[];
  timestamp: number;
  duration?: number;
  result?: unknown;
  error?: Error;
}

export interface MockQueryReturn<T> {
  data: T | null;
  status: KBStatus;
  error: KBError | null;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isRetrying: boolean;
  retryCount: number;
  execute: (() => Promise<T | null>);
  retry: () => Promise<T | null>;
  cancel: () => void;
  reset: () => void;
  _mock: {
    setData: (data: T) => void;
    setStatus: (status: KBStatus) => void;
    setError: (error: KBError | null) => void;
    simulateLoading: () => void;
    simulateSuccess: (data: T) => void;
    simulateError: (error: Partial<KBError>) => void;
    reset: () => void;
    getCallCount: () => number;
  };
}

export interface MockMutationReturn<T, TInput> {
  mutate: ((input: TInput) => Promise<T | null>);
  mutateAsync: ((input: TInput) => Promise<T>);
  data: T | null;
  status: KBStatus;
  error: KBError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
  _mock: {
    setResponse: (data: T) => void;
    setError: (error: Partial<KBError>) => void;
    simulateOptimistic: (data: T) => void;
    simulateRollback: () => void;
    getCallHistory: () => Array<{ input: TInput; result: T | null; timestamp: number }>;
  };
}

export interface MockStoreReturn<T> {
  state: T;
  setState: (updater: T | ((prev: T) => T)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
  getSnapshot: () => T;
  getHistory: () => T[];
  undo: () => void;
  redo: () => void;
  reset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

/**
 * Create a mock query hook for testing
 */
export function createMockQuery<T>(options: MockQueryOptions<T> = {}): MockQueryReturn<T> {
  const {
    data: initialData = null as T,
    status: initialStatus = 'idle',
    error: initialError = null,
    delay = 0,
    shouldFail = false,
    failAfter,
    successAfterRetries = 0,
  } = options;

  let currentData: T | null = initialData;
  let currentStatus: KBStatus = initialStatus;
  let currentError: KBError | null = initialError;
  let callCount = 0;
  let retryCount = 0;
  const listeners: Set<() => void> = new Set();

  const notify = () => listeners.forEach(l => l());

  const execute = async (): Promise<T | null> => {
    callCount++;
    currentStatus = 'loading';
    currentError = null;
    notify();

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const shouldFailNow = shouldFail || (failAfter !== undefined && callCount > failAfter);
    const shouldSucceedAfterRetries = successAfterRetries > 0 && retryCount >= successAfterRetries;

    if (shouldFailNow && !shouldSucceedAfterRetries) {
      retryCount++;
      currentStatus = 'error';
      currentError = {
        code: 'MOCK_ERROR',
        message: 'Mock query failed',
        retryable: true,
        timestamp: new Date(),
      };
      notify();
      return null;
    }

    currentStatus = 'success';
    notify();
    return currentData;
  };

  return {
    data: currentData,
    status: currentStatus,
    error: currentError,
    isIdle: currentStatus === 'idle',
    isLoading: currentStatus === 'loading',
    isSuccess: currentStatus === 'success',
    isError: currentStatus === 'error',
    isRetrying: currentStatus === 'retrying',
    retryCount: 0,
    execute,
    retry: execute,
    cancel: () => {
      currentStatus = 'cancelled';
      notify();
    },
    reset: () => {
      currentData = initialData;
      currentStatus = 'idle';
      currentError = null;
      callCount = 0;
      retryCount = 0;
      notify();
    },
    _mock: {
      setData: (data: T) => {
        currentData = data;
        notify();
      },
      setStatus: (status: KBStatus) => {
        currentStatus = status;
        notify();
      },
      setError: (error: KBError | null) => {
        currentError = error;
        notify();
      },
      simulateLoading: () => {
        currentStatus = 'loading';
        currentError = null;
        notify();
      },
      simulateSuccess: (data: T) => {
        currentData = data;
        currentStatus = 'success';
        currentError = null;
        notify();
      },
      simulateError: (error: Partial<KBError>) => {
        currentStatus = 'error';
        currentError = {
          code: error.code || 'ERROR',
          message: error.message || 'Error',
          retryable: error.retryable ?? true,
          timestamp: new Date(),
        };
        notify();
      },
      reset: () => {
        currentData = initialData;
        currentStatus = 'idle';
        currentError = null;
        callCount = 0;
        retryCount = 0;
        notify();
      },
      getCallCount: () => callCount,
    },
  };
}

/**
 * Create a mock mutation hook for testing
 */
export function createMockMutation<T, TInput = unknown>(
  options: MockMutationOptions<T, TInput> = {}
): MockMutationReturn<T, TInput> {
  const {
    transform,
    status: initialStatus = 'idle',
    delay = 0,
    shouldFail = false,
    validate,
  } = options;

  let currentData: T | null = null;
  let currentStatus: KBStatus = initialStatus;
  let currentError: KBError | null = null;
  let optimisticData: T | null = null;
  const callHistory: Array<{ input: TInput; result: T | null; timestamp: number }> = [];
  const listeners: Set<() => void> = new Set();

  const notify = () => listeners.forEach(l => l());

  const mutateAsync = async (input: TInput): Promise<T> => {
    // Validation
    if (validate) {
      const validationResult = validate(input);
      if (validationResult !== true) {
        const errorMessage = typeof validationResult === 'string' ? validationResult : 'Validation failed';
        currentError = {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
          retryable: false,
          timestamp: new Date(),
        };
        currentStatus = 'error';
        notify();
        throw new Error(errorMessage);
      }
    }

    currentStatus = 'loading';
    currentError = null;
    notify();

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (shouldFail) {
      currentStatus = 'error';
      currentError = {
        code: 'MOCK_ERROR',
        message: 'Mock mutation failed',
        retryable: true,
        timestamp: new Date(),
      };
      callHistory.push({ input, result: null, timestamp: Date.now() });
      notify();
      throw new Error('Mock mutation failed');
    }

    const result = transform ? transform(input) : (input as unknown as T);
    currentData = result;
    currentStatus = 'success';
    callHistory.push({ input, result, timestamp: Date.now() });
    notify();
    return result;
  };

  const mutate = async (input: TInput): Promise<T | null> => {
    try {
      return await mutateAsync(input);
    } catch {
      return null;
    }
  };

  return {
    mutate,
    mutateAsync,
    data: currentData,
    status: currentStatus,
    error: currentError,
    isLoading: currentStatus === 'loading',
    isSuccess: currentStatus === 'success',
    isError: currentStatus === 'error',
    reset: () => {
      currentData = null;
      currentStatus = 'idle';
      currentError = null;
      optimisticData = null;
      notify();
    },
    _mock: {
      setResponse: (data: T) => {
        currentData = data;
        notify();
      },
      setError: (error: Partial<KBError>) => {
        currentStatus = 'error';
        currentError = {
          code: error.code || 'ERROR',
          message: error.message || 'Error',
          retryable: error.retryable ?? true,
          timestamp: new Date(),
        };
        notify();
      },
      simulateOptimistic: (data: T) => {
        optimisticData = data;
        currentData = data;
        notify();
      },
      simulateRollback: () => {
        currentData = null;
        optimisticData = null;
        notify();
      },
      getCallHistory: () => [...callHistory],
    },
  };
}

/**
 * Create a mock store for testing reactive patterns
 */
export function createMockStore<T>(options: MockStoreOptions<T>): MockStoreReturn<T> {
  const { initialState, trackHistory = true, maxHistory = 50 } = options;

  let state = initialState;
  const history: T[] = trackHistory ? [initialState] : [];
  let historyIndex = 0;
  const listeners: Set<(state: T) => void> = new Set();

  const notify = () => listeners.forEach(l => l(state));

  return {
    get state() {
      return state;
    },
    setState: (updater: T | ((prev: T) => T)) => {
      const newState = typeof updater === 'function' 
        ? (updater as (prev: T) => T)(state) 
        : updater;
      
      state = newState;
      
      if (trackHistory) {
        // Remove any future history if we're not at the end
        if (historyIndex < history.length - 1) {
          history.splice(historyIndex + 1);
        }
        history.push(newState);
        if (history.length > maxHistory) {
          history.shift();
        }
        historyIndex = history.length - 1;
      }
      
      notify();
    },
    subscribe: (listener: (state: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    getHistory: () => [...history],
    undo: () => {
      if (historyIndex > 0) {
        historyIndex--;
        state = history[historyIndex];
        notify();
      }
    },
    redo: () => {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        state = history[historyIndex];
        notify();
      }
    },
    reset: () => {
      state = initialState;
      history.length = 0;
      history.push(initialState);
      historyIndex = 0;
      notify();
    },
    get canUndo() {
      return historyIndex > 0;
    },
    get canRedo() {
      return historyIndex < history.length - 1;
    },
  };
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wait for a specific KB hook state
 */
export async function waitForKBState<T>(
  getState: () => { status: KBStatus; data?: T },
  targetStatus: KBStatus | KBStatus[],
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const statuses = Array.isArray(targetStatus) ? targetStatus : [targetStatus];
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const state = getState();
      if (statuses.includes(state.status)) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for status: ${statuses.join(' or ')}`));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

/**
 * Flush all pending promises
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create a deferred promise for testing
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Simulate network conditions
 */
export function createNetworkSimulator() {
  let isOnline = true;
  let latency = 0;
  const listeners: Set<(online: boolean) => void> = new Set();

  return {
    get online() {
      return isOnline;
    },
    get latency() {
      return latency;
    },
    setOnline: (online: boolean) => {
      isOnline = online;
      listeners.forEach(l => l(online));
    },
    setLatency: (ms: number) => {
      latency = ms;
    },
    subscribe: (listener: (online: boolean) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    simulateOffline: () => {
      isOnline = false;
      listeners.forEach(l => l(false));
    },
    simulateOnline: () => {
      isOnline = true;
      listeners.forEach(l => l(true));
    },
    simulateSlow: (ms = 3000) => {
      latency = ms;
    },
    simulateFast: () => {
      latency = 0;
    },
    wrapFetch: <T>(fn: () => Promise<T>): Promise<T> => {
      if (!isOnline) {
        return Promise.reject(new Error('Network offline'));
      }
      if (latency > 0) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            fn().then(resolve).catch(reject);
          }, latency);
        });
      }
      return fn();
    },
  };
}

// ============================================================================
// TEST CONTEXT
// ============================================================================

const callHistory: CallHistoryEntry[] = [];
let networkSimulator = createNetworkSimulator();

/**
 * Create KB test context
 */
export function createKBTestContext(): KBTestContext {
  return {
    resetAll: () => {
      callHistory.length = 0;
      networkSimulator = createNetworkSimulator();
    },
    getCallHistory: () => [...callHistory],
    clearHistory: () => {
      callHistory.length = 0;
    },
    simulateNetwork: (online: boolean, latency?: number) => {
      networkSimulator.setOnline(online);
      if (latency !== undefined) {
        networkSimulator.setLatency(latency);
      }
    },
    advanceTimers: (ms: number) => {
      // For use with fake timers - vitest or jest
      const globalAny = globalThis as { jest?: { advanceTimersByTime?: (ms: number) => void } };
      if (globalAny.jest?.advanceTimersByTime) {
        globalAny.jest.advanceTimersByTime(ms);
      }
    },
    flushPromises,
  };
}

/**
 * Record a call to history
 */
export function recordCall(entry: Omit<CallHistoryEntry, 'timestamp'>): void {
  callHistory.push({
    ...entry,
    timestamp: Date.now(),
  });
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert hook state matches expected
 */
export function assertKBState<T>(
  actual: { status: KBStatus; data?: T; error?: KBError | null },
  expected: { status?: KBStatus; data?: T; hasError?: boolean }
): void {
  if (expected.status !== undefined && actual.status !== expected.status) {
    throw new Error(`Expected status ${expected.status}, got ${actual.status}`);
  }
  if (expected.data !== undefined && actual.data !== expected.data) {
    throw new Error(`Expected data ${JSON.stringify(expected.data)}, got ${JSON.stringify(actual.data)}`);
  }
  if (expected.hasError === true && !actual.error) {
    throw new Error('Expected error to be present');
  }
  if (expected.hasError === false && actual.error) {
    throw new Error(`Expected no error, got ${actual.error.message}`);
  }
}

/**
 * Assert call count
 */
export function assertCallCount(hookName: string, expectedCount: number): void {
  const actualCount = callHistory.filter(c => c.hookName === hookName).length;
  if (actualCount !== expectedCount) {
    throw new Error(`Expected ${hookName} to be called ${expectedCount} times, got ${actualCount}`);
  }
}

/**
 * Assert last call args
 */
export function assertLastCallArgs(hookName: string, expectedArgs: unknown[]): void {
  const calls = callHistory.filter(c => c.hookName === hookName);
  if (calls.length === 0) {
    throw new Error(`No calls recorded for ${hookName}`);
  }
  const lastCall = calls[calls.length - 1];
  if (JSON.stringify(lastCall.args) !== JSON.stringify(expectedArgs)) {
    throw new Error(
      `Expected last call args ${JSON.stringify(expectedArgs)}, got ${JSON.stringify(lastCall.args)}`
    );
  }
}

// ============================================================================
// REACT TESTING HOOKS
// ============================================================================

/**
 * Hook to track renders in tests
 */
export function useRenderCounter(): { count: number; reset: () => void } {
  const countRef = useRef(0);
  
  useEffect(() => {
    countRef.current++;
  });

  return {
    get count() {
      return countRef.current;
    },
    reset: () => {
      countRef.current = 0;
    },
  };
}

/**
 * Hook to track value changes
 */
export function useValueTracker<T>(value: T): {
  history: T[];
  changeCount: number;
  lastValue: T | undefined;
  reset: () => void;
} {
  const historyRef = useRef<T[]>([]);
  const prevValueRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      historyRef.current.push(value);
      prevValueRef.current = value;
    }
  }, [value]);

  return {
    get history() {
      return [...historyRef.current];
    },
    get changeCount() {
      return historyRef.current.length;
    },
    get lastValue() {
      return historyRef.current[historyRef.current.length - 1];
    },
    reset: () => {
      historyRef.current = [];
      prevValueRef.current = undefined;
    },
  };
}

/**
 * Hook to measure hook execution time
 */
export function useExecutionTimer(): {
  start: () => void;
  stop: () => number;
  duration: number | null;
  measurements: number[];
} {
  const startTimeRef = useRef<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const measurementsRef = useRef<number[]>([]);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const stop = useCallback(() => {
    if (startTimeRef.current === null) return 0;
    const elapsed = performance.now() - startTimeRef.current;
    setDuration(elapsed);
    measurementsRef.current.push(elapsed);
    startTimeRef.current = null;
    return elapsed;
  }, []);

  return {
    start,
    stop,
    duration,
    get measurements() {
      return [...measurementsRef.current];
    },
  };
}

// ============================================================================
// SNAPSHOT UTILITIES
// ============================================================================

/**
 * Create a serializable snapshot of hook state
 */
export function createStateSnapshot<T>(state: {
  status: KBStatus;
  data?: T;
  error?: KBError | null;
  [key: string]: unknown;
}): Record<string, unknown> {
  return {
    status: state.status,
    data: state.data,
    hasError: !!state.error,
    errorCode: state.error?.code,
    errorMessage: state.error?.message,
    timestamp: Date.now(),
  };
}

/**
 * Compare two snapshots
 */
export function compareSnapshots(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  ignoreKeys: string[] = ['timestamp']
): { equal: boolean; differences: string[] } {
  const differences: string[] = [];
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    if (ignoreKeys.includes(key)) continue;
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      differences.push(`${key}: ${JSON.stringify(a[key])} !== ${JSON.stringify(b[key])}`);
    }
  }

  return {
    equal: differences.length === 0,
    differences,
  };
}

// ============================================================================
// TEST WRAPPER COMPONENT
// ============================================================================

/**
 * Create a test wrapper component
 */
export function createKBTestWrapper(options: TestWrapperOptions = {}) {
  const { providers = [] } = options;

  return function KBTestWrapper({ children }: { children: ReactNode }) {
    let wrapped = children;

    // Wrap with provided providers (in reverse order so first is outermost)
    for (let i = providers.length - 1; i >= 0; i--) {
      const { Provider, props = {} } = providers[i];
      wrapped = createElement(Provider, { ...props, children: wrapped } as { children: ReactNode });
    }

    return wrapped as React.ReactElement;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default createMockQuery;
