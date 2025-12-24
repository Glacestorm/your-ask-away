/**
 * KB 4.5 - Plugin System
 * 
 * Extensible plugin architecture for modular applications.
 */

import { useState, useCallback, useRef, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Plugin<TConfig = unknown, TApi = unknown> {
  /** Unique plugin identifier */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin dependencies */
  dependencies?: string[];
  /** Plugin initialization */
  init?: (config: TConfig, host: PluginHost) => Promise<void> | void;
  /** Plugin cleanup */
  destroy?: () => Promise<void> | void;
  /** Plugin API exposed to other plugins and host */
  api?: TApi;
  /** Plugin hooks */
  hooks?: PluginHooks;
  /** Plugin components */
  components?: Record<string, React.ComponentType<unknown>>;
  /** Plugin routes */
  routes?: PluginRoute[];
  /** Plugin priority (higher = loaded first) */
  priority?: number;
}

export interface PluginHooks {
  /** Called before app renders */
  beforeRender?: () => void;
  /** Called after app renders */
  afterRender?: () => void;
  /** Called on route change */
  onRouteChange?: (path: string) => void;
  /** Called on state change */
  onStateChange?: (state: unknown) => void;
  /** Custom hooks */
  [key: string]: ((...args: unknown[]) => unknown) | undefined;
}

export interface PluginRoute {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  guards?: Array<() => boolean | Promise<boolean>>;
}

export interface PluginHost {
  /** Get plugin by name */
  getPlugin<T extends Plugin>(name: string): T | undefined;
  /** Get all plugins */
  getAllPlugins(): Plugin[];
  /** Register plugin dynamically */
  registerPlugin(plugin: Plugin): Promise<void>;
  /** Unregister plugin */
  unregisterPlugin(name: string): Promise<void>;
  /** Call hook on all plugins */
  callHook(hookName: string, ...args: unknown[]): Promise<unknown[]>;
  /** Get plugin API */
  getApi<T>(pluginName: string): T | undefined;
  /** Emit event to plugins */
  emit(event: string, data?: unknown): void;
  /** Subscribe to events */
  on(event: string, handler: (data: unknown) => void): () => void;
}

export interface PluginManagerConfig {
  /** Plugins to load initially */
  plugins?: Plugin[];
  /** Enable hot reload */
  hotReload?: boolean;
  /** Enable plugin isolation */
  isolation?: boolean;
  /** Strict dependency checking */
  strictDependencies?: boolean;
  /** Enable logging */
  logging?: boolean;
}

export interface PluginState {
  plugins: Map<string, Plugin>;
  loadedPlugins: Set<string>;
  failedPlugins: Map<string, Error>;
  isLoading: boolean;
}

// ============================================================================
// PLUGIN MANAGER
// ============================================================================

class PluginManager implements PluginHost {
  private plugins = new Map<string, Plugin>();
  private loadedPlugins = new Set<string>();
  private eventHandlers = new Map<string, Set<(data: unknown) => void>>();
  private config: Required<PluginManagerConfig>;
  private onStateChange?: (state: PluginState) => void;

  constructor(config: PluginManagerConfig = {}) {
    this.config = {
      plugins: config.plugins ?? [],
      hotReload: config.hotReload ?? false,
      isolation: config.isolation ?? false,
      strictDependencies: config.strictDependencies ?? true,
      logging: config.logging ?? false,
    };
  }

  setStateHandler(handler: (state: PluginState) => void): void {
    this.onStateChange = handler;
  }

  private notifyStateChange(): void {
    this.onStateChange?.({
      plugins: new Map(this.plugins),
      loadedPlugins: new Set(this.loadedPlugins),
      failedPlugins: new Map(),
      isLoading: false,
    });
  }

  async initialize(): Promise<void> {
    // Sort plugins by priority and dependencies
    const sortedPlugins = this.topologicalSort(this.config.plugins);

    for (const plugin of sortedPlugins) {
      await this.registerPlugin(plugin);
    }
  }

  private topologicalSort(plugins: Plugin[]): Plugin[] {
    const sorted: Plugin[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const pluginMap = new Map(plugins.map((p) => [p.name, p]));

    const visit = (plugin: Plugin) => {
      if (visited.has(plugin.name)) return;
      if (visiting.has(plugin.name)) {
        throw new Error(`Circular dependency detected: ${plugin.name}`);
      }

      visiting.add(plugin.name);

      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          const depPlugin = pluginMap.get(dep);
          if (depPlugin) {
            visit(depPlugin);
          } else if (this.config.strictDependencies) {
            throw new Error(`Missing dependency: ${dep} for plugin ${plugin.name}`);
          }
        }
      }

      visiting.delete(plugin.name);
      visited.add(plugin.name);
      sorted.push(plugin);
    };

    // Sort by priority first
    const prioritized = [...plugins].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const plugin of prioritized) {
      visit(plugin);
    }

    return sorted;
  }

  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      if (this.config.logging) {
        console.warn(`[PluginManager] Plugin ${plugin.name} already registered`);
      }
      return;
    }

    // Check dependencies
    if (plugin.dependencies && this.config.strictDependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.loadedPlugins.has(dep)) {
          throw new Error(`Missing dependency: ${dep} for plugin ${plugin.name}`);
        }
      }
    }

    if (this.config.logging) {
      console.log(`[PluginManager] Registering plugin: ${plugin.name} v${plugin.version}`);
    }

    this.plugins.set(plugin.name, plugin);

    // Initialize plugin
    try {
      await plugin.init?.(undefined, this);
      this.loadedPlugins.add(plugin.name);
      
      if (this.config.logging) {
        console.log(`[PluginManager] Plugin ${plugin.name} loaded successfully`);
      }

      this.emit('plugin:loaded', { name: plugin.name, version: plugin.version });
      this.notifyStateChange();
    } catch (error) {
      console.error(`[PluginManager] Failed to initialize plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    // Check if other plugins depend on this
    for (const [, p] of this.plugins) {
      if (p.dependencies?.includes(name)) {
        throw new Error(`Cannot unregister plugin ${name}: ${p.name} depends on it`);
      }
    }

    if (this.config.logging) {
      console.log(`[PluginManager] Unregistering plugin: ${name}`);
    }

    try {
      await plugin.destroy?.();
    } catch (error) {
      console.error(`[PluginManager] Error destroying plugin ${name}:`, error);
    }

    this.plugins.delete(name);
    this.loadedPlugins.delete(name);
    
    this.emit('plugin:unloaded', { name });
    this.notifyStateChange();
  }

  getPlugin<T extends Plugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async callHook(hookName: string, ...args: unknown[]): Promise<unknown[]> {
    const results: unknown[] = [];

    for (const plugin of this.plugins.values()) {
      const hook = plugin.hooks?.[hookName];
      if (typeof hook === 'function') {
        try {
          const result = await hook(...args);
          results.push(result);
        } catch (error) {
          console.error(`[PluginManager] Error calling hook ${hookName} on ${plugin.name}:`, error);
        }
      }
    }

    return results;
  }

  getApi<T>(pluginName: string): T | undefined {
    const plugin = this.plugins.get(pluginName);
    return plugin?.api as T | undefined;
  }

  emit(event: string, data?: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[PluginManager] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, handler: (data: unknown) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  getState(): PluginState {
    return {
      plugins: new Map(this.plugins),
      loadedPlugins: new Set(this.loadedPlugins),
      failedPlugins: new Map(),
      isLoading: false,
    };
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const PluginContext = createContext<PluginHost | null>(null);

export interface PluginProviderProps {
  config?: PluginManagerConfig;
  children: ReactNode;
}

export function PluginProvider({ config, children }: PluginProviderProps) {
  const [, setState] = useState<PluginState>({
    plugins: new Map(),
    loadedPlugins: new Set(),
    failedPlugins: new Map(),
    isLoading: true,
  });

  const managerRef = useRef<PluginManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new PluginManager(config);
    managerRef.current.setStateHandler(setState);
  }

  useEffect(() => {
    managerRef.current?.initialize();
    
    return () => {
      managerRef.current?.getAllPlugins().forEach((plugin) => {
        plugin.destroy?.();
      });
    };
  }, []);

  return (
    <PluginContext.Provider value={managerRef.current}>
      {children}
    </PluginContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get plugin host
 */
export function usePluginHost(): PluginHost {
  const host = useContext(PluginContext);
  if (!host) {
    throw new Error('[usePluginHost] Must be used within PluginProvider');
  }
  return host;
}

/**
 * Get specific plugin
 */
export function usePlugin<T extends Plugin>(name: string): T | undefined {
  const host = usePluginHost();
  return useMemo(() => host.getPlugin<T>(name), [host, name]);
}

/**
 * Get plugin API
 */
export function usePluginApi<T>(pluginName: string): T | undefined {
  const host = usePluginHost();
  return useMemo(() => host.getApi<T>(pluginName), [host, pluginName]);
}

/**
 * Get all plugins
 */
export function usePlugins(): Plugin[] {
  const host = usePluginHost();
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    setPlugins(host.getAllPlugins());

    const unsubscribe = host.on('plugin:loaded', () => {
      setPlugins(host.getAllPlugins());
    });

    return unsubscribe;
  }, [host]);

  return plugins;
}

/**
 * Register plugin dynamically
 */
export function usePluginRegistration() {
  const host = usePluginHost();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const register = useCallback(async (plugin: Plugin) => {
    setIsRegistering(true);
    setError(null);

    try {
      await host.registerPlugin(plugin);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsRegistering(false);
    }
  }, [host]);

  const unregister = useCallback(async (name: string) => {
    setIsRegistering(true);
    setError(null);

    try {
      await host.unregisterPlugin(name);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsRegistering(false);
    }
  }, [host]);

  return {
    register,
    unregister,
    isRegistering,
    error,
  };
}

/**
 * Subscribe to plugin events
 */
export function usePluginEvent(event: string, handler: (data: unknown) => void) {
  const host = usePluginHost();

  useEffect(() => {
    return host.on(event, handler);
  }, [host, event, handler]);
}

/**
 * Call plugin hooks
 */
export function usePluginHook(hookName: string) {
  const host = usePluginHost();

  const call = useCallback(async (...args: unknown[]) => {
    return host.callHook(hookName, ...args);
  }, [host, hookName]);

  return call;
}

/**
 * Get plugin components
 */
export function usePluginComponents(): Record<string, React.ComponentType<unknown>> {
  const plugins = usePlugins();

  return useMemo(() => {
    const components: Record<string, React.ComponentType<unknown>> = {};

    for (const plugin of plugins) {
      if (plugin.components) {
        Object.entries(plugin.components).forEach(([name, component]) => {
          components[`${plugin.name}:${name}`] = component;
        });
      }
    }

    return components;
  }, [plugins]);
}

/**
 * Get plugin routes
 */
export function usePluginRoutes(): PluginRoute[] {
  const plugins = usePlugins();

  return useMemo(() => {
    const routes: PluginRoute[] = [];

    for (const plugin of plugins) {
      if (plugin.routes) {
        routes.push(...plugin.routes);
      }
    }

    return routes;
  }, [plugins]);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createPlugin<TConfig = unknown, TApi = unknown>(
  name: string,
  version: string,
  options: Partial<Omit<Plugin<TConfig, TApi>, 'name' | 'version'>> = {}
): Plugin<TConfig, TApi> {
  return {
    name,
    version,
    ...options,
  };
}

export function createPluginApi<T extends Record<string, unknown>>(api: T): T {
  return api;
}

// ============================================================================
// EXTENSION POINTS
// ============================================================================

export interface ExtensionPoint<T = unknown> {
  name: string;
  extensions: T[];
  register: (extension: T) => void;
  unregister: (extension: T) => void;
  getAll: () => T[];
}

export function createExtensionPoint<T>(name: string): ExtensionPoint<T> {
  const extensions: T[] = [];

  return {
    name,
    extensions,
    register: (extension: T) => {
      if (!extensions.includes(extension)) {
        extensions.push(extension);
      }
    },
    unregister: (extension: T) => {
      const index = extensions.indexOf(extension);
      if (index !== -1) {
        extensions.splice(index, 1);
      }
    },
    getAll: () => [...extensions],
  };
}

export function useExtensionPoint<T>(point: ExtensionPoint<T>): T[] {
  const [extensions, setExtensions] = useState<T[]>(point.getAll());

  useEffect(() => {
    // Re-sync on changes
    const interval = setInterval(() => {
      const current = point.getAll();
      if (current.length !== extensions.length) {
        setExtensions(current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [point, extensions.length]);

  return extensions;
}

export default usePluginHost;
