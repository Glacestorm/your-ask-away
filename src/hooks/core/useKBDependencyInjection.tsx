/**
 * KB 4.5 - Dependency Injection & IoC Container
 * 
 * Enterprise-grade dependency injection pattern for React applications.
 */

import { createContext, useContext, useCallback, useMemo, useRef, useEffect, useState, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ServiceIdentifier<T = unknown> = symbol | string | { new (...args: unknown[]): T };

export interface ServiceDescriptor<T = unknown> {
  identifier: ServiceIdentifier<T>;
  factory: () => T;
  lifetime: 'singleton' | 'transient' | 'scoped';
  dependencies?: ServiceIdentifier[];
  lazy?: boolean;
  tags?: string[];
}

export interface ServiceRegistration<T = unknown> {
  instance?: T;
  descriptor: ServiceDescriptor<T>;
  resolved: boolean;
}

export interface IContainer {
  register<T>(descriptor: ServiceDescriptor<T>): void;
  resolve<T>(identifier: ServiceIdentifier<T>): T;
  resolveAll<T>(tag: string): T[];
  has(identifier: ServiceIdentifier): boolean;
  createScope(): IContainer;
  dispose(): void;
}

export interface ContainerConfig {
  /** Enable strict mode - throws on unregistered dependencies */
  strict?: boolean;
  /** Enable auto-wire for class constructors */
  autoWire?: boolean;
  /** Parent container for hierarchical DI */
  parent?: IContainer;
  /** Enable lifecycle hooks */
  enableLifecycle?: boolean;
}

export interface ServiceLifecycle {
  onInit?: () => void | Promise<void>;
  onDispose?: () => void | Promise<void>;
}

// ============================================================================
// CONTAINER IMPLEMENTATION
// ============================================================================

class Container implements IContainer {
  private services: Map<ServiceIdentifier, ServiceRegistration> = new Map();
  private scopedInstances: Map<ServiceIdentifier, unknown> = new Map();
  private config: Required<ContainerConfig>;
  private parent?: IContainer;
  private disposed = false;

  constructor(config: ContainerConfig = {}) {
    this.config = {
      strict: config.strict ?? true,
      autoWire: config.autoWire ?? false,
      parent: config.parent,
      enableLifecycle: config.enableLifecycle ?? true,
    };
    this.parent = config.parent;
  }

  register<T>(descriptor: ServiceDescriptor<T>): void {
    if (this.disposed) {
      throw new Error('[Container] Cannot register on disposed container');
    }

    this.services.set(descriptor.identifier, {
      descriptor: descriptor as ServiceDescriptor,
      resolved: false,
    });
  }

  resolve<T>(identifier: ServiceIdentifier<T>): T {
    if (this.disposed) {
      throw new Error('[Container] Cannot resolve from disposed container');
    }

    const registration = this.services.get(identifier);

    if (!registration) {
      // Try parent container
      if (this.parent?.has(identifier)) {
        return this.parent.resolve(identifier);
      }

      if (this.config.strict) {
        throw new Error(`[Container] Service not registered: ${String(identifier)}`);
      }
      return undefined as T;
    }

    const { descriptor } = registration;

    // Handle different lifetimes
    switch (descriptor.lifetime) {
      case 'singleton': {
        if (!registration.resolved) {
          registration.instance = this.createInstance(descriptor);
          registration.resolved = true;
        }
        return registration.instance as T;
      }
      case 'scoped': {
        if (!this.scopedInstances.has(identifier)) {
          this.scopedInstances.set(identifier, this.createInstance(descriptor));
        }
        return this.scopedInstances.get(identifier) as T;
      }
      case 'transient':
      default:
        return this.createInstance(descriptor) as T;
    }
  }

  resolveAll<T>(tag: string): T[] {
    const results: T[] = [];
    
    this.services.forEach((registration) => {
      if (registration.descriptor.tags?.includes(tag)) {
        results.push(this.resolve(registration.descriptor.identifier) as T);
      }
    });

    return results;
  }

  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier) || (this.parent?.has(identifier) ?? false);
  }

  createScope(): IContainer {
    const scopedContainer = new Container({
      ...this.config,
      parent: this,
    });

    // Copy registrations but not instances
    this.services.forEach((registration, identifier) => {
      if (registration.descriptor.lifetime === 'scoped') {
        scopedContainer.register({ ...registration.descriptor });
      }
    });

    return scopedContainer;
  }

  dispose(): void {
    if (this.disposed) return;

    // Dispose singletons with lifecycle
    this.services.forEach((registration) => {
      if (registration.resolved && registration.instance) {
        const instance = registration.instance as ServiceLifecycle;
        if (instance.onDispose) {
          try {
            instance.onDispose();
          } catch (e) {
            console.error('[Container] Error disposing service:', e);
          }
        }
      }
    });

    this.services.clear();
    this.scopedInstances.clear();
    this.disposed = true;
  }

  private createInstance<T>(descriptor: ServiceDescriptor<T>): T {
    // Resolve dependencies first
    const deps = descriptor.dependencies?.map((dep) => this.resolve(dep)) ?? [];
    
    // Create instance
    const instance = descriptor.factory();

    // Call lifecycle hook
    if (this.config.enableLifecycle) {
      const lifecycle = instance as ServiceLifecycle;
      if (lifecycle.onInit) {
        try {
          lifecycle.onInit();
        } catch (e) {
          console.error('[Container] Error initializing service:', e);
        }
      }
    }

    return instance;
  }
}

