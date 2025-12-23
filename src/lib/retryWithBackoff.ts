/**
 * Retry with Exponential Backoff Utility
 * 
 * Proporciona reintentos automáticos con incremento exponencial
 * del tiempo de espera para manejar errores transitorios.
 * 
 * @module retryWithBackoff
 */

import { supabase } from '@/integrations/supabase/client';

export interface RetryOptions {
  /** Número máximo de intentos (default: 3) */
  maxAttempts?: number;
  /** Delay inicial en ms (default: 1000) */
  initialDelayMs?: number;
  /** Delay máximo en ms (default: 30000) */
  maxDelayMs?: number;
  /** Multiplicador de backoff (default: 2) */
  backoffMultiplier?: number;
  /** Códigos de error que permiten reintento */
  retryableErrors?: string[];
  /** Callback ejecutado antes de cada reintento */
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
}

const DEFAULT_OPTIONS = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
} as const;

/**
 * Ejecuta una función con reintentos y backoff exponencial.
 * Incluye jitter aleatorio para evitar thundering herd.
 * 
 * @param fn - Función async a ejecutar
 * @param options - Opciones de configuración
 * @returns Resultado de la función
 * @throws Error del último intento si todos fallan
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetchCriticalData(),
 *   {
 *     maxAttempts: 5,
 *     onRetry: (attempt, error) => {
 *       console.log(`Reintento ${attempt}: ${error.message}`);
 *     },
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error = new Error('No attempts made');
  let currentDelay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar si el error es retriable
      if (config.retryableErrors?.length) {
        const isRetryable = config.retryableErrors.some(
          code => lastError.message.includes(code) || lastError.name === code
        );
        if (!isRetryable) {
          throw lastError;
        }
      }

      // No reintentar en el último intento
      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calcular delay con jitter (±30%) para evitar thundering herd
      const jitter = Math.random() * 0.3 * currentDelay;
      const delayWithJitter = currentDelay + jitter;
      
      // Callback de notificación
      config.onRetry?.(attempt, lastError, delayWithJitter);
      
      console.log(
        `[Retry] Intento ${attempt}/${config.maxAttempts} fallido. ` +
        `Reintentando en ${Math.round(delayWithJitter)}ms...`
      );

      // Esperar antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, delayWithJitter));

      // Incrementar delay para el próximo intento (exponencial)
      currentDelay = Math.min(
        currentDelay * config.backoffMultiplier,
        config.maxDelayMs
      );
    }
  }

  throw lastError;
}

/**
 * Wrapper especializado para operaciones de Supabase con retry automático.
 * Maneja automáticamente errores comunes de Postgres y red.
 * 
 * @param operation - Función que ejecuta la operación Supabase
 * @returns Datos de la operación
 * @throws Error si todos los intentos fallan
 * 
 * @example
 * ```typescript
 * const company = await withSupabaseRetry(() =>
 *   supabase.from('companies').select('*').eq('id', companyId).single()
 * );
 * ```
 */
export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: Error | null }>
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await operation();
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    return data;
  }, {
    maxAttempts: 3,
    initialDelayMs: 500,
    retryableErrors: [
      'PGRST', // Errores de PostgREST
      'FetchError', 
      'NetworkError',
      'ECONNRESET',
      'ETIMEDOUT',
      'socket hang up',
    ],
  });
}

/**
 * Wrapper para Edge Functions con retry automático.
 * 
 * @param functionName - Nombre de la edge function
 * @param body - Body del request
 * @param options - Opciones de retry adicionales
 * @returns Respuesta de la función
 * 
 * @example
 * ```typescript
 * const result = await withEdgeFunctionRetry(
 *   'analyze-company',
 *   { companyId: '123', action: 'analyze' }
 * );
 * ```
 */
export async function withEdgeFunctionRetry<T>(
  functionName: string,
  body: Record<string, unknown>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from edge function');
    
    // Verificar respuesta exitosa
    if (data.success === false) {
      throw new Error(data.error || 'Edge function returned error');
    }
    
    return data as T;
  }, {
    maxAttempts: 3,
    initialDelayMs: 1000,
    retryableErrors: [
      'FetchError',
      'NetworkError', 
      'Rate limit',
      '503',
      '504',
    ],
    ...options,
  });
}
