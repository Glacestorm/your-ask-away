import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

export type NBAError = KBError;

export interface NBAActionType {
  id: string;
  action_code: string;
  action_name: string;
  action_description: string | null;
  action_category: 'revenue' | 'retention' | 'compliance' | 'efficiency';
  target_roles: string[];
  execution_type: 'automatic' | 'one_click' | 'wizard' | 'external';
  execution_config: Record<string, unknown>;
  estimated_mrr_impact: number | null;
  effort_level: 'low' | 'medium' | 'high';
  priority_weight: number;
  is_active: boolean;
}

export interface NBAQueueItem {
  id: string;
  user_id: string;
  action_type_id: string;
  action_type?: NBAActionType;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  priority: number;
  score: number;
  context_data: Record<string, unknown>;
  ai_reasoning: string | null;
  estimated_value: number | null;
  expires_at: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'expired';
  executed_at: string | null;
  executed_by: string | null;
  execution_result: Record<string, unknown> | null;
  mrr_impact_actual: number | null;
  created_at: string;
}

export interface NBAStats {
  pending: number;
  completed: number;
  dismissed: number;
  totalEstimatedValue: number;
  totalActualValue: number;
  byCategory: Record<string, number>;
}

export interface ExecuteNBAParams {
  nbaId: string;
  executionData?: Record<string, unknown>;
}

