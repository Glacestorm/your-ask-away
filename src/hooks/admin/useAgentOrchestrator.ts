import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface AIAgent {
  id: string;
  name: string;
  type: 'analyst' | 'executor' | 'monitor' | 'optimizer' | 'communicator';
  expertise: string[];
  personality: {
    traits: string[];
    communicationStyle: 'formal' | 'casual' | 'technical' | 'friendly';
    decisionMaking: 'cautious' | 'balanced' | 'aggressive';
  };
  capabilities: AgentCapability[];
  constraints: string[];
  maxActionsPerHour: number;
  memoryCapacity: 'short_term' | 'long_term' | 'persistent';
  learningEnabled: boolean;
  status: 'created' | 'active' | 'paused' | 'disabled' | 'error';
}

export interface AgentCapability {
  name: string;
  description: string;
  requiredPermissions: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AgentGoal {
  description: string;
  targetMetrics?: Record<string, unknown>;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  constraints?: string[];
}

export interface ExecutionPlan {
  goalAnalysis: {
    originalGoal: string;
    interpretation: string;
    feasibility: number;
    estimatedDuration: string;
    resourcesRequired: string[];
  };
  phases: ExecutionPhase[];
  criticalPath: string[];
  riskAssessment: RiskAssessment;
}

export interface ExecutionPhase {
  phaseId: string;
  name: string;
  description: string;
  steps: ExecutionStep[];
  successCriteria: string[];
  failureHandling: 'retry' | 'skip' | 'abort' | 'escalate';
}

export interface ExecutionStep {
  stepId: string;
  action: string;
  description: string;
  agentCapability: string;
  inputs: Record<string, unknown>;
  expectedOutputs: Record<string, unknown>;
  dependencies: string[];
  estimatedTime: string;
  riskLevel: 'low' | 'medium' | 'high';
  rollbackAction: string | null;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  risks: Array<{
    riskId: string;
    description: string;
    probability: number;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  contingencyPlans: Array<{
    triggeredBy: string;
    actions: string[];
  }>;
}

export interface AgentCollaboration {
  sessionId: string;
  taskDescription: string;
  coordinationType: 'sequential' | 'parallel' | 'hierarchical';
  participants: Array<{
    agentId: string;
    role: 'leader' | 'worker' | 'validator' | 'observer';
    assignedSubtasks: string[];
    dependencies: string[];
  }>;
  workflow: Array<{
    stepId: string;
    agentId: string;
    action: string;
    timeout: string;
  }>;
  synchronizationPoints: Array<{
    name: string;
    waitFor: string[];
    aggregation: 'all' | 'any' | 'majority';
  }>;
}

export interface AgentMemory {
  agentId: string;
  shortTerm: {
    recentActions: unknown[];
    currentContext: Record<string, unknown>;
    workingMemory: Record<string, unknown>;
  };
  longTerm: {
    learnedPatterns: unknown[];
    successfulStrategies: unknown[];
    failedAttempts: unknown[];
    userPreferences: Record<string, unknown>;
  };
  episodic: {
    significantEvents: unknown[];
    milestones: unknown[];
  };
  semantic: {
    domainKnowledge: Record<string, unknown>;
    relationships: unknown[];
  };
}

export interface AgentStatus {
  agentId: string;
  name: string;
  state: 'idle' | 'working' | 'waiting' | 'error' | 'paused';
  currentTask: {
    taskId: string;
    description: string;
    progress: number;
    startedAt: string;
    estimatedCompletion: string;
  } | null;
  queue: Array<{
    taskId: string;
    priority: number;
    description: string;
  }>;
  performance: {
    tasksCompleted: number;
    tasksToday: number;
    avgCompletionTime: string;
    successRate: number;
    errorRate: number;
  };
  resources: {
    memoryUsage: number;
    actionsRemaining: number;
    cooldownUntil: string | null;
  };
}

export interface ExecutionHistory {
  agentId: string;
  period: string;
  executions: Array<{
    executionId: string;
    goalDescription: string;
    startedAt: string;
    completedAt: string;
    status: 'success' | 'partial' | 'failed' | 'cancelled';
    stepsCompleted: number;
    totalSteps: number;
    outcome: string;
  }>;
  statistics: {
    totalExecutions: number;
    successRate: number;
    avgDuration: string;
    mostCommonGoals: string[];
    frequentFailures: string[];
  };
}

// === HOOK ===
export function useAgentOrchestrator() {
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null);
  const [collaborations, setCollaborations] = useState<AgentCollaboration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Execution state
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isExecutingGoal, setIsExecutingGoal] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === CREATE AGENT ===
  const createAgent = useCallback(async (config: {
    name: string;
    type: AIAgent['type'];
    expertise: string[];
    personality?: string;
    constraints?: string[];
    maxActionsPerHour?: number;
  }) => {
    setIsCreatingAgent(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'create_agent',
            agentConfig: config
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.agent) {
        const newAgent = fnData.agent as AIAgent;
        setAgents(prev => [...prev, newAgent]);
        toast.success(`Agente "${newAgent.name}" creado exitosamente`);
        return {
          agent: newAgent,
          initialization: fnData.initialization
        };
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAgentOrchestrator] createAgent error:', err);
      toast.error('Error al crear agente');
      return null;
    } finally {
      setIsCreatingAgent(false);
    }
  }, []);

  // === EXECUTE GOAL ===
  const executeGoal = useCallback(async (
    goal: AgentGoal,
    agentId?: string
  ) => {
    setIsExecutingGoal(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'execute_goal',
            goal,
            agentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        const plan: ExecutionPlan = {
          goalAnalysis: fnData.goalAnalysis,
          phases: fnData.executionPlan?.phases || [],
          criticalPath: fnData.executionPlan?.criticalPath || [],
          riskAssessment: fnData.riskAssessment || { overallRisk: 'low', risks: [], contingencyPlans: [] }
        };
        setCurrentPlan(plan);
        toast.success('Plan de ejecución generado');
        return {
          plan,
          metrics: fnData.metrics
        };
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAgentOrchestrator] executeGoal error:', err);
      toast.error('Error al planificar objetivo');
      return null;
    } finally {
      setIsExecutingGoal(false);
    }
  }, []);

  // === AGENT COLLABORATION ===
  const startCollaboration = useCallback(async (
    agentIds: string[],
    taskDescription: string,
    coordinationType: 'sequential' | 'parallel' | 'hierarchical'
  ) => {
    setIsCollaborating(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'agent_collaboration',
            collaborationParams: {
              agentIds,
              taskDescription,
              coordinationType
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.collaboration) {
        const collab = fnData.collaboration as AgentCollaboration;
        setCollaborations(prev => [...prev, collab]);
        toast.success('Colaboración multi-agente iniciada');
        return {
          collaboration: collab,
          expectedOutcome: fnData.expectedOutcome
        };
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAgentOrchestrator] startCollaboration error:', err);
      toast.error('Error al iniciar colaboración');
      return null;
    } finally {
      setIsCollaborating(false);
    }
  }, []);

  // === GET AGENT MEMORY ===
  const getAgentMemory = useCallback(async (
    agentId: string,
    key?: string
  ): Promise<AgentMemory | null> => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'get_agent_memory',
            memoryParams: { agentId, key }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.memory) {
        return fnData.memory as AgentMemory;
      }

      return null;
    } catch (err) {
      console.error('[useAgentOrchestrator] getAgentMemory error:', err);
      return null;
    }
  }, []);

  // === UPDATE AGENT MEMORY ===
  const updateAgentMemory = useCallback(async (
    agentId: string,
    key: string,
    value: unknown,
    context?: string
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'update_agent_memory',
            memoryParams: { agentId, key, value, context }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Memoria del agente actualizada');
        return fnData.update;
      }

      return null;
    } catch (err) {
      console.error('[useAgentOrchestrator] updateAgentMemory error:', err);
      toast.error('Error al actualizar memoria');
      return null;
    }
  }, []);

  // === LIST AGENTS ===
  const listAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'list_agents'
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.agents) {
        setAgents(fnData.agents);
        setLastRefresh(new Date());
        return {
          agents: fnData.agents,
          summary: fnData.summary
        };
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAgentOrchestrator] listAgents error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET AGENT STATUS ===
  const getAgentStatus = useCallback(async (agentId: string): Promise<AgentStatus | null> => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'get_agent_status',
            agentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.status) {
        return fnData.status as AgentStatus;
      }

      return null;
    } catch (err) {
      console.error('[useAgentOrchestrator] getAgentStatus error:', err);
      return null;
    }
  }, []);

  // === PAUSE AGENT ===
  const pauseAgent = useCallback(async (agentId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'pause_agent',
            agentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAgents(prev => prev.map(a => 
          a.id === agentId ? { ...a, status: 'paused' as const } : a
        ));
        toast.success('Agente pausado');
        return fnData.result;
      }

      return null;
    } catch (err) {
      console.error('[useAgentOrchestrator] pauseAgent error:', err);
      toast.error('Error al pausar agente');
      return null;
    }
  }, []);

  // === RESUME AGENT ===
  const resumeAgent = useCallback(async (agentId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'resume_agent',
            agentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAgents(prev => prev.map(a => 
          a.id === agentId ? { ...a, status: 'active' as const } : a
        ));
        toast.success('Agente reanudado');
        return fnData.result;
      }

      return null;
    } catch (err) {
      console.error('[useAgentOrchestrator] resumeAgent error:', err);
      toast.error('Error al reanudar agente');
      return null;
    }
  }, []);

  // === GET EXECUTION HISTORY ===
  const getExecutionHistory = useCallback(async (agentId: string): Promise<ExecutionHistory | null> => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'ai-agent-orchestrator',
        {
          body: {
            action: 'get_execution_history',
            agentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.history) {
        return fnData.history as ExecutionHistory;
      }

      return null;
    } catch (err) {
      console.error('[useAgentOrchestrator] getExecutionHistory error:', err);
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    listAgents();
    autoRefreshInterval.current = setInterval(() => {
      listAgents();
    }, intervalMs);
  }, [listAgents]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    isLoading,
    agents,
    activeAgent,
    currentPlan,
    collaborations,
    error,
    lastRefresh,
    isCreatingAgent,
    isExecutingGoal,
    isCollaborating,
    
    // Funciones de agente
    createAgent,
    listAgents,
    getAgentStatus,
    pauseAgent,
    resumeAgent,
    setActiveAgent,
    
    // Funciones de ejecución
    executeGoal,
    startCollaboration,
    getExecutionHistory,
    
    // Funciones de memoria
    getAgentMemory,
    updateAgentMemory,
    
    // Utilidades
    startAutoRefresh,
    stopAutoRefresh,
    clearError,
  };
}

export default useAgentOrchestrator;
