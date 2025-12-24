/**
 * KB 3.0 - Knowledge Base Pattern Core
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

// Re-export defaults
export { default as useKBBaseDefault } from './useKBBase';
export { default as useKBQueryDefault } from './useKBQuery';
export { default as useKBMutationDefault } from './useKBMutation';
export { default as useKBStreamDefault } from './useKBStream';
export { default as useKBSuspenseDefault } from './useKBSuspense';
export { default as useKBBulkheadDefault } from './useKBBulkhead';
export { default as useKBQueryDedupDefault } from './useKBQueryDedup';
