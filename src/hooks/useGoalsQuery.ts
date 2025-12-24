import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidateRelatedQueries } from '@/lib/queryClient';
import { useRealtimeChannel, REALTIME_CHANNELS } from './useRealtimeChannel';
import type { Database } from '@/integrations/supabase/types';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';
import { toast } from 'sonner';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];

interface GoalsFilter {
  userId?: string;
  office?: string;
  metricType?: string;
}

export function useGoalsQuery(filters: GoalsFilter = {}) {
  const queryClient = useQueryClient();

  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoadingState = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Set up realtime subscription
  const subscriptions = useMemo(
    () => [
      {
        table: 'goals',
        event: '*' as const,
        callback: () => {
          invalidateRelatedQueries.onGoalChange();
        },
      },
    ],
    []
  );

  useRealtimeChannel({
    channelName: REALTIME_CHANNELS.GOALS,
    subscriptions,
    enabled: true,
  });

  const query = useQuery({
    queryKey: ['goals', 'list', filters.userId, filters.office, filters.metricType],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        let query = supabase.from('goals').select('*');

        if (filters.userId) {
          query = query.eq('assigned_to', filters.userId);
        }
        if (filters.metricType) {
          query = query.eq('metric_type', filters.metricType);
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setError(null);
        
        collectTelemetry({
          hookName: 'useGoalsQuery',
          operationName: 'fetchGoals',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as GoalRow[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        
        collectTelemetry({
          hookName: 'useGoalsQuery',
          operationName: 'fetchGoals',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
        });
        
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createGoal = useMutation({
    mutationFn: async (newGoal: GoalInsert) => {
      const { data, error: insertError } = await supabase
        .from('goals')
        .insert(newGoal)
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      setLastSuccess(new Date());
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al crear objetivo: ' + kbError.message);
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GoalRow> & { id: string }) => {
      const { data, error: updateError } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al actualizar: ' + kbError.message);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from('goals').delete().eq('id', id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al eliminar: ' + kbError.message);
    },
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createGoal,
    updateGoal,
    deleteGoal,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoadingState,
    isSuccess,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}

export function useGoalById(id: string) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as GoalRow;
    },
    enabled: !!id,
  });
}
