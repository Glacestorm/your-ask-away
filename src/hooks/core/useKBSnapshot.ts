/**
 * KB 4.5 - Snapshot & Restore Hooks
 * 
 * Hooks for state snapshots, serialization, and restoration.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBSnapshot<T = unknown> {
  id: string;
  name?: string;
  data: T;
  timestamp: number;
  version: number;
  metadata?: Record<string, unknown>;
  checksum?: string;
}

export interface KBSnapshotConfig {
  /** Maximum snapshots to keep */
  maxSnapshots?: number;
  /** Auto-snapshot interval (0 = disabled) */
  autoSnapshotInterval?: number;
  /** Enable compression */
  compress?: boolean;
  /** Enable encryption */
  encrypt?: boolean;
  /** Encryption key (required if encrypt is true) */
  encryptionKey?: string;
  /** Storage backend */
  storage?: 'memory' | 'localStorage' | 'indexedDB';
  /** Storage key prefix */
  storageKey?: string;
  /** Version number for migrations */
  version?: number;
  /** Migration functions */
  migrations?: Record<number, (data: unknown) => unknown>;
}

export interface KBSnapshotState<T> {
  current: T;
  snapshots: KBSnapshot<T>[];
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  lastSnapshotId: string | null;
}

export interface KBSnapshotReturn<T> {
  state: KBSnapshotState<T>;
  createSnapshot: (name?: string, metadata?: Record<string, unknown>) => Promise<string>;
  restoreSnapshot: (id: string) => Promise<boolean>;
  deleteSnapshot: (id: string) => Promise<boolean>;
  exportSnapshot: (id: string) => Promise<string>;
  importSnapshot: (data: string) => Promise<string>;
  update: (value: T | ((prev: T) => T)) => void;
  compare: (id1: string, id2: string) => KBSnapshotDiff<T> | null;
  listSnapshots: () => KBSnapshot<T>[];
  getSnapshot: (id: string) => KBSnapshot<T> | undefined;
}

export interface KBSnapshotDiff<T> {
  added: Partial<T>;
  removed: Partial<T>;
  changed: Partial<T>;
  unchanged: Partial<T>;
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function compressData(data: string): string {
  // Simple LZ-style compression for demo
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return data;
  }
}

function decompressData(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch {
    return data;
  }
}

async function encryptData(data: string, key: string): Promise<string> {
  // Simple XOR encryption for demo (use proper encryption in production)
  const encoded = new TextEncoder().encode(data);
  const keyEncoded = new TextEncoder().encode(key);
  const result = new Uint8Array(encoded.length);
  
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyEncoded[i % keyEncoded.length];
  }
  
  return btoa(String.fromCharCode(...result));
}

async function decryptData(data: string, key: string): Promise<string> {
  const decoded = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const keyEncoded = new TextEncoder().encode(key);
  const result = new Uint8Array(decoded.length);
  
  for (let i = 0; i < decoded.length; i++) {
    result[i] = decoded[i] ^ keyEncoded[i % keyEncoded.length];
  }
  
  return new TextDecoder().decode(result);
}

function diffObjects<T extends Record<string, unknown>>(
  obj1: T,
  obj2: T
): KBSnapshotDiff<T> {
  const added: Partial<T> = {};
  const removed: Partial<T> = {};
  const changed: Partial<T> = {};
  const unchanged: Partial<T> = {};

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  allKeys.forEach((key) => {
    const k = key as keyof T;
    const val1 = obj1[k];
    const val2 = obj2[k];

    if (!(key in obj1)) {
      added[k] = val2;
    } else if (!(key in obj2)) {
      removed[k] = val1;
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      changed[k] = val2;
    } else {
      unchanged[k] = val1;
    }
  });

  return { added, removed, changed, unchanged };
}

// ============================================================================
// STORAGE ADAPTERS
// ============================================================================

interface StorageAdapter {
  save: (key: string, data: string) => Promise<void>;
  load: (key: string) => Promise<string | null>;
  remove: (key: string) => Promise<void>;
  list: (prefix: string) => Promise<string[]>;
}

