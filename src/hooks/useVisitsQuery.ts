import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidateRelatedQueries } from '@/lib/queryClient';
import { useRealtimeChannel, REALTIME_CHANNELS } from './useRealtimeChannel';
import { useMemo, useState, useCallback } from 'react';
import type { Database } from '@/integrations/supabase/types';

// === ERROR TIPADO KB ===
export interface VisitsQueryError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type VisitRow = Database['public']['Tables']['visits']['Row'];
type VisitInsert = Database['public']['Tables']['visits']['Insert'];

interface VisitsFilter {
  gestorId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  result?: string;
}

export function useVisitsQuery(filters: VisitsFilter = {}) {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  const subscriptions = useMemo(
    () => [
      {
        table: 'visits',
        event: '*' as const,
        callback: () => {
          invalidateRelatedQueries.onVisitChange();
        },
      },
    ],
    []
  );

  useRealtimeChannel({
    channelName: REALTIME_CHANNELS.VISITS,
    subscriptions,
    enabled: true,
  });

  const query = useQuery({
    queryKey: ['visits', 'list', filters.gestorId, filters.companyId, filters.startDate, filters.endDate, filters.result],
    queryFn: async () => {
      let query = supabase.from('visits').select(`
        *,
        companies:company_id (id, name, address),
        profiles:gestor_id (id, full_name)
      `);

      if (filters.gestorId) {
        query = query.eq('gestor_id', filters.gestorId);
      }
      if (filters.companyId) {
        query = query.eq('company_id', filters.companyId);
      }
      if (filters.startDate) {
        query = query.gte('visit_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('visit_date', filters.endDate);
      }
      if (filters.result) {
        query = query.eq('result', filters.result);
      }

      const { data, error } = await query.order('visit_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createVisit = useMutation({
    mutationFn: async (newVisit: VisitInsert) => {
      const { data, error } = await supabase
        .from('visits')
        .insert(newVisit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });

  const updateVisit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VisitRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
    },
  });

  const deleteVisit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('visits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
    },
  });

  return {
    visits: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createVisit,
    updateVisit,
    deleteVisit,
  };
}

// === ERROR TIPADO KB para useVisitsByCompany ===
export interface VisitsByCompanyError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function useVisitsByCompany(companyId: string) {
  return useQuery({
    queryKey: queryKeys.visits.byCompany(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          profiles:gestor_id (id, full_name)
        `)
        .eq('company_id', companyId)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });
}
