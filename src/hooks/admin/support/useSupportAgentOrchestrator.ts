import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// === INTERFACES ===
export interface SpecializedAgent {
  id: string;
  agent_key: string;
  agent_name: string;
  agent_type: 'diagnostic' | 'resolution' | 'documentation' | 'escalation' | 'triage' | 'specialist';
  description: string | null;
  capabilities: string[];
  confidence_threshold: number;
  max_autonomous_actions: number;
  requires_approval_above: number;
  is_active: boolean;
  execution_priority: number;
}

export interface OrchestrationSession {
  id: string;
  support_session_id: string | null;
  initiated_by: string | null;
  status: 'active' | 'completed' | 'escalated' | 'failed' | 'paused';
  orchestration_mode: 'sequential' | 'parallel' | 'collaborative' | 'competitive';
  active_agents: string[];
  context_data: Record<string, unknown>;
  resolution_summary: Record<string, unknown> | null;
  total_actions_taken: number;
  auto_resolved: boolean;
  resolution_time_ms: number | null;
  escalated_to: string | null;
  escalation_reason: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface AgentTask {
  id: string;
  orchestration_session_id: string;
  agent_key: string;
  task_type: string;
  task_description: string | null;
  input_context: Record<string, unknown> | null;
  output_result: Record<string, unknown> | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'awaiting_approval';
  confidence_score: number | null;
  execution_time_ms: number | null;
  tokens_used: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface OrchestrationContext {
  sessionId?: string;
  problemDescription: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  customerData?: Record<string, unknown>;
  systemMetrics?: Record<string, unknown>;
  previousAttempts?: string[];
}

export interface OrchestrationResult {
  sessionId: string;
  status: string;
  tasksExecuted: AgentTask[];
  resolution?: {
    resolved: boolean;
    summary: string;
    actionsApplied: string[];
    documentation?: string;
  };
  escalation?: {
    needed: boolean;
    reason: string;
    suggestedTeam: string;
  };
  metrics: {
    totalTime: number;
    tokensUsed: number;
    confidenceAvg: number;
  };
}

// === HOOK ===
export function useSupportAgentOrchestrator() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<SpecializedAgent[]>([]);
  const [sessions, setSessions] = useState<OrchestrationSession[]>([]);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH AGENTS ===
  const fetchAgents = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('support_specialized_agents')
        .select('*')
        .eq('is_active', true)
        .order('execution_priority', { ascending: true });

      if (fetchError) throw fetchError;

      const mapped = (data || []).map(agent => ({
        ...agent,
        capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : []
      })) as SpecializedAgent[];

      setAgents(mapped);
      return mapped;
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] fetchAgents error:', err);
      return [];
    }
  }, []);

  // === FETCH SESSIONS ===
  const fetchSessions = useCallback(async (limit = 20) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('support_orchestration_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setSessions((data || []) as OrchestrationSession[]);
      setLastRefresh(new Date());
      return data as OrchestrationSession[];
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] fetchSessions error:', err);
      return [];
    }
  }, []);

  // === FETCH TASKS FOR SESSION ===
  const fetchSessionTasks = useCallback(async (sessionId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('support_agent_tasks')
        .select('*')
        .eq('orchestration_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setActiveTasks((data || []) as AgentTask[]);
      return data as AgentTask[];
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] fetchSessionTasks error:', err);
      return [];
    }
  }, []);

  // === START ORCHESTRATION ===
  const startOrchestration = useCallback(async (
    context: OrchestrationContext,
    mode: 'sequential' | 'parallel' | 'collaborative' = 'collaborative'
  ): Promise<OrchestrationResult | null> => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    setIsOrchestrating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-agent-orchestrator', {
        body: {
          action: 'start_orchestration',
          context,
          mode,
          userId: user.id
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Orquestación iniciada');
        await fetchSessions();
        return data.data as OrchestrationResult;
      }

      throw new Error(data?.error || 'Error starting orchestration');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(message);
      console.error('[useSupportAgentOrchestrator] startOrchestration error:', err);
      return null;
    } finally {
      setIsOrchestrating(false);
    }
  }, [user, fetchSessions]);

  // === EXECUTE SINGLE AGENT ===
  const executeAgent = useCallback(async (
    agentKey: string,
    context: Record<string, unknown>,
    sessionId?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-agent-orchestrator', {
        body: {
          action: 'execute_agent',
          agentKey,
          context,
          sessionId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        if (sessionId) await fetchSessionTasks(sessionId);
        return data.data;
      }

      throw new Error(data?.error || 'Agent execution failed');
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] executeAgent error:', err);
      toast.error('Error ejecutando agente');
      return null;
    }
  }, [fetchSessionTasks]);

  // === APPROVE TASK ===
  const approveTask = useCallback(async (taskId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('support_agent_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (updateError) throw updateError;

      toast.success('Tarea aprobada');
      setActiveTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'completed' } : t
      ));
      return true;
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] approveTask error:', err);
      toast.error('Error aprobando tarea');
      return false;
    }
  }, []);

  // === REJECT TASK ===
  const rejectTask = useCallback(async (taskId: string, reason: string) => {
    try {
      const { error: updateError } = await supabase
        .from('support_agent_tasks')
        .update({ 
          status: 'failed',
          error_message: reason
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      toast.success('Tarea rechazada');
      setActiveTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'failed', error_message: reason } : t
      ));
      return true;
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] rejectTask error:', err);
      toast.error('Error rechazando tarea');
      return false;
    }
  }, []);

  // === ESCALATE SESSION ===
  const escalateSession = useCallback(async (sessionId: string, reason: string, escalateTo?: string) => {
    try {
      const { error: updateError } = await supabase
        .from('support_orchestration_sessions')
        .update({
          status: 'escalated',
          escalation_reason: reason,
          escalated_to: escalateTo || null,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      toast.success('Sesión escalada');
      await fetchSessions();
      return true;
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] escalateSession error:', err);
      toast.error('Error escalando sesión');
      return false;
    }
  }, [fetchSessions]);

  // === COMPLETE SESSION ===
  const completeSession = useCallback(async (sessionId: string, resolution: Record<string, unknown>) => {
    try {
      const { error: updateError } = await supabase
        .from('support_orchestration_sessions')
        .update({
          status: 'completed',
          resolution_summary: resolution as unknown,
          auto_resolved: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      toast.success('Sesión completada');
      await fetchSessions();
      return true;
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] completeSession error:', err);
      toast.error('Error completando sesión');
      return false;
    }
  }, [fetchSessions]);

  // === GET AGENT RECOMMENDATIONS ===
  const getAgentRecommendations = useCallback(async (problemDescription: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-agent-orchestrator', {
        body: {
          action: 'get_recommendations',
          problemDescription
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('[useSupportAgentOrchestrator] getAgentRecommendations error:', err);
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchAgents();
    fetchSessions();
    
    autoRefreshInterval.current = setInterval(() => {
      fetchSessions();
    }, intervalMs);
  }, [fetchAgents, fetchSessions]);

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

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchAgents();
    fetchSessions();
  }, [fetchAgents, fetchSessions]);

  return {
    // State
    agents,
    sessions,
    activeTasks,
    isLoading,
    isOrchestrating,
    error,
    lastRefresh,
    // Actions
    fetchAgents,
    fetchSessions,
    fetchSessionTasks,
    startOrchestration,
    executeAgent,
    approveTask,
    rejectTask,
    escalateSession,
    completeSession,
    getAgentRecommendations,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useSupportAgentOrchestrator;
