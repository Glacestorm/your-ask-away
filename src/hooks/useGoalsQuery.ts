import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidateRelatedQueries } from '@/lib/queryClient';
import { useRealtimeChannel, REALTIME_CHANNELS } from './useRealtimeChannel';
import { useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];

interface GoalsFilter {
  userId?: string;
  office?: string;
  metricType?: string;
}

export function useGoalsQuery(filters: GoalsFilter = {}) {
  const queryClient = useQueryClient();

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
      let query = supabase.from('goals').select('*');

      if (filters.userId) {
        query = query.eq('assigned_to', filters.userId);
      }
      if (filters.metricType) {
        query = query.eq('metric_type', filters.metricType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as GoalRow[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createGoal = useMutation({
    mutationFn: async (newGoal: GoalInsert) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(newGoal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GoalRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
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
