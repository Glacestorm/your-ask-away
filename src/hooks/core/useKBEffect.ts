/**
 * KB 4.0 - Effect-TS Integration
 * Typed Asynchronous Operations with Composable Pipelines
 * 
 * Features:
 * - Effect-like typed async operations (without full Effect-TS dependency)
 * - Composable error handling with tagged errors
 * - Pipeline/Pipe pattern for transformations
 * - Resource management (acquire/use/release)
 * - Concurrent operations with controlled parallelism
 * - Retry with Schedule pattern
 * - Integration with KB patterns
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { KBError, KBStatus, KBRetryConfig, KB_DEFAULT_RETRY_CONFIG } from './types';
import { createKBError, parseError } from './useKBBase';

// === EFFECT TYPES ===
export type KBEffectResult<T, E> = 
  | { _tag: 'Success'; value: T }
  | { _tag: 'Failure'; error: E };

export type KBEffect<T, E = KBError> = () => Promise<KBEffectResult<T, E>>;

export interface KBEffectContext {
  signal?: AbortSignal;
  timeout?: number;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface KBTaggedError<Tag extends string = string> extends KBError {
  _tag: Tag;
}

// === EFFECT CONSTRUCTORS ===
export function succeed<T>(value: T): KBEffect<T, never> {
  return async () => ({ _tag: 'Success', value });
}

export function fail<E extends KBError>(error: E): KBEffect<never, E> {
  return async () => ({ _tag: 'Failure', error });
}

export function failCause<Tag extends string>(
  tag: Tag,
  message: string,
  details?: Record<string, unknown>
): KBEffect<never, KBTaggedError<Tag>> {
  const error: KBTaggedError<Tag> = {
    _tag: tag,
    code: tag,
    message,
    details,
    timestamp: new Date(),
    retryable: false,
  };
  return async () => ({ _tag: 'Failure', error });
}

export function tryPromise<T>(
  fn: () => Promise<T>,
  options?: {
    catch?: (error: unknown) => KBError;
    timeout?: number;
  }
): KBEffect<T, KBError> {
  return async () => {
    try {
      let result: T;
      
      if (options?.timeout) {
        result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), options.timeout)
          ),
        ]);
      } else {
        result = await fn();
      }
      
      return { _tag: 'Success', value: result };
    } catch (error) {
      const kbError = options?.catch 
        ? options.catch(error) 
        : parseError(error);
      return { _tag: 'Failure', error: kbError };
    }
  };
}

export function tryCatch<T>(
  fn: () => T,
  onError?: (error: unknown) => KBError
): KBEffect<T, KBError> {
  return async () => {
    try {
      const result = fn();
      return { _tag: 'Success', value: result };
    } catch (error) {
      const kbError = onError ? onError(error) : parseError(error);
      return { _tag: 'Failure', error: kbError };
    }
  };
}

// === EFFECT OPERATORS ===
export function map<T, U, E>(
  effect: KBEffect<T, E>,
  fn: (value: T) => U
): KBEffect<U, E> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Success') {
      return { _tag: 'Success', value: fn(result.value) };
    }
    return result;
  };
}

export function flatMap<T, U, E, E2>(
  effect: KBEffect<T, E>,
  fn: (value: T) => KBEffect<U, E2>
): KBEffect<U, E | E2> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Success') {
      return fn(result.value)();
    }
    return result;
  };
}

export function tap<T, E>(
  effect: KBEffect<T, E>,
  fn: (value: T) => void | Promise<void>
): KBEffect<T, E> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Success') {
      await fn(result.value);
    }
    return result;
  };
}

export function tapError<T, E>(
  effect: KBEffect<T, E>,
  fn: (error: E) => void | Promise<void>
): KBEffect<T, E> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Failure') {
      await fn(result.error);
    }
    return result;
  };
}

// === ERROR HANDLING ===
export function catchAll<T, E, T2, E2>(
  effect: KBEffect<T, E>,
  handler: (error: E) => KBEffect<T2, E2>
): KBEffect<T | T2, E2> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Failure') {
      return handler(result.error)();
    }
    return result;
  };
}

export function catchTag<T, E extends KBTaggedError, Tag extends E['_tag'], T2, E2>(
  effect: KBEffect<T, E>,
  tag: Tag,
  handler: (error: Extract<E, { _tag: Tag }>) => KBEffect<T2, E2>
): KBEffect<T | T2, Exclude<E, { _tag: Tag }> | E2> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Failure' && result.error._tag === tag) {
      return handler(result.error as Extract<E, { _tag: Tag }>)();
    }
    return result as KBEffectResult<T | T2, Exclude<E, { _tag: Tag }> | E2>;
  };
}

export function catchTags<T, E extends KBTaggedError, Handlers extends {
  [K in E['_tag']]?: (error: Extract<E, { _tag: K }>) => KBEffect<unknown, unknown>
}>(
  effect: KBEffect<T, E>,
  handlers: Handlers
): KBEffect<T, E> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Failure') {
      const handler = handlers[result.error._tag as keyof Handlers];
      if (handler) {
        const handlerResult = await (handler as (error: E) => KBEffect<unknown, unknown>)(result.error)();
        return handlerResult as KBEffectResult<T, E>;
      }
    }
    return result;
  };
}

export function orElse<T, E, T2, E2>(
  effect: KBEffect<T, E>,
  fallback: KBEffect<T2, E2>
): KBEffect<T | T2, E2> {
  return async () => {
    const result = await effect();
    if (result._tag === 'Failure') {
      return fallback();
    }
    return result;
  };
}

// === RETRY ===
export interface KBSchedule {
  delays: number[];
  shouldRetry: (error: KBError, attempt: number) => boolean;
}

export function exponentialSchedule(options: {
  baseMs?: number;
  maxMs?: number;
  maxAttempts?: number;
  factor?: number;
}): KBSchedule {
  const { baseMs = 1000, maxMs = 30000, maxAttempts = 3, factor = 2 } = options;
  const delays = Array.from({ length: maxAttempts }, (_, i) => 
    Math.min(baseMs * Math.pow(factor, i), maxMs)
  );
  return {
    delays,
    shouldRetry: (error, attempt) => error.retryable && attempt < maxAttempts,
  };
}

export function linearSchedule(options: {
  delayMs?: number;
  maxAttempts?: number;
}): KBSchedule {
  const { delayMs = 1000, maxAttempts = 3 } = options;
  return {
    delays: Array(maxAttempts).fill(delayMs),
    shouldRetry: (error, attempt) => error.retryable && attempt < maxAttempts,
  };
}

export function retry<T, E extends KBError>(
  effect: KBEffect<T, E>,
  schedule: KBSchedule
): KBEffect<T, E> {
  return async () => {
    let lastError: E | null = null;
    
    for (let attempt = 0; attempt <= schedule.delays.length; attempt++) {
      const result = await effect();
      
      if (result._tag === 'Success') {
        return result;
      }
      
      lastError = result.error;
      
      if (!schedule.shouldRetry(result.error, attempt)) {
        return result;
      }
      
      if (attempt < schedule.delays.length) {
        await new Promise(resolve => setTimeout(resolve, schedule.delays[attempt]));
      }
    }
    
    return { _tag: 'Failure', error: lastError! };
  };
}

// === CONCURRENT OPERATIONS ===
export function all<T extends readonly KBEffect<unknown, unknown>[]>(
  effects: T
): KBEffect<{ [K in keyof T]: T[K] extends KBEffect<infer U, unknown> ? U : never }, 
             T[number] extends KBEffect<unknown, infer E> ? E : never> {
  return async () => {
    const results = await Promise.all(effects.map(e => e()));
    
    for (const result of results) {
      if (result._tag === 'Failure') {
        return result as any;
      }
    }
    
    return {
      _tag: 'Success',
      value: results.map(r => (r as { _tag: 'Success'; value: unknown }).value) as any,
    };
  };
}

export function race<T, E>(
  effects: readonly KBEffect<T, E>[]
): KBEffect<T, E> {
  return async () => {
    return Promise.race(effects.map(e => e()));
  };
}

export function allSettled<T extends readonly KBEffect<unknown, unknown>[]>(
  effects: T
): KBEffect<KBEffectResult<unknown, unknown>[], never> {
  return async () => {
    const results = await Promise.all(effects.map(e => e()));
    return { _tag: 'Success', value: results };
  };
}

// === PIPE UTILITY ===
export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): E;
export function pipe(a: unknown, ...fns: ((x: unknown) => unknown)[]): unknown {
  return fns.reduce((acc, fn) => fn(acc), a);
}

// === RESOURCE MANAGEMENT ===
export interface KBResource<T> {
  acquire: KBEffect<T, KBError>;
  release: (resource: T) => KBEffect<void, never>;
}

export function acquireUseRelease<T, U, E>(
  resource: KBResource<T>,
  use: (resource: T) => KBEffect<U, E>
): KBEffect<U, E | KBError> {
  return async () => {
    const acquireResult = await resource.acquire();
    
    if (acquireResult._tag === 'Failure') {
      return acquireResult;
    }
    
    try {
      const useResult = await use(acquireResult.value)();
      await resource.release(acquireResult.value)();
      return useResult;
    } catch (error) {
      await resource.release(acquireResult.value)();
      throw error;
    }
  };
}

// === REACT HOOK ===
export interface UseKBEffectOptions {
  retry?: KBSchedule;
  timeout?: number;
  enabled?: boolean;
}

export interface UseKBEffectReturn<T, E> {
  data: T | null;
  error: E | null;
  status: KBStatus;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  execute: () => Promise<KBEffectResult<T, E>>;
  reset: () => void;
}

export function useKBEffectQuery<T, E extends KBError = KBError>(
  effect: KBEffect<T, E>,
  options: UseKBEffectOptions = {}
): UseKBEffectReturn<T, E> {
  const { retry: schedule, enabled = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [status, setStatus] = useState<KBStatus>('idle');
  
  const effectRef = useRef(effect);
  effectRef.current = effect;

  const execute = useCallback(async (): Promise<KBEffectResult<T, E>> => {
    setStatus('loading');
    setError(null);
    
    let effectToRun = effectRef.current;
    
    if (schedule) {
      effectToRun = retry(effectToRun, schedule);
    }
    
    const result = await effectToRun();
    
    if (result._tag === 'Success') {
      setData(result.value);
      setStatus('success');
    } else {
      setError(result.error);
      setStatus('error');
    }
    
    return result;
  }, [schedule]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    reset,
  };
}

// === EFFECT MUTATION HOOK ===
export function useKBEffectMutation<T, I, E extends KBError = KBError>(
  effectFn: (input: I) => KBEffect<T, E>,
  options: UseKBEffectOptions = {}
): UseKBEffectReturn<T, E> & { mutate: (input: I) => Promise<KBEffectResult<T, E>> } {
  const { retry: schedule } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [status, setStatus] = useState<KBStatus>('idle');

  const mutate = useCallback(async (input: I): Promise<KBEffectResult<T, E>> => {
    setStatus('loading');
    setError(null);
    
    let effect = effectFn(input);
    
    if (schedule) {
      effect = retry(effect, schedule);
    }
    
    const result = await effect();
    
    if (result._tag === 'Success') {
      setData(result.value);
      setStatus('success');
    } else {
      setError(result.error);
      setStatus('error');
    }
    
    return result;
  }, [effectFn, schedule]);

  const execute = useCallback(() => mutate(undefined as I), [mutate]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    mutate,
    reset,
  };
}

// === GEN/DO NOTATION ===
export function gen<T, E>(
  generator: () => Generator<KBEffect<unknown, E>, T, unknown>
): KBEffect<T, E> {
  return async () => {
    const iterator = generator();
    let nextResult = iterator.next();
    
    while (!nextResult.done) {
      const effect = nextResult.value as KBEffect<unknown, E>;
      const result = await effect();
      
      if (result._tag === 'Failure') {
        return result as KBEffectResult<T, E>;
      }
      
      nextResult = iterator.next(result.value);
    }
    
    return { _tag: 'Success', value: nextResult.value };
  };
}

export default useKBEffectQuery;
