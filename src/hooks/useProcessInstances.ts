import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ProcessInstance, 
  CreateProcessInstance, 
  ProcessInstanceStatus,
  SLAStatus,
  ProcessInstanceHistory,
  ProcessDefinition,
  BPMNNode,
  BPMNEdge,
  SLAConfig,
  EscalationRule,
  TriggerConditions
} from '@/types/bpmn';
import { useToast } from '@/hooks/use-toast';

interface UseProcessInstancesOptions {
  processDefinitionId?: string;
  entityType?: string;
  entityId?: string;
  status?: ProcessInstanceStatus;
  slaStatus?: SLAStatus;
}

// Helper to convert DB row to ProcessInstance
const mapRowToInstance = (row: any): ProcessInstance => ({
  ...row,
  history: (row.history || []) as ProcessInstanceHistory[],
  variables: row.variables || {},
  process_definition: row.bpmn_process_definitions ? {
    ...row.bpmn_process_definitions,
    nodes: (row.bpmn_process_definitions.nodes || []) as BPMNNode[],
    edges: (row.bpmn_process_definitions.edges || []) as BPMNEdge[],
    sla_config: (row.bpmn_process_definitions.sla_config || {}) as SLAConfig,
    escalation_rules: (row.bpmn_process_definitions.escalation_rules || []) as EscalationRule[],
    trigger_conditions: (row.bpmn_process_definitions.trigger_conditions || {}) as TriggerConditions,
  } as ProcessDefinition : undefined,
});

export function useProcessInstances(options: UseProcessInstancesOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processDefinitionId, entityType, entityId, status, slaStatus } = options;

  // Fetch instances
  const instancesQuery = useQuery({
    queryKey: ['process-instances', processDefinitionId, entityType, entityId, status, slaStatus],
    queryFn: async () => {
      let query = supabase
        .from('bpmn_process_instances')
        .select(`
          *,
          bpmn_process_definitions (
            id, name, description, entity_type, nodes, edges, sla_config
          )
        `)
        .order('started_at', { ascending: false });

      if (processDefinitionId) {
        query = query.eq('process_definition_id', processDefinitionId);
      }
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (slaStatus) {
        query = query.eq('sla_status', slaStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRowToInstance);
    },
  });

  // Get single instance
  const getInstance = async (id: string): Promise<ProcessInstance | null> => {
    const { data, error } = await supabase
      .from('bpmn_process_instances')
      .select(`
        *,
        bpmn_process_definitions (
          id, name, description, entity_type, nodes, edges, sla_config
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapRowToInstance(data);
  };

  // Start new instance
  const startInstanceMutation = useMutation({
    mutationFn: async (input: CreateProcessInstance) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('bpmn_process_instances')
        .insert({
          process_definition_id: input.process_definition_id,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          current_node_id: input.current_node_id,
          variables: input.variables || {},
          history: [{
            nodeId: input.current_node_id,
            enteredAt: new Date().toISOString(),
          }] as any,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToInstance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
      toast({
        title: 'Proceso iniciado',
        description: 'Se ha iniciado una nueva instancia del proceso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al iniciar proceso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Move to next node
  const moveToNodeMutation = useMutation({
    mutationFn: async ({ instanceId, nodeId, variables }: { 
      instanceId: string; 
      nodeId: string; 
      variables?: Record<string, any>;
    }) => {
      // Get current instance
      const instance = await getInstance(instanceId);
      if (!instance) throw new Error('Instancia no encontrada');

      // Update history
      const updatedHistory: ProcessInstanceHistory[] = instance.history.map((h, i) => {
        if (i === instance.history.length - 1 && !h.exitedAt) {
          return {
            ...h,
            exitedAt: new Date().toISOString(),
            duration: new Date().getTime() - new Date(h.enteredAt).getTime(),
          };
        }
        return h;
      });

      updatedHistory.push({
        nodeId,
        enteredAt: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from('bpmn_process_instances')
        .update({
          previous_node_id: instance.current_node_id,
          current_node_id: nodeId,
          history: updatedHistory as any,
          variables: { ...instance.variables, ...variables },
        })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return mapRowToInstance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
    },
  });

  // Complete instance
  const completeMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const instance = await getInstance(instanceId);
      if (!instance) throw new Error('Instancia no encontrada');

      // Update last history entry
      const updatedHistory = instance.history.map((h, i) => {
        if (i === instance.history.length - 1 && !h.exitedAt) {
          return {
            ...h,
            exitedAt: new Date().toISOString(),
            duration: new Date().getTime() - new Date(h.enteredAt).getTime(),
          };
        }
        return h;
      });

      const { data, error } = await supabase
        .from('bpmn_process_instances')
        .update({
          status: 'completed',
          actual_completion: new Date().toISOString(),
          history: updatedHistory as any,
          completed_by: userData.user?.id,
        })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return mapRowToInstance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
      toast({
        title: 'Proceso completado',
        description: 'La instancia del proceso se ha completado correctamente.',
      });
    },
  });

  // Suspend/Resume instance
  const toggleSuspendMutation = useMutation({
    mutationFn: async ({ instanceId, suspend }: { instanceId: string; suspend: boolean }) => {
      const { data, error } = await supabase
        .from('bpmn_process_instances')
        .update({
          status: suspend ? 'suspended' : 'running',
        })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return mapRowToInstance(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
      toast({
        title: data.status === 'suspended' ? 'Proceso suspendido' : 'Proceso reanudado',
      });
    },
  });

  // Cancel instance
  const cancelMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const { data, error } = await supabase
        .from('bpmn_process_instances')
        .update({
          status: 'cancelled',
          actual_completion: new Date().toISOString(),
        })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return mapRowToInstance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
      toast({
        title: 'Proceso cancelado',
        variant: 'destructive',
      });
    },
  });

  // Update SLA status
  const updateSLAStatusMutation = useMutation({
    mutationFn: async ({ instanceId, slaStatus }: { instanceId: string; slaStatus: SLAStatus }) => {
      const { data, error } = await supabase
        .from('bpmn_process_instances')
        .update({ sla_status: slaStatus })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return mapRowToInstance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
    },
  });

  // Subscribe to realtime changes
  const subscribeToInstances = (callback: (instance: ProcessInstance) => void) => {
    const channel = supabase
      .channel('process-instances-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bpmn_process_instances',
        },
        async (payload) => {
          if (payload.new) {
            const instance = await getInstance((payload.new as any).id);
            if (instance) callback(instance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    // Data
    instances: instancesQuery.data || [],
    isLoading: instancesQuery.isLoading,
    error: instancesQuery.error,
    refetch: instancesQuery.refetch,

    // Single instance
    getInstance,

    // Actions
    startInstance: startInstanceMutation.mutateAsync,
    moveToNode: moveToNodeMutation.mutateAsync,
    completeInstance: completeMutation.mutateAsync,
    toggleSuspend: toggleSuspendMutation.mutateAsync,
    cancelInstance: cancelMutation.mutateAsync,
    updateSLAStatus: updateSLAStatusMutation.mutateAsync,

    // States
    isStarting: startInstanceMutation.isPending,
    isMoving: moveToNodeMutation.isPending,
    isCompleting: completeMutation.isPending,

    // Realtime
    subscribeToInstances,
  };
}
