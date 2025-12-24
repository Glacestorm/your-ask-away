/**
 * KB 4.5 - Unified API
 * Fase 12 - Final Integration & Unified API
 * 
 * API unificada que expone todas las capacidades de KB 4.5:
 * - Query & Mutations con circuit breaker
 * - Streaming SSE
 * - Suspense-first patterns
 * - Optimistic updates
 * - Offline-first sync
 * - Middleware & interceptors
 * - Feature flags & A/B testing
 * - Enterprise integrations
 * - Performance monitoring
 * - DevTools integration
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import type { KBError, KBStatus, KBHookReturn, KBQueryOptions, KBMutationOptions } from './types';

// Core hooks
import { useKBBase, createKBError, collectTelemetry } from './useKBBase';
import { useKBQuery } from './useKBQuery';
import { useKBMutation } from './useKBMutation';
import { useKBStream } from './useKBStream';

// Advanced patterns
import { useKBSuspenseQuery, useKBResource } from './useKBSuspense';
import { useKBBulkhead } from './useKBBulkhead';
import { useKBQueryDedup } from './useKBQueryDedup';
import { useKBSignal } from './useKBSignal';
import { KBEffect, succeed, fail, pipe } from './useKBEffect';

// React 19 patterns
import { useKBOptimistic, useKBFormAction } from './useKBReact19';

// Validation & Tracing
import { useKBSchema } from './useKBSchema';
import { useKBSpan } from './useKBSpan';

// Optimistic mutations
import { useKBOptimisticMutation } from './useKBOptimisticMutation';

// Offline-first
import { useKBOffline } from './useKBOffline';

// Performance
import { useKBPerformance } from './useKBPerformance';

// DevTools
import { useKBDevTools } from './useKBDevTools';

// Middleware
import { 
  useKBMiddleware, 
  useKBWithMiddleware,
  KBMiddleware,
  composeMiddleware,
  createLoggingMiddleware,
  createAuthMiddleware,
  createRetryMiddleware,
  createCacheMiddleware,
  createRateLimitMiddleware,
  createDeduplicationMiddleware,
  createTimeoutMiddleware,
  createTransformMiddleware,
  createMetricsMiddleware,
} from './useKBMiddleware';

// Feature Flags
import {
  useFeatureFlag,
  useIsFeatureEnabled,
  useFeatureVariant,
  useABTest,
  useRegisterFlags,
  useFeatureFlagOverrides,
  KBFeatureFlags,
} from './useKBFeatureFlags';

// Enterprise
import {
  useKBEnterpriseBase,
  useKBCompliance,
  useKBCommandCenter,
  useKBWorkflowEngine,
  useKBBusinessIntelligence,
  useKBEnterpriseAll,
} from './useKBEnterprise';

// ============================================================================
// UNIFIED KB NAMESPACE
// ============================================================================

/**
 * KB - Unified API for all KB 4.5 capabilities
 * 
 * @example
 * // Query with automatic caching and retry
 * const { data, isLoading } = KB.useQuery({
 *   queryKey: ['users'],
 *   queryFn: () => fetchUsers(),
 * });
 * 
 * @example
 * // Mutation with optimistic updates
 * const { mutate } = KB.useMutation({
 *   mutationFn: (user) => createUser(user),
 *   onOptimisticUpdate: (user) => [...users, user],
 * });
 * 
 * @example
 * // SSE streaming
 * const { data, isConnected } = KB.useStream({
 *   url: '/api/events',
 *   onMessage: (event) => console.log(event),
 * });
 */
export const KB = {
  // === CORE HOOKS ===
  useBase: useKBBase,
  useQuery: useKBQuery,
  useMutation: useKBMutation,
  useStream: useKBStream,

  // === SUSPENSE PATTERNS ===
  useSuspenseQuery: useKBSuspenseQuery,
  useResource: useKBResource,

  // === ADVANCED PATTERNS ===
  useBulkhead: useKBBulkhead,
  useQueryDedup: useKBQueryDedup,
  useSignal: useKBSignal,
  effect: { succeed, fail, pipe } as const,

  // === REACT 19 PATTERNS ===
  useOptimistic: useKBOptimistic,
  useFormAction: useKBFormAction,

  // === VALIDATION & TRACING ===
  useSchema: useKBSchema,
  useSpan: useKBSpan,

  // === OPTIMISTIC MUTATIONS ===
  useOptimisticMutation: useKBOptimisticMutation,

  // === OFFLINE-FIRST ===
  useOffline: useKBOffline,

  // === PERFORMANCE ===
  usePerformance: useKBPerformance,

  // === DEVTOOLS ===
  useDevTools: useKBDevTools,

  // === MIDDLEWARE ===
  useMiddleware: useKBMiddleware,
  useWithMiddleware: useKBWithMiddleware,
  middleware: KBMiddleware,
  composeMiddleware,
  middlewares: {
    logging: createLoggingMiddleware,
    auth: createAuthMiddleware,
    retry: createRetryMiddleware,
    cache: createCacheMiddleware,
    rateLimit: createRateLimitMiddleware,
    deduplication: createDeduplicationMiddleware,
    timeout: createTimeoutMiddleware,
    transform: createTransformMiddleware,
    metrics: createMetricsMiddleware,
  },

  // === FEATURE FLAGS ===
  useFeatureFlag,
  useIsFeatureEnabled,
  useFeatureVariant,
  useABTest,
  useRegisterFlags,
  useFeatureFlagOverrides,
  featureFlags: KBFeatureFlags,

  // === ENTERPRISE ===
  useEnterpriseBase: useKBEnterpriseBase,
  useCompliance: useKBCompliance,
  useCommandCenter: useKBCommandCenter,
  useWorkflowEngine: useKBWorkflowEngine,
  useBusinessIntelligence: useKBBusinessIntelligence,
  useEnterpriseAll: useKBEnterpriseAll,

  // === UTILITIES ===
  createError: createKBError,
  collectTelemetry,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  KBError,
  KBStatus,
  KBHookReturn,
  KBQueryOptions,
  KBMutationOptions,
} from './types';

export type { KBEffect } from './useKBEffect';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default KB;
