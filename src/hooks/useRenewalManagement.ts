import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RenewalOpportunity {
  id: string;
  company_id: string;
  contract_id: string | null;
  current_mrr: number | null;
  renewal_date: string;
  renewal_probability: number | null;
  predicted_outcome: 'renew' | 'churn' | 'expand' | 'downgrade' | null;
  risk_factors: any[];
  expansion_opportunities: any[];
  assigned_to: string | null;
  status: 'upcoming' | 'in_negotiation' | 'renewed' | 'churned' | 'expanded' | 'downgraded';
  nurturing_stage: 'awareness' | 'engagement' | 'negotiation' | 'closing' | 'completed';
  last_contact_date: string | null;
  next_action: string | null;
  next_action_date: string | null;
  outcome_mrr: number | null;
  outcome_notes: string | null;
  ai_insights: Record<string, any>;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string; segment?: string };
  assignee?: { id: string; full_name: string };
}

export interface NurturingActivity {
  id: string;
  renewal_id: string;
  activity_type: 'email' | 'call' | 'meeting' | 'demo' | 'proposal' | 'contract_sent' | 'negotiation';
  scheduled_date: string | null;
  completed_date: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  performed_by: string | null;
  notes: string | null;
  outcome: string | null;
  next_step: string | null;
  created_at: string;
}

export interface RenewalDashboardData {
  upcoming30: RenewalOpportunity[];
  upcoming60: RenewalOpportunity[];
  upcoming90: RenewalOpportunity[];
  atRisk: RenewalOpportunity[];
  totalMrrAtRisk: number;
  renewalRate: number;
}

export function useRenewalManagement() {
  const queryClient = useQueryClient();

  // Fetch renewal opportunities
  const { data: renewals = [], isLoading, refetch } = useQuery({
    queryKey: ['renewal-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('renewal_opportunities')
        .select('*')
        .order('renewal_date', { ascending: true });

      if (error) throw error;
      return data as unknown as RenewalOpportunity[];
    }
  });

  // Dashboard data
  const dashboardData: RenewalDashboardData = (() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const activeRenewals = renewals.filter(r => 
      !['renewed', 'churned', 'expanded', 'downgraded'].includes(r.status)
    );

    const upcoming30 = activeRenewals.filter(r => new Date(r.renewal_date) <= in30Days);
    const upcoming60 = activeRenewals.filter(r => 
      new Date(r.renewal_date) > in30Days && new Date(r.renewal_date) <= in60Days
    );
    const upcoming90 = activeRenewals.filter(r => 
      new Date(r.renewal_date) > in60Days && new Date(r.renewal_date) <= in90Days
    );

    const atRisk = activeRenewals.filter(r => 
      r.predicted_outcome === 'churn' || r.predicted_outcome === 'downgrade' ||
      (r.renewal_probability !== null && r.renewal_probability < 50)
    );

    const totalMrrAtRisk = atRisk.reduce((sum, r) => sum + (r.current_mrr || 0), 0);

    const completedRenewals = renewals.filter(r => 
      ['renewed', 'churned', 'expanded', 'downgraded'].includes(r.status)
    );
    const successfulRenewals = completedRenewals.filter(r => 
      r.status === 'renewed' || r.status === 'expanded'
    );
    const renewalRate = completedRenewals.length > 0 
      ? (successfulRenewals.length / completedRenewals.length) * 100 
      : 0;

    return { upcoming30, upcoming60, upcoming90, atRisk, totalMrrAtRisk, renewalRate };
  })();

  // Create renewal opportunity
  const createRenewalMutation = useMutation({
    mutationFn: async (renewal: Partial<RenewalOpportunity>) => {
      const { data, error } = await supabase
        .from('renewal_opportunities')
        .insert({
          company_id: renewal.company_id,
          renewal_date: renewal.renewal_date || new Date().toISOString().split('T')[0],
          current_mrr: renewal.current_mrr,
          assigned_to: renewal.assigned_to
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-opportunities'] });
      toast.success('Oportunidad de renovación creada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Update renewal
  const updateRenewalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RenewalOpportunity> & { id: string }) => {
      const { data, error } = await supabase
        .from('renewal_opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-opportunities'] });
      toast.success('Renovación actualizada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Add nurturing activity
  const addActivityMutation = useMutation({
    mutationFn: async (activity: Partial<NurturingActivity>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('renewal_nurturing_activities')
        .insert({
          renewal_id: activity.renewal_id,
          activity_type: activity.activity_type || 'call',
          scheduled_date: activity.scheduled_date,
          notes: activity.notes,
          performed_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Update last contact date
      if (activity.renewal_id) {
        await supabase
          .from('renewal_opportunities')
          .update({ last_contact_date: new Date().toISOString().split('T')[0] })
          .eq('id', activity.renewal_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-opportunities'] });
      toast.success('Actividad registrada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Complete renewal
  const completeRenewalMutation = useMutation({
    mutationFn: async ({ 
      id, 
      outcome, 
      outcomeMrr, 
      notes 
    }: { 
      id: string; 
      outcome: RenewalOpportunity['status']; 
      outcomeMrr?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('renewal_opportunities')
        .update({
          status: outcome,
          nurturing_stage: 'completed',
          outcome_mrr: outcomeMrr,
          outcome_notes: notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { outcome }) => {
      queryClient.invalidateQueries({ queryKey: ['renewal-opportunities'] });
      const message = outcome === 'renewed' || outcome === 'expanded' 
        ? 'Renovación exitosa registrada' 
        : 'Resultado de renovación registrado';
      toast.success(message);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Fetch activities for a renewal
  const fetchActivities = async (renewalId: string): Promise<NurturingActivity[]> => {
    const { data, error } = await supabase
      .from('renewal_nurturing_activities')
      .select('*')
      .eq('renewal_id', renewalId)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    return data as NurturingActivity[];
  };

  // Predict renewal with AI
  const predictRenewal = async (companyId: string): Promise<any> => {
    const { data, error } = await supabase.functions.invoke('predict-renewal', {
      body: { companyId }
    });

    if (error) throw error;
    return data;
  };

  return {
    renewals,
    dashboardData,
    isLoading,
    refetch,
    createRenewal: createRenewalMutation.mutateAsync,
    updateRenewal: updateRenewalMutation.mutateAsync,
    addActivity: addActivityMutation.mutateAsync,
    completeRenewal: completeRenewalMutation.mutateAsync,
    fetchActivities,
    predictRenewal,
    isCreating: createRenewalMutation.isPending,
    isUpdating: updateRenewalMutation.isPending
  };
}

export default useRenewalManagement;
