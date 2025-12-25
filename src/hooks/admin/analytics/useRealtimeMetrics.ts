import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RealtimeMetric {
  id: string;
  metric_name: string;
  current_value: number;
  previous_value: number;
  change_rate: number;
  unit: string;
  updated_at: string;
  source: string;
}

export interface MetricStream {
  id: string;
  name: string;
  metrics: string[];
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  window_seconds: number;
  is_active: boolean;
}

export interface MetricAlert {
  id: string;
  metric_id: string;
  condition: 'above' | 'below' | 'equals' | 'change_rate';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  triggered: boolean;
  triggered_at: string | null;
}

export interface LiveDashboard {
  id: string;
  name: string;
  metrics: RealtimeMetric[];
  refresh_rate_ms: number;
  layout: 'grid' | 'list' | 'custom';
}

export function useRealtimeMetrics() {
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetric[]>([]);
  const [streams, setStreams] = useState<MetricStream[]>([]);
  const [alerts, setAlerts] = useState<MetricAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async (streamIds?: string[]) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'realtime-metrics',
        {
          body: {
            action: 'connect',
            streamIds
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setStreams(data.streams || []);
        setIsConnected(true);

        // Set up realtime subscription
        channelRef.current = supabase
          .channel('realtime-metrics')
          .on(
            'broadcast',
            { event: 'metric_update' },
            (payload) => {
              const update = payload.payload as RealtimeMetric;
              setMetrics(prev => {
                const existing = prev.findIndex(m => m.id === update.id);
                if (existing >= 0) {
                  const newMetrics = [...prev];
                  newMetrics[existing] = update;
                  return newMetrics;
                }
                return [...prev, update];
              });
            }
          )
          .subscribe();

        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useRealtimeMetrics] connect error:', err);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
    setIsConnected(false);
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'realtime-metrics',
        {
          body: {
            action: 'get_metrics'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setMetrics(data.metrics || []);
        setAlerts(data.alerts || []);
        return data;
      }

      return null;
    } catch (err) {
      console.error('[useRealtimeMetrics] fetchMetrics error:', err);
      return null;
    }
  }, []);

  const createStream = useCallback(async (stream: Partial<MetricStream>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'realtime-metrics',
        {
          body: {
            action: 'create_stream',
            stream
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Stream creado');
        setStreams(prev => [...prev, data.stream]);
        return data.stream;
      }

      return null;
    } catch (err) {
      console.error('[useRealtimeMetrics] createStream error:', err);
      toast.error('Error al crear stream');
      return null;
    }
  }, []);

  const setAlert = useCallback(async (alert: Partial<MetricAlert>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'realtime-metrics',
        {
          body: {
            action: 'set_alert',
            alert
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Alerta configurada');
        return data.alert;
      }

      return null;
    } catch (err) {
      console.error('[useRealtimeMetrics] setAlert error:', err);
      toast.error('Error al configurar alerta');
      return null;
    }
  }, []);

  const getHistoricalData = useCallback(async (
    metricId: string,
    startTime: string,
    endTime: string,
    granularity: 'second' | 'minute' | 'hour' | 'day'
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'realtime-metrics',
        {
          body: {
            action: 'get_historical',
            metricId,
            startTime,
            endTime,
            granularity
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.history;
      }

      return null;
    } catch (err) {
      console.error('[useRealtimeMetrics] getHistoricalData error:', err);
      return null;
    }
  }, []);

  const startPolling = useCallback((intervalMs = 5000) => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    fetchMetrics();
    refreshInterval.current = setInterval(fetchMetrics, intervalMs);
  }, [fetchMetrics]);

  const stopPolling = useCallback(() => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
      stopPolling();
    };
  }, [disconnect, stopPolling]);

  return {
    isConnected,
    metrics,
    streams,
    alerts,
    error,
    connect,
    disconnect,
    fetchMetrics,
    createStream,
    setAlert,
    getHistoricalData,
    startPolling,
    stopPolling,
  };
}

export default useRealtimeMetrics;
