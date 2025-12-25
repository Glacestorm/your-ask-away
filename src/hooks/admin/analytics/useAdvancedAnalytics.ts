import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnalyticsMetric {
  id: string;
  metric_name: string;
  metric_type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  dimensions: Record<string, string>;
  timestamp: string;
  aggregation_period: string;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: AnalyticsWidget[];
  filters: Record<string, unknown>;
  refresh_interval: number;
  created_at: string;
}

export interface AnalyticsWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'heatmap' | 'funnel' | 'cohort';
  title: string;
  query: string;
  visualization_config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export interface AnalyticsContext {
  entityId: string;
  entityType: string;
  timeRange: string;
  filters?: Record<string, unknown>;
}

export function useAdvancedAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = useCallback(async (context?: AnalyticsContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'advanced-analytics',
        {
          body: {
            action: 'get_analytics',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setMetrics(data.metrics || []);
        setDashboards(data.dashboards || []);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAdvancedAnalytics] fetchAnalytics error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runQuery = useCallback(async (
    query: string,
    params?: Record<string, unknown>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'advanced-analytics',
        {
          body: {
            action: 'run_query',
            query,
            params
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.results;
      }

      return null;
    } catch (err) {
      console.error('[useAdvancedAnalytics] runQuery error:', err);
      toast.error('Error al ejecutar consulta');
      return null;
    }
  }, []);

  const createDashboard = useCallback(async (
    dashboard: Partial<AnalyticsDashboard>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'advanced-analytics',
        {
          body: {
            action: 'create_dashboard',
            dashboard
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Dashboard creado');
        return data.dashboard;
      }

      return null;
    } catch (err) {
      console.error('[useAdvancedAnalytics] createDashboard error:', err);
      toast.error('Error al crear dashboard');
      return null;
    }
  }, []);

  const exportData = useCallback(async (
    format: 'csv' | 'json' | 'excel',
    query: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'advanced-analytics',
        {
          body: {
            action: 'export_data',
            format,
            query
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Datos exportados');
        return data.downloadUrl;
      }

      return null;
    } catch (err) {
      console.error('[useAdvancedAnalytics] exportData error:', err);
      toast.error('Error al exportar datos');
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((context: AnalyticsContext, intervalMs = 60000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchAnalytics(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchAnalytics(context);
    }, intervalMs);
  }, [fetchAnalytics]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    metrics,
    dashboards,
    error,
    lastRefresh,
    fetchAnalytics,
    runQuery,
    createDashboard,
    exportData,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useAdvancedAnalytics;
