import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface WorkflowTrigger {
  id: string;
  type: 'event' | 'schedule' | 'condition' | 'manual';
  config: Record<string, unknown>;
}

export interface WorkflowAction {
  id: string;
  type: 'email' | 'notification' | 'task' | 'api_call' | 'data_update' | 'ai_action';
  config: Record<string, unknown>;
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  run_count: number;
  success_rate: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  trigger_data: Record<string, unknown>;
  actions_executed: number;
  error_message?: string;
}

// === HOOK ===
export function useWorkflowAutomation() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === FETCH WORKFLOWS ===
  const fetchWorkflows = useCallback(async (): Promise<Workflow[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workflow-automation', {
        body: { action: 'list_workflows' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.workflows) {
        setWorkflows(data.workflows);
        return data.workflows;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching workflows';
      setError(message);
      console.error('[useWorkflowAutomation] fetchWorkflows error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE WORKFLOW ===
  const createWorkflow = useCallback(async (workflow: Partial<Workflow>): Promise<Workflow | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workflow-automation', {
        body: { action: 'create_workflow', workflow }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.workflow) {
        setWorkflows(prev => [...prev, data.workflow]);
        toast.success('Workflow creado');
        return data.workflow;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowAutomation] createWorkflow error:', err);
      toast.error('Error al crear workflow');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE WORKFLOW ===
  const updateWorkflow = useCallback(async (id: string, updates: Partial<Workflow>): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workflow-automation', {
        body: { action: 'update_workflow', id, updates }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
        toast.success('Workflow actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useWorkflowAutomation] updateWorkflow error:', err);
      toast.error('Error al actualizar workflow');
      return false;
    }
  }, []);

  // === TOGGLE WORKFLOW ===
  const toggleWorkflow = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    return updateWorkflow(id, { is_active: isActive });
  }, [updateWorkflow]);

  // === EXECUTE WORKFLOW ===
  const executeWorkflow = useCallback(async (id: string, triggerData?: Record<string, unknown>): Promise<WorkflowExecution | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workflow-automation', {
        body: { action: 'execute_workflow', id, triggerData }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.execution) {
        setExecutions(prev => [data.execution, ...prev]);
        toast.success('Workflow ejecutado');
        return data.execution;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowAutomation] executeWorkflow error:', err);
      toast.error('Error al ejecutar workflow');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH EXECUTIONS ===
  const fetchExecutions = useCallback(async (workflowId?: string, limit: number = 20): Promise<WorkflowExecution[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workflow-automation', {
        body: { action: 'list_executions', workflowId, limit }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.executions) {
        setExecutions(data.executions);
        return data.executions;
      }

      return [];
    } catch (err) {
      console.error('[useWorkflowAutomation] fetchExecutions error:', err);
      return [];
    }
  }, []);

  // === GET WORKFLOW TEMPLATES ===
  const getTemplates = useCallback(async (): Promise<Partial<Workflow>[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('workflow-automation', {
        body: { action: 'get_templates' }
      });

      if (fnError) throw fnError;

      return data?.templates || [];
    } catch (err) {
      console.error('[useWorkflowAutomation] getTemplates error:', err);
      return [];
    }
  }, []);

  return {
    workflows,
    executions,
    isLoading,
    error,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    toggleWorkflow,
    executeWorkflow,
    fetchExecutions,
    getTemplates,
  };
}

export default useWorkflowAutomation;
