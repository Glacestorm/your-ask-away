/**
 * @fileoverview useKBOfflineData - Offline-First Data Management Hook
 * @description Enterprise offline data management with sync, queue, and conflict resolution
 * @version 1.0.0
 * @phase 20 - Advanced Data Patterns
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'online';
export type OperationType = 'create' | 'update' | 'delete' | 'read';
export type ConflictStrategy = 'client-wins' | 'server-wins' | 'manual' | 'merge' | 'timestamp';
export type StorageType = 'indexeddb' | 'localstorage' | 'memory';

export interface QueuedOperation<T = unknown> {
  id: string;
  type: OperationType;
  entityType: string;
  entityId: string;
  data: T;
  timestamp: number;
  retries: number;
  maxRetries: number;
  priority: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  currentOperation?: string;
  percentage: number;
  estimatedTimeRemaining?: number;
}

export interface ConflictResolution<T = unknown> {
  id: string;
  operationId: string;
  localData: T;
  remoteData: T;
  resolvedData?: T;
  strategy: ConflictStrategy;
  resolvedAt?: number;
  resolvedBy?: 'auto' | 'user';
}

export interface OfflineConfig {
  storage: StorageType;
  dbName: string;
  storeName: string;
  conflictStrategy: ConflictStrategy;
  maxRetries: number;
  retryDelay: number;
  syncInterval: number;
  batchSize: number;
  priorityLevels: number;
  autoSync: boolean;
  onOnline?: () => void;
  onOffline?: () => void;
  onSync?: (progress: SyncProgress) => void;
  onConflict?: <T>(conflict: ConflictResolution<T>) => Promise<T>;
}

export interface OfflineState<T = unknown> {
  isOnline: boolean;
  syncStatus: SyncStatus;
  queue: QueuedOperation<T>[];
  conflicts: ConflictResolution<T>[];
  lastSyncAt: Date | null;
  progress: SyncProgress | null;
}

export interface OfflineMetrics {
  totalOperations: number;
  successfulSyncs: number;
  failedSyncs: number;
  conflictsResolved: number;
  averageSyncTime: number;
  queueSize: number;
  lastError?: string;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: OfflineConfig = {
  storage: 'indexeddb',
  dbName: 'kb-offline-db',
  storeName: 'operations',
  conflictStrategy: 'client-wins',
  maxRetries: 3,
  retryDelay: 1000,
  syncInterval: 30000,
  batchSize: 10,
  priorityLevels: 5,
  autoSync: true,
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const memoryStorage = new Map<string, unknown>();

async function initIndexedDB(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
      }
    };
  });
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBOfflineData<T = unknown>(config: Partial<OfflineConfig> = {}) {
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  const [state, setState] = useState<OfflineState<T>>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncStatus: 'idle',
    queue: [],
    conflicts: [],
    lastSyncAt: null,
    progress: null,
  });

  const [metrics, setMetrics] = useState<OfflineMetrics>({
    totalOperations: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    conflictsResolved: 0,
    averageSyncTime: 0,
    queueSize: 0,
  });

  const dbRef = useRef<IDBDatabase | null>(null);
  const isMountedRef = useRef(true);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize storage
  useEffect(() => {
    const initStorage = async () => {
      if (mergedConfig.storage === 'indexeddb') {
        try {
          dbRef.current = await initIndexedDB(mergedConfig.dbName, mergedConfig.storeName);
        } catch (err) {
          console.error('[useKBOfflineData] Failed to init IndexedDB:', err);
        }
      }
    };

    initStorage();

    return () => {
      isMountedRef.current = false;
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, [mergedConfig.dbName, mergedConfig.storeName, mergedConfig.storage]);

  // Network status listener
  useEffect(() => {
    const handleOnline = () => {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, isOnline: true, syncStatus: 'online' }));
        mergedConfig.onOnline?.();
      }
    };

    const handleOffline = () => {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, isOnline: false, syncStatus: 'offline' }));
        mergedConfig.onOffline?.();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mergedConfig]);

  // Add operation to queue
  const queueOperation = useCallback(async (
    type: OperationType,
    entityType: string,
    entityId: string,
    data: T,
    priority: number = 3
  ): Promise<string> => {
    const operation: QueuedOperation<T> = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: mergedConfig.maxRetries,
      priority,
      status: 'pending',
    };

    // Store in queue
    if (mergedConfig.storage === 'indexeddb' && dbRef.current) {
      const tx = dbRef.current.transaction(mergedConfig.storeName, 'readwrite');
      const store = tx.objectStore(mergedConfig.storeName);
      store.add(operation);
    } else if (mergedConfig.storage === 'localstorage') {
      const queue = JSON.parse(localStorage.getItem('kb-offline-queue') || '[]');
      queue.push(operation);
      localStorage.setItem('kb-offline-queue', JSON.stringify(queue));
    } else {
      memoryStorage.set(operation.id, operation);
    }

    setState(prev => ({
      ...prev,
      queue: [...prev.queue, operation],
    }));

    setMetrics(prev => ({
      ...prev,
      totalOperations: prev.totalOperations + 1,
      queueSize: prev.queueSize + 1,
    }));

    return operation.id;
  }, [mergedConfig]);

  // Process single operation
  const processOperation = useCallback(async <R>(
    operation: QueuedOperation<T>,
    processor: (op: QueuedOperation<T>) => Promise<R>
  ): Promise<{ success: boolean; result?: R; error?: string }> => {
    try {
      const result = await processor(operation);
      return { success: true, result };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }, []);

  // Sync queue
  const sync = useCallback(async <R>(
    processor: (op: QueuedOperation<T>) => Promise<R>
  ): Promise<SyncProgress> => {
    if (!state.isOnline) {
      return { total: 0, completed: 0, failed: 0, pending: state.queue.length, percentage: 0 };
    }

    setState(prev => ({ ...prev, syncStatus: 'syncing' }));

    const startTime = Date.now();
    const pendingOps = state.queue.filter(op => op.status === 'pending' || op.status === 'failed');
    const total = pendingOps.length;
    let completed = 0;
    let failed = 0;

    // Sort by priority (higher first) then by timestamp
    const sortedOps = [...pendingOps].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    // Process in batches
    for (let i = 0; i < sortedOps.length; i += mergedConfig.batchSize) {
      const batch = sortedOps.slice(i, i + mergedConfig.batchSize);
      
      const results = await Promise.all(
        batch.map(op => processOperation(op, processor))
      );

      results.forEach((result, idx) => {
        const op = batch[idx];
        if (result.success) {
          completed++;
          // Update operation status
          setState(prev => ({
            ...prev,
            queue: prev.queue.map(q => 
              q.id === op.id ? { ...q, status: 'completed' as const } : q
            ),
          }));
        } else {
          op.retries++;
          if (op.retries >= op.maxRetries) {
            failed++;
            setState(prev => ({
              ...prev,
              queue: prev.queue.map(q => 
                q.id === op.id ? { ...q, status: 'failed' as const, error: result.error } : q
              ),
            }));
          }
        }
      });

      // Update progress
      const progress: SyncProgress = {
        total,
        completed,
        failed,
        pending: total - completed - failed,
        percentage: Math.round((completed / total) * 100),
        currentOperation: batch[batch.length - 1]?.id,
      };

      if (isMountedRef.current) {
        setState(prev => ({ ...prev, progress }));
        mergedConfig.onSync?.(progress);
      }
    }

    const duration = Date.now() - startTime;

    setMetrics(prev => ({
      ...prev,
      successfulSyncs: prev.successfulSyncs + completed,
      failedSyncs: prev.failedSyncs + failed,
      averageSyncTime: (prev.averageSyncTime + duration) / 2,
      queueSize: state.queue.length - completed,
    }));

    const finalProgress: SyncProgress = {
      total,
      completed,
      failed,
      pending: total - completed - failed,
      percentage: 100,
    };

    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        syncStatus: 'idle',
        lastSyncAt: new Date(),
        progress: finalProgress,
        queue: prev.queue.filter(op => op.status !== 'completed'),
      }));
    }

    return finalProgress;
  }, [state.isOnline, state.queue, mergedConfig, processOperation]);

  // Clear queue
  const clearQueue = useCallback(() => {
    if (mergedConfig.storage === 'localstorage') {
      localStorage.removeItem('kb-offline-queue');
    } else {
      memoryStorage.clear();
    }

    setState(prev => ({
      ...prev,
      queue: [],
      conflicts: [],
    }));

    setMetrics(prev => ({
      ...prev,
      queueSize: 0,
    }));
  }, [mergedConfig.storage]);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: T
  ): Promise<boolean> => {
    const conflict = state.conflicts.find(c => c.id === conflictId);
    if (!conflict) return false;

    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.map(c =>
        c.id === conflictId
          ? { ...c, resolvedData: resolution, resolvedAt: Date.now(), resolvedBy: 'user' as const }
          : c
      ),
    }));

    setMetrics(prev => ({
      ...prev,
      conflictsResolved: prev.conflictsResolved + 1,
    }));

    return true;
  }, [state.conflicts]);

  // Auto-sync
  useEffect(() => {
    if (mergedConfig.autoSync && state.isOnline) {
      syncIntervalRef.current = setInterval(() => {
        // Trigger sync if there are pending operations
        if (state.queue.some(op => op.status === 'pending')) {
          // Note: actual sync requires processor function, this just marks interval
          console.debug('[useKBOfflineData] Auto-sync interval triggered');
        }
      }, mergedConfig.syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [mergedConfig.autoSync, mergedConfig.syncInterval, state.isOnline, state.queue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // State
    state,
    metrics,
    isOnline: state.isOnline,
    isSyncing: state.syncStatus === 'syncing',
    queueSize: state.queue.length,
    hasConflicts: state.conflicts.length > 0,
    
    // Actions
    queueOperation,
    sync,
    clearQueue,
    resolveConflict,
    
    // Utilities
    getQueuedOperations: () => state.queue,
    getConflicts: () => state.conflicts,
    getPendingCount: () => state.queue.filter(op => op.status === 'pending').length,
    getFailedCount: () => state.queue.filter(op => op.status === 'failed').length,
  };
}

// ============================================================================
// SYNC MANAGER HOOK
// ============================================================================

export interface SyncManagerConfig {
  entities: string[];
  syncOrder?: string[];
  parallelSync?: boolean;
  onEntitySync?: (entity: string, progress: SyncProgress) => void;
}

export function useKBSyncManager<T = unknown>(
  config: SyncManagerConfig,
  offlineConfig?: Partial<OfflineConfig>
) {
  const offline = useKBOfflineData<T>(offlineConfig);
  const [entityProgress, setEntityProgress] = useState<Map<string, SyncProgress>>(new Map());

  const syncEntity = useCallback(async (
    entity: string,
    processor: (op: QueuedOperation<T>) => Promise<unknown>
  ) => {
    const entityOps = offline.state.queue.filter(op => op.entityType === entity);
    
    if (entityOps.length === 0) {
      return { total: 0, completed: 0, failed: 0, pending: 0, percentage: 100 };
    }

    // Process entity operations
    const progress = await offline.sync(processor);
    
    setEntityProgress(prev => new Map(prev).set(entity, progress));
    config.onEntitySync?.(entity, progress);
    
    return progress;
  }, [offline, config]);

  const syncAll = useCallback(async (
    processors: Map<string, (op: QueuedOperation<T>) => Promise<unknown>>
  ) => {
    const order = config.syncOrder || config.entities;
    const results = new Map<string, SyncProgress>();

    if (config.parallelSync) {
      await Promise.all(
        order.map(async (entity) => {
          const processor = processors.get(entity);
          if (processor) {
            const progress = await syncEntity(entity, processor);
            results.set(entity, progress);
          }
        })
      );
    } else {
      for (const entity of order) {
        const processor = processors.get(entity);
        if (processor) {
          const progress = await syncEntity(entity, processor);
          results.set(entity, progress);
        }
      }
    }

    return results;
  }, [config, syncEntity]);

  return {
    ...offline,
    entityProgress,
    syncEntity,
    syncAll,
  };
}

// ============================================================================
// CONFLICT RESOLVER HOOK
// ============================================================================

export interface ConflictResolverConfig<T> {
  strategy: ConflictStrategy;
  mergeFunction?: (local: T, remote: T) => T;
  timestampField?: keyof T;
}

export function useKBConflictResolver<T = unknown>(config: ConflictResolverConfig<T>) {
  const [unresolvedConflicts, setUnresolvedConflicts] = useState<ConflictResolution<T>[]>([]);

  const resolveConflict = useCallback((
    local: T,
    remote: T,
    operationId: string
  ): { resolved: T; strategy: ConflictStrategy } => {
    switch (config.strategy) {
      case 'client-wins':
        return { resolved: local, strategy: 'client-wins' };
      
      case 'server-wins':
        return { resolved: remote, strategy: 'server-wins' };
      
      case 'timestamp':
        if (config.timestampField) {
          const localTs = (local as Record<string, unknown>)[config.timestampField as string];
          const remoteTs = (remote as Record<string, unknown>)[config.timestampField as string];
          return (localTs as number) > (remoteTs as number)
            ? { resolved: local, strategy: 'timestamp' }
            : { resolved: remote, strategy: 'timestamp' };
        }
        return { resolved: remote, strategy: 'timestamp' };
      
      case 'merge':
        if (config.mergeFunction) {
          return { resolved: config.mergeFunction(local, remote), strategy: 'merge' };
        }
        // Default merge: shallow merge with local priority
        return { 
          resolved: { ...remote, ...local } as T, 
          strategy: 'merge' 
        };
      
      case 'manual':
      default:
        const conflict: ConflictResolution<T> = {
          id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          operationId,
          localData: local,
          remoteData: remote,
          strategy: 'manual',
        };
        setUnresolvedConflicts(prev => [...prev, conflict]);
        return { resolved: local, strategy: 'manual' }; // Temporary return local
    }
  }, [config]);

  const manualResolve = useCallback((conflictId: string, resolvedData: T) => {
    setUnresolvedConflicts(prev => prev.filter(c => c.id !== conflictId));
    return resolvedData;
  }, []);

  const dismissConflict = useCallback((conflictId: string) => {
    setUnresolvedConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  return {
    unresolvedConflicts,
    hasUnresolvedConflicts: unresolvedConflicts.length > 0,
    resolveConflict,
    manualResolve,
    dismissConflict,
    clearAllConflicts: () => setUnresolvedConflicts([]),
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default useKBOfflineData;