// ============================================================================
// REACT CONTEXT
// ============================================================================

const ContainerContext = createContext<IContainer | null>(null);

export interface ContainerProviderProps {
  container: IContainer;
  children: ReactNode;
}

export function ContainerProvider({ container, children }: ContainerProviderProps) {
  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get the container instance
 */
export function useContainer(): IContainer {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error('[useContainer] Must be used within ContainerProvider');
  }
  return container;
}

/**
 * Resolve a service from the container
 */
export function useService<T>(identifier: ServiceIdentifier<T>): T {
  const container = useContainer();
  return useMemo(() => container.resolve(identifier), [container, identifier]);
}

/**
 * Resolve all services with a specific tag
 */
export function useServices<T>(tag: string): T[] {
  const container = useContainer();
  return useMemo(() => container.resolveAll<T>(tag), [container, tag]);
}

/**
 * Create a scoped container for component subtree
 */
export function useScopedContainer(): IContainer {
  const parent = useContainer();
  const scopedRef = useRef<IContainer | null>(null);

  if (!scopedRef.current) {
    scopedRef.current = parent.createScope();
  }

  useEffect(() => {
    return () => {
      scopedRef.current?.dispose();
    };
  }, []);

  return scopedRef.current;
}

/**
 * Register services dynamically
 */
export function useServiceRegistration() {
  const container = useContainer();

  const register = useCallback(<T,>(descriptor: ServiceDescriptor<T>) => {
    container.register(descriptor);
  }, [container]);

  const registerSingleton = useCallback(<T,>(
    identifier: ServiceIdentifier<T>,
    factory: () => T,
    options?: Partial<ServiceDescriptor<T>>
  ) => {
    container.register({
      identifier,
      factory,
      lifetime: 'singleton',
      ...options,
    });
  }, [container]);

  const registerTransient = useCallback(<T,>(
    identifier: ServiceIdentifier<T>,
    factory: () => T,
    options?: Partial<ServiceDescriptor<T>>
  ) => {
    container.register({
      identifier,
      factory,
      lifetime: 'transient',
      ...options,
    });
  }, [container]);

  const registerScoped = useCallback(<T,>(
    identifier: ServiceIdentifier<T>,
    factory: () => T,
    options?: Partial<ServiceDescriptor<T>>
  ) => {
    container.register({
      identifier,
      factory,
      lifetime: 'scoped',
      ...options,
    });
  }, [container]);

  return {
    register,
    registerSingleton,
    registerTransient,
    registerScoped,
  };
}

