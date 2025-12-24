/**
 * KB 5.0 - Pipeline Pattern Hook
 * Data transformation pipelines with typed stages
 * Unix-style pipe operations for data processing
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { KBStatus, KBError } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineStage<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  /** Transform function */
  transform: (input: TInput, context: PipelineContext) => TOutput | Promise<TOutput>;
  /** Optional validation */
  validate?: (output: TOutput) => boolean | Promise<boolean>;
  /** Error handler - return fallback or null to skip */
  onError?: (error: Error, input: TInput, context: PipelineContext) => TOutput | null;
  /** Condition to run this stage */
  condition?: (input: TInput, context: PipelineContext) => boolean;
  /** Enable caching for this stage */
  cache?: boolean;
  /** Cache key generator */
  cacheKey?: (input: TInput) => string;
}

export interface PipelineContext {
  pipelineId: string;
  startTime: number;
  stageResults: Map<string, unknown>;
  completedStages: string[];
  skippedStages: string[];
  metadata: Record<string, unknown>;
}

export interface PipelineResult<T> {
  success: boolean;
  data: T | null;
  error: KBError | null;
  duration: number;
  stageResults: Map<string, unknown>;
  completedStages: string[];
  skippedStages: string[];
}

export interface PipelineConfig {
  /** Pipeline identifier */
  id?: string;
  /** Enable logging */
  logging: boolean;
  /** Continue on stage error (use fallback) */
  continueOnError: boolean;
  /** Enable stage timing */
  timing: boolean;
  /** On stage complete */
  onStageComplete?: (stageId: string, input: unknown, output: unknown, duration: number) => void;
  /** On pipeline complete */
  onComplete?: (result: PipelineResult<unknown>) => void;
}

export interface UseKBPipelineOptions<TInput, TOutput> {
  name: string;
  stages: PipelineStage[];
  config?: Partial<PipelineConfig>;
}

export interface UseKBPipelineReturn<TInput, TOutput> {
  // State
  status: KBStatus;
  result: PipelineResult<TOutput> | null;
  currentStage: string | null;
  progress: number;
  
  // Computed
  isIdle: boolean;
  isProcessing: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // Actions
  process: (input: TInput) => Promise<TOutput | null>;
  abort: () => void;
  reset: () => void;
  clearCache: () => void;
  
  // Stage access
  getStageResult: <R = unknown>(stageId: string) => R | undefined;
  
