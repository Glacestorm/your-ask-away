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

// ============================================================================
// PHASE 13: Advanced Features
// ============================================================================

// Error Boundaries & Recovery (KB 4.5)
export {
  useKBErrorBoundary,
  useKBAsyncErrorBoundary,
  useKBErrorRecovery,
  KBErrorBoundaryComponent,
  withKBErrorBoundary,
} from './useKBErrorBoundary';

export type {
  KBErrorBoundaryConfig,
  KBErrorState,
  KBErrorBoundaryReturn,
  KBAsyncErrorBoundaryReturn,
  KBAsyncErrorBoundaryOptions,
  KBErrorRecoveryOptions,
  RecoveryStrategy,
  RecoveryPlan,
} from './useKBErrorBoundary';

// Logging & Monitoring (KB 4.5)
export {
  useKBLogging,
  useKBPerformanceLogging,
  consoleExporter,
  localStorageExporter,
  createHttpExporter,
  createBatchExporter,
} from './useKBLogging';

export type {
  LogLevel,
  LogEntry,
  LogExporter,
  LoggerConfig,
  LoggerMetrics,
  PerformanceLogEntry,
} from './useKBLogging';

// Advanced Cache Strategies (KB 4.5)
export {
  useKBLRUCache,
  useKBCacheWarming,
  useKBPrefetch,
  useKBSmartCache,
  LRUCache,
  calculateDynamicTTL,
} from './useKBAdvancedCache';

export type {
  LRUCacheConfig,
  DynamicTTLConfig,
  CacheMetadata,
  CacheWarmingConfig,
  PrefetchConfig,
  SmartCacheConfig,
} from './useKBAdvancedCache';

// i18n & Localization (KB 4.5)
export {
  useKBi18n,
  useKBTranslation,
  useKBLocaleDirection,
  I18nProvider,
} from './useKBi18n';

export type {
  Locale,
  TranslationKey,
  TranslationValue,
  TranslationDictionary,
  LocaleConfig,
  I18nConfig,
} from './useKBi18n';

// Testing Mocks (KB 4.5)
export {
  mockStore,
  MockTimer,
  MockNetwork,
  createMockQuery as createAdvancedMockQuery,
  createMockMutation as createAdvancedMockMutation,
  createMockStream,
  waitFor,
  waitForCondition,
  createSpyFn,
  createMockProvider,
} from './useKBTestingMocks';

export type {
  MockConfig,
  MockStore as MockStoreType,
  MockTimeline,
  MockAssertion,
} from './useKBTestingMocks';

// ============================================================================
// PHASE 14: Advanced Patterns
// ============================================================================

// State Machines & Workflows (KB 4.5)
export {
  useKBStateMachine,
  useKBWorkflow,
} from './useKBStateMachine';

export type {
  KBStateNode,
  KBMachineConfig,
  KBMachineState,
  KBWorkflowStep,
  KBWorkflowConfig,
  KBWorkflowState,
  KBEvent,
  KBTransition,
  KBAction,
  KBGuard,
} from './useKBStateMachine';

// Pagination & Infinite Scroll (KB 4.5)
export {
  useKBPagination,
  useKBCursorPagination,
  useKBKeysetPagination,
  useKBInfiniteScroll,
  useKBVirtualList,
} from './useKBPagination';

export type {
  KBPaginationConfig,
  KBPaginationState,
  KBPaginationActions,
  KBCursorPaginationConfig,
  KBCursorPaginationState,
  KBInfiniteScrollConfig,
  KBInfiniteScrollState,
  KBVirtualListConfig,
} from './useKBPagination';

// Debounce & Throttle (KB 4.5)
export {
  useKBDebounce,
  useKBThrottle,
  useKBDebounceState,
  useKBThrottleState,
  useKBDebouncedCallback,
  useKBThrottledCallback,
  useKBSearchDebounce,
  useKBResizeThrottle,
  useKBScrollThrottle,
  useKBInputDebounce,
  useKBRAFThrottle,
} from './useKBDebounceThrottle';

// Data Validation & Schema Evolution (KB 4.5)
export {
  useKBValidation,
  useKBSchemaEvolution,
  useKBFormValidation,
  validateWithSchema,
} from './useKBValidation';

export type {
  KBValidationResult,
  KBValidationError,
  KBSchemaVersion,
  KBSchemaRegistry,
  KBValidationConfig,
  KBFormValidationState,
} from './useKBValidation';

// Analytics & Telemetry (KB 4.5)
export {
  useKBAnalytics,
  useKBTracing,
} from './useKBAnalytics';

