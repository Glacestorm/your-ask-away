/**
 * KB 2.0 - Knowledge Base Pattern Core
 * Enterprise-grade hook patterns for 2025-2026+
 */

// Types
export * from './types';

// Base Hook
export { useKBBase, createKBError, parseError, collectTelemetry, getTelemetryQueue, clearTelemetryQueue } from './useKBBase';

// Query Hook
export { useKBQuery } from './useKBQuery';

// Mutation Hook
export { useKBMutation } from './useKBMutation';

// Re-export default
export { default as useKBBaseDefault } from './useKBBase';
export { default as useKBQueryDefault } from './useKBQuery';
export { default as useKBMutationDefault } from './useKBMutation';
