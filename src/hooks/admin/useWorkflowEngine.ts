/**
 * Hook: useWorkflowEngine
 * Motor de Automatización de Workflows con Reglas Dinámicas
 * Fase 11 - Enterprise SaaS 2025-2026 + KB 2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

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
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);

  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isLoading = status === 'loading';
  const isIdle = status === 'idle';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GET WORKFLOWS ===
  const getWorkflows = useCallback(async (context: WorkflowContext = {}) => {
    setStatus('loading');
    setError(null);
    const startTime = Date.now();

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
        setLastSuccess(new Date());
        setStatus('success');
        setRetryCount(0);
        collectTelemetry('useWorkflowEngine', 'getWorkflows', 'success', Date.now() - startTime);
        return fnData.data;
      }

      throw new Error(fnData?.error || 'Error al obtener workflows');
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('GET_WORKFLOWS_ERROR', parsedErr.message, { retryable: true, details: { originalError: String(err) } });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useWorkflowEngine', 'getWorkflows', 'error', Date.now() - startTime, kbError);
      console.error('[useWorkflowEngine] getWorkflows error:', err);
      return null;
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
    setStatus('loading');
    const startTime = Date.now();
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
        setStatus('success');
        collectTelemetry('useWorkflowEngine', 'generateWorkflow', 'success', Date.now() - startTime);
        return fnData.data.workflow;
      }

      return null;
    } catch (err) {
      console.error('[useWorkflowEngine] generateWorkflow error:', err);
      toast.error('Error al generar workflow');
      setStatus('error');
      collectTelemetry('useWorkflowEngine', 'generateWorkflow', 'error', Date.now() - startTime);
      return null;
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

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  // === KB 2.0 RESET ===
  const reset = useCallback(() => {
    setWorkflows([]);
    setExecutions([]);
    setRules([]);
    setError(null);
    setStatus('idle');
    setLastRefresh(null);
    setLastSuccess(null);
    setRetryCount(0);
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
    // === KB 2.0 ===
    status,
    isIdle,
    isSuccess,
    isError,
    lastSuccess,
    retryCount,
    clearError,
    reset,
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
