import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface Customer360Error {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Customer360Profile {
  id: string;
  company_id: string;
  rfm_score: {
    r: number;
    f: number;
    m: number;
    score: number;
  } | null;
  churn_probability: number | null;
  credit_score: number | null;
  clv_score: number | null;
  health_score: number | null;
  total_visits: number;
  successful_visits: number;
  last_visit_date: string | null;
  avg_visit_frequency_days: number | null;
  total_products: number;
  active_products: number;
  total_transaction_volume: number;
  avg_monthly_volume: number;
  segment: string | null;
  tier: string | null;
  lifecycle_stage: string | null;
  preferred_channel: string | null;
  recommended_products: string[];
  cross_sell_opportunities: Array<{
    product: string;
    reason: string;
    priority: string;
  }>;
  next_best_actions: Array<{
    action: string;
    priority: string;
    expected_impact: string;
  }>;
  risk_flags: string[];
  compliance_status: string;
  interaction_summary: {
    total_visits: number;
    last_30_days: number;
    by_result: {
      positive: number;
      negative: number;
      pending: number;
    };
    channels_used: string[];
  } | null;
  last_calculated_at: string | null;
}

export interface CustomerInteraction {
  id: string;
  company_id: string;
  interaction_type: string;
  interaction_date: string;
  channel: string | null;
  subject: string | null;
  description: string | null;
  outcome: string | null;
  sentiment: string | null;
  importance: string;
  metadata: Record<string, any>;
}

export function useCustomer360(companyId: string | null) {
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);
  // === ESTADO KB ===
  const [error, setError] = useState<Customer360Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['customer-360-profile', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('customer_360_profiles')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Customer360Profile | null;
    },
    enabled: !!companyId,
  });

  const { data: interactions, isLoading: isLoadingInteractions } = useQuery({
    queryKey: ['customer-interactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('customer_interactions')
        .select('*')
        .eq('company_id', companyId)
        .order('interaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CustomerInteraction[];
    },
    enabled: !!companyId,
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['enriched-transactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('enriched_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const calculateProfile = useCallback(async () => {
    if (!companyId) return;
    
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-customer-360', {
        body: { companyId }
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['customer-360-profile', companyId] });
      queryClient.invalidateQueries({ queryKey: ['customer-interactions', companyId] });
      
      toast.success('Perfil 360° actualizado correctamente');
      return data;
    } catch (error: any) {
      console.error('Error calculating 360 profile:', error);
      toast.error('Error al calcular el perfil: ' + error.message);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, [companyId, queryClient]);

  const enrichTransactions = useCallback(async (transactions: any[]) => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase.functions.invoke('enrich-transaction', {
        body: { 
          companyId,
          transactions 
        }
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['enriched-transactions', companyId] });
      toast.success(`${data.enriched_count} transacciones enriquecidas`);
      return data;
    } catch (error: any) {
      console.error('Error enriching transactions:', error);
      toast.error('Error al enriquecer transacciones: ' + error.message);
      throw error;
    }
  }, [companyId, queryClient]);

  const addInteraction = useMutation({
    mutationFn: async (interaction: Omit<CustomerInteraction, 'id'>) => {
      const { data, error } = await supabase
        .from('customer_interactions')
        .insert(interaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-interactions', companyId] });
      toast.success('Interacción registrada');
    },
    onError: (error: any) => {
      toast.error('Error al registrar interacción: ' + error.message);
    }
  });

  return {
    profile,
    interactions,
    transactions,
    isLoading: isLoadingProfile || isLoadingInteractions || isLoadingTransactions,
    isCalculating,
    calculateProfile,
    enrichTransactions,
    addInteraction: addInteraction.mutate,
    refetchProfile,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

export function useCustomer360Bulk() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const calculateAllProfiles = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('calculate-customer-360', {
        body: { calculateAll: true }
      });

      if (error) throw error;

      setProgress(100);
      toast.success(`${data.processed} perfiles calculados`);
      return data;
    } catch (error: any) {
      console.error('Error calculating all profiles:', error);
      toast.error('Error: ' + error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    calculateAllProfiles,
    isProcessing,
    progress,
  };
}