export type {
  KBAnalyticsEvent,
  KBAnalyticsConfig,
  KBAnalyticsContext,
  KBMetricData,
  KBSpanData,
  KBAnalyticsProvider,
} from './useKBAnalytics';

// WebSocket & Real-time (KB 4.5)
export {
  useKBWebSocket,
  useKBChannel,
  useKBPresence,
  useKBRealtimeSync,
  useKBBinaryWebSocket,
} from './useKBWebSocket';

export type {
  KBWebSocketConfig,
  KBWebSocketState,
  KBWebSocketStatus,
  KBWebSocketMessage,
  KBWebSocketReturn,
  KBChannelConfig,
  KBPresenceConfig,
  KBPresenceUser,
} from './useKBWebSocket';

// Query Batching & DataLoader (KB 4.5)
export {
  useKBDataLoader,
  useKBQueryBatcher,
  useKBRequestDeduplicator,
  useKBAggregateLoader,
  useKBPriorityLoader,
} from './useKBDataLoader';

export type {
  KBDataLoaderConfig,
  KBDataLoaderStats,
  KBQueryBatcherConfig,
  KBAggregateLoaderConfig,
  KBBatchedRequest,
} from './useKBDataLoader';

// ============================================================================
// PHASE 15: Advanced State & Sync Patterns
// ============================================================================

// Prefetching & Preloading (KB 4.5 - Phase 15)
export {
  useKBPrefetch as useKBPrefetchAdvanced,
  useKBPreload,
  useKBLinkPrefetch,
  useKBPredictivePrefetch,
  useKBBatchPrefetch,
  useKBRoutePreload,
} from './useKBPrefetch';

export type {
  KBPrefetchConfig as KBPrefetchAdvancedConfig,
  KBPrefetchState as KBPrefetchAdvancedState,
  KBPrefetchReturn,
  KBPreloadConfig,
  KBPreloadResource,
  KBPreloadState,
  KBLinkPrefetchConfig,
  KBPredictivePrefetchConfig,
  KBPredictionContext,
  KBBatchPrefetchConfig,
  KBRoutePreloadConfig,
} from './useKBPrefetch';

// Background Sync (KB 4.5)
export {
  useKBBackgroundSync,
  useKBPeriodicSync,
  useKBSyncStatus,
  useKBOptimisticSync,
} from './useKBBackgroundSync';

export type {
  KBSyncConfig,
  KBSyncState,
  KBSyncOperation,
  KBSyncResult,
  KBSyncError,
  KBSyncConflict,
  KBSyncReturn,
  KBPeriodicSyncConfig,
  KBOptimisticSyncConfig,
} from './useKBBackgroundSync';

// Undo/Redo (KB 4.5)
export {
  useKBUndoRedo,
  useKBStateHistory,
  useKBTransactional,
  useKBCheckpoint,
  createCommand,
  createValueCommand,
} from './useKBUndoRedo';

export type {
  KBCommand,
  KBUndoRedoConfig,
  KBUndoRedoState,
  KBUndoRedoReturn,
  KBStateHistoryConfig,
  KBTransactionContext,
} from './useKBUndoRedo';

// Snapshot & Restore (KB 4.5)
export {
  useKBSnapshot,
  useKBFormSnapshot,
  useKBStateSerializer,
} from './useKBSnapshot';

export type {
  KBSnapshotConfig,
  KBSnapshot,
  KBSnapshotState,
  KBSnapshotReturn,
  KBSnapshotDiff,
  KBSerializerConfig,
} from './useKBSnapshot';

// Query Persistence (KB 4.5)
export {
  useKBQueryPersistence,
  useKBURLQuery,
  useKBFilterPersistence,
  useKBSortPersistence,
  useKBViewPersistence,
} from './useKBQueryPersistence';

export type {
  KBQueryPersistenceConfig,
  KBQueryPersistenceState,
  KBQueryPersistenceReturn,
  KBURLQueryConfig,
  KBFilter,
  KBFilterPersistenceConfig,
  KBSort,
  KBSortPersistenceConfig,
  KBViewConfig,
} from './useKBQueryPersistence';

// Request Cancellation (KB 4.5)
export {
  useKBCancellation,
  useKBAbortableFetch,
  useKBRaceCondition,
  useKBDebounceCancel,
  useKBSequentialCancel,
  useKBCancellablePromise,
  KBCancellationError,
} from './useKBCancellation';

