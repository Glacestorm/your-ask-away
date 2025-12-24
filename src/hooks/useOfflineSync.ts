// useOfflineSync Hook - Complete offline sync management for banking CRM
// Handles IndexedDB caching, operation queuing, and background synchronization

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, collectTelemetry } from '@/hooks/core/useKBBase';
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
  
  // KB 2.0 additions
  status: KBStatus;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isRetrying: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  lastSuccess: Date | null;
  retryCount: number;
  clearError: () => void;
  reset: () => void;
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
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isRetrying = status === 'retrying';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Initialize database and load status
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;
      
      try {
        await initOfflineDB();
        const statusData = await getSyncStatus();
        setSyncStatus(statusData);
        setPendingCount(statusData.pendingCount);
        if (statusData.lastSyncTime > 0) {
          setLastSyncTime(new Date(statusData.lastSyncTime));
        }
        isInitialized.current = true;
        setStatus('success');
        setLastSuccess(new Date());
        console.log('[OfflineSync] Initialized with status:', statusData);
      } catch (err) {
        console.error('[OfflineSync] Initialization failed:', err);
        const kbError = createKBError('INIT_ERROR', 'Error al inicializar sincronización offline');
        setError(kbError);
        setStatus('error');
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
      } catch (err) {
        console.error(`[OfflineSync] Failed to sync operation:`, operation.id, err);
        await updatePendingOperation(operation.id, {
          status: 'failed',
          retryCount: operation.retryCount + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return successCount;
  }, [maxRetries]);

  // Main sync function
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const startTime = new Date();
    setIsSyncing(true);
    setStatus('loading');
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

      const statusData = await getSyncStatus();
      setSyncStatus(statusData);
      
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());

      collectTelemetry({
        hookName: 'useOfflineSync',
        operationName: 'syncNow',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount,
        metadata: { syncedCount }
      });

      if (syncedCount > 0) {
        toast.success(`Sincronització completada`, {
          description: `${syncedCount} operacions sincronitzades`,
        });
      }
    } catch (err) {
      const kbError = createKBError('SYNC_ERROR', 'Error de sincronització', { originalError: err });
      setError(kbError);
      setStatus('error');
      
      collectTelemetry({
        hookName: 'useOfflineSync',
        operationName: 'syncNow',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount
      });
      
      console.error('[OfflineSync] Sync failed:', err);
      toast.error('Error de sincronització', {
        description: 'Es reintentarà automàticament',
      });
    } finally {
      setIsSyncing(false);
      await updateSyncStatus({ isSyncing: false });
    }
  }, [isOnline, isSyncing, syncPendingOperations, retryCount]);

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
    } catch (err) {
      console.error('[OfflineSync] Failed to cache companies:', err);
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
    } catch (err) {
      console.error('[OfflineSync] Failed to cache visits:', err);
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
    } catch (err) {
      console.error('[OfflineSync] Failed to cache goals:', err);
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
    } catch (err) {
      console.error('[OfflineSync] Failed to cache visit sheets:', err);
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
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isRetrying,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
