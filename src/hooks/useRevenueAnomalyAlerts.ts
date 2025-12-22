import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['revenue-anomaly-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_anomaly_alerts')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as RevenueAnomalyAlert[];
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
      const { error } = await supabase.from('revenue_anomaly_alerts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-anomaly-alerts'] });
      toast.success('Alerta actualizada');
    }
  });

  const runAnomalyDetection = useMutation({
    mutationFn: async (config?: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('revenue-anomaly-monitor', { body: { config } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['revenue-anomaly-alerts'] });
      toast.success(`Análisis completado: ${data.anomaliesDetected} anomalías detectadas`);
    }
  });

  const getAlertsByStatus = (status: string) => alerts?.filter(a => a.status === status) || [];
  const getAlertsBySeverity = (severity: string) => alerts?.filter(a => a.severity === severity) || [];

  return {
    alerts,
    isLoading,
    refetch,
    updateAlertStatus: updateAlertStatus.mutateAsync,
    runAnomalyDetection: runAnomalyDetection.mutateAsync,
    isRunningDetection: runAnomalyDetection.isPending,
    getAlertsByStatus,
    getAlertsBySeverity,
    openAlerts: getAlertsByStatus('open'),
    criticalAlerts: getAlertsBySeverity('critical')
  };
};
