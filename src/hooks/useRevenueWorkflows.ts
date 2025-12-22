import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['revenue-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_workflows')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown) as RevenueWorkflow[];
    }
  });

  const { data: executions } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_workflow_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as unknown) as WorkflowExecution[];
    }
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Omit<RevenueWorkflow, 'id' | 'created_at' | 'last_triggered_at' | 'execution_count'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from('revenue_workflows').insert(workflow as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-workflows'] });
      toast.success('Workflow creado');
    }
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RevenueWorkflow> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('revenue_workflows').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-workflows'] });
      toast.success('Workflow actualizado');
    }
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('revenue_workflows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-workflows'] });
      toast.success('Workflow eliminado');
    }
  });

  const executeWorkflow = useMutation({
    mutationFn: async ({ workflowId, triggerData }: { workflowId: string; triggerData?: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('execute-revenue-workflow', {
        body: { workflowId, triggerData }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast.success('Workflow ejecutado');
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
    activeWorkflows: workflows?.filter(w => w.is_active) || []
  };
};
