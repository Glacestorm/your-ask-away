/**
 * KB 4.5 - Background Sync Hooks
 * 
 * Hooks for background synchronization with offline support.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getOnlineStatus, addToSyncQueue, processSyncQueue } from '@/lib/kbCache';

// ============================================================================
// TYPES
// ============================================================================

export interface KBSyncOperation<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'custom';
  resource: string;
  data: T;
  timestamp: number;
  retries: number;
  maxRetries: number;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface KBSyncConfig {
  /** Auto-sync when coming online */
  autoSyncOnOnline?: boolean;
  /** Sync interval in milliseconds (0 = disabled) */
  syncInterval?: number;
  /** Maximum retries for failed operations */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Batch size for sync operations */
  batchSize?: number;
  /** Conflict resolution strategy */
  conflictResolution?: 'client-wins' | 'server-wins' | 'manual' | 'merge';
  /** Enable persistence */
  persist?: boolean;
}

export interface KBSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncAt: Date | null;
  errors: KBSyncError[];
  conflicts: KBSyncConflict[];
}

export interface KBSyncError {
  operationId: string;
  error: Error;
  timestamp: Date;
  retryCount: number;
}

export interface KBSyncConflict<T = unknown> {
  operationId: string;
  localData: T;
  serverData: T;
  timestamp: Date;
  resolved: boolean;
}

export interface KBSyncReturn<T> {
  state: KBSyncState;
  queueOperation: (operation: Omit<KBSyncOperation<T>, 'id' | 'timestamp' | 'retries'>) => string;
  sync: () => Promise<KBSyncResult>;
  retryFailed: () => Promise<void>;
  clearQueue: () => void;
  resolveConflict: (operationId: string, resolution: 'local' | 'server' | 'merge', mergedData?: T) => void;
  getPendingOperations: () => KBSyncOperation<T>[];
}

export interface KBSyncResult {
  success: number;
  failed: number;
  conflicts: number;
  duration: number;
}

// ============================================================================
// SYNC QUEUE STORAGE
// ============================================================================

const SYNC_QUEUE_KEY = 'kb_sync_queue';

