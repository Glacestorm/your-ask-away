/**
 * Hook for image optimization with automatic compression and format conversion
 * KB 2.0 Pattern
 */
import { useState, useCallback } from 'react';
import {
  optimizeImage,
  optimizeImageBatch,
  generateResponsiveSizes,
  getBestFormat,
  type OptimizedImage,
  type ImageOptimizationOptions,
  revokeOptimizedImageUrls,
  getOptimizationStats,
  formatBytes,
} from '@/lib/imageOptimizer';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, parseError, collectTelemetry } from '@/hooks/core/useKBBase';

// Re-export for backwards compat
export type OptimizedImageError = KBError;

interface UseOptimizedImageReturn {
  // State
  isOptimizing: boolean;
  progress: number;
  error: KBError | null;
  lastRefresh: Date | null;
  
  // Single image operations
  optimize: (file: File, options?: ImageOptimizationOptions) => Promise<OptimizedImage | null>;
  
  // Batch operations
  optimizeBatch: (files: File[], options?: ImageOptimizationOptions) => Promise<OptimizedImage[]>;
  
  // Responsive images
  generateResponsive: (file: File, sizes?: number[]) => Promise<Map<number, OptimizedImage>>;
  
  // Utilities
  getBestFormat: () => Promise<'avif' | 'webp' | 'jpeg'>;
  formatBytes: (bytes: number) => string;
  getStats: (images: OptimizedImage[]) => ReturnType<typeof getOptimizationStats>;
  cleanup: (images: OptimizedImage | OptimizedImage[]) => void;
  clearError: () => void;
  
  // === KB 2.0 ===
  status: KBStatus;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  lastSuccess: Date | null;
  retryCount: number;
  reset: () => void;
}

export function useOptimizedImage(): UseOptimizedImageReturn {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
    setProgress(0);
  }, []);

  const optimize = useCallback(async (
    file: File,
    options?: ImageOptimizationOptions
  ): Promise<OptimizedImage | null> => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);
    setStatus('loading');
    const startTime = Date.now();

    try {
      // Auto-detect best format if not specified
      const format = options?.format || await getBestFormat();
      
      const result = await optimizeImage(file, {
        ...options,
        format,
      });
      
      setProgress(100);
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      setRetryCount(0);
      collectTelemetry('useOptimizedImage', 'optimize', 'success', Date.now() - startTime);
      return result;
    } catch (e) {
      const parsedErr = parseError(e);
      const kbError = createKBError('OPTIMIZE_ERROR', parsedErr.message, { originalError: String(e) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useOptimizedImage', 'optimize', 'error', Date.now() - startTime, kbError);
      console.error('[useOptimizedImage] Optimization failed:', e);
      return null;
    } finally {
      setIsOptimizing(false);
      setLastRefresh(new Date());
    }
  }, []);

  const optimizeBatchHandler = useCallback(async (
    files: File[],
    options?: ImageOptimizationOptions
  ): Promise<OptimizedImage[]> => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);
    setStatus('loading');
    const startTime = Date.now();

    try {
      const format = options?.format || await getBestFormat();
      
      const results = await optimizeImageBatch(
        files,
        { ...options, format },
        (completed, total) => {
          setProgress(Math.round((completed / total) * 100));
        }
      );
      
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      setRetryCount(0);
      collectTelemetry('useOptimizedImage', 'optimizeBatch', 'success', Date.now() - startTime);
      return results;
    } catch (e) {
      const parsedErr = parseError(e);
      const kbError = createKBError('OPTIMIZE_BATCH_ERROR', parsedErr.message, { originalError: String(e) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useOptimizedImage', 'optimizeBatch', 'error', Date.now() - startTime, kbError);
      console.error('[useOptimizedImage] Batch optimization failed:', e);
      return [];
    } finally {
      setIsOptimizing(false);
      setLastRefresh(new Date());
    }
  }, []);

  const generateResponsiveHandler = useCallback(async (
    file: File,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<Map<number, OptimizedImage>> => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);
    setStatus('loading');
    const startTime = Date.now();

    try {
      const format = await getBestFormat();
      const results = await generateResponsiveSizes(file, sizes, { format });
      setProgress(100);
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      setRetryCount(0);
      collectTelemetry('useOptimizedImage', 'generateResponsive', 'success', Date.now() - startTime);
      return results;
    } catch (e) {
      const parsedErr = parseError(e);
      const kbError = createKBError('GENERATE_RESPONSIVE_ERROR', parsedErr.message, { originalError: String(e) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useOptimizedImage', 'generateResponsive', 'error', Date.now() - startTime, kbError);
      console.error('[useOptimizedImage] Responsive generation failed:', e);
      return new Map();
    } finally {
      setIsOptimizing(false);
      setLastRefresh(new Date());
    }
  }, []);

  const cleanup = useCallback((images: OptimizedImage | OptimizedImage[]) => {
    revokeOptimizedImageUrls(images);
  }, []);

  return {
    isOptimizing,
    progress,
    error,
    lastRefresh,
    optimize,
    optimizeBatch: optimizeBatchHandler,
    generateResponsive: generateResponsiveHandler,
    getBestFormat,
    formatBytes,
    getStats: getOptimizationStats,
    cleanup,
    clearError,
    // === KB 2.0 ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastSuccess,
    retryCount,
    reset,
  };
}

export default useOptimizedImage;
