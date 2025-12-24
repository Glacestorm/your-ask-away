/**
 * KB 4.5 - Configuration Management Hook (Phase 18)
 * Dynamic configuration with hot reload, validation, and versioning
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray;
export type ConfigObject = { [key: string]: ConfigValue };
export type ConfigArray = ConfigValue[];

export interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: ConfigValue;
  enum?: ConfigValue[];
  min?: number;
  max?: number;
  pattern?: string;
  properties?: Record<string, ConfigSchema>;
  items?: ConfigSchema;
  description?: string;
  sensitive?: boolean;
}

export interface ConfigSource {
  name: string;
  priority: number;
  load: () => Promise<ConfigObject>;
  watch?: (onChange: (config: ConfigObject) => void) => () => void;
}

export interface ConfigVersion {
  version: number;
  timestamp: number;
  config: ConfigObject;
  author?: string;
  comment?: string;
}

export interface ConfigValidationError {
  path: string;
  message: string;
  expected?: string;
  received?: string;
}

export interface ConfigManagerConfig {
  sources: ConfigSource[];
  schema?: Record<string, ConfigSchema>;
  refreshInterval?: number;
  maxVersions?: number;
  onChange?: (config: ConfigObject, changes: ConfigChange[]) => void;
  onError?: (error: Error) => void;
}

export interface ConfigChange {
  path: string;
  oldValue: ConfigValue;
  newValue: ConfigValue;
  source: string;
}

export interface ConfigMetrics {
  loadCount: number;
  refreshCount: number;
  errorCount: number;
  lastLoadTime: number;
  averageLoadTime: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getNestedValue(obj: ConfigObject, path: string): ConfigValue {
  const keys = path.split('.');
  let current: ConfigValue = obj;
  
  for (const key of keys) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined as unknown as ConfigValue;
    }
    current = (current as ConfigObject)[key];
  }
  
  return current;
}

function setNestedValue(obj: ConfigObject, path: string, value: ConfigValue): void {
  const keys = path.split('.');
  let current: ConfigObject = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as ConfigObject;
  }
  
  current[keys[keys.length - 1]] = value;
}

function deepMerge(target: ConfigObject, source: ConfigObject): ConfigObject {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue as ConfigObject, sourceValue as ConfigObject);
    } else {
      result[key] = sourceValue;
    }
  }
  
  return result;
}

function findChanges(
  oldConfig: ConfigObject,
  newConfig: ConfigObject,
  source: string,
  path: string = ''
): ConfigChange[] {
  const changes: ConfigChange[] = [];
  const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);
  
  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const oldValue = oldConfig[key];
    const newValue = newConfig[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      if (
        oldValue !== null &&
        typeof oldValue === 'object' &&
        !Array.isArray(oldValue) &&
        newValue !== null &&
        typeof newValue === 'object' &&
        !Array.isArray(newValue)
      ) {
        changes.push(...findChanges(
          oldValue as ConfigObject,
          newValue as ConfigObject,
          source,
          currentPath
        ));
      } else {
        changes.push({ path: currentPath, oldValue, newValue, source });
      }
    }
  }
  
  return changes;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateConfig(
  config: ConfigObject,
  schema: Record<string, ConfigSchema>,
  path: string = ''
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  
  for (const [key, schemaItem] of Object.entries(schema)) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = config[key];
    
    // Required check
    if (schemaItem.required && (value === undefined || value === null)) {
      errors.push({
        path: currentPath,
        message: 'Required field is missing',
        expected: schemaItem.type,
      });
      continue;
    }
    
    if (value === undefined || value === null) continue;
    
    // Type check
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== schemaItem.type) {
      errors.push({
        path: currentPath,
        message: `Invalid type`,
        expected: schemaItem.type,
        received: actualType,
      });
      continue;
    }
    
    // Enum check
    if (schemaItem.enum && !schemaItem.enum.includes(value)) {
      errors.push({
        path: currentPath,
        message: `Value not in allowed values`,
        expected: schemaItem.enum.join(', '),
        received: String(value),
      });
    }
    
    // Number range
    if (schemaItem.type === 'number' && typeof value === 'number') {
      if (schemaItem.min !== undefined && value < schemaItem.min) {
        errors.push({
          path: currentPath,
          message: `Value below minimum`,
          expected: `>= ${schemaItem.min}`,
          received: String(value),
        });
      }
      if (schemaItem.max !== undefined && value > schemaItem.max) {
        errors.push({
          path: currentPath,
          message: `Value above maximum`,
          expected: `<= ${schemaItem.max}`,
          received: String(value),
        });
      }
    }
    
    // String pattern
    if (schemaItem.type === 'string' && typeof value === 'string' && schemaItem.pattern) {
      const regex = new RegExp(schemaItem.pattern);
      if (!regex.test(value)) {
        errors.push({
          path: currentPath,
          message: `Value does not match pattern`,
          expected: schemaItem.pattern,
          received: value,
        });
      }
    }
    
    // Nested object
    if (schemaItem.type === 'object' && schemaItem.properties && typeof value === 'object') {
      errors.push(...validateConfig(value as ConfigObject, schemaItem.properties, currentPath));
    }
  }
  
  return errors;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBConfigManagement<T extends ConfigObject = ConfigObject>(
  managerConfig: ConfigManagerConfig
): {
  // State
  config: T;
  isLoading: boolean;
  error: Error | null;
  validationErrors: ConfigValidationError[];
  
  // Actions
  get: <V = ConfigValue>(path: string, defaultValue?: V) => V;
  set: (path: string, value: ConfigValue) => void;
  refresh: () => Promise<void>;
  validate: () => ConfigValidationError[];
  
  // Versions
  versions: ConfigVersion[];
  rollback: (version: number) => void;
  
  // Metrics
  metrics: ConfigMetrics;
} {
  const [config, setConfig] = useState<T>({} as T);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [validationErrors, setValidationErrors] = useState<ConfigValidationError[]>([]);
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  
  const configRef = useRef(managerConfig);
  const metricsRef = useRef<ConfigMetrics>({
    loadCount: 0,
    refreshCount: 0,
    errorCount: 0,
    lastLoadTime: 0,
    averageLoadTime: 0,
  });
  const cleanupFns = useRef<Array<() => void>>([]);

  // Load config from all sources
  const loadConfig = useCallback(async () => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    
    try {
      const { sources, schema } = configRef.current;
      const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);
      
      let mergedConfig: ConfigObject = {};
      const changes: ConfigChange[] = [];
      
      for (const source of sortedSources) {
        try {
          const sourceConfig = await source.load();
          const sourceChanges = findChanges(mergedConfig, sourceConfig, source.name);
          changes.push(...sourceChanges);
          mergedConfig = deepMerge(mergedConfig, sourceConfig);
        } catch (err) {
          console.warn(`Failed to load config from ${source.name}:`, err);
        }
      }
      
      // Apply defaults from schema
      if (schema) {
        for (const [key, schemaItem] of Object.entries(schema)) {
          if (mergedConfig[key] === undefined && schemaItem.default !== undefined) {
            mergedConfig[key] = schemaItem.default;
          }
        }
      }
      
      // Validate
      const errors = schema ? validateConfig(mergedConfig, schema) : [];
      setValidationErrors(errors);
      
      // Save version
      setVersions(prev => {
        const maxVersions = configRef.current.maxVersions ?? 10;
        const newVersion: ConfigVersion = {
          version: (prev[0]?.version ?? 0) + 1,
          timestamp: Date.now(),
          config: mergedConfig,
        };
        return [newVersion, ...prev].slice(0, maxVersions);
      });
      
      setConfig(mergedConfig as T);
      
      // Notify changes
      if (changes.length > 0) {
        configRef.current.onChange?.(mergedConfig, changes);
      }
      
      // Update metrics
      const loadTime = Date.now() - startTime;
      metricsRef.current.loadCount++;
      metricsRef.current.lastLoadTime = loadTime;
      metricsRef.current.averageLoadTime = 
        (metricsRef.current.averageLoadTime * (metricsRef.current.loadCount - 1) + loadTime) / 
        metricsRef.current.loadCount;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      metricsRef.current.errorCount++;
      configRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get value by path
  const get = useCallback(<V = ConfigValue>(path: string, defaultValue?: V): V => {
    const value = getNestedValue(config, path);
    return (value !== undefined ? value : defaultValue) as V;
  }, [config]);

  // Set value by path (local override)
  const set = useCallback((path: string, value: ConfigValue) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      setNestedValue(newConfig, path, value);
      return newConfig as T;
    });
  }, []);

  // Refresh config
  const refresh = useCallback(async () => {
    metricsRef.current.refreshCount++;
    await loadConfig();
  }, [loadConfig]);

  // Validate current config
  const validate = useCallback((): ConfigValidationError[] => {
    if (!configRef.current.schema) return [];
    const errors = validateConfig(config, configRef.current.schema);
    setValidationErrors(errors);
    return errors;
  }, [config]);

  // Rollback to version
  const rollback = useCallback((version: number) => {
    const versionData = versions.find(v => v.version === version);
    if (versionData) {
      setConfig(versionData.config as T);
    }
  }, [versions]);

  // Initial load
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Setup watchers
  useEffect(() => {
    const { sources } = configRef.current;
    
    for (const source of sources) {
      if (source.watch) {
        const cleanup = source.watch((newConfig) => {
          setConfig(prev => deepMerge(prev, newConfig) as T);
        });
        cleanupFns.current.push(cleanup);
      }
    }
    
    return () => {
      cleanupFns.current.forEach(fn => fn());
      cleanupFns.current = [];
    };
  }, []);

  // Refresh interval
  useEffect(() => {
    const interval = configRef.current.refreshInterval;
    if (!interval) return;
    
    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [refresh]);

  return {
    config,
    isLoading,
    error,
    validationErrors,
    get,
    set,
    refresh,
    validate,
    versions,
    rollback,
    metrics: { ...metricsRef.current },
  };
}

// ============================================================================
// ENVIRONMENT CONFIG SOURCE
// ============================================================================

export function createEnvConfigSource(prefix: string = 'VITE_'): ConfigSource {
  return {
    name: 'environment',
    priority: 0,
    load: async () => {
      const config: ConfigObject = {};
      
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        for (const [key, value] of Object.entries(import.meta.env)) {
          if (key.startsWith(prefix)) {
            const configKey = key.slice(prefix.length).toLowerCase().replace(/_/g, '.');
            config[configKey] = value;
          }
        }
      }
      
      return config;
    },
  };
}

// ============================================================================
// LOCAL STORAGE CONFIG SOURCE
// ============================================================================

export function createLocalStorageConfigSource(key: string): ConfigSource {
  return {
    name: 'localStorage',
    priority: 10,
    load: async () => {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    },
    watch: (onChange) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
          try {
            onChange(JSON.parse(e.newValue));
          } catch {
            // Ignore parse errors
          }
        }
      };
      
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}

// ============================================================================
// REMOTE CONFIG SOURCE
// ============================================================================

export function createRemoteConfigSource(
  url: string,
  options?: RequestInit
): ConfigSource {
  return {
    name: 'remote',
    priority: 20,
    load: async () => {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Failed to load config: ${response.status}`);
      return response.json();
    },
  };
}

// ============================================================================
// FEATURE-SPECIFIC CONFIG HOOK
// ============================================================================

export function useKBFeatureConfig<T>(
  featureName: string,
  schema?: Record<string, ConfigSchema>
): {
  config: T | null;
  isEnabled: boolean;
  get: <V>(key: string, defaultValue?: V) => V;
} {
  const { config: fullConfig, get: fullGet } = useKBConfigManagement({
    sources: [createEnvConfigSource(), createLocalStorageConfigSource('app-config')],
    schema,
  });

  const featureConfig = useMemo(() => {
    return fullGet<T>(`features.${featureName}`, null as unknown as T);
  }, [fullGet, featureName]);

  const isEnabled = useMemo(() => {
    return fullGet<boolean>(`features.${featureName}.enabled`, false);
  }, [fullGet, featureName]);

  const get = useCallback(<V>(key: string, defaultValue?: V): V => {
    return fullGet<V>(`features.${featureName}.${key}`, defaultValue as V);
  }, [fullGet, featureName]);

  return { config: featureConfig, isEnabled, get };
}

export default useKBConfigManagement;