/**
 * Lazy service resolution
 */
export function useLazyService<T>(identifier: ServiceIdentifier<T>): [() => T, boolean] {
  const container = useContainer();
  const [resolved, setResolved] = useState(false);
  const instanceRef = useRef<T | null>(null);

  const getService = useCallback(() => {
    if (!instanceRef.current) {
      instanceRef.current = container.resolve(identifier);
      setResolved(true);
    }
    return instanceRef.current;
  }, [container, identifier]);

  return [getService, resolved];
}

/**
 * Optional service (doesn't throw if not found)
 */
export function useOptionalService<T>(identifier: ServiceIdentifier<T>): T | null {
  const container = useContainer();
  
  return useMemo(() => {
    try {
      if (container.has(identifier)) {
        return container.resolve(identifier);
      }
      return null;
    } catch {
      return null;
    }
  }, [container, identifier]);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createContainer(config?: ContainerConfig): IContainer {
  return new Container(config);
}

export function createServiceDescriptor<T>(
  identifier: ServiceIdentifier<T>,
  factory: () => T,
  options: Partial<Omit<ServiceDescriptor<T>, 'identifier' | 'factory'>> = {}
): ServiceDescriptor<T> {
  return {
    identifier,
    factory,
    lifetime: options.lifetime ?? 'singleton',
    dependencies: options.dependencies,
    lazy: options.lazy ?? false,
    tags: options.tags,
  };
}

// Service identifier helpers
export function createServiceIdentifier<T>(name: string): ServiceIdentifier<T> {
  return Symbol.for(`service:${name}`);
}

// ============================================================================
// DECORATORS (for class-based DI)
// ============================================================================

const metadataKey = Symbol('inject:metadata');

export function Injectable(options?: Partial<ServiceDescriptor>): ClassDecorator {
  return ((target: Function) => {
    // Store metadata on the function itself
    Object.defineProperty(target, metadataKey, { value: options || {}, writable: true });
    return target;
  }) as ClassDecorator;
}

export function Inject(identifier: ServiceIdentifier): ParameterDecorator {
  return ((target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjections: unknown[] = (target as { [key: symbol]: unknown[] })[metadataKey] || [];
    existingInjections[parameterIndex] = identifier;
    Object.defineProperty(target, metadataKey, { value: existingInjections, writable: true });
  }) as ParameterDecorator;
}

// ============================================================================
// MODULE SYSTEM
// ============================================================================

export interface ModuleDefinition {
  name: string;
  services: ServiceDescriptor[];
  imports?: ModuleDefinition[];
  exports?: ServiceIdentifier[];
}

export function createModule(definition: ModuleDefinition): ModuleDefinition {
  return definition;
}

export function registerModule(container: IContainer, module: ModuleDefinition): void {
  // Register imported modules first
  if (module.imports) {
    for (const importedModule of module.imports) {
      registerModule(container, importedModule);
    }
  }

  // Register services
  for (const descriptor of module.services) {
    container.register(descriptor);
  }
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

export function createMockContainer(overrides: Map<ServiceIdentifier, unknown> = new Map()): IContainer {
  const container = createContainer({ strict: false });
  
  return {
    register: container.register.bind(container),
    resolve: <T,>(identifier: ServiceIdentifier<T>): T => {
      if (overrides.has(identifier)) {
        return overrides.get(identifier) as T;
      }
      return container.resolve(identifier);
    },
    resolveAll: container.resolveAll.bind(container),
    has: (identifier) => overrides.has(identifier) || container.has(identifier),
    createScope: container.createScope.bind(container),
    dispose: container.dispose.bind(container),
  };
}

export default useService;
