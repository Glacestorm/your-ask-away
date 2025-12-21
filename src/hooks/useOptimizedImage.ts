/**
 * Hook for image optimization with automatic compression and format conversion
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

interface UseOptimizedImageReturn {
  // State
  isOptimizing: boolean;
  progress: number;
  error: string | null;
  
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
}

export function useOptimizedImage(): UseOptimizedImageReturn {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (
    file: File,
    options?: ImageOptimizationOptions
  ): Promise<OptimizedImage | null> => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);

    try {
      // Auto-detect best format if not specified
      const format = options?.format || await getBestFormat();
      
      const result = await optimizeImage(file, {
        ...options,
        format,
      });
      
      setProgress(100);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to optimize image';
      setError(message);
      console.error('[useOptimizedImage] Optimization failed:', e);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const optimizeBatchHandler = useCallback(async (
    files: File[],
    options?: ImageOptimizationOptions
  ): Promise<OptimizedImage[]> => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);

    try {
      const format = options?.format || await getBestFormat();
      
      const results = await optimizeImageBatch(
        files,
        { ...options, format },
        (completed, total) => {
          setProgress(Math.round((completed / total) * 100));
        }
      );
      
      return results;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to optimize images';
      setError(message);
      console.error('[useOptimizedImage] Batch optimization failed:', e);
      return [];
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const generateResponsiveHandler = useCallback(async (
    file: File,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<Map<number, OptimizedImage>> => {
    setIsOptimizing(true);
    setError(null);
    setProgress(0);

    try {
      const format = await getBestFormat();
      const results = await generateResponsiveSizes(file, sizes, { format });
      setProgress(100);
      return results;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate responsive images';
      setError(message);
      console.error('[useOptimizedImage] Responsive generation failed:', e);
      return new Map();
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const cleanup = useCallback((images: OptimizedImage | OptimizedImage[]) => {
    revokeOptimizedImageUrls(images);
  }, []);

  return {
    isOptimizing,
    progress,
    error,
    optimize,
    optimizeBatch: optimizeBatchHandler,
    generateResponsive: generateResponsiveHandler,
    getBestFormat,
    formatBytes,
    getStats: getOptimizationStats,
    cleanup,
  };
}

export default useOptimizedImage;
