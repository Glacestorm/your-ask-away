/**
 * useModuleAutonomousAgent - Phase 3: Autonomous Module Agent
 * Hook para agente IA autónomo que gestiona módulos automáticamente
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ModuleHealthStatus {
  moduleKey: string;
  moduleName: string;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  issues: HealthIssue[];
  lastChecked: string;
  recommendations: string[];
}

export interface HealthIssue {
  id: string;
  type: 'dependency' | 'compatibility' | 'performance' | 'security' | 'config';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  autoFixable: boolean;
  suggestedFix?: string;
}

export interface PropagationPlan {
  id: string;
  sourceModule: string;
  changeDescription: string;
  affectedModules: AffectedModule[];
  totalRisk: 'low' | 'medium' | 'high';
  estimatedImpact: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  createdAt: string;
}

export interface AffectedModule {
  moduleKey: string;
  moduleName: string;
  changeType: 'update' | 'patch' | 'reconfigure' | 'notify';
  risk: 'low' | 'medium' | 'high';
  changes: ModuleChange[];
  requiresApproval: boolean;
}

export interface ModuleChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}

export interface AgentExecution {
  id: string;
  action: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface SelfHealingAction {
  id: string;
  moduleKey: string;
  issue: HealthIssue;
  proposedFix: string;
  status: 'pending' | 'approved' | 'applied' | 'rejected';
  appliedAt?: string;
  result?: string;
}

export interface ModuleAgentContext {
  moduleKey: string;
  moduleName: string;
  currentState: Record<string, unknown>;
  dependencies: string[];
  dependents: string[];
}

// === HOOK ===
export function useModuleAutonomousAgent() {
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [healthStatuses, setHealthStatuses] = useState<ModuleHealthStatus[]>([]);
  const [propagationPlans, setPropagationPlans] = useState<PropagationPlan[]>([]);
  const [selfHealingActions, setSelfHealingActions] = useState<SelfHealingAction[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [agentActive, setAgentActive] = useState(true);
  
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // === HEALTH CHECK ===
  const checkModuleHealth = useCallback(async (context: ModuleAgentContext): Promise<ModuleHealthStatus | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('module-autonomous-agent', {
        body: {
          action: 'check_health',
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.health) {
        const health = data.health as ModuleHealthStatus;
        setHealthStatuses(prev => {
          const filtered = prev.filter(h => h.moduleKey !== context.moduleKey);
          return [...filtered, health];
        });
        return health;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error checking health';
      setError(message);
      console.error('[useModuleAutonomousAgent] checkModuleHealth error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === PROPAGATE CHANGES ===
  const analyzeChangePropagation = useCallback(async (
    context: ModuleAgentContext,
    proposedChanges: Record<string, unknown>
  ): Promise<PropagationPlan | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('module-autonomous-agent', {
        body: {
          action: 'analyze_propagation',
          context,
          proposedChanges
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.plan) {
        const plan = data.plan as PropagationPlan;
        setPropagationPlans(prev => [plan, ...prev]);
        return plan;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing propagation';
      setError(message);
      console.error('[useModuleAutonomousAgent] analyzeChangePropagation error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === EXECUTE PROPAGATION ===
  const executePropagation = useCallback(async (planId: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    const execution: AgentExecution = {
      id: crypto.randomUUID(),
      action: 'propagate_changes',
      status: 'running',
      startedAt: new Date().toISOString()
    };
    setExecutions(prev => [execution, ...prev]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('module-autonomous-agent', {
        body: {
          action: 'execute_propagation',
          planId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setPropagationPlans(prev => 
          prev.map(p => p.id === planId ? { ...p, status: 'completed' } : p)
        );
        setExecutions(prev => 
          prev.map(e => e.id === execution.id ? {
            ...e,
            status: 'completed',
            completedAt: new Date().toISOString(),
            result: data.result
          } : e)
        );
        toast.success('Cambios propagados correctamente');
        return true;
      }

      throw new Error(data?.error || 'Propagation failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error executing propagation';
      setError(message);
      setPropagationPlans(prev => 
        prev.map(p => p.id === planId ? { ...p, status: 'failed' } : p)
      );
      setExecutions(prev => 
        prev.map(e => e.id === execution.id ? {
          ...e,
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: message
        } : e)
      );
      toast.error(message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === AUTO-FIX ISSUES ===
  const autoFixIssue = useCallback(async (
    context: ModuleAgentContext,
    issue: HealthIssue
  ): Promise<SelfHealingAction | null> => {
    if (!issue.autoFixable) {
      toast.error('Este problema no es auto-reparable');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('module-autonomous-agent', {
        body: {
          action: 'auto_fix',
          context,
          issue
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.healingAction) {
        const action = data.healingAction as SelfHealingAction;
        setSelfHealingActions(prev => [action, ...prev]);
        toast.success('Auto-reparación propuesta');
        return action;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error in auto-fix';
      setError(message);
      console.error('[useModuleAutonomousAgent] autoFixIssue error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === APPLY SELF-HEALING ===
  const applySelfHealing = useCallback(async (actionId: string): Promise<boolean> => {
    setIsProcessing(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('module-autonomous-agent', {
        body: {
          action: 'apply_healing',
          actionId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setSelfHealingActions(prev => 
          prev.map(a => a.id === actionId ? {
            ...a,
            status: 'applied',
            appliedAt: new Date().toISOString(),
            result: data.result
          } : a)
        );
        toast.success('Auto-reparación aplicada');
        return true;
      }

      throw new Error(data?.error || 'Healing failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error applying healing';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === SMART ROLLBACK ===
  const smartRollback = useCallback(async (
    context: ModuleAgentContext,
    targetVersion?: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    const execution: AgentExecution = {
      id: crypto.randomUUID(),
      action: 'smart_rollback',
      status: 'running',
      startedAt: new Date().toISOString()
    };
    setExecutions(prev => [execution, ...prev]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('module-autonomous-agent', {
        body: {
          action: 'smart_rollback',
          context,
          targetVersion
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setExecutions(prev => 
          prev.map(e => e.id === execution.id ? {
            ...e,
            status: 'completed',
            completedAt: new Date().toISOString(),
            result: data.result
          } : e)
        );
        toast.success('Rollback inteligente completado');
        return true;
      }

      throw new Error(data?.error || 'Rollback failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error in rollback';
      setError(message);
      setExecutions(prev => 
        prev.map(e => e.id === execution.id ? {
          ...e,
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: message
        } : e)
      );
      toast.error(message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === RESOLVE CONFLICTS ===
  const resolveConflicts = useCallback(async (
    context: ModuleAgentContext,
    conflictingModules: string[]
  ): Promise<PropagationPlan | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('module-autonomous-agent', {
        body: {
          action: 'resolve_conflicts',
          context,
          conflictingModules
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.resolutionPlan) {
        const plan = data.resolutionPlan as PropagationPlan;
        setPropagationPlans(prev => [plan, ...prev]);
        toast.success('Plan de resolución generado');
        return plan;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error resolving conflicts';
      setError(message);
      console.error('[useModuleAutonomousAgent] resolveConflicts error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === CONTINUOUS MONITORING ===
  const startMonitoring = useCallback((contexts: ModuleAgentContext[], intervalMs = 60000) => {
    stopMonitoring();
    
    // Initial check
    contexts.forEach(ctx => checkModuleHealth(ctx));
    
    monitoringInterval.current = setInterval(() => {
      if (agentActive) {
        contexts.forEach(ctx => checkModuleHealth(ctx));
      }
    }, intervalMs);
  }, [checkModuleHealth, agentActive]);

  const stopMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, []);

  // === APPROVE/REJECT PLAN ===
  const approvePlan = useCallback((planId: string) => {
    setPropagationPlans(prev => 
      prev.map(p => p.id === planId ? { ...p, status: 'approved' } : p)
    );
  }, []);

  const rejectPlan = useCallback((planId: string) => {
    setPropagationPlans(prev => prev.filter(p => p.id !== planId));
    toast.info('Plan rechazado');
  }, []);

  // === HELPERS ===
  const getHealthColor = useCallback((status: ModuleHealthStatus['status']): string => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  }, []);

  const getRiskColor = useCallback((risk: 'low' | 'medium' | 'high'): string => {
    switch (risk) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  return {
    // State
    isProcessing,
    healthStatuses,
    propagationPlans,
    selfHealingActions,
    executions,
    error,
    agentActive,

    // Agent Control
    setAgentActive,
    startMonitoring,
    stopMonitoring,

    // Health
    checkModuleHealth,

    // Propagation
    analyzeChangePropagation,
    executePropagation,
    approvePlan,
    rejectPlan,

    // Self-Healing
    autoFixIssue,
    applySelfHealing,

    // Rollback & Conflicts
    smartRollback,
    resolveConflicts,

    // Helpers
    getHealthColor,
    getRiskColor,
  };
}

export default useModuleAutonomousAgent;
