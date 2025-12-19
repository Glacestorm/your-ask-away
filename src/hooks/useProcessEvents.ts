import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProcessEvent, EmitProcessEventParams, ProcessEventEntityType } from '@/types/bpmn';
import { useToast } from '@/hooks/use-toast';

interface UseProcessEventsOptions {
  entityType?: ProcessEventEntityType;
  entityId?: string;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useProcessEvents(options: UseProcessEventsOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { entityType, entityId, limit = 100, dateFrom, dateTo } = options;

  // Fetch events
  const eventsQuery = useQuery({
    queryKey: ['process-events', entityType, entityId, limit, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('process_events')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      if (dateFrom) {
        query = query.gte('occurred_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('occurred_at', dateTo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProcessEvent[];
    },
  });

  // Emit event mutation
  const emitEventMutation = useMutation({
    mutationFn: async (params: EmitProcessEventParams) => {
      const { data, error } = await supabase.rpc('emit_process_event', {
        p_entity_type: params.entity_type,
        p_entity_id: params.entity_id,
        p_action: params.action,
        p_from_state: params.from_state || null,
        p_to_state: params.to_state || null,
        p_metadata: params.metadata || {},
        p_actor_type: params.actor_type || 'user',
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-events'] });
    },
    onError: (error) => {
      toast({
        title: 'Error al emitir evento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get mining stats
  const miningStatsQuery = useQuery({
    queryKey: ['process-mining-stats', entityType, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_process_mining_stats', {
        p_entity_type: entityType || null,
        p_date_from: dateFrom?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_date_to: dateTo?.toISOString() || new Date().toISOString(),
      });

      if (error) throw error;
      return data;
    },
    enabled: false, // Only fetch when explicitly called
  });

  // Get bottlenecks
  const bottlenecksQuery = useQuery({
    queryKey: ['process-bottlenecks', dateFrom?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_process_bottlenecks', {
        p_process_definition_id: null,
        p_date_from: dateFrom?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  // Subscribe to realtime events
  const subscribeToEvents = (callback: (event: ProcessEvent) => void) => {
    const channel = supabase
      .channel('process-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'process_events',
        },
        (payload) => {
          callback(payload.new as ProcessEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    // Events
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,

    // Emit event
    emitEvent: emitEventMutation.mutateAsync,
    isEmitting: emitEventMutation.isPending,

    // Mining stats
    miningStats: miningStatsQuery.data,
    fetchMiningStats: miningStatsQuery.refetch,
    isLoadingStats: miningStatsQuery.isLoading,

    // Bottlenecks
    bottlenecks: bottlenecksQuery.data,
    fetchBottlenecks: bottlenecksQuery.refetch,
    isLoadingBottlenecks: bottlenecksQuery.isLoading,

    // Realtime
    subscribeToEvents,
  };
}
