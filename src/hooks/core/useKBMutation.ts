/**
 * KB 2.0 - Mutation Hook Wrapper
 * For data modification operations with optimistic updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createKBError, parseError, collectTelemetry } from './useKBBase';
import {
  KBStatus,
  KBError,
  KBMutationReturn,
  KBMutationOptions,
  KBRetryConfig,
  KB_DEFAULT_RETRY_CONFIG,
} from './types';

interface UseKBMutationOptions<T, TInput> extends KBMutationOptions<T, TInput> {
  hookName: string;
  operationName?: string;
  mutationFn: (input: TInput) => Promise<T>;
  retryConfig?: Partial<KBRetryConfig>;
}

export function useKBMutation<T, TInput = void>(
  options: UseKBMutationOptions<T, TInput>
): KBMutationReturn<T, TInput> {
  const {
    hookName,
    operationName = 'mutate',
    mutationFn,
    retryConfig: customRetryConfig,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    retry = false,
  } = options;

  const retryConfig: KBRetryConfig = {
    ...KB_DEFAULT_RETRY_CONFIG,
    ...(typeof retry === 'object' ? retry : {}),
    maxRetries: typeof retry === 'number' ? retry : (retry ? 3 : 0),
  };

  // State
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const contextRef = useRef<unknown>(null);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Computed states
  const isIdle = status === 'idle';
  const isPending = status === 'loading' || status === 'retrying';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // Reset
  const reset = useCallback(() => {
    setData(null);
    setStatus('idle');
    setError(null);
    contextRef.current = null;
  }, []);

  // Execute with retry
  const executeWithRetry = useCallback(async (
    input: TInput,
    currentRetry: number = 0
  ): Promise<T> => {
    const startTime = new Date();
    
    try {
      if (!isMountedRef.current) throw new Error('Component unmounted');
      
      setStatus(currentRetry > 0 ? 'retrying' : 'loading');
      
      const result = await mutationFn(input);
      
      if (!isMountedRef.current) throw new Error('Component unmounted');
      
      setData(result);
      setStatus('success');
      setError(null);
      
      // Telemetry
      collectTelemetry({
        hookName,
        operationName,
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: currentRetry,
      });
      
      onSuccess?.(result, input, contextRef.current);
      onSettled?.(result, null, input, contextRef.current);
      
      return result;
      
    } catch (err) {
      const parsedError = parseError(err);
      
      // Check if we should retry
      if (parsedError.retryable && currentRetry < retryConfig.maxRetries) {
        const delay = retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, currentRetry);
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, retryConfig.maxDelayMs)));
        
        if (!isMountedRef.current) throw err;
        
        return executeWithRetry(input, currentRetry + 1);
      }
      
      if (isMountedRef.current) {
        setError(parsedError);
        setStatus('error');
      }
      
      // Telemetry
      collectTelemetry({
        hookName,
        operationName,
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: parsedError,
        retryCount: currentRetry,
      });
      
      onError?.(parsedError, input, contextRef.current);
      onSettled?.(null, parsedError, input, contextRef.current);
      
      throw err;
    }
  }, [hookName, operationName, mutationFn, retryConfig, onSuccess, onError, onSettled]);

  // Mutate (returns null on error)
  const mutate = useCallback(async (input: TInput): Promise<T | null> => {
    try {
      // Run onMutate for optimistic updates
      if (onMutate) {
        contextRef.current = await onMutate(input);
      }
      
      return await executeWithRetry(input, 0);
    } catch {
      return null;
    }
  }, [onMutate, executeWithRetry]);

  // MutateAsync (throws on error)
  const mutateAsync = useCallback(async (input: TInput): Promise<T> => {
    // Run onMutate for optimistic updates
    if (onMutate) {
      contextRef.current = await onMutate(input);
    }
    
    return executeWithRetry(input, 0);
  }, [onMutate, executeWithRetry]);

  return {
    mutate,
    mutateAsync,
    
    // State
    status,
    isIdle,
    isPending,
    isSuccess,
    isError,
    
    // Data
    data,
    
    // Error
    error,
    clearError,
    
    // Control
    reset,
  };
}

export default useKBMutation;
