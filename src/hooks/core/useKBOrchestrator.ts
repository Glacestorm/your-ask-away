/**
 * KB 5.0 - Orchestrator Hook
 * Advanced workflow orchestration with step-by-step execution,
 * compensation (rollback), conditional branching, and parallel execution
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { KBStatus, KBError } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface OrchestratorStep<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  execute: (input: TInput, context: OrchestratorContext) => Promise<TOutput>;
  compensate?: (input: TInput, output: TOutput, context: OrchestratorContext) => Promise<void>;
  validate?: (input: TInput, context: OrchestratorContext) => boolean | Promise<boolean>;
  timeout?: number;
  retry?: {
    maxAttempts: number;
    delayMs: number;
    backoff?: number;
  };
  condition?: (context: OrchestratorContext) => boolean;
  onSuccess?: (output: TOutput, context: OrchestratorContext) => void;
  onError?: (error: KBError, context: OrchestratorContext) => void;
}

export interface OrchestratorContext {
  stepResults: Map<string, unknown>;
  metadata: Record<string, unknown>;
  startTime: number;
  currentStep: string;
  completedSteps: string[];
  failedSteps: string[];
  skippedSteps: string[];
  variables: Record<string, unknown>;
  abortSignal?: AbortSignal;
}

export interface OrchestratorResult<T> {
  success: boolean;
  data: T | null;
  error: KBError | null;
  stepResults: Map<string, unknown>;
  duration: number;
  completedSteps: string[];
  failedSteps: string[];
  skippedSteps: string[];
  compensated: boolean;
}

export interface OrchestratorConfig {
  /** Enable automatic compensation on failure */
  autoCompensate: boolean;
  /** Global timeout for entire orchestration */
  timeout?: number;
  /** Continue execution on step failure */
  continueOnError: boolean;
  /** Maximum parallel steps */
  maxParallel: number;
  /** Enable telemetry */
  telemetry: boolean;
  /** Custom error handler */
  onError?: (error: KBError, step: string, context: OrchestratorContext) => void;
  /** On step complete */
  onStepComplete?: (stepId: string, result: unknown, context: OrchestratorContext) => void;
  /** On orchestration complete */
  onComplete?: (result: OrchestratorResult<unknown>) => void;
}

export interface UseKBOrchestratorOptions<T> {
  name: string;
  steps: OrchestratorStep[];
  config?: Partial<OrchestratorConfig>;
  initialVariables?: Record<string, unknown>;
  transformResult?: (stepResults: Map<string, unknown>) => T;
}

export interface UseKBOrchestratorReturn<T> {
  // State
  status: KBStatus;
  result: OrchestratorResult<T> | null;
  currentStep: string | null;
  progress: number;
  
  // Computed
  isIdle: boolean;
  isRunning: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // Actions
  execute: (input?: unknown) => Promise<OrchestratorResult<T>>;
  pause: () => void;
  resume: () => void;
  abort: () => void;
  reset: () => void;
  compensate: () => Promise<void>;
  
  // Step access
  getStepResult: <R = unknown>(stepId: string) => R | undefined;
  getCompletedSteps: () => string[];
  getFailedSteps: () => string[];
  
