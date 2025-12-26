import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook';
  trigger_config: Record<string, unknown>;
  steps: WorkflowStep[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  step_type: 'action' | 'condition' | 'loop' | 'parallel' | 'wait';
  action_type?: string;
  config: Record<string, unknown>;
  next_step_id?: string;
  on_success?: string;
  on_failure?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  current_step?: string;
  execution_log: ExecutionLogEntry[];
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error_message?: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  step_id: string;
  action: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  duration_ms?: number;
  details?: string;
}

export interface WorkflowContext {
  organizationId?: string;
  filters?: {
    status?: string;
    trigger_type?: string;
  };
}

// === HOOK ===
export function useWorkflowEngine() {
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH WORKFLOWS ===
  const fetchWorkflows = useCallback(async (context?: WorkflowContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'list_workflows',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.workflows) {
        setWorkflows(fnData.workflows);
        setLastRefresh(new Date());
        return fnData.workflows;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useWorkflowEngine] fetchWorkflows error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE WORKFLOW ===
  const createWorkflow = useCallback(async (workflow: Partial<WorkflowDefinition>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'create_workflow',
            workflow
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Workflow creado exitosamente');
        return fnData.workflow;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowEngine] createWorkflow error:', err);
      toast.error('Error al crear workflow');
      return null;
    }
  }, []);

  // === EXECUTE WORKFLOW ===
  const executeWorkflow = useCallback(async (
    workflowId: string,
    inputData?: Record<string, unknown>
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'execute_workflow',
            workflowId,
            inputData
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Workflow ejecutado');
        return fnData.execution;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowEngine] executeWorkflow error:', err);
      toast.error('Error al ejecutar workflow');
      return null;
    }
  }, []);

  // === GET EXECUTIONS ===
  const getExecutions = useCallback(async (workflowId?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'get_executions',
            workflowId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.executions) {
        setExecutions(fnData.executions);
        return fnData.executions;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowEngine] getExecutions error:', err);
      return null;
    }
  }, []);

  // === TOGGLE WORKFLOW ===
  const toggleWorkflow = useCallback(async (workflowId: string, isActive: boolean) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'toggle_workflow',
            workflowId,
            isActive
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(isActive ? 'Workflow activado' : 'Workflow desactivado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useWorkflowEngine] toggleWorkflow error:', err);
      toast.error('Error al cambiar estado del workflow');
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: WorkflowContext, intervalMs = 60000) => {
    stopAutoRefresh();
    fetchWorkflows(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchWorkflows(context);
    }, intervalMs);
  }, [fetchWorkflows]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    workflows,
    executions,
    error,
    lastRefresh,
    fetchWorkflows,
    createWorkflow,
    executeWorkflow,
    getExecutions,
    toggleWorkflow,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useWorkflowEngine;
