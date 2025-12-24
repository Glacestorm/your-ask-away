/**
 * AI Agents Hook
 * Provides autonomous AI agent capabilities for task execution
 * Implements ReAct (Reasoning + Acting) pattern for banking CRM operations
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === ERROR TIPADO KB ===
export interface AIAgentsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Agent Types
export type AgentRole = 
  | 'analyst'      // Financial analysis, data interpretation
  | 'assistant'    // General help, Q&A
  | 'monitor'      // System monitoring, alerts
  | 'planner'      // Action planning, scheduling
  | 'researcher';  // Data gathering, market research

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

interface UseAIAgentsReturn {
  agents: AIAgent[];
  activeAgent: AIAgent | null;
  isProcessing: boolean;
  
  // Agent management
  createAgent: (name: string, role: AgentRole) => AIAgent;
  removeAgent: (agentId: string) => void;
  
  // Task management
  assignTask: (agentId: string, task: Omit<AgentTask, 'id' | 'createdAt'>) => Promise<void>;
  cancelTask: (agentId: string) => void;
  
  // Agent execution
  executeAgentStep: (agentId: string) => Promise<void>;
  runAgentLoop: (agentId: string, maxSteps?: number) => Promise<void>;
  
  // Utilities
  getAgentStatus: (agentId: string) => AgentStatus | null;
  getAgentThoughts: (agentId: string) => AgentThought[];
  clearAgentMemory: (agentId: string) => void;
  
  // === KB ADDITIONS ===
  error: AIAgentsError | null;
  lastRefresh: Date | null;
  clearError: () => void;
}

// Available tools for agents
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

export function useAIAgents(): UseAIAgentsReturn {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  // === ESTADO KB ===
  const [error, setError] = useState<AIAgentsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const generateId = () => crypto.randomUUID();

  const createAgent = useCallback((name: string, role: AgentRole): AIAgent => {
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
    status: AgentAction['status'],
    result?: unknown
  ) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        actions: agent.actions.map(action => 
          action.id === actionId 
            ? { ...action, status, result } 
            : action
        ),
      };
    }));
  }, []);

  const setAgentStatus = useCallback((agentId: string, status: AgentStatus) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, status } : agent
    ));
  }, []);

  const assignTask = useCallback(async (
    agentId: string, 
    taskData: Omit<AgentTask, 'id' | 'createdAt'>
  ) => {
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
  }, [agents, addThought]);

  const cancelTask = useCallback((agentId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !agent.currentTask) return;

    setAgentStatus(agentId, 'thinking');
    
    // ReAct: Reasoning step
    addThought(
      agentId, 
      `Analyzing task "${agent.currentTask.type}" with priority ${agent.currentTask.priority}`, 
      'reasoning'
    );

    // Simulate AI reasoning (in production, call actual AI model)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determine action based on task type
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

    // ReAct: Action step
    setAgentStatus(agentId, 'acting');
    const action = addAction(agentId, actionName, actionParams);

    try {
      updateActionStatus(agentId, action.id, 'executing');
      
      // Execute action (simplified - in production, call actual functions)
      let result: unknown;
      
      if (actionName === 'query_companies') {
        const { data } = await supabase
          .from('companies')
          .select('id, name, sector, parroquia')
          .limit(actionParams.limit as number || 10);
        result = data;
      } else {
        // Simulate other actions
        await new Promise(resolve => setTimeout(resolve, 300));
        result = { success: true, action: actionName };
      }

      updateActionStatus(agentId, action.id, 'completed', result);
      addThought(agentId, `Action completed successfully: ${JSON.stringify(result).slice(0, 100)}...`, 'observation');

    } catch (error) {
      updateActionStatus(agentId, action.id, 'failed', error);
      addThought(agentId, `Action failed: ${error}`, 'observation');
    }

    // ReAct: Reflection step
    addThought(agentId, 'Task step completed. Evaluating if more steps needed.', 'reflection');
    
    setAgentStatus(agentId, 'completed');
  }, [agents, addThought, addAction, updateActionStatus, setAgentStatus]);

  const runAgentLoop = useCallback(async (agentId: string, maxSteps = 5) => {
    abortControllerRef.current = new AbortController();
    setIsProcessing(true);

    try {
      for (let step = 0; step < maxSteps; step++) {
        if (abortControllerRef.current.signal.aborted) break;
        
        const agent = agents.find(a => a.id === agentId);
        if (!agent?.currentTask) break;

        await executeAgentStep(agentId);
        
        // Check if task is complete
        const updatedAgent = agents.find(a => a.id === agentId);
        if (updatedAgent?.status === 'completed') break;

        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 200));
      }
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

  return {
    agents,
    activeAgent,
    isProcessing,
    createAgent,
    removeAgent,
    assignTask,
    cancelTask,
    executeAgentStep,
    runAgentLoop,
    getAgentStatus,
    getAgentThoughts,
    clearAgentMemory,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

// Export agent tools for external reference
export { AGENT_TOOLS };
