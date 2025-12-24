/**
 * KB 4.5 - Query Persistence Hooks
 * 
 * Hooks for persisting and restoring query state across sessions.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

export interface KBQueryPersistenceConfig {
  /** Persistence key */
  key: string;
  /** Storage backend */
  storage?: 'localStorage' | 'sessionStorage' | 'url' | 'memory';
  /** Default values */
  defaults?: Record<string, unknown>;
  /** Serializer */
  serialize?: (data: Record<string, unknown>) => string;
  /** Deserializer */
  deserialize?: (data: string) => Record<string, unknown>;
  /** Debounce persistence (ms) */
  debounceMs?: number;
  /** Sync across tabs */
  syncTabs?: boolean;
  /** Exclude keys from persistence */
  excludeKeys?: string[];
  /** Validate before restore */
  validate?: (data: Record<string, unknown>) => boolean;
}

export interface KBQueryPersistenceState {
  isLoaded: boolean;
  isStoring: boolean;
  lastSyncAt: Date | null;
  error: Error | null;
}

export interface KBQueryPersistenceReturn<T extends Record<string, unknown>> {
  state: KBQueryPersistenceState;
  data: T;
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  setMultiple: (values: Partial<T>) => void;
  get: <K extends keyof T>(key: K) => T[K];
  remove: <K extends keyof T>(key: K) => void;
  clear: () => void;
  reset: () => void;
  persist: () => Promise<void>;
  restore: () => Promise<void>;
}

// ============================================================================
// STORAGE ADAPTERS
// ============================================================================

interface PersistenceStorage {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
}

const memoryStore = new Map<string, string>();

const storageAdapters: Record<string, PersistenceStorage> = {
  localStorage: {
    get: (key) => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value),
    remove: (key) => localStorage.removeItem(key),
  },
  sessionStorage: {
    get: (key) => sessionStorage.getItem(key),
    set: (key, value) => sessionStorage.setItem(key, value),
    remove: (key) => sessionStorage.removeItem(key),
  },
  memory: {
    get: (key) => memoryStore.get(key) || null,
    set: (key, value) => memoryStore.set(key, value),
    remove: (key) => memoryStore.delete(key),
  },
};

// ============================================================================
// useKBQueryPersistence
// ============================================================================

const DEFAULT_CONFIG: Partial<KBQueryPersistenceConfig> = {
  storage: 'localStorage',
  debounceMs: 300,
  syncTabs: false,
  excludeKeys: [],
};

