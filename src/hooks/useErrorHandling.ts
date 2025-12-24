import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  AppError, 
  createAppError, 
  safeAsync, 
  withRetry, 
  classifyNetworkError,
  getErrorSeverity,
  ErrorContext 
} from '@/lib/errorHandling';

// === ERROR TIPADO KB ===
export interface ErrorHandlingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface UseErrorHandlingOptions {
  component?: string;
  showToasts?: boolean;
  logErrors?: boolean;
}

interface ErrorState {
  error: AppError | null;
  hasError: boolean;
  isRecoverable: boolean;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const { component = 'unknown', showToasts = true, logErrors = true } = options;
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    isRecoverable: true,
  });
  const errorCountRef = useRef(0);
  // === ESTADO KB ===
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const handleError = useCallback((
    error: unknown,
    context?: Partial<ErrorContext>
  ) => {
    errorCountRef.current++;
    
    const appError = error instanceof Error
      ? createAppError('HOOK_ERROR', error.message, {
          details: { stack: error.stack, ...context },
          recoverable: true,
        })
      : createAppError('UNKNOWN_ERROR', String(error), {
          details: context,
          recoverable: true,
        });

    setErrorState({
      error: appError,
      hasError: true,
      isRecoverable: appError.recoverable,
    });

    if (logErrors) {
      console.error(`[${component}] Error:`, {
        error: appError,
        context,
        errorCount: errorCountRef.current,
      });
    }

    if (showToasts) {
      const severity = getErrorSeverity(appError.code);
      if (severity === 'critical') {
        toast.error(appError.message, { duration: 10000 });
      } else if (severity === 'high') {
        toast.error(appError.message, { duration: 5000 });
      } else {
        toast.error(appError.message);
      }
    }

    return appError;
  }, [component, showToasts, logErrors]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      isRecoverable: true,
    });
  }, []);

  const executeAsync = useCallback(async <T>(
    promise: Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T | null> => {
    const [result, error] = await safeAsync(promise, {
      component,
      ...context,
    });

    if (error) {
      handleError(new Error(error.message), context);
      return null;
    }

    return result;
  }, [component, handleError]);

  const executeWithRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    options?: {
      maxAttempts?: number;
      context?: Partial<ErrorContext>;
    }
  ): Promise<T | null> => {
    try {
      return await withRetry(fn, {
        maxAttempts: options?.maxAttempts ?? 3,
        backoff: true,
        onRetry: (attempt, error) => {
          if (logErrors) {
            console.warn(`[${component}] Retry attempt ${attempt}:`, error.message);
          }
        },
      });
    } catch (error) {
      handleError(error, options?.context);
      return null;
    }
  }, [component, handleError, logErrors]);

  const handleNetworkError = useCallback((error: unknown) => {
    const { type, retryable } = classifyNetworkError(error);
    
    const messages: Record<string, string> = {
      offline: 'Sin conexión a internet. Los cambios se sincronizarán cuando vuelva la conexión.',
      timeout: 'La operación tardó demasiado. Inténtelo de nuevo.',
      server: 'Error del servidor. Inténtelo de nuevo más tarde.',
      client: 'Error de conexión. Verifique su conexión a internet.',
      unknown: 'Error desconocido. Inténtelo de nuevo.',
    };

    const appError = createAppError(
      `NETWORK_${type.toUpperCase()}`,
      messages[type],
      { recoverable: retryable }
    );

    setErrorState({
      error: appError,
      hasError: true,
      isRecoverable: retryable,
    });

    if (showToasts) {
      toast.error(messages[type]);
    }

    return { type, retryable };
  }, [showToasts]);

  return {
    ...errorState,
    handleError,
    clearError,
    executeAsync,
    executeWithRetry,
    handleNetworkError,
    errorCount: errorCountRef.current,
    // === KB ADDITIONS ===
    lastRefresh
  };
}