  // Context
  context: OrchestratorContext | null;
  setVariable: (key: string, value: unknown) => void;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: OrchestratorConfig = {
  autoCompensate: true,
  continueOnError: false,
  maxParallel: 5,
  telemetry: true,
};

// ============================================================================
// HOOK
// ============================================================================

export function useKBOrchestrator<T = unknown>(
  options: UseKBOrchestratorOptions<T>
): UseKBOrchestratorReturn<T> {
  const {
    name,
    steps,
    config: userConfig,
    initialVariables = {},
    transformResult,
  } = options;

  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // State
  const [status, setStatus] = useState<KBStatus>('idle');
  const [result, setResult] = useState<OrchestratorResult<T> | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [context, setContext] = useState<OrchestratorContext | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
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
    details: { orchestrator: name },
    timestamp: new Date(),
    retryable: false,
    originalError,
  }), [name]);

  // Execute single step with retry
  const executeStep = useCallback(async (
    step: OrchestratorStep,
    input: unknown,
    ctx: OrchestratorContext
  ): Promise<unknown> => {
    const maxAttempts = step.retry?.maxAttempts ?? 1;
    const delayMs = step.retry?.delayMs ?? 1000;
    const backoff = step.retry?.backoff ?? 2;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Check abort
        if (ctx.abortSignal?.aborted) {
          throw new Error('Orchestration aborted');
        }

        // Wait if paused
        while (isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Execute with timeout
        const executePromise = step.execute(input, ctx);
        
        if (step.timeout) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Step ${step.id} timed out`)), step.timeout);
          });
          return await Promise.race([executePromise, timeoutPromise]);
        }

        return await executePromise;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, delayMs * Math.pow(backoff, attempt))
          );
        }
      }
    }

    throw lastError;
  }, []);

  // Run compensation for completed steps
  const runCompensation = useCallback(async (
    ctx: OrchestratorContext,
    stepsToCompensate: string[]
  ): Promise<void> => {
    // Compensate in reverse order
    const reversedSteps = [...stepsToCompensate].reverse();

    for (const stepId of reversedSteps) {
      const step = steps.find(s => s.id === stepId);
      if (!step?.compensate) continue;

      try {
        const stepResult = ctx.stepResults.get(stepId);
        await step.compensate(undefined, stepResult, ctx);
      } catch (err) {
        console.error(`Compensation failed for step ${stepId}:`, err);
      }
    }
  }, [steps]);

  // Main execute function
  const execute = useCallback(async (
    input?: unknown
  ): Promise<OrchestratorResult<T>> => {
    if (!isMountedRef.current) {
      return {
        success: false,
        data: null,
        error: createError('UNMOUNTED', 'Component unmounted'),
        stepResults: new Map(),
        duration: 0,
        completedSteps: [],
        failedSteps: [],
        skippedSteps: [],
        compensated: false,
      };
    }

    // Reset state
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    isPausedRef.current = false;

    const startTime = Date.now();
    const stepResults = new Map<string, unknown>();
    const completedSteps: string[] = [];
    const failedSteps: string[] = [];
    const skippedSteps: string[] = [];

    const ctx: OrchestratorContext = {
      stepResults,
      metadata: { orchestratorName: name },
      startTime,
      currentStep: '',
      completedSteps,
      failedSteps,
      skippedSteps,
      variables: { ...initialVariables },
      abortSignal: abortControllerRef.current.signal,
    };

    setStatus('loading');
    setContext(ctx);
    setProgress(0);

    let lastOutput: unknown = input;
    let error: KBError | null = null;
    let compensated = false;

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Check abort
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Orchestration aborted');
        }

        // Update current step
        ctx.currentStep = step.id;
        setCurrentStep(step.id);

        // Check condition
        if (step.condition && !step.condition(ctx)) {
          skippedSteps.push(step.id);
          continue;
        }

        // Validate input
        if (step.validate) {
          const isValid = await step.validate(lastOutput, ctx);
          if (!isValid) {
            throw new Error(`Validation failed for step ${step.id}`);
          }
        }

        try {
          // Execute step
          const output = await executeStep(step, lastOutput, ctx);
          
          // Store result
          stepResults.set(step.id, output);
          completedSteps.push(step.id);
          lastOutput = output;

          // Callbacks
          step.onSuccess?.(output, ctx);
          config.onStepComplete?.(step.id, output, ctx);

          // Update progress
          setProgress(((i + 1) / steps.length) * 100);

        } catch (stepError) {
          const kbError = createError(
            'STEP_FAILED',
            `Step ${step.id} failed: ${stepError instanceof Error ? stepError.message : String(stepError)}`,
            stepError
          );

          failedSteps.push(step.id);
          step.onError?.(kbError, ctx);
          config.onError?.(kbError, step.id, ctx);

          if (!config.continueOnError) {
            error = kbError;
            break;
          }
        }
      }

      // Run compensation if needed
      if (error && config.autoCompensate && completedSteps.length > 0) {
        await runCompensation(ctx, completedSteps);
        compensated = true;
      }

    } catch (err) {
      error = createError(
        'ORCHESTRATION_FAILED',
        err instanceof Error ? err.message : 'Orchestration failed',
        err
      );

      if (config.autoCompensate && completedSteps.length > 0) {
        await runCompensation(ctx, completedSteps);
        compensated = true;
      }
    }

    const duration = Date.now() - startTime;
    const success = !error && failedSteps.length === 0;

    // Transform result if provided
    let data: T | null = null;
    if (success && transformResult) {
      data = transformResult(stepResults);
    } else if (success) {
      data = lastOutput as T;
    }

    const orchestratorResult: OrchestratorResult<T> = {
      success,
      data,
      error,
      stepResults,
      duration,
      completedSteps,
      failedSteps,
      skippedSteps,
      compensated,
    };

    if (isMountedRef.current) {
      setStatus(success ? 'success' : 'error');
      setResult(orchestratorResult);
      setCurrentStep(null);
      setProgress(100);
    }

    config.onComplete?.(orchestratorResult as OrchestratorResult<unknown>);

    return orchestratorResult;
  }, [name, steps, config, initialVariables, transformResult, createError, executeStep, runCompensation]);

  // Pause execution
  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // Resume execution
  const resume = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  // Abort execution
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
    setCurrentStep(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setCurrentStep(null);
    setProgress(0);
    setContext(null);
    isPausedRef.current = false;
  }, []);

  // Manual compensation
  const compensate = useCallback(async () => {
    if (!context || context.completedSteps.length === 0) return;
    await runCompensation(context, context.completedSteps);
  }, [context, runCompensation]);

  // Get step result
  const getStepResult = useCallback(<R = unknown>(stepId: string): R | undefined => {
    return context?.stepResults.get(stepId) as R | undefined;
  }, [context]);

  // Get completed steps
  const getCompletedSteps = useCallback(() => {
    return context?.completedSteps ?? [];
  }, [context]);

  // Get failed steps
  const getFailedSteps = useCallback(() => {
    return context?.failedSteps ?? [];
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
    currentStep,
    progress,
    
    // Computed
    isIdle: status === 'idle',
    isRunning: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    
    // Actions
    execute,
    pause,
    resume,
    abort,
    reset,
    compensate,
    
    // Step access
    getStepResult,
    getCompletedSteps,
    getFailedSteps,
    
    // Context
    context,
    setVariable,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create a simple orchestrator step
 */
export function createStep<TInput = unknown, TOutput = unknown>(
  id: string,
  name: string,
  execute: OrchestratorStep<TInput, TOutput>['execute'],
  options?: Partial<Omit<OrchestratorStep<TInput, TOutput>, 'id' | 'name' | 'execute'>>
): OrchestratorStep<TInput, TOutput> {
  return {
    id,
    name,
    execute,
    ...options,
  };
}

/**
 * Create a parallel step group
 */
export function parallelSteps(
  id: string,
  name: string,
  stepsToRun: OrchestratorStep[]
): OrchestratorStep {
  return {
    id,
    name,
    execute: async (input, context) => {
      const results = await Promise.all(
        stepsToRun.map(step => step.execute(input, context))
      );
      return results;
    },
    compensate: async (input, output, context) => {
      const outputs = output as unknown[];
      await Promise.all(
        stepsToRun.map((step, i) => 
          step.compensate?.(input, outputs[i], context)
        )
      );
    },
  };
}

/**
 * Create a conditional step
 */
export function conditionalStep<TInput = unknown, TOutput = unknown>(
  id: string,
  name: string,
  condition: (context: OrchestratorContext) => boolean,
  step: OrchestratorStep<TInput, TOutput>
): OrchestratorStep<TInput, TOutput> {
  return {
    ...step,
    id,
    name,
    condition,
  };
}

export default useKBOrchestrator;