function loadSyncQueue<T>(): KBSyncOperation<T>[] {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue<T>(queue: KBSyncOperation<T>[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Failed to persist sync queue:', error);
  }
}

// ============================================================================
// useKBBackgroundSync
// ============================================================================

const DEFAULT_SYNC_CONFIG: Required<KBSyncConfig> = {
  autoSyncOnOnline: true,
  syncInterval: 0,
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  conflictResolution: 'client-wins',
  persist: true,
};

export function useKBBackgroundSync<T>(
  syncHandler: (operation: KBSyncOperation<T>) => Promise<{ success: boolean; serverData?: T; conflict?: boolean }>,
  config: KBSyncConfig = {}
): KBSyncReturn<T> {
  const mergedConfig = { ...DEFAULT_SYNC_CONFIG, ...config };

  const [state, setState] = useState<KBSyncState>({
    isOnline: getOnlineStatus(),
    isSyncing: false,
    pendingOperations: 0,
    lastSyncAt: null,
    errors: [],
    conflicts: [],
  });

  const queueRef = useRef<KBSyncOperation<T>[]>(
    mergedConfig.persist ? loadSyncQueue<T>() : []
  );
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update pending count
  useEffect(() => {
    setState(prev => ({ ...prev, pendingOperations: queueRef.current.length }));
  }, []);

  // Queue operation
  const queueOperation = useCallback((
    operation: Omit<KBSyncOperation<T>, 'id' | 'timestamp' | 'retries'>
  ): string => {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullOperation: KBSyncOperation<T> = {
      ...operation,
      id,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: operation.maxRetries || mergedConfig.maxRetries,
      priority: operation.priority || 0,
    };

    queueRef.current.push(fullOperation);
    queueRef.current.sort((a, b) => b.priority - a.priority);
    
    if (mergedConfig.persist) {
      saveSyncQueue(queueRef.current);
    }

    setState(prev => ({ ...prev, pendingOperations: queueRef.current.length }));

    // Try immediate sync if online
    if (state.isOnline && mergedConfig.syncInterval === 0) {
      sync();
    }

    return id;
  }, [state.isOnline, mergedConfig.syncInterval, mergedConfig.maxRetries, mergedConfig.persist]);

  // Sync operations
  const sync = useCallback(async (): Promise<KBSyncResult> => {
    if (queueRef.current.length === 0 || state.isSyncing) {
      return { success: 0, failed: 0, conflicts: 0, duration: 0 };
    }

    setState(prev => ({ ...prev, isSyncing: true }));
    const startTime = Date.now();
    
    let success = 0;
    let failed = 0;
    let conflicts = 0;
    const newErrors: KBSyncError[] = [];
    const newConflicts: KBSyncConflict<T>[] = [];

    // Process in batches
    const queue = [...queueRef.current];
    for (let i = 0; i < queue.length; i += mergedConfig.batchSize) {
      const batch = queue.slice(i, i + mergedConfig.batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async (operation) => {
          try {
            const result = await syncHandler(operation);
            
            if (result.conflict) {
              conflicts++;
              newConflicts.push({
                operationId: operation.id,
                localData: operation.data,
                serverData: result.serverData as T,
                timestamp: new Date(),
                resolved: false,
              });
              return { operation, success: false, conflict: true };
            }

            if (result.success) {
              success++;
              return { operation, success: true };
            }

            throw new Error('Sync failed');
          } catch (error) {
            failed++;
            operation.retries++;
            
            if (operation.retries >= operation.maxRetries) {
              newErrors.push({
                operationId: operation.id,
                error: error instanceof Error ? error : new Error(String(error)),
                timestamp: new Date(),
                retryCount: operation.retries,
              });
            }
            
            return { operation, success: false };
          }
        })
      );

      // Update queue - remove successful operations
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          const index = queueRef.current.findIndex(op => op.id === result.value.operation.id);
          if (index > -1) {
            queueRef.current.splice(index, 1);
          }
        }
      });
    }

    if (mergedConfig.persist) {
      saveSyncQueue(queueRef.current);
    }

    const duration = Date.now() - startTime;

    setState(prev => ({
      ...prev,
      isSyncing: false,
      pendingOperations: queueRef.current.length,
      lastSyncAt: new Date(),
      errors: [...prev.errors, ...newErrors].slice(-50),
      conflicts: [...prev.conflicts.filter(c => !c.resolved), ...newConflicts],
    }));

    return { success, failed, conflicts, duration };
  }, [state.isSyncing, syncHandler, mergedConfig.batchSize, mergedConfig.persist]);

  // Retry failed operations
  const retryFailed = useCallback(async () => {
    const failedOps = queueRef.current.filter(op => op.retries > 0 && op.retries < op.maxRetries);
    
    for (const op of failedOps) {
      op.retries = 0;
    }

    if (mergedConfig.persist) {
      saveSyncQueue(queueRef.current);
    }

    await sync();
  }, [sync, mergedConfig.persist]);

  // Clear queue
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    
    if (mergedConfig.persist) {
      localStorage.removeItem(SYNC_QUEUE_KEY);
    }

    setState(prev => ({
      ...prev,
      pendingOperations: 0,
      errors: [],
    }));
  }, [mergedConfig.persist]);

  // Resolve conflict
  const resolveConflict = useCallback((
    operationId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: T
  ) => {
    const conflictIndex = state.conflicts.findIndex(c => c.operationId === operationId);
    if (conflictIndex === -1) return;

    const conflict = state.conflicts[conflictIndex];
    const operationIndex = queueRef.current.findIndex(op => op.id === operationId);

    if (resolution === 'local') {
      // Keep local data, retry sync
      if (operationIndex > -1) {
        queueRef.current[operationIndex].retries = 0;
      }
    } else if (resolution === 'server') {
      // Accept server data, remove from queue
      if (operationIndex > -1) {
        queueRef.current.splice(operationIndex, 1);
      }
    } else if (resolution === 'merge' && mergedData) {
      // Use merged data
      if (operationIndex > -1) {
        queueRef.current[operationIndex].data = mergedData;
        queueRef.current[operationIndex].retries = 0;
      }
    }

    if (mergedConfig.persist) {
      saveSyncQueue(queueRef.current);
    }

    setState(prev => ({
      ...prev,
      pendingOperations: queueRef.current.length,
      conflicts: prev.conflicts.map((c, i) => 
        i === conflictIndex ? { ...c, resolved: true } : c
      ),
    }));
  }, [state.conflicts, mergedConfig.persist]);

  // Get pending operations
  const getPendingOperations = useCallback(() => 
    [...queueRef.current], []);

  // Online/offline handling
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      if (mergedConfig.autoSyncOnOnline) {
        sync();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mergedConfig.autoSyncOnOnline, sync]);

  // Periodic sync
  useEffect(() => {
    if (mergedConfig.syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (state.isOnline) {
          sync();
        }
      }, mergedConfig.syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [mergedConfig.syncInterval, state.isOnline, sync]);

  return {
    state,
    queueOperation,
    sync,
    retryFailed,
    clearQueue,
    resolveConflict,
    getPendingOperations,
  };
}

