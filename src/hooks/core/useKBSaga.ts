/**
 * KB 4.5 - Saga Pattern
 * 
 * Orchestration pattern for complex multi-step operations with compensation.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface SagaStep<TContext = unknown, TResult = unknown> {
  name: string;
  execute: (context: TContext) => Promise<TResult>;
  compensate?: (context: TContext, result: TResult) => Promise<void>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  condition?: (context: TContext) => boolean;
}

export interface SagaDefinition<TContext = unknown> {
  name: string;
  steps: SagaStep<TContext>[];
  onComplete?: (context: TContext, results: Map<string, unknown>) => void;
  onError?: (context: TContext, error: Error, failedStep: string) => void;
  onCompensated?: (context: TContext) => void;
}

export type SagaStatus =
  | 'idle'
  | 'running'
  | 'compensating'
  | 'completed'
  | 'failed'
  | 'compensated'
  | 'cancelled';

export interface SagaStepResult {
  stepName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'compensated' | 'skipped';
  result?: unknown;
  error?: Error;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

export interface SagaState<TContext = unknown> {
  status: SagaStatus;
  currentStep: string | null;
  context: TContext;
  stepResults: Map<string, SagaStepResult>;
  error: Error | null;
  failedStep: string | null;
  startedAt: number | null;
  completedAt: number | null;
  compensatedSteps: string[];
}

export interface SagaConfig {
  /** Enable automatic compensation on failure */
  autoCompensate?: boolean;
  /** Global timeout for entire saga */
  timeout?: number;
  /** Enable parallel step execution where possible */
  parallel?: boolean;
  /** Retry the entire saga on failure */
  retryOnFail?: boolean;
  /** Max saga retries */
  maxRetries?: number;
  /** Enable logging */
  logging?: boolean;
}

export interface SagaExecutionOptions {
  /** Skip compensation on failure */
  skipCompensation?: boolean;
  /** Custom timeout for this execution */
  timeout?: number;
}

// ============================================================================
// SAGA EXECUTOR
// ============================================================================

class SagaExecutor<TContext> {
  private definition: SagaDefinition<TContext>;
  private config: Required<SagaConfig>;
  private abortController: AbortController | null = null;

  constructor(definition: SagaDefinition<TContext>, config: SagaConfig = {}) {
    this.definition = definition;
    this.config = {
      autoCompensate: config.autoCompensate ?? true,
      timeout: config.timeout ?? 0,
      parallel: config.parallel ?? false,
      retryOnFail: config.retryOnFail ?? false,
      maxRetries: config.maxRetries ?? 3,
      logging: config.logging ?? false,
    };
  }

  async execute(
    initialContext: TContext,
    options: SagaExecutionOptions = {},
    onStateChange?: (state: SagaState<TContext>) => void
  ): Promise<SagaState<TContext>> {
    this.abortController = new AbortController();
    
    const state: SagaState<TContext> = {
      status: 'running',
      currentStep: null,
      context: initialContext,
      stepResults: new Map(),
      error: null,
      failedStep: null,
      startedAt: Date.now(),
      completedAt: null,
      compensatedSteps: [],
    };

    const notifyChange = () => onStateChange?.({ ...state, stepResults: new Map(state.stepResults) });
    const executedSteps: Array<{ step: SagaStep<TContext>; result: unknown }> = [];

    try {
      // Execute steps
      for (const step of this.definition.steps) {
        if (this.abortController.signal.aborted) {
          state.status = 'cancelled';
          notifyChange();
          break;
        }

        // Check condition
        if (step.condition && !step.condition(state.context)) {
          state.stepResults.set(step.name, {
            stepName: step.name,
            status: 'skipped',
          });
          continue;
        }

        state.currentStep = step.name;
        state.stepResults.set(step.name, {
          stepName: step.name,
          status: 'running',
          startedAt: Date.now(),
        });
        notifyChange();

        if (this.config.logging) {
          console.log(`[Saga:${this.definition.name}] Executing step: ${step.name}`);
        }

        try {
          const result = await this.executeStep(step, state.context);
          
          const completedAt = Date.now();
          const stepResult = state.stepResults.get(step.name)!;
          
          state.stepResults.set(step.name, {
            ...stepResult,
            status: 'success',
            result,
            completedAt,
            duration: completedAt - (stepResult.startedAt || completedAt),
          });

          executedSteps.push({ step, result });
          notifyChange();
        } catch (error) {
          const completedAt = Date.now();
          const stepResult = state.stepResults.get(step.name)!;

          state.stepResults.set(step.name, {
            ...stepResult,
            status: 'failed',
            error: error instanceof Error ? error : new Error(String(error)),
            completedAt,
            duration: completedAt - (stepResult.startedAt || completedAt),
          });

          state.error = error instanceof Error ? error : new Error(String(error));
          state.failedStep = step.name;
          state.status = 'failed';
          notifyChange();

          this.definition.onError?.(state.context, state.error, step.name);

          // Compensate if enabled
          if (this.config.autoCompensate && !options.skipCompensation) {
            await this.compensate(state, executedSteps, notifyChange);
          }

          return state;
        }
      }

      if (state.status !== 'cancelled') {
        state.status = 'completed';
        state.completedAt = Date.now();
        notifyChange();

        this.definition.onComplete?.(state.context, state.stepResults);
      }
    } catch (error) {
      state.error = error instanceof Error ? error : new Error(String(error));
      state.status = 'failed';
      notifyChange();
    }

    return state;
  }

