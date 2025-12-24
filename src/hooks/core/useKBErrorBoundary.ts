/**
 * KB 4.5 Error Boundary & Recovery System
 * React Error Boundary integration with automatic recovery
 */

import { useState, useCallback, useRef, useEffect, ReactNode, Component, ErrorInfo } from 'react';
import { KBError, KBStatus } from './types';
import { createAppError, getErrorSeverity, ErrorSeverity } from '@/lib/errorHandling';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface KBErrorBoundaryConfig {
  /** Maximum recovery attempts before giving up */
  maxRecoveryAttempts?: number;
  /** Delay between recovery attempts (ms) */
  recoveryDelayMs?: number;
  /** Whether to use exponential backoff */
  useExponentialBackoff?: boolean;
  /** Component to render during recovery */
  recoveryFallback?: ReactNode;
  /** Component to render after max attempts */
  errorFallback?: ReactNode;
  /** Error filter - return true to handle, false to rethrow */
  shouldCatch?: (error: Error) => boolean;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback when recovery is attempted */
  onRecoveryAttempt?: (attempt: number, error: Error) => void;
  /** Callback when recovery succeeds */
  onRecoverySuccess?: () => void;
  /** Callback when max attempts reached */
  onMaxAttemptsReached?: (error: Error) => void;
}

export interface KBErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
  isRecovering: boolean;
  lastErrorTime: Date | null;
  severity: ErrorSeverity;
}

export interface KBErrorBoundaryReturn {
  /** Current error state */
  errorState: KBErrorState;
  /** Manually trigger recovery */
  recover: () => void;
  /** Reset error state completely */
  reset: () => void;
  /** Force an error for testing */
  forceError: (error: Error) => void;
  /** Check if in error state */
  hasError: boolean;
  /** Check if currently recovering */
  isRecovering: boolean;
  /** Get formatted error message */
  errorMessage: string | null;
  /** Get error severity */
  severity: ErrorSeverity;
}

export interface KBAsyncErrorBoundaryOptions<T> {
  /** The async operation to execute */
  operation: () => Promise<T>;
  /** Configuration for error handling */
  config?: Partial<KBErrorBoundaryConfig>;
  /** Dependencies that should trigger re-execution */
  deps?: unknown[];
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_ERROR_BOUNDARY_CONFIG: Required<Omit<KBErrorBoundaryConfig, 'recoveryFallback' | 'errorFallback' | 'shouldCatch' | 'onError' | 'onRecoveryAttempt' | 'onRecoverySuccess' | 'onMaxAttemptsReached'>> = {
  maxRecoveryAttempts: 3,
  recoveryDelayMs: 1000,
  useExponentialBackoff: true,
};

// ============================================================================
// ERROR RECOVERY STRATEGIES
// ============================================================================

export type RecoveryStrategy = 
  | 'retry'           // Simply retry the operation
  | 'refresh'         // Refresh the page
  | 'reset-state'     // Reset component state
  | 'fallback'        // Use fallback data/component
  | 'escalate'        // Escalate to parent boundary
  | 'ignore';         // Ignore and continue

export interface RecoveryPlan {
  strategy: RecoveryStrategy;
  delay?: number;
  maxAttempts?: number;
  fallbackValue?: unknown;
}

export function determineRecoveryStrategy(error: Error): RecoveryPlan {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors - retry with backoff
  if (message.includes('network') || message.includes('fetch') || name.includes('network')) {
    return { strategy: 'retry', delay: 2000, maxAttempts: 3 };
  }

  // Timeout errors - retry with longer delay
  if (message.includes('timeout') || name.includes('timeout')) {
    return { strategy: 'retry', delay: 5000, maxAttempts: 2 };
  }

  // Auth errors - refresh/re-authenticate
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
    return { strategy: 'refresh' };
  }

  // State corruption - reset state
  if (message.includes('state') || message.includes('undefined') || message.includes('null')) {
    return { strategy: 'reset-state' };
  }

