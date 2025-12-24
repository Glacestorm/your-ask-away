import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ProcessDefinition, 
  CreateProcessDefinition, 
  UpdateProcessDefinition,
  BPMNEntityType,
  BPMNNode,
  BPMNEdge,
  SLAConfig,
  EscalationRule,
  TriggerConditions
} from '@/types/bpmn';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError } from '@/hooks/core/useKBBase';

interface UseProcessDefinitionsOptions {
  entityType?: BPMNEntityType;
  activeOnly?: boolean;
  templatesOnly?: boolean;
}

// Helper to convert DB row to ProcessDefinition
const mapRowToDefinition = (row: any): ProcessDefinition => ({
  ...row,
  nodes: (row.nodes || []) as BPMNNode[],
  edges: (row.edges || []) as BPMNEdge[],
  sla_config: (row.sla_config || {}) as SLAConfig,
  escalation_rules: (row.escalation_rules || []) as EscalationRule[],
  trigger_conditions: (row.trigger_conditions || {}) as TriggerConditions,
  variables_schema: row.variables_schema || {},
});

export function useProcessDefinitions(options: UseProcessDefinitionsOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { entityType, activeOnly = false, templatesOnly = false } = options;

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

  // Fetch definitions
  const definitionsQuery = useQuery({
    queryKey: ['process-definitions', entityType, activeOnly, templatesOnly],
    queryFn: async () => {
      setStatus('loading');
      try {
        let query = supabase
          .from('bpmn_process_definitions')
          .select('*')
          .order('updated_at', { ascending: false });

        if (entityType) {
          query = query.eq('entity_type', entityType);
        }
        if (activeOnly) {
          query = query.eq('is_active', true);
        }
        if (templatesOnly) {
          query = query.eq('is_template', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setRetryCount(0);
        
        return (data || []).map(mapRowToDefinition);
      } catch (err) {
        const kbErr = createKBError('FETCH_ERROR', err instanceof Error ? err.message : 'Error desconocido');
        setKbError(kbErr);
        setStatus('error');
        throw err;
      }
    },
  });

  // Get single definition
  const getDefinition = async (id: string): Promise<ProcessDefinition | null> => {
    const { data, error } = await supabase
      .from('bpmn_process_definitions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapRowToDefinition(data);
  };

  // Create definition
  const createMutation = useMutation({
    mutationFn: async (input: CreateProcessDefinition) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('bpmn_process_definitions')
        .insert({
          name: input.name,
          description: input.description,
          entity_type: input.entity_type,
          nodes: input.nodes as any,
          edges: input.edges as any,
          sla_config: (input.sla_config || {}) as any,
          escalation_rules: (input.escalation_rules || []) as any,
          trigger_conditions: (input.trigger_conditions || {}) as any,
          is_template: input.is_template || false,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToDefinition(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-definitions'] });
      toast({
        title: 'Proceso creado',
        description: 'La definición del proceso se ha creado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al crear proceso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update definition
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateProcessDefinition & { id: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const updateData: any = {
        updated_by: userData.user?.id,
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.nodes !== undefined) updateData.nodes = input.nodes as any;
      if (input.edges !== undefined) updateData.edges = input.edges as any;
      if (input.sla_config !== undefined) updateData.sla_config = input.sla_config as any;
      if (input.escalation_rules !== undefined) updateData.escalation_rules = input.escalation_rules as any;
      if (input.trigger_conditions !== undefined) updateData.trigger_conditions = input.trigger_conditions as any;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;
      if (input.is_template !== undefined) updateData.is_template = input.is_template;

      const { data, error } = await supabase
        .from('bpmn_process_definitions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToDefinition(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-definitions'] });
      toast({
        title: 'Proceso actualizado',
        description: 'La definición del proceso se ha actualizado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar proceso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete definition
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bpmn_process_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-definitions'] });
      toast({
        title: 'Proceso eliminado',
        description: 'La definición del proceso se ha eliminado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al eliminar proceso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('bpmn_process_definitions')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToDefinition(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['process-definitions'] });
      toast({
        title: data.is_active ? 'Proceso activado' : 'Proceso desactivado',
        description: `El proceso "${data.name}" ha sido ${data.is_active ? 'activado' : 'desactivado'}.`,
      });
    },
  });

  // Duplicate definition
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const original = await getDefinition(id);
      if (!original) throw new Error('Proceso no encontrado');

      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('bpmn_process_definitions')
        .insert({
          name: `${original.name} (copia)`,
          description: original.description,
          entity_type: original.entity_type,
          nodes: original.nodes as any,
          edges: original.edges as any,
          sla_config: original.sla_config as any,
          escalation_rules: original.escalation_rules as any,
          trigger_conditions: original.trigger_conditions as any,
          is_template: false,
          is_active: false,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToDefinition(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-definitions'] });
      toast({
        title: 'Proceso duplicado',
        description: 'Se ha creado una copia del proceso.',
      });
    },
  });

  return {
    // Data
    definitions: definitionsQuery.data || [],
    isLoading: definitionsQuery.isLoading,
    error: kbError || (definitionsQuery.error ? createKBError('QUERY_ERROR', String(definitionsQuery.error)) : null),
    refetch: definitionsQuery.refetch,

    // CRUD
    getDefinition,
    createDefinition: createMutation.mutateAsync,
    updateDefinition: updateMutation.mutateAsync,
    deleteDefinition: deleteMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    duplicateDefinition: duplicateMutation.mutateAsync,

    // States
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
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
