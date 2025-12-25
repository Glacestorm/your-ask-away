import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KPI {
  id: string;
  name: string;
  description: string;
  category: string;
  current_value: number;
  target_value: number;
  previous_value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  status: 'on_track' | 'at_risk' | 'off_track' | 'exceeded';
  last_updated: string;
  sparkline_data: number[];
}

export interface KPIGoal {
  id: string;
  kpi_id: string;
  target_value: number;
  target_date: string;
  milestone_values: { date: string; value: number }[];
  status: 'active' | 'achieved' | 'missed' | 'cancelled';
}

export interface KPIAlert {
  id: string;
  kpi_id: string;
  alert_type: 'threshold' | 'trend' | 'anomaly';
  condition: string;
  threshold_value: number;
  is_active: boolean;
  last_triggered: string | null;
}

export interface KPIContext {
  entityId?: string;
  entityType?: string;
  category?: string;
  timeRange?: string;
}

export function useKPITracking() {
  const [isLoading, setIsLoading] = useState(false);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [goals, setGoals] = useState<KPIGoal[]>([]);
  const [alerts, setAlerts] = useState<KPIAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchKPIs = useCallback(async (context?: KPIContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'kpi-tracking',
        {
          body: {
            action: 'get_kpis',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setKpis(data.kpis || []);
        setGoals(data.goals || []);
        setAlerts(data.alerts || []);
        setLastRefresh(new Date());
        return data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useKPITracking] fetchKPIs error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createKPI = useCallback(async (kpi: Partial<KPI>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'kpi-tracking',
        {
          body: {
            action: 'create_kpi',
            kpi
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('KPI creado');
        return data.kpi;
      }

      return null;
    } catch (err) {
      console.error('[useKPITracking] createKPI error:', err);
      toast.error('Error al crear KPI');
      return null;
    }
  }, []);

  const updateKPIValue = useCallback(async (kpiId: string, value: number) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'kpi-tracking',
        {
          body: {
            action: 'update_value',
            kpiId,
            value
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setKpis(prev => prev.map(k => 
          k.id === kpiId ? { ...k, current_value: value } : k
        ));
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useKPITracking] updateKPIValue error:', err);
      toast.error('Error al actualizar KPI');
      return false;
    }
  }, []);

  const setGoal = useCallback(async (goal: Partial<KPIGoal>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'kpi-tracking',
        {
          body: {
            action: 'set_goal',
            goal
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Meta establecida');
        return data.goal;
      }

      return null;
    } catch (err) {
      console.error('[useKPITracking] setGoal error:', err);
      toast.error('Error al establecer meta');
      return null;
    }
  }, []);

  const createAlert = useCallback(async (alert: Partial<KPIAlert>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'kpi-tracking',
        {
          body: {
            action: 'create_alert',
            alert
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Alerta creada');
        return data.alert;
      }

      return null;
    } catch (err) {
      console.error('[useKPITracking] createAlert error:', err);
      toast.error('Error al crear alerta');
      return null;
    }
  }, []);

  const getKPIHistory = useCallback(async (kpiId: string, timeRange: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'kpi-tracking',
        {
          body: {
            action: 'get_history',
            kpiId,
            timeRange
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.history;
      }

      return null;
    } catch (err) {
      console.error('[useKPITracking] getKPIHistory error:', err);
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((context: KPIContext, intervalMs = 60000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchKPIs(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchKPIs(context);
    }, intervalMs);
  }, [fetchKPIs]);

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
    kpis,
    goals,
    alerts,
    error,
    lastRefresh,
    fetchKPIs,
    createKPI,
    updateKPIValue,
    setGoal,
    createAlert,
    getKPIHistory,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useKPITracking;