export function useKBQueryPersistence<T extends Record<string, unknown>>(
  config: KBQueryPersistenceConfig
): KBQueryPersistenceReturn<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [data, setData] = useState<T>((mergedConfig.defaults || {}) as T);
  const [state, setState] = useState<KBQueryPersistenceState>({
    isLoaded: false,
    isStoring: false,
    lastSyncAt: null,
    error: null,
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const storage = storageAdapters[mergedConfig.storage || 'localStorage'];

  const serialize = mergedConfig.serialize || JSON.stringify;
  const deserialize = mergedConfig.deserialize || JSON.parse;

  // Filter excluded keys
  const filterData = useCallback((d: Record<string, unknown>): Record<string, unknown> => {
    if (!mergedConfig.excludeKeys?.length) return d;
    const filtered = { ...d };
    mergedConfig.excludeKeys.forEach(key => delete filtered[key]);
    return filtered;
  }, [mergedConfig.excludeKeys]);

  // Persist data
  const persist = useCallback(async () => {
    setState(prev => ({ ...prev, isStoring: true }));
    try {
      const toStore = filterData(data);
      storage.set(mergedConfig.key, serialize(toStore));
      setState(prev => ({ 
        ...prev, 
        isStoring: false, 
        lastSyncAt: new Date(),
        error: null,
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isStoring: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [data, filterData, storage, serialize, mergedConfig.key]);

  // Debounced persist
  const debouncedPersist = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(persist, mergedConfig.debounceMs);
  }, [persist, mergedConfig.debounceMs]);

  // Restore data
  const restore = useCallback(async () => {
    try {
      const stored = storage.get(mergedConfig.key);
      if (stored) {
        const parsed = deserialize(stored);
        if (!mergedConfig.validate || mergedConfig.validate(parsed)) {
          setData(prev => ({ ...prev, ...parsed }));
        }
      }
      setState(prev => ({ ...prev, isLoaded: true, error: null }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isLoaded: true,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [storage, deserialize, mergedConfig.key, mergedConfig.validate]);

  // Set single value
  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
    debouncedPersist();
  }, [debouncedPersist]);

  // Set multiple values
  const setMultiple = useCallback((values: Partial<T>) => {
    setData(prev => ({ ...prev, ...values }));
    debouncedPersist();
  }, [debouncedPersist]);

  // Get value
  const get = useCallback(<K extends keyof T>(key: K): T[K] => {
    return data[key];
  }, [data]);

  // Remove key
  const remove = useCallback(<K extends keyof T>(key: K) => {
    setData(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    debouncedPersist();
  }, [debouncedPersist]);

  // Clear all
  const clear = useCallback(() => {
    setData({} as T);
    storage.remove(mergedConfig.key);
  }, [storage, mergedConfig.key]);

  // Reset to defaults
  const reset = useCallback(() => {
    setData((mergedConfig.defaults || {}) as T);
    debouncedPersist();
  }, [mergedConfig.defaults, debouncedPersist]);

  // Initial restore
  useEffect(() => {
    restore();
  }, []);

  // Tab sync
  useEffect(() => {
    if (!mergedConfig.syncTabs || mergedConfig.storage !== 'localStorage') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === mergedConfig.key && e.newValue) {
        try {
          const parsed = deserialize(e.newValue);
          setData(prev => ({ ...prev, ...parsed }));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [mergedConfig.syncTabs, mergedConfig.storage, mergedConfig.key, deserialize]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    state,
    data,
    set,
    setMultiple,
    get,
    remove,
    clear,
    reset,
    persist,
    restore,
  };
}

// ============================================================================
// useKBURLQuery
// ============================================================================

export interface KBURLQueryConfig<T extends Record<string, string>> {
  defaults?: T;
  replaceState?: boolean;
  prefix?: string;
  parseNumbers?: boolean;
  parseBooleans?: boolean;
}

export function useKBURLQuery<T extends Record<string, string>>(
  config: KBURLQueryConfig<T> = {}
) {
  const {
    defaults = {} as T,
    replaceState = true,
    prefix = '',
    parseNumbers = true,
    parseBooleans = true,
  } = config;

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const parseValue = useCallback((value: string): unknown => {
    if (parseBooleans && (value === 'true' || value === 'false')) {
      return value === 'true';
    }
    if (parseNumbers && !isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  }, [parseNumbers, parseBooleans]);

  const query = useMemo(() => {
    const result = { ...defaults };
    searchParams.forEach((value, key) => {
      const actualKey = prefix ? key.replace(prefix, '') : key;
      if (!prefix || key.startsWith(prefix)) {
        (result as Record<string, unknown>)[actualKey] = parseValue(value);
      }
    });
    return result as T;
  }, [searchParams, defaults, prefix, parseValue]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    const actualKey = prefix ? `${prefix}${String(key)}` : String(key);
    const newParams = new URLSearchParams(searchParams);
    
    if (value === undefined || value === null || value === '') {
      newParams.delete(actualKey);
    } else {
      newParams.set(actualKey, String(value));
    }

    setSearchParams(newParams, { replace: replaceState });
  }, [searchParams, setSearchParams, prefix, replaceState]);

  const setMultiple = useCallback((values: Partial<T>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(values).forEach(([key, value]) => {
      const actualKey = prefix ? `${prefix}${key}` : key;
      if (value === undefined || value === null || value === '') {
        newParams.delete(actualKey);
      } else {
        newParams.set(actualKey, String(value));
      }
    });

    setSearchParams(newParams, { replace: replaceState });
  }, [searchParams, setSearchParams, prefix, replaceState]);

  const get = useCallback(<K extends keyof T>(key: K): T[K] => {
    return query[key];
  }, [query]);

  const remove = useCallback(<K extends keyof T>(key: K) => {
    const actualKey = prefix ? `${prefix}${String(key)}` : String(key);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(actualKey);
    setSearchParams(newParams, { replace: replaceState });
  }, [searchParams, setSearchParams, prefix, replaceState]);

  const clear = useCallback(() => {
    const newParams = new URLSearchParams();
    // Keep non-prefixed params
    searchParams.forEach((value, key) => {
      if (prefix && !key.startsWith(prefix)) {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: replaceState });
  }, [searchParams, setSearchParams, prefix, replaceState]);

  const reset = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    
    // Remove all prefixed params
    Array.from(searchParams.keys()).forEach(key => {
      if (!prefix || key.startsWith(prefix)) {
        newParams.delete(key);
      }
    });

    // Add defaults
    Object.entries(defaults).forEach(([key, value]) => {
      const actualKey = prefix ? `${prefix}${key}` : key;
      if (value !== undefined && value !== null) {
        newParams.set(actualKey, String(value));
      }
    });

    setSearchParams(newParams, { replace: replaceState });
  }, [searchParams, setSearchParams, defaults, prefix, replaceState]);

  const toQueryString = useCallback(() => {
    return searchParams.toString();
  }, [searchParams]);

  const fromQueryString = useCallback((queryString: string) => {
    const newParams = new URLSearchParams(queryString);
    setSearchParams(newParams, { replace: replaceState });
  }, [setSearchParams, replaceState]);

  return {
    query,
    set,
    setMultiple,
    get,
    remove,
    clear,
    reset,
    toQueryString,
    fromQueryString,
    searchParams,
  };
}

// ============================================================================
// useKBFilterPersistence
// ============================================================================

export interface KBFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
  value: unknown;
}

export interface KBFilterPersistenceConfig {
  key: string;
  storage?: 'localStorage' | 'sessionStorage' | 'url';
  defaults?: KBFilter[];
}

export function useKBFilterPersistence(config: KBFilterPersistenceConfig) {
  const { key, storage = 'localStorage', defaults = [] } = config;
  
  const [filters, setFilters] = useState<KBFilter[]>(defaults);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from storage
  useEffect(() => {
    if (storage === 'url') {
      const urlFilters = searchParams.get(`${key}_filters`);
      if (urlFilters) {
        try {
          setFilters(JSON.parse(urlFilters));
        } catch {
          // Ignore
        }
      }
    } else {
      const store = storage === 'localStorage' ? localStorage : sessionStorage;
      const stored = store.getItem(`${key}_filters`);
      if (stored) {
        try {
          setFilters(JSON.parse(stored));
        } catch {
          // Ignore
        }
      }
    }
  }, [key, storage]);

  // Save to storage
  const persist = useCallback(() => {
    const serialized = JSON.stringify(filters);
    
    if (storage === 'url') {
      const newParams = new URLSearchParams(searchParams);
      if (filters.length > 0) {
        newParams.set(`${key}_filters`, serialized);
      } else {
        newParams.delete(`${key}_filters`);
      }
      setSearchParams(newParams, { replace: true });
    } else {
      const store = storage === 'localStorage' ? localStorage : sessionStorage;
      if (filters.length > 0) {
        store.setItem(`${key}_filters`, serialized);
      } else {
        store.removeItem(`${key}_filters`);
      }
    }
  }, [filters, key, storage, searchParams, setSearchParams]);

  const addFilter = useCallback((filter: KBFilter) => {
    setFilters(prev => {
      const existing = prev.findIndex(f => f.field === filter.field);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = filter;
        return next;
      }
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters(prev => prev.filter(f => f.field !== field));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaults);
  }, [defaults]);

  const hasFilter = useCallback((field: string) => {
    return filters.some(f => f.field === field);
  }, [filters]);

  const getFilter = useCallback((field: string) => {
    return filters.find(f => f.field === field);
  }, [filters]);

  // Auto-persist on change
  useEffect(() => {
    persist();
  }, [filters]);

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    resetFilters,
    hasFilter,
    getFilter,
    persist,
  };
}

// ============================================================================
// useKBSortPersistence
// ============================================================================

export interface KBSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface KBSortPersistenceConfig {
  key: string;
  storage?: 'localStorage' | 'sessionStorage' | 'url';
  defaults?: KBSort[];
  maxSorts?: number;
}

export function useKBSortPersistence(config: KBSortPersistenceConfig) {
  const { key, storage = 'localStorage', defaults = [], maxSorts = 3 } = config;
  
  const [sorts, setSorts] = useState<KBSort[]>(defaults);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from storage
  useEffect(() => {
    if (storage === 'url') {
      const urlSorts = searchParams.get(`${key}_sorts`);
      if (urlSorts) {
        try {
          setSorts(JSON.parse(urlSorts));
        } catch {
          // Ignore
        }
      }
    } else {
      const store = storage === 'localStorage' ? localStorage : sessionStorage;
      const stored = store.getItem(`${key}_sorts`);
      if (stored) {
        try {
          setSorts(JSON.parse(stored));
        } catch {
          // Ignore
        }
      }
    }
  }, [key, storage]);

  // Persist
  const persist = useCallback(() => {
    const serialized = JSON.stringify(sorts);
    
    if (storage === 'url') {
      const newParams = new URLSearchParams(searchParams);
      if (sorts.length > 0) {
        newParams.set(`${key}_sorts`, serialized);
      } else {
        newParams.delete(`${key}_sorts`);
      }
      setSearchParams(newParams, { replace: true });
    } else {
      const store = storage === 'localStorage' ? localStorage : sessionStorage;
      if (sorts.length > 0) {
        store.setItem(`${key}_sorts`, serialized);
      } else {
        store.removeItem(`${key}_sorts`);
      }
    }
  }, [sorts, key, storage, searchParams, setSearchParams]);

  const setSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSorts(prev => {
      const existing = prev.findIndex(s => s.field === field);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { field, direction };
        return next;
      }
      const next = [...prev, { field, direction }];
      return next.slice(-maxSorts);
    });
  }, [maxSorts]);

  const toggleSort = useCallback((field: string) => {
    setSorts(prev => {
      const existing = prev.find(s => s.field === field);
      if (existing) {
        if (existing.direction === 'asc') {
          return prev.map(s => s.field === field ? { ...s, direction: 'desc' as const } : s);
        }
        return prev.filter(s => s.field !== field);
      }
      const next = [...prev, { field, direction: 'asc' as const }];
      return next.slice(-maxSorts);
    });
  }, [maxSorts]);

  const removeSort = useCallback((field: string) => {
    setSorts(prev => prev.filter(s => s.field !== field));
  }, []);

  const clearSorts = useCallback(() => {
    setSorts([]);
  }, []);

  const resetSorts = useCallback(() => {
    setSorts(defaults);
  }, [defaults]);

  const getSortDirection = useCallback((field: string) => {
    return sorts.find(s => s.field === field)?.direction;
  }, [sorts]);

  // Auto-persist
  useEffect(() => {
    persist();
  }, [sorts]);

  return {
    sorts,
    setSort,
    toggleSort,
    removeSort,
    clearSorts,
    resetSorts,
    getSortDirection,
    persist,
  };
}

// ============================================================================
// useKBViewPersistence
// ============================================================================

export interface KBViewConfig {
  layout: 'grid' | 'list' | 'table' | 'kanban';
  density: 'compact' | 'normal' | 'comfortable';
  columns?: string[];
  groupBy?: string;
  expandedGroups?: string[];
}

export function useKBViewPersistence(key: string, defaults: Partial<KBViewConfig> = {}) {
  const defaultConfig: KBViewConfig = {
    layout: 'table',
    density: 'normal',
    columns: [],
    expandedGroups: [],
    ...defaults,
  };

  const [config, setConfig] = useState<KBViewConfig>(defaultConfig);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`view_config_${key}`);
    if (stored) {
      try {
        setConfig(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch {
        // Ignore
      }
    }
  }, [key]);

  // Persist
  const persist = useCallback(() => {
    localStorage.setItem(`view_config_${key}`, JSON.stringify(config));
  }, [key, config]);

  useEffect(() => {
    persist();
  }, [config]);

  const setLayout = useCallback((layout: KBViewConfig['layout']) => {
    setConfig(prev => ({ ...prev, layout }));
  }, []);

  const setDensity = useCallback((density: KBViewConfig['density']) => {
    setConfig(prev => ({ ...prev, density }));
  }, []);

  const setColumns = useCallback((columns: string[]) => {
    setConfig(prev => ({ ...prev, columns }));
  }, []);

  const setGroupBy = useCallback((groupBy: string | undefined) => {
    setConfig(prev => ({ ...prev, groupBy }));
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setConfig(prev => {
      const expanded = prev.expandedGroups || [];
      const isExpanded = expanded.includes(groupId);
      return {
        ...prev,
        expandedGroups: isExpanded
          ? expanded.filter(id => id !== groupId)
          : [...expanded, groupId],
      };
    });
  }, []);

  const reset = useCallback(() => {
    setConfig(defaultConfig);
  }, [defaultConfig]);

  return {
    config,
    setLayout,
    setDensity,
    setColumns,
    setGroupBy,
    toggleGroup,
    reset,
    persist,
  };
}

export default useKBQueryPersistence;