export type {
  KBCancellationConfig,
  KBCancellationToken,
  KBCancellationState,
  KBCancellationReturn,
  KBAbortableFetchConfig,
} from './useKBCancellation';

// Hydration & SSR (KB 4.5)
export {
  useKBHydration,
  useKBIsomorphic,
  useKBClientOnly,
  useKBSSRSafe,
  useKBHydratedState,
  useKBDeferred,
  useKBWindowEvent,
  useKBMediaQuery,
  useKBPrefersDarkMode,
  useKBPrefersReducedMotion,
  useKBDocumentVisibility,
  useKBNetworkStatus,
  useKBScrollRestoration,
  getHydrationData,
  setHydrationData,
  markHydrated,
  isHydrated,
  dehydrateAll,
  createHydrationScript,
} from './useKBHydration';

export type {
  KBHydrationConfig,
  KBHydrationState,
  KBHydrationReturn,
  KBNetworkStatus,
} from './useKBHydration';

// ============================================================================
// PHASE 16: ENTERPRISE PATTERNS
// ============================================================================

// Dependency Injection (KB 4.5)
export {
  useService,
  useServices,
  useContainer,
  useServiceRegistration,
  useLazyService,
  useOptionalService,
  ContainerProvider,
  createContainer,
  createServiceDescriptor,
  createServiceIdentifier,
  Injectable,
  Inject,
  createModule,
  registerModule,
  createMockContainer,
} from './useKBDependencyInjection';

export type {
  ServiceIdentifier,
  ServiceDescriptor,
  ServiceRegistration,
  IContainer,
  ContainerConfig,
  ServiceLifecycle,
  ContainerProviderProps,
  ModuleDefinition,
} from './useKBDependencyInjection';

// Event Sourcing (KB 4.5)
export {
  useKBEventSourcing,
  useKBProjection,
  useKBAggregate,
  createEventStore,
  createProjection,
  createEvent,
} from './useKBEventSourcing';

export type {
  KBEvent as KBEventSourcing,
  EventMetadata,
  Snapshot,
  EventStore,
  Projection,
  KBEventSourcingConfig,
  KBEventSourcingState,
} from './useKBEventSourcing';

// CQRS Pattern (KB 4.5)
export {
  useKBCQRS,
  useKBCommand,
  useKBQueryCQRS,
  useKBReadModel,
  useKBWriteModel,
  getCommandBus,
  getQueryBus,
  createValidationMiddleware,
  createAuditMiddleware,
} from './useKBCQRS';

export type {
  Command,
  CommandMetadata,
  CommandResult,
  Query,
  QueryResult,
  CommandHandler,
  QueryHandler,
  CommandMiddleware,
  KBCQRSConfig,
} from './useKBCQRS';

// Saga Pattern (KB 4.5)
export {
  useKBSaga,
  useKBSagaBuilder,
  useKBOrchestrator,
  createSaga,
  createStep,
  createApiStep,
  createDbStep,
  createNotificationStep,
} from './useKBSaga';

export type {
  SagaStep,
  SagaDefinition,
  SagaStatus,
  SagaStepResult,
  SagaState,
  SagaConfig,
} from './useKBSaga';

// Plugin System (KB 4.5)
export {
  usePlugin,
  usePluginHost,
  usePluginApi,
  usePlugins,
  usePluginRegistration,
  usePluginEvent,
  usePluginHook,
  usePluginComponents,
  usePluginRoutes,
  PluginProvider,
  createPlugin,
  createPluginApi,
  createExtensionPoint,
  useExtensionPoint,
} from './useKBPlugin';

export type {
  Plugin,
  PluginHooks,
  PluginRoute,
  PluginHost,
  PluginManagerConfig,
  PluginState,
  PluginProviderProps,
} from './useKBPlugin';

// Resource Pool (KB 4.5)
export {
  useKBResourcePool,
  useKBConnectionPool,
  useKBWorkerPool,
  useKBSemaphore,
  useKBRateLimiter,
  createResourcePool,
} from './useKBResourcePool';

export type {
  PooledResource,
  ResourcePoolConfig,
  PoolStats,
} from './useKBResourcePool';

// Health Check (KB 4.5)
export {
  useKBHealthCheck,
  useKBLivenessProbe,
  useKBReadinessProbe,
  useKBStartupProbe,
  useKBDependencyHealth,
  createHealthCheck,
  CommonHealthChecks,
} from './useKBHealthCheck';

export type {
  HealthStatus,
  HealthCheckResult,
  HealthCheck,
  HealthReport,
  HealthCheckConfig,
} from './useKBHealthCheck';
