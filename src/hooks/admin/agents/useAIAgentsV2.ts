import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface AIAgent {
  id: string;
  name: string;
  type: 'deal_coaching' | 'churn_prevention' | 'revenue_optimization';
  status: 'active' | 'idle' | 'analyzing' | 'error';
  lastActivity: string;
  metrics: Record<string, number>;
  capabilities: string[];
}

export interface DealCoachingResult {
  dealAnalysis: {
    dealId: string;
    currentStage: string;
    winProbability: number;
    riskFactors: string[];
    opportunities: string[];
  };
  coaching: {
    repStrengths: string[];
    areasToImprove: string[];
    suggestedApproach: string;
    talkingPoints: string[];
  };
  nextActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    deadline: string;
    expectedImpact: string;
  }>;
  competitiveIntel: {
    competitors: string[];
    differentiators: string[];
    counterArguments: string[];
  };
}

export interface ChurnPreventionResult {
  churnAnalysis: {
    customerId: string;
    churnRisk: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    predictedChurnDate: string;
    valueAtRisk: number;
    lifetimeValue: number;
  };
  riskSignals: Array<{
    signal: string;
    severity: 'high' | 'medium' | 'low';
    detectedAt: string;
    trend: 'improving' | 'stable' | 'worsening';
  }>;
  retentionStrategy: {
    approach: string;
    interventions: Array<{
      type: string;
      action: string;
      timing: 'immediate' | 'scheduled';
      channel: string;
      message: string;
    }>;
    incentives: string[];
    escalationPath: string[];
  };
  healthScore: {
    overall: number;
    engagement: number;
    satisfaction: number;
    adoption: number;
    support: number;
  };
}

export interface RevenueOptimizationResult {
  revenueOpportunities: Array<{
    type: 'upsell' | 'cross-sell' | 'expansion' | 'renewal';
    customerId: string;
    currentMRR: number;
    potentialMRR: number;
    upliftPercentage: number;
    probability: number;
    product: string;
    reasoning: string;
  }>;
  pricingRecommendations: Array<{
    segment: string;
    currentPrice: number;
    recommendedPrice: number;
    elasticity: number;
    expectedImpact: string;
  }>;
  forecast: {
    currentMRR: number;
    projectedMRR: number;
    growthRate: number;
    confidenceLevel: number;
    assumptions: string[];
  };
  actionPlan: Array<{
    priority: number;
    action: string;
    target: string;
    expectedRevenue: number;
    timeline: string;
  }>;
}

export interface OrchestrationResult {
  orchestrationPlan: {
    objective: string;
    agents: Array<{
      agentId: string;
      agentType: string;
      task: string;
      priority: number;
      dependencies: string[];
      estimatedDuration: string;
    }>;
    workflow: Array<{
      step: number;
      agentId: string;
      action: string;
      inputs: string[];
      outputs: string[];
    }>;
  };
  resourceAllocation: {
    totalCapacity: number;
    allocated: Record<string, number>;
    available: number;
  };
  metrics: {
    activeAgents: number;
    pendingTasks: number;
    completedToday: number;
    successRate: number;
    avgResponseTime: string;
  };
  recommendations: Array<{
    type: 'optimization' | 'scaling' | 'rebalancing';
    description: string;
    impact: string;
  }>;
}

export interface AgentContext {
  deal?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  customers?: Array<Record<string, unknown>>;
  objective?: string;
  [key: string]: unknown;
}

