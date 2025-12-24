/**
 * @fileoverview useKBOptimistic - Optimistic Updates Hook
 * @description Enterprise optimistic update management with rollback, queue, and conflict resolution
 * @version 1.0.0
 * @phase 20 - Advanced Data Patterns
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type OptimisticStatus = 'pending' | 'confirmed' | 'failed' | 'rolled-back';
export type RollbackStrategy = 'immediate' | 'queued' | 'manual';
export type ConflictResolution = 'client-wins' | 'server-wins' | 'merge' | 'reject';

export interface OptimisticUpdate<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityId: string;
  entityType: string;
  optimisticData: T;
  originalData: T | null;
  serverData?: T;
  status: OptimisticStatus;
  timestamp: number;
  confirmedAt?: number;
  error?: string;
  retries: number;
  metadata?: Record<string, unknown>;
}

export interface OptimisticQueue {
  updates: OptimisticUpdate[];
  pending: number;
  confirmed: number;
  failed: number;
  processing: boolean;
}

export interface OptimisticConflict<T = unknown> {
  id: string;
  updateId: string;
  clientData: T;
  serverData: T;
  originalData: T | null;
  detectedAt: number;
  resolution?: ConflictResolution;
  resolvedData?: T;
}

export interface OptimisticConfig {
  maxRetries: number;
  retryDelay: number;
  rollbackStrategy: RollbackStrategy;
  conflictResolution: ConflictResolution;
  timeout: number;
  batchSize: number;
  onUpdate?: <T>(update: OptimisticUpdate<T>) => void;
  onConfirm?: <T>(update: OptimisticUpdate<T>) => void;
  onRollback?: <T>(update: OptimisticUpdate<T>) => void;
  onConflict?: <T>(conflict: OptimisticConflict<T>) => ConflictResolution | Promise<ConflictResolution>;
}

export interface MutationFn<T, TInput = unknown> {
  (input: TInput): Promise<T>;
}

export interface OptimisticMutationOptions<T, TInput = unknown> {
  entityId: string;
  entityType: string;
  optimisticData: T;
  mutationFn: MutationFn<T, TInput>;
  input: TInput;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  rollbackOnError?: boolean;
  metadata?: Record<string, unknown>;
}

export interface OptimisticMetrics {
  totalUpdates: number;
  confirmedUpdates: number;
  failedUpdates: number;
  rolledBackUpdates: number;
  averageConfirmTime: number;
  conflictsResolved: number;
  pendingUpdates: number;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_CONFIG: OptimisticConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  rollbackStrategy: 'immediate',
  conflictResolution: 'client-wins',
  timeout: 30000,
  batchSize: 10,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateUpdateId(): string {
  return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

function mergeData<T extends Record<string, unknown>>(
  original: T | null,
  client: T,
  server: T
): T {
  if (!original) return server;
  
  const merged: Record<string, unknown> = { ...server };
  
  for (const key of Object.keys(client)) {
    // If client changed this field from original, use client value
    if (original && client[key] !== original[key]) {
      merged[key] = client[key];
    }
  }
  
  return merged as T;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

const optimisticStore = new Map<string, OptimisticUpdate>();
const entitySnapshots = new Map<string, unknown>();

// ============================================================================
// MAIN HOOK: useKBOptimistic
// ============================================================================

export function useKBOptimistic<T = unknown>(config: Partial<OptimisticConfig> = {}) {
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  const [updates, setUpdates] = useState<OptimisticUpdate<T>[]>([]);
  const [conflicts, setConflicts] = useState<OptimisticConflict<T>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState<OptimisticMetrics>({
    totalUpdates: 0,
    confirmedUpdates: 0,
    failedUpdates: 0,
    rolledBackUpdates: 0,
    averageConfirmTime: 0,
    conflictsResolved: 0,
    pendingUpdates: 0,
  });

  const confirmTimesRef = useRef<number[]>([]);
  const processingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get entity key
  const getEntityKey = useCallback((entityType: string, entityId: string): string => {
    return `${entityType}:${entityId}`;
  }, []);

  // Save snapshot
  const saveSnapshot = useCallback((entityType: string, entityId: string, data: T) => {
    const key = getEntityKey(entityType, entityId);
    if (!entitySnapshots.has(key)) {
      entitySnapshots.set(key, deepClone(data));
    }
  }, [getEntityKey]);

  // Get snapshot
  const getSnapshot = useCallback((entityType: string, entityId: string): T | null => {
    const key = getEntityKey(entityType, entityId);
    return (entitySnapshots.get(key) as T) ?? null;
  }, [getEntityKey]);

  // Clear snapshot
  const clearSnapshot = useCallback((entityType: string, entityId: string) => {
    const key = getEntityKey(entityType, entityId);
    entitySnapshots.delete(key);
  }, [getEntityKey]);

  // Add optimistic update
  const addUpdate = useCallback((
    type: OptimisticUpdate['type'],
    entityId: string,
    entityType: string,
    optimisticData: T,
    originalData: T | null,
    metadata?: Record<string, unknown>
  ): OptimisticUpdate<T> => {
    const update: OptimisticUpdate<T> = {
      id: generateUpdateId(),
      type,
      entityId,
      entityType,
      optimisticData,
      originalData: originalData ? deepClone(originalData) : null,
      status: 'pending',
      timestamp: Date.now(),
      retries: 0,
      metadata,
    };

    optimisticStore.set(update.id, update as OptimisticUpdate);
    
    if (isMountedRef.current) {
      setUpdates(prev => [...prev, update]);
      setMetrics(prev => ({
        ...prev,
        totalUpdates: prev.totalUpdates + 1,
        pendingUpdates: prev.pendingUpdates + 1,
      }));
    }

    mergedConfig.onUpdate?.(update);
    return update;
  }, [mergedConfig]);

  // Confirm update
  const confirmUpdate = useCallback((
    updateId: string,
    serverData?: T
  ) => {
    const update = optimisticStore.get(updateId) as OptimisticUpdate<T> | undefined;
    if (!update) return;

    const confirmTime = Date.now() - update.timestamp;
    confirmTimesRef.current.push(confirmTime);
    if (confirmTimesRef.current.length > 100) {
      confirmTimesRef.current.shift();
    }

    const confirmedUpdate: OptimisticUpdate<T> = {
      ...update,
      status: 'confirmed',
      confirmedAt: Date.now(),
      serverData,
    };

    optimisticStore.set(updateId, confirmedUpdate as OptimisticUpdate);
    clearSnapshot(update.entityType, update.entityId);

    if (isMountedRef.current) {
      setUpdates(prev => prev.map(u => u.id === updateId ? confirmedUpdate : u));
      setMetrics(prev => ({
        ...prev,
        confirmedUpdates: prev.confirmedUpdates + 1,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
        averageConfirmTime: confirmTimesRef.current.reduce((a, b) => a + b, 0) / confirmTimesRef.current.length,
      }));
    }

    mergedConfig.onConfirm?.(confirmedUpdate);
  }, [clearSnapshot, mergedConfig]);

  // Rollback update
  const rollbackUpdate = useCallback((
    updateId: string,
    error?: string
  ): T | null => {
    const update = optimisticStore.get(updateId) as OptimisticUpdate<T> | undefined;
    if (!update) return null;

    const rolledBackUpdate: OptimisticUpdate<T> = {
      ...update,
      status: 'rolled-back',
      error,
    };

    optimisticStore.set(updateId, rolledBackUpdate as OptimisticUpdate);

    if (isMountedRef.current) {
      setUpdates(prev => prev.map(u => u.id === updateId ? rolledBackUpdate : u));
      setMetrics(prev => ({
        ...prev,
        rolledBackUpdates: prev.rolledBackUpdates + 1,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
      }));
    }

    mergedConfig.onRollback?.(rolledBackUpdate);
    return update.originalData;
  }, [mergedConfig]);

  // Fail update
  const failUpdate = useCallback((updateId: string, error: string) => {
    const update = optimisticStore.get(updateId) as OptimisticUpdate<T> | undefined;
    if (!update) return;

    const failedUpdate: OptimisticUpdate<T> = {
      ...update,
      status: 'failed',
      error,
    };

    optimisticStore.set(updateId, failedUpdate as OptimisticUpdate);

    if (isMountedRef.current) {
      setUpdates(prev => prev.map(u => u.id === updateId ? failedUpdate : u));
      setMetrics(prev => ({
        ...prev,
        failedUpdates: prev.failedUpdates + 1,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
      }));
    }
  }, []);

  // Detect conflict
  const detectConflict = useCallback((
    updateId: string,
    serverData: T
  ): OptimisticConflict<T> | null => {
    const update = optimisticStore.get(updateId) as OptimisticUpdate<T> | undefined;
    if (!update) return null;

    // Simple conflict detection: check if server data differs from what we expected
    const serverStr = JSON.stringify(serverData);
    const originalStr = JSON.stringify(update.originalData);
    const optimisticStr = JSON.stringify(update.optimisticData);

    // No conflict if server matches our optimistic update
    if (serverStr === optimisticStr) return null;

    // Conflict if server differs from both original and optimistic
    if (serverStr !== originalStr) {
      const conflict: OptimisticConflict<T> = {
        id: `conflict_${Date.now()}`,
        updateId,
        clientData: update.optimisticData,
        serverData,
        originalData: update.originalData,
        detectedAt: Date.now(),
      };

      if (isMountedRef.current) {
        setConflicts(prev => [...prev, conflict]);
      }

      return conflict;
    }

    return null;
  }, []);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution?: ConflictResolution,
    mergedData?: T
  ): Promise<T | null> => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    const finalResolution = resolution || mergedConfig.conflictResolution;
    let resolvedData: T;

    switch (finalResolution) {
      case 'client-wins':
        resolvedData = conflict.clientData;
        break;
      case 'server-wins':
        resolvedData = conflict.serverData;
        break;
      case 'merge':
        resolvedData = mergedData || mergeData(
          conflict.originalData as Record<string, unknown> | null,
          conflict.clientData as Record<string, unknown>,
          conflict.serverData as Record<string, unknown>
        ) as T;
        break;
      case 'reject':
        // Rollback to original
        resolvedData = conflict.originalData as T;
        break;
      default:
        resolvedData = conflict.serverData;
    }

    // Remove conflict
    if (isMountedRef.current) {
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      setMetrics(prev => ({
        ...prev,
        conflictsResolved: prev.conflictsResolved + 1,
      }));
    }

    return resolvedData;
  }, [conflicts, mergedConfig.conflictResolution]);

  // Execute optimistic mutation
  const mutate = useCallback(async <TInput = unknown>(
    options: OptimisticMutationOptions<T, TInput>
  ): Promise<{ data: T | null; update: OptimisticUpdate<T>; error?: Error }> => {
    const {
      entityId,
      entityType,
      optimisticData,
      mutationFn,
      input,
      onSuccess,
      onError,
      rollbackOnError = true,
      metadata,
    } = options;

    // Save original data snapshot
    const originalData = getSnapshot(entityType, entityId);
    saveSnapshot(entityType, entityId, optimisticData);

    // Create optimistic update
    const update = addUpdate('update', entityId, entityType, optimisticData, originalData, metadata);

    try {
      // Execute actual mutation
      const serverData = await Promise.race([
        mutationFn(input),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Mutation timeout')), mergedConfig.timeout)
        ),
      ]);

      // Check for conflicts
      const conflict = detectConflict(update.id, serverData);
      
      if (conflict) {
        // Handle conflict based on strategy
        if (mergedConfig.onConflict) {
          const resolution = await mergedConfig.onConflict(conflict);
          const resolvedData = await resolveConflict(conflict.id, resolution);
          confirmUpdate(update.id, resolvedData || serverData);
          onSuccess?.(resolvedData || serverData);
          return { data: resolvedData || serverData, update };
        } else {
          const resolvedData = await resolveConflict(conflict.id);
          confirmUpdate(update.id, resolvedData || serverData);
          onSuccess?.(resolvedData || serverData);
          return { data: resolvedData || serverData, update };
        }
      }

      confirmUpdate(update.id, serverData);
      onSuccess?.(serverData);
      return { data: serverData, update };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (rollbackOnError) {
        const rolledBackData = rollbackUpdate(update.id, err.message);
        onError?.(err);
        return { data: rolledBackData, update, error: err };
      } else {
        failUpdate(update.id, err.message);
        onError?.(err);
        return { data: null, update, error: err };
      }
    }
  }, [
    getSnapshot,
    saveSnapshot,
    addUpdate,
    mergedConfig.timeout,
    mergedConfig.onConflict,
    detectConflict,
    resolveConflict,
    confirmUpdate,
    rollbackUpdate,
    failUpdate,
  ]);

  // Optimistic create
  const optimisticCreate = useCallback(async <TInput = unknown>(
    options: Omit<OptimisticMutationOptions<T, TInput>, 'entityId'> & { tempId?: string }
  ): Promise<{ data: T | null; update: OptimisticUpdate<T>; error?: Error }> => {
    const tempId = options.tempId || `temp_${Date.now()}`;
    
    const update = addUpdate('create', tempId, options.entityType, options.optimisticData, null, options.metadata);

    try {
      const serverData = await options.mutationFn(options.input);
      confirmUpdate(update.id, serverData);
      options.onSuccess?.(serverData);
      return { data: serverData, update };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      rollbackUpdate(update.id, err.message);
      options.onError?.(err);
      return { data: null, update, error: err };
    }
  }, [addUpdate, confirmUpdate, rollbackUpdate]);

  // Optimistic delete
  const optimisticDelete = useCallback(async <TInput = unknown>(
    options: OptimisticMutationOptions<T, TInput>
  ): Promise<{ success: boolean; update: OptimisticUpdate<T>; error?: Error }> => {
    const originalData = getSnapshot(options.entityType, options.entityId) || options.optimisticData;
    
    const update = addUpdate('delete', options.entityId, options.entityType, options.optimisticData, originalData, options.metadata);

    try {
      await options.mutationFn(options.input);
      confirmUpdate(update.id);
      options.onSuccess?.(options.optimisticData);
      return { success: true, update };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      rollbackUpdate(update.id, err.message);
      options.onError?.(err);
      return { success: false, update, error: err };
    }
  }, [getSnapshot, addUpdate, confirmUpdate, rollbackUpdate]);

  // Get pending updates for entity
  const getPendingUpdates = useCallback((
    entityType: string,
    entityId?: string
  ): OptimisticUpdate<T>[] => {
    return updates.filter(u => {
      if (u.entityType !== entityType) return false;
      if (entityId && u.entityId !== entityId) return false;
      return u.status === 'pending';
    });
  }, [updates]);

  // Get optimistic value
  const getOptimisticValue = useCallback((
    entityType: string,
    entityId: string,
    currentValue: T
  ): T => {
    const pendingUpdates = getPendingUpdates(entityType, entityId);
    if (pendingUpdates.length === 0) return currentValue;

    // Apply all pending updates in order
    return pendingUpdates.reduce((value, update) => {
      if (update.type === 'delete') return value; // Handle delete separately
      return update.optimisticData;
    }, currentValue);
  }, [getPendingUpdates]);

  // Check if entity has pending updates
  const hasPendingUpdates = useCallback((
    entityType: string,
    entityId: string
  ): boolean => {
    return getPendingUpdates(entityType, entityId).length > 0;
  }, [getPendingUpdates]);

  // Retry failed updates
  const retryFailed = useCallback(async () => {
    const failedUpdates = updates.filter(u => u.status === 'failed' && u.retries < mergedConfig.maxRetries);
    
    for (const update of failedUpdates) {
      const newUpdate = {
        ...update,
        status: 'pending' as const,
        retries: update.retries + 1,
        error: undefined,
      };
      
      optimisticStore.set(update.id, newUpdate as OptimisticUpdate);
      
      if (isMountedRef.current) {
        setUpdates(prev => prev.map(u => u.id === update.id ? newUpdate : u));
      }
    }
  }, [updates, mergedConfig.maxRetries]);

  // Clear completed updates
  const clearCompleted = useCallback(() => {
    const completedIds = updates
      .filter(u => u.status === 'confirmed' || u.status === 'rolled-back')
      .map(u => u.id);
    
    completedIds.forEach(id => optimisticStore.delete(id));
    
    if (isMountedRef.current) {
      setUpdates(prev => prev.filter(u => !completedIds.includes(u.id)));
    }
  }, [updates]);

  return {
    // State
    updates,
    conflicts,
    isProcessing,
    metrics,

    // Mutations
    mutate,
    optimisticCreate,
    optimisticDelete,

    // Update management
    confirmUpdate,
    rollbackUpdate,
    retryFailed,
    clearCompleted,

    // Conflict resolution
    resolveConflict,

    // Query helpers
    getPendingUpdates,
    getOptimisticValue,
    hasPendingUpdates,

    // Snapshot management
    saveSnapshot,
    getSnapshot,
    clearSnapshot,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * useKBOptimisticList - Optimistic updates for list operations
 */
