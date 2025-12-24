/**
 * KB 5.0 - Compose Hook
 * Functional composition of multiple hooks and operations
 * Enables complex hook combinations with dependency injection
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { KBStatus, KBError, KBHookReturn } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ComposableHook<TInput = void, TOutput = unknown> {
  id: string;
  name: string;
  /** The hook execution function */
  execute: (input: TInput, context: ComposeContext) => Promise<TOutput>;
  /** Dependencies on other hooks (by id) */
  dependencies?: string[];
  /** Condition to run this hook */
  condition?: (context: ComposeContext) => boolean;
  /** Transform the input before execution */
  transformInput?: (input: TInput, context: ComposeContext) => TInput | Promise<TInput>;
  /** Transform the output after execution */
  transformOutput?: (output: TOutput, context: ComposeContext) => TOutput | Promise<TOutput>;
  /** Error handler */
  onError?: (error: Error, context: ComposeContext) => TOutput | null;
  /** Retry config */
  retry?: {
    maxAttempts: number;
    delayMs: number;
  };
  /** Memoization key */
  memoKey?: (input: TInput) => string;
}

export interface ComposeContext {
  compositionId: string;
  startTime: number;
  results: Map<string, unknown>;
  errors: Map<string, KBError>;
  completed: Set<string>;
  pending: Set<string>;
  variables: Record<string, unknown>;
}

export interface ComposeResult<T> {
  success: boolean;
  data: T | null;
  error: KBError | null;
  results: Map<string, unknown>;
  errors: Map<string, KBError>;
  duration: number;
  completed: string[];
  failed: string[];
}

export interface ComposeConfig {
  /** Maximum parallel executions */
  maxParallel: number;
  /** Continue on individual hook failure */
  continueOnError: boolean;
  /** Enable logging */
  logging: boolean;
  /** Timeout for entire composition */
  timeout?: number;
  /** On hook complete */
  onHookComplete?: (hookId: string, result: unknown) => void;
  /** On hook error */
  onHookError?: (hookId: string, error: KBError) => void;
  /** On composition complete */
  onComplete?: (result: ComposeResult<unknown>) => void;
}

export interface UseKBComposeOptions<T> {
  name: string;
  hooks: ComposableHook[];
  config?: Partial<ComposeConfig>;
  /** Transform all results into final output */
  combineResults?: (results: Map<string, unknown>) => T;
}

export interface UseKBComposeReturn<T> {
  // State
  status: KBStatus;
  result: ComposeResult<T> | null;
  progress: number;
  pendingHooks: string[];
  
  // Computed
  isIdle: boolean;
  isRunning: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // Actions
  execute: (input?: unknown) => Promise<ComposeResult<T>>;
  abort: () => void;
  reset: () => void;
  
  // Results access
  getHookResult: <R = unknown>(hookId: string) => R | undefined;
  getHookError: (hookId: string) => KBError | undefined;
  
