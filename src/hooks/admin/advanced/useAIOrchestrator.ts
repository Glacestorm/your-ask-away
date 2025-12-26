/**
 * useAIOrchestrator
 * Orquestador de agentes IA autónomos
 * Fase 12 - Advanced AI & Automation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface AIAgent {
  id: string;
  name: string;
  type: 'analyzer' | 'executor' | 'monitor' | 'coordinator' | 'specialist';
  status: 'idle' | 'running' | 'paused' | 'error' | 'completed';
  capabilities: string[];
  currentTask?: string;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    avgExecutionTime: number;
    lastActive: string;
  };
  configuration: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  description: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  currentStep: number;
  metrics: {
    totalRuns: number;
    successfulRuns: number;
    avgDuration: number;
  };
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  action: string;
  parameters: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  onSuccess?: string;
  onFailure?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
}

export interface OrchestratorContext {
  organizationId?: string;
  userId?: string;
  environment: 'production' | 'staging' | 'development';
  constraints?: {
    maxConcurrentAgents?: number;
    maxTasksPerHour?: number;
    allowedActions?: string[];
  };
}

// === HOOK ===
export function useAIOrchestrator() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<AgentWorkflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<OrchestratorContext | null>(null);

  // Refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // === INICIALIZAR ORQUESTADOR ===
  const initialize = useCallback(async (orchestratorContext: OrchestratorContext) => {
    setIsLoading(true);
    setContext(orchestratorContext);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'initialize',
          context: orchestratorContext
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setAgents(data.agents || []);
        setWorkflows(data.workflows || []);
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAIOrchestrator] initialize error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === REGISTRAR AGENTE ===
  const registerAgent = useCallback(async (agentConfig: Omit<AIAgent, 'id' | 'status' | 'metrics'>): Promise<AIAgent | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'register_agent',
          agentConfig,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.agent) {
        setAgents(prev => [...prev, data.agent]);
        toast.success(`Agente ${agentConfig.name} registrado`);
        return data.agent;
      }

      return null;
    } catch (err) {
      console.error('[useAIOrchestrator] registerAgent error:', err);
      toast.error('Error al registrar agente');
      return null;
    }
  }, [context]);

  // === ASIGNAR TAREA ===
  const assignTask = useCallback(async (
    agentId: string,
    taskType: string,
    input: Record<string, unknown>,
    priority: number = 5
  ): Promise<AgentTask | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'assign_task',
          agentId,
          taskType,
          input,
          priority,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.task) {
        setTasks(prev => [...prev, data.task]);
        
        // Actualizar estado del agente
        setAgents(prev => prev.map(a => 
          a.id === agentId ? { ...a, status: 'running', currentTask: data.task.id } : a
        ));
        
        return data.task;
      }

      return null;
    } catch (err) {
      console.error('[useAIOrchestrator] assignTask error:', err);
      toast.error('Error al asignar tarea');
      return null;
    }
  }, [context]);

  // === EJECUTAR WORKFLOW ===
  const executeWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'execute_workflow',
          workflowId,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setActiveWorkflow({ ...workflow, status: 'active', currentStep: 0 });
        toast.success(`Workflow ${workflow.name} iniciado`);
        
        // Iniciar polling de estado
        startPolling(workflowId);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAIOrchestrator] executeWorkflow error:', err);
      toast.error('Error al ejecutar workflow');
      return false;
    }
  }, [workflows, context]);

  // === PAUSAR/REANUDAR WORKFLOW ===
  const toggleWorkflow = useCallback(async (workflowId: string, pause: boolean): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: pause ? 'pause_workflow' : 'resume_workflow',
          workflowId,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, status: pause ? 'paused' : 'active' } : w
        ));
        
        if (activeWorkflow?.id === workflowId) {
          setActiveWorkflow(prev => prev ? { ...prev, status: pause ? 'paused' : 'active' } : null);
        }

        toast.success(pause ? 'Workflow pausado' : 'Workflow reanudado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAIOrchestrator] toggleWorkflow error:', err);
      return false;
    }
  }, [activeWorkflow, context]);

  // === OBTENER ESTADO DE AGENTES ===
  const refreshAgentStatus = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'get_agent_status',
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.agents) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error('[useAIOrchestrator] refreshAgentStatus error:', err);
    }
  }, [context]);

  // === COORDINAR AGENTES ===
  const coordinateAgents = useCallback(async (
    objective: string,
    requiredCapabilities: string[]
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          action: 'coordinate',
          objective,
          requiredCapabilities,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Coordinación de agentes iniciada');
        return data.coordination;
      }

      return null;
    } catch (err) {
      console.error('[useAIOrchestrator] coordinateAgents error:', err);
      toast.error('Error al coordinar agentes');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // === POLLING ===
  const startPolling = useCallback((workflowId: string) => {
    stopPolling();
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('ai-orchestrator', {
          body: {
            action: 'get_workflow_status',
            workflowId,
            context
          }
        });

        if (data?.workflow) {
          setActiveWorkflow(data.workflow);
          
          if (data.workflow.status === 'completed' || data.workflow.status === 'paused') {
            stopPolling();
          }
        }
      } catch (err) {
        console.error('[useAIOrchestrator] polling error:', err);
      }
    }, 5000);
  }, [context]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    agents,
    tasks,
    workflows,
    activeWorkflow,
    error,
    context,
    // Acciones
    initialize,
    registerAgent,
    assignTask,
    executeWorkflow,
    toggleWorkflow,
    refreshAgentStatus,
    coordinateAgents,
    startPolling,
    stopPolling
  };
}

export default useAIOrchestrator;