// ============================================================================
// useKBPeriodicSync
// ============================================================================

export interface KBPeriodicSyncConfig {
  /** Sync interval in milliseconds */
  interval: number;
  /** Fetcher function */
  fetcher: () => Promise<unknown>;
  /** Sync handler for local data */
  syncHandler?: (serverData: unknown) => Promise<void>;
  /** Only sync when tab is visible */
  onlyWhenVisible?: boolean;
  /** Only sync when online */
  onlyWhenOnline?: boolean;
  /** Immediate first sync */
  immediate?: boolean;
}

export function useKBPeriodicSync(config: KBPeriodicSyncConfig) {
  const {
    interval,
    fetcher,
    syncHandler,
    onlyWhenVisible = true,
    onlyWhenOnline = true,
    immediate = false,
  } = config;

  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = useCallback(async () => {
    if (onlyWhenVisible && document.visibilityState !== 'visible') return;
    if (onlyWhenOnline && !navigator.onLine) return;

    setIsSyncing(true);
    setError(null);

    try {
      const serverData = await fetcher();
      setData(serverData);
      
      if (syncHandler) {
        await syncHandler(serverData);
      }

      setLastSync(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  }, [fetcher, syncHandler, onlyWhenVisible, onlyWhenOnline]);

  useEffect(() => {
    if (immediate) {
      performSync();
    }

    intervalRef.current = setInterval(performSync, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, immediate, performSync]);

  return {
    lastSync,
    isSyncing,
    error,
    data,
    syncNow: performSync,
  };
}

// ============================================================================
// useKBSyncStatus
// ============================================================================

export function useKBSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');
  const [downlink, setDownlink] = useState<number | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      
      // @ts-ignore - Network Information API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
        setDownlink(connection.downlink || null);
        setRtt(connection.rtt || null);
        setSaveData(connection.saveData || false);
      }
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  const canSync = isOnline && !saveData && (effectiveType !== 'slow-2g' && effectiveType !== '2g');

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    canSync,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g',
    isFastConnection: effectiveType === '4g',
  };
}

// ============================================================================
// useKBOptimisticSync
// ============================================================================

export interface KBOptimisticSyncConfig<T> {
  initialData: T;
  syncFn: (data: T) => Promise<T>;
  rollbackOnError?: boolean;
  debounceMs?: number;
}

export function useKBOptimisticSync<T>(config: KBOptimisticSyncConfig<T>) {
  const {
    initialData,
    syncFn,
    rollbackOnError = true,
    debounceMs = 0,
  } = config;

  const [data, setData] = useState<T>(initialData);
  const [serverData, setServerData] = useState<T>(initialData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const previousData = useRef<T>(initialData);

  const update = useCallback((newData: T | ((prev: T) => T)) => {
    setData(prev => {
      const updated = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(prev) 
        : newData;
      previousData.current = prev;
      return updated;
    });
    setHasPendingChanges(true);
    setError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const performSync = async () => {
      setIsSyncing(true);
      try {
        const result = await syncFn(typeof newData === 'function' 
          ? (newData as (prev: T) => T)(data) 
          : newData);
        setServerData(result);
        setHasPendingChanges(false);
      } catch (err) {
        const syncError = err instanceof Error ? err : new Error(String(err));
        setError(syncError);
        
        if (rollbackOnError) {
          setData(previousData.current);
        }
      } finally {
        setIsSyncing(false);
      }
    };

    if (debounceMs > 0) {
      debounceRef.current = setTimeout(performSync, debounceMs);
    } else {
      performSync();
    }
  }, [data, syncFn, rollbackOnError, debounceMs]);

  const rollback = useCallback(() => {
    setData(serverData);
    setHasPendingChanges(false);
    setError(null);
  }, [serverData]);

  const forceSync = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setIsSyncing(true);
    try {
      const result = await syncFn(data);
      setServerData(result);
      setHasPendingChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      if (rollbackOnError) {
        setData(previousData.current);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [data, syncFn, rollbackOnError]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    data,
    serverData,
    isSyncing,
    error,
    hasPendingChanges,
    update,
    rollback,
    forceSync,
  };
}

export default useKBBackgroundSync;
