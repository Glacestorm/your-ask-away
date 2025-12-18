/**
 * Performance Components Index
 * 
 * Exports all performance optimization components including:
 * - Islands Architecture (Partial Hydration)
 * - Streaming SSR Boundaries
 * - Optimized Image Loading
 * - SSR Cache Provider
 * - Performance Monitoring
 */

// Islands Architecture (Partial Hydration) - 100% Implementation
export {
  Island,
  StaticContent,
  ClientOnly,
  withIsland,
  LazyIsland,
  useIslandHydration,
  IslandGroup,
  InteractiveIsland,
  getIslandStats
} from './IslandArchitecture';

// Streaming SSR Boundaries
export {
  StreamingBoundary,
  CardStreamingSkeleton,
  TableStreamingSkeleton,
  ChartStreamingSkeleton,
  DashboardStreamingSkeleton,
  PageStreamingSkeleton,
  InlineStreamingIndicator,
  ProgressiveReveal
} from './StreamingBoundary';

// Optimized Image Loading
export { OptimizedImage, preloadImage, preloadImages } from './OptimizedImage';

// SSR Cache Provider
export {
  SSRCacheProvider,
  useSSRCache,
  withSSRCache,
  useModuleCache
} from './SSRCacheProvider';

// Performance Monitor
export { PerformanceMonitor } from './PerformanceMonitor';
