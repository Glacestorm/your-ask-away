import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState, useCallback } from 'react';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError } from '@/hooks/core/useKBBase';

export type OpportunityStage = 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Opportunity {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  stage: OpportunityStage;
  probability: number;
  estimated_value: number | null;
  estimated_close_date: string | null;
  actual_close_date: string | null;
  lost_reason: string | null;
  owner_id: string | null;
  contact_id: string | null;
  products: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    is_vip: boolean;
  };
  owner?: {
    id: string;
    full_name: string;
    email: string;
  };
  contact?: {
    id: string;
    contact_name: string;
    position: string | null;
  };
}

interface OpportunityFilters {
  stage?: OpportunityStage | 'all';
  ownerId?: string;
  companyId?: string;
}

export function useOpportunities(filters: OpportunityFilters = {}) {
  const queryClient = useQueryClient();

  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [kbError, setKbError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setKbError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setKbError(null);
    setRetryCount(0);
  }, []);

  const { data: opportunities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['opportunities', filters],
    queryFn: async () => {
      setStatus('loading');
      try {
        let query = supabase
          .from('opportunities')
          .select(`
            *,
            company:companies(id, name, is_vip),
            contact:company_contacts(id, contact_name, position)
          `)
          .order('updated_at', { ascending: false });

        if (filters.stage && filters.stage !== 'all') {
          query = query.eq('stage', filters.stage);
        }
        if (filters.ownerId) {
          query = query.eq('owner_id', filters.ownerId);
        }
        if (filters.companyId) {
          query = query.eq('company_id', filters.companyId);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setRetryCount(0);
        
        return (data || []) as unknown as Opportunity[];
      } catch (err) {
        const kbErr = createKBError('FETCH_ERROR', err instanceof Error ? err.message : 'Error desconocido');
        setKbError(kbErr);
        setStatus('error');
        throw err;
      }
    },
    staleTime: 30000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('opportunities-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'opportunities' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createOpportunity = useMutation({
    mutationFn: async (data: Partial<Opportunity>) => {
      const { company, owner, contact, ...insertData } = data as any;
      const { data: result, error } = await supabase
        .from('opportunities')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Oportunidad creada correctamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear oportunidad: ' + error.message);
    },
  });

  const updateOpportunity = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Opportunity> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('opportunities')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Oportunidad actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const deleteOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Oportunidad eliminada');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  const moveStage = useMutation({
    mutationFn: async ({ id, stage, lostReason }: { id: string; stage: OpportunityStage; lostReason?: string }) => {
      const updateData: Partial<Opportunity> = { stage };
      
      if (stage === 'won' || stage === 'lost') {
        updateData.actual_close_date = new Date().toISOString().split('T')[0];
      }
      if (stage === 'lost' && lostReason) {
        updateData.lost_reason = lostReason;
      }
      
      // Update probability based on stage
      const stageProbabilities: Record<OpportunityStage, number> = {
        discovery: 25,
        proposal: 50,
        negotiation: 75,
        won: 100,
        lost: 0,
      };
      updateData.probability = stageProbabilities[stage];

      const { data: result, error } = await supabase
        .from('opportunities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      const stageNames: Record<OpportunityStage, string> = {
        discovery: 'Descubrimiento',
        proposal: 'Propuesta',
        negotiation: 'Negociación',
        won: '¡Ganada!',
        lost: 'Perdida',
      };
      toast.success(`Oportunidad movida a: ${stageNames[variables.stage]}`);
    },
    onError: (error: Error) => {
      toast.error('Error al mover: ' + error.message);
    },
  });

  return {
    opportunities,
    isLoading,
    error: kbError || (error ? createKBError('QUERY_ERROR', String(error)) : null),
    refetch,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    moveStage,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}

// Pipeline stats helper
export function usePipelineStats() {
  const { opportunities } = useOpportunities();

  const stats = {
    discovery: opportunities.filter(o => o.stage === 'discovery'),
    proposal: opportunities.filter(o => o.stage === 'proposal'),
    negotiation: opportunities.filter(o => o.stage === 'negotiation'),
    won: opportunities.filter(o => o.stage === 'won'),
    lost: opportunities.filter(o => o.stage === 'lost'),
    totalValue: opportunities
      .filter(o => o.stage !== 'lost')
      .reduce((sum, o) => sum + (o.estimated_value || 0), 0),
    weightedValue: opportunities
      .filter(o => o.stage !== 'lost' && o.stage !== 'won')
      .reduce((sum, o) => sum + ((o.estimated_value || 0) * (o.probability / 100)), 0),
    wonValue: opportunities
      .filter(o => o.stage === 'won')
      .reduce((sum, o) => sum + (o.estimated_value || 0), 0),
  };

  return stats;
}
