/**
 * KB 2.5 - Knowledge Base Pattern Core
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

// Re-export defaults
export { default as useKBBaseDefault } from './useKBBase';
export { default as useKBQueryDefault } from './useKBQuery';
export { default as useKBMutationDefault } from './useKBMutation';
export { default as useKBStreamDefault } from './useKBStream';
