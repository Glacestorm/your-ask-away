/**
 * KB 4.5 Testing Mocks & Utilities
 * Advanced mocking utilities for testing KB hooks
 */

import { KBError, KBStatus, KBHookReturn, KBMutationReturn, KBQueryOptions } from './types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MockConfig<T> {
  /** Initial data */
  data?: T;
  /** Initial status */
  status?: KBStatus;
  /** Initial error */
  error?: KBError | null;
  /** Delay before resolving (ms) */
  delay?: number;
  /** Whether to simulate loading state */
  simulateLoading?: boolean;
  /** Network conditions to simulate */
  networkCondition?: 'fast' | 'slow' | 'offline' | 'flaky';
  /** Failure rate (0-1) for flaky connections */
  failureRate?: number;
  /** Custom response generator */
  responseGenerator?: () => T | Promise<T>;
  /** Sequence of responses for multiple calls */
  responseSequence?: Array<T | Error>;
}

export interface MockStore {
  data: Map<string, unknown>;
  subscriptions: Map<string, Set<(value: unknown) => void>>;
}

export interface MockTimeline {
  events: Array<{
    type: 'call' | 'response' | 'error' | 'state_change';
    timestamp: number;
    data?: unknown;
    error?: Error;
    state?: KBStatus;
  }>;
}

export interface MockAssertion {
  wasCalled: boolean;
  callCount: number;
  lastCallArgs: unknown[];
  allCallArgs: unknown[][];
}

// ============================================================================
// MOCK STORE (in-memory state management for tests)
// ============================================================================

class KBMockStore {
  private store: MockStore = {
    data: new Map(),
    subscriptions: new Map(),
  };

  set<T>(key: string, value: T): void {
    this.store.data.set(key, value);
    this.notify(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.store.data.get(key) as T | undefined;
  }

  delete(key: string): boolean {
    const result = this.store.data.delete(key);
    this.notify(key, undefined);
    return result;
  }

  clear(): void {
    this.store.data.clear();
    this.store.subscriptions.clear();
  }

  subscribe<T>(key: string, callback: (value: T | undefined) => void): () => void {
    if (!this.store.subscriptions.has(key)) {
      this.store.subscriptions.set(key, new Set());
    }
    this.store.subscriptions.get(key)!.add(callback as (value: unknown) => void);

    return () => {
      this.store.subscriptions.get(key)?.delete(callback as (value: unknown) => void);
    };
  }

  private notify(key: string, value: unknown): void {
    this.store.subscriptions.get(key)?.forEach(cb => cb(value));
  }

  getAll(): Map<string, unknown> {
    return new Map(this.store.data);
  }

  keys(): string[] {
    return Array.from(this.store.data.keys());
  }
}

export const mockStore = new KBMockStore();

// ============================================================================
// MOCK TIMERS
// ============================================================================

export class MockTimer {
  private timers: Map<number, { callback: () => void; time: number }> = new Map();
  private nextId = 1;
  private currentTime = 0;

