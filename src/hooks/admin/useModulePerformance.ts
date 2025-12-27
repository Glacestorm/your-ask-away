import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';

export interface PerformanceMetrics {
  moduleKey: string;
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  avgRequestTime: number;
}

export interface CacheEntry {
  key: string;
  moduleKey: string;
  size: number;
  hits: number;
  lastAccess: string;
  expiresAt: string;
  data?: unknown;
}

export interface LazyLoadConfig {
  moduleKey: string;
  enabled: boolean;
  preloadOnHover: boolean;
  prefetchDistance: number;
  priority: 'high' | 'low' | 'auto';
}

export function useModulePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [lazyLoadConfigs, setLazyLoadConfigs] = useState<LazyLoadConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const moduleCache = useRef<Map<string, { data: unknown; timestamp: number; ttl: number }>>(new Map());
  const prefetchQueue = useRef<Set<string>>(new Set());

  // Cache TTL en milisegundos (5 minutos por defecto)
  const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simular métricas de performance
      const mockMetrics: PerformanceMetrics[] = [
        {
          moduleKey: 'crm',
          loadTime: 245,
          renderTime: 120,
          bundleSize: 156000,
          memoryUsage: 45,
          cacheHitRate: 87,
          networkRequests: 12,
          avgRequestTime: 85
        },
        {
          moduleKey: 'analytics',
          loadTime: 380,
          renderTime: 180,
          bundleSize: 234000,
          memoryUsage: 62,
          cacheHitRate: 72,
          networkRequests: 24,
          avgRequestTime: 145
        },
        {
          moduleKey: 'ai-copilot',
          loadTime: 520,
          renderTime: 90,
          bundleSize: 312000,
          memoryUsage: 38,
          cacheHitRate: 95,
          networkRequests: 8,
          avgRequestTime: 250
        },
        {
          moduleKey: 'marketplace',
          loadTime: 290,
          renderTime: 150,
          bundleSize: 178000,
          memoryUsage: 55,
          cacheHitRate: 65,
          networkRequests: 18,
          avgRequestTime: 120
        }
      ];

      setMetrics(mockMetrics);

      // Simular entradas de caché
      const mockCache: CacheEntry[] = [
        {
          key: 'crm:companies:list',
          moduleKey: 'crm',
          size: 45000,
          hits: 234,
          lastAccess: new Date(Date.now() - 30000).toISOString(),
          expiresAt: new Date(Date.now() + 270000).toISOString()
        },
        {
          key: 'analytics:dashboard:main',
          moduleKey: 'analytics',
          size: 78000,
          hits: 156,
          lastAccess: new Date(Date.now() - 60000).toISOString(),
          expiresAt: new Date(Date.now() + 240000).toISOString()
        },
        {
          key: 'ai-copilot:suggestions:recent',
          moduleKey: 'ai-copilot',
          size: 12000,
          hits: 89,
          lastAccess: new Date(Date.now() - 120000).toISOString(),
          expiresAt: new Date(Date.now() + 180000).toISOString()
        }
      ];

      setCacheEntries(mockCache);

      // Configuraciones de lazy loading
      const mockLazyConfigs: LazyLoadConfig[] = [
        { moduleKey: 'crm', enabled: true, preloadOnHover: true, prefetchDistance: 2, priority: 'high' },
        { moduleKey: 'analytics', enabled: true, preloadOnHover: true, prefetchDistance: 3, priority: 'auto' },
        { moduleKey: 'ai-copilot', enabled: true, preloadOnHover: false, prefetchDistance: 1, priority: 'high' },
        { moduleKey: 'marketplace', enabled: true, preloadOnHover: true, prefetchDistance: 2, priority: 'low' }
      ];

      setLazyLoadConfigs(mockLazyConfigs);
    } catch (error) {
      console.error('[useModulePerformance] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sistema de caché en memoria
  const setCache = useCallback((key: string, data: unknown, ttl = DEFAULT_CACHE_TTL) => {
    moduleCache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, []);

  const getCache = useCallback(<T>(key: string): T | null => {
    const entry = moduleCache.current.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      moduleCache.current.delete(key);
      return null;
    }

    return entry.data as T;
  }, []);

  const invalidateCache = useCallback((pattern?: string) => {
    if (!pattern) {
      moduleCache.current.clear();
      toast.success('Caché limpiado completamente');
      return;
    }

    const keysToDelete: string[] = [];
    moduleCache.current.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => moduleCache.current.delete(key));
    toast.success(`Caché invalidado: ${keysToDelete.length} entradas`);
  }, []);

  // Prefetch de módulos
  const prefetchModule = useCallback(async (moduleKey: string) => {
    if (prefetchQueue.current.has(moduleKey)) return;

    prefetchQueue.current.add(moduleKey);
    
    try {
      // Simular prefetch - en producción cargaría el chunk del módulo
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`[Performance] Prefetched module: ${moduleKey}`);
    } catch (error) {
      console.error(`[Performance] Prefetch failed for ${moduleKey}:`, error);
    } finally {
      prefetchQueue.current.delete(moduleKey);
    }
  }, []);

  // Actualizar configuración de lazy loading
  const updateLazyLoadConfig = useCallback((moduleKey: string, config: Partial<LazyLoadConfig>) => {
    setLazyLoadConfigs(prev => prev.map(c =>
      c.moduleKey === moduleKey ? { ...c, ...config } : c
    ));
    toast.success(`Configuración actualizada para ${moduleKey}`);
  }, []);

  // Optimizar módulo (análisis y recomendaciones)
  const optimizeModule = useCallback(async (moduleKey: string) => {
    toast.info(`Analizando ${moduleKey}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const recommendations = [
      'Implementar code splitting para reducir bundle size',
      'Añadir memoization a componentes pesados',
      'Optimizar queries con paginación lazy',
      'Habilitar compresión gzip/brotli'
    ];

    toast.success(`Optimización completada. ${recommendations.length} recomendaciones generadas.`);
    
    return recommendations;
  }, []);

  // Estadísticas agregadas
  const aggregateStats = useMemo(() => {
    if (metrics.length === 0) return null;

    return {
      avgLoadTime: Math.round(metrics.reduce((acc, m) => acc + m.loadTime, 0) / metrics.length),
      avgRenderTime: Math.round(metrics.reduce((acc, m) => acc + m.renderTime, 0) / metrics.length),
      totalBundleSize: metrics.reduce((acc, m) => acc + m.bundleSize, 0),
      avgMemoryUsage: Math.round(metrics.reduce((acc, m) => acc + m.memoryUsage, 0) / metrics.length),
      avgCacheHitRate: Math.round(metrics.reduce((acc, m) => acc + m.cacheHitRate, 0) / metrics.length),
      totalCacheSize: cacheEntries.reduce((acc, c) => acc + c.size, 0),
      totalCacheHits: cacheEntries.reduce((acc, c) => acc + c.hits, 0)
    };
  }, [metrics, cacheEntries]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    cacheEntries,
    lazyLoadConfigs,
    isLoading,
    aggregateStats,
    fetchMetrics,
    setCache,
    getCache,
    invalidateCache,
    prefetchModule,
    updateLazyLoadConfig,
    optimizeModule
  };
}

export default useModulePerformance;
