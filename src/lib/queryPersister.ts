/**
 * React Query Persist Client Configuration
 * Sistema de caché inteligente con persistencia offline y sincronización automática
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

// Keys for data that should be persisted offline
export const PERSISTENT_QUERY_KEYS = {
  SECTORS: ['sectors'],
  TESTIMONIALS: ['testimonials'],
  PRODUCTS: ['products'],
  COMPANIES: ['companies'],
  USER_PROFILE: ['user-profile'],
  APP_MODULES: ['app-modules'],
} as const;

// Cache duration configuration
export const CACHE_DURATIONS = {
  SECTORS: 24 * 60 * 60 * 1000, // 24 hours
  TESTIMONIALS: 12 * 60 * 60 * 1000, // 12 hours
  PRODUCTS: 6 * 60 * 60 * 1000, // 6 hours
  USER_DATA: 30 * 60 * 1000, // 30 minutes
  REAL_TIME: 1 * 60 * 1000, // 1 minute
} as const;

// Create the persister using localStorage
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'OBELIXIA_QUERY_CACHE',
  throttleTime: 1000,
  serialize: (data) => {
    try {
      return JSON.stringify(data);
    } catch (e) {
      console.warn('[QueryPersister] Failed to serialize cache:', e);
      return '';
    }
  },
  deserialize: (data) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('[QueryPersister] Failed to deserialize cache:', e);
      return {};
    }
  },
});

// Create IndexedDB persister for larger data
const IDB_NAME = 'ObelixiaQueryCache';
const IDB_STORE = 'queryCache';
const IDB_VERSION = 1;

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' });
      }
    };
  });
}

export async function saveToIDB(key: string, data: unknown): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    
    store.put({
      key,
      data,
      timestamp: Date.now(),
    });
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('[QueryPersister] IDB save failed:', e);
  }
}

export async function loadFromIDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.data as T);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('[QueryPersister] IDB load failed:', e);
    return null;
  }
}

export async function clearIDBCache(): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('[QueryPersister] IDB clear failed:', e);
  }
}

/**
 * Setup query persistence for a QueryClient
 */
export function setupQueryPersistence(queryClient: QueryClient): void {
  persistQueryClient({
    queryClient: queryClient as any,
    persister: localStoragePersister,
    maxAge: 24 * 60 * 60 * 1000,
    buster: 'v1',
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const queryKey = query.queryKey;
        if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
        
        const persistentKeys = Object.values(PERSISTENT_QUERY_KEYS).map(k => k[0] as string);
        return persistentKeys.includes(String(queryKey[0]));
      },
    },
  });
}

/**
 * Create an optimized QueryClient with persistence settings
 */
export function createPersistentQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 1,
        networkMode: 'offlineFirst',
      },
    },
  });

  if (typeof window !== 'undefined') {
    setupQueryPersistence(queryClient);
  }

  return queryClient;
}

/**
 * Hook options for persistent queries
 */
export function getPersistentQueryOptions(type: keyof typeof CACHE_DURATIONS) {
  return {
    staleTime: CACHE_DURATIONS[type],
    gcTime: CACHE_DURATIONS[type] * 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  };
}

/**
 * Sync status tracker
 */
interface SyncStatus {
  lastSync: number | null;
  pendingOperations: number;
  isOnline: boolean;
}

let syncStatus: SyncStatus = {
  lastSync: null,
  pendingOperations: 0,
  isOnline: navigator.onLine,
};

// Track online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncStatus.isOnline = true;
    console.log('[QueryPersister] Back online, triggering sync...');
    // Trigger revalidation of stale queries
    window.dispatchEvent(new CustomEvent('cache-sync-needed'));
  });

  window.addEventListener('offline', () => {
    syncStatus.isOnline = false;
    console.log('[QueryPersister] Offline mode activated');
  });
}

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

export function updateLastSync(): void {
  syncStatus.lastSync = Date.now();
}
