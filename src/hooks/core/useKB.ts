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

// Phase 14: State Machines & Workflows
import { useKBStateMachine, useKBWorkflow } from './useKBStateMachine';

// Phase 14: Pagination
import {
  useKBPagination,
  useKBCursorPagination,
  useKBInfiniteScroll,
  useKBVirtualList,
} from './useKBPagination';

// Phase 14: Debounce & Throttle
import { useKBDebounce, useKBThrottle } from './useKBDebounceThrottle';

// Phase 14: Validation
import { useKBValidation, useKBFormValidation } from './useKBValidation';

// Phase 14: Analytics
import { useKBAnalytics, useKBTracing } from './useKBAnalytics';

// Phase 14: WebSocket
import {
  useKBWebSocket,
  useKBChannel,
  useKBPresence,
  useKBRealtimeSync,
} from './useKBWebSocket';

// Phase 14: DataLoader
import {
  useKBDataLoader,
  useKBQueryBatcher,
  useKBPriorityLoader,
} from './useKBDataLoader';

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

  // === PHASE 14: ADVANCED PATTERNS ===
  // State Machines & Workflows
  useStateMachine: useKBStateMachine,
  useWorkflow: useKBWorkflow,
  
  // Pagination & Infinite Scroll
  usePagination: useKBPagination,
  useCursorPagination: useKBCursorPagination,
  useInfiniteScroll: useKBInfiniteScroll,
  useVirtualList: useKBVirtualList,
  
  // Debounce & Throttle
  useDebounce: useKBDebounce,
  useThrottle: useKBThrottle,
  
  // Validation
  useValidation: useKBValidation,
  useFormValidation: useKBFormValidation,
  
  // Analytics & Telemetry
  useAnalytics: useKBAnalytics,
  useTracing: useKBTracing,
  
  // WebSocket & Real-time
  useWebSocket: useKBWebSocket,
  useChannel: useKBChannel,
  usePresence: useKBPresence,
  useRealtimeSync: useKBRealtimeSync,
  
  // DataLoader & Batching
  useDataLoader: useKBDataLoader,
  useQueryBatcher: useKBQueryBatcher,
  usePriorityLoader: useKBPriorityLoader,

  // === PHASE 15: ADVANCED STATE & SYNC PATTERNS ===
  // Prefetching & Preloading
  usePrefetchAdvanced: null as unknown as typeof import('./useKBPrefetch').useKBPrefetch,
  usePreload: null as unknown as typeof import('./useKBPrefetch').useKBPreload,
  useLinkPrefetch: null as unknown as typeof import('./useKBPrefetch').useKBLinkPrefetch,
  usePredictivePrefetch: null as unknown as typeof import('./useKBPrefetch').useKBPredictivePrefetch,
  useBatchPrefetch: null as unknown as typeof import('./useKBPrefetch').useKBBatchPrefetch,
  useRoutePreload: null as unknown as typeof import('./useKBPrefetch').useKBRoutePreload,
  
  // Background Sync
  useBackgroundSync: null as unknown as typeof import('./useKBBackgroundSync').useKBBackgroundSync,
  usePeriodicSync: null as unknown as typeof import('./useKBBackgroundSync').useKBPeriodicSync,
  useSyncStatus: null as unknown as typeof import('./useKBBackgroundSync').useKBSyncStatus,
  useOptimisticSync: null as unknown as typeof import('./useKBBackgroundSync').useKBOptimisticSync,
  
  // Undo/Redo
  useUndoRedo: null as unknown as typeof import('./useKBUndoRedo').useKBUndoRedo,
  useStateHistory: null as unknown as typeof import('./useKBUndoRedo').useKBStateHistory,
  useTransactional: null as unknown as typeof import('./useKBUndoRedo').useKBTransactional,
  useCheckpoint: null as unknown as typeof import('./useKBUndoRedo').useKBCheckpoint,
  
  // Snapshot & Restore
  useSnapshot: null as unknown as typeof import('./useKBSnapshot').useKBSnapshot,
  useFormSnapshot: null as unknown as typeof import('./useKBSnapshot').useKBFormSnapshot,
  useStateSerializer: null as unknown as typeof import('./useKBSnapshot').useKBStateSerializer,
  
  // Query Persistence
  useQueryPersistence: null as unknown as typeof import('./useKBQueryPersistence').useKBQueryPersistence,
  useURLQuery: null as unknown as typeof import('./useKBQueryPersistence').useKBURLQuery,
  useFilterPersistence: null as unknown as typeof import('./useKBQueryPersistence').useKBFilterPersistence,
  useSortPersistence: null as unknown as typeof import('./useKBQueryPersistence').useKBSortPersistence,
  useViewPersistence: null as unknown as typeof import('./useKBQueryPersistence').useKBViewPersistence,
  
  // Request Cancellation
  useCancellation: null as unknown as typeof import('./useKBCancellation').useKBCancellation,
  useAbortableFetch: null as unknown as typeof import('./useKBCancellation').useKBAbortableFetch,
  useRaceCondition: null as unknown as typeof import('./useKBCancellation').useKBRaceCondition,
  useDebounceCancel: null as unknown as typeof import('./useKBCancellation').useKBDebounceCancel,
  useSequentialCancel: null as unknown as typeof import('./useKBCancellation').useKBSequentialCancel,
  useCancellablePromise: null as unknown as typeof import('./useKBCancellation').useKBCancellablePromise,
  
  // Hydration & SSR
  useHydration: null as unknown as typeof import('./useKBHydration').useKBHydration,
  useIsomorphic: null as unknown as typeof import('./useKBHydration').useKBIsomorphic,
  useClientOnly: null as unknown as typeof import('./useKBHydration').useKBClientOnly,
  useSSRSafe: null as unknown as typeof import('./useKBHydration').useKBSSRSafe,
  useHydratedState: null as unknown as typeof import('./useKBHydration').useKBHydratedState,
  useDeferred: null as unknown as typeof import('./useKBHydration').useKBDeferred,
  useWindowEvent: null as unknown as typeof import('./useKBHydration').useKBWindowEvent,
  useMediaQuery: null as unknown as typeof import('./useKBHydration').useKBMediaQuery,
  usePrefersDarkMode: null as unknown as typeof import('./useKBHydration').useKBPrefersDarkMode,
  usePrefersReducedMotion: null as unknown as typeof import('./useKBHydration').useKBPrefersReducedMotion,
  useDocumentVisibility: null as unknown as typeof import('./useKBHydration').useKBDocumentVisibility,
  useNetworkStatus: null as unknown as typeof import('./useKBHydration').useKBNetworkStatus,
  useScrollRestoration: null as unknown as typeof import('./useKBHydration').useKBScrollRestoration,
  
  // ========== PHASE 16: ENTERPRISE PATTERNS ==========
  
  // Dependency Injection
  useService: null as unknown as typeof import('./useKBDependencyInjection').useService,
  useServices: null as unknown as typeof import('./useKBDependencyInjection').useServices,
  useContainer: null as unknown as typeof import('./useKBDependencyInjection').useContainer,
  useServiceRegistration: null as unknown as typeof import('./useKBDependencyInjection').useServiceRegistration,
  useLazyService: null as unknown as typeof import('./useKBDependencyInjection').useLazyService,
  useOptionalService: null as unknown as typeof import('./useKBDependencyInjection').useOptionalService,
  
  // Event Sourcing
  useEventSourcing: null as unknown as typeof import('./useKBEventSourcing').useKBEventSourcing,
  useProjection: null as unknown as typeof import('./useKBEventSourcing').useKBProjection,
  useAggregate: null as unknown as typeof import('./useKBEventSourcing').useKBAggregate,
  
  // CQRS
  useCQRS: null as unknown as typeof import('./useKBCQRS').useKBCQRS,
  useCommand: null as unknown as typeof import('./useKBCQRS').useKBCommand,
  useQueryCQRS: null as unknown as typeof import('./useKBCQRS').useKBQueryCQRS,
  useReadModel: null as unknown as typeof import('./useKBCQRS').useKBReadModel,
  useWriteModel: null as unknown as typeof import('./useKBCQRS').useKBWriteModel,
  
  // Saga
  useSaga: null as unknown as typeof import('./useKBSaga').useKBSaga,
  useSagaBuilder: null as unknown as typeof import('./useKBSaga').useKBSagaBuilder,
  useOrchestrator: null as unknown as typeof import('./useKBSaga').useKBOrchestrator,
  
  // Plugin System
  usePlugin: null as unknown as typeof import('./useKBPlugin').usePlugin,
  usePluginHost: null as unknown as typeof import('./useKBPlugin').usePluginHost,
  usePluginApi: null as unknown as typeof import('./useKBPlugin').usePluginApi,
  usePlugins: null as unknown as typeof import('./useKBPlugin').usePlugins,
  usePluginRegistration: null as unknown as typeof import('./useKBPlugin').usePluginRegistration,
  usePluginEvent: null as unknown as typeof import('./useKBPlugin').usePluginEvent,
  
  // Resource Pool
  useResourcePool: null as unknown as typeof import('./useKBResourcePool').useKBResourcePool,
  useConnectionPool: null as unknown as typeof import('./useKBResourcePool').useKBConnectionPool,
  useWorkerPool: null as unknown as typeof import('./useKBResourcePool').useKBWorkerPool,
  useSemaphore: null as unknown as typeof import('./useKBResourcePool').useKBSemaphore,
  useRateLimiter: null as unknown as typeof import('./useKBResourcePool').useKBRateLimiter,
  
  // Health Check
  useHealthCheck: null as unknown as typeof import('./useKBHealthCheck').useKBHealthCheck,
  useLivenessProbe: null as unknown as typeof import('./useKBHealthCheck').useKBLivenessProbe,
  useReadinessProbe: null as unknown as typeof import('./useKBHealthCheck').useKBReadinessProbe,
  useStartupProbe: null as unknown as typeof import('./useKBHealthCheck').useKBStartupProbe,
  useDependencyHealth: null as unknown as typeof import('./useKBHealthCheck').useKBDependencyHealth,
  
  // ========== PHASE 17: DISTRIBUTED SYSTEMS ==========
  
  // Rate Limiting
  useRateLimiting: null as unknown as typeof import('./useKBRateLimiting').useKBRateLimiting,
  useDistributedRateLimiting: null as unknown as typeof import('./useKBRateLimiting').useKBDistributedRateLimiting,
  
  // Distributed Circuit Breaker
  useDistributedCircuitBreaker: null as unknown as typeof import('./useKBDistributedCircuitBreaker').useKBDistributedCircuitBreaker,
  useCircuitBreakerGroup: null as unknown as typeof import('./useKBDistributedCircuitBreaker').useKBCircuitBreakerGroup,
  
  // Multi-Tenant Isolation
  useTenantData: null as unknown as typeof import('./useKBTenantIsolation').useKBTenantData,
  useTenantResources: null as unknown as typeof import('./useKBTenantIsolation').useKBTenantResources,
  useTenantStorage: null as unknown as typeof import('./useKBTenantIsolation').useKBTenantStorage,
  useTenantGuard: null as unknown as typeof import('./useKBTenantIsolation').useKBTenantGuard,
  useTenantAudit: null as unknown as typeof import('./useKBTenantIsolation').useKBTenantAudit,
  
  // API Gateway
  useAPIGateway: null as unknown as typeof import('./useKBAPIGateway').useKBAPIGateway,
  useAPIComposition: null as unknown as typeof import('./useKBAPIGateway').useKBAPIComposition,
  
  // Service Mesh
  useServiceMesh: null as unknown as typeof import('./useKBServiceMesh').useKBServiceMesh,
  useSidecar: null as unknown as typeof import('./useKBServiceMesh').useKBSidecar,
  
  // Feature Toggle Enterprise
  useFeatureToggleEnterprise: null as unknown as typeof import('./useKBFeatureToggle').useFeatureToggle,
  useFeatureEnabled: null as unknown as typeof import('./useKBFeatureToggle').useFeatureEnabled,
  useFeatureValue: null as unknown as typeof import('./useKBFeatureToggle').useFeatureValue,
  useFeatureOverride: null as unknown as typeof import('./useKBFeatureToggle').useFeatureOverride,
  useFeatureAnalytics: null as unknown as typeof import('./useKBFeatureToggle').useFeatureAnalytics,
} as const;

// ============================================================================
// PHASE 18: Enterprise Observability & Compliance
// ============================================================================

export {
  useKBDistributedTracing,
  useKBHTTPTracing,
  useKBComponentTracing,
  w3cTracePropagator,
  consoleTracingExporter,
} from './useKBDistributedTracing';

export {
  useKBConfigManagement,
  useKBFeatureConfig,
  createEnvConfigSource,
  createLocalStorageConfigSource,
  createRemoteConfigSource,
} from './useKBConfigManagement';

export {
  useKBAuditLogging,
  useKBComplianceAudit,
  consoleAuditExporter,
  createLocalStorageAuditExporter,
  createHTTPAuditExporter,
} from './useKBAuditLogging';

export {
  useKBEncryption,
  useKBEncryptedStorage,
  useKBFieldEncryption,
} from './useKBEncryption';

export {
  useKBConsentManagement,
  useKBDataSubjectRights,
  useKBComplianceChecker,
  useKBDataAnonymization,
} from './useKBCompliance';

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
