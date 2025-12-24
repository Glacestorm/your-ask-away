/**
 * KB 4.5 - CQRS Pattern (Command Query Responsibility Segregation)
 * 
 * Separates read and write operations for scalable applications.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Command<TPayload = unknown> {
  type: string;
  payload: TPayload;
  metadata?: CommandMetadata;
}

export interface CommandMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  timestamp?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface CommandResult<TResult = unknown> {
  success: boolean;
  data?: TResult;
  error?: Error;
  commandId: string;
  timestamp: number;
  duration: number;
}

export interface Query<TParams = unknown, TResult = unknown> {
  type: string;
  params: TParams;
  cacheKey?: string;
  cacheTtl?: number;
}

export interface QueryResult<TResult = unknown> {
  data: TResult | null;
  isLoading: boolean;
  error: Error | null;
  isCached: boolean;
  timestamp: number;
}

export type CommandHandler<TPayload = unknown, TResult = unknown> = (
  command: Command<TPayload>
) => Promise<TResult>;

export type QueryHandler<TParams = unknown, TResult = unknown> = (
  query: Query<TParams, TResult>
) => Promise<TResult>;

export interface CommandBus {
  register<TPayload, TResult>(
    type: string,
    handler: CommandHandler<TPayload, TResult>
  ): void;
  dispatch<TPayload, TResult>(command: Command<TPayload>): Promise<CommandResult<TResult>>;
  use(middleware: CommandMiddleware): void;
}

export interface QueryBus {
  register<TParams, TResult>(
    type: string,
    handler: QueryHandler<TParams, TResult>
  ): void;
  execute<TParams, TResult>(query: Query<TParams, TResult>): Promise<QueryResult<TResult>>;
  invalidate(pattern: string | RegExp): void;
}

export type CommandMiddleware = (
  command: Command,
  next: () => Promise<CommandResult>
) => Promise<CommandResult>;

export interface KBCQRSConfig {
  /** Enable command validation */
  validateCommands?: boolean;
  /** Enable query caching */
  cacheQueries?: boolean;
  /** Default cache TTL in ms */
  defaultCacheTtl?: number;
  /** Enable command logging */
  logCommands?: boolean;
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Retry failed commands */
  retryOnError?: boolean;
  /** Max retries */
  maxRetries?: number;
}

// ============================================================================
// COMMAND BUS IMPLEMENTATION
// ============================================================================

class DefaultCommandBus implements CommandBus {
  private handlers = new Map<string, CommandHandler>();
  private middleware: CommandMiddleware[] = [];

  register<TPayload, TResult>(
    type: string,
    handler: CommandHandler<TPayload, TResult>
  ): void {
    this.handlers.set(type, handler as CommandHandler);
  }

  use(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
  }

  async dispatch<TPayload, TResult>(
    command: Command<TPayload>
  ): Promise<CommandResult<TResult>> {
    const startTime = Date.now();
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const handler = this.handlers.get(command.type);
    if (!handler) {
      return {
        success: false,
        error: new Error(`No handler registered for command: ${command.type}`),
        commandId,
        timestamp: Date.now(),
        duration: 0,
      };
    }

    // Create execution chain with middleware
    const executeHandler = async (): Promise<CommandResult<TResult>> => {
      try {
        const result = await handler(command);
        return {
          success: true,
          data: result as TResult,
          commandId,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          commandId,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      }
    };

    // Apply middleware
    let chain = executeHandler;
    for (let i = this.middleware.length - 1; i >= 0; i--) {
      const middleware = this.middleware[i];
      const next = chain;
      chain = () => middleware(command, next);
    }

    return chain();
  }
}

// ============================================================================
// QUERY BUS IMPLEMENTATION
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DefaultQueryBus implements QueryBus {
  private handlers = new Map<string, QueryHandler>();
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTtl: number;

  constructor(defaultTtl = 60000) {
    this.defaultTtl = defaultTtl;
  }

  register<TParams, TResult>(
    type: string,
    handler: QueryHandler<TParams, TResult>
  ): void {
    this.handlers.set(type, handler as QueryHandler);
  }

  async execute<TParams, TResult>(
    query: Query<TParams, TResult>
  ): Promise<QueryResult<TResult>> {
    const cacheKey = query.cacheKey || this.generateCacheKey(query);
    const cacheTtl = query.cacheTtl ?? this.defaultTtl;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        data: cached.data as TResult,
        isLoading: false,
        error: null,
        isCached: true,
        timestamp: cached.timestamp,
      };
    }

    const handler = this.handlers.get(query.type);
    if (!handler) {
      return {
        data: null,
        isLoading: false,
        error: new Error(`No handler registered for query: ${query.type}`),
        isCached: false,
        timestamp: Date.now(),
      };
    }

