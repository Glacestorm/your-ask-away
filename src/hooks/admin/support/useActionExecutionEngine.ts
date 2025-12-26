import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// === INTERFACES ===
export interface ExecutableAction {
  id: string;
  action_key: string;
  action_name: string;
  action_category: 'diagnostic' | 'remediation' | 'configuration' | 'communication' | 'documentation' | 'escalation';
  description: string | null;
  script_type: 'powershell' | 'bash' | 'python' | 'api_call' | 'database' | 'workflow' | null;
  script_template: string | null;
  input_schema: Record<string, unknown> | null;
  output_schema: Record<string, unknown> | null;
  required_permissions: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  approval_roles: string[];
  rollback_action_key: string | null;
  max_execution_time_seconds: number;
  is_active: boolean;
  success_rate: number;
  avg_execution_time_ms: number | null;
  execution_count: number;
}

export interface ActionExecution {
  id: string;
  orchestration_session_id: string | null;
  agent_task_id: string | null;
  action_key: string;
  executed_by_agent: string | null;
  approved_by: string | null;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back' | 'cancelled';
  input_params: Record<string, unknown> | null;
  output_result: Record<string, unknown> | null;
  error_details: Record<string, unknown> | null;
  pre_execution_snapshot: Record<string, unknown> | null;
  post_execution_snapshot: Record<string, unknown> | null;
  can_rollback: boolean;
  rolled_back_at: string | null;
  rollback_result: Record<string, unknown> | null;
  execution_time_ms: number | null;
  confidence_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ExecutionRequest {
  actionKey: string;
  params: Record<string, unknown>;
  sessionId?: string;
  agentKey?: string;
  confidenceScore?: number;
  skipApproval?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  status: string;
  output?: Record<string, unknown>;
  error?: string;
  canRollback: boolean;
  executionTime: number;
}

// === HOOK ===
export function useActionExecutionEngine() {
  const { user } = useAuth();
  const [actions, setActions] = useState<ExecutableAction[]>([]);
  const [executions, setExecutions] = useState<ActionExecution[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ActionExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === FETCH ACTIONS ===
  const fetchActions = useCallback(async (category?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('support_executable_actions')
        .select('*')
        .eq('is_active', true)
        .order('action_category', { ascending: true });

      if (category) {
        query = query.eq('action_category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped = (data || []).map(action => ({
        ...action,
        required_permissions: Array.isArray(action.required_permissions) ? action.required_permissions : [],
        approval_roles: Array.isArray(action.approval_roles) ? action.approval_roles : []
      })) as ExecutableAction[];

      setActions(mapped);
      return mapped;
    } catch (err) {
      console.error('[useActionExecutionEngine] fetchActions error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH EXECUTIONS ===
  const fetchExecutions = useCallback(async (sessionId?: string, limit = 50) => {
    try {
      let query = supabase
        .from('support_action_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sessionId) {
        query = query.eq('orchestration_session_id', sessionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setExecutions((data || []) as ActionExecution[]);
      return data as ActionExecution[];
    } catch (err) {
      console.error('[useActionExecutionEngine] fetchExecutions error:', err);
      return [];
    }
  }, []);

  // === FETCH PENDING APPROVALS ===
  const fetchPendingApprovals = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('support_action_executions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setPendingApprovals((data || []) as ActionExecution[]);
      return data as ActionExecution[];
    } catch (err) {
      console.error('[useActionExecutionEngine] fetchPendingApprovals error:', err);
      return [];
    }
  }, []);

  // === EXECUTE ACTION ===
  const executeAction = useCallback(async (request: ExecutionRequest): Promise<ExecutionResult | null> => {
    setIsExecuting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('execute-support-action', {
        body: {
          action: 'execute',
          actionKey: request.actionKey,
          params: request.params,
          sessionId: request.sessionId,
          agentKey: request.agentKey,
          confidenceScore: request.confidenceScore,
          skipApproval: request.skipApproval,
          userId: user?.id
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Acción ejecutada correctamente');
        await fetchExecutions(request.sessionId);
        await fetchPendingApprovals();
        return data.data as ExecutionResult;
      }

      throw new Error(data?.error || 'Execution failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error ejecutando acción';
      setError(message);
      toast.error(message);
      console.error('[useActionExecutionEngine] executeAction error:', err);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [user, fetchExecutions, fetchPendingApprovals]);

  // === APPROVE EXECUTION ===
  const approveExecution = useCallback(async (executionId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('execute-support-action', {
        body: {
          action: 'approve',
          executionId,
          userId: user.id
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Ejecución aprobada');
        await fetchPendingApprovals();
        await fetchExecutions();
        return true;
      }

      throw new Error(data?.error || 'Approval failed');
    } catch (err) {
      console.error('[useActionExecutionEngine] approveExecution error:', err);
      toast.error('Error aprobando ejecución');
      return false;
    }
  }, [user, fetchPendingApprovals, fetchExecutions]);

  // === REJECT EXECUTION ===
  const rejectExecution = useCallback(async (executionId: string, reason: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('support_action_executions')
        .update({
          status: 'cancelled',
          error_details: { rejection_reason: reason },
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      if (updateError) throw updateError;

      toast.success('Ejecución rechazada');
      await fetchPendingApprovals();
      return true;
    } catch (err) {
      console.error('[useActionExecutionEngine] rejectExecution error:', err);
      toast.error('Error rechazando ejecución');
      return false;
    }
  }, [fetchPendingApprovals]);

  // === ROLLBACK EXECUTION ===
  const rollbackExecution = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('execute-support-action', {
        body: {
          action: 'rollback',
          executionId,
          userId: user?.id
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Rollback ejecutado');
        await fetchExecutions();
        return true;
      }

      throw new Error(data?.error || 'Rollback failed');
    } catch (err) {
      console.error('[useActionExecutionEngine] rollbackExecution error:', err);
      toast.error('Error ejecutando rollback');
      return false;
    }
  }, [user, fetchExecutions]);

  // === GET ACTION BY KEY ===
  const getActionByKey = useCallback((actionKey: string): ExecutableAction | undefined => {
    return actions.find(a => a.action_key === actionKey);
  }, [actions]);

  // === GET ACTIONS BY CATEGORY ===
  const getActionsByCategory = useCallback((category: string): ExecutableAction[] => {
    return actions.filter(a => a.action_category === category);
  }, [actions]);

  // === GET ACTIONS BY RISK LEVEL ===
  const getActionsByRiskLevel = useCallback((riskLevel: string): ExecutableAction[] => {
    return actions.filter(a => a.risk_level === riskLevel);
  }, [actions]);

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchActions();
    fetchPendingApprovals();
  }, [fetchActions, fetchPendingApprovals]);

  // === REALTIME UPDATES ===
  useEffect(() => {
    const channel = supabase
      .channel('action-executions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_action_executions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newExec = payload.new as ActionExecution;
            setExecutions(prev => [newExec, ...prev.slice(0, 49)]);
            if (newExec.status === 'pending') {
              setPendingApprovals(prev => [...prev, newExec]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ActionExecution;
            setExecutions(prev => prev.map(e => e.id === updated.id ? updated : e));
            if (updated.status !== 'pending') {
              setPendingApprovals(prev => prev.filter(e => e.id !== updated.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    // State
    actions,
    executions,
    pendingApprovals,
    isLoading,
    isExecuting,
    error,
    // Actions
    fetchActions,
    fetchExecutions,
    fetchPendingApprovals,
    executeAction,
    approveExecution,
    rejectExecution,
    rollbackExecution,
    // Helpers
    getActionByKey,
    getActionsByCategory,
    getActionsByRiskLevel,
  };
}

export default useActionExecutionEngine;
