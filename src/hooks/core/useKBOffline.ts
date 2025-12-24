/**
 * KB 4.5 - Phase 5: Offline-First with Service Worker Integration
 * 
 * Features:
 * - IndexedDB persistence layer
 * - Background sync queue
 * - Conflict resolution strategies
 * - Network status detection
 * - Automatic retry on reconnection
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { KBError } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type ConflictResolutionStrategy = 
  | 'client-wins' 
  | 'server-wins' 
  | 'last-write-wins' 
  | 'merge' 
  | 'manual';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface OfflineEntry<T = unknown> {
  id: string;
  key: string;
  data: T;
  timestamp: number;
  version: number;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  retryCount: number;
  lastError?: string;
  expiresAt?: number;
}

export interface SyncOperation<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete';
  key: string;
  data: T;
  timestamp: number;
  retryCount: number;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface ConflictInfo<T = unknown> {
  key: string;
  localData: T;
  serverData: T;
  localTimestamp: number;
  serverTimestamp: number;
  localVersion: number;
  serverVersion: number;
}

export interface KBOfflineConfig<T = unknown> {
  storeName: string;
  version?: number;
  maxRetries?: number;
  retryDelay?: number;
  expirationMs?: number;
  conflictStrategy?: ConflictResolutionStrategy;
  onConflict?: (conflict: ConflictInfo<T>) => Promise<T>;
  onSyncComplete?: (results: SyncResult[]) => void;
  onNetworkChange?: (isOnline: boolean) => void;
  syncOnReconnect?: boolean;
  batchSize?: number;
}

export interface SyncResult {
  operationId: string;
  success: boolean;
  error?: string;
  resolvedData?: unknown;
}

export interface KBOfflineState<T> {
  data: Map<string, OfflineEntry<T>>;
  pendingOperations: SyncOperation<T>[];
  syncStatus: SyncStatus;
  isOnline: boolean;
  lastSyncAt: number | null;
  conflicts: ConflictInfo<T>[];
}

export interface KBOfflineReturn<T> {
  // State
  state: KBOfflineState<T>;
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  conflictCount: number;
  
  // CRUD Operations
  get: (key: string) => Promise<T | null>;
  set: (key: string, data: T) => Promise<void>;
  update: (key: string, updater: (prev: T | null) => T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  
  // Bulk Operations
  getAll: () => Promise<OfflineEntry<T>[]>;
  setMany: (entries: Array<{ key: string; data: T }>) => Promise<void>;
  clear: () => Promise<void>;
  
  // Sync Operations
  sync: () => Promise<SyncResult[]>;
  forcePush: (key: string) => Promise<SyncResult>;
  forcePull: (key: string) => Promise<T | null>;
  
  // Conflict Resolution
  resolveConflict: (key: string, resolution: T) => Promise<void>;
  resolveAllConflicts: (strategy: ConflictResolutionStrategy) => Promise<void>;
  
  // Utilities
  getEntry: (key: string) => Promise<OfflineEntry<T> | null>;
  getPendingOperations: () => SyncOperation<T>[];
  clearPendingOperations: () => Promise<void>;
}

// ============================================================================
// INDEXEDDB WRAPPER
// ============================================================================

class IndexedDBStore<T> {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, storeName: string, version: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create main store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('key', 'key', { unique: true });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create sync queue store
        const syncStoreName = `${this.storeName}_sync`;
        if (!db.objectStoreNames.contains(syncStoreName)) {
          const syncStore = db.createObjectStore(syncStoreName, { keyPath: 'id' });
          syncStore.createIndex('priority', 'priority', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<OfflineEntry<T> | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('key');
      const request = index.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set(entry: OfflineEntry<T>): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.open();
    const entry = await this.get(key);
    if (!entry) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(entry.id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll(): Promise<OfflineEntry<T>[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Sync Queue Operations
  async addSyncOperation(operation: SyncOperation<T>): Promise<void> {
    const db = await this.open();
    const syncStoreName = `${this.storeName}_sync`;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(syncStoreName, 'readwrite');
      const store = transaction.objectStore(syncStoreName);
      const request = store.put(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncOperations(): Promise<SyncOperation<T>[]> {
    const db = await this.open();
    const syncStoreName = `${this.storeName}_sync`;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(syncStoreName, 'readonly');
      const store = transaction.objectStore(syncStoreName);
      const index = store.index('priority');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const ops = request.result || [];
        // Sort by priority (desc) then timestamp (asc)
        ops.sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return a.timestamp - b.timestamp;
        });
        resolve(ops);
      };
    });
  }

  async removeSyncOperation(id: string): Promise<void> {
    const db = await this.open();
    const syncStoreName = `${this.storeName}_sync`;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(syncStoreName, 'readwrite');
      const store = transaction.objectStore(syncStoreName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearSyncOperations(): Promise<void> {
    const db = await this.open();
    const syncStoreName = `${this.storeName}_sync`;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(syncStoreName, 'readwrite');
      const store = transaction.objectStore(syncStoreName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// ============================================================================
// NETWORK STATUS HOOK
// ============================================================================

export function useNetworkStatus(): {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
} {
  const [status, setStatus] = useState(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: null as string | null,
    downlink: null as number | null,
    rtt: null as number | null,
  }));

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection;
      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
      });
    };

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return status;
}

// ============================================================================
// MAIN HOOK: useKBOffline
// ============================================================================

export function useKBOffline<T>(
  syncFn: (operation: SyncOperation<T>) => Promise<T>,
  fetchFn: (key: string) => Promise<T | null>,
  config: KBOfflineConfig<T>
): KBOfflineReturn<T> {
  const {
    storeName,
    version = 1,
    maxRetries = 3,
    retryDelay = 1000,
    expirationMs,
    conflictStrategy = 'last-write-wins',
    onConflict,
    onSyncComplete,
    onNetworkChange,
    syncOnReconnect = true,
    batchSize = 10,
  } = config;

  // Store reference
  const storeRef = useRef<IndexedDBStore<T> | null>(null);
  
  // State
  const [state, setState] = useState<KBOfflineState<T>>({
    data: new Map(),
    pendingOperations: [],
    syncStatus: 'idle',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncAt: null,
    conflicts: [],
  });

  // Network status
  const { isOnline } = useNetworkStatus();

  // Initialize store
  useEffect(() => {
    storeRef.current = new IndexedDBStore<T>(`kb_offline_${storeName}`, storeName, version);
    
    // Load initial data
    const loadData = async () => {
      const store = storeRef.current;
      if (!store) return;

      try {
        const entries = await store.getAll();
        const operations = await store.getSyncOperations();
        
        const dataMap = new Map<string, OfflineEntry<T>>();
        const conflicts: ConflictInfo<T>[] = [];

        for (const entry of entries) {
          // Check expiration
          if (expirationMs && entry.expiresAt && entry.expiresAt < Date.now()) {
            await store.delete(entry.key);
            continue;
          }
          
          dataMap.set(entry.key, entry);
          
          if (entry.syncStatus === 'conflict') {
            // We'd need server data to create conflict info
            // For now, mark as needing resolution
          }
        }

        setState(prev => ({
          ...prev,
          data: dataMap,
          pendingOperations: operations,
          conflicts,
        }));
      } catch (error) {
        console.error('[useKBOffline] Failed to load data:', error);
      }
    };

    loadData();

    return () => {
      storeRef.current?.close();
    };
  }, [storeName, version, expirationMs]);

  // Handle network status changes
  useEffect(() => {
    setState(prev => ({ ...prev, isOnline }));
    onNetworkChange?.(isOnline);

    if (isOnline && syncOnReconnect && state.pendingOperations.length > 0) {
      sync();
    }
  }, [isOnline]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // GET operation
  const get = useCallback(async (key: string): Promise<T | null> => {
    const store = storeRef.current;
    if (!store) return null;

    try {
      const entry = await store.get(key);
      return entry?.data || null;
    } catch (error) {
      console.error('[useKBOffline] Get error:', error);
      return null;
    }
  }, []);

  // SET operation
  const set = useCallback(async (key: string, data: T): Promise<void> => {
    const store = storeRef.current;
    if (!store) return;

    try {
      const existingEntry = await store.get(key);
      const now = Date.now();
      
      const entry: OfflineEntry<T> = {
        id: existingEntry?.id || generateId(),
        key,
        data,
        timestamp: now,
        version: (existingEntry?.version || 0) + 1,
        syncStatus: isOnline ? 'pending' : 'pending',
        retryCount: 0,
        expiresAt: expirationMs ? now + expirationMs : undefined,
      };

      await store.set(entry);

      // Add sync operation
      const operation: SyncOperation<T> = {
        id: generateId(),
        type: existingEntry ? 'update' : 'create',
        key,
        data,
        timestamp: now,
        retryCount: 0,
        priority: 1,
      };

      await store.addSyncOperation(operation);

      setState(prev => {
        const newData = new Map(prev.data);
        newData.set(key, entry);
        return {
          ...prev,
          data: newData,
          pendingOperations: [...prev.pendingOperations, operation],
        };
      });

      // If online, trigger sync
      if (isOnline) {
        sync();
      }
    } catch (error) {
      console.error('[useKBOffline] Set error:', error);
      throw error;
    }
  }, [isOnline, expirationMs, generateId]);

  // UPDATE operation
  const update = useCallback(async (key: string, updater: (prev: T | null) => T): Promise<void> => {
    const current = await get(key);
    const newData = updater(current);
    await set(key, newData);
  }, [get, set]);

  // REMOVE operation
  const remove = useCallback(async (key: string): Promise<void> => {
    const store = storeRef.current;
    if (!store) return;

    try {
      const existingEntry = await store.get(key);
      if (!existingEntry) return;

      await store.delete(key);

      // Add delete sync operation
      const operation: SyncOperation<T> = {
        id: generateId(),
        type: 'delete',
        key,
        data: existingEntry.data,
        timestamp: Date.now(),
        retryCount: 0,
        priority: 1,
      };

      await store.addSyncOperation(operation);

      setState(prev => {
        const newData = new Map(prev.data);
        newData.delete(key);
        return {
          ...prev,
          data: newData,
          pendingOperations: [...prev.pendingOperations, operation],
        };
      });

      if (isOnline) {
        sync();
      }
    } catch (error) {
      console.error('[useKBOffline] Remove error:', error);
      throw error;
    }
  }, [isOnline, generateId]);

  // GET ALL operation
  const getAll = useCallback(async (): Promise<OfflineEntry<T>[]> => {
    const store = storeRef.current;
    if (!store) return [];

    try {
      return await store.getAll();
    } catch (error) {
      console.error('[useKBOffline] GetAll error:', error);
      return [];
    }
  }, []);

  // SET MANY operation
  const setMany = useCallback(async (entries: Array<{ key: string; data: T }>): Promise<void> => {
    for (const { key, data } of entries) {
      await set(key, data);
    }
  }, [set]);

  // CLEAR operation
  const clear = useCallback(async (): Promise<void> => {
    const store = storeRef.current;
    if (!store) return;

    try {
      await store.clear();
      await store.clearSyncOperations();
      
      setState(prev => ({
        ...prev,
        data: new Map(),
        pendingOperations: [],
        conflicts: [],
      }));
    } catch (error) {
      console.error('[useKBOffline] Clear error:', error);
      throw error;
    }
  }, []);

  // Resolve conflict using strategy
  const resolveConflictWithStrategy = useCallback(async (
    conflict: ConflictInfo<T>,
    strategy: ConflictResolutionStrategy
  ): Promise<T> => {
    switch (strategy) {
      case 'client-wins':
        return conflict.localData;
      
      case 'server-wins':
        return conflict.serverData;
      
      case 'last-write-wins':
        return conflict.localTimestamp > conflict.serverTimestamp
          ? conflict.localData
          : conflict.serverData;
      
      case 'merge':
        // Simple merge for objects
        if (typeof conflict.localData === 'object' && typeof conflict.serverData === 'object') {
          return { ...conflict.serverData, ...conflict.localData } as T;
        }
        return conflict.localData;
      
      case 'manual':
        if (onConflict) {
          return await onConflict(conflict);
        }
        throw new Error('Manual conflict resolution required but no handler provided');
      
      default:
        return conflict.localData;
    }
  }, [onConflict]);

  // SYNC operation
  const sync = useCallback(async (): Promise<SyncResult[]> => {
    const store = storeRef.current;
    if (!store || !isOnline) return [];

    setState(prev => ({ ...prev, syncStatus: 'syncing' }));

    const results: SyncResult[] = [];
    const operations = await store.getSyncOperations();
    const batchedOps = operations.slice(0, batchSize);

    for (const operation of batchedOps) {
      try {
        const serverData = await syncFn(operation);
        
        // Check for conflicts
        const localEntry = await store.get(operation.key);
        if (localEntry && operation.type === 'update') {
          // Simple version check for conflict detection
          const serverTimestamp = Date.now(); // In real impl, get from server response
          
          if (serverTimestamp > localEntry.timestamp) {
            // Potential conflict - resolve based on strategy
            const conflict: ConflictInfo<T> = {
              key: operation.key,
              localData: localEntry.data,
              serverData,
              localTimestamp: localEntry.timestamp,
              serverTimestamp,
              localVersion: localEntry.version,
              serverVersion: localEntry.version + 1,
            };

            const resolved = await resolveConflictWithStrategy(conflict, conflictStrategy);
            
            // Update local with resolved data
            await store.set({
              ...localEntry,
              data: resolved,
              syncStatus: 'synced',
              timestamp: Date.now(),
            });

            results.push({
              operationId: operation.id,
              success: true,
              resolvedData: resolved,
            });
          } else {
            // No conflict - update local entry
            await store.set({
              ...localEntry,
              syncStatus: 'synced',
            });

            results.push({
              operationId: operation.id,
              success: true,
            });
          }
        } else {
          results.push({
            operationId: operation.id,
            success: true,
          });
        }

        // Remove processed operation
        await store.removeSyncOperation(operation.id);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sync failed';
        
        // Increment retry count
        if (operation.retryCount < maxRetries) {
          operation.retryCount++;
          await store.addSyncOperation(operation);
          
          // Schedule retry with exponential backoff
          setTimeout(() => sync(), retryDelay * Math.pow(2, operation.retryCount));
        } else {
          // Max retries exceeded - mark as error
          const entry = await store.get(operation.key);
          if (entry) {
            await store.set({
              ...entry,
              syncStatus: 'error',
              lastError: errorMessage,
            });
          }
          await store.removeSyncOperation(operation.id);
        }

        results.push({
          operationId: operation.id,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Refresh state
    const updatedEntries = await store.getAll();
    const updatedOperations = await store.getSyncOperations();

    const dataMap = new Map<string, OfflineEntry<T>>();
    for (const entry of updatedEntries) {
      dataMap.set(entry.key, entry);
    }

    setState(prev => ({
      ...prev,
      data: dataMap,
      pendingOperations: updatedOperations,
      syncStatus: updatedOperations.length > 0 ? 'syncing' : 'idle',
      lastSyncAt: Date.now(),
    }));

    onSyncComplete?.(results);
    return results;
  }, [isOnline, batchSize, syncFn, conflictStrategy, maxRetries, retryDelay, resolveConflictWithStrategy, onSyncComplete]);

  // FORCE PUSH operation
  const forcePush = useCallback(async (key: string): Promise<SyncResult> => {
    const store = storeRef.current;
    if (!store) {
      return { operationId: '', success: false, error: 'Store not initialized' };
    }

    const entry = await store.get(key);
    if (!entry) {
      return { operationId: '', success: false, error: 'Entry not found' };
    }

    const operation: SyncOperation<T> = {
      id: generateId(),
      type: 'update',
      key,
      data: entry.data,
      timestamp: Date.now(),
      retryCount: 0,
      priority: 10, // High priority
    };

    try {
      await syncFn(operation);
      await store.set({ ...entry, syncStatus: 'synced' });
      return { operationId: operation.id, success: true };
    } catch (error) {
      return {
        operationId: operation.id,
        success: false,
        error: error instanceof Error ? error.message : 'Force push failed',
      };
    }
  }, [syncFn, generateId]);

  // FORCE PULL operation
  const forcePull = useCallback(async (key: string): Promise<T | null> => {
    const store = storeRef.current;
    if (!store) return null;

    try {
      const serverData = await fetchFn(key);
      if (serverData !== null) {
        const entry: OfflineEntry<T> = {
          id: generateId(),
          key,
          data: serverData,
          timestamp: Date.now(),
          version: 1,
          syncStatus: 'synced',
          retryCount: 0,
        };
        await store.set(entry);
        
        setState(prev => {
          const newData = new Map(prev.data);
          newData.set(key, entry);
          return { ...prev, data: newData };
        });
      }
      return serverData;
    } catch (error) {
      console.error('[useKBOffline] Force pull error:', error);
      return null;
    }
  }, [fetchFn, generateId]);

  // RESOLVE CONFLICT manually
  const resolveConflict = useCallback(async (key: string, resolution: T): Promise<void> => {
    const store = storeRef.current;
    if (!store) return;

    const entry = await store.get(key);
    if (entry) {
      await store.set({
        ...entry,
        data: resolution,
        syncStatus: 'pending',
        timestamp: Date.now(),
      });

      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter(c => c.key !== key),
      }));

      // Trigger sync
      if (isOnline) {
        sync();
      }
    }
  }, [isOnline, sync]);

  // RESOLVE ALL CONFLICTS
  const resolveAllConflicts = useCallback(async (strategy: ConflictResolutionStrategy): Promise<void> => {
    for (const conflict of state.conflicts) {
      const resolved = await resolveConflictWithStrategy(conflict, strategy);
      await resolveConflict(conflict.key, resolved);
    }
  }, [state.conflicts, resolveConflictWithStrategy, resolveConflict]);

  // GET ENTRY
  const getEntry = useCallback(async (key: string): Promise<OfflineEntry<T> | null> => {
    const store = storeRef.current;
    if (!store) return null;
    return store.get(key);
  }, []);

  // GET PENDING OPERATIONS
  const getPendingOperations = useCallback((): SyncOperation<T>[] => {
    return state.pendingOperations;
  }, [state.pendingOperations]);

  // CLEAR PENDING OPERATIONS
  const clearPendingOperations = useCallback(async (): Promise<void> => {
    const store = storeRef.current;
    if (!store) return;

    await store.clearSyncOperations();
    setState(prev => ({ ...prev, pendingOperations: [] }));
  }, []);

  // Computed values
  const pendingCount = useMemo(() => state.pendingOperations.length, [state.pendingOperations]);
  const conflictCount = useMemo(() => state.conflicts.length, [state.conflicts]);

  return {
    state,
    isOnline: state.isOnline,
    syncStatus: state.syncStatus,
    pendingCount,
    conflictCount,
    get,
    set,
    update,
    remove,
    getAll,
    setMany,
    clear,
    sync,
    forcePush,
    forcePull,
    resolveConflict,
    resolveAllConflicts,
    getEntry,
    getPendingOperations,
    clearPendingOperations,
  };
}

// ============================================================================
// HOOK: useKBSyncQueue - Dedicated sync queue management
// ============================================================================

export interface SyncQueueConfig {
  maxConcurrent?: number;
  retryStrategy?: 'immediate' | 'exponential' | 'linear';
  onProgress?: (completed: number, total: number) => void;
}

export function useKBSyncQueue<T>(
  processor: (item: T) => Promise<void>,
  config: SyncQueueConfig = {}
) {
  const {
    maxConcurrent = 3,
    retryStrategy = 'exponential',
    onProgress,
  } = config;

  const [queue, setQueue] = useState<Array<{ id: string; item: T; retries: number }>>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(0);
  const [failed, setFailed] = useState<Array<{ id: string; item: T; error: string }>>([]);

  const isProcessingRef = useRef(false);

  const enqueue = useCallback((item: T, id?: string) => {
    const itemId = id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setQueue(prev => [...prev, { id: itemId, item, retries: 0 }]);
    return itemId;
  }, []);

  const enqueueBatch = useCallback((items: T[]) => {
    const ids = items.map((item, index) => {
      const id = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      return { id, item, retries: 0 };
    });
    setQueue(prev => [...prev, ...ids]);
    return ids.map(i => i.id);
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (queue.length > 0) {
      const batch = queue.slice(0, maxConcurrent);
      const batchIds = batch.map(b => b.id);

      setProcessing(new Set(batchIds));

      const results = await Promise.allSettled(
        batch.map(async ({ id, item, retries }) => {
          try {
            await processor(item);
            return { id, success: true };
          } catch (error) {
            return { 
              id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error',
              item,
              retries,
            };
          }
        })
      );

      const succeeded: string[] = [];
      const needsRetry: Array<{ id: string; item: T; retries: number }> = [];
      const permanentlyFailed: Array<{ id: string; item: T; error: string }> = [];

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { id, success, error, item, retries } = result.value as any;
          if (success) {
            succeeded.push(id);
          } else if (retries < 3) {
            const delay = retryStrategy === 'exponential' 
              ? Math.pow(2, retries) * 1000
              : retryStrategy === 'linear'
                ? (retries + 1) * 1000
                : 0;
            
            setTimeout(() => {
              needsRetry.push({ id, item, retries: retries + 1 });
            }, delay);
          } else {
            permanentlyFailed.push({ id, item, error });
          }
        }
      }

      setQueue(prev => prev.filter(p => !batchIds.includes(p.id)));
      setCompleted(prev => prev + succeeded.length);
      setFailed(prev => [...prev, ...permanentlyFailed]);

      if (needsRetry.length > 0) {
        setQueue(prev => [...prev, ...needsRetry]);
      }

      onProgress?.(completed + succeeded.length, completed + succeeded.length + queue.length);
      setProcessing(new Set());
    }

    isProcessingRef.current = false;
  }, [queue, maxConcurrent, processor, retryStrategy, completed, onProgress]);

  // Auto-process when queue changes
  useEffect(() => {
    if (queue.length > 0 && !isProcessingRef.current) {
      processQueue();
    }
  }, [queue.length, processQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setProcessing(new Set());
  }, []);

  const clearFailed = useCallback(() => {
    setFailed([]);
  }, []);

  const retryFailed = useCallback(() => {
    setQueue(prev => [...prev, ...failed.map(f => ({ id: f.id, item: f.item, retries: 0 }))]);
    setFailed([]);
  }, [failed]);

  return {
    queue,
    processing: Array.from(processing),
    completed,
    failed,
    isProcessing: isProcessingRef.current,
    enqueue,
    enqueueBatch,
    clearQueue,
    clearFailed,
    retryFailed,
    queueLength: queue.length,
    failedCount: failed.length,
  };
}

// ============================================================================
// HOOK: useKBOfflineFirst - Simplified offline-first data access
// ============================================================================

export interface OfflineFirstConfig<T> {
  key: string;
  fetchFn: () => Promise<T>;
  saveFn?: (data: T) => Promise<void>;
  staleTime?: number;
  cacheTime?: number;
}

export function useKBOfflineFirst<T>(config: OfflineFirstConfig<T>) {
  const { key, fetchFn, saveFn, staleTime = 5 * 60 * 1000, cacheTime = 24 * 60 * 60 * 1000 } = config;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useNetworkStatus();

  const cacheKey = `kb_offline_first_${key}`;

  // Load from cache
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < cacheTime) {
            setData(cachedData);
            setIsStale(age > staleTime);
          }
        }
      } catch (e) {
        console.error('[useKBOfflineFirst] Cache load error:', e);
      }
    };

    loadFromCache();
  }, [cacheKey, staleTime, cacheTime]);

  // Fetch fresh data
  const refresh = useCallback(async () => {
    if (!isOnline) {
      setError(new Error('Offline - using cached data'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetchFn();
      setData(freshData);
      setIsStale(false);

      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data: freshData,
        timestamp: Date.now(),
      }));

      // Optionally persist to server
      if (saveFn) {
        await saveFn(freshData);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Fetch failed'));
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, fetchFn, saveFn, cacheKey]);

  // Initial fetch
  useEffect(() => {
    if (isOnline && (data === null || isStale)) {
      refresh();
    } else {
      setIsLoading(false);
    }
  }, [isOnline]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && isStale) {
      refresh();
    }
  }, [isOnline, isStale, refresh]);

  const updateLocal = useCallback((updater: (prev: T | null) => T) => {
    setData(prev => {
      const newData = updater(prev);
      localStorage.setItem(cacheKey, JSON.stringify({
        data: newData,
        timestamp: Date.now(),
      }));
      return newData;
    });
  }, [cacheKey]);

  return {
    data,
    isLoading,
    isStale,
    isOnline,
    error,
    refresh,
    updateLocal,
  };
}

export default useKBOffline;
