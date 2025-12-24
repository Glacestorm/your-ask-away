/**
 * KB 4.5 - Phase 8: DevTools & Debugging Integration
 * 
 * Features:
 * - Hook State Inspector
 * - Action Logger with Time-Travel
 * - Performance Profiler
 * - State Diff Visualization
 * - Export/Import State Snapshots
 * - Real-time Monitoring Dashboard
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { KBStatus, KBError } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DevToolsAction {
  id: string;
  timestamp: Date;
  type: 'state_change' | 'mutation' | 'query' | 'error' | 'network' | 'performance' | 'custom';
  hookName: string;
  payload: unknown;
  prevState?: unknown;
  nextState?: unknown;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface DevToolsState {
  actions: DevToolsAction[];
  currentIndex: number;
  isRecording: boolean;
  isPaused: boolean;
  filters: DevToolsFilters;
  bookmarks: number[];
}

export interface DevToolsFilters {
  types: DevToolsAction['type'][];
  hookNames: string[];
  minDuration?: number;
  searchQuery?: string;
}

export interface HookSnapshot {
  id: string;
  hookName: string;
  timestamp: Date;
  state: unknown;
  status: KBStatus;
  error?: KBError | null;
  metadata?: Record<string, unknown>;
}

export interface PerformanceProfile {
  hookName: string;
  renderCount: number;
  totalRenderTime: number;
  avgRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  lastRenderTime: number;
  stateChanges: number;
  errors: number;
}

export interface StateTimeline {
  hookName: string;
  entries: Array<{
    timestamp: Date;
    state: unknown;
    trigger: string;
  }>;
}

export interface UseKBDevToolsOptions {
  maxActions?: number;
  enabled?: boolean;
  persistToStorage?: boolean;
  storageKey?: string;
  onAction?: (action: DevToolsAction) => void;
  filters?: Partial<DevToolsFilters>;
}

export interface UseKBDevToolsReturn {
  // State
  actions: DevToolsAction[];
  currentIndex: number;
  isRecording: boolean;
  isPaused: boolean;
  filters: DevToolsFilters;
  bookmarks: number[];
  
  // Recording Controls
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearActions: () => void;
  
  // Time Travel
  jumpToAction: (index: number) => void;
  stepBack: () => void;
  stepForward: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  
  // Bookmarks
  addBookmark: (index?: number) => void;
  removeBookmark: (index: number) => void;
  jumpToBookmark: (bookmarkIndex: number) => void;
  
  // Filtering
  setFilters: (filters: Partial<DevToolsFilters>) => void;
  clearFilters: () => void;
  filteredActions: DevToolsAction[];
  
  // Export/Import
  exportState: () => string;
  importState: (json: string) => boolean;
  exportSnapshot: (hookName?: string) => string;
  
  // Logging
  logAction: (action: Omit<DevToolsAction, 'id' | 'timestamp'>) => void;
  logCustom: (hookName: string, payload: unknown, metadata?: Record<string, unknown>) => void;
  
  // Performance
  getPerformanceProfile: (hookName: string) => PerformanceProfile | null;
  getAllProfiles: () => PerformanceProfile[];
  
  // Stats
  stats: {
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByHook: Record<string, number>;
    avgDuration: number;
    errorCount: number;
  };
}

// ============================================================================
// Global DevTools Store
// ============================================================================

interface DevToolsStore {
  state: DevToolsState;
  snapshots: Map<string, HookSnapshot[]>;
  profiles: Map<string, PerformanceProfile>;
  subscribers: Set<() => void>;
  options: UseKBDevToolsOptions;
}

const createInitialState = (): DevToolsState => ({
  actions: [],
  currentIndex: -1,
  isRecording: true,
  isPaused: false,
  filters: {
    types: [],
    hookNames: [],
  },
  bookmarks: [],
});

let globalStore: DevToolsStore | null = null;

const getStore = (options: UseKBDevToolsOptions = {}): DevToolsStore => {
  if (!globalStore) {
    globalStore = {
      state: createInitialState(),
      snapshots: new Map(),
      profiles: new Map(),
      subscribers: new Set(),
      options,
    };
    
    // Try to restore from storage
    if (options.persistToStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(options.storageKey || 'kb-devtools');
        if (stored) {
          const parsed = JSON.parse(stored);
          globalStore.state = {
            ...createInitialState(),
            ...parsed,
            actions: (parsed.actions || []).map((a: DevToolsAction) => ({
              ...a,
              timestamp: new Date(a.timestamp),
            })),
          };
        }
      } catch {
        // Ignore storage errors
      }
    }
  }
  return globalStore;
};

const notifySubscribers = (): void => {
  globalStore?.subscribers.forEach((fn) => fn());
};

const persistState = (store: DevToolsStore): void => {
  if (store.options.persistToStorage && typeof window !== 'undefined') {
    try {
      const toStore = {
        ...store.state,
        actions: store.state.actions.slice(-100), // Only persist last 100
      };
      localStorage.setItem(
        store.options.storageKey || 'kb-devtools',
        JSON.stringify(toStore)
      );
    } catch {
      // Ignore storage errors
    }
  }
};

// ============================================================================
// Hook Inspector
// ============================================================================

export interface UseHookInspectorOptions {
  hookName: string;
  enabled?: boolean;
  trackRenders?: boolean;
  trackStateChanges?: boolean;
}

export interface UseHookInspectorReturn {
  inspect: (state: unknown, status: KBStatus, error?: KBError | null) => void;
  getSnapshots: () => HookSnapshot[];
  getLatestSnapshot: () => HookSnapshot | null;
  clearSnapshots: () => void;
  renderCount: number;
  stateChangeCount: number;
}

export function useHookInspector(options: UseHookInspectorOptions): UseHookInspectorReturn {
  const { hookName, enabled = true, trackRenders = true, trackStateChanges = true } = options;
  
  const renderCountRef = useRef(0);
  const stateChangeCountRef = useRef(0);
  const prevStateRef = useRef<unknown>(undefined);
  const store = getStore();

  // Track renders
  useEffect(() => {
    if (enabled && trackRenders) {
      renderCountRef.current++;
      updateProfile(hookName, { renderCount: renderCountRef.current });
    }
  });

  const inspect = useCallback((state: unknown, status: KBStatus, error?: KBError | null) => {
    if (!enabled) return;

    const hasChanged = JSON.stringify(state) !== JSON.stringify(prevStateRef.current);
    
    if (trackStateChanges && hasChanged) {
      stateChangeCountRef.current++;
      prevStateRef.current = state;
      
      const snapshot: HookSnapshot = {
        id: generateId(),
        hookName,
        timestamp: new Date(),
        state,
        status,
        error,
      };
      
      const existing = store.snapshots.get(hookName) || [];
      existing.push(snapshot);
      
      // Keep last 50 snapshots per hook
      if (existing.length > 50) {
        existing.shift();
      }
      
      store.snapshots.set(hookName, existing);
      
      updateProfile(hookName, { stateChanges: stateChangeCountRef.current });
    }
  }, [enabled, hookName, trackStateChanges, store]);

  const getSnapshots = useCallback((): HookSnapshot[] => {
    return store.snapshots.get(hookName) || [];
  }, [hookName, store]);

  const getLatestSnapshot = useCallback((): HookSnapshot | null => {
    const snapshots = store.snapshots.get(hookName);
    return snapshots?.[snapshots.length - 1] || null;
  }, [hookName, store]);

  const clearSnapshots = useCallback(() => {
    store.snapshots.delete(hookName);
  }, [hookName, store]);

  return {
    inspect,
    getSnapshots,
    getLatestSnapshot,
    clearSnapshots,
    renderCount: renderCountRef.current,
    stateChangeCount: stateChangeCountRef.current,
  };
}

// ============================================================================
// Performance Profiler
// ============================================================================

export interface UsePerformanceProfilerOptions {
  hookName: string;
  enabled?: boolean;
  sampleRate?: number;
}

export interface UsePerformanceProfilerReturn {
  startMeasure: (label?: string) => () => number;
  recordRender: (duration: number) => void;
  recordError: () => void;
  getProfile: () => PerformanceProfile;
  reset: () => void;
}

const updateProfile = (hookName: string, updates: Partial<PerformanceProfile>): void => {
  const store = getStore();
  const existing = store.profiles.get(hookName) || {
    hookName,
    renderCount: 0,
    totalRenderTime: 0,
    avgRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity,
    lastRenderTime: 0,
    stateChanges: 0,
    errors: 0,
  };
  
  store.profiles.set(hookName, { ...existing, ...updates });
};

export function usePerformanceProfiler(options: UsePerformanceProfilerOptions): UsePerformanceProfilerReturn {
  const { hookName, enabled = true, sampleRate = 1 } = options;
  
  const store = getStore();
  const shouldSample = useCallback(() => Math.random() < sampleRate, [sampleRate]);

  const startMeasure = useCallback((label?: string) => {
    if (!enabled || !shouldSample()) {
      return () => 0;
    }
    
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      const profile = store.profiles.get(hookName) || {
        hookName,
        renderCount: 0,
        totalRenderTime: 0,
        avgRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
        lastRenderTime: 0,
        stateChanges: 0,
        errors: 0,
      };
      
      profile.totalRenderTime += duration;
      profile.renderCount++;
      profile.avgRenderTime = profile.totalRenderTime / profile.renderCount;
      profile.maxRenderTime = Math.max(profile.maxRenderTime, duration);
      profile.minRenderTime = Math.min(profile.minRenderTime, duration);
      profile.lastRenderTime = duration;
      
      store.profiles.set(hookName, profile);
      
      // Log if over threshold
      if (duration > 16) {
        logAction({
          type: 'performance',
          hookName,
          payload: { label, duration },
          duration,
        });
      }
      
      return duration;
    };
  }, [enabled, hookName, shouldSample, store]);

  const recordRender = useCallback((duration: number) => {
    if (!enabled) return;
    
    const profile = store.profiles.get(hookName) || {
      hookName,
      renderCount: 0,
      totalRenderTime: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity,
      lastRenderTime: 0,
      stateChanges: 0,
      errors: 0,
    };
    
    profile.totalRenderTime += duration;
    profile.renderCount++;
    profile.avgRenderTime = profile.totalRenderTime / profile.renderCount;
    profile.maxRenderTime = Math.max(profile.maxRenderTime, duration);
    profile.minRenderTime = Math.min(profile.minRenderTime, duration);
    profile.lastRenderTime = duration;
    
    store.profiles.set(hookName, profile);
  }, [enabled, hookName, store]);

  const recordError = useCallback(() => {
    if (!enabled) return;
    
    const profile = store.profiles.get(hookName);
    if (profile) {
      profile.errors++;
      store.profiles.set(hookName, profile);
    }
  }, [enabled, hookName, store]);

  const getProfile = useCallback((): PerformanceProfile => {
    return store.profiles.get(hookName) || {
      hookName,
      renderCount: 0,
      totalRenderTime: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: 0,
      lastRenderTime: 0,
      stateChanges: 0,
      errors: 0,
    };
  }, [hookName, store]);

  const reset = useCallback(() => {
    store.profiles.delete(hookName);
  }, [hookName, store]);

  return {
    startMeasure,
    recordRender,
    recordError,
    getProfile,
    reset,
  };
}

// ============================================================================
// Action Logger
// ============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const logAction = (action: Omit<DevToolsAction, 'id' | 'timestamp'>): void => {
  const store = getStore();
  
  if (!store.state.isRecording || store.state.isPaused) return;
  
  const fullAction: DevToolsAction = {
    ...action,
    id: generateId(),
    timestamp: new Date(),
  };
  
  store.state.actions.push(fullAction);
  store.state.currentIndex = store.state.actions.length - 1;
  
  // Trim if over max
  const maxActions = store.options.maxActions || 1000;
  if (store.state.actions.length > maxActions) {
    const trimCount = store.state.actions.length - maxActions;
    store.state.actions.splice(0, trimCount);
    store.state.currentIndex = Math.max(0, store.state.currentIndex - trimCount);
    store.state.bookmarks = store.state.bookmarks
      .map(b => b - trimCount)
      .filter(b => b >= 0);
  }
  
  store.options.onAction?.(fullAction);
  persistState(store);
  notifySubscribers();
};

// ============================================================================
// State Differ
// ============================================================================

export interface StateDiff {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: unknown;
  newValue?: unknown;
}

export function computeStateDiff(oldState: unknown, newState: unknown, path = ''): StateDiff[] {
  const diffs: StateDiff[] = [];
  
  if (oldState === newState) return diffs;
  
  if (typeof oldState !== typeof newState) {
    diffs.push({ path: path || 'root', type: 'changed', oldValue: oldState, newValue: newState });
    return diffs;
  }
  
  if (oldState === null || newState === null) {
    if (oldState !== newState) {
      diffs.push({ path: path || 'root', type: 'changed', oldValue: oldState, newValue: newState });
    }
    return diffs;
  }
  
  if (typeof oldState !== 'object') {
    if (oldState !== newState) {
      diffs.push({ path: path || 'root', type: 'changed', oldValue: oldState, newValue: newState });
    }
    return diffs;
  }
  
  const oldObj = oldState as Record<string, unknown>;
  const newObj = newState as Record<string, unknown>;
  
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    
    if (!(key in oldObj)) {
      diffs.push({ path: newPath, type: 'added', newValue: newObj[key] });
    } else if (!(key in newObj)) {
      diffs.push({ path: newPath, type: 'removed', oldValue: oldObj[key] });
    } else {
      diffs.push(...computeStateDiff(oldObj[key], newObj[key], newPath));
    }
  }
  
  return diffs;
}

// ============================================================================
// Main DevTools Hook
// ============================================================================

export function useKBDevTools(options: UseKBDevToolsOptions = {}): UseKBDevToolsReturn {
  const { enabled = true } = options;
  
  const store = useMemo(() => getStore(options), []);
  const [, forceUpdate] = useState(0);
  
  // Subscribe to store updates
  useEffect(() => {
    if (!enabled) return;
    
    const update = () => forceUpdate(n => n + 1);
    store.subscribers.add(update);
    
    return () => {
      store.subscribers.delete(update);
    };
  }, [enabled, store]);

  // Recording controls
  const startRecording = useCallback(() => {
    store.state.isRecording = true;
    store.state.isPaused = false;
    notifySubscribers();
  }, [store]);

  const stopRecording = useCallback(() => {
    store.state.isRecording = false;
    notifySubscribers();
  }, [store]);

  const pauseRecording = useCallback(() => {
    store.state.isPaused = true;
    notifySubscribers();
  }, [store]);

  const resumeRecording = useCallback(() => {
    store.state.isPaused = false;
    notifySubscribers();
  }, [store]);

  const clearActions = useCallback(() => {
    store.state.actions = [];
    store.state.currentIndex = -1;
    store.state.bookmarks = [];
    persistState(store);
    notifySubscribers();
  }, [store]);

  // Time travel
  const jumpToAction = useCallback((index: number) => {
    if (index >= 0 && index < store.state.actions.length) {
      store.state.currentIndex = index;
      notifySubscribers();
    }
  }, [store]);

  const stepBack = useCallback(() => {
    if (store.state.currentIndex > 0) {
      store.state.currentIndex--;
      notifySubscribers();
    }
  }, [store]);

  const stepForward = useCallback(() => {
    if (store.state.currentIndex < store.state.actions.length - 1) {
      store.state.currentIndex++;
      notifySubscribers();
    }
  }, [store]);

  const jumpToStart = useCallback(() => {
    store.state.currentIndex = 0;
    notifySubscribers();
  }, [store]);

  const jumpToEnd = useCallback(() => {
    store.state.currentIndex = store.state.actions.length - 1;
    notifySubscribers();
  }, [store]);

  // Bookmarks
  const addBookmark = useCallback((index?: number) => {
    const idx = index ?? store.state.currentIndex;
    if (!store.state.bookmarks.includes(idx)) {
      store.state.bookmarks.push(idx);
      store.state.bookmarks.sort((a, b) => a - b);
      notifySubscribers();
    }
  }, [store]);

  const removeBookmark = useCallback((index: number) => {
    store.state.bookmarks = store.state.bookmarks.filter(b => b !== index);
    notifySubscribers();
  }, [store]);

  const jumpToBookmark = useCallback((bookmarkIndex: number) => {
    const actionIndex = store.state.bookmarks[bookmarkIndex];
    if (actionIndex !== undefined) {
      jumpToAction(actionIndex);
    }
  }, [store, jumpToAction]);

  // Filtering
  const setFilters = useCallback((filters: Partial<DevToolsFilters>) => {
    store.state.filters = { ...store.state.filters, ...filters };
    notifySubscribers();
  }, [store]);

  const clearFilters = useCallback(() => {
    store.state.filters = { types: [], hookNames: [] };
    notifySubscribers();
  }, [store]);

  const filteredActions = useMemo(() => {
    const { types, hookNames, minDuration, searchQuery } = store.state.filters;
    
    return store.state.actions.filter(action => {
      if (types.length > 0 && !types.includes(action.type)) return false;
      if (hookNames.length > 0 && !hookNames.includes(action.hookName)) return false;
      if (minDuration !== undefined && (action.duration || 0) < minDuration) return false;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesHook = action.hookName.toLowerCase().includes(searchLower);
        const matchesType = action.type.toLowerCase().includes(searchLower);
        const matchesPayload = JSON.stringify(action.payload).toLowerCase().includes(searchLower);
        if (!matchesHook && !matchesType && !matchesPayload) return false;
      }
      return true;
    });
  }, [store.state.actions, store.state.filters]);

  // Export/Import
  const exportState = useCallback((): string => {
    return JSON.stringify({
      actions: store.state.actions,
      bookmarks: store.state.bookmarks,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }, [store]);

  const importState = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed.actions)) {
        store.state.actions = parsed.actions.map((a: DevToolsAction) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
        store.state.bookmarks = parsed.bookmarks || [];
        store.state.currentIndex = store.state.actions.length - 1;
        notifySubscribers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [store]);

  const exportSnapshot = useCallback((hookName?: string): string => {
    if (hookName) {
      return JSON.stringify(store.snapshots.get(hookName) || [], null, 2);
    }
    
    const allSnapshots: Record<string, HookSnapshot[]> = {};
    store.snapshots.forEach((snapshots, name) => {
      allSnapshots[name] = snapshots;
    });
    return JSON.stringify(allSnapshots, null, 2);
  }, [store]);

  // Logging
  const logActionFn = useCallback((action: Omit<DevToolsAction, 'id' | 'timestamp'>) => {
    if (!enabled) return;
    logAction(action);
  }, [enabled]);

  const logCustom = useCallback((hookName: string, payload: unknown, metadata?: Record<string, unknown>) => {
    if (!enabled) return;
    logAction({ type: 'custom', hookName, payload, metadata });
  }, [enabled]);

  // Performance
  const getPerformanceProfile = useCallback((hookName: string): PerformanceProfile | null => {
    return store.profiles.get(hookName) || null;
  }, [store]);

  const getAllProfiles = useCallback((): PerformanceProfile[] => {
    return Array.from(store.profiles.values());
  }, [store]);

  // Stats
  const stats = useMemo(() => {
    const actions = store.state.actions;
    const actionsByType: Record<string, number> = {};
    const actionsByHook: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let errorCount = 0;
    
    actions.forEach(action => {
      actionsByType[action.type] = (actionsByType[action.type] || 0) + 1;
      actionsByHook[action.hookName] = (actionsByHook[action.hookName] || 0) + 1;
      
      if (action.duration) {
        totalDuration += action.duration;
        durationCount++;
      }
      
      if (action.type === 'error') {
        errorCount++;
      }
    });
    
    return {
      totalActions: actions.length,
      actionsByType,
      actionsByHook,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      errorCount,
    };
  }, [store.state.actions]);

  return {
    // State
    actions: store.state.actions,
    currentIndex: store.state.currentIndex,
    isRecording: store.state.isRecording,
    isPaused: store.state.isPaused,
    filters: store.state.filters,
    bookmarks: store.state.bookmarks,
    
    // Recording Controls
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearActions,
    
    // Time Travel
    jumpToAction,
    stepBack,
    stepForward,
    jumpToStart,
    jumpToEnd,
    
    // Bookmarks
    addBookmark,
    removeBookmark,
    jumpToBookmark,
    
    // Filtering
    setFilters,
    clearFilters,
    filteredActions,
    
    // Export/Import
    exportState,
    importState,
    exportSnapshot,
    
    // Logging
    logAction: logActionFn,
    logCustom,
    
    // Performance
    getPerformanceProfile,
    getAllProfiles,
    
    // Stats
    stats,
  };
}

// ============================================================================
// DevTools Integration Helper
// ============================================================================

export interface UseKBDevToolsIntegrationOptions {
  hookName: string;
  enabled?: boolean;
}

export interface UseKBDevToolsIntegrationReturn {
  logStateChange: (prevState: unknown, nextState: unknown) => void;
  logMutation: (input: unknown, result: unknown, duration: number) => void;
  logQuery: (params: unknown, result: unknown, duration: number) => void;
  logError: (error: KBError) => void;
  logNetwork: (request: unknown, response: unknown, duration: number) => void;
  inspector: UseHookInspectorReturn;
  profiler: UsePerformanceProfilerReturn;
}

export function useKBDevToolsIntegration(
  options: UseKBDevToolsIntegrationOptions
): UseKBDevToolsIntegrationReturn {
  const { hookName, enabled = true } = options;
  
  const inspector = useHookInspector({ hookName, enabled });
  const profiler = usePerformanceProfiler({ hookName, enabled });

  const logStateChange = useCallback((prevState: unknown, nextState: unknown) => {
    if (!enabled) return;
    logAction({
      type: 'state_change',
      hookName,
      payload: { diff: computeStateDiff(prevState, nextState) },
      prevState,
      nextState,
    });
  }, [enabled, hookName]);

  const logMutation = useCallback((input: unknown, result: unknown, duration: number) => {
    if (!enabled) return;
    logAction({
      type: 'mutation',
      hookName,
      payload: { input, result },
      duration,
    });
    profiler.recordRender(duration);
  }, [enabled, hookName, profiler]);

  const logQuery = useCallback((params: unknown, result: unknown, duration: number) => {
    if (!enabled) return;
    logAction({
      type: 'query',
      hookName,
      payload: { params, result },
      duration,
    });
    profiler.recordRender(duration);
  }, [enabled, hookName, profiler]);

  const logError = useCallback((error: KBError) => {
    if (!enabled) return;
    logAction({
      type: 'error',
      hookName,
      payload: error,
    });
    profiler.recordError();
  }, [enabled, hookName, profiler]);

  const logNetwork = useCallback((request: unknown, response: unknown, duration: number) => {
    if (!enabled) return;
    logAction({
      type: 'network',
      hookName,
      payload: { request, response },
      duration,
    });
  }, [enabled, hookName]);

  return {
    logStateChange,
    logMutation,
    logQuery,
    logError,
    logNetwork,
    inspector,
    profiler,
  };
}

// ============================================================================
// Global API
// ============================================================================

export const KBDevTools = {
  // Get current store state
  getState: (): DevToolsState | null => {
    return globalStore?.state || null;
  },
  
  // Get all snapshots
  getSnapshots: (): Map<string, HookSnapshot[]> => {
    return globalStore?.snapshots || new Map();
  },
  
  // Get all profiles
  getProfiles: (): Map<string, PerformanceProfile> => {
    return globalStore?.profiles || new Map();
  },
  
  // Log action from anywhere
  log: (action: Omit<DevToolsAction, 'id' | 'timestamp'>): void => {
    logAction(action);
  },
  
  // Clear everything
  reset: (): void => {
    if (globalStore) {
      globalStore.state = createInitialState();
      globalStore.snapshots.clear();
      globalStore.profiles.clear();
      notifySubscribers();
    }
  },
  
  // Check if enabled
  isEnabled: (): boolean => {
    return globalStore?.state.isRecording ?? false;
  },
};

// ============================================================================
// Exports
// ============================================================================

export default useKBDevTools;
