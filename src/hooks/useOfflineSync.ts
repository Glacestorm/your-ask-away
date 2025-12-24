// useOfflineSync Hook - Complete offline sync management for banking CRM
// Handles IndexedDB caching, operation queuing, and background synchronization

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  initOfflineDB,
  offlineCompanies,
  offlineVisits,
  offlineGoals,
  offlineVisitSheets,
  getPendingOperations,
  addPendingOperation,
  updatePendingOperation,
  removePendingOperation,
  getSyncStatus,
  updateSyncStatus,
  SyncStatus,
  PendingOperation,
} from '@/lib/offlineStorage';

// === ERROR TIPADO KB ===
export interface OfflineSyncError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface UseOfflineSyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // ms
  maxRetries?: number;
}

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus | null;
  pendingCount: number;
  lastSyncTime: Date | null;
  
  // Manual sync
  syncNow: () => Promise<void>;
  
  // Cache operations
  cacheCompanies: (userId: string) => Promise<void>;
  cacheVisits: (userId: string) => Promise<void>;
  cacheGoals: (userId: string) => Promise<void>;
  cacheVisitSheets: (userId: string) => Promise<void>;
  cacheAllData: (userId: string) => Promise<void>;
  
  // Offline operations
  queueOperation: (type: 'INSERT' | 'UPDATE' | 'DELETE', table: string, data: Record<string, unknown>) => Promise<string>;
  
  // Data access
  getOfflineCompanies: (gestorId?: string) => Promise<unknown[]>;
  getOfflineVisits: (gestorId?: string) => Promise<unknown[]>;
  getOfflineGoals: (gestorId?: string) => Promise<unknown[]>;
  
  // Clear cache
  clearOfflineCache: () => Promise<void>;
  // KB additions
  error: OfflineSyncError | null;
  clearError: () => void;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}): UseOfflineSyncReturn {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    maxRetries = 3,
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  // === ESTADO KB ===
  const [error, setError] = useState<OfflineSyncError | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Initialize database and load status
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;
      
      try {
        await initOfflineDB();
        const status = await getSyncStatus();
        setSyncStatus(status);
        setPendingCount(status.pendingCount);
        if (status.lastSyncTime > 0) {
          setLastSyncTime(new Date(status.lastSyncTime));
        }
        isInitialized.current = true;
        console.log('[OfflineSync] Initialized with status:', status);
      } catch (error) {
        console.error('[OfflineSync] Initialization failed:', error);
      }
    };

    init();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await updateSyncStatus({ isOnline: true });
      toast.success('Connexió restablerta', {
        description: 'Sincronitzant canvis pendents...',
      });
      
      // Auto-sync when coming back online
      if (autoSync) {
        syncNow();
      }
      
      // Trigger background sync if available
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-offline-operations');
          }
        }
      } catch (syncError) {
        console.log('[OfflineSync] Background sync not available:', syncError);
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      await updateSyncStatus({ isOnline: false });
      toast.warning('Mode offline', {
        description: 'Els canvis es guardaran localment',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync]);

  // Auto-sync interval
  useEffect(() => {
    if (autoSync && isOnline) {
      syncIntervalRef.current = setInterval(() => {
        syncNow();
      }, syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, isOnline, syncInterval]);

  // Sync pending operations to server
  const syncPendingOperations = useCallback(async (): Promise<number> => {
    const pending = await getPendingOperations();
    if (pending.length === 0) return 0;

    let successCount = 0;
    console.log(`[OfflineSync] Processing ${pending.length} pending operations`);

    for (const operation of pending) {
      if (operation.retryCount >= maxRetries) {
        console.warn(`[OfflineSync] Max retries reached for operation:`, operation.id);
        await updatePendingOperation(operation.id, { status: 'failed', error: 'Max retries exceeded' });
        continue;
      }

      try {
        await updatePendingOperation(operation.id, { status: 'syncing' });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: { error: Error | null } | undefined;
        const tableData = operation.data as Record<string, unknown>;
        
        switch (operation.type) {
          case 'INSERT':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await (supabase.from(operation.table as any) as any).insert(tableData);
            break;
          case 'UPDATE':
            if (tableData.id) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              result = await (supabase.from(operation.table as any) as any).update(tableData).eq('id', tableData.id as string);
            }
            break;
          case 'DELETE':
            if (tableData.id) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              result = await (supabase.from(operation.table as any) as any).delete().eq('id', tableData.id as string);
            }
            break;
        }

        if (result?.error) {
          throw result.error;
        }

        await removePendingOperation(operation.id);
        successCount++;
        console.log(`[OfflineSync] Successfully synced operation:`, operation.id);
      } catch (error) {
        console.error(`[OfflineSync] Failed to sync operation:`, operation.id, error);
        await updatePendingOperation(operation.id, {
          status: 'failed',
          retryCount: operation.retryCount + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return successCount;
  }, [maxRetries]);

  // Main sync function
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    await updateSyncStatus({ isSyncing: true });

    try {
      const syncedCount = await syncPendingOperations();
      
      const newPendingCount = (await getPendingOperations()).length;
      setPendingCount(newPendingCount);
      
      const now = Date.now();
      setLastSyncTime(new Date(now));
      
      await updateSyncStatus({
        lastSyncTime: now,
        pendingCount: newPendingCount,
        isSyncing: false,
      });

      const status = await getSyncStatus();
      setSyncStatus(status);

      if (syncedCount > 0) {
        toast.success(`Sincronització completada`, {
          description: `${syncedCount} operacions sincronitzades`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de sincronització';
      setError({
        code: 'SYNC_ERROR',
        message,
        details: { originalError: String(err) }
      });
      console.error('[OfflineSync] Sync failed:', err);
      toast.error('Error de sincronització', {
        description: 'Es reintentarà automàticament',
      });
    } finally {
      setIsSyncing(false);
      await updateSyncStatus({ isSyncing: false });
    }
  }, [isOnline, isSyncing, syncPendingOperations]);

  // Cache companies from server
  const cacheCompanies = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('gestor_id', userId)
        .order('updated_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      if (data && data.length > 0) {
        await offlineCompanies.saveBulk(data as Array<{ id: string; [key: string]: unknown }>);
        console.log(`[OfflineSync] Cached ${data.length} companies`);
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to cache companies:', error);
    }
  }, []);

  // Cache visits from server
  const cacheVisits = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('gestor_id', userId)
        .order('visit_date', { ascending: false })
        .limit(200);

      if (error) throw error;

      if (data && data.length > 0) {
        await offlineVisits.saveBulk(data as Array<{ id: string; [key: string]: unknown }>);
        console.log(`[OfflineSync] Cached ${data.length} visits`);
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to cache visits:', error);
    }
  }, []);

  // Cache goals from server
  const cacheGoals = useCallback(async (userId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('goals') as any)
        .select('*')
        .eq('target_gestor_id', userId)
        .eq('active', true)
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        await offlineGoals.saveBulk(data as Array<{ id: string; [key: string]: unknown }>);
        console.log(`[OfflineSync] Cached ${data.length} goals`);
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to cache goals:', error);
    }
  }, []);

  // Cache visit sheets from server
  const cacheVisitSheets = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('visit_sheets')
        .select('*')
        .eq('gestor_id', userId)
        .order('visit_date', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        await offlineVisitSheets.saveBulk(data as Array<{ id: string; [key: string]: unknown }>);
        console.log(`[OfflineSync] Cached ${data.length} visit sheets`);
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to cache visit sheets:', error);
    }
  }, []);

  // Cache all data
  const cacheAllData = useCallback(async (userId: string) => {
    console.log('[OfflineSync] Caching all data for user:', userId);
    toast.info('Descarregant dades per mode offline...', { duration: 3000 });

    await Promise.all([
      cacheCompanies(userId),
      cacheVisits(userId),
      cacheGoals(userId),
      cacheVisitSheets(userId),
    ]);

    toast.success('Dades descarregades', {
      description: 'Disponibles en mode offline',
    });
  }, [cacheCompanies, cacheVisits, cacheGoals, cacheVisitSheets]);

  // Queue an operation for later sync
  const queueOperation = useCallback(async (
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    data: Record<string, unknown>
  ): Promise<string> => {
    const operationId = await addPendingOperation(type, table, data);
    setPendingCount(prev => prev + 1);
    
    // If online, try to sync immediately
    if (isOnline) {
      syncNow();
    }
    
    return operationId;
  }, [isOnline, syncNow]);

  // Get offline companies
  const getOfflineCompanies = useCallback(async (gestorId?: string) => {
    if (gestorId) {
      return offlineCompanies.getByGestor(gestorId);
    }
    return offlineCompanies.getAll();
  }, []);

  // Get offline visits
  const getOfflineVisits = useCallback(async (gestorId?: string) => {
    if (gestorId) {
      return offlineVisits.getByGestor(gestorId);
    }
    return offlineVisits.getAll();
  }, []);

  // Get offline goals
  const getOfflineGoals = useCallback(async (gestorId?: string) => {
    if (gestorId) {
      return offlineGoals.getByGestor(gestorId);
    }
    return offlineGoals.getAll();
  }, []);

  // Clear all offline cache
  const clearOfflineCache = useCallback(async () => {
    await Promise.all([
      offlineCompanies.clear(),
      offlineVisits.clear(),
      offlineGoals.clear(),
      offlineVisitSheets.clear(),
    ]);
    toast.info('Cache offline esborrada');
  }, []);

  return {
    isOnline,
    isSyncing,
    syncStatus,
    pendingCount,
    lastSyncTime,
    syncNow,
    cacheCompanies,
    cacheVisits,
    cacheGoals,
    cacheVisitSheets,
    cacheAllData,
    queueOperation,
    getOfflineCompanies,
    getOfflineVisits,
    getOfflineGoals,
    clearOfflineCache,
    // === KB ADDITIONS ===
    error,
    clearError
  };
}
