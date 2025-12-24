/**
 * Hook para gestionar métricas de telemetría de negocio
 * Fase 0 - Fundamentos e Infraestructura
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// === ERROR TIPADO KB ===
export interface BusinessTelemetryError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type MetricType = 
  | 'revenue'
  | 'conversion_rate'
  | 'churn_rate'
  | 'customer_lifetime_value'
  | 'acquisition_cost'
  | 'retention_rate'
  | 'nps_score'
  | 'monthly_recurring_revenue'
  | 'average_order_value'
  | 'engagement_rate';

export interface TelemetryMetric {
  id?: string;
  metric_type: string;
  value: number;
  period_start: string;
  period_end: string;
  segment?: string | null;
  channel?: string | null;
  metadata?: Json;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TelemetryInput {
  metric_type: MetricType;
  value: number;
  period_start: string;
  period_end: string;
  segment?: string;
  channel?: string;
  metadata?: Json;
}

export interface TelemetryQuery {
  metric_type?: MetricType;
  segment?: string;
  channel?: string;
  period_start?: string;
  period_end?: string;
  limit?: number;
}

export interface TelemetryAggregation {
  metric_type: string;
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

export function useBusinessTelemetry() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<TelemetryMetric[]>([]);
  // === ESTADO KB ===
  const [error, setError] = useState<BusinessTelemetryError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  /**
   * Registrar una nueva métrica de telemetría
   */
  const recordMetric = useCallback(async (metric: Omit<TelemetryMetric, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.warn('[BusinessTelemetry] No user authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('business_telemetry')
        .insert({
          ...metric,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[BusinessTelemetry] Metric recorded:', metric.metric_type, metric.value);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record metric';
      setError({ code: 'RECORD_METRIC_ERROR', message, details: { originalError: String(err) } });
      console.error('[BusinessTelemetry] Error recording metric:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Registrar múltiples métricas en batch
   */
  const recordMetricsBatch = useCallback(async (metricsToInsert: Omit<TelemetryMetric, 'id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) {
      console.warn('[BusinessTelemetry] No user authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const metricsWithUser = metricsToInsert.map(m => ({
        ...m,
        user_id: user.id,
      }));

      const { data, error: insertError } = await supabase
        .from('business_telemetry')
        .insert(metricsWithUser)
        .select();

      if (insertError) throw insertError;

      console.log('[BusinessTelemetry] Batch recorded:', metricsWithUser.length, 'metrics');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record metrics batch';
      setError({ code: 'RECORD_BATCH_ERROR', message, details: { originalError: String(err) } });
      console.error('[BusinessTelemetry] Error recording batch:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Consultar métricas con filtros
   */
  const queryMetrics = useCallback(async (query: TelemetryQuery = {}) => {
    setLoading(true);
    setError(null);

    try {
      let queryBuilder = supabase
        .from('business_telemetry')
        .select('*')
        .order('period_start', { ascending: false });

      if (query.metric_type) {
        queryBuilder = queryBuilder.eq('metric_type', query.metric_type);
      }
      if (query.segment) {
        queryBuilder = queryBuilder.eq('segment', query.segment);
      }
      if (query.channel) {
        queryBuilder = queryBuilder.eq('channel', query.channel);
      }
      if (query.period_start) {
        queryBuilder = queryBuilder.gte('period_start', query.period_start);
      }
      if (query.period_end) {
        queryBuilder = queryBuilder.lte('period_end', query.period_end);
      }
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      const { data, error: queryError } = await queryBuilder;

      if (queryError) throw queryError;

      setMetrics(data || []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to query metrics';
      setError({ code: 'QUERY_METRICS_ERROR', message, details: { originalError: String(err) } });
      console.error('[BusinessTelemetry] Error querying metrics:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener agregaciones de métricas
   */
  const getAggregations = useCallback(async (
    metricType: MetricType,
    periodStart?: string,
    periodEnd?: string
  ): Promise<TelemetryAggregation | null> => {
    setLoading(true);
    setError(null);

    try {
      let queryBuilder = supabase
        .from('business_telemetry')
        .select('value')
        .eq('metric_type', metricType);

      if (periodStart) {
        queryBuilder = queryBuilder.gte('period_start', periodStart);
      }
      if (periodEnd) {
        queryBuilder = queryBuilder.lte('period_end', periodEnd);
      }

      const { data, error: queryError } = await queryBuilder;

      if (queryError) throw queryError;

      if (!data || data.length === 0) {
        return {
          metric_type: metricType,
          total: 0,
          average: 0,
          min: 0,
          max: 0,
          count: 0,
        };
      }

      const values = data.map(d => Number(d.value));
      const total = values.reduce((sum, v) => sum + v, 0);
      const average = total / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      return {
        metric_type: metricType,
        total,
        average,
        min,
        max,
        count: values.length,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get aggregations';
      setError({ code: 'AGGREGATIONS_ERROR', message, details: { originalError: String(err) } });
      console.error('[BusinessTelemetry] Error getting aggregations:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar métrica por ID
   */
  const deleteMetric = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('business_telemetry')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setMetrics(prev => prev.filter(m => m.id !== id));
      toast.success('Métrica eliminada');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete metric';
      setError({ code: 'DELETE_METRIC_ERROR', message, details: { originalError: String(err) } });
      console.error('[BusinessTelemetry] Error deleting metric:', err);
      toast.error('Error al eliminar métrica');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Suscripción en tiempo real a cambios de telemetría
   */
  const subscribeToMetrics = useCallback((
    callback: (payload: { new: TelemetryMetric; old: TelemetryMetric | null; eventType: string }) => void
  ) => {
    const channel = supabase
      .channel('business_telemetry_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_telemetry',
        },
        (payload) => {
          callback({
            new: payload.new as TelemetryMetric,
            old: payload.old as TelemetryMetric | null,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    // State
    loading,
    error,
    metrics,
    // === KB ADDITIONS ===
    lastRefresh,
    clearError,
    
    // Actions
    recordMetric,
    recordMetricsBatch,
    queryMetrics,
    getAggregations,
    deleteMetric,
    subscribeToMetrics,
  };
}

export default useBusinessTelemetry;
