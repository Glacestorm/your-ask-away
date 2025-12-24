/**
 * KB 4.0 - Reactive Store Pattern
 * Combines Signals + Effects for Maximum Power
 * 
 * Features:
 * - Signal-based reactive state
 * - Effect-TS style typed operations
 * - Atomic transactions
 * - Time-travel debugging support
 * - Middleware system
 * - DevTools integration ready
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { signal, computed, batch, effect, Signal, ReadonlySignal } from '@preact/signals-react';
import { KBError, KBStatus } from './types';
import { createKBError, parseError } from './useKBBase';
import { KBEffect, KBEffectResult, succeed, fail, tryPromise } from './useKBEffect';

// === REACTIVE STORE TYPES ===
export interface KBReactiveState<T> {
  data: T;
  status: KBStatus;
  error: KBError | null;
  version: number;
  lastUpdated: Date | null;
}

export interface KBReactiveAction<T> {
  type: string;
  payload?: unknown;
  timestamp: Date;
  prevState: T;
  nextState: T;
}

export interface KBReactiveMiddleware<T> {
  name: string;
  before?: (action: string, payload: unknown, state: T) => void | Promise<void>;
  after?: (action: string, payload: unknown, prevState: T, nextState: T) => void | Promise<void>;
}

export interface KBReactiveConfig<T> {
  name: string;
  initialState: T;
  middleware?: KBReactiveMiddleware<T>[];
  persist?: boolean;
  persistKey?: string;
  devTools?: boolean;
  maxHistory?: number;
}

export interface KBReactiveStore<T> {
  // State signals
  state: Signal<T>;
  status: Signal<KBStatus>;
  error: Signal<KBError | null>;
  version: Signal<number>;
  
  // Computed
  isLoading: ReadonlySignal<boolean>;
  isError: ReadonlySignal<boolean>;
  isSuccess: ReadonlySignal<boolean>;
  
  // Actions
  dispatch: <P>(action: string, payload?: P) => Promise<void>;
  update: (updater: (state: T) => T) => void;
  set: (state: T) => void;
  reset: () => void;
  
  // Effects
  runEffect: <R>(effect: KBEffect<R, KBError>) => Promise<KBEffectResult<R, KBError>>;
  
  // History
  history: Signal<KBReactiveAction<T>[]>;
  undo: () => void;
  redo: () => void;
  canUndo: ReadonlySignal<boolean>;
  canRedo: ReadonlySignal<boolean>;
  
  // Subscriptions
  subscribe: (listener: (state: T) => void) => () => void;
  
  // DevTools
  getSnapshot: () => KBReactiveState<T>;
}

// === REACTIVE STORE FACTORY ===
const reactiveStores = new Map<string, KBReactiveStore<unknown>>();

export function createReactiveStore<T>(config: KBReactiveConfig<T>): KBReactiveStore<T> {
  const {
    name,
    initialState,
    middleware = [],
    persist = false,
    persistKey = `kb_reactive_${name}`,
    devTools = false,
    maxHistory = 50,
  } = config;

  // Load persisted state
  let restoredState = initialState;
  if (persist && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        restoredState = JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Create signals
  const state = signal<T>(restoredState);
  const status = signal<KBStatus>('idle');
  const error = signal<KBError | null>(null);
  const version = signal(0);
  const history = signal<KBReactiveAction<T>[]>([]);
  const historyIndex = signal(-1);

  // Computed values
  const isLoading = computed(() => status.value === 'loading');
  const isError = computed(() => status.value === 'error');
  const isSuccess = computed(() => status.value === 'success');
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // Persistence effect
  if (persist && typeof window !== 'undefined') {
    effect(() => {
      localStorage.setItem(persistKey, JSON.stringify(state.value));
    });
  }

  // Run middleware before
  const runBeforeMiddleware = async (action: string, payload: unknown) => {
    for (const mw of middleware) {
      if (mw.before) {
        await mw.before(action, payload, state.value);
      }
    }
  };

  // Run middleware after
  const runAfterMiddleware = async (action: string, payload: unknown, prevState: T, nextState: T) => {
    for (const mw of middleware) {
      if (mw.after) {
        await mw.after(action, payload, prevState, nextState);
      }
    }
  };

  // Record action in history
  const recordAction = (action: string, payload: unknown, prevState: T, nextState: T) => {
    const actionRecord: KBReactiveAction<T> = {
      type: action,
      payload,
      timestamp: new Date(),
      prevState,
      nextState,
    };

    batch(() => {
      // Truncate future history if we're not at the end
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
      }

      // Add new action
      history.value = [...history.value.slice(-maxHistory + 1), actionRecord];
      historyIndex.value = history.value.length - 1;
    });
  };

  // Dispatch action
  const dispatch = async <P>(action: string, payload?: P) => {
    const prevState = state.value;
    
    await runBeforeMiddleware(action, payload);
    
    // The action itself should be handled by a reducer or handler
    // This is a simplified version that just records the action
    
    await runAfterMiddleware(action, payload, prevState, state.value);
    recordAction(action, payload, prevState, state.value);
    
    if (devTools && typeof window !== 'undefined' && (window as any).__KB_DEVTOOLS__) {
      (window as any).__KB_DEVTOOLS__.logAction(name, action, payload);
    }
  };

  // Update state with updater function
  const update = (updater: (current: T) => T) => {
    const prevState = state.value;
    const nextState = updater(prevState);
    
    batch(() => {
      state.value = nextState;
      version.value++;
    });
    
    recordAction('UPDATE', { updater: updater.toString() }, prevState, nextState);
  };

  // Set state directly
  const set = (newState: T) => {
    const prevState = state.value;
    
    batch(() => {
      state.value = newState;
      version.value++;
    });
    
    recordAction('SET', newState, prevState, newState);
  };

  // Reset to initial state
  const reset = () => {
    const prevState = state.value;
    
    batch(() => {
      state.value = initialState;
      status.value = 'idle';
      error.value = null;
      version.value = 0;
    });
    
    recordAction('RESET', null, prevState, initialState);
  };

  // Run effect with store integration
  const runEffect = async <R>(effectFn: KBEffect<R, KBError>): Promise<KBEffectResult<R, KBError>> => {
    status.value = 'loading';
    error.value = null;
    
    const result = await effectFn();
    
    if (result._tag === 'Success') {
      status.value = 'success';
    } else {
      status.value = 'error';
      error.value = result.error;
    }
    
    return result;
  };

  // Undo
  const undo = () => {
    if (!canUndo.value) return;
    
    const currentIndex = historyIndex.value;
    const action = history.value[currentIndex];
    
    batch(() => {
      state.value = action.prevState;
      historyIndex.value--;
      version.value++;
    });
  };

  // Redo
  const redo = () => {
    if (!canRedo.value) return;
    
    const nextIndex = historyIndex.value + 1;
    const action = history.value[nextIndex];
    
    batch(() => {
      state.value = action.nextState;
      historyIndex.value = nextIndex;
      version.value++;
    });
  };

  // Subscribe to state changes
  const subscribe = (listener: (state: T) => void) => {
    return effect(() => {
      listener(state.value);
    });
  };

  // Get snapshot for devtools/debugging
  const getSnapshot = (): KBReactiveState<T> => ({
    data: state.value,
    status: status.value,
    error: error.value,
    version: version.value,
    lastUpdated: history.value.length > 0 
      ? history.value[history.value.length - 1].timestamp 
      : null,
  });

  const store: KBReactiveStore<T> = {
    state,
    status,
    error,
    version,
    isLoading,
    isError,
    isSuccess,
    dispatch,
    update,
    set,
    reset,
    runEffect,
    history,
    undo,
    redo,
    canUndo,
    canRedo,
    subscribe,
    getSnapshot,
  };

  return store;
}

// === REACT HOOK ===
export function useKBReactive<T>(config: KBReactiveConfig<T>): KBReactiveStore<T> {
  const store = useMemo(() => {
    // Check if store already exists
    if (reactiveStores.has(config.name)) {
      return reactiveStores.get(config.name) as KBReactiveStore<T>;
    }
    
    // Create new store
    const newStore = createReactiveStore(config);
    reactiveStores.set(config.name, newStore as KBReactiveStore<unknown>);
    return newStore;
  }, [config.name]);

  return store;
}

// === SELECTOR HOOK ===
export function useKBReactiveSelector<T, R>(
  store: KBReactiveStore<T>,
  selector: (state: T) => R
): R {
  const selected = useMemo(
    () => computed(() => selector(store.state.value)),
    [store, selector]
  );
  
  return selected.value;
}

// === ACTIONS HOOK ===
export function useKBReactiveActions<T, Actions extends Record<string, (state: T, ...args: any[]) => T>>(
  store: KBReactiveStore<T>,
  actions: Actions
): { [K in keyof Actions]: (...args: Parameters<Actions[K]> extends [T, ...infer Rest] ? Rest : never) => void } {
  return useMemo(() => {
    const boundActions: Record<string, (...args: unknown[]) => void> = {};
    
    for (const [name, action] of Object.entries(actions)) {
      boundActions[name] = (...args: unknown[]) => {
        store.update((state) => action(state, ...args));
      };
    }
    
    return boundActions as any;
  }, [store, actions]);
}

// === ASYNC ACTIONS ===
export function useKBReactiveAsync<T>(
  store: KBReactiveStore<T>
) {
  const runAsync = useCallback(async <R>(
    effectFn: () => Promise<R>,
    options?: {
      onSuccess?: (result: R, store: KBReactiveStore<T>) => void;
      onError?: (error: KBError, store: KBReactiveStore<T>) => void;
    }
  ): Promise<R | null> => {
    const effect = tryPromise(effectFn);
    const result = await store.runEffect(effect);
    
    if (result._tag === 'Success') {
      options?.onSuccess?.(result.value, store);
      return result.value;
    } else {
      options?.onError?.(result.error, store);
      return null;
    }
  }, [store]);

  return { runAsync };
}

// === STORE UTILITIES ===
export function getReactiveStore<T>(name: string): KBReactiveStore<T> | undefined {
  return reactiveStores.get(name) as KBReactiveStore<T> | undefined;
}

export function clearReactiveStore(name: string): void {
  reactiveStores.delete(name);
}

export function clearAllReactiveStores(): void {
  reactiveStores.clear();
}

export function getReactiveStoreStats(): { count: number; names: string[] } {
  return {
    count: reactiveStores.size,
    names: Array.from(reactiveStores.keys()),
  };
}

// === DEVTOOLS MIDDLEWARE ===
export const devToolsMiddleware = <T>(): KBReactiveMiddleware<T> => ({
  name: 'devtools',
  before: (action, payload, state) => {
    console.group(`🔄 Action: ${action}`);
    console.log('Payload:', payload);
    console.log('Current State:', state);
  },
  after: (action, payload, prevState, nextState) => {
    console.log('Next State:', nextState);
    console.log('Changed:', prevState !== nextState);
    console.groupEnd();
  },
});

// === LOGGER MIDDLEWARE ===
export const loggerMiddleware = <T>(options?: { collapsed?: boolean }): KBReactiveMiddleware<T> => ({
  name: 'logger',
  before: (action, payload) => {
    const logFn = options?.collapsed ? console.groupCollapsed : console.group;
    logFn(`[KB Reactive] ${action}`);
    console.log('Payload:', payload);
  },
  after: (action, payload, prevState, nextState) => {
    console.log('Prev:', prevState);
    console.log('Next:', nextState);
    console.groupEnd();
  },
});

export default useKBReactive;