const memoryStorage: StorageAdapter = {
  storage: new Map<string, string>(),
  async save(key: string, data: string) {
    (this as typeof memoryStorage & { storage: Map<string, string> }).storage.set(key, data);
  },
  async load(key: string) {
    return (this as typeof memoryStorage & { storage: Map<string, string> }).storage.get(key) || null;
  },
  async remove(key: string) {
    (this as typeof memoryStorage & { storage: Map<string, string> }).storage.delete(key);
  },
  async list(prefix: string) {
    const keys: string[] = [];
    (this as typeof memoryStorage & { storage: Map<string, string> }).storage.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    });
    return keys;
  },
} as StorageAdapter & { storage: Map<string, string> };

const localStorageAdapter: StorageAdapter = {
  async save(key: string, data: string) {
    localStorage.setItem(key, data);
  },
  async load(key: string) {
    return localStorage.getItem(key);
  },
  async remove(key: string) {
    localStorage.removeItem(key);
  },
  async list(prefix: string) {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  },
};

function createIndexedDBAdapter(dbName: string): StorageAdapter {
  let db: IDBDatabase | null = null;

  const getDB = async (): Promise<IDBDatabase> => {
    if (db) return db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains('snapshots')) {
          database.createObjectStore('snapshots', { keyPath: 'key' });
        }
      };
    });
  };

  return {
    async save(key: string, data: string) {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction('snapshots', 'readwrite');
        const store = tx.objectStore('snapshots');
        const request = store.put({ key, data });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },
    async load(key: string) {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction('snapshots', 'readonly');
        const store = tx.objectStore('snapshots');
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.data || null);
      });
    },
    async remove(key: string) {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction('snapshots', 'readwrite');
        const store = tx.objectStore('snapshots');
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },
    async list(prefix: string) {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction('snapshots', 'readonly');
        const store = tx.objectStore('snapshots');
        const request = store.getAllKeys();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const keys = (request.result as string[]).filter(k => k.startsWith(prefix));
          resolve(keys);
        };
      });
    },
  };
}

// ============================================================================
// useKBSnapshot
// ============================================================================

const DEFAULT_CONFIG: Required<KBSnapshotConfig> = {
  maxSnapshots: 50,
  autoSnapshotInterval: 0,
  compress: false,
  encrypt: false,
  encryptionKey: '',
  storage: 'memory',
  storageKey: 'kb_snapshot',
  version: 1,
  migrations: {},
};

