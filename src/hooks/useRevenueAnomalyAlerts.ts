import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface RevenueAnomalyError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface RevenueAnomalyAlert {
  id: string;
  anomaly_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  title: string;
  description: string | null;
  indicators: Record<string, unknown> | null;
  affected_entities: Record<string, unknown> | null;
  recommended_actions: string[] | null;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  detected_at: string;
  created_at: string;
}

export const useRevenueAnomalyAlerts = () => {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<RevenueAnomalyError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['revenue-anomaly-alerts'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_anomaly_alerts')
          .select('*')
          .order('detected_at', { ascending: false })
          .limit(100);
        
        if (fetchError) throw fetchError;
        
        setLastRefresh(new Date());
        setError(null);
        return data as RevenueAnomalyAlert[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError({
          code: 'FETCH_ALERTS_ERROR',
          message,
          details: { originalError: String(err) }
        });
        throw err;
      }
    }
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('revenue-anomaly-alerts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'revenue_anomaly_alerts'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['revenue-anomaly-alerts'] });
        if (payload.eventType === 'INSERT') {
          const newAlert = payload.new as RevenueAnomalyAlert;
          if (newAlert.severity === 'critical') {
            toast.error(`Alerta crítica: ${newAlert.title}`);
          } else if (newAlert.severity === 'high') {
            toast.warning(`Nueva alerta: ${newAlert.title}`);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const updateAlertStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        if (notes) updates.resolution_notes = notes;
      }
      const { error: updateError } = await supabase.from('revenue_anomaly_alerts').update(updates).eq('id', id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-anomaly-alerts'] });
      toast.success('Alerta actualizada');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al actualizar alerta';
      setError({
        code: 'UPDATE_ALERT_ERROR',
        message,
        details: { originalError: String(err) }
      });
    }
  });

  const runAnomalyDetection = useMutation({
    mutationFn: async (config?: Record<string, unknown>) => {
      const { data, error: invokeError } = await supabase.functions.invoke('revenue-anomaly-monitor', { body: { config } });
      if (invokeError) throw invokeError;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['revenue-anomaly-alerts'] });
      toast.success(`Análisis completado: ${data.anomaliesDetected} anomalías detectadas`);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al ejecutar detección';
      setError({
        code: 'RUN_DETECTION_ERROR',
        message,
        details: { originalError: String(err) }
      });
    }
  });

  const getAlertsByStatus = (status: string) => alerts?.filter(a => a.status === status) || [];
  const getAlertsBySeverity = (severity: string) => alerts?.filter(a => a.severity === severity) || [];

  return {
    alerts,
    isLoading,
    refetch,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
    // === EXISTING ===
    updateAlertStatus: updateAlertStatus.mutateAsync,
    runAnomalyDetection: runAnomalyDetection.mutateAsync,
    isRunningDetection: runAnomalyDetection.isPending,
    getAlertsByStatus,
    getAlertsBySeverity,
    openAlerts: getAlertsByStatus('open'),
    criticalAlerts: getAlertsBySeverity('critical')
  };
};
