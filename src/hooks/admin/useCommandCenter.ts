/**
 * Hook: useCommandCenter
 * Centro de Comando Unificado - Dashboard Ejecutivo
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'healthy' | 'warning' | 'critical';
  category: string;
  lastUpdated: string;
}

export interface ActiveAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  timestamp: string;
  acknowledged: boolean;
  assignedTo?: string;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'acknowledge' | 'escalate' | 'resolve' | 'investigate';
  automated: boolean;
}

export interface SystemHealth {
  overall: number;
  components: ComponentHealth[];
  incidents: number;
  uptime: number;
  lastIncident?: string;
}

export interface ComponentHealth {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency: number;
  errorRate: number;
}

export interface LiveActivity {
  id: string;
  type: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CommandCenterContext {
  organizationId?: string;
  includeMetrics?: boolean;
  includeAlerts?: boolean;
  includeActivity?: boolean;
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
}

// KB Pattern: Typed error interface
export interface CommandCenterError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// === HOOK ===
export function useCommandCenter() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  // KB Pattern: Typed error state
  const [error, setError] = useState<CommandCenterError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GET DASHBOARD DATA ===
  const getDashboardData = useCallback(async (context: CommandCenterContext = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'get_dashboard',
            context: {
              includeMetrics: true,
              includeAlerts: true,
              includeActivity: true,
              timeRange: '24h',
              ...context
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setMetrics(fnData.data.metrics || []);
        setAlerts(fnData.data.alerts || []);
        setSystemHealth(fnData.data.systemHealth);
        setLiveActivity(fnData.data.activity || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error al obtener datos del dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError({ code: 'DASHBOARD_ERROR', message, details: { originalError: String(err) } });
      console.error('[useCommandCenter] getDashboardData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ACKNOWLEDGE ALERT ===
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'acknowledge_alert',
            params: { alertId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAlerts(prev => prev.map(a => 
          a.id === alertId ? { ...a, acknowledged: true } : a
        ));
        toast.success('Alerta reconocida');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCommandCenter] acknowledgeAlert error:', err);
      toast.error('Error al reconocer alerta');
      return false;
    }
  }, []);

  // === ESCALATE ALERT ===
  const escalateAlert = useCallback(async (alertId: string, reason?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'escalate_alert',
            params: { alertId, reason }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Alerta escalada correctamente');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCommandCenter] escalateAlert error:', err);
      toast.error('Error al escalar alerta');
      return false;
    }
  }, []);

  // === GET METRIC DETAILS ===
  const getMetricDetails = useCallback(async (metricId: string, timeRange: string = '24h') => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'get_metric_details',
            params: { metricId, timeRange }
          }
        }
      );

      if (fnError) throw fnError;

      return fnData?.success ? fnData.data : null;
    } catch (err) {
      console.error('[useCommandCenter] getMetricDetails error:', err);
      return null;
    }
  }, []);

  // === EXECUTE COMMAND ===
  const executeCommand = useCallback(async (
    command: string,
    params?: Record<string, unknown>
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'execute_command',
            params: { command, ...params }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Comando "${command}" ejecutado`);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useCommandCenter] executeCommand error:', err);
      toast.error('Error al ejecutar comando');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: CommandCenterContext = {}, intervalMs = 30000) => {
    stopAutoRefresh();
    getDashboardData(context);
    autoRefreshInterval.current = setInterval(() => {
      getDashboardData(context);
    }, intervalMs);
  }, [getDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    metrics,
    alerts,
    systemHealth,
    liveActivity,
    error,
    lastRefresh,
    // Acciones
    getDashboardData,
    acknowledgeAlert,
    escalateAlert,
    getMetricDetails,
    executeCommand,
    startAutoRefresh,
    stopAutoRefresh,
    clearError,
  };
}

export default useCommandCenter;