  // Rate limiting - retry with longer delay
  if (message.includes('rate') || message.includes('429') || message.includes('too many')) {
    return { strategy: 'retry', delay: 10000, maxAttempts: 2 };
  }

  // Default - use fallback
  return { strategy: 'fallback' };
}

// ============================================================================
// HOOK: useKBErrorBoundary
// ============================================================================

export function useKBErrorBoundary(
  config?: Partial<KBErrorBoundaryConfig>
): KBErrorBoundaryReturn {
  const mergedConfig = { ...DEFAULT_ERROR_BOUNDARY_CONFIG, ...config };
  
  const [errorState, setErrorState] = useState<KBErrorState>({
    hasError: false,
    error: null,
    errorInfo: null,
    recoveryAttempts: 0,
    isRecovering: false,
    lastErrorTime: null,
    severity: 'low',
  });

  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  const handleError = useCallback((error: Error, errorInfo?: ErrorInfo) => {
    // Check if we should catch this error
    if (config?.shouldCatch && !config.shouldCatch(error)) {
      throw error;
    }

    const severity = getErrorSeverity(error.message);
    
    setErrorState(prev => ({
      hasError: true,
      error,
      errorInfo: errorInfo || null,
      recoveryAttempts: prev.recoveryAttempts,
      isRecovering: false,
      lastErrorTime: new Date(),
      severity,
    }));

    config?.onError?.(error, errorInfo || { componentStack: '' });
  }, [config]);

  const recover = useCallback(() => {
    if (errorState.recoveryAttempts >= mergedConfig.maxRecoveryAttempts) {
      config?.onMaxAttemptsReached?.(errorState.error!);
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));

    const attempt = errorState.recoveryAttempts + 1;
    const delay = mergedConfig.useExponentialBackoff
      ? mergedConfig.recoveryDelayMs * Math.pow(2, attempt - 1)
      : mergedConfig.recoveryDelayMs;

    config?.onRecoveryAttempt?.(attempt, errorState.error!);

    recoveryTimeoutRef.current = setTimeout(() => {
      setErrorState({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryAttempts: attempt,
        isRecovering: false,
        lastErrorTime: null,
        severity: 'low',
      });
      config?.onRecoverySuccess?.();
    }, delay);
  }, [errorState, mergedConfig, config]);

  const reset = useCallback(() => {
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      isRecovering: false,
      lastErrorTime: null,
      severity: 'low',
    });
  }, []);

  const forceError = useCallback((error: Error) => {
    handleError(error);
  }, [handleError]);

  return {
    errorState,
    recover,
    reset,
    forceError,
    hasError: errorState.hasError,
    isRecovering: errorState.isRecovering,
    errorMessage: errorState.error?.message || null,
    severity: errorState.severity,
  };
}

// ============================================================================
// HOOK: useKBAsyncErrorBoundary
// ============================================================================

export interface KBAsyncErrorBoundaryReturn<T> extends KBErrorBoundaryReturn {
  /** Execute the async operation with error boundary protection */
  execute: () => Promise<T | null>;
  /** Current execution status */
  status: KBStatus;
  /** Result data if successful */
  data: T | null;
  /** Whether currently executing */
  isLoading: boolean;
}