export function useNextBestAction() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  // Get action types for current role
  const { data: actionTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['nba-action-types', userRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nba_action_types')
        .select('*')
        .eq('is_active', true)
        .order('priority_weight', { ascending: false });
      
      if (error) throw error;
      
      // Filter by role
      return (data as NBAActionType[]).filter(type => 
        type.target_roles.includes(userRole || 'gestor') ||
        type.target_roles.includes('all')
      );
    },
    enabled: !!userRole,
  });

  // Get NBA queue for current user
  const { data: nbaQueue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['nba-queue', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: queueItems, error } = await supabase
        .from('nba_queue')
        .select(`
          *,
          action_type:nba_action_types(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false })
        .order('score', { ascending: false });
      
      if (error) {
        const kbError = createKBError('FETCH_ACTION_TYPES_ERROR', error.message, { originalError: error });
        setError(kbError);
        throw error;
      }
      
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      
      // Enrich with entity names
      const enrichedItems = await Promise.all(
        (queueItems || []).map(async (item) => {
          let entityName = '';
          
          if (item.entity_type === 'company') {
            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', item.entity_id)
              .single();
            entityName = company?.name || 'Empresa';
          } else if (item.entity_type === 'opportunity') {
            const { data: opp } = await supabase
              .from('opportunities')
              .select('title')
              .eq('id', item.entity_id)
              .single();
            entityName = opp?.title || 'Oportunidad';
          }
          
          return {
            ...item,
            entity_name: entityName,
            action_type: item.action_type as unknown as NBAActionType,
          } as NBAQueueItem;
        })
      );
      
      return enrichedItems;
    },
    enabled: !!user?.id,
  });

  // Get NBA stats
  const { data: stats } = useQuery({
    queryKey: ['nba-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('nba_queue')
        .select('status, estimated_value, mrr_impact_actual, action_type:nba_action_types(action_category)')
        .eq('user_id', user.id);
      
      if (error) {
        const kbError = createKBError('FETCH_NBA_QUEUE_ERROR', error.message, { originalError: error });
        setError(kbError);
        throw error;
      }
      
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      
      const pending = data.filter(d => d.status === 'pending').length;
      const completed = data.filter(d => d.status === 'completed').length;
      const dismissed = data.filter(d => d.status === 'dismissed').length;
      
      const totalEstimatedValue = data
        .filter(d => d.status === 'pending')
        .reduce((sum, d) => sum + (d.estimated_value || 0), 0);
      
      const totalActualValue = data
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + (d.mrr_impact_actual || 0), 0);
      
      const byCategory: Record<string, number> = {};
      data.forEach(d => {
        const category = (d.action_type as any)?.action_category || 'other';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });
      
      return {
        pending,
        completed,
        dismissed,
        totalEstimatedValue,
        totalActualValue,
        byCategory,
      } as NBAStats;
    },
    enabled: !!user?.id,
  });

  // Generate new NBAs
  const generateNBAs = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('generate-nba-actions', {
        body: { userId: user.id },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.generated || 0} nuevas acciones generadas`);
      refetchQueue();
      queryClient.invalidateQueries({ queryKey: ['nba-stats'] });
    },
    onError: (err) => {
      const kbError = createKBError('GENERATE_NBAS_ERROR', parseError(err).message, { originalError: err });
      setError(kbError);
      console.error('Error generating NBAs:', err);
      toast.error('Error al generar acciones');
    },
  });

  // Execute NBA action
  const executeNBA = useMutation({
    mutationFn: async ({ nbaId, executionData }: ExecuteNBAParams) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      setIsExecuting(true);
      
      // Update status to in_progress
      await supabase
        .from('nba_queue')
        .update({ status: 'in_progress' })
        .eq('id', nbaId);
      
      // Execute via edge function
      const { data, error } = await supabase.functions.invoke('execute-nba-action', {
        body: {
          nbaId,
          userId: user.id,
          executionData,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Acción ejecutada correctamente');
      refetchQueue();
      queryClient.invalidateQueries({ queryKey: ['nba-stats'] });
      
      // Log to copilot action log
      if (user?.id) {
        supabase.from('copilot_action_log').insert({
          user_id: user.id,
          action_type: 'nba_execution',
          action_source: 'nba',
          action_data: { nbaId: variables.nbaId, result: data },
          outcome: 'completed',
          outcome_value: data.mrrImpact || 0,
        });
      }
    },
    onError: (err) => {
      const kbError = createKBError('EXECUTE_NBA_ERROR', parseError(err).message, { originalError: err });
      setError(kbError);
      console.error('Error executing NBA:', err);
      toast.error('Error al ejecutar la acción');
    },
    onSettled: () => {
      setIsExecuting(false);
    },
  });

  // Dismiss NBA
  const dismissNBA = useMutation({
    mutationFn: async ({ nbaId, reason }: { nbaId: string; reason?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('nba_queue')
        .update({
          status: 'dismissed',
          execution_result: { dismissReason: reason },
        })
        .eq('id', nbaId);
      
      if (error) throw error;
      
      // Log dismissal
      await supabase.from('copilot_action_log').insert({
        user_id: user.id,
        action_type: 'nba_dismiss',
        action_source: 'nba',
        action_data: { nbaId, reason },
        outcome: 'dismissed',
        outcome_value: 0,
      });
    },
    onSuccess: () => {
      toast.info('Acción descartada');
      refetchQueue();
      queryClient.invalidateQueries({ queryKey: ['nba-stats'] });
    },
  });

  // Defer NBA
  const deferNBA = useMutation({
    mutationFn: async ({ nbaId, deferUntil }: { nbaId: string; deferUntil: Date }) => {
      const { error } = await supabase
        .from('nba_queue')
        .update({
          expires_at: deferUntil.toISOString(),
          priority: 1, // Lower priority
        })
        .eq('id', nbaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Acción aplazada');
      refetchQueue();
    },
  });

  // Get top priority NBAs
  const getTopNBAs = useCallback((limit: number = 5) => {
    return (nbaQueue || []).slice(0, limit);
  }, [nbaQueue]);

  // Get NBAs by category
  const getNBAsByCategory = useCallback((category: string) => {
    return (nbaQueue || []).filter(
      nba => nba.action_type?.action_category === category
    );
  }, [nbaQueue]);

  return {
    actionTypes,
    nbaQueue: nbaQueue || [],
    stats,
    isLoading: typesLoading || queueLoading,
    isExecuting,
    generateNBAs: generateNBAs.mutate,
    isGenerating: generateNBAs.isPending,
    executeNBA: executeNBA.mutate,
    dismissNBA: dismissNBA.mutate,
    deferNBA: deferNBA.mutate,
    getTopNBAs,
    getNBAsByCategory,
    refetchQueue,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError
  };
}
