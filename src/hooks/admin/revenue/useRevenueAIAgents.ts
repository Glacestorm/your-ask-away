/**
 * useRevenueAIAgents Hook
 * Fase 11 - Enterprise SaaS 2025-2026
 * Agentes IA autónomos para revenue operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface RevenueAgent {
  id: string;
  name: string;
  type: 'prospector' | 'qualifier' | 'nurture' | 'closer' | 'retention';
  status: 'active' | 'paused' | 'learning' | 'error';
  description: string;
  capabilities: string[];
  metrics: {
    actionsToday: number;
    successRate: number;
    revenueGenerated: number;
    leadsProcessed: number;
  };
  lastAction: string;
  configuration: Record<string, unknown>;
  createdAt: string;
}

export interface AgentAction {
  id: string;
  agentId: string;
  actionType: string;
  targetEntity: string;
  targetEntityId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  confidence: number;
  executedAt?: string;
  createdAt: string;
}

export interface AgentInsight {
  id: string;
  agentId: string;
  insightType: 'opportunity' | 'risk' | 'recommendation' | 'anomaly';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  suggestedAction?: string;
  createdAt: string;
}

export interface RevenueAgentsContext {
  organizationId?: string;
  agentTypes?: string[];
  dateRange?: { start: string; end: string };
}

// === HOOK ===
export function useRevenueAIAgents() {
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<RevenueAgent[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH AGENTS DATA ===
  const fetchAgentsData = useCallback(async (context?: RevenueAgentsContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'revenue-ai-agents',
        {
          body: {
            action: 'get_agents_dashboard',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAgents(fnData.data?.agents || []);
        setActions(fnData.data?.recentActions || []);
        setInsights(fnData.data?.insights || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from revenue AI agents');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useRevenueAIAgents] fetchAgentsData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === START AGENT ===
  const startAgent = useCallback(async (agentId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'revenue-ai-agents',
        {
          body: {
            action: 'start_agent',
            params: { agentId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, status: 'active' } : agent
        ));
        toast.success('Agente iniciado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRevenueAIAgents] startAgent error:', err);
      toast.error('Error al iniciar agente');
      return false;
    }
  }, []);

  // === PAUSE AGENT ===
  const pauseAgent = useCallback(async (agentId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'revenue-ai-agents',
        {
          body: {
            action: 'pause_agent',
            params: { agentId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, status: 'paused' } : agent
        ));
        toast.success('Agente pausado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRevenueAIAgents] pauseAgent error:', err);
      toast.error('Error al pausar agente');
      return false;
    }
  }, []);

  // === CONFIGURE AGENT ===
  const configureAgent = useCallback(async (
    agentId: string, 
    configuration: Record<string, unknown>
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'revenue-ai-agents',
        {
          body: {
            action: 'configure_agent',
            params: { agentId, configuration }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, configuration } : agent
        ));
        toast.success('Configuración actualizada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRevenueAIAgents] configureAgent error:', err);
      toast.error('Error al configurar agente');
      return false;
    }
  }, []);

  // === APPROVE ACTION ===
  const approveAction = useCallback(async (actionId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'revenue-ai-agents',
        {
          body: {
            action: 'approve_action',
            params: { actionId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setActions(prev => prev.map(action => 
          action.id === actionId ? { ...action, status: 'executing' } : action
        ));
        toast.success('Acción aprobada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRevenueAIAgents] approveAction error:', err);
      toast.error('Error al aprobar acción');
      return false;
    }
  }, []);

  // === REJECT ACTION ===
  const rejectAction = useCallback(async (actionId: string, reason?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'revenue-ai-agents',
        {
          body: {
            action: 'reject_action',
            params: { actionId, reason }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setActions(prev => prev.filter(action => action.id !== actionId));
        toast.success('Acción rechazada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRevenueAIAgents] rejectAction error:', err);
      toast.error('Error al rechazar acción');
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: RevenueAgentsContext, intervalMs = 45000) => {
    stopAutoRefresh();
    fetchAgentsData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchAgentsData(context);
    }, intervalMs);
  }, [fetchAgentsData]);

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

  return {
    isLoading,
    agents,
    actions,
    insights,
    error,
    lastRefresh,
    fetchAgentsData,
    startAgent,
    pauseAgent,
    configureAgent,
    approveAction,
    rejectAction,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useRevenueAIAgents;