export function useKBAsyncErrorBoundary<T>(
  options: KBAsyncErrorBoundaryOptions<T>
): KBAsyncErrorBoundaryReturn<T> {
  const { operation, config, deps = [] } = options;
  
  const errorBoundary = useKBErrorBoundary(config);
  const [status, setStatus] = useState<KBStatus>('idle');
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    if (errorBoundary.hasError && !errorBoundary.isRecovering) {
      return null;
    }

    setStatus('loading');
    
    try {
      const result = await operation();
      setData(result);
      setStatus('success');
      return result;
    } catch (error) {
      setStatus('error');
      errorBoundary.forceError(error instanceof Error ? error : new Error(String(error)));
      
      // Determine recovery strategy
      const plan = determineRecoveryStrategy(error instanceof Error ? error : new Error(String(error)));
      
      if (plan.strategy === 'retry' && (plan.maxAttempts || 3) > errorBoundary.errorState.recoveryAttempts) {
        setTimeout(() => {
          errorBoundary.recover();
        }, plan.delay || 1000);
      }
      
      return null;
    }
  }, [operation, errorBoundary]);

  // Auto-execute on deps change if not in error state
  useEffect(() => {
    if (!errorBoundary.hasError) {
      execute();
    }
  }, deps);

  // Re-execute after recovery
  useEffect(() => {
    if (errorBoundary.errorState.recoveryAttempts > 0 && !errorBoundary.hasError && !errorBoundary.isRecovering) {
      execute();
    }
  }, [errorBoundary.hasError, errorBoundary.isRecovering]);

  return {
    ...errorBoundary,
    execute,
    status,
    data,
    isLoading: status === 'loading',
  };
}

// ============================================================================
// HOOK: useKBErrorRecovery
// ============================================================================

export interface KBErrorRecoveryOptions {
  /** Error to recover from */
  error: Error | null;
  /** Custom recovery strategies by error type */
  strategies?: Record<string, RecoveryPlan>;
  /** Auto-recover on mount */
  autoRecover?: boolean;
}

export function useKBErrorRecovery(options: KBErrorRecoveryOptions) {
  const { error, strategies = {}, autoRecover = false } = options;
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<'pending' | 'success' | 'failed'>('pending');

  const getPlan = useCallback((): RecoveryPlan => {
    if (!error) return { strategy: 'ignore' };
    
    // Check custom strategies first
    for (const [pattern, plan] of Object.entries(strategies)) {
      if (error.message.includes(pattern) || error.name.includes(pattern)) {
        return plan;
      }
    }
    
    // Fall back to automatic determination
    return determineRecoveryStrategy(error);
  }, [error, strategies]);

  const executeRecovery = useCallback(async () => {
    if (!error) return;
    
    const plan = getPlan();
    setIsRecovering(true);
    
    try {
      switch (plan.strategy) {
        case 'retry':
          // Caller should handle retry
          await new Promise(resolve => setTimeout(resolve, plan.delay || 1000));
          break;
        case 'refresh':
          window.location.reload();
          break;
        case 'reset-state':
          // Signal to parent to reset state
          break;
        case 'fallback':
          // Return fallback value
          setRecoveryResult('success');
          break;
        case 'escalate':
          throw error; // Re-throw for parent boundary
        case 'ignore':
        default:
          break;
      }
      setRecoveryResult('success');
    } catch {
      setRecoveryResult('failed');
    } finally {
      setIsRecovering(false);
    }
  }, [error, getPlan]);

  useEffect(() => {
    if (autoRecover && error) {
      executeRecovery();
    }
  }, [autoRecover, error, executeRecovery]);

  return {
    plan: getPlan(),
    isRecovering,
    recoveryResult,
    executeRecovery,
    canRecover: !!error && getPlan().strategy !== 'escalate',
  };
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT (for React class component support)
// ============================================================================

export interface KBErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
}

interface KBErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class KBErrorBoundaryComponent extends Component<KBErrorBoundaryProps, KBErrorBoundaryState> {
  constructor(props: KBErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): KBErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    console.error('[KBErrorBoundary]', error, errorInfo);
  }

  componentDidUpdate(prevProps: KBErrorBoundaryProps): void {
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// ============================================================================
// UTILITY: withKBErrorBoundary HOC
// ============================================================================

export function withKBErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config?: KBErrorBoundaryConfig
) {
  return function WithErrorBoundary(props: P) {
    const errorBoundary = useKBErrorBoundary(config);
    
    if (errorBoundary.hasError) {
      return config?.errorFallback || null;
    }
    
    if (errorBoundary.isRecovering) {
      return config?.recoveryFallback || null;
    }
    
    return null; // HOC pattern - actual rendering handled differently
  };
}

export default useKBErrorBoundary;