export function useKBOptimisticList<T extends { id: string }>(
  entityType: string,
  initialItems: T[] = []
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const { mutate, optimisticCreate, optimisticDelete, getPendingUpdates } = useKBOptimistic<T>();

  const addItem = useCallback(async (
    item: T,
    mutationFn: MutationFn<T, T>
  ) => {
    // Optimistically add to list
    setItems(prev => [...prev, item]);

    const result = await optimisticCreate({
      entityType,
      optimisticData: item,
      mutationFn,
      input: item,
      tempId: item.id,
      onError: () => {
        // Remove on error
        setItems(prev => prev.filter(i => i.id !== item.id));
      },
      onSuccess: (serverItem) => {
        // Update with server ID if different
        setItems(prev => prev.map(i => i.id === item.id ? serverItem : i));
      },
    });

    return result;
  }, [entityType, optimisticCreate]);

  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<T>,
    mutationFn: MutationFn<T, Partial<T>>
  ) => {
    const originalItem = items.find(i => i.id === itemId);
    if (!originalItem) return null;

    const optimisticItem = { ...originalItem, ...updates };

    // Optimistically update
    setItems(prev => prev.map(i => i.id === itemId ? optimisticItem : i));

    const result = await mutate({
      entityId: itemId,
      entityType,
      optimisticData: optimisticItem,
      mutationFn,
      input: updates,
      onError: () => {
        // Restore original on error
        setItems(prev => prev.map(i => i.id === itemId ? originalItem : i));
      },
    });

    return result;
  }, [entityType, items, mutate]);

  const removeItem = useCallback(async (
    itemId: string,
    mutationFn: MutationFn<T, string>
  ) => {
    const originalItem = items.find(i => i.id === itemId);
    if (!originalItem) return null;

    // Optimistically remove
    setItems(prev => prev.filter(i => i.id !== itemId));

    const result = await optimisticDelete({
      entityId: itemId,
      entityType,
      optimisticData: originalItem,
      mutationFn,
      input: itemId,
      onError: () => {
        // Restore on error
        setItems(prev => [...prev, originalItem]);
      },
    });

    return result;
  }, [entityType, items, optimisticDelete]);

  const hasPending = useCallback((itemId: string) => {
    return getPendingUpdates(entityType, itemId).length > 0;
  }, [entityType, getPendingUpdates]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    hasPending,
  };
}

/**
 * useKBOptimisticForm - Optimistic form submission
 */
export function useKBOptimisticForm<T, TInput = T>(
  entityType: string,
  entityId: string,
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutate, hasPendingUpdates } = useKBOptimistic<T>();

  const submit = useCallback(async (
    formData: TInput,
    mutationFn: MutationFn<T, TInput>
  ) => {
    setIsSubmitting(true);

    const result = await mutate({
      entityId,
      entityType,
      optimisticData: formData as unknown as T,
      mutationFn,
      input: formData,
      onSuccess: (serverData) => {
        setData(serverData);
      },
    });

    setIsSubmitting(false);
    return result;
  }, [entityId, entityType, mutate]);

  const isPending = hasPendingUpdates(entityType, entityId);

  return {
    data,
    setData,
    submit,
    isSubmitting,
    isPending,
  };
}

export default useKBOptimistic;