  // Context
  context: ComposeContext | null;
  setVariable: (key: string, value: unknown) => void;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: ComposeConfig = {
  maxParallel: 5,
  continueOnError: false,
  logging: false,
};

// ============================================================================
// TOPOLOGICAL SORT
// ============================================================================

function topologicalSort(hooks: ComposableHook[]): ComposableHook[] {
  const visited = new Set<string>();
  const result: ComposableHook[] = [];
  const hookMap = new Map(hooks.map(h => [h.id, h]));

  function visit(hookId: string, ancestors: Set<string> = new Set()) {
    if (ancestors.has(hookId)) {
      throw new Error(`Circular dependency detected: ${hookId}`);
    }
    if (visited.has(hookId)) return;

    const hook = hookMap.get(hookId);
    if (!hook) return;

    ancestors.add(hookId);

    for (const dep of hook.dependencies ?? []) {
      visit(dep, new Set(ancestors));
    }

    visited.add(hookId);
    result.push(hook);
  }

  for (const hook of hooks) {
    visit(hook.id);
  }

  return result;
}

// ============================================================================
// HOOK
// ============================================================================

export function useKBCompose<T = unknown>(
  options: UseKBComposeOptions<T>
): UseKBComposeReturn<T> {
  const {
    name,
    hooks,
    config: userConfig,
    combineResults,
  } = options;

  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Sort hooks by dependencies
  const sortedHooks = useMemo(() => {
    try {
      return topologicalSort(hooks);
    } catch {
      console.error('Failed to sort hooks, using original order');
      return hooks;
    }
  }, [hooks]);

  // State
  const [status, setStatus] = useState<KBStatus>('idle');
  const [result, setResult] = useState<ComposeResult<T> | null>(null);
  const [progress, setProgress] = useState(0);
  const [pendingHooks, setPendingHooks] = useState<string[]>([]);
  const [context, setContext] = useState<ComposeContext | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const memoCache = useRef<Map<string, unknown>>(new Map());
  const isMountedRef = useRef(true);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Create error helper
  const createError = useCallback((
    code: string,
    message: string,
    originalError?: unknown
  ): KBError => ({
    code,
    message,
    details: { composition: name },
    timestamp: new Date(),
    retryable: false,
    originalError,
  }), [name]);

  // Log helper
  const log = useCallback((message: string, data?: unknown) => {
    if (config.logging) {
      console.log(`[Compose:${name}] ${message}`, data ?? '');
    }
  }, [name, config.logging]);

  // Execute single hook with retry
  const executeHook = useCallback(async (
    hook: ComposableHook,
    input: unknown,
    ctx: ComposeContext
  ): Promise<unknown> => {
    const maxAttempts = hook.retry?.maxAttempts ?? 1;
    const delayMs = hook.retry?.delayMs ?? 1000;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Transform input
        let transformedInput = input;
        if (hook.transformInput) {
          transformedInput = await hook.transformInput(input as never, ctx);
        }

        // Execute
        let output = await hook.execute(transformedInput as never, ctx);

        // Transform output
        if (hook.transformOutput) {
          output = await hook.transformOutput(output as never, ctx);
        }

        return output;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }, []);

  // Main execute function
  const execute = useCallback(async (
    input?: unknown
  ): Promise<ComposeResult<T>> => {
    if (!isMountedRef.current) {
      return {
        success: false,
        data: null,
        error: createError('UNMOUNTED', 'Component unmounted'),
        results: new Map(),
        errors: new Map(),
        duration: 0,
        completed: [],
        failed: [],
      };
    }

    // Reset
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const compositionId = `compose_${Date.now()}`;
    const startTime = Date.now();
    const results = new Map<string, unknown>();
    const errors = new Map<string, KBError>();
    const completed = new Set<string>();
    const pending = new Set<string>();

    const ctx: ComposeContext = {
      compositionId,
      startTime,
      results,
      errors,
      completed,
      pending,
      variables: {},
    };

    setStatus('loading');
    setContext(ctx);
    setProgress(0);
    setPendingHooks(sortedHooks.map(h => h.id));
    log('Starting composition', { input });

    let globalError: KBError | null = null;

    try {
      // Process hooks respecting dependencies
      const executeWithTimeout = async () => {
        let completedCount = 0;

        for (const hook of sortedHooks) {
          // Check abort
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Composition aborted');
          }

          // Check dependencies completed
          const depsCompleted = (hook.dependencies ?? []).every(dep => completed.has(dep));
          if (!depsCompleted) {
            const missingDeps = (hook.dependencies ?? []).filter(dep => !completed.has(dep));
            throw new Error(`Dependencies not met for ${hook.id}: ${missingDeps.join(', ')}`);
          }

          // Check condition
          if (hook.condition && !hook.condition(ctx)) {
            log(`Skipped hook: ${hook.id}`);
            completedCount++;
            setProgress((completedCount / sortedHooks.length) * 100);
            continue;
          }

          // Check memo cache
          if (hook.memoKey) {
            const key = hook.memoKey(input as never);
            if (memoCache.current.has(key)) {
              const cachedResult = memoCache.current.get(key);
              results.set(hook.id, cachedResult);
              completed.add(hook.id);
              completedCount++;
              log(`Cache hit for hook: ${hook.id}`);
              setProgress((completedCount / sortedHooks.length) * 100);
              continue;
            }
          }

          pending.add(hook.id);
          setPendingHooks([...pending]);

          try {
            // Get input from dependencies or use initial input
            let hookInput = input;
            if (hook.dependencies && hook.dependencies.length > 0) {
              // Use last dependency's result as input
              hookInput = results.get(hook.dependencies[hook.dependencies.length - 1]);
            }

            const output = await executeHook(hook, hookInput, ctx);

            results.set(hook.id, output);
            completed.add(hook.id);

            // Cache if memoKey provided
            if (hook.memoKey) {
              const key = hook.memoKey(input as never);
              memoCache.current.set(key, output);
            }

            log(`Hook completed: ${hook.id}`, { output });
            config.onHookComplete?.(hook.id, output);

          } catch (err) {
            const kbError = createError(
              'HOOK_FAILED',
              `Hook ${hook.id} failed: ${err instanceof Error ? err.message : String(err)}`,
              err
            );

            errors.set(hook.id, kbError);
            config.onHookError?.(hook.id, kbError);

            // Try error handler
            if (hook.onError) {
              const fallback = hook.onError(
                err instanceof Error ? err : new Error(String(err)),
                ctx
              );
              if (fallback !== null) {
                results.set(hook.id, fallback);
                completed.add(hook.id);
              } else if (!config.continueOnError) {
                throw err;
              }
            } else if (!config.continueOnError) {
              throw err;
            }
          }

          pending.delete(hook.id);
          completedCount++;
          setProgress((completedCount / sortedHooks.length) * 100);
          setPendingHooks([...pending]);
        }
      };

      if (config.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Composition timed out after ${config.timeout}ms`)), config.timeout);
        });
        await Promise.race([executeWithTimeout(), timeoutPromise]);
      } else {
        await executeWithTimeout();
      }

    } catch (err) {
      globalError = createError(
        'COMPOSITION_FAILED',
        err instanceof Error ? err.message : 'Composition failed',
        err
      );
      log('Composition failed', { error: globalError });
    }

    const duration = Date.now() - startTime;
    const success = !globalError && errors.size === 0;

    // Combine results
    let data: T | null = null;
    if (success && combineResults) {
      try {
        data = combineResults(results);
      } catch {
        data = null;
      }
    } else if (success && sortedHooks.length > 0) {
      // Return last hook's result
      const lastHook = sortedHooks[sortedHooks.length - 1];
      data = results.get(lastHook.id) as T;
    }

    const composeResult: ComposeResult<T> = {
      success,
      data,
      error: globalError,
      results,
      errors,
      duration,
      completed: [...completed],
      failed: [...errors.keys()],
    };

    if (isMountedRef.current) {
      setStatus(success ? 'success' : 'error');
      setResult(composeResult);
      setPendingHooks([]);
      setProgress(100);
    }

    log('Composition completed', { duration, success });
    config.onComplete?.(composeResult as ComposeResult<unknown>);

    return composeResult;
  }, [name, sortedHooks, config, combineResults, createError, executeHook, log]);

  // Abort
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
    setPendingHooks([]);
  }, []);

  // Reset
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setProgress(0);
    setPendingHooks([]);
    setContext(null);
  }, []);

  // Get hook result
  const getHookResult = useCallback(<R = unknown>(hookId: string): R | undefined => {
    return context?.results.get(hookId) as R | undefined;
  }, [context]);

  // Get hook error
  const getHookError = useCallback((hookId: string): KBError | undefined => {
    return context?.errors.get(hookId);
  }, [context]);

  // Set variable
  const setVariable = useCallback((key: string, value: unknown) => {
    if (context) {
      context.variables[key] = value;
      setContext({ ...context });
    }
  }, [context]);

  return {
    // State
    status,
    result,
    progress,
    pendingHooks,
    
    // Computed
    isIdle: status === 'idle',
    isRunning: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    
    // Actions
    execute,
    abort,
    reset,
    
    // Results access
    getHookResult,
    getHookError,
    
    // Context
    context,
    setVariable,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create a composable hook
 */
export function createComposableHook<TInput = void, TOutput = unknown>(
  id: string,
  name: string,
  execute: ComposableHook<TInput, TOutput>['execute'],
  options?: Partial<Omit<ComposableHook<TInput, TOutput>, 'id' | 'name' | 'execute'>>
): ComposableHook<TInput, TOutput> {
  return {
    id,
    name,
    execute,
    ...options,
  };
}

/**
 * Create a hook with dependencies
 */
export function withDependencies<TInput = void, TOutput = unknown>(
  hook: ComposableHook<TInput, TOutput>,
  dependencies: string[]
): ComposableHook<TInput, TOutput> {
  return {
    ...hook,
    dependencies,
  };
}

/**
 * Compose multiple hooks into one
 */
export function composeHooks<T>(
  id: string,
  name: string,
  hooks: ComposableHook[],
  combiner: (results: Map<string, unknown>) => T
): ComposableHook<void, T> {
  return {
    id,
    name,
    execute: async (_, context) => {
      const results = new Map<string, unknown>();
      for (const hook of hooks) {
        const result = await hook.execute(undefined, context);
        results.set(hook.id, result);
      }
      return combiner(results);
    },
  };
}

/**
 * Create a parallel execution group
 */
export function parallel<T>(
  id: string,
  name: string,
  hooks: ComposableHook[]
): ComposableHook<void, T[]> {
  return {
    id,
    name,
    execute: async (_, context) => {
      const results = await Promise.all(
        hooks.map(hook => hook.execute(undefined, context))
      );
      return results as T[];
    },
  };
}

/**
 * Create a sequential execution chain
 */
export function sequential<T>(
  id: string,
  name: string,
  hooks: ComposableHook<unknown, unknown>[]
): ComposableHook<unknown, T> {
  return {
    id,
    name,
    execute: async (input, context) => {
      let current = input;
      for (const hook of hooks) {
        current = await hook.execute(current, context);
      }
      return current as T;
    },
  };
}

export default useKBCompose;