    try {
      const result = await handler(query);

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: cacheTtl,
      });

      return {
        data: result as TResult,
        isLoading: false,
        error: null,
        isCached: false,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        isCached: false,
        timestamp: Date.now(),
      };
    }
  }

  invalidate(pattern: string | RegExp): void {
    if (typeof pattern === 'string') {
      this.cache.delete(pattern);
    } else {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  private generateCacheKey(query: Query): string {
    return `${query.type}:${JSON.stringify(query.params)}`;
  }
}

// ============================================================================
// SINGLETON BUSES
// ============================================================================

let globalCommandBus: CommandBus | null = null;
let globalQueryBus: QueryBus | null = null;

export function getCommandBus(): CommandBus {
  if (!globalCommandBus) {
    globalCommandBus = new DefaultCommandBus();
  }
  return globalCommandBus;
}

export function getQueryBus(defaultTtl?: number): QueryBus {
  if (!globalQueryBus) {
    globalQueryBus = new DefaultQueryBus(defaultTtl);
  }
  return globalQueryBus;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Main CQRS Hook
 */
export function useKBCQRS(config: KBCQRSConfig = {}) {
  const commandBus = useMemo(() => getCommandBus(), []);
  const queryBus = useMemo(() => getQueryBus(config.defaultCacheTtl), [config.defaultCacheTtl]);

  // Register command handler
  const registerCommand = useCallback(<TPayload, TResult>(
    type: string,
    handler: CommandHandler<TPayload, TResult>
  ) => {
    commandBus.register(type, handler);
  }, [commandBus]);

  // Register query handler
  const registerQuery = useCallback(<TParams, TResult>(
    type: string,
    handler: QueryHandler<TParams, TResult>
  ) => {
    queryBus.register(type, handler);
  }, [queryBus]);

  // Dispatch command
  const dispatchCommand = useCallback(async <TPayload, TResult>(
    type: string,
    payload: TPayload,
    metadata?: CommandMetadata
  ): Promise<CommandResult<TResult>> => {
    const command: Command<TPayload> = {
      type,
      payload,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
    };

    if (config.logCommands) {
      console.log('[CQRS] Command dispatched:', command);
    }

    return commandBus.dispatch<TPayload, TResult>(command);
  }, [commandBus, config.logCommands]);

  // Execute query
  const executeQuery = useCallback(async <TParams, TResult>(
    type: string,
    params: TParams,
    options?: { cacheKey?: string; cacheTtl?: number }
  ): Promise<QueryResult<TResult>> => {
    const query: Query<TParams, TResult> = {
      type,
      params,
      cacheKey: options?.cacheKey,
      cacheTtl: options?.cacheTtl,
    };

    return queryBus.execute(query);
  }, [queryBus]);

  // Invalidate cache
  const invalidateCache = useCallback((pattern: string | RegExp) => {
    queryBus.invalidate(pattern);
  }, [queryBus]);

  // Add middleware
  const useMiddleware = useCallback((middleware: CommandMiddleware) => {
    commandBus.use(middleware);
  }, [commandBus]);

  return {
    registerCommand,
    registerQuery,
    dispatchCommand,
    executeQuery,
    invalidateCache,
    useMiddleware,
  };
}

/**
 * Command Hook - Execute commands with state
 */
export function useKBCommand<TPayload, TResult>(
  type: string,
  handler?: CommandHandler<TPayload, TResult>
) {
  const [state, setState] = useState<{
    isExecuting: boolean;
    lastResult: CommandResult<TResult> | null;
    error: Error | null;
  }>({
    isExecuting: false,
    lastResult: null,
    error: null,
  });

  const commandBus = useMemo(() => getCommandBus(), []);

  // Register handler if provided
  useEffect(() => {
    if (handler) {
      commandBus.register(type, handler);
    }
  }, [commandBus, type, handler]);

  const execute = useCallback(async (
    payload: TPayload,
    metadata?: CommandMetadata
  ): Promise<CommandResult<TResult>> => {
    setState((prev) => ({ ...prev, isExecuting: true, error: null }));

    const command: Command<TPayload> = {
      type,
      payload,
      metadata: { ...metadata, timestamp: Date.now() },
    };

    const result = await commandBus.dispatch<TPayload, TResult>(command);

    setState({
      isExecuting: false,
      lastResult: result,
      error: result.error ?? null,
    });

    return result;
  }, [commandBus, type]);

  const reset = useCallback(() => {
    setState({
      isExecuting: false,
      lastResult: null,
      error: null,
    });
  }, []);

  return {
    execute,
    reset,
    isExecuting: state.isExecuting,
    lastResult: state.lastResult,
    error: state.error,
  };
}

/**
 * Query Hook - Execute queries with caching and state
 */
export function useKBQueryCQRS<TParams, TResult>(
  type: string,
  params: TParams,
  options?: {
    handler?: QueryHandler<TParams, TResult>;
    enabled?: boolean;
    cacheKey?: string;
    cacheTtl?: number;
    refetchOnMount?: boolean;
  }
) {
  const [state, setState] = useState<{
    data: TResult | null;
    isLoading: boolean;
    error: Error | null;
    isCached: boolean;
    lastFetched: Date | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
    isCached: false,
    lastFetched: null,
  });

  const queryBus = useMemo(() => getQueryBus(), []);
  const paramsRef = useRef(params);

  // Register handler if provided
  useEffect(() => {
    if (options?.handler) {
      queryBus.register(type, options.handler);
    }
  }, [queryBus, type, options?.handler]);

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const query: Query<TParams, TResult> = {
      type,
      params: paramsRef.current,
      cacheKey: options?.cacheKey,
      cacheTtl: options?.cacheTtl,
    };

    const result = await queryBus.execute(query);

    setState({
      data: result.data,
      isLoading: false,
      error: result.error,
      isCached: result.isCached,
      lastFetched: new Date(result.timestamp),
    });

    return result;
  }, [queryBus, type, options?.cacheKey, options?.cacheTtl]);

  const refetch = useCallback(() => {
    // Invalidate cache first
    const cacheKey = options?.cacheKey || `${type}:${JSON.stringify(params)}`;
    queryBus.invalidate(cacheKey);
    return fetch();
  }, [queryBus, fetch, type, params, options?.cacheKey]);

  // Auto-fetch on mount and params change
  useEffect(() => {
    paramsRef.current = params;
    
    if (options?.enabled !== false) {
      fetch();
    }
  }, [fetch, params, options?.enabled]);

  return {
    ...state,
    fetch,
    refetch,
  };
}

