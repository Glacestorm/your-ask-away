/**
 * KB 2.5 - Base Hook Implementation
 * Provides state machine, retry logic, cancellation, circuit breaker, and telemetry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  KBStatus,
  KBError,
  KBRetryConfig,
  KBTelemetry,
  KBHookReturn,
  KBCircuitBreakerConfig,
  KBCircuitBreakerState,
  KBCircuitState,
  KB_DEFAULT_RETRY_CONFIG,
  KB_DEFAULT_CIRCUIT_BREAKER_CONFIG,
  KB_ERROR_CODES,
} from './types';

// === TELEMETRY COLLECTOR ===
const telemetryQueue: KBTelemetry[] = [];
const MAX_TELEMETRY_QUEUE = 100;

export function collectTelemetry(
  hookNameOrTelemetry: string | KBTelemetry,
  operationName?: string,
  status?: 'success' | 'error',
  durationMs?: number,
  error?: KBError | string
): void {
  const now = new Date();
  const parsedError = typeof error === 'string' 
    ? { code: 'UNKNOWN', message: error, timestamp: now, retryable: false } as KBError
    : error;
    
  const telemetry: KBTelemetry = typeof hookNameOrTelemetry === 'string'
    ? {
        hookName: hookNameOrTelemetry,
        operationName: operationName || 'unknown',
        startTime: now,
        endTime: now,
        durationMs: durationMs || 0,
        status: status || 'success',
        error: parsedError,
        retryCount: 0,
      }
    : hookNameOrTelemetry;

  telemetryQueue.push(telemetry);
  if (telemetryQueue.length > MAX_TELEMETRY_QUEUE) {
    telemetryQueue.shift();
  }
  
  // Log in development
  if (import.meta.env.DEV && telemetry.status === 'error') {
    console.warn(`[KB Telemetry] ${telemetry.hookName}.${telemetry.operationName} failed:`, telemetry.error);
  }
}

export function getTelemetryQueue(): KBTelemetry[] {
  return [...telemetryQueue];
}

export function clearTelemetryQueue(): void {
  telemetryQueue.length = 0;
}

// === ERROR FACTORY ===
export function createKBError(
  code: string,
  message: string,
  options?: {
    details?: Record<string, unknown>;
    retryable?: boolean;
    originalError?: unknown;
  }
): KBError {
  return {
    code,
    message,
    details: options?.details,
    timestamp: new Date(),
    retryable: options?.retryable ?? isRetryableError(code),
    originalError: options?.originalError,
  };
}

export function isRetryableError(code: string): boolean {
  const retryableCodes = [
    KB_ERROR_CODES.NETWORK_ERROR,
    KB_ERROR_CODES.TIMEOUT,
    KB_ERROR_CODES.RATE_LIMIT,
    KB_ERROR_CODES.SERVER_ERROR,
    '500', '502', '503', '504',
  ];
  return retryableCodes.includes(code);
}

export function parseError(error: unknown): KBError {
  if (error instanceof Error) {
    // Handle Supabase errors
    if ('code' in error && typeof (error as any).code === 'string') {
      const supabaseError = error as { code: string; message: string; details?: string };
      return createKBError(supabaseError.code, supabaseError.message, {
        details: { supabaseDetails: supabaseError.details },
        originalError: error,
      });
    }
    
    // Handle fetch errors
    if (error.name === 'AbortError') {
      return createKBError(KB_ERROR_CODES.CANCELLED, 'Request was cancelled', {
        retryable: false,
        originalError: error,
      });
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createKBError(KB_ERROR_CODES.NETWORK_ERROR, 'Network error occurred', {
        retryable: true,
        originalError: error,
      });
    }
    
    return createKBError(KB_ERROR_CODES.UNKNOWN, error.message, {
      originalError: error,
    });
  }
  
  if (typeof error === 'string') {
    return createKBError(KB_ERROR_CODES.UNKNOWN, error);
  }
  
  return createKBError(KB_ERROR_CODES.UNKNOWN, 'An unknown error occurred', {
    details: { rawError: error },
  });
}

// === DELAY UTILITY ===
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoffDelay(
  attempt: number,
  config: KBRetryConfig
): number {
  const delayMs = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delayMs, config.maxDelayMs);
}

// === CIRCUIT BREAKER ===
function createCircuitBreakerState(): KBCircuitBreakerState {
  return {
    state: 'CLOSED',
    failures: 0,
    successes: 0,
    lastFailureTime: null,
    lastStateChange: new Date(),
    totalTrips: 0,
  };
}

function shouldOpenCircuit(
  state: KBCircuitBreakerState,
  config: KBCircuitBreakerConfig
): boolean {
  return state.failures >= config.failureThreshold;
}

function shouldAttemptReset(
  state: KBCircuitBreakerState,
  config: KBCircuitBreakerConfig
): boolean {
  if (state.state !== 'OPEN' || !state.lastFailureTime) return false;
  const timeSinceLastFailure = Date.now() - state.lastFailureTime.getTime();
  return timeSinceLastFailure >= config.resetTimeoutMs;
}

function shouldCloseCircuit(
  state: KBCircuitBreakerState,
  config: KBCircuitBreakerConfig
): boolean {
  return state.state === 'HALF_OPEN' && state.successes >= config.successThreshold;
}

// === BASE HOOK ===
interface UseKBBaseOptions<T> {
  hookName: string;
  operationName?: string;
  retryConfig?: Partial<KBRetryConfig>;
  circuitBreakerConfig?: Partial<KBCircuitBreakerConfig>;
  onSuccess?: (data: T) => void;
  onError?: (error: KBError) => void;
  initialData?: T | null;
}

export function useKBBase<T>(options: UseKBBaseOptions<T>): KBHookReturn<T> & {
  _registerExecuteFn: (fn: (...args: unknown[]) => Promise<T>) => void;
  _setData: React.Dispatch<React.SetStateAction<T | null>>;
  _setStatus: React.Dispatch<React.SetStateAction<KBStatus>>;
  _setError: React.Dispatch<React.SetStateAction<KBError | null>>;
} {
  const {
    hookName,
    operationName = 'execute',
    retryConfig: customRetryConfig,
    circuitBreakerConfig: customCircuitConfig,
    onSuccess,
    onError,
    initialData = null,
  } = options;

  const retryConfig: KBRetryConfig = {
    ...KB_DEFAULT_RETRY_CONFIG,
    ...customRetryConfig,
  };

  const circuitConfig: KBCircuitBreakerConfig = {
    ...KB_DEFAULT_CIRCUIT_BREAKER_CONFIG,
    ...customCircuitConfig,
  };

  // State
  const [data, setData] = useState<T | null>(initialData);
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  
  // Circuit Breaker State
  const [circuitBreakerState, setCircuitBreakerState] = useState<KBCircuitBreakerState>(
    createCircuitBreakerState()
  );

  // Refs for cancellation and cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const currentOperationRef = useRef<Promise<T | null> | null>(null);
  const executeFnRef = useRef<((...args: unknown[]) => Promise<T>) | null>(null);
  const lastArgsRef = useRef<unknown[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Circuit Breaker: Auto-transition from OPEN to HALF_OPEN
  useEffect(() => {
    if (!circuitConfig.enabled || circuitBreakerState.state !== 'OPEN') return;

    const checkResetTimeout = () => {
      if (shouldAttemptReset(circuitBreakerState, circuitConfig)) {
        setCircuitBreakerState(prev => ({
          ...prev,
          state: 'HALF_OPEN',
          successes: 0,
          lastStateChange: new Date(),
        }));
      }
    };

    const timer = setTimeout(checkResetTimeout, circuitConfig.resetTimeoutMs);
    return () => clearTimeout(timer);
  }, [circuitBreakerState.state, circuitBreakerState.lastFailureTime, circuitConfig]);

  // Computed states
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isRetrying = status === 'retrying';
  const canRetry = error?.retryable === true && retryCount < retryConfig.maxRetries;

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // Cancel current operation
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    currentOperationRef.current = null;
    if (isMountedRef.current && (status === 'loading' || status === 'retrying')) {
      setStatus('cancelled');
      setError(createKBError(KB_ERROR_CODES.CANCELLED, 'Operation cancelled', { retryable: false }));
    }
  }, [status]);

  // Reset to initial state
  const reset = useCallback(() => {
    cancel();
    setData(initialData);
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, [cancel, initialData]);

  // Reset circuit breaker
  const resetCircuit = useCallback(() => {
    setCircuitBreakerState(createCircuitBreakerState());
  }, []);

  // Record circuit failure
  const recordCircuitFailure = useCallback(() => {
    if (!circuitConfig.enabled) return;
    
    setCircuitBreakerState(prev => {
      const newFailures = prev.failures + 1;
      const shouldTrip = newFailures >= circuitConfig.failureThreshold;
      
      return {
        ...prev,
        failures: newFailures,
        lastFailureTime: new Date(),
        state: shouldTrip ? 'OPEN' : prev.state,
        totalTrips: shouldTrip && prev.state !== 'OPEN' ? prev.totalTrips + 1 : prev.totalTrips,
        lastStateChange: shouldTrip && prev.state !== 'OPEN' ? new Date() : prev.lastStateChange,
        successes: 0,
      };
    });
  }, [circuitConfig]);

  // Record circuit success
  const recordCircuitSuccess = useCallback(() => {
    if (!circuitConfig.enabled) return;
    
    setCircuitBreakerState(prev => {
      if (prev.state === 'HALF_OPEN') {
        const newSuccesses = prev.successes + 1;
        if (newSuccesses >= circuitConfig.successThreshold) {
          return {
            ...prev,
            state: 'CLOSED',
            failures: 0,
            successes: 0,
            lastStateChange: new Date(),
          };
        }
        return { ...prev, successes: newSuccesses };
      }
      
      // In CLOSED state, reset failures on success
      return { ...prev, failures: 0 };
    });
  }, [circuitConfig]);

  // Check if circuit is open
  const isCircuitOpen = useCallback((): boolean => {
    if (!circuitConfig.enabled) return false;
    return circuitBreakerState.state === 'OPEN';
  }, [circuitConfig.enabled, circuitBreakerState.state]);

  // Execute with retry logic
  const executeWithRetry = useCallback(async (
    fn: (...args: unknown[]) => Promise<T>,
    args: unknown[],
    currentRetry: number = 0
  ): Promise<T | null> => {
    const startTime = new Date();
    
    // Check circuit breaker
    if (isCircuitOpen()) {
      const circuitError = createKBError(
        KB_ERROR_CODES.CIRCUIT_OPEN,
        'Circuit breaker is open. Service temporarily unavailable.',
        { retryable: false, details: { circuitState: circuitBreakerState } }
      );
      setError(circuitError);
      setStatus('error');
      onError?.(circuitError);
      
      collectTelemetry({
        hookName,
        operationName,
        startTime,
        endTime: new Date(),
        durationMs: 0,
        status: 'error',
        error: circuitError,
        retryCount: currentRetry,
        attributes: { circuitState: 'OPEN' },
      });
      
      return null;
    }
    
    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController();
    
    try {
      if (!isMountedRef.current) return null;
      
      setStatus(currentRetry > 0 ? 'retrying' : 'loading');
      setRetryCount(currentRetry);
      
      const result = await fn(...args);
      
      if (!isMountedRef.current) return null;
      
      // Record circuit success
      recordCircuitSuccess();
      
      setData(result);
      setStatus('success');
      setError(null);
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      
      // Telemetry
      collectTelemetry({
        hookName,
        operationName,
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: currentRetry,
        attributes: { circuitState: circuitBreakerState.state },
      });
      
      onSuccess?.(result);
      return result;
      
    } catch (err) {
      if (!isMountedRef.current) return null;
      
      // Check if cancelled
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('cancelled');
        return null;
      }
      
      const parsedError = parseError(err);
      
      // Record circuit failure
      recordCircuitFailure();
      
      // Check if we should retry
      if (parsedError.retryable && currentRetry < retryConfig.maxRetries) {
        const backoffDelay = calculateBackoffDelay(currentRetry, retryConfig);
        
        // Telemetry for retry
        collectTelemetry({
          hookName,
          operationName,
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'retrying',
          error: parsedError,
          retryCount: currentRetry,
          metadata: { nextRetryIn: backoffDelay },
          attributes: { circuitState: circuitBreakerState.state },
        });
        
        await delay(backoffDelay);
        
        if (!isMountedRef.current) return null;
        
        return executeWithRetry(fn, args, currentRetry + 1);
      }
      
      // Final failure
      setError(parsedError);
      setStatus('error');
      setRetryCount(currentRetry);
      
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
        attributes: { circuitState: circuitBreakerState.state },
      });
      
      onError?.(parsedError);
      return null;
    }
  }, [
    hookName,
    operationName,
    retryConfig,
    circuitBreakerState,
    isCircuitOpen,
    recordCircuitSuccess,
    recordCircuitFailure,
    onSuccess,
    onError,
  ]);

  // Main execute function
  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    // Store args for retry
    lastArgsRef.current = args;
    
    // Get the actual function to execute
    const fn = executeFnRef.current;
    if (!fn) {
      console.warn(`[${hookName}] No execute function registered`);
      return null;
    }
    
    // Cancel any pending operation
    abortControllerRef.current?.abort();
    
    const operation = executeWithRetry(fn, args, 0);
    currentOperationRef.current = operation;
    
    return operation;
  }, [hookName, executeWithRetry]);

  // Retry last operation
  const retry = useCallback(async (): Promise<T | null> => {
    if (!canRetry) return null;
    
    const fn = executeFnRef.current;
    if (!fn) return null;
    
    return executeWithRetry(fn, lastArgsRef.current, retryCount + 1);
  }, [canRetry, retryCount, executeWithRetry]);

  // Register execute function (for internal use by wrapper hooks)
  const registerExecuteFn = useCallback((fn: (...args: unknown[]) => Promise<T>) => {
    executeFnRef.current = fn;
  }, []);

  return {
    // Data
    data,
    
    // State Machine
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isRetrying,
    
    // Error Management
    error,
    clearError,
    
    // Retry Management
    retryCount,
    canRetry,
    retry,
    
    // Request Control
    execute,
    cancel,
    reset,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    
    // Circuit Breaker (KB 2.5)
    circuitState: circuitBreakerState.state,
    circuitStats: circuitBreakerState,
    resetCircuit,
    
    // Internal (exposed for wrapper hooks)
    _registerExecuteFn: registerExecuteFn,
    _setData: setData,
    _setStatus: setStatus,
    _setError: setError,
  };
}

export default useKBBase;
