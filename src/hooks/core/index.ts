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

// React 19 Hooks (KB 4.5)
export {
  useKBOptimistic,
  useKBFormAction,
  useKBUse,
  clearKBUseCache,
  preloadKBResource,
  getKBOptimisticStats,
  resetKBOptimisticCircuits,
} from './useKBReact19';

// Schema Validation (KB 4.5)
export {
  useKBSchema,
  useKBFormSchema,
  useKBAsyncSchema,
  KBSchemaPatterns,
  noProfanity,
  maxFileSize,
  allowedFileTypes,
} from './useKBSchema';

// OpenTelemetry Enhanced (KB 4.5)
export {
  useKBSpan,
  useComponentTracing,
  useDBTracing,
  useHTTPTracing,
  SpanKind,
  SemanticAttributes,
  span,
} from './useKBSpan';

export type {
  UseKBSpanOptions,
  UseKBSpanReturn,
  SpanEventOptions,
  UseComponentTracingOptions,
  UseComponentTracingReturn,
  SpanLink,
  SpanAttributeValue,
  KBEnhancedSpan,
} from './useKBSpan';

// Optimistic Mutations (KB 4.5)
export {
  useKBOptimisticMutation,
  useKBBatchMutation,
  useKBMutationQueue,
} from './useKBOptimisticMutation';

export type {
  OptimisticMutationOptions,
  OptimisticMutationState,
  OptimisticMutationReturn,
  MutationHistoryEntry,
  MutationStats,
  BatchMutationOptions,
} from './useKBOptimisticMutation';

// Offline-First (KB 4.5)
export {
  useKBOffline,
  useKBSyncQueue,
  useKBOfflineFirst,
  useNetworkStatus,
} from './useKBOffline';

export type {
  ConflictResolutionStrategy,
  SyncStatus,
  OfflineEntry,
  SyncOperation,
  ConflictInfo,
  KBOfflineConfig,
  SyncResult,
  KBOfflineState,
  KBOfflineReturn,
  SyncQueueConfig,
  OfflineFirstConfig,
} from './useKBOffline';

// Performance Monitoring (KB 4.5)
export {
  useKBPerformance,
  useKBResourceTiming,
  useKBLongTask,
  useKBComponentPerf,
} from './useKBPerformance';

export type {
  WebVitalName,
  WebVitalMetric,
  PerformanceBudget,
  BudgetViolation,
  ResourceTiming,
  LongTask,
  MemoryInfo,
  FrameRateInfo,
  PerformanceSnapshot,
  UseKBPerformanceOptions,
  UseKBPerformanceReturn,
  UseKBResourceTimingOptions,
  UseKBResourceTimingReturn,
  UseKBLongTaskOptions,
  UseKBLongTaskReturn,
  UseKBComponentPerfOptions,
  UseKBComponentPerfReturn,
} from './useKBPerformance';

// Testing Utilities (KB 4.5)
export {
  createMockQuery,
  createMockMutation,
  createMockStore,
  waitForKBState,
  flushPromises,
  createDeferred,
  createNetworkSimulator,
  createKBTestContext,
  recordCall,
  assertKBState,
  assertCallCount,
  assertLastCallArgs,
  useRenderCounter,
  useValueTracker,
  useExecutionTimer,
  createStateSnapshot,
  compareSnapshots,
  createKBTestWrapper,
} from './useKBTesting';

export type {
  MockQueryOptions,
  MockMutationOptions,
  MockStoreOptions,
  TestWrapperOptions,
  KBTestContext,
  CallHistoryEntry,
  MockQueryReturn,
  MockMutationReturn,
  MockStoreReturn,
} from './useKBTesting';

// DevTools & Debugging (KB 4.5)
export {
  useKBDevTools,
  useHookInspector,
  usePerformanceProfiler,
  useKBDevToolsIntegration,
  computeStateDiff,
  KBDevTools,
} from './useKBDevTools';

export type {
  DevToolsAction,
  DevToolsState,
  DevToolsFilters,
  HookSnapshot,
  PerformanceProfile,
  StateTimeline,
  StateDiff,
  UseKBDevToolsOptions,
  UseKBDevToolsReturn,
  UseHookInspectorOptions,
  UseHookInspectorReturn,
  UsePerformanceProfilerOptions,
  UsePerformanceProfilerReturn,
  UseKBDevToolsIntegrationOptions,
  UseKBDevToolsIntegrationReturn,
} from './useKBDevTools';

// Middleware & Interceptors (KB 4.5)
export {
  useKBMiddleware,
  useKBWithMiddleware,
  MiddlewareChain,
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

export type {
  MiddlewareContext,
  RequestContext,
  ResponseContext,
  ErrorContext,
  NextFunction,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  MiddlewareConfig,
  MiddlewareChainOptions,
  UseKBMiddlewareOptions,
  UseKBMiddlewareReturn,
  UseKBWithMiddlewareOptions,
  UseKBWithMiddlewareReturn,
} from './useKBMiddleware';

// Feature Flags & A/B Testing (KB 4.5)
export {
  useFeatureFlag,
  useIsFeatureEnabled,
  useFeatureVariant,
  useABTest,
  useFeatureFlagContext,
  useRegisterFlags,
  useFeatureFlagOverrides,
  FeatureFlagProvider,
  FeatureGate,
  KBFeatureFlags,
} from './useKBFeatureFlags';

export type {
  FlagValue,
  FeatureFlag,
  FlagVariant,
  TargetingRule,
  TargetingOperator,
  RolloutConfig,
  UserContext,
  FlagEvaluation,
  EvaluationReason,
  ABTestConfig,
  ABVariant,
  ABExposure,
  FeatureFlagProviderProps,
  FeatureGateProps,
  UseABTestOptions,
  UseABTestReturn,
} from './useKBFeatureFlags';

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
export { default as useKBReact19Default } from './useKBReact19';
export { default as useKBSchemaDefault } from './useKBSchema';
export { default as useKBOptimisticMutationDefault } from './useKBOptimisticMutation';
export { default as useKBOfflineDefault } from './useKBOffline';
export { default as useKBPerformanceDefault } from './useKBPerformance';
export { default as useKBTestingDefault } from './useKBTesting';
export { default as useKBDevToolsDefault } from './useKBDevTools';
export { default as useKBMiddlewareDefault } from './useKBMiddleware';
export { default as useKBFeatureFlagsDefault } from './useKBFeatureFlags';

// Enterprise Hooks (KB 4.5)
export {
  useKBEnterpriseBase,
  useKBCompliance,
  useKBCommandCenter,
  useKBWorkflowEngine,
  useKBBusinessIntelligence,
  useKBEnterpriseAll,
} from './useKBEnterprise';

export type {
  EnterpriseContext,
  ComplianceMetrics,
  ComplianceViolation,
  PredictedRisk,
  SystemHealth,
  SystemHealthMetric,
  Alert,
  LiveActivity,
  Workflow,
  WorkflowExecution,
  AutomationRule,
  KPI,
  BIInsight,
  Prediction,
  Correlation,
} from './useKBEnterprise';

// Unified API (KB 4.5)
export { KB, default as KBDefault } from './useKB';