export function useKBSnapshot<T>(
  initialValue: T,
  config: KBSnapshotConfig = {}
): KBSnapshotReturn<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const [current, setCurrent] = useState<T>(initialValue);
  const [snapshots, setSnapshots] = useState<KBSnapshot<T>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSnapshotId, setLastSnapshotId] = useState<string | null>(null);

  const storageRef = useRef<StorageAdapter>(
    mergedConfig.storage === 'indexedDB'
      ? createIndexedDBAdapter(`${mergedConfig.storageKey}_db`)
      : mergedConfig.storage === 'localStorage'
        ? localStorageAdapter
        : memoryStorage
  );

  const autoSnapshotInterval = useRef<NodeJS.Timeout | null>(null);

  // Load snapshots from storage
  useEffect(() => {
    const loadSnapshots = async () => {
      setIsLoading(true);
      try {
        const keys = await storageRef.current.list(mergedConfig.storageKey);
        const loaded: KBSnapshot<T>[] = [];

        for (const key of keys) {
          const data = await storageRef.current.load(key);
          if (data) {
            let parsed = JSON.parse(mergedConfig.compress ? decompressData(data) : data);
            
            if (mergedConfig.encrypt && mergedConfig.encryptionKey) {
              const decrypted = await decryptData(parsed.data, mergedConfig.encryptionKey);
              parsed.data = JSON.parse(decrypted);
            }

            // Apply migrations
            if (parsed.version < mergedConfig.version) {
              for (let v = parsed.version + 1; v <= mergedConfig.version; v++) {
                if (mergedConfig.migrations[v]) {
                  parsed.data = mergedConfig.migrations[v](parsed.data);
                }
              }
              parsed.version = mergedConfig.version;
            }

            loaded.push(parsed);
          }
        }

        loaded.sort((a, b) => b.timestamp - a.timestamp);
        setSnapshots(loaded.slice(0, mergedConfig.maxSnapshots));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadSnapshots();
  }, [mergedConfig.storageKey, mergedConfig.compress, mergedConfig.encrypt, 
      mergedConfig.encryptionKey, mergedConfig.version, mergedConfig.migrations,
      mergedConfig.maxSnapshots]);

  // Auto-snapshot
  useEffect(() => {
    if (mergedConfig.autoSnapshotInterval > 0) {
      autoSnapshotInterval.current = setInterval(() => {
        createSnapshot('auto');
      }, mergedConfig.autoSnapshotInterval);
    }

    return () => {
      if (autoSnapshotInterval.current) {
        clearInterval(autoSnapshotInterval.current);
      }
    };
  }, [mergedConfig.autoSnapshotInterval]);

  const createSnapshot = useCallback(async (
    name?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> => {
    setIsSaving(true);
    setError(null);

    const id = `${mergedConfig.storageKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      let dataToStore = JSON.stringify(current);
      
      if (mergedConfig.encrypt && mergedConfig.encryptionKey) {
        dataToStore = await encryptData(dataToStore, mergedConfig.encryptionKey);
      }

      const snapshot: KBSnapshot<T> = {
        id,
        name,
        data: current,
        timestamp: Date.now(),
        version: mergedConfig.version,
        metadata,
        checksum: generateChecksum(JSON.stringify(current)),
      };

      const toStore = {
        ...snapshot,
        data: mergedConfig.encrypt ? dataToStore : current,
      };

      let serialized = JSON.stringify(toStore);
      if (mergedConfig.compress) {
        serialized = compressData(serialized);
      }

      await storageRef.current.save(id, serialized);

      setSnapshots(prev => {
        const newSnapshots = [snapshot, ...prev].slice(0, mergedConfig.maxSnapshots);
        
        // Remove old snapshots from storage
        if (prev.length >= mergedConfig.maxSnapshots) {
          const toRemove = prev.slice(mergedConfig.maxSnapshots - 1);
          toRemove.forEach(s => storageRef.current.remove(s.id));
        }

        return newSnapshots;
      });

      setLastSnapshotId(id);
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [current, mergedConfig]);

  const restoreSnapshot = useCallback(async (id: string): Promise<boolean> => {
    const snapshot = snapshots.find(s => s.id === id);
    if (!snapshot) return false;

    try {
      // Verify checksum
      const checksum = generateChecksum(JSON.stringify(snapshot.data));
      if (snapshot.checksum && checksum !== snapshot.checksum) {
        throw new Error('Snapshot data integrity check failed');
      }

      setCurrent(snapshot.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [snapshots]);

  const deleteSnapshot = useCallback(async (id: string): Promise<boolean> => {
    try {
      await storageRef.current.remove(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportSnapshot = useCallback(async (id: string): Promise<string> => {
    const snapshot = snapshots.find(s => s.id === id);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const exportData = {
      ...snapshot,
      exportedAt: Date.now(),
      exportVersion: mergedConfig.version,
    };

    return btoa(JSON.stringify(exportData));
  }, [snapshots, mergedConfig.version]);

  const importSnapshot = useCallback(async (data: string): Promise<string> => {
    try {
      const parsed = JSON.parse(atob(data));
      
      // Apply migrations if needed
      if (parsed.exportVersion < mergedConfig.version) {
        for (let v = parsed.exportVersion + 1; v <= mergedConfig.version; v++) {
          if (mergedConfig.migrations[v]) {
            parsed.data = mergedConfig.migrations[v](parsed.data);
          }
        }
      }

      const newId = await createSnapshot(`imported_${parsed.name || 'snapshot'}`, {
        originalId: parsed.id,
        importedAt: Date.now(),
        ...parsed.metadata,
      });

      return newId;
    } catch (err) {
      throw new Error('Failed to import snapshot: ' + String(err));
    }
  }, [mergedConfig.version, mergedConfig.migrations, createSnapshot]);

  const update = useCallback((value: T | ((prev: T) => T)) => {
    setCurrent(prev => typeof value === 'function' ? (value as (prev: T) => T)(prev) : value);
  }, []);

  const compare = useCallback((id1: string, id2: string): KBSnapshotDiff<T> | null => {
    const snapshot1 = snapshots.find(s => s.id === id1);
    const snapshot2 = snapshots.find(s => s.id === id2);

    if (!snapshot1 || !snapshot2) return null;

    return diffObjects(
      snapshot1.data as Record<string, unknown>,
      snapshot2.data as Record<string, unknown>
    ) as KBSnapshotDiff<T>;
  }, [snapshots]);

  const listSnapshots = useCallback(() => [...snapshots], [snapshots]);

  const getSnapshot = useCallback((id: string) => 
    snapshots.find(s => s.id === id), [snapshots]);

  const state: KBSnapshotState<T> = useMemo(() => ({
    current,
    snapshots,
    isLoading,
    isSaving,
    error,
    lastSnapshotId,
  }), [current, snapshots, isLoading, isSaving, error, lastSnapshotId]);

  return {
    state,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    exportSnapshot,
    importSnapshot,
    update,
    compare,
    listSnapshots,
    getSnapshot,
  };
}

// ============================================================================
// useKBFormSnapshot
// ============================================================================

export function useKBFormSnapshot<T extends Record<string, unknown>>(
  formId: string,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [isDirty, setIsDirty] = useState(false);
  const savedRef = useRef<T>(initialValues);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`form_snapshot_${formId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setValues(parsed);
        savedRef.current = parsed;
      } catch {
        // Ignore parse errors
      }
    }
  }, [formId]);

  // Auto-save on change
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isDirty) {
        localStorage.setItem(`form_snapshot_${formId}`, JSON.stringify(values));
        savedRef.current = values;
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [formId, values, isDirty]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setIsDirty(false);
    localStorage.removeItem(`form_snapshot_${formId}`);
  }, [formId, initialValues]);

  const restore = useCallback(() => {
    setValues(savedRef.current);
    setIsDirty(false);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(`form_snapshot_${formId}`);
  }, [formId]);

  return {
    values,
    setValues,
    updateField,
    isDirty,
    reset,
    restore,
    clear,
    hasSaved: savedRef.current !== initialValues,
  };
}

