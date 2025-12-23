/**
 * Hook: useWorkflowEngine
 * Motor de Automatización de Workflows con Reglas Dinámicas
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  successRate: number;
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual' | 'condition';
  config: Record<string, unknown>;
  description: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'delay' | 'approval' | 'notification' | 'integration';
  config: Record<string, unknown>;
  order: number;
  onSuccess?: string;
  onFailure?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting';
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: string;
  stepId: string;
  stepName: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  message: string;
  data?: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  actions: string[];
  priority: number;
  enabled: boolean;
  triggerCount: number;
  lastTriggered?: string;
}

export interface WorkflowContext {
  organizationId?: string;
  includeExecutions?: boolean;
  status?: string[];
}

// === HOOK ===
export function useWorkflowEngine() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GET WORKFLOWS ===
  const getWorkflows = useCallback(async (context: WorkflowContext = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'get_workflows',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setWorkflows(fnData.data.workflows || []);
        setRules(fnData.data.rules || []);
        if (context.includeExecutions) {
          setExecutions(fnData.data.executions || []);
        }
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error al obtener workflows');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useWorkflowEngine] getWorkflows error:', err);
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
            params: workflow
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setWorkflows(prev => [...prev, fnData.data.workflow]);
        toast.success('Workflow creado correctamente');
        return fnData.data.workflow;
      }

      throw new Error(fnData?.error || 'Error al crear workflow');
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
            params: { workflowId, inputData }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setExecutions(prev => [fnData.data.execution, ...prev]);
        toast.success('Workflow iniciado');
        return fnData.data.execution;
      }

      throw new Error(fnData?.error || 'Error al ejecutar workflow');
    } catch (err) {
      console.error('[useWorkflowEngine] executeWorkflow error:', err);
      toast.error('Error al ejecutar workflow');
      return null;
    }
  }, []);

  // === PAUSE/RESUME WORKFLOW ===
  const toggleWorkflow = useCallback(async (workflowId: string, action: 'pause' | 'resume') => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: action === 'pause' ? 'pause_workflow' : 'resume_workflow',
            params: { workflowId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId 
            ? { ...w, status: action === 'pause' ? 'paused' as const : 'active' as const }
            : w
        ));
        toast.success(`Workflow ${action === 'pause' ? 'pausado' : 'reanudado'}`);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useWorkflowEngine] toggleWorkflow error:', err);
      toast.error(`Error al ${action === 'pause' ? 'pausar' : 'reanudar'} workflow`);
      return false;
    }
  }, []);

  // === GENERATE WORKFLOW WITH AI ===
  const generateWorkflow = useCallback(async (description: string, context?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'generate_workflow',
            params: { description, context }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Workflow generado con IA');
        return fnData.data.workflow;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowEngine] generateWorkflow error:', err);
      toast.error('Error al generar workflow');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE AUTOMATION RULE ===
  const createRule = useCallback(async (rule: Partial<AutomationRule>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'workflow-engine',
        {
          body: {
            action: 'create_rule',
            params: rule
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setRules(prev => [...prev, fnData.data.rule]);
        toast.success('Regla de automatización creada');
        return fnData.data.rule;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowEngine] createRule error:', err);
      toast.error('Error al crear regla');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: WorkflowContext = {}, intervalMs = 60000) => {
    stopAutoRefresh();
    getWorkflows(context);
    autoRefreshInterval.current = setInterval(() => {
      getWorkflows(context);
    }, intervalMs);
  }, [getWorkflows]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    workflows,
    executions,
    rules,
    error,
    lastRefresh,
    // Acciones
    getWorkflows,
    createWorkflow,
    executeWorkflow,
    toggleWorkflow,
    generateWorkflow,
    createRule,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useWorkflowEngine;