  setTimeout(callback: () => void, delay: number): number {
    const id = this.nextId++;
    this.timers.set(id, { callback, time: this.currentTime + delay });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  advanceTime(ms: number): void {
    const targetTime = this.currentTime + ms;
    
    // Sort timers by execution time
    const sortedTimers = Array.from(this.timers.entries())
      .sort((a, b) => a[1].time - b[1].time);

    for (const [id, { callback, time }] of sortedTimers) {
      if (time <= targetTime) {
        this.currentTime = time;
        this.timers.delete(id);
        callback();
      }
    }

    this.currentTime = targetTime;
  }

  runAllTimers(): void {
    const maxTime = Math.max(...Array.from(this.timers.values()).map(t => t.time));
    this.advanceTime(maxTime - this.currentTime + 1);
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  reset(): void {
    this.timers.clear();
    this.currentTime = 0;
    this.nextId = 1;
  }
}

export const mockTimer = new MockTimer();

// ============================================================================
// MOCK NETWORK
// ============================================================================

export class MockNetwork {
  private online = true;
  private latency = 0;
  private listeners: Set<(online: boolean) => void> = new Set();

  setOnline(online: boolean): void {
    this.online = online;
    this.listeners.forEach(listener => listener(online));
  }

  isOnline(): boolean {
    return this.online;
  }

  setLatency(ms: number): void {
    this.latency = ms;
  }

  getLatency(): number {
    return this.latency;
  }

  addListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  simulateOffline(durationMs: number): Promise<void> {
    this.setOnline(false);
    return new Promise(resolve => {
      setTimeout(() => {
        this.setOnline(true);
        resolve();
      }, durationMs);
    });
  }

  reset(): void {
    this.online = true;
    this.latency = 0;
    this.listeners.clear();
  }
}

export const mockNetwork = new MockNetwork();

// ============================================================================
// MOCK QUERY HOOK
// ============================================================================

export interface MockQueryReturn<T> extends Omit<KBHookReturn<T>, 'cancel' | 'reset' | 'setData'> {
  _setData: (data: T | null) => void;
  _setStatus: (status: KBStatus) => void;
  _setError: (error: KBError | null) => void;
  _timeline: MockTimeline;
  _assertions: MockAssertion;
}

export function createMockQuery<T>(config?: MockConfig<T>): MockQueryReturn<T> {
  let data: T | null = config?.data || null;
  let status: KBStatus = config?.status || 'idle';
  let error: KBError | null = config?.error || null;

  const timeline: MockTimeline = { events: [] };
  const assertions: MockAssertion = {
    wasCalled: false,
    callCount: 0,
    lastCallArgs: [],
    allCallArgs: [],
  };

  let responseIndex = 0;

  const recordEvent = (type: MockTimeline['events'][0]['type'], eventData?: unknown, eventError?: Error) => {
    timeline.events.push({
      type,
      timestamp: Date.now(),
      data: eventData,
      error: eventError,
      state: status,
    });
  };

  const execute = async (): Promise<T | null> => {
    assertions.wasCalled = true;
    assertions.callCount++;
    recordEvent('call');

    if (config?.simulateLoading !== false) {
      status = 'loading';
      recordEvent('state_change');
    }

    // Simulate network conditions
    let delay = config?.delay || 0;
    if (config?.networkCondition === 'slow') {
      delay = Math.max(delay, 2000);
    } else if (config?.networkCondition === 'offline') {
      error = {
        code: 'NETWORK_OFFLINE',
        message: 'Network is offline',
        retryable: true,
      };
      status = 'error';
      recordEvent('error', undefined, new Error('Network offline'));
      return null;
    } else if (config?.networkCondition === 'flaky') {
      if (Math.random() < (config?.failureRate || 0.3)) {
        error = {
          code: 'NETWORK_FLAKY',
          message: 'Connection failed (flaky network)',
          retryable: true,
        };
        status = 'error';
        recordEvent('error', undefined, new Error('Flaky network'));
        return null;
      }
    }

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      let result: T;

      if (config?.responseSequence && responseIndex < config.responseSequence.length) {
        const response = config.responseSequence[responseIndex++];
        if (response instanceof Error) {
          throw response;
        }
        result = response;
      } else if (config?.responseGenerator) {
        result = await config.responseGenerator();
      } else if (config?.data !== undefined) {
        result = config.data;
      } else {
        throw new Error('No data configured');
      }

      data = result;
      status = 'success';
      error = null;
      recordEvent('response', result);
      return result;
    } catch (e) {
      error = {
        code: 'MOCK_ERROR',
        message: e instanceof Error ? e.message : 'Mock error',
        retryable: true,
        originalError: e,
      };
      status = 'error';
      recordEvent('error', undefined, e instanceof Error ? e : new Error(String(e)));
      return null;
    }
  };

  const retry = async (): Promise<T | null> => {
    status = 'retrying';
    recordEvent('state_change');
    return execute();
  };

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
    execute,
    retry,
    
    _setData: (newData: T | null) => {
      data = newData;
      status = newData ? 'success' : 'idle';
    },
    _setStatus: (newStatus: KBStatus) => {
      status = newStatus;
      recordEvent('state_change');
    },
    _setError: (newError: KBError | null) => {
      error = newError;
      if (newError) status = 'error';
    },
    _timeline: timeline,
    _assertions: assertions,
  };
}

// ============================================================================
// MOCK MUTATION HOOK
// ============================================================================

export interface MockMutationReturn<T, TInput> extends Omit<KBMutationReturn<T, TInput>, 'reset'> {
  _setData: (data: T | null) => void;
  _timeline: MockTimeline;
  _assertions: MockAssertion;
}

export function createMockMutation<T, TInput = unknown>(
  config?: MockConfig<T> & {
    mutationFn?: (input: TInput) => T | Promise<T>;
  }
): MockMutationReturn<T, TInput> {
  let data: T | null = null;
  let status: KBStatus = 'idle';
  let error: KBError | null = null;

  const timeline: MockTimeline = { events: [] };
  const assertions: MockAssertion = {
    wasCalled: false,
    callCount: 0,
    lastCallArgs: [],
    allCallArgs: [],
  };

  const recordEvent = (type: MockTimeline['events'][0]['type'], eventData?: unknown, eventError?: Error) => {
    timeline.events.push({
      type,
      timestamp: Date.now(),
      data: eventData,
      error: eventError,
      state: status,
    });
  };

  const mutate = async (input: TInput): Promise<T | null> => {
    assertions.wasCalled = true;
    assertions.callCount++;
    assertions.lastCallArgs = [input];
    assertions.allCallArgs.push([input]);
    recordEvent('call', input);

    status = 'loading';
    recordEvent('state_change');

    if (config?.delay) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }

    try {
      let result: T;

      if (config?.mutationFn) {
        result = await config.mutationFn(input);
      } else if (config?.data !== undefined) {
        result = config.data;
      } else {
        throw new Error('No mutation function or data configured');
      }

      data = result;
      status = 'success';
      error = null;
      recordEvent('response', result);
      return result;
    } catch (e) {
      error = {
        code: 'MUTATION_ERROR',
        message: e instanceof Error ? e.message : 'Mutation error',
        retryable: false,
        originalError: e,
      };
      status = 'error';
      recordEvent('error', undefined, e instanceof Error ? e : new Error(String(e)));
      return null;
    }
  };