  private async executeStep(step: SagaStep<TContext>, context: TContext): Promise<unknown> {
    const retries = step.retries ?? 0;
    const retryDelay = step.retryDelay ?? 1000;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create timeout promise if needed
        const timeoutMs = step.timeout || this.config.timeout;
        
        if (timeoutMs > 0) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Step ${step.name} timed out after ${timeoutMs}ms`)), timeoutMs);
          });
          
          return await Promise.race([step.execute(context), timeoutPromise]);
        }

        return await step.execute(context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retries) {
          if (this.config.logging) {
            console.log(`[Saga:${this.definition.name}] Step ${step.name} failed, retrying (${attempt + 1}/${retries})`);
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  private async compensate(
    state: SagaState<TContext>,
    executedSteps: Array<{ step: SagaStep<TContext>; result: unknown }>,
    notifyChange: () => void
  ): Promise<void> {
    state.status = 'compensating';
    notifyChange();

    if (this.config.logging) {
      console.log(`[Saga:${this.definition.name}] Starting compensation...`);
    }

    // Compensate in reverse order
    for (let i = executedSteps.length - 1; i >= 0; i--) {
      const { step, result } = executedSteps[i];

      if (step.compensate) {
        try {
          if (this.config.logging) {
            console.log(`[Saga:${this.definition.name}] Compensating step: ${step.name}`);
          }

          await step.compensate(state.context, result);
          state.compensatedSteps.push(step.name);
          
          const stepResult = state.stepResults.get(step.name)!;
          state.stepResults.set(step.name, {
            ...stepResult,
            status: 'compensated',
          });
          notifyChange();
        } catch (error) {
          console.error(`[Saga:${this.definition.name}] Compensation failed for step ${step.name}:`, error);
          // Continue compensating other steps
        }
      }
    }

    state.status = 'compensated';
    state.completedAt = Date.now();
    notifyChange();

    this.definition.onCompensated?.(state.context);
  }

  cancel(): void {
    this.abortController?.abort();
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Main Saga Hook
 */
export function useKBSaga<TContext>(
  definition: SagaDefinition<TContext>,
  config: SagaConfig = {}
) {
  const [state, setState] = useState<SagaState<TContext>>({
    status: 'idle',
    currentStep: null,
    context: {} as TContext,
    stepResults: new Map(),
    error: null,
    failedStep: null,
    startedAt: null,
    completedAt: null,
    compensatedSteps: [],
  });

  const executorRef = useRef<SagaExecutor<TContext> | null>(null);

  // Create executor
  useMemo(() => {
    executorRef.current = new SagaExecutor(definition, config);
  }, [definition, config]);

  const execute = useCallback(async (
    initialContext: TContext,
    options?: SagaExecutionOptions
  ): Promise<SagaState<TContext>> => {
    if (!executorRef.current) return state;

    setState((prev) => ({
      ...prev,
      status: 'running',
      context: initialContext,
      stepResults: new Map(),
      error: null,
      failedStep: null,
      startedAt: Date.now(),
      completedAt: null,
      compensatedSteps: [],
    }));

    return executorRef.current.execute(initialContext, options, setState);
  }, [state]);

  const cancel = useCallback(() => {
    executorRef.current?.cancel();
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      currentStep: null,
      context: {} as TContext,
      stepResults: new Map(),
      error: null,
      failedStep: null,
      startedAt: null,
      completedAt: null,
      compensatedSteps: [],
    });
  }, []);

  // Computed values
  const progress = useMemo(() => {
    const total = definition.steps.length;
    const completed = Array.from(state.stepResults.values())
      .filter((r) => r.status === 'success' || r.status === 'skipped').length;
    return total > 0 ? (completed / total) * 100 : 0;
  }, [definition.steps.length, state.stepResults]);

  const duration = useMemo(() => {
    if (!state.startedAt) return 0;
    const end = state.completedAt || Date.now();
    return end - state.startedAt;
  }, [state.startedAt, state.completedAt]);

  return {
    // State
    status: state.status,
    currentStep: state.currentStep,
    context: state.context,
    stepResults: state.stepResults,
    error: state.error,
    failedStep: state.failedStep,
    compensatedSteps: state.compensatedSteps,
    
    // Computed
    progress,
    duration,
    isRunning: state.status === 'running' || state.status === 'compensating',
    isCompleted: state.status === 'completed',
    isFailed: state.status === 'failed',
    isCompensated: state.status === 'compensated',

    // Actions
    execute,
    cancel,
    reset,
  };
}

/**
 * Saga Step Builder Hook
 */
export function useKBSagaBuilder<TContext>() {
  const stepsRef = useRef<SagaStep<TContext>[]>([]);

  const addStep = useCallback((step: SagaStep<TContext>) => {
    stepsRef.current.push(step);
    return stepsRef.current.length - 1;
  }, []);

  const removeStep = useCallback((index: number) => {
    stepsRef.current.splice(index, 1);
  }, []);

  const clearSteps = useCallback(() => {
    stepsRef.current = [];
  }, []);

  const build = useCallback((
    name: string,
    options?: Partial<Omit<SagaDefinition<TContext>, 'name' | 'steps'>>
  ): SagaDefinition<TContext> => {
    return {
      name,
      steps: [...stepsRef.current],
      ...options,
    };
  }, []);

  return {
    steps: stepsRef.current,
    addStep,
    removeStep,
    clearSteps,
    build,
  };
}

/**
 * Orchestrator Hook - For coordinating multiple sagas
 */
export function useKBOrchestrator<TContext>(
  sagas: SagaDefinition<TContext>[],
  config: SagaConfig & { sequential?: boolean } = {}
) {
  const [states, setStates] = useState<Map<string, SagaState<TContext>>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const executorsRef = useRef<Map<string, SagaExecutor<TContext>>>(new Map());

  // Create executors
  useMemo(() => {
    sagas.forEach((saga) => {
      executorsRef.current.set(saga.name, new SagaExecutor(saga, config));
    });
  }, [sagas, config]);

  const executeAll = useCallback(async (context: TContext): Promise<Map<string, SagaState<TContext>>> => {
    setIsRunning(true);
    const results = new Map<string, SagaState<TContext>>();

    const updateState = (sagaName: string, state: SagaState<TContext>) => {
      results.set(sagaName, state);
      setStates(new Map(results));
    };

    if (config.sequential) {
      // Execute sequentially
      for (const saga of sagas) {
        const executor = executorsRef.current.get(saga.name);
        if (executor) {
          const result = await executor.execute(context, {}, (state) => updateState(saga.name, state));
          results.set(saga.name, result);
          
          // Stop if failed
          if (result.status === 'failed') break;
        }
      }
    } else {
      // Execute in parallel
      const promises = sagas.map((saga) => {
        const executor = executorsRef.current.get(saga.name);
        if (executor) {
          return executor.execute(context, {}, (state) => updateState(saga.name, state));
        }
        return Promise.resolve(null);
      });

      const allResults = await Promise.all(promises);
      allResults.forEach((result, i) => {
        if (result) {
          results.set(sagas[i].name, result);
        }
      });
    }

    setIsRunning(false);
    return results;
  }, [sagas, config.sequential]);

  const cancelAll = useCallback(() => {
    executorsRef.current.forEach((executor) => executor.cancel());
  }, []);

  const getState = useCallback((sagaName: string) => {
    return states.get(sagaName);
  }, [states]);

  return {
    states,
    isRunning,
    executeAll,
    cancelAll,
    getState,
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createSaga<TContext>(
  name: string,
  steps: SagaStep<TContext>[],
  options?: Partial<Omit<SagaDefinition<TContext>, 'name' | 'steps'>>
): SagaDefinition<TContext> {
  return {
    name,
    steps,
    ...options,
  };
}

export function createStep<TContext, TResult = unknown>(
  name: string,
  execute: (context: TContext) => Promise<TResult>,
  options?: Partial<Omit<SagaStep<TContext, TResult>, 'name' | 'execute'>>
): SagaStep<TContext, TResult> {
  return {
    name,
    execute,
    ...options,
  };
}

// ============================================================================
// COMMON STEP TEMPLATES
// ============================================================================

export function createApiStep<TContext, TResult>(
  name: string,
  fetcher: (context: TContext) => Promise<TResult>,
  options?: {
    retries?: number;
    timeout?: number;
    compensate?: (context: TContext, result: TResult) => Promise<void>;
  }
): SagaStep<TContext, TResult> {
  return {
    name,
    execute: fetcher,
    compensate: options?.compensate,
    retries: options?.retries ?? 3,
    timeout: options?.timeout ?? 30000,
  };
}

export function createDbStep<TContext, TResult>(
  name: string,
  operation: (context: TContext) => Promise<TResult>,
  rollback: (context: TContext, result: TResult) => Promise<void>
): SagaStep<TContext, TResult> {
  return {
    name,
    execute: operation,
    compensate: rollback,
  };
}

export function createNotificationStep<TContext>(
  name: string,
  notify: (context: TContext) => Promise<void>
): SagaStep<TContext, void> {
  return {
    name,
    execute: notify,
    // No compensation needed for notifications
  };
}

export default useKBSaga;
