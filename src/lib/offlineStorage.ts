// Offline Storage with IndexedDB for banking CRM
// Provides persistent storage for companies, visits, goals, and pending operations

const DB_NAME = 'CreandCRM_OfflineDB';
const DB_VERSION = 1;

interface OfflineStore {
  companies: 'companies';
  visits: 'visits';
  goals: 'goals';
  visitSheets: 'visitSheets';
  pendingOperations: 'pendingOperations';
  syncStatus: 'syncStatus';
}

const STORES: OfflineStore = {
  companies: 'companies',
  visits: 'visits',
  goals: 'goals',
  visitSheets: 'visitSheets',
  pendingOperations: 'pendingOperations',
  syncStatus: 'syncStatus',
};

export interface PendingOperation {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface SyncStatus {
  lastSyncTime: number;
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
}

let dbInstance: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initOfflineDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[OfflineDB] Database opened successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('[OfflineDB] Upgrading database...');

      // Companies store with indexes
      if (!db.objectStoreNames.contains(STORES.companies)) {
        const companiesStore = db.createObjectStore(STORES.companies, { keyPath: 'id' });
        companiesStore.createIndex('gestor_id', 'gestor_id', { unique: false });
        companiesStore.createIndex('name', 'name', { unique: false });
        companiesStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Visits store
      if (!db.objectStoreNames.contains(STORES.visits)) {
        const visitsStore = db.createObjectStore(STORES.visits, { keyPath: 'id' });
        visitsStore.createIndex('company_id', 'company_id', { unique: false });
        visitsStore.createIndex('gestor_id', 'gestor_id', { unique: false });
        visitsStore.createIndex('visit_date', 'visit_date', { unique: false });
      }

      // Goals store
      if (!db.objectStoreNames.contains(STORES.goals)) {
        const goalsStore = db.createObjectStore(STORES.goals, { keyPath: 'id' });
        goalsStore.createIndex('target_gestor_id', 'target_gestor_id', { unique: false });
        goalsStore.createIndex('status', 'status', { unique: false });
      }

      // Visit sheets store
      if (!db.objectStoreNames.contains(STORES.visitSheets)) {
        const sheetsStore = db.createObjectStore(STORES.visitSheets, { keyPath: 'id' });
        sheetsStore.createIndex('company_id', 'company_id', { unique: false });
        sheetsStore.createIndex('gestor_id', 'gestor_id', { unique: false });
      }

      // Pending operations queue
      if (!db.objectStoreNames.contains(STORES.pendingOperations)) {
        const pendingStore = db.createObjectStore(STORES.pendingOperations, { keyPath: 'id' });
        pendingStore.createIndex('status', 'status', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('table', 'table', { unique: false });
      }

      // Sync status store
      if (!db.objectStoreNames.contains(STORES.syncStatus)) {
        db.createObjectStore(STORES.syncStatus, { keyPath: 'key' });
      }

      console.log('[OfflineDB] Database upgrade complete');
    };
  });
}

// Generic CRUD operations
async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const db = await initOfflineDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