/**
 * Read Model Hook - Optimized for read operations
 */
export function useKBReadModel<TState>(
  queryType: string,
  initialState: TState,
  options?: {
    pollingInterval?: number;
    suspense?: boolean;
  }
) {
  const [state, setState] = useState<TState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const queryBus = useMemo(() => getQueryBus(), []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    
    const result = await queryBus.execute<void, TState>({
      type: queryType,
      params: undefined,
    });

    if (result.data) {
      setState(result.data);
    }
    
    setIsLoading(false);
  }, [queryBus, queryType]);

  // Polling
  useEffect(() => {
    if (options?.pollingInterval) {
      const interval = setInterval(refresh, options.pollingInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, options?.pollingInterval]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    state,
    isLoading,
    refresh,
  };
}

/**
 * Write Model Hook - Optimized for write operations with optimistic updates
 */
export function useKBWriteModel<TState, TCommand>(
  commandHandlers: Record<string, CommandHandler>,
  options?: {
    optimistic?: boolean;
    onSuccess?: (result: CommandResult) => void;
    onError?: (error: Error) => void;
  }
) {
  const [pendingCommands, setPendingCommands] = useState<Command[]>([]);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const commandBus = useMemo(() => getCommandBus(), []);

  // Register handlers
  useEffect(() => {
    Object.entries(commandHandlers).forEach(([type, handler]) => {
      commandBus.register(type, handler);
    });
  }, [commandBus, commandHandlers]);

  const dispatch = useCallback(async <TPayload>(
    type: string,
    payload: TPayload
  ): Promise<CommandResult> => {
    const command: Command<TPayload> = {
      type,
      payload,
      metadata: { timestamp: Date.now() },
    };

    // Track pending
    setPendingCommands((prev) => [...prev, command]);

    const result = await commandBus.dispatch(command);

    // Remove from pending
    setPendingCommands((prev) => prev.filter((c) => c !== command));
    setLastResult(result);

    if (result.success) {
      options?.onSuccess?.(result);
    } else if (result.error) {
      options?.onError?.(result.error);
    }

    return result;
  }, [commandBus, options]);

  return {
    dispatch,
    pendingCommands,
    lastResult,
    hasPending: pendingCommands.length > 0,
  };
}

// ============================================================================
// MIDDLEWARE FACTORIES
// ============================================================================

export function createLoggingMiddleware(): CommandMiddleware {
  return async (command, next) => {
    console.log('[CQRS] Executing command:', command.type, command.payload);
    const start = Date.now();
    const result = await next();
    console.log('[CQRS] Command completed:', command.type, `${Date.now() - start}ms`, result);
    return result;
  };
}

export function createValidationMiddleware(
  validators: Record<string, (payload: unknown) => boolean | string>
): CommandMiddleware {
  return async (command, next) => {
    const validator = validators[command.type];
    if (validator) {
      const validation = validator(command.payload);
      if (validation !== true) {
        return {
          success: false,
          error: new Error(typeof validation === 'string' ? validation : 'Validation failed'),
          commandId: `cmd-${Date.now()}`,
          timestamp: Date.now(),
          duration: 0,
        };
      }
    }
    return next();
  };
}

export function createRetryMiddleware(maxRetries = 3, delayMs = 1000): CommandMiddleware {
  return async (command, next) => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await next();
      
      if (result.success) {
        return result;
      }

      lastError = result.error;
      
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }

    return {
      success: false,
      error: lastError || new Error('Max retries exceeded'),
      commandId: `cmd-${Date.now()}`,
      timestamp: Date.now(),
      duration: 0,
    };
  };
}

export function createAuditMiddleware(
  auditLog: (command: Command, result: CommandResult) => void
): CommandMiddleware {
  return async (command, next) => {
    const result = await next();
    auditLog(command, result);
    return result;
  };
}

export default useKBCQRS;