// === HOOK ===
export function useAIAgentsV2() {
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [orchestratorStatus, setOrchestratorStatus] = useState<{
    status: string;
    activeWorkflows: number;
    queuedTasks: number;
    completedToday: number;
    resourceUtilization: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH AGENTS STATUS ===
  const fetchAgentsStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-agents-v2', {
        body: { action: 'get_agents_status' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setAgents(data.data.agents);
        setOrchestratorStatus(data.data.orchestrator);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAIAgentsV2] fetchAgentsStatus error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === DEAL COACHING ===
  const runDealCoaching = useCallback(async (context: AgentContext): Promise<DealCoachingResult | null> => {
    try {
      // Update agent status
      setAgents(prev => prev.map(a => 
        a.type === 'deal_coaching' ? { ...a, status: 'analyzing' as const } : a
      ));

      const { data, error: fnError } = await supabase.functions.invoke('ai-agents-v2', {
        body: { 
          action: 'deal_coaching',
          agentId: 'deal-coaching-agent',
          context 
        }
      });

      if (fnError) throw fnError;

      // Update agent status back
      setAgents(prev => prev.map(a => 
        a.type === 'deal_coaching' ? { ...a, status: 'active' as const, lastActivity: new Date().toISOString() } : a
      ));

      if (data?.success) {
        toast.success('Deal Coaching Agent', {
          description: `Análisis completado. Probabilidad de cierre: ${data.data.dealAnalysis?.winProbability || 0}%`
        });
        return data.data as DealCoachingResult;
      }

      return null;
    } catch (err) {
      setAgents(prev => prev.map(a => 
        a.type === 'deal_coaching' ? { ...a, status: 'error' as const } : a
      ));
      console.error('[useAIAgentsV2] runDealCoaching error:', err);
      toast.error('Error en Deal Coaching Agent');
      return null;
    }
  }, []);

  // === CHURN PREVENTION ===
  const runChurnPrevention = useCallback(async (context: AgentContext): Promise<ChurnPreventionResult | null> => {
    try {
      setAgents(prev => prev.map(a => 
        a.type === 'churn_prevention' ? { ...a, status: 'analyzing' as const } : a
      ));

      const { data, error: fnError } = await supabase.functions.invoke('ai-agents-v2', {
        body: { 
          action: 'churn_prevention',
          agentId: 'churn-prevention-agent',
          context 
        }
      });

      if (fnError) throw fnError;

      setAgents(prev => prev.map(a => 
        a.type === 'churn_prevention' ? { ...a, status: 'active' as const, lastActivity: new Date().toISOString() } : a
      ));

      if (data?.success) {
        const riskLevel = data.data.churnAnalysis?.riskLevel || 'unknown';
        toast.success('Churn Prevention Agent', {
          description: `Análisis completado. Nivel de riesgo: ${riskLevel.toUpperCase()}`
        });
        return data.data as ChurnPreventionResult;
      }

      return null;
    } catch (err) {
      setAgents(prev => prev.map(a => 
        a.type === 'churn_prevention' ? { ...a, status: 'error' as const } : a
      ));
      console.error('[useAIAgentsV2] runChurnPrevention error:', err);
      toast.error('Error en Churn Prevention Agent');
      return null;
    }
  }, []);

  // === REVENUE OPTIMIZATION ===
  const runRevenueOptimization = useCallback(async (context: AgentContext): Promise<RevenueOptimizationResult | null> => {
    try {
      setAgents(prev => prev.map(a => 
        a.type === 'revenue_optimization' ? { ...a, status: 'analyzing' as const } : a
      ));

      const { data, error: fnError } = await supabase.functions.invoke('ai-agents-v2', {
        body: { 
          action: 'revenue_optimization',
          agentId: 'revenue-optimization-agent',
          context 
        }
      });

      if (fnError) throw fnError;

      setAgents(prev => prev.map(a => 
        a.type === 'revenue_optimization' ? { ...a, status: 'active' as const, lastActivity: new Date().toISOString() } : a
      ));

      if (data?.success) {
        const opportunities = data.data.revenueOpportunities?.length || 0;
        toast.success('Revenue Optimization Agent', {
          description: `${opportunities} oportunidades de revenue identificadas`
        });
        return data.data as RevenueOptimizationResult;
      }

      return null;
    } catch (err) {
      setAgents(prev => prev.map(a => 
        a.type === 'revenue_optimization' ? { ...a, status: 'error' as const } : a
      ));
      console.error('[useAIAgentsV2] runRevenueOptimization error:', err);
      toast.error('Error en Revenue Optimization Agent');
      return null;
    }
  }, []);

  // === ORCHESTRATE ===
  const orchestrateAgents = useCallback(async (context: AgentContext): Promise<OrchestrationResult | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-agents-v2', {
        body: { 
          action: 'orchestrate',
          context 
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Agent Orchestrator', {
          description: 'Plan de orquestación generado'
        });
        return data.data as OrchestrationResult;
      }

      return null;
    } catch (err) {
      console.error('[useAIAgentsV2] orchestrateAgents error:', err);
      toast.error('Error en Agent Orchestrator');
      return null;
    }
  }, []);

  // === EXECUTE AGENT ACTION ===
  const executeAgentAction = useCallback(async (
    agentId: string, 
    actionType: string,
    params?: Record<string, unknown>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-agents-v2', {
        body: { 
          action: 'execute_agent_action',
          agentId,
          params: { actionType, ...params }
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Acción ejecutada', {
          description: data.data.result?.message || 'Completado'
        });
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useAIAgentsV2] executeAgentAction error:', err);
      toast.error('Error al ejecutar acción');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchAgentsStatus();
    autoRefreshInterval.current = setInterval(() => {
      fetchAgentsStatus();
    }, intervalMs);
  }, [fetchAgentsStatus]);

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
    // Estado
    isLoading,
    agents,
    orchestratorStatus,
    error,
    lastRefresh,
    // Acciones
    fetchAgentsStatus,
    runDealCoaching,
    runChurnPrevention,
    runRevenueOptimization,
    orchestrateAgents,
    executeAgentAction,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useAIAgentsV2;
