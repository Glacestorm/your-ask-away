/**
 * useExpansionIntelligence - KB 2.0 Migration
 * Enterprise-grade expansion intelligence with state machine and telemetry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// === ERROR TIPADO KB 2.0 ===
export type ExpansionIntelligenceError = KBError;

export interface ExpansionOpportunity {
  id: string;
  company_id: string;
  opportunity_type: 'upsell' | 'cross_sell' | 'add_seats' | 'upgrade_plan';
  current_plan: string | null;
  target_plan: string | null;
  current_mrr: number | null;
  potential_mrr: number | null;
  mrr_uplift: number | null;
  propensity_score: number | null;
  optimal_timing: string | null;
  timing_score: number | null;
  signals: Array<{ type: string; description: string; score: number }>;
  recommended_actions: Array<{ action: string; priority: number }>;
  status: 'identified' | 'qualified' | 'in_progress' | 'won' | 'lost' | 'deferred';
  assigned_to: string | null;
  won_date: string | null;
  won_mrr: number | null;
  lost_reason: string | null;
  next_action: string | null;
  next_action_date: string | null;
  ai_confidence: number | null;
  created_at: string;
  updated_at: string;
  company?: { name: string };
}

export interface CustomerROI {
  id: string;
  company_id: string;
  calculation_date: string;
  total_revenue: number;
  total_cost: number;
  acquisition_cost: number;
  onboarding_cost: number;
  support_cost: number;
  success_cost: number;
  gross_margin: number | null;
  gross_margin_percentage: number | null;
  ltv: number | null;
  ltv_cac_ratio: number | null;
  payback_months: number | null;
  is_profitable: boolean;
  profitability_date: string | null;
  projected_ltv: number | null;
  company?: { name: string };
}

export interface ExpansionMetrics {
  totalOpportunities: number;
  qualifiedOpportunities: number;
  inProgressOpportunities: number;
  wonOpportunities: number;
  totalPotentialMRR: number;
  wonMRR: number;
  avgPropensityScore: number;
  conversionRate: number;
  pipelineValue: number;
}

export const useExpansionIntelligence = () => {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Fetch expansion opportunities
  const { data: opportunities, isLoading: opportunitiesLoading, refetch: refetchOpportunities } = useQuery({
    queryKey: ['expansion-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expansion_opportunities')
        .select(`
          *,
          company:companies(name)
        `)
        .order('propensity_score', { ascending: false });
      
      if (error) throw error;
      return data as ExpansionOpportunity[];
    }
  });

  // Fetch ROI tracking data
  const { data: roiData, isLoading: roiLoading } = useQuery({
    queryKey: ['customer-roi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_roi_tracking')
        .select(`
          *,
          company:companies(name)
        `)
        .order('calculation_date', { ascending: false });
      
      if (error) {
        const kbError = createKBError('FETCH_ROI_ERROR', error.message, { retryable: true });
        setError(kbError);
        setStatus('error');
        throw error;
      }
      
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setStatus('success');
      return data as CustomerROI[];
    }
  });

  // Calculate expansion metrics
  const expansionMetrics: ExpansionMetrics = {
    totalOpportunities: opportunities?.length || 0,
    qualifiedOpportunities: opportunities?.filter(o => o.status === 'qualified').length || 0,
    inProgressOpportunities: opportunities?.filter(o => o.status === 'in_progress').length || 0,
    wonOpportunities: opportunities?.filter(o => o.status === 'won').length || 0,
    totalPotentialMRR: opportunities?.reduce((sum, o) => sum + (o.mrr_uplift || 0), 0) || 0,
    wonMRR: opportunities?.filter(o => o.status === 'won').reduce((sum, o) => sum + (o.won_mrr || 0), 0) || 0,
    avgPropensityScore: opportunities?.length 
      ? opportunities.reduce((sum, o) => sum + (o.propensity_score || 0), 0) / opportunities.length 
      : 0,
    conversionRate: opportunities?.length
      ? (opportunities.filter(o => o.status === 'won').length / opportunities.length) * 100
      : 0,
    pipelineValue: opportunities
      ?.filter(o => ['identified', 'qualified', 'in_progress'].includes(o.status))
      .reduce((sum, o) => sum + (o.mrr_uplift || 0), 0) || 0
  };

  // Create opportunity mutation
  const createOpportunityMutation = useMutation({
    mutationFn: async (opportunity: Partial<ExpansionOpportunity>) => {
      const { data, error } = await supabase
        .from('expansion_opportunities')
        .insert([opportunity as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expansion-opportunities'] });
      toast.success('Oportunidad de expansión creada');
    },
    onError: (error) => {
      toast.error('Error al crear oportunidad: ' + error.message);
    }
  });

  // Update opportunity mutation
  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExpansionOpportunity> & { id: string }) => {
      const { data, error } = await supabase
        .from('expansion_opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expansion-opportunities'] });
      toast.success('Oportunidad actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    }
  });

  // Win opportunity
  const winOpportunityMutation = useMutation({
    mutationFn: async ({ id, wonMRR }: { id: string; wonMRR: number }) => {
      const { data, error } = await supabase
        .from('expansion_opportunities')
        .update({
          status: 'won',
          won_date: new Date().toISOString().split('T')[0],
          won_mrr: wonMRR
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expansion-opportunities'] });
      toast.success('¡Oportunidad ganada!');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    }
  });

  // Lose opportunity
  const loseOpportunityMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('expansion_opportunities')
        .update({
          status: 'lost',
          lost_reason: reason
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expansion-opportunities'] });
      toast.info('Oportunidad marcada como perdida');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    }
  });

  // Predict expansion propensity via AI
  const predictExpansion = async (companyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('predict-expansion', {
        body: { companyId }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error predicting expansion:', error);
      throw error;
    }
  };

  // Get opportunities by status
  const getOpportunitiesByStatus = (status: ExpansionOpportunity['status']) => {
    return opportunities?.filter(o => o.status === status) || [];
  };

  // Get top opportunities (highest propensity + highest value)
  const getTopOpportunities = (limit = 10) => {
    if (!opportunities) return [];
    return opportunities
      .filter(o => ['identified', 'qualified', 'in_progress'].includes(o.status))
      .sort((a, b) => {
        const scoreA = (a.propensity_score || 0) * (a.mrr_uplift || 0);
        const scoreB = (b.propensity_score || 0) * (b.mrr_uplift || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  };

  // Get ROI for a specific company
  const getCompanyROI = (companyId: string) => {
    return roiData?.find(r => r.company_id === companyId);
  };

  // Get companies ready for expansion (optimal timing)
  const getReadyForExpansion = () => {
    return opportunities?.filter(o => 
      o.optimal_timing === 'now' && 
      ['identified', 'qualified'].includes(o.status) &&
      (o.propensity_score || 0) >= 70
    ) || [];
  };

  return {
    // Data
    opportunities,
    roiData,
    data: opportunities,
    expansionMetrics,
    
    // State Machine KB 2.0
    status,
    isIdle,
    isLoading: opportunitiesLoading || roiLoading || isLoading,
    isSuccess,
    isError,
    
    // Error Management KB 2.0
    error,
    clearError,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    retryCount,
    
    // Control
    reset,
    
    // Actions
    refetchOpportunities,
    createOpportunity: createOpportunityMutation.mutateAsync,
    updateOpportunity: updateOpportunityMutation.mutateAsync,
    winOpportunity: winOpportunityMutation.mutateAsync,
    loseOpportunity: loseOpportunityMutation.mutateAsync,
    predictExpansion,
    getOpportunitiesByStatus,
    getTopOpportunities,
    getCompanyROI,
    getReadyForExpansion,
    isCreating: createOpportunityMutation.isPending,
    isUpdating: updateOpportunityMutation.isPending,
  };
};

export default useExpansionIntelligence;