// ============================================================================
// useKBStateSerializer
// ============================================================================

export interface KBSerializerConfig<T> {
  serialize?: (data: T) => string;
  deserialize?: (data: string) => T;
  validate?: (data: T) => boolean;
}

export function useKBStateSerializer<T>(
  initialValue: T,
  config: KBSerializerConfig<T> = {}
) {
  const {
    serialize = (data) => JSON.stringify(data),
    deserialize = (data) => JSON.parse(data) as T,
    validate = () => true,
  } = config;

  const [value, setValue] = useState<T>(initialValue);
  const [isValid, setIsValid] = useState(true);

  const exportState = useCallback((): string => {
    return serialize(value);
  }, [value, serialize]);

  const importState = useCallback((data: string): boolean => {
    try {
      const parsed = deserialize(data);
      if (validate(parsed)) {
        setValue(parsed);
        setIsValid(true);
        return true;
      }
      setIsValid(false);
      return false;
    } catch {
      setIsValid(false);
      return false;
    }
  }, [deserialize, validate]);

  const exportToFile = useCallback((filename: string) => {
    const data = exportState();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportState]);

  const importFromFile = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = importState(e.target?.result as string);
        resolve(result);
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, [importState]);

  return {
    value,
    setValue,
    isValid,
    exportState,
    importState,
    exportToFile,
    importFromFile,
  };
}

export default useKBSnapshot;
