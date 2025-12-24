/**
 * KB 3.0 - Knowledge Base Pattern Types
 * Enterprise-grade hook patterns for 2025-2026+
 * 
 * Includes:
 * - State Machine
 * - Typed Errors
 * - Circuit Breaker
 * - Smart Cache
 * - OpenTelemetry
 * - SSE/Streaming
 * - Suspense-First (KB 3.0)
 * - Bulkhead Pattern (KB 3.0)
 * - Query Deduplication (KB 3.0)
 */

// === STATUS MACHINE ===
export type KBStatus = 'idle' | 'loading' | 'success' | 'error' | 'retrying' | 'cancelled';

// === CIRCUIT BREAKER STATES ===
export type KBCircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

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

// === CIRCUIT BREAKER CONFIG ===
export interface KBCircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before attempting half-open */
  resetTimeoutMs: number;
  /** Number of successful calls in half-open to close circuit */
  successThreshold: number;
  /** Enable/disable circuit breaker */
  enabled: boolean;
}

// === CIRCUIT BREAKER STATE ===
export interface KBCircuitBreakerState {
  state: KBCircuitState;
  failures: number;
  successes: number;
  lastFailureTime: Date | null;
  lastStateChange: Date;
  totalTrips: number;
}

// === CACHE CONFIG ===
export interface KBCacheConfig {
  /** Enable caching */
  enabled: boolean;
  /** Time in ms before data is considered stale */
  staleTime: number;
  /** Time in ms before cached data is garbage collected */
  gcTime: number;
  /** Cache key for this operation */
  cacheKey?: string;
  /** Enable stale-while-revalidate */
  staleWhileRevalidate: boolean;
  /** Persist to IndexedDB */
  persist: boolean;
  /** Storage key prefix */
  storagePrefix: string;
}

// === CACHE ENTRY ===
export interface KBCacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
  gcTime: number;
  key: string;
  version: number;
}

// === TELEMETRY (OpenTelemetry Compatible) ===
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
  // OpenTelemetry fields
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  attributes?: Record<string, string | number | boolean>;
}

// === TELEMETRY SPAN ===
export interface KBSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'OK' | 'ERROR' | 'UNSET';
  attributes: Record<string, string | number | boolean>;
  events: KBSpanEvent[];
}

export interface KBSpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number | boolean>;
}

// === STREAM CONFIG ===
export interface KBStreamConfig {
  /** Reconnect on error */
  autoReconnect: boolean;
  /** Max reconnection attempts */
  maxReconnects: number;
  /** Reconnection delay in ms */
  reconnectDelayMs: number;
  /** Reconnection backoff multiplier */
  reconnectBackoff: number;
  /** Parse SSE data as JSON */
  parseJson: boolean;
  /** Custom headers for EventSource */
  headers?: Record<string, string>;
}

// === STREAM STATE ===
export interface KBStreamState<T> {
  data: T | null;
  chunks: string[];
  totalChunks: number;
  status: 'idle' | 'connecting' | 'streaming' | 'complete' | 'error' | 'reconnecting';
  error: KBError | null;
  progress: number;
  reconnectAttempts: number;
}

// === STREAM RETURN ===
export interface KBStreamReturn<T> {
  // State
  data: T | null;
  chunks: string[];
  status: KBStreamState<T>['status'];
  error: KBError | null;
  progress: number;
  
  // Computed
  isIdle: boolean;
  isConnecting: boolean;
  isStreaming: boolean;
  isComplete: boolean;
  isError: boolean;
  
  // Controls
  start: (url: string, body?: unknown) => Promise<void>;
  stop: () => void;
  reset: () => void;
  
  // Events
  onChunk?: (chunk: string) => void;
  onComplete?: (data: T) => void;
  onError?: (error: KBError) => void;
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
  
  // Circuit Breaker (KB 2.5)
  circuitState?: KBCircuitState;
  circuitStats?: KBCircuitBreakerState;
  resetCircuit?: () => void;
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
  // KB 2.5
  circuitBreaker?: Partial<KBCircuitBreakerConfig>;
  cache?: Partial<KBCacheConfig>;
}

// === MUTATION OPTIONS ===
export interface KBMutationOptions<T, TInput> {
  retry?: boolean | number | KBRetryConfig;
  onMutate?: (input: TInput) => Promise<unknown> | unknown;
  onSuccess?: (data: T, input: TInput, context: unknown) => void;
  onError?: (error: KBError, input: TInput, context: unknown) => void;
  onSettled?: (data: T | null, error: KBError | null, input: TInput, context: unknown) => void;
  // KB 2.5
  circuitBreaker?: Partial<KBCircuitBreakerConfig>;
}

// === DEFAULT CONFIGS ===
export const KB_DEFAULT_RETRY_CONFIG: KBRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT', '500', '502', '503', '504'],
};

export const KB_DEFAULT_CIRCUIT_BREAKER_CONFIG: KBCircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  successThreshold: 2,
  enabled: true,
};

export const KB_DEFAULT_CACHE_CONFIG: KBCacheConfig = {
  enabled: true,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  staleWhileRevalidate: true,
  persist: false,
  storagePrefix: 'kb_cache_',
};

export const KB_DEFAULT_STREAM_CONFIG: KBStreamConfig = {
  autoReconnect: true,
  maxReconnects: 3,
  reconnectDelayMs: 1000,
  reconnectBackoff: 2,
  parseJson: true,
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
  // KB 2.5 - Circuit Breaker
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
  // KB 2.5 - Stream
  STREAM_ERROR: 'STREAM_ERROR',
  STREAM_TIMEOUT: 'STREAM_TIMEOUT',
  MAX_RECONNECTS: 'MAX_RECONNECTS',
} as const;

export type KBErrorCode = typeof KB_ERROR_CODES[keyof typeof KB_ERROR_CODES];

// === KB 3.0 - BULKHEAD CONFIG ===
export interface KBBulkheadConfig {
  /** Maximum concurrent executions */
  maxConcurrent: number;
  /** Maximum queue size */
  maxQueueSize: number;
  /** Queue timeout in ms */
  queueTimeoutMs: number;
  /** Execution timeout in ms */
  executionTimeoutMs: number;
  /** Default priority (higher = more priority) */
  defaultPriority: number;
  /** Enable bulkhead */
  enabled: boolean;
  /** Bulkhead pool name */
  name: string;
}

export const KB_DEFAULT_BULKHEAD_CONFIG: KBBulkheadConfig = {
  maxConcurrent: 5,
  maxQueueSize: 100,
  queueTimeoutMs: 30000,
  executionTimeoutMs: 60000,
  defaultPriority: 5,
  enabled: true,
  name: 'default',
};

// === KB 3.0 - SUSPENSE RESOURCE ===
export interface KBResourceState<T> {
  status: 'pending' | 'success' | 'error';
  data: T | null;
  error: KBError | null;
  timestamp: number;
}

export interface KBResource<T> {
  read(): T;
  preload(): void;
  refresh(): void;
}

// === KB 3.0 - QUERY DEDUP STATE ===
export interface KBQueryState<T> {
  data: T | null;
  status: KBStatus;
  error: KBError | null;
  dataUpdatedAt: number | null;
  errorUpdatedAt: number | null;
  fetchStatus: 'idle' | 'fetching';
  isStale: boolean;
}
