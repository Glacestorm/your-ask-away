/**
 * Centralized Error Handling Utilities
 * Banking-grade error management with logging and recovery
 */

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  recoverable: boolean;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Create a standardized application error
 */
export function createAppError(
  code: string,
  message: string,
  options?: {
    details?: Record<string, unknown>;
    recoverable?: boolean;
  }
): AppError {
  return {
    code,
    message,
    details: options?.details,
    timestamp: new Date().toISOString(),
    recoverable: options?.recoverable ?? true,
  };
}

/**
 * Determine error severity based on error code
 */
export function getErrorSeverity(code: string): ErrorSeverity {
  const criticalCodes = ['AUTH_FAILED', 'DATA_CORRUPTION', 'SECURITY_BREACH'];
  const highCodes = ['NETWORK_ERROR', 'DB_ERROR', 'VALIDATION_FAILED'];
  const mediumCodes = ['TIMEOUT', 'RATE_LIMITED', 'RESOURCE_NOT_FOUND'];

  if (criticalCodes.some((c) => code.includes(c))) return 'critical';
  if (highCodes.some((c) => code.includes(c))) return 'high';
  if (mediumCodes.some((c) => code.includes(c))) return 'medium';
  return 'low';
}

/**
 * Safe async wrapper with error handling
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  context?: ErrorContext
): Promise<[T | null, AppError | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const appError = createAppError(
      'ASYNC_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      {
        details: {
          ...context,
          originalError: error instanceof Error ? error.stack : String(error),
        },
        recoverable: true,
      }
    );
    
    // Log error for monitoring
    console.error('[SafeAsync Error]', {
      error: appError,
      context,
    });
    
    return [null, appError];
  }
}

/**
 * Retry mechanism for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelay = options?.delayMs ?? 1000;
  const useBackoff = options?.backoff ?? true;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        const delay = useBackoff ? baseDelay * Math.pow(2, attempt - 1) : baseDelay;
        options?.onRetry?.(attempt, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Error boundary fallback handler
 */
export function handleBoundaryError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  console.error('[Error Boundary]', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  });
}

/**
 * Network error classifier
 */
export function classifyNetworkError(error: unknown): {
  type: 'timeout' | 'offline' | 'server' | 'client' | 'unknown';
  retryable: boolean;
} {
  if (!navigator.onLine) {
    return { type: 'offline', retryable: true };
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return { type: 'timeout', retryable: true };
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return { type: 'server', retryable: true };
    }
  }

  return { type: 'unknown', retryable: false };
}

/**
 * Validation error helper
 */
export function createValidationError(
  field: string,
  message: string,
  value?: unknown
): AppError {
  return createAppError('VALIDATION_ERROR', message, {
    details: { field, value },
    recoverable: true,
  });
}
