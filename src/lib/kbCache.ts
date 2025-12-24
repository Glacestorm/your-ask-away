/**
 * KB 2.5 - Smart Cache Layer
 * Stale-while-revalidate, offline support, and intelligent synchronization
 */

import { KBCacheConfig, KBCacheEntry, KB_DEFAULT_CACHE_CONFIG } from '@/hooks/core/types';

// === IN-MEMORY CACHE ===
const memoryCache = new Map<string, KBCacheEntry<unknown>>();

// === CACHE VERSION (for invalidation) ===
let cacheVersion = 1;

export function incrementCacheVersion(): void {
  cacheVersion++;
}

export function getCacheVersion(): number {
  return cacheVersion;
}

// === CACHE KEY GENERATION ===
export function generateCacheKey(
  hookName: string,
  operationName: string,
  params?: unknown
): string {
  const base = `${hookName}:${operationName}`;
  if (!params) return base;
  
  try {
    const paramStr = JSON.stringify(params, Object.keys(params as object).sort());
    return `${base}:${hashString(paramStr)}`;
  } catch {
    return base;
  }
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// === CACHE OPERATIONS ===
export function getCacheEntry<T>(key: string): KBCacheEntry<T> | null {
  // Check memory cache first
  const memEntry = memoryCache.get(key) as KBCacheEntry<T> | undefined;
  if (memEntry) {
    // Check if GC'd
    if (Date.now() - memEntry.timestamp > memEntry.gcTime) {
      memoryCache.delete(key);
      return null;
    }
    // Check version
    if (memEntry.version !== cacheVersion) {
      memoryCache.delete(key);
      return null;
    }
    return memEntry;
  }
  return null;
}

export function setCacheEntry<T>(
  key: string,
  data: T,
  config: Partial<KBCacheConfig> = {}
): KBCacheEntry<T> {
  const mergedConfig = { ...KB_DEFAULT_CACHE_CONFIG, ...config };
  
  const entry: KBCacheEntry<T> = {
    key,
    data,
    timestamp: Date.now(),
    staleTime: mergedConfig.staleTime,
    gcTime: mergedConfig.gcTime,
    version: cacheVersion,
  };

  memoryCache.set(key, entry);

  // Persist to IndexedDB if configured
  if (mergedConfig.persist) {
    persistToStorage(key, entry, mergedConfig.storagePrefix).catch(console.error);
  }

  return entry;
}

export function invalidateCacheEntry(key: string): void {
  memoryCache.delete(key);
  removeFromStorage(key, KB_DEFAULT_CACHE_CONFIG.storagePrefix).catch(console.error);
}

export function invalidateCacheByPrefix(prefix: string): void {
  const keysToDelete: string[] = [];
  memoryCache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => memoryCache.delete(key));
}

export function clearCache(): void {
  memoryCache.clear();
  incrementCacheVersion();
}

// === STALE CHECKING ===
export function isCacheStale<T>(entry: KBCacheEntry<T> | null): boolean {
  if (!entry) return true;
  return Date.now() - entry.timestamp > entry.staleTime;
}

export function isCacheValid<T>(entry: KBCacheEntry<T> | null): boolean {
  if (!entry) return false;
  if (entry.version !== cacheVersion) return false;
  if (Date.now() - entry.timestamp > entry.gcTime) return false;
  return true;
}

// === STALE-WHILE-REVALIDATE ===
export interface SWRResult<T> {
  data: T | null;
  isStale: boolean;
  isFromCache: boolean;
  revalidate: () => Promise<T>;
}

