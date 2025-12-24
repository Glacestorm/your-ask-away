/**
 * useVisitsQuery - KB 2.0 Migration
 * Enterprise-grade visits management with state machine, retry, and telemetry
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidateRelatedQueries } from '@/lib/queryClient';
import { useRealtimeChannel, REALTIME_CHANNELS } from './useRealtimeChannel';
import { 
  KBStatus, 
  KBError, 
  KB_ERROR_CODES,
  createKBError, 
  parseError, 
  collectTelemetry 
} from './core';
import type { Database } from '@/integrations/supabase/types';

// === TIPOS KB 2.0 ===
type VisitRow = Database['public']['Tables']['visits']['Row'];
type VisitInsert = Database['public']['Tables']['visits']['Insert'];

export interface VisitsFilter {
  gestorId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  result?: string;
}

export interface VisitWithRelations extends VisitRow {
  companies?: { id: string; name: string; address: string | null } | null;
  profiles?: { id: string; full_name: string | null } | null;
}

// === HOOK PRINCIPAL KB 2.0 ===
export function useVisitsQuery(filters: VisitsFilter = {}) {
  const queryClient = useQueryClient();
  
  // === ESTADO KB 2.0 ===
  const [kbError, setKbError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Clear error
  const clearError = useCallback(() => setKbError(null), []);

  // Reset state
  const reset = useCallback(() => {
    setKbError(null);
    setRetryCount(0);
    queryClient.resetQueries({ queryKey: queryKeys.visits.all });
  }, [queryClient]);

  // === REALTIME ===
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

  // === QUERY PRINCIPAL ===
  const query = useQuery({
    queryKey: ['visits', 'list', filters.gestorId, filters.companyId, filters.startDate, filters.endDate, filters.result],
    queryFn: async () => {
      const startTime = new Date();
      setRetryCount(prev => prev + 1);
      
      try {
        let q = supabase.from('visits').select(`
          *,
          companies:company_id (id, name, address),
          profiles:gestor_id (id, full_name)
        `);

        if (filters.gestorId) q = q.eq('gestor_id', filters.gestorId);
        if (filters.companyId) q = q.eq('company_id', filters.companyId);
        if (filters.startDate) q = q.gte('visit_date', filters.startDate);
        if (filters.endDate) q = q.lte('visit_date', filters.endDate);
        if (filters.result) q = q.eq('result', filters.result);

        const { data, error } = await q.order('visit_date', { ascending: false });

        if (error) throw error;

        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setKbError(null);
        setRetryCount(0);

        // Telemetry
        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'fetchVisits',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount: 0,
        });

        return data as VisitWithRelations[];
      } catch (err) {
        const parsed = parseError(err);
        setKbError(parsed);
        
        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'fetchVisits',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: parsed,
          retryCount,
        });
        
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

  // === MUTACIONES KB 2.0 ===
  const createVisit = useMutation({
    mutationFn: async (newVisit: VisitInsert) => {
      const startTime = new Date();
      try {
        const { data, error } = await supabase
          .from('visits')
          .insert(newVisit)
          .select()
          .single();

        if (error) throw error;

        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'createVisit',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount: 0,
        });

        return data;
      } catch (err) {
        const parsed = parseError(err);
        setKbError(parsed);
        
        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'createVisit',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: parsed,
          retryCount: 0,
        });
        
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });

  const updateVisit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VisitRow> & { id: string }) => {
      const startTime = new Date();
      try {
        const { data, error } = await supabase
          .from('visits')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'updateVisit',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount: 0,
        });

        return data;
      } catch (err) {
        const parsed = parseError(err);
        setKbError(parsed);
        
        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'updateVisit',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: parsed,
          retryCount: 0,
        });
        
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
    },
  });

  const deleteVisit = useMutation({
    mutationFn: async (id: string) => {
      const startTime = new Date();
      try {
        const { error } = await supabase.from('visits').delete().eq('id', id);
        if (error) throw error;

        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'deleteVisit',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount: 0,
        });
      } catch (err) {
        const parsed = parseError(err);
        setKbError(parsed);
        
        collectTelemetry({
          hookName: 'useVisitsQuery',
          operationName: 'deleteVisit',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: parsed,
          retryCount: 0,
        });
        
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all });
    },
  });

  // === COMPUTED STATUS KB 2.0 ===
  const status: KBStatus = query.isLoading 
    ? 'loading' 
    : query.isError 
      ? 'error' 
      : query.isSuccess 
        ? 'success' 
        : 'idle';

  const canRetry = kbError?.retryable === true && retryCount < 3;

  // === RETURN KB 2.0 ===
  return {
    // Data
    visits: query.data ?? [],
    data: query.data ?? [],
    
    // State Machine
    status,
    isIdle: status === 'idle',
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isRetrying: query.isFetching && retryCount > 0,
    
    // Error Management KB 2.0
    error: kbError,
    clearError,
    
    // Retry Management
    retryCount,
    canRetry,
    retry: query.refetch,
    
    // Request Control
    refetch: query.refetch,
    cancel: () => queryClient.cancelQueries({ queryKey: queryKeys.visits.all }),
    reset,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    
    // Mutations
    createVisit,
    updateVisit,
    deleteVisit,
  };
}

// === HOOK SECUNDARIO KB 2.0 ===
export function useVisitsByCompany(companyId: string) {
  const [kbError, setKbError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const clearError = useCallback(() => setKbError(null), []);

  const query = useQuery({
    queryKey: queryKeys.visits.byCompany(companyId),
    queryFn: async () => {
      const startTime = new Date();
      try {
        const { data, error } = await supabase
          .from('visits')
          .select(`
            *,
            profiles:gestor_id (id, full_name)
          `)
          .eq('company_id', companyId)
          .order('visit_date', { ascending: false });

        if (error) throw error;

        setLastRefresh(new Date());
        setKbError(null);

        collectTelemetry({
          hookName: 'useVisitsByCompany',
          operationName: 'fetchByCompany',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount: 0,
        });

        return data;
      } catch (err) {
        const parsed = parseError(err);
        setKbError(parsed);
        
        collectTelemetry({
          hookName: 'useVisitsByCompany',
          operationName: 'fetchByCompany',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: parsed,
          retryCount: 0,
        });
        
        throw err;
      }
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

  const status: KBStatus = query.isLoading 
    ? 'loading' 
    : query.isError 
      ? 'error' 
      : query.isSuccess 
        ? 'success' 
        : 'idle';

  return {
    ...query,
    // KB 2.0 additions
    status,
    isIdle: status === 'idle',
    error: kbError,
    clearError,
    lastRefresh,
  };
}

export default useVisitsQuery;
