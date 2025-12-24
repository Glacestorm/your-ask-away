/**
 * KB 4.5 - State Synchronization
 * Phase 19: Advanced State & Communication
 * 
 * Features:
 * - Cross-tab state sync
 * - Conflict resolution (CRDT-inspired)
 * - Version vectors
 * - Merge strategies
 * - Snapshot & restore
 * - Diff-based updates
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type MergeStrategy = 'last-write-wins' | 'first-write-wins' | 'merge-deep' | 'custom';

export interface VersionVector {
  [nodeId: string]: number;
}

export interface SyncedState<T> {
  value: T;
  version: VersionVector;
  timestamp: number;
  nodeId: string;
  checksum: string;
}

export interface StateChange<T> {
  path: string[];
  oldValue: unknown;
  newValue: unknown;
  operation: 'set' | 'delete' | 'merge';
  timestamp: number;
  nodeId: string;
}

export interface ConflictInfo<T> {
  localState: SyncedState<T>;
  remoteState: SyncedState<T>;
  conflictPath?: string[];
}

export type ConflictResolver<T> = (conflict: ConflictInfo<T>) => T;

export interface StateSyncConfig<T> {
  key: string;
  initialState: T;
  mergeStrategy?: MergeStrategy;
  conflictResolver?: ConflictResolver<T>;
  debounceMs?: number;
  enableBroadcast?: boolean;
  enablePersistence?: boolean;
  maxSnapshots?: number;
  nodeId?: string;
}

export interface Snapshot<T> {
  id: string;
  state: SyncedState<T>;
  createdAt: number;
  description?: string;
}

export interface StateSyncMetrics {
  syncCount: number;
  conflictCount: number;
  broadcastCount: number;
  lastSyncAt: number | null;
  avgSyncTime: number;
}

// =============================================================================
// UTILITIES
// =============================================================================

const generateNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateSnapshotId = (): string => {
  return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateChecksum = (value: unknown): string => {
  const str = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

const deepMerge = <T extends object>(target: T, source: Partial<T>): T => {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as object,
          sourceValue as object
        );
      } else {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  
  return result;
};

const getValueAtPath = (obj: unknown, path: string[]): unknown => {
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const setValueAtPath = <T>(obj: T, path: string[], value: unknown): T => {
  if (path.length === 0) return value as T;
  
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = result as Record<string, unknown>;
  
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    } else {
      current[key] = Array.isArray(current[key]) 
        ? [...current[key] as unknown[]] 
        : { ...current[key] as object };
    }
    current = current[key] as Record<string, unknown>;
  }
  
  current[path[path.length - 1]] = value;
  return result as T;
};

const compareVersionVectors = (v1: VersionVector, v2: VersionVector): number => {
  let v1Greater = false;
  let v2Greater = false;
  
  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  
  for (const key of allKeys) {
    const val1 = v1[key] || 0;
    const val2 = v2[key] || 0;
    
    if (val1 > val2) v1Greater = true;
    if (val2 > val1) v2Greater = true;
  }
  
  if (v1Greater && !v2Greater) return 1;
  if (v2Greater && !v1Greater) return -1;
  if (v1Greater && v2Greater) return 0; // Concurrent
  return 0; // Equal
};

const mergeVersionVectors = (v1: VersionVector, v2: VersionVector): VersionVector => {
  const result: VersionVector = { ...v1 };
  
  for (const key in v2) {
    result[key] = Math.max(result[key] || 0, v2[key]);
  }
  
  return result;
};

// =============================================================================
// BROADCAST CHANNEL
// =============================================================================

class StateBroadcaster<T> {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(state: SyncedState<T>) => void>();

  constructor(private key: string) {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`kb_state_sync_${key}`);
      this.channel.onmessage = (event) => {
        this.listeners.forEach(listener => listener(event.data));
      };
    }
  }

  broadcast(state: SyncedState<T>): void {
    this.channel?.postMessage(state);
  }

  subscribe(listener: (state: SyncedState<T>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close(): void {
    this.channel?.close();
    this.listeners.clear();
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useKBStateSync<T extends object>(config: StateSyncConfig<T>) {
  const {
    key,
    initialState,
    mergeStrategy = 'last-write-wins',
    conflictResolver,
    debounceMs = 100,
    enableBroadcast = true,
    enablePersistence = true,
    maxSnapshots = 10,
  } = config;
  
  const nodeId = useMemo(() => config.nodeId || generateNodeId(), [config.nodeId]);

  const [state, setStateInternal] = useState<SyncedState<T>>(() => {
    // Load from persistence
    if (enablePersistence) {
      try {
        const stored = localStorage.getItem(`kb_state_${key}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load synced state:', e);
      }
    }

    return {
      value: initialState,
      version: { [config.nodeId || 'default']: 1 },
      timestamp: Date.now(),
      nodeId: config.nodeId || 'default',
      checksum: calculateChecksum(initialState),
    };
  });

  const [snapshots, setSnapshots] = useState<Snapshot<T>[]>([]);
  const [metrics, setMetrics] = useState<StateSyncMetrics>({
    syncCount: 0,
    conflictCount: 0,
    broadcastCount: 0,
    lastSyncAt: null,
    avgSyncTime: 0,
  });

  const broadcasterRef = useRef<StateBroadcaster<T> | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const syncTimesRef = useRef<number[]>([]);
  const changesRef = useRef<StateChange<T>[]>([]);

  // Initialize broadcaster
  useEffect(() => {
    if (enableBroadcast) {
      broadcasterRef.current = new StateBroadcaster<T>(key);
      
      const unsubscribe = broadcasterRef.current.subscribe((remoteState) => {
        handleRemoteState(remoteState);
      });

      return () => {
        unsubscribe();
        broadcasterRef.current?.close();
      };
    }
  }, [key, enableBroadcast]);

  // Persist state changes
  useEffect(() => {
    if (enablePersistence) {
      try {
        localStorage.setItem(`kb_state_${key}`, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to persist synced state:', e);
      }
    }
  }, [state, key, enablePersistence]);

  const resolveConflict = useCallback((
    localState: SyncedState<T>,
    remoteState: SyncedState<T>
  ): T => {
    if (conflictResolver) {
      return conflictResolver({ localState, remoteState });
    }

    switch (mergeStrategy) {
      case 'last-write-wins':
        return localState.timestamp >= remoteState.timestamp 
          ? localState.value 
          : remoteState.value;
      
      case 'first-write-wins':
        return localState.timestamp <= remoteState.timestamp 
          ? localState.value 
          : remoteState.value;
      
      case 'merge-deep':
        return deepMerge(localState.value, remoteState.value as Partial<T>);
      
      default:
        return localState.value;
    }
  }, [mergeStrategy, conflictResolver]);

  const handleRemoteState = useCallback((remoteState: SyncedState<T>) => {
    const startTime = performance.now();

    setStateInternal(currentState => {
      // Skip if same node
      if (remoteState.nodeId === nodeId) return currentState;
      
      // Compare version vectors
      const comparison = compareVersionVectors(currentState.version, remoteState.version);
      
      if (comparison === 1) {
        // Local is newer
        return currentState;
      }
      
      if (comparison === -1) {
        // Remote is newer
        return {
          ...remoteState,
          version: mergeVersionVectors(currentState.version, remoteState.version),
        };
      }
      
      // Concurrent updates - resolve conflict
      setMetrics(m => ({ ...m, conflictCount: m.conflictCount + 1 }));
      
      const resolvedValue = resolveConflict(currentState, remoteState);
      const mergedVersion = mergeVersionVectors(currentState.version, remoteState.version);
      mergedVersion[nodeId] = (mergedVersion[nodeId] || 0) + 1;
      
      return {
        value: resolvedValue,
        version: mergedVersion,
        timestamp: Date.now(),
        nodeId,
        checksum: calculateChecksum(resolvedValue),
      };
    });

    const syncTime = performance.now() - startTime;
    syncTimesRef.current.push(syncTime);
    if (syncTimesRef.current.length > 100) {
      syncTimesRef.current.shift();
    }

    setMetrics(m => ({
      ...m,
      syncCount: m.syncCount + 1,
      lastSyncAt: Date.now(),
      avgSyncTime: syncTimesRef.current.reduce((a, b) => a + b, 0) / syncTimesRef.current.length,
    }));
  }, [nodeId, resolveConflict]);

  const setState = useCallback((
    updater: T | ((prev: T) => T),
    broadcast = true
  ) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setStateInternal(currentState => {
        const newValue = typeof updater === 'function' 
          ? (updater as (prev: T) => T)(currentState.value)
          : updater;

        const newVersion = { ...currentState.version };
        newVersion[nodeId] = (newVersion[nodeId] || 0) + 1;

        const newState: SyncedState<T> = {
          value: newValue,
          version: newVersion,
          timestamp: Date.now(),
          nodeId,
          checksum: calculateChecksum(newValue),
        };

        if (broadcast && enableBroadcast && broadcasterRef.current) {
          broadcasterRef.current.broadcast(newState);
          setMetrics(m => ({ ...m, broadcastCount: m.broadcastCount + 1 }));
        }

        return newState;
      });
    }, debounceMs);
  }, [nodeId, debounceMs, enableBroadcast]);

  const setPath = useCallback((
    path: string[],
    value: unknown,
    broadcast = true
  ) => {
    setState(prev => setValueAtPath(prev, path, value), broadcast);
    
    changesRef.current.push({
      path,
      oldValue: getValueAtPath(state.value, path),
      newValue: value,
      operation: 'set',
      timestamp: Date.now(),
      nodeId,
    });
  }, [setState, state.value, nodeId]);

  const deletePath = useCallback((
    path: string[],
    broadcast = true
  ) => {
    setState(prev => {
      const result = { ...prev };
      let current = result as Record<string, unknown>;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] as Record<string, unknown>;
      }
      
      delete current[path[path.length - 1]];
      return result as T;
    }, broadcast);

    changesRef.current.push({
      path,
      oldValue: getValueAtPath(state.value, path),
      newValue: undefined,
      operation: 'delete',
      timestamp: Date.now(),
      nodeId,
    });
  }, [setState, state.value, nodeId]);

  const merge = useCallback((
    partial: Partial<T>,
    broadcast = true
  ) => {
    setState(prev => deepMerge(prev, partial), broadcast);
    
    changesRef.current.push({
      path: [],
      oldValue: state.value,
      newValue: partial,
      operation: 'merge',
      timestamp: Date.now(),
      nodeId,
    });
  }, [setState, state.value, nodeId]);

  const createSnapshot = useCallback((description?: string): Snapshot<T> => {
    const snapshot: Snapshot<T> = {
      id: generateSnapshotId(),
      state: { ...state },
      createdAt: Date.now(),
      description,
    };

    setSnapshots(prev => {
      const updated = [...prev, snapshot];
      if (updated.length > maxSnapshots) {
        updated.shift();
      }
      return updated;
    });

    return snapshot;
  }, [state, maxSnapshots]);

  const restoreSnapshot = useCallback((snapshotId: string) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (snapshot) {
      setState(snapshot.state.value);
    }
  }, [snapshots, setState]);

  const getChanges = useCallback((): StateChange<T>[] => {
    return [...changesRef.current];
  }, []);

  const clearChanges = useCallback(() => {
    changesRef.current = [];
  }, []);

  const reset = useCallback(() => {
    setState(initialState, true);
    changesRef.current = [];
    setSnapshots([]);
  }, [setState, initialState]);

  return {
    // State
    value: state.value,
    version: state.version,
    timestamp: state.timestamp,
    checksum: state.checksum,
    
    // Setters
    setState,
    setPath,
    deletePath,
    merge,
    
    // Snapshots
    snapshots,
    createSnapshot,
    restoreSnapshot,
    
    // Changes
    getChanges,
    clearChanges,
    
    // Utilities
    reset,
    nodeId,
    metrics,
  };
}

export function useKBSyncedValue<T>(
  key: string,
  initialValue: T,
  options?: Partial<Omit<StateSyncConfig<{ value: T }>, 'key' | 'initialState'>>
) {
  const sync = useKBStateSync({
    key,
    initialState: { value: initialValue },
    ...options,
  });

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    sync.setState(prev => ({
      value: typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev.value)
        : newValue,
    }));
  }, [sync]);

  return [sync.value.value, setValue, sync.metrics] as const;
}

export function useKBCrossTabState<T extends object>(
  key: string,
  initialState: T
) {
  return useKBStateSync({
    key,
    initialState,
    enableBroadcast: true,
    enablePersistence: true,
    mergeStrategy: 'last-write-wins',
  });
}

export default useKBStateSync;
