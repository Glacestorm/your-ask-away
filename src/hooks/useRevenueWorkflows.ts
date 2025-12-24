import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface RevenueWorkflowsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: unknown;
}

export interface WorkflowAction {
  type: 'create_alert' | 'send_notification' | 'update_status' | 'create_task' | 'invoke_function';
  config: Record<string, unknown>;
}

export interface RevenueWorkflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: 'event' | 'threshold' | 'schedule' | 'signal';
  trigger_config: Record<string, unknown>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: number;
  cooldown_minutes: number;
  last_triggered_at: string | null;
  execution_count: number;
  created_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  triggered_by: string;
  trigger_data: Record<string, unknown> | null;
  actions_executed: Record<string, unknown> | null;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export const useRevenueWorkflows = () => {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<RevenueWorkflowsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['revenue-workflows'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_workflows')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setLastRefresh(new Date());
        setError(null);
        return (data as unknown) as RevenueWorkflow[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError({
          code: 'FETCH_WORKFLOWS_ERROR',
          message,
          details: { originalError: String(err) }
        });
        throw err;
      }
    }
  });

  const { data: executions } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_workflow_executions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50);
        
        if (fetchError) throw fetchError;
        return (data as unknown) as WorkflowExecution[];
      } catch (err) {
        console.error('[useRevenueWorkflows] Error fetching executions:', err);
        return [];
      }
    }
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Omit<RevenueWorkflow, 'id' | 'created_at' | 'last_triggered_at' | 'execution_count'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: createError } = await supabase.from('revenue_workflows').insert(workflow as any).select().single();
      if (createError) throw createError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-workflows'] });
      toast.success('Workflow creado');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al crear workflow';
      setError({
        code: 'CREATE_WORKFLOW_ERROR',
        message,
        details: { originalError: String(err) }
      });
    }
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RevenueWorkflow> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await supabase.from('revenue_workflows').update(updates as any).eq('id', id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-workflows'] });
      toast.success('Workflow actualizado');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al actualizar workflow';
      setError({
        code: 'UPDATE_WORKFLOW_ERROR',
        message,
        details: { originalError: String(err) }
      });
    }
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from('revenue_workflows').delete().eq('id', id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-workflows'] });
      toast.success('Workflow eliminado');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al eliminar workflow';
      setError({
        code: 'DELETE_WORKFLOW_ERROR',
        message,
        details: { originalError: String(err) }
      });
    }
  });

  const executeWorkflow = useMutation({
    mutationFn: async ({ workflowId, triggerData }: { workflowId: string; triggerData?: Record<string, unknown> }) => {
      const { data, error: invokeError } = await supabase.functions.invoke('execute-revenue-workflow', {
        body: { workflowId, triggerData }
      });
      if (invokeError) throw invokeError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast.success('Workflow ejecutado');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al ejecutar workflow';
      setError({
        code: 'EXECUTE_WORKFLOW_ERROR',
        message,
        details: { originalError: String(err) }
      });
    }
  });

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    await updateWorkflow.mutateAsync({ id, is_active: isActive });
  };

  return {
    workflows,
    executions,
    isLoading,
    refetch,
    createWorkflow: createWorkflow.mutateAsync,
    updateWorkflow: updateWorkflow.mutateAsync,
    deleteWorkflow: deleteWorkflow.mutateAsync,
    executeWorkflow: executeWorkflow.mutateAsync,
    toggleWorkflow,
    activeWorkflows: workflows?.filter(w => w.is_active) || [],
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
};
