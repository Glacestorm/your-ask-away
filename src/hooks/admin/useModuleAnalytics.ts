/**
 * useModuleAnalytics - Hook para analytics de módulos
 * Fase 5B: Métricas de uso, rendimiento y adopción
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ModuleUsageMetrics {
  moduleKey: string;
  moduleName: string;
  totalUsers: number;
  activeUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  totalSessions: number;
  featureUsage: Record<string, number>;
  lastUpdated: string;
}

export interface ModulePerformanceMetrics {
  moduleKey: string;
  loadTime: number;
  renderTime: number;
  errorRate: number;
  crashRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  lastUpdated: string;
}

export interface ModuleAdoptionMetrics {
  moduleKey: string;
  installCount: number;
  uninstallCount: number;
  retentionRate: number;
  activationRate: number;
  churnRate: number;
  nps: number;
  satisfactionScore: number;
  avgTimeToValue: number;
  adoptionTrend: { date: string; value: number }[];
  lastUpdated: string;
}

export interface ModuleHealthScore {
  moduleKey: string;
  overallScore: number;
  usageScore: number;
  performanceScore: number;
  adoptionScore: number;
  stabilityScore: number;
  trend: 'up' | 'down' | 'stable';
  alerts: string[];
  recommendations: string[];
}

export interface AnalyticsDashboardData {
  summary: {
    totalModules: number;
    activeModules: number;
    totalUsers: number;
    avgHealthScore: number;
    topPerformers: string[];
    needsAttention: string[];
  };
  usageMetrics: ModuleUsageMetrics[];
  performanceMetrics: ModulePerformanceMetrics[];
  adoptionMetrics: ModuleAdoptionMetrics[];
  healthScores: ModuleHealthScore[];
  trends: {
    date: string;
    usage: number;
    performance: number;
    adoption: number;
  }[];
}

// === HOOK ===
export function useModuleAnalytics(moduleKey?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<ModuleUsageMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<ModulePerformanceMetrics | null>(null);
  const [adoptionMetrics, setAdoptionMetrics] = useState<ModuleAdoptionMetrics | null>(null);
  const [healthScore, setHealthScore] = useState<ModuleHealthScore | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // === FETCH DASHBOARD DATA ===
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'get_dashboard',
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setDashboardData(fnData.data);
      }
    } catch (error) {
      console.error('[useModuleAnalytics] fetchDashboardData error:', error);
      toast.error('Error al cargar analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // === FETCH MODULE USAGE ===
  const fetchUsageMetrics = useCallback(async (key: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'get_usage',
            moduleKey: key,
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setUsageMetrics(fnData.metrics);
        return fnData.metrics;
      }
    } catch (error) {
      console.error('[useModuleAnalytics] fetchUsageMetrics error:', error);
    }
    return null;
  }, [dateRange]);

  // === FETCH PERFORMANCE METRICS ===
  const fetchPerformanceMetrics = useCallback(async (key: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'get_performance',
            moduleKey: key,
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setPerformanceMetrics(fnData.metrics);
        return fnData.metrics;
      }
    } catch (error) {
      console.error('[useModuleAnalytics] fetchPerformanceMetrics error:', error);
    }
    return null;
  }, [dateRange]);

  // === FETCH ADOPTION METRICS ===
  const fetchAdoptionMetrics = useCallback(async (key: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'get_adoption',
            moduleKey: key,
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAdoptionMetrics(fnData.metrics);
        return fnData.metrics;
      }
    } catch (error) {
      console.error('[useModuleAnalytics] fetchAdoptionMetrics error:', error);
    }
    return null;
  }, [dateRange]);

  // === FETCH HEALTH SCORE ===
  const fetchHealthScore = useCallback(async (key: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'get_health_score',
            moduleKey: key
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setHealthScore(fnData.healthScore);
        return fnData.healthScore;
      }
    } catch (error) {
      console.error('[useModuleAnalytics] fetchHealthScore error:', error);
    }
    return null;
  }, []);

  // === FETCH ALL MODULE METRICS ===
  const fetchAllModuleMetrics = useCallback(async (key: string) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsageMetrics(key),
        fetchPerformanceMetrics(key),
        fetchAdoptionMetrics(key),
        fetchHealthScore(key)
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsageMetrics, fetchPerformanceMetrics, fetchAdoptionMetrics, fetchHealthScore]);

  // === EXPORT REPORT ===
  const exportReport = useCallback(async (format: 'pdf' | 'csv' | 'json') => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'export_report',
            moduleKey,
            format,
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString()
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData.url) {
        window.open(fnData.url, '_blank');
        toast.success('Reporte generado');
      }
    } catch (error) {
      console.error('[useModuleAnalytics] exportReport error:', error);
      toast.error('Error al generar reporte');
    }
  }, [moduleKey, dateRange]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    autoRefreshRef.current = setInterval(() => {
      if (moduleKey) {
        fetchAllModuleMetrics(moduleKey);
      } else {
        fetchDashboardData();
      }
    }, intervalMs);
  }, [moduleKey, fetchAllModuleMetrics, fetchDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
  }, []);

  // === SCORE HELPERS ===
  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  const getTrendIcon = useCallback((trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  }, []);

  // === INITIAL FETCH ===
  useEffect(() => {
    if (moduleKey) {
      fetchAllModuleMetrics(moduleKey);
    } else {
      fetchDashboardData();
    }
  }, [moduleKey]);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    dashboardData,
    usageMetrics,
    performanceMetrics,
    adoptionMetrics,
    healthScore,
    dateRange,
    // Acciones
    setDateRange,
    fetchDashboardData,
    fetchUsageMetrics,
    fetchPerformanceMetrics,
    fetchAdoptionMetrics,
    fetchHealthScore,
    fetchAllModuleMetrics,
    exportReport,
    startAutoRefresh,
    stopAutoRefresh,
    // Helpers
    getScoreColor,
    getTrendIcon,
  };
}

export default useModuleAnalytics;
