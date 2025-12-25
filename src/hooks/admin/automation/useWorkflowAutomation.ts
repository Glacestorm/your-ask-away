/**
 * useWorkflowAutomation - Hook para automatización de flujos de trabajo
 * Fase 5 - Automation & Orchestration
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'scheduled' | 'event' | 'condition';
  trigger_config: Record<string, unknown>;
  steps: WorkflowStep[];
  is_active: boolean;
  last_run_at?: string;
  run_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  step_type: 'action' | 'condition' | 'delay' | 'notification' | 'integration';
  action_name: string;
  config: Record<string, unknown>;
  on_success?: string;
  on_failure?: string;
  order_index: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  current_step: number;
  steps_completed: number;
  error_message?: string;
  execution_log: Array<{
    step_id: string;
    status: string;
    timestamp: string;
    output?: unknown;
  }>;
}

export interface WorkflowContext {
  entityId?: string;
  entityType?: string;
  filters?: Record<string, unknown>;
}

export function useWorkflowAutomation() {
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchWorkflows = useCallback(async (context?: WorkflowContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'workflow-automation',
        {
          body: {
            action: 'list_workflows',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.workflows) {
        setWorkflows(data.workflows);
        setLastRefresh(new Date());
        return data.workflows;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useWorkflowAutomation] fetchWorkflows error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async (workflow: Partial<WorkflowDefinition>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'workflow-automation',
        {
          body: {
            action: 'create_workflow',
            workflow
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Workflow creado exitosamente');
        await fetchWorkflows();
        return data.workflow;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowAutomation] createWorkflow error:', err);
      toast.error('Error al crear workflow');
      return null;
    }
  }, [fetchWorkflows]);

  const executeWorkflow = useCallback(async (workflowId: string, inputData?: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'workflow-automation',
        {
          body: {
            action: 'execute_workflow',
            workflowId,
            inputData
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Workflow iniciado');
        return data.execution;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowAutomation] executeWorkflow error:', err);
      toast.error('Error al ejecutar workflow');
      return null;
    }
  }, []);

  const getExecutionHistory = useCallback(async (workflowId?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'workflow-automation',
        {
          body: {
            action: 'get_executions',
            workflowId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.executions) {
        setExecutions(data.executions);
        return data.executions;
      }

      return [];
    } catch (err) {
      console.error('[useWorkflowAutomation] getExecutionHistory error:', err);
      return [];
    }
  }, []);

  const toggleWorkflow = useCallback(async (workflowId: string, isActive: boolean) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'workflow-automation',
        {
          body: {
            action: 'toggle_workflow',
            workflowId,
            isActive
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(isActive ? 'Workflow activado' : 'Workflow desactivado');
        await fetchWorkflows();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useWorkflowAutomation] toggleWorkflow error:', err);
      toast.error('Error al cambiar estado del workflow');
      return false;
    }
  }, [fetchWorkflows]);

  const startAutoRefresh = useCallback((context: WorkflowContext, intervalMs = 30000) => {
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
    getExecutionHistory,
    toggleWorkflow,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useWorkflowAutomation;
