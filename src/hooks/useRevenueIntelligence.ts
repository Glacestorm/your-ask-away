import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface RevenueIntelligenceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface RevenueEvent {
  id: string;
  company_id: string;
  event_type: 'new_business' | 'expansion' | 'contraction' | 'churn' | 'reactivation';
  event_date: string;
  mrr_change: number;
  mrr_before: number | null;
  mrr_after: number | null;
  arr_change: number | null;
  reason: string | null;
  product_id: string | null;
  plan_from: string | null;
  plan_to: string | null;
  contract_length_months: number | null;
  discount_percentage: number | null;
  recorded_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  company?: { name: string };
}

export interface MRRSnapshot {
  id: string;
  snapshot_date: string;
  total_mrr: number;
  total_arr: number;
  new_mrr: number;
  expansion_mrr: number;
  contraction_mrr: number;
  churned_mrr: number;
  reactivation_mrr: number;
  net_mrr_change: number;
  customer_count: number;
  new_customers: number;
  churned_customers: number;
  expansion_customers: number;
  contraction_customers: number;
  nrr_percentage: number | null;
  grr_percentage: number | null;
  quick_ratio: number | null;
  arpu: number | null;
  segment_breakdown: Record<string, unknown>;
}

export interface RevenueMetrics {
  currentMRR: number;
  currentARR: number;
  mrrGrowth: number;
  nrr: number;
  grr: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
  newMRR: number;
  quickRatio: number;
  arpu: number;
  customerCount: number;
  netMRRChange: number;
}

export interface RevenueCohort {
  id: string;
  cohort_date: string;
  cohort_type: 'monthly' | 'quarterly' | 'yearly';
  initial_customers: number;
  initial_mrr: number;
  month_1_customers: number | null;
  month_1_mrr: number | null;
  month_3_customers: number | null;
  month_3_mrr: number | null;
  month_6_customers: number | null;
  month_6_mrr: number | null;
  month_12_customers: number | null;
  month_12_mrr: number | null;
  retention_rates: Record<string, number>;
  nrr_rates: Record<string, number>;
  segment: string | null;
}

export const useRevenueIntelligence = () => {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<RevenueIntelligenceError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // Fetch revenue events
  const { data: revenueEvents, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['revenue-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_events')
        .select(`
          *,
          company:companies(name)
        `)
        .order('event_date', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data as RevenueEvent[];
    }
  });

  // Fetch MRR snapshots
  const { data: mrrSnapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ['mrr-snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mrr_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(24);
      
      if (error) {
        setError({ code: 'FETCH_REVENUE_EVENTS_ERROR', message: error.message, details: { originalError: String(error) } });
        throw error;
      }
      
      setLastRefresh(new Date());
      return data as MRRSnapshot[];
    }
  });

  // Fetch revenue cohorts
  const { data: cohorts, isLoading: cohortsLoading } = useQuery({
    queryKey: ['revenue-cohorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_cohorts')
        .select('*')
        .order('cohort_date', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return data as RevenueCohort[];
    }
  });

  // Calculate current metrics from latest snapshot or events
  const currentMetrics: RevenueMetrics = {
    currentMRR: mrrSnapshots?.[0]?.total_mrr || 0,
    currentARR: mrrSnapshots?.[0]?.total_arr || 0,
    mrrGrowth: mrrSnapshots && mrrSnapshots.length > 1 
      ? ((mrrSnapshots[0]?.total_mrr - mrrSnapshots[1]?.total_mrr) / mrrSnapshots[1]?.total_mrr) * 100 
      : 0,
    nrr: mrrSnapshots?.[0]?.nrr_percentage || 100,
    grr: mrrSnapshots?.[0]?.grr_percentage || 100,
    expansionMRR: mrrSnapshots?.[0]?.expansion_mrr || 0,
    contractionMRR: mrrSnapshots?.[0]?.contraction_mrr || 0,
    churnedMRR: mrrSnapshots?.[0]?.churned_mrr || 0,
    newMRR: mrrSnapshots?.[0]?.new_mrr || 0,
    quickRatio: mrrSnapshots?.[0]?.quick_ratio || 0,
    arpu: mrrSnapshots?.[0]?.arpu || 0,
    customerCount: mrrSnapshots?.[0]?.customer_count || 0,
    netMRRChange: mrrSnapshots?.[0]?.net_mrr_change || 0
  };

  // Create revenue event mutation
  const createEventMutation = useMutation({
    mutationFn: async (event: Omit<RevenueEvent, 'id' | 'created_at' | 'company'>) => {
      const { data, error } = await supabase
        .from('revenue_events')
        .insert([event as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-events'] });
      toast.success('Evento de revenue registrado');
    },
    onError: (error) => {
      toast.error('Error al registrar evento: ' + error.message);
    }
  });

  // Create MRR snapshot mutation
  const createSnapshotMutation = useMutation({
    mutationFn: async (snapshot: Omit<MRRSnapshot, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('mrr_snapshots')
        .insert([snapshot as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrr-snapshots'] });
      toast.success('Snapshot de MRR creado');
    },
    onError: (error) => {
      toast.error('Error al crear snapshot: ' + error.message);
    }
  });

  // Get events by type
  const getEventsByType = (type: RevenueEvent['event_type']) => {
    return revenueEvents?.filter(e => e.event_type === type) || [];
  };

  // Get MRR trend data for charts
  const getMRRTrendData = () => {
    if (!mrrSnapshots) return [];
    return mrrSnapshots
      .slice()
      .reverse()
      .map(s => ({
        date: s.snapshot_date,
        mrr: s.total_mrr,
        newMRR: s.new_mrr,
        expansion: s.expansion_mrr,
        contraction: s.contraction_mrr,
        churn: s.churned_mrr,
        nrr: s.nrr_percentage,
        grr: s.grr_percentage
      }));
  };

  // Calculate revenue by segment
  const getRevenueBySegment = () => {
    if (!revenueEvents) return {};
    const segments: Record<string, number> = {};
    revenueEvents.forEach(event => {
      const segment = (event.metadata as Record<string, string>)?.segment || 'Otros';
      if (!segments[segment]) segments[segment] = 0;
      segments[segment] += event.mrr_change;
    });
    return segments;
  };

  return {
    revenueEvents,
    mrrSnapshots,
    cohorts,
    currentMetrics,
    isLoading: eventsLoading || snapshotsLoading || cohortsLoading,
    refetchEvents,
    createEvent: createEventMutation.mutateAsync,
    createSnapshot: createSnapshotMutation.mutateAsync,
    getEventsByType,
    getMRRTrendData,
    getRevenueBySegment,
    isCreatingEvent: createEventMutation.isPending,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
};