  const mutateAsync = mutate;

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
    mutate,
    mutateAsync,
    
    _setData: (newData: T | null) => {
      data = newData;
      status = newData ? 'success' : 'idle';
    },
    _timeline: timeline,
    _assertions: assertions,
  };
}

// ============================================================================
// MOCK STREAM
// ============================================================================

export interface MockStreamConfig<T> {
  chunks: T[];
  chunkDelay?: number;
  shouldError?: boolean;
  errorAfterChunks?: number;
}

export function createMockStream<T>(config: MockStreamConfig<T>) {
  let currentChunk = 0;
  let isStreaming = false;
  let isCancelled = false;
  const receivedChunks: T[] = [];

  const stream = async (
    onChunk: (chunk: T) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> => {
    isStreaming = true;
    isCancelled = false;
    currentChunk = 0;

    for (const chunk of config.chunks) {
      if (isCancelled) break;

      if (config.shouldError && currentChunk >= (config.errorAfterChunks || config.chunks.length)) {
        onError?.(new Error('Stream error'));
        isStreaming = false;
        return;
      }

      if (config.chunkDelay) {
        await new Promise(resolve => setTimeout(resolve, config.chunkDelay));
      }

      receivedChunks.push(chunk);
      onChunk(chunk);
      currentChunk++;
    }

    isStreaming = false;
    onComplete?.();
  };

  const cancel = () => {
    isCancelled = true;
    isStreaming = false;
  };

  return {
    stream,
    cancel,
    isStreaming: () => isStreaming,
    getReceivedChunks: () => [...receivedChunks],
    getCurrentChunk: () => currentChunk,
    reset: () => {
      currentChunk = 0;
      isStreaming = false;
      isCancelled = false;
      receivedChunks.length = 0;
    },
  };
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function waitForCondition(
  condition: () => boolean,
  options?: { timeout?: number; interval?: number }
): Promise<void> {
  const timeout = options?.timeout || 5000;
  const interval = options?.interval || 50;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

export function createSpyFn<T extends (...args: unknown[]) => unknown>(): T & MockAssertion & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  
  const spy = ((...args: unknown[]) => {
    calls.push(args);
    return undefined;
  }) as T & MockAssertion & { calls: unknown[][] };

  Object.defineProperties(spy, {
    wasCalled: { get: () => calls.length > 0 },
    callCount: { get: () => calls.length },
    lastCallArgs: { get: () => calls[calls.length - 1] || [] },
    allCallArgs: { get: () => [...calls] },
    calls: { value: calls },
  });

  return spy;
}

// ============================================================================
// MOCK CONTEXT PROVIDER
// ============================================================================

export interface MockProviderConfig {
  queries?: Record<string, MockConfig<unknown>>;
  mutations?: Record<string, MockConfig<unknown>>;
  initialState?: Record<string, unknown>;
}

export function createMockProvider(config: MockProviderConfig) {
  const queries = new Map<string, MockQueryReturn<unknown>>();
  const mutations = new Map<string, MockMutationReturn<unknown, unknown>>();

  // Initialize queries
  if (config.queries) {
    for (const [key, queryConfig] of Object.entries(config.queries)) {
      queries.set(key, createMockQuery(queryConfig));
    }
  }

  // Initialize mutations
  if (config.mutations) {
    for (const [key, mutationConfig] of Object.entries(config.mutations)) {
      mutations.set(key, createMockMutation(mutationConfig));
    }
  }

  // Initialize state
  if (config.initialState) {
    for (const [key, value] of Object.entries(config.initialState)) {
      mockStore.set(key, value);
    }
  }

  return {
    getQuery: <T>(key: string) => queries.get(key) as MockQueryReturn<T> | undefined,
    getMutation: <T, TInput>(key: string) => mutations.get(key) as MockMutationReturn<T, TInput> | undefined,
    getState: <T>(key: string) => mockStore.get<T>(key),
    setState: <T>(key: string, value: T) => mockStore.set(key, value),
    reset: () => {
      queries.clear();
      mutations.clear();
      mockStore.clear();
    },
  };
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export const assertions = {
  wasCalledOnce: (mock: MockAssertion) => mock.callCount === 1,
  wasCalledTimes: (mock: MockAssertion, times: number) => mock.callCount === times,
  wasCalledWith: (mock: MockAssertion, ...args: unknown[]) => 
    JSON.stringify(mock.lastCallArgs) === JSON.stringify(args),
  wasNeverCalled: (mock: MockAssertion) => !mock.wasCalled,
  eventOccurred: (timeline: MockTimeline, type: string) => 
    timeline.events.some(e => e.type === type),
  eventCount: (timeline: MockTimeline, type: string) => 
    timeline.events.filter(e => e.type === type).length,
};

export default {
  createMockQuery,
  createMockMutation,
  createMockStream,
  createMockProvider,
  mockStore,
  mockTimer,
  mockNetwork,
  waitFor,
  waitForCondition,
  createSpyFn,
  assertions,
};
