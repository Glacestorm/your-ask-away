/**
 * KB 4.0 - Knowledge Base Pattern Core
 * Enterprise-grade hook patterns for 2025-2026+
 * 
 * Features:
 * - State Machine (idle, loading, success, error, retrying, cancelled)
 * - Typed Errors with detailed context
 * - Exponential Backoff Retry
 * - Circuit Breaker Pattern
 * - OpenTelemetry Compatible Telemetry
 * - SSE/Streaming Support
 * - Smart Cache Layer
 * - Suspense-First Design (KB 3.0)
 * - Bulkhead Pattern (KB 3.0)
 * - Query Deduplication (KB 3.0)
 * - Signals Integration (KB 4.0)
 * - Effect-TS Style Operations (KB 4.0)
 * - Reactive Store Pattern (KB 4.0)
 */

// Types
export * from './types';

// Base Hook
export { 
  useKBBase, 
  createKBError, 
  parseError, 
  isRetryableError,
  collectTelemetry, 
  getTelemetryQueue, 
  clearTelemetryQueue 
} from './useKBBase';

// Query Hook
export { useKBQuery } from './useKBQuery';

// Mutation Hook
export { useKBMutation } from './useKBMutation';

// Stream Hook (KB 2.5)
export { useKBStream } from './useKBStream';

// Suspense Hook (KB 3.0)
export { 
  useKBSuspenseQuery, 
  useKBResource,
  createResource,
  preloadResource,
  invalidateResource,
  invalidateResourcesByPrefix,
  getResourceStats,
} from './useKBSuspense';

// Bulkhead Hook (KB 3.0)
export {
  useKBBulkhead,
  getBulkheadPool,
  getBulkheadStats,
  clearBulkheadPool,
  executeWithBulkhead,
  withBulkhead,
  KB_DEFAULT_BULKHEAD_CONFIG,
} from './useKBBulkhead';

// Query Deduplication (KB 3.0)
export {
  useKBQueryDedup,
  invalidateQueries,
  prefetchQuery,
  getQueryData,
  setQueryData,
  getQueryCacheStats,
} from './useKBQueryDedup';

// Signals Hook (KB 4.0)
export {
  useKBSignal,
  useKBComputed,
  useKBEffect as useKBSignalEffect,
  useKBBatch,
  createSignal,
  createComputed,
  clearSignalStore,
  getSignalStoreStats,
  useKBSignalSelector,
  deriveSignal,
  useKBSignalFamily,
} from './useKBSignal';

// Effect-TS Style Operations (KB 4.0)
export {
  // Constructors
  succeed,
  fail,
  failCause,
  tryPromise,
  tryCatch,
  // Operators
  map,
  flatMap,
  tap,
  tapError,
  // Error Handling
  catchAll,
  catchTag,
  catchTags,
  orElse,
  // Retry
  retry,
  exponentialSchedule,
  linearSchedule,
  // Concurrent
  all,
  race,
  allSettled,
  // Utilities
  pipe,
  acquireUseRelease,
  gen,
  // Hooks
  useKBEffectQuery,
  useKBEffectMutation,
} from './useKBEffect';

// Reactive Store (KB 4.0)
export {
  useKBReactive,
  useKBReactiveSelector,
  useKBReactiveActions,
  useKBReactiveAsync,
  createReactiveStore,
  getReactiveStore,
  clearReactiveStore,
  clearAllReactiveStores,
  getReactiveStoreStats,
  devToolsMiddleware,
  loggerMiddleware,
} from './useKBReactive';

// Re-export defaults
export { default as useKBBaseDefault } from './useKBBase';
export { default as useKBQueryDefault } from './useKBQuery';
export { default as useKBMutationDefault } from './useKBMutation';
export { default as useKBStreamDefault } from './useKBStream';
export { default as useKBSuspenseDefault } from './useKBSuspense';
export { default as useKBBulkheadDefault } from './useKBBulkhead';
export { default as useKBQueryDedupDefault } from './useKBQueryDedup';
export { default as useKBSignalDefault } from './useKBSignal';
export { default as useKBEffectDefault } from './useKBEffect';
export { default as useKBReactiveDefault } from './useKBReactive';
