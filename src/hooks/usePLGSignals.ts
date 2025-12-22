import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PLGSignal {
  id: string;
  company_id: string;
  signal_type: string;
  signal_strength: number;
  signal_date: string | null;
  detected_at: string;
  expires_at: string | null;
  is_active: boolean;
  metric_name: string | null;
  metric_value: number | null;
  metric_previous_value: number | null;
  metric_change_percentage: number | null;
  threshold_exceeded: number | null;
  recommended_action: string | null;
  expansion_opportunity_value: number | null;
  context: Record<string, unknown> | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  converted_to_opportunity: boolean;
  opportunity_id: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string };
}

export const usePLGSignals = () => {
  const queryClient = useQueryClient();

  const { data: signals, isLoading, refetch } = useQuery({
    queryKey: ['plg-signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plg_signals')
        .select(`
          *,
          company:companies(name)
        `)
        .order('detected_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as PLGSignal[];
    }
  });

  const detectSignalsMutation = useMutation({
    mutationFn: async (params: { 
      companyId: string;
      usageData: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('detect-plg-signals', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plg-signals'] });
      toast.success('Señales PLG detectadas');
    },
    onError: (error) => {
      toast.error('Error al detectar señales: ' + error.message);
    }
  });

  const acknowledgeSignalMutation = useMutation({
    mutationFn: async (params: { signalId: string; userId: string }) => {
      const { error } = await supabase
        .from('plg_signals')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: params.userId
        })
        .eq('id', params.signalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plg-signals'] });
      toast.success('Señal reconocida');
    }
  });

  const getActiveSignals = () => {
    return signals?.filter(s => s.is_active && !s.acknowledged_at) || [];
  };

  const getSignalsByType = (type: string) => {
    return signals?.filter(s => s.signal_type === type) || [];
  };

  const getSignalsByCompany = (companyId: string) => {
    return signals?.filter(s => s.company_id === companyId) || [];
  };

  const getHighStrengthSignals = (minStrength: number = 0.7) => {
    return signals?.filter(s => s.signal_strength >= minStrength && s.is_active) || [];
  };

  const getSignalStats = () => {
    if (!signals) return null;
    
    const active = signals.filter(s => s.is_active);
    const acknowledged = signals.filter(s => s.acknowledged_at);
    const converted = signals.filter(s => s.converted_to_opportunity);
    
    return {
      total: signals.length,
      active: active.length,
      acknowledged: acknowledged.length,
      converted: converted.length,
      conversionRate: acknowledged.length > 0 
        ? (converted.length / acknowledged.length) * 100 
        : 0,
      totalOpportunityValue: signals.reduce((sum, s) => sum + (s.expansion_opportunity_value || 0), 0)
    };
  };

  return {
    signals,
    isLoading,
    refetch,
    detectSignals: detectSignalsMutation.mutateAsync,
    isDetecting: detectSignalsMutation.isPending,
    acknowledgeSignal: acknowledgeSignalMutation.mutateAsync,
    getActiveSignals,
    getSignalsByType,
    getSignalsByCompany,
    getHighStrengthSignals,
    getSignalStats
  };
};