  // Stats
  stageTiming: Map<string, number>;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: PipelineConfig = {
  logging: false,
  continueOnError: false,
  timing: true,
};

// ============================================================================
// HOOK
// ============================================================================

export function useKBPipeline<TInput = unknown, TOutput = unknown>(
  options: UseKBPipelineOptions<TInput, TOutput>
): UseKBPipelineReturn<TInput, TOutput> {
  const {
    name,
    stages,
    config: userConfig,
  } = options;

  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // State
  const [status, setStatus] = useState<KBStatus>('idle');
  const [result, setResult] = useState<PipelineResult<TOutput> | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stageTiming, setStageTiming] = useState<Map<string, number>>(new Map());

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, unknown>>(new Map());
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
    details: { pipeline: name },
    timestamp: new Date(),
    retryable: false,
    originalError,
  }), [name]);

  // Log helper
  const log = useCallback((message: string, data?: unknown) => {
    if (config.logging) {
      console.log(`[Pipeline:${name}] ${message}`, data ?? '');
    }
  }, [name, config.logging]);

  // Process function
  const process = useCallback(async (input: TInput): Promise<TOutput | null> => {
    if (!isMountedRef.current) return null;

    // Reset
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const pipelineId = config.id ?? `pipeline_${Date.now()}`;
    const startTime = Date.now();
    const stageResults = new Map<string, unknown>();
    const completedStages: string[] = [];
    const skippedStages: string[] = [];
    const timing = new Map<string, number>();

    const ctx: PipelineContext = {
      pipelineId,
      startTime,
      stageResults,
      completedStages,
      skippedStages,
      metadata: { pipelineName: name },
    };

    setStatus('loading');
    setProgress(0);
    log('Starting pipeline', { input });

    let currentValue: unknown = input;
    let error: KBError | null = null;

    try {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];

        // Check abort
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Pipeline aborted');
        }

        setCurrentStage(stage.id);

        // Check condition
        if (stage.condition && !stage.condition(currentValue as never, ctx)) {
          skippedStages.push(stage.id);
          log(`Skipped stage: ${stage.id}`);
          setProgress(((i + 1) / stages.length) * 100);
          continue;
        }

        // Check cache
        if (stage.cache) {
          const cacheKey = stage.cacheKey 
            ? stage.cacheKey(currentValue as never)
            : `${stage.id}_${JSON.stringify(currentValue)}`;
          
          if (cacheRef.current.has(cacheKey)) {
            currentValue = cacheRef.current.get(cacheKey);
            stageResults.set(stage.id, currentValue);
            completedStages.push(stage.id);
            log(`Cache hit for stage: ${stage.id}`);
            setProgress(((i + 1) / stages.length) * 100);
            continue;
          }
        }

        const stageStart = Date.now();

        try {
          // Transform
          let output = await stage.transform(currentValue as never, ctx);

          // Validate
          if (stage.validate) {
            const isValid = await stage.validate(output as never);
            if (!isValid) {
              throw new Error(`Validation failed for stage ${stage.id}`);
            }
          }

          // Cache if enabled
          if (stage.cache) {
            const cacheKey = stage.cacheKey 
              ? stage.cacheKey(currentValue as never)
              : `${stage.id}_${JSON.stringify(currentValue)}`;
            cacheRef.current.set(cacheKey, output);
          }

          const stageDuration = Date.now() - stageStart;
          timing.set(stage.id, stageDuration);

          stageResults.set(stage.id, output);
          completedStages.push(stage.id);
          currentValue = output;

          log(`Stage completed: ${stage.id}`, { duration: stageDuration });
          config.onStageComplete?.(stage.id, input, output, stageDuration);

        } catch (stageError) {
          const err = stageError instanceof Error ? stageError : new Error(String(stageError));
          
          // Try error handler
          if (stage.onError) {
            const fallback = stage.onError(err, currentValue as never, ctx);
            if (fallback !== null) {
              currentValue = fallback;
              stageResults.set(stage.id, fallback);
              completedStages.push(stage.id);
              log(`Stage ${stage.id} used fallback`);
            } else if (!config.continueOnError) {
              throw stageError;
            } else {
              skippedStages.push(stage.id);
            }
          } else if (!config.continueOnError) {
            throw stageError;
          } else {
            skippedStages.push(stage.id);
          }
        }

        setProgress(((i + 1) / stages.length) * 100);
      }
    } catch (err) {
      error = createError(
        'PIPELINE_FAILED',
        err instanceof Error ? err.message : 'Pipeline failed',
        err
      );
      log('Pipeline failed', { error });
    }

    const duration = Date.now() - startTime;
    const success = !error;

    const pipelineResult: PipelineResult<TOutput> = {
      success,
      data: success ? (currentValue as TOutput) : null,
      error,
      duration,
      stageResults,
      completedStages,
      skippedStages,
    };

    if (isMountedRef.current) {
      setStatus(success ? 'success' : 'error');
      setResult(pipelineResult);
      setCurrentStage(null);
      setStageTiming(timing);
      setProgress(100);
    }

    log('Pipeline completed', { duration, success });
    config.onComplete?.(pipelineResult as PipelineResult<unknown>);

    return success ? (currentValue as TOutput) : null;
  }, [name, stages, config, createError, log]);

  // Abort
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
    setCurrentStage(null);
  }, []);

  // Reset
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setCurrentStage(null);
    setProgress(0);
    setStageTiming(new Map());
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Get stage result
  const getStageResult = useCallback(<R = unknown>(stageId: string): R | undefined => {
    return result?.stageResults.get(stageId) as R | undefined;
  }, [result]);

  return {
    // State
    status,
    result,
    currentStage,
    progress,
    
    // Computed
    isIdle: status === 'idle',
    isProcessing: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    
    // Actions
    process,
    abort,
    reset,
    clearCache,
    
    // Stage access
    getStageResult,
    
    // Stats
    stageTiming,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create a pipeline stage
 */
export function createStage<TInput = unknown, TOutput = unknown>(
  id: string,
  name: string,
  transform: PipelineStage<TInput, TOutput>['transform'],
  options?: Partial<Omit<PipelineStage<TInput, TOutput>, 'id' | 'name' | 'transform'>>
): PipelineStage<TInput, TOutput> {
  return {
    id,
    name,
    transform,
    ...options,
  };
}

/**
 * Create a map stage
 */
export function mapStage<TInput, TOutput>(
  id: string,
  mapper: (item: TInput) => TOutput
): PipelineStage<TInput[], TOutput[]> {
  return {
    id,
    name: `Map: ${id}`,
    transform: (input) => input.map(mapper),
  };
}

/**
 * Create a filter stage
 */
export function filterStage<T>(
  id: string,
  predicate: (item: T) => boolean
): PipelineStage<T[], T[]> {
  return {
    id,
    name: `Filter: ${id}`,
    transform: (input) => input.filter(predicate),
  };
}

/**
 * Create a reduce stage
 */
export function reduceStage<TInput, TOutput>(
  id: string,
  reducer: (acc: TOutput, item: TInput) => TOutput,
  initialValue: TOutput
): PipelineStage<TInput[], TOutput> {
  return {
    id,
    name: `Reduce: ${id}`,
    transform: (input) => input.reduce(reducer, initialValue),
  };
}

/**
 * Create a sort stage
 */
export function sortStage<T>(
  id: string,
  compareFn?: (a: T, b: T) => number
): PipelineStage<T[], T[]> {
  return {
    id,
    name: `Sort: ${id}`,
    transform: (input) => [...input].sort(compareFn),
  };
}

/**
 * Create a groupBy stage
 */
export function groupByStage<T, K extends string | number>(
  id: string,
  keyFn: (item: T) => K
): PipelineStage<T[], Record<K, T[]>> {
  return {
    id,
    name: `GroupBy: ${id}`,
    transform: (input) => {
      return input.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {} as Record<K, T[]>);
    },
  };
}

/**
 * Create an async stage
 */
export function asyncStage<TInput, TOutput>(
  id: string,
  asyncFn: (input: TInput) => Promise<TOutput>
): PipelineStage<TInput, TOutput> {
  return {
    id,
    name: `Async: ${id}`,
    transform: asyncFn,
  };
}

/**
 * Compose multiple pipelines
 */
export function composePipelines<T>(
  ...pipelines: PipelineStage[][]
): PipelineStage[] {
  return pipelines.flat();
}

export default useKBPipeline;
