import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutonomousAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  description: string | null;
  is_active: boolean;
  execution_mode: string;
  confidence_threshold: number;
  max_actions_per_hour: number;
  capabilities: Record<string, unknown> | null;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  trigger_type: string;
  trigger_source: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  execution_time_ms: number | null;
  context_data: Record<string, unknown> | null;
  result_data: Record<string, unknown> | null;
  actions_taken: unknown[] | null;
  tokens_used: number | null;
  error_message: string | null;
  ai_autonomous_agents?: {
    agent_name: string;
    agent_type: string;
  };
}

export interface AgentAction {
  id: string;
  agent_id: string;
  execution_id: string | null;
  action_type: string;
  action_name: string;
  input_params: Record<string, unknown> | null;
  output_result: Record<string, unknown> | null;
  status: string;
  confidence_score: number | null;
  was_approved: boolean | null;
  approved_by: string | null;
  executed_at: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  ai_autonomous_agents?: {
    agent_name: string;
    agent_type: string;
  };
}

export interface AgentContext {
  metrics?: Record<string, unknown>;
  recentActivity?: unknown[];
  currentUser?: { id: string; role: string };
}

export function useAutonomousAgents() {
  const [agents, setAgents] = useState<AutonomousAgent[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('autonomous-agents', {
        body: { action: 'get_agents' }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setAgents(data.data || []);
        setLastRefresh(new Date());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching agents';
      setError(message);
      console.error('[useAutonomousAgents] fetchAgents error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchExecutions = useCallback(async (agentId?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('autonomous-agents', {
        body: { action: 'get_executions', agentId }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setExecutions(data.data || []);
      }
    } catch (err) {
      console.error('[useAutonomousAgents] fetchExecutions error:', err);
    }
  }, []);

  const fetchPendingActions = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('autonomous-agents', {
        body: { action: 'get_pending_actions' }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setPendingActions(data.data || []);
      }
    } catch (err) {
      console.error('[useAutonomousAgents] fetchPendingActions error:', err);
    }
  }, []);

  const executeAgent = useCallback(async (agentId: string, context: AgentContext) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('autonomous-agents', {
        body: { action: 'execute', agentId, context }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        toast.success('Agente ejecutado correctamente');
        await fetchExecutions(agentId);
        await fetchPendingActions();
        return data.data;
      }
      
      throw new Error(data?.error || 'Execution failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error executing agent';
      toast.error(message);
      console.error('[useAutonomousAgents] executeAgent error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchExecutions, fetchPendingActions]);

  const approveAction = useCallback(async (actionId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('autonomous-agents', {
        body: { action: 'approve_action', actionId }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        toast.success('Acción aprobada');
        await fetchPendingActions();
        return data.data;
      }
      
      throw new Error(data?.error || 'Approval failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error approving action';
      toast.error(message);
      return null;
    }
  }, [fetchPendingActions]);

  const configureAgent = useCallback(async (agentId: string, config: Partial<AutonomousAgent>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('autonomous-agents', {
        body: { action: 'configure', agentId, config }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        toast.success('Agente configurado');
        await fetchAgents();
        return data.data;
      }
      
      throw new Error(data?.error || 'Configuration failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error configuring agent';
      toast.error(message);
      return null;
    }
  }, [fetchAgents]);

  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchAgents();
    fetchExecutions();
    fetchPendingActions();
    
    autoRefreshInterval.current = setInterval(() => {
      fetchAgents();
      fetchExecutions();
      fetchPendingActions();
    }, intervalMs);
  }, [fetchAgents, fetchExecutions, fetchPendingActions]);

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
    agents,
    executions,
    pendingActions,
    isLoading,
    error,
    lastRefresh,
    fetchAgents,
    fetchExecutions,
    fetchPendingActions,
    executeAgent,
    approveAction,
    configureAgent,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useAutonomousAgents;
