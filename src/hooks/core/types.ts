/**
 * KB 2.0 - Knowledge Base Pattern Types
 * Enterprise-grade hook patterns for 2025-2026+
 */

// === STATUS MACHINE ===
export type KBStatus = 'idle' | 'loading' | 'success' | 'error' | 'retrying' | 'cancelled';

// === ERROR TIPADO ===
export interface KBError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
  originalError?: unknown;
}

// === RETRY CONFIG ===
export interface KBRetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

// === TELEMETRY ===
export interface KBTelemetry {
  hookName: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  status: KBStatus;
  error?: KBError;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

// === HOOK RETURN BASE ===
export interface KBHookReturn<T> {
  // Data
  data: T | null;
  
  // State Machine
  status: KBStatus;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isRetrying: boolean;
  
  // Error Management
  error: KBError | null;
  clearError: () => void;
  
  // Retry Management
  retryCount: number;
  canRetry: boolean;
  retry: () => Promise<T | null>;
  
  // Request Control
  execute: (...args: unknown[]) => Promise<T | null>;
  cancel: () => void;
  reset: () => void;
  
  // Metadata
  lastRefresh: Date | null;
  lastSuccess: Date | null;
}

// === ASYNC HOOK RETURN ===
export interface KBAsyncHookReturn<T, TParams = void> extends Omit<KBHookReturn<T>, 'execute'> {
  execute: TParams extends void ? () => Promise<T | null> : (params: TParams) => Promise<T | null>;
  isPending: boolean;
}

// === MUTATION HOOK RETURN ===
export interface KBMutationReturn<T, TInput> {
  mutate: (input: TInput) => Promise<T | null>;
  mutateAsync: (input: TInput) => Promise<T>;
  
  // State
  status: KBStatus;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // Data
  data: T | null;
  
  // Error
  error: KBError | null;
  clearError: () => void;
  
  // Control
  reset: () => void;
}

// === QUERY OPTIONS ===
export interface KBQueryOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
  retry?: boolean | number | KBRetryConfig;
  onSuccess?: (data: T) => void;
  onError?: (error: KBError) => void;
  onSettled?: (data: T | null, error: KBError | null) => void;
}

// === MUTATION OPTIONS ===
export interface KBMutationOptions<T, TInput> {
  retry?: boolean | number | KBRetryConfig;
  onMutate?: (input: TInput) => Promise<unknown> | unknown;
  onSuccess?: (data: T, input: TInput, context: unknown) => void;
  onError?: (error: KBError, input: TInput, context: unknown) => void;
  onSettled?: (data: T | null, error: KBError | null, input: TInput, context: unknown) => void;
}

// === DEFAULT CONFIGS ===
export const KB_DEFAULT_RETRY_CONFIG: KBRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT', '500', '502', '503', '504'],
};

export const KB_DEFAULT_QUERY_OPTIONS: KBQueryOptions<unknown> = {
  enabled: true,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: KB_DEFAULT_RETRY_CONFIG,
};

// === ERROR CODES ===
export const KB_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type KBErrorCode = typeof KB_ERROR_CODES[keyof typeof KB_ERROR_CODES];
