/**
 * Async Result with Discriminated Unions
 * 
 * Proporciona type-safety completo para estados asíncronos
 * usando uniones discriminadas de TypeScript.
 * 
 * @module asyncResult
 */

import { useState, useCallback } from 'react';

/**
 * Error tipado de aplicación
 */
export interface AppError {
  /** Código de error para identificación programática */
  code: string;
  /** Mensaje legible para el usuario */
  message: string;
  /** Detalles adicionales para debugging */
  details?: Record<string, unknown>;
  /** Timestamp del error */
  timestamp: Date;
  /** Indica si el error puede recuperarse (retry) */
  recoverable: boolean;
}

/**
 * Unión discriminada para resultados asíncronos.
 * Garantiza type-safety en cada estado posible.
 */
export type AsyncResult<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T; timestamp: Date }
  | { status: 'error'; error: AppError };

/**
 * Estado inicial para AsyncResult
 */
export const idleResult = <T>(): AsyncResult<T> => ({ status: 'idle' });

/**
 * Estado de carga para AsyncResult
 */
export const loadingResult = <T>(): AsyncResult<T> => ({ status: 'loading' });

/**
 * Estado de éxito para AsyncResult
 */
export const successResult = <T>(data: T): AsyncResult<T> => ({
  status: 'success',
  data,
  timestamp: new Date(),
});

/**
 * Estado de error para AsyncResult
 */
export const errorResult = <T>(error: AppError): AsyncResult<T> => ({
  status: 'error',
  error,
});

/**
 * Crea un AppError desde cualquier error
 */
export function createAppError(
  error: unknown,
  options: {
    code?: string;
    recoverable?: boolean;
    details?: Record<string, unknown>;
  } = {}
): AppError {
  const message = error instanceof Error 
    ? error.message 
    : String(error);
  
  const code = options.code 
    || (error instanceof Error ? error.name : 'UNKNOWN_ERROR');

  return {
    code,
    message,
    details: options.details,
    timestamp: new Date(),
    recoverable: options.recoverable ?? true,
  };
}

/**
 * Hook para manejar resultados asíncronos con discriminated unions.
 * Proporciona type-safety completo y gestión de estados.
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { result, execute, reset } = useAsyncResult<User[]>();
 * 
 *   useEffect(() => {
 *     execute(() => fetchUsers());
 *   }, []);
 * 
 *   switch (result.status) {
 *     case 'idle': return <Placeholder />;
 *     case 'loading': return <Skeleton />;
 *     case 'success': return <UserList users={result.data} />;
 *     case 'error': return <ErrorDisplay error={result.error} />;
 *   }
 * }
 * ```
 */
export function useAsyncResult<T>() {
  const [result, setResult] = useState<AsyncResult<T>>({ status: 'idle' });

  /**
   * Ejecuta una función async y actualiza el estado
   */
  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setResult({ status: 'loading' });
    
    try {
      const data = await fn();
      setResult({ 
        status: 'success', 
        data, 
        timestamp: new Date() 
      });
      return data;
    } catch (err) {
      const error = createAppError(err);
      setResult({ status: 'error', error });
      return null;
    }
  }, []);

  /**
   * Reinicia al estado inicial
   */
  const reset = useCallback(() => {
    setResult({ status: 'idle' });
  }, []);

  /**
   * Establece datos manualmente (útil para optimistic updates)
   */
  const setData = useCallback((data: T) => {
    setResult({ status: 'success', data, timestamp: new Date() });
  }, []);

  /**
   * Establece error manualmente
   */
  const setError = useCallback((error: AppError) => {
    setResult({ status: 'error', error });
  }, []);

  return { 
    result, 
    execute, 
    reset, 
    setData, 
    setError,
    // Helpers para verificar estado
    isIdle: result.status === 'idle',
    isLoading: result.status === 'loading',
    isSuccess: result.status === 'success',
    isError: result.status === 'error',
  };
}

/**
 * Type guard para verificar si el resultado es exitoso
 */
export function isSuccessResult<T>(
  result: AsyncResult<T>
): result is { status: 'success'; data: T; timestamp: Date } {
  return result.status === 'success';
}

/**
 * Type guard para verificar si el resultado es error
 */
export function isErrorResult<T>(
  result: AsyncResult<T>
): result is { status: 'error'; error: AppError } {
  return result.status === 'error';
}

/**
 * Extrae datos de un resultado o retorna undefined
 */
export function extractData<T>(result: AsyncResult<T>): T | undefined {
  return result.status === 'success' ? result.data : undefined;
}

/**
 * Extrae error de un resultado o retorna undefined
 */
export function extractError<T>(result: AsyncResult<T>): AppError | undefined {
  return result.status === 'error' ? result.error : undefined;
}