export async function getWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: Partial<KBCacheConfig> = {}
): Promise<SWRResult<T>> {
  const mergedConfig = { ...KB_DEFAULT_CACHE_CONFIG, ...config };
  const entry = getCacheEntry<T>(key);
  
  const isStale = isCacheStale(entry);
  const hasValidCache = isCacheValid(entry);

  const revalidate = async (): Promise<T> => {
    const data = await fetcher();
    setCacheEntry(key, data, mergedConfig);
    return data;
  };

  // Return cached data and revalidate in background if stale
  if (hasValidCache && entry) {
    if (isStale && mergedConfig.staleWhileRevalidate) {
      // Fire and forget revalidation
      revalidate().catch(console.error);
    }
    
    return {
      data: entry.data,
      isStale,
      isFromCache: true,
      revalidate,
    };
  }

  // No valid cache, fetch fresh data
  const data = await revalidate();
  return {
    data,
    isStale: false,
    isFromCache: false,
    revalidate,
  };
}

// === INDEXEDDB PERSISTENCE ===
const DB_NAME = 'kb_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache_entries';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

async function persistToStorage<T>(
  key: string,
  entry: KBCacheEntry<T>,
  prefix: string
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...entry, key: `${prefix}${key}` });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[kbCache] Failed to persist to storage:', error);
  }
}

async function removeFromStorage(key: string, prefix: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(`${prefix}${key}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[kbCache] Failed to remove from storage:', error);
  }
}

export async function loadFromStorage<T>(
  key: string,
  prefix: string = KB_DEFAULT_CACHE_CONFIG.storagePrefix
): Promise<KBCacheEntry<T> | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(`${prefix}${key}`);
      request.onsuccess = () => {
        const entry = request.result as KBCacheEntry<T> | undefined;
        if (entry && isCacheValid(entry)) {
          // Sync to memory cache
          memoryCache.set(key, entry);
          resolve(entry);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[kbCache] Failed to load from storage:', error);
    return null;
  }
}

// === CACHE SYNC QUEUE (Offline Support) ===
interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  key: string;
  data?: unknown;
  timestamp: number;
  retries: number;
}

const syncQueue: SyncQueueItem[] = [];
const MAX_RETRIES = 3;

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): void {
  syncQueue.push({
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  });
}

export function getSyncQueue(): SyncQueueItem[] {
  return [...syncQueue];
}

export function clearSyncQueue(): void {
  syncQueue.length = 0;
}

export async function processSyncQueue(
  processor: (item: SyncQueueItem) => Promise<void>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  const itemsToProcess = [...syncQueue];
  
  for (const item of itemsToProcess) {
    try {
      await processor(item);
      const index = syncQueue.findIndex(i => i.id === item.id);
      if (index !== -1) {
        syncQueue.splice(index, 1);
      }
      success++;
    } catch (error) {
      item.retries++;
      if (item.retries >= MAX_RETRIES) {
        const index = syncQueue.findIndex(i => i.id === item.id);
        if (index !== -1) {
          syncQueue.splice(index, 1);
        }
      }
      failed++;
    }
  }

  return { success, failed };
}

// === ONLINE/OFFLINE DETECTION ===
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

export function getOnlineStatus(): boolean {
  return isOnline;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    // Auto-process sync queue when back online
    processSyncQueue(async () => {}).catch(console.error);
  });

  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

// === CACHE STATISTICS ===
export function getCacheStats(): {
  entries: number;
  staleEntries: number;
  totalSize: number;
  syncQueueSize: number;
} {
  let staleCount = 0;
  let totalSize = 0;

  memoryCache.forEach((entry) => {
    if (isCacheStale(entry as KBCacheEntry<unknown>)) {
      staleCount++;
    }
    totalSize += JSON.stringify(entry).length;
  });

  return {
    entries: memoryCache.size,
    staleEntries: staleCount,
    totalSize,
    syncQueueSize: syncQueue.length,
  };
}

// === GARBAGE COLLECTION ===
export function runGC(): number {
  const now = Date.now();
  const keysToDelete: string[] = [];

  memoryCache.forEach((entry, key) => {
    const typedEntry = entry as KBCacheEntry<unknown>;
    if (now - typedEntry.timestamp > typedEntry.gcTime || typedEntry.version !== cacheVersion) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => memoryCache.delete(key));
  return keysToDelete.length;
}

// Auto GC every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(runGC, 5 * 60 * 1000);
}
