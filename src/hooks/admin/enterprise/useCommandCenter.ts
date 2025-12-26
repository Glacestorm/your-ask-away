/**
 * useCommandCenter Hook
 * Fase 11 - Enterprise SaaS 2025-2026
 * Centro de comando ejecutivo con métricas en tiempo real
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CommandMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  unit: string;
  category: string;
  trend: number[];
  status: 'healthy' | 'warning' | 'critical';
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
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface SystemStatus {
  overall: 'operational' | 'degraded' | 'outage';
  services: Array<{
    name: string;
    status: 'up' | 'degraded' | 'down';
    latency: number;
    uptime: number;
  }>;
  lastIncident?: {
    id: string;
    title: string;
    resolvedAt: string;
  };
}

export interface CommandContext {
  organizationId?: string;
  metricsFilter?: string[];
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

// === HOOK ===
export function useCommandCenter() {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<CommandMetric[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH COMMAND CENTER DATA ===
  const fetchCommandData = useCallback(async (context?: CommandContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'get_dashboard',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setMetrics(fnData.data?.metrics || []);
        setAlerts(fnData.data?.alerts || []);
        setSystemStatus(fnData.data?.systemStatus || null);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from command center');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useCommandCenter] fetchCommandData error:', err);
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
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
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

  // === RESOLVE ALERT ===
  const resolveAlert = useCallback(async (alertId: string, notes?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'resolve_alert',
            params: { alertId, notes }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast.success('Alerta resuelta');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useCommandCenter] resolveAlert error:', err);
      toast.error('Error al resolver alerta');
      return false;
    }
  }, []);

  // === EXECUTE COMMAND ===
  const executeCommand = useCallback(async (
    commandType: string, 
    params: Record<string, unknown>
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'command-center',
        {
          body: {
            action: 'execute_command',
            params: { commandType, ...params }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Comando ejecutado');
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
  const startAutoRefresh = useCallback((context: CommandContext, intervalMs = 30000) => {
    stopAutoRefresh();
    fetchCommandData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchCommandData(context);
    }, intervalMs);
  }, [fetchCommandData]);

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

  return {
    isLoading,
    metrics,
    alerts,
    systemStatus,
    error,
    lastRefresh,
    fetchCommandData,
    acknowledgeAlert,
    resolveAlert,
    executeCommand,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useCommandCenter;
