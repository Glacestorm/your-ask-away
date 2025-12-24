/**
 * useAIAgents - KB 2.0 Migration
 * Enterprise-grade AI agents with state machine, retry, and telemetry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  KBStatus, 
  KBError, 
  createKBError, 
  parseError, 
  collectTelemetry 
} from './core';

// === TIPOS KB 2.0 ===
export type AgentRole = 
  | 'analyst'
  | 'assistant'
  | 'monitor'
  | 'planner'
  | 'researcher';

export type AgentStatus = 'idle' | 'thinking' | 'acting' | 'completed' | 'error';

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  parameters: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentThought {
  id: string;
  content: string;
  timestamp: Date;
  type: 'reasoning' | 'observation' | 'action' | 'reflection';
}

export interface AgentAction {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
}

export interface AgentMemory {
  shortTerm: AgentThought[];
  workingContext: Record<string, unknown>;
  taskHistory: AgentTask[];
}

export interface AIAgent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  currentTask: AgentTask | null;
  thoughts: AgentThought[];
  actions: AgentAction[];
  memory: AgentMemory;
}

// === AGENT TOOLS ===
const AGENT_TOOLS = {
  queryCompanies: {
    name: 'query_companies',
    description: 'Query company data from the database',
    parameters: ['filters', 'limit', 'orderBy'],
  },
  analyzeFinancials: {
    name: 'analyze_financials',
    description: 'Perform financial analysis on company data',
    parameters: ['companyId', 'metrics', 'period'],
  },
  checkCompliance: {
    name: 'check_compliance',
    description: 'Check regulatory compliance status',
    parameters: ['companyId', 'regulations'],
  },
  generateReport: {
    name: 'generate_report',
    description: 'Generate analysis report',
    parameters: ['type', 'data', 'format'],
  },
  scheduleVisit: {
    name: 'schedule_visit',
    description: 'Schedule a client visit',
    parameters: ['companyId', 'date', 'purpose'],
  },
  sendNotification: {
    name: 'send_notification',
    description: 'Send notification to users',
    parameters: ['userId', 'message', 'priority'],
  },
};

// === HOOK KB 2.0 ===
export function useAIAgents() {
  // State
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const canRetry = error?.retryable === true && retryCount < 3;

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setAgents([]);
    setActiveAgent(null);
    setIsProcessing(false);
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
  }, []);

  // Helper functions
  const generateId = () => crypto.randomUUID();

  const createAgent = useCallback((name: string, role: AgentRole): AIAgent => {
    const startTime = new Date();
    
    const newAgent: AIAgent = {
      id: generateId(),
      name,
      role,
      status: 'idle',
      currentTask: null,
      thoughts: [],
      actions: [],
      memory: {
        shortTerm: [],
        workingContext: {},
        taskHistory: [],
      },
    };

    setAgents(prev => [...prev, newAgent]);
    setLastRefresh(new Date());

    collectTelemetry({
      hookName: 'useAIAgents',
      operationName: 'createAgent',
      startTime,
      endTime: new Date(),
      durationMs: Date.now() - startTime.getTime(),
      status: 'success',
      retryCount: 0,
      metadata: { agentRole: role },
    });

    return newAgent;
  }, []);

  const removeAgent = useCallback((agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
    if (activeAgent?.id === agentId) {
      setActiveAgent(null);
    }
  }, [activeAgent]);

  const addThought = useCallback((
    agentId: string, 
    content: string, 
    type: AgentThought['type']
  ) => {
    const thought: AgentThought = {
      id: generateId(),
      content,
      timestamp: new Date(),
      type,
    };

    setAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        thoughts: [...agent.thoughts, thought],
        memory: {
          ...agent.memory,
          shortTerm: [...agent.memory.shortTerm.slice(-9), thought],
        },
      };
    }));
  }, []);

  const addAction = useCallback((
    agentId: string, 
    name: string, 
    parameters: Record<string, unknown>
  ): AgentAction => {
    const action: AgentAction = {
      id: generateId(),
      name,
      parameters,
      status: 'pending',
      timestamp: new Date(),
    };

    setAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        actions: [...agent.actions, action],
      };
    }));

    return action;
  }, []);

  const updateActionStatus = useCallback((
    agentId: string, 
    actionId: string, 
    actionStatus: AgentAction['status'],
    result?: unknown
  ) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        actions: agent.actions.map(action => 
          action.id === actionId 
            ? { ...action, status: actionStatus, result } 
            : action
        ),
      };
    }));
  }, []);

  const setAgentStatus = useCallback((agentId: string, agentStatus: AgentStatus) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, status: agentStatus } : agent
    ));
  }, []);

  const assignTask = useCallback(async (
    agentId: string, 
    taskData: Omit<AgentTask, 'id' | 'createdAt'>
  ) => {
    const startTime = new Date();
    setStatus('loading');

    try {
      const task: AgentTask = {
        ...taskData,
        id: generateId(),
        createdAt: new Date(),
      };

      setAgents(prev => prev.map(agent => {
        if (agent.id !== agentId) return agent;
        return {
          ...agent,
          currentTask: task,
          status: 'thinking' as AgentStatus,
          memory: {
            ...agent.memory,
            workingContext: {
              ...agent.memory.workingContext,
              currentTask: task,
            },
          },
        };
      }));

      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        setActiveAgent({ ...agent, currentTask: task, status: 'thinking' });
      }

      addThought(agentId, `Received task: ${task.description}`, 'observation');
      setStatus('success');
      setLastSuccess(new Date());

      collectTelemetry({
        hookName: 'useAIAgents',
        operationName: 'assignTask',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0,
      });

    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);
      setStatus('error');

      collectTelemetry({
        hookName: 'useAIAgents',
        operationName: 'assignTask',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: parsed,
        retryCount,
      });
    }
  }, [agents, addThought, retryCount]);

  const cancelTask = useCallback((agentId: string) => {
    abortControllerRef.current?.abort();

    setAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      const completedTask = agent.currentTask 
        ? { ...agent.currentTask, completedAt: new Date() }
        : null;
      return {
        ...agent,
        currentTask: null,
        status: 'idle' as AgentStatus,
        memory: {
          ...agent.memory,
          taskHistory: completedTask 
            ? [...agent.memory.taskHistory, completedTask]
            : agent.memory.taskHistory,
        },
      };
    }));
  }, []);

  const executeAgentStep = useCallback(async (agentId: string) => {
    const startTime = new Date();
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !agent.currentTask) return;

    setAgentStatus(agentId, 'thinking');
    
    addThought(
      agentId, 
      `Analyzing task "${agent.currentTask.type}" with priority ${agent.currentTask.priority}`, 
      'reasoning'
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    let actionName = 'query_companies';
    let actionParams: Record<string, unknown> = {};

    switch (agent.currentTask.type) {
      case 'analyze':
        actionName = 'analyze_financials';
        actionParams = agent.currentTask.parameters;
        break;
      case 'compliance':
        actionName = 'check_compliance';
        actionParams = agent.currentTask.parameters;
        break;
      case 'report':
        actionName = 'generate_report';
        actionParams = agent.currentTask.parameters;
        break;
      case 'schedule':
        actionName = 'schedule_visit';
        actionParams = agent.currentTask.parameters;
        break;
      default:
        actionParams = { ...agent.currentTask.parameters, limit: 10 };
    }

    addThought(agentId, `Decided to execute: ${actionName}`, 'reasoning');

    setAgentStatus(agentId, 'acting');
    const action = addAction(agentId, actionName, actionParams);

    try {
      updateActionStatus(agentId, action.id, 'executing');
      
      let result: unknown;
      
      if (actionName === 'query_companies') {
        const { data } = await supabase
          .from('companies')
          .select('id, name, sector, parroquia')
          .limit(actionParams.limit as number || 10);
        result = data;
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
        result = { success: true, action: actionName };
      }

      updateActionStatus(agentId, action.id, 'completed', result);
      addThought(agentId, `Action completed successfully: ${JSON.stringify(result).slice(0, 100)}...`, 'observation');

      collectTelemetry({
        hookName: 'useAIAgents',
        operationName: 'executeAgentStep',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0,
      });

    } catch (err) {
      updateActionStatus(agentId, action.id, 'failed', err);
      addThought(agentId, `Action failed: ${err}`, 'observation');

      const parsed = parseError(err);
      collectTelemetry({
        hookName: 'useAIAgents',
        operationName: 'executeAgentStep',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: parsed,
        retryCount: 0,
      });
    }

    addThought(agentId, 'Task step completed. Evaluating if more steps needed.', 'reflection');
    setAgentStatus(agentId, 'completed');
  }, [agents, addThought, addAction, updateActionStatus, setAgentStatus]);

  const runAgentLoop = useCallback(async (agentId: string, maxSteps = 5) => {
    abortControllerRef.current = new AbortController();
    setIsProcessing(true);
    setStatus('loading');

    try {
      for (let step = 0; step < maxSteps; step++) {
        if (abortControllerRef.current.signal.aborted) break;
        
        const agent = agents.find(a => a.id === agentId);
        if (!agent?.currentTask) break;

        await executeAgentStep(agentId);
        
        const updatedAgent = agents.find(a => a.id === agentId);
        if (updatedAgent?.status === 'completed') break;

        await new Promise(resolve => setTimeout(resolve, 200));
      }
      setStatus('success');
      setLastSuccess(new Date());
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);
      setStatus('error');
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [agents, executeAgentStep]);

  const getAgentStatus = useCallback((agentId: string): AgentStatus | null => {
    return agents.find(a => a.id === agentId)?.status ?? null;
  }, [agents]);

  const getAgentThoughts = useCallback((agentId: string): AgentThought[] => {
    return agents.find(a => a.id === agentId)?.thoughts ?? [];
  }, [agents]);

  const clearAgentMemory = useCallback((agentId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        thoughts: [],
        actions: [],
        memory: {
          shortTerm: [],
          workingContext: {},
          taskHistory: agent.memory.taskHistory,
        },
      };
    }));
  }, []);

  // === RETURN KB 2.0 ===
  return {
    // Data
    agents,
    activeAgent,
    data: agents,
    
    // State Machine KB 2.0
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isProcessing,
    
    // Error Management KB 2.0
    error,
    clearError,
    
    // Retry Management
    retryCount,
    canRetry,
    
    // Request Control
    cancel,
    reset,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    
    // Agent Management
    createAgent,
    removeAgent,
    assignTask,
    cancelTask,
    executeAgentStep,
    runAgentLoop,
    getAgentStatus,
    getAgentThoughts,
    clearAgentMemory,
  };
}

export { AGENT_TOOLS };
export default useAIAgents;