export async function saveToStore<T extends { id: string }>(storeName: string, data: T): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveBulkToStore<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
  const db = await initOfflineDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    items.forEach(item => store.put(item));
    transaction.oncomplete = () => {
      console.log(`[OfflineDB] Saved ${items.length} items to ${storeName}`);
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getFromStore<T>(storeName: string, id: string): Promise<T | undefined> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
  const store = await getStore(storeName);
  const index = store.index(indexName);
  return new Promise((resolve, reject) => {
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Pending Operations Queue
export async function addPendingOperation(
  type: PendingOperation['type'],
  table: string,
  data: Record<string, unknown>
): Promise<string> {
  const operation: PendingOperation = {
    id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    table,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await saveToStore(STORES.pendingOperations, operation);
  console.log(`[OfflineDB] Added pending ${type} operation for ${table}:`, operation.id);
  
  // Update pending count
  await updateSyncStatus({ pendingCount: await getPendingOperationsCount() });
  
  return operation.id;
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  const operations = await getAllFromStore<PendingOperation>(STORES.pendingOperations);
  return operations
    .filter(op => op.status === 'pending' || op.status === 'failed')
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getPendingOperationsCount(): Promise<number> {
  const operations = await getPendingOperations();
  return operations.length;
}

export async function updatePendingOperation(id: string, updates: Partial<PendingOperation>): Promise<void> {
  const operation = await getFromStore<PendingOperation>(STORES.pendingOperations, id);
  if (operation) {
    await saveToStore(STORES.pendingOperations, { ...operation, ...updates });
  }
}

export async function removePendingOperation(id: string): Promise<void> {
  await deleteFromStore(STORES.pendingOperations, id);
  await updateSyncStatus({ pendingCount: await getPendingOperationsCount() });
}

// Sync Status Management
interface SyncStatusRecord extends SyncStatus {
  key: string;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const status = await getFromStore<SyncStatusRecord>(STORES.syncStatus, 'current');
    return status || {
      lastSyncTime: 0,
      pendingCount: 0,
      isOnline: navigator.onLine,
      isSyncing: false,
    };
  } catch {
    return {
      lastSyncTime: 0,
      pendingCount: 0,
      isOnline: navigator.onLine,
      isSyncing: false,
    };
  }
}

export async function updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
  const current = await getSyncStatus();
  const record: SyncStatusRecord = {
    key: 'current',
    ...current,
    ...updates,
  };
  const store = await getStore(STORES.syncStatus, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Specific store helpers
export const offlineCompanies = {
  save: (company: { id: string; [key: string]: unknown }) => saveToStore(STORES.companies, company),
  saveBulk: (companies: Array<{ id: string; [key: string]: unknown }>) => saveBulkToStore(STORES.companies, companies),
  get: (id: string) => getFromStore(STORES.companies, id),
  getAll: () => getAllFromStore(STORES.companies),
  getByGestor: (gestorId: string) => getByIndex(STORES.companies, 'gestor_id', gestorId),
  delete: (id: string) => deleteFromStore(STORES.companies, id),
  clear: () => clearStore(STORES.companies),
};

export const offlineVisits = {
  save: (visit: { id: string; [key: string]: unknown }) => saveToStore(STORES.visits, visit),
  saveBulk: (visits: Array<{ id: string; [key: string]: unknown }>) => saveBulkToStore(STORES.visits, visits),
  get: (id: string) => getFromStore(STORES.visits, id),
  getAll: () => getAllFromStore(STORES.visits),
  getByCompany: (companyId: string) => getByIndex(STORES.visits, 'company_id', companyId),
  getByGestor: (gestorId: string) => getByIndex(STORES.visits, 'gestor_id', gestorId),
  delete: (id: string) => deleteFromStore(STORES.visits, id),
  clear: () => clearStore(STORES.visits),
};

export const offlineGoals = {
  save: (goal: { id: string; [key: string]: unknown }) => saveToStore(STORES.goals, goal),
  saveBulk: (goals: Array<{ id: string; [key: string]: unknown }>) => saveBulkToStore(STORES.goals, goals),
  get: (id: string) => getFromStore(STORES.goals, id),
  getAll: () => getAllFromStore(STORES.goals),
  getByGestor: (gestorId: string) => getByIndex(STORES.goals, 'target_gestor_id', gestorId),
  delete: (id: string) => deleteFromStore(STORES.goals, id),
  clear: () => clearStore(STORES.goals),
};

export const offlineVisitSheets = {
  save: (sheet: { id: string; [key: string]: unknown }) => saveToStore(STORES.visitSheets, sheet),
  saveBulk: (sheets: Array<{ id: string; [key: string]: unknown }>) => saveBulkToStore(STORES.visitSheets, sheets),
  get: (id: string) => getFromStore(STORES.visitSheets, id),
  getAll: () => getAllFromStore(STORES.visitSheets),
  getByCompany: (companyId: string) => getByIndex(STORES.visitSheets, 'company_id', companyId),
  getByGestor: (gestorId: string) => getByIndex(STORES.visitSheets, 'gestor_id', gestorId),
  delete: (id: string) => deleteFromStore(STORES.visitSheets, id),
  clear: () => clearStore(STORES.visitSheets),
};

// Export store names for external use
export { STORES };
