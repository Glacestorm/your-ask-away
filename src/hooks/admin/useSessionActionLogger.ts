/**
 * Hook for logging granular session actions during remote support sessions
 * Provides real-time action tracking for compliance and auditing
 * 
 * KB 2.0 Pattern
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, parseError, collectTelemetry } from '@/hooks/core/useKBBase';

// Re-export for backwards compat
export type ActionLoggerError = KBError;

// === TYPES ===
export type ActionType =
  | 'config_change'
  | 'module_update'
  | 'data_access'
  | 'data_modification'
  | 'system_repair'
  | 'diagnostic_run'
  | 'file_transfer'
  | 'permission_change'
  | 'session_start'
  | 'session_end'
  | 'screenshot_capture'
  | 'command_execution'
  | 'error_occurred'
  | 'warning_raised'
  | 'user_interaction'
  | 'system_check';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SessionAction {
  id: string;
  session_id: string;
  action_type: ActionType;
  description: string;
  component_affected?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  duration_ms?: number;
  risk_level: RiskLevel;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  metadata?: Record<string, unknown>;
  performed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LogActionParams {
  actionType: ActionType;
  description: string;
  componentAffected?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  riskLevel?: RiskLevel;
  requiresApproval?: boolean;
  metadata?: Record<string, unknown>;
}

export function useSessionActionLogger(sessionId: string | null) {
  const [actions, setActions] = useState<SessionAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoadingState = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  
  const actionStartTime = useRef<number | null>(null);
  const { user } = useAuth();

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-actions-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_actions',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newAction = payload.new as SessionAction;
          setActions(prev => {
            // Avoid duplicates
            if (prev.some(a => a.id === newAction.id)) return prev;
            return [...prev, newAction];
          });
          setLastRefresh(new Date());
          setStatus('success');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Start timing an action
  const startAction = useCallback(() => {
    actionStartTime.current = Date.now();
  }, []);

  // Log an action to the database
  const logAction = useCallback(async (params: LogActionParams): Promise<SessionAction | null> => {
    if (!sessionId) {
      const kbError = createKBError('NO_SESSION', 'No hay sesión activa');
      setError(kbError);
      console.error('No session ID provided for action logging');
      return null;
    }

    setIsLogging(true);
    setError(null);
    setStatus('loading');
    const startTime = Date.now();
    
    const duration = actionStartTime.current ? Date.now() - actionStartTime.current : undefined;
    actionStartTime.current = null;

    try {
      const insertData: Record<string, unknown> = {
        session_id: sessionId,
        action_type: params.actionType,
        description: params.description,
        component_affected: params.componentAffected || null,
        before_state: params.beforeState || null,
        after_state: params.afterState || null,
        duration_ms: duration || null,
        risk_level: params.riskLevel || 'low',
        requires_approval: params.requiresApproval || false,
        metadata: params.metadata || {},
        performed_by: user?.id || null,
      };

      const { data, error: insertError } = await supabase
        .from('session_actions')
        .insert([insertData] as any)
        .select()
        .single();

      if (insertError) throw insertError;

      const newAction = data as SessionAction;
      
      // Show toast for high-risk actions
      if (params.riskLevel === 'high' || params.riskLevel === 'critical') {
        toast.warning(`Acción de alto riesgo registrada: ${params.description}`);
      }

      setStatus('success');
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useSessionActionLogger', 'logAction', 'success', Date.now() - startTime);
      return newAction;
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('LOG_ACTION_ERROR', parsedErr.message, { details: { sessionId, actionType: params.actionType } });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useSessionActionLogger', 'logAction', 'error', Date.now() - startTime, kbError);
      console.error('Error logging action:', err);
      toast.error('Error al registrar acción');
      return null;
    } finally {
      setIsLogging(false);
    }
  }, [sessionId, user?.id]);

  // Fetch all actions for the current session
  const fetchActions = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);
    setStatus('loading');
    const startTime = Date.now();
    
    try {
      const { data, error: fetchError } = await supabase
        .from('session_actions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      
      setActions(data as SessionAction[]);
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      setRetryCount(0);
      collectTelemetry('useSessionActionLogger', 'fetchActions', 'success', Date.now() - startTime);
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('FETCH_ACTIONS_ERROR', parsedErr.message, { details: { sessionId } });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useSessionActionLogger', 'fetchActions', 'error', Date.now() - startTime, kbError);
      console.error('Error fetching actions:', err);
      toast.error('Error al cargar acciones');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Get session summary statistics
  const getSessionSummary = useCallback(() => {
    const totalDuration = actions.reduce((sum, a) => sum + (a.duration_ms || 0), 0);
    const actionsByType = actions.reduce((acc, a) => {
      acc[a.action_type] = (acc[a.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const actionsByRisk = actions.reduce((acc, a) => {
      acc[a.risk_level] = (acc[a.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const pendingApprovals = actions.filter(a => a.requires_approval && !a.approved_at);

    return {
      totalActions: actions.length,
      totalDurationMs: totalDuration,
      totalDurationFormatted: formatDuration(totalDuration),
      actionsByType,
      actionsByRisk,
      pendingApprovals: pendingApprovals.length,
      highRiskActions: (actionsByRisk.high || 0) + (actionsByRisk.critical || 0),
    };
  }, [actions]);

  // Convenience methods for common action types
  const logConfigChange = useCallback((description: string, before?: Record<string, unknown>, after?: Record<string, unknown>) => {
    startAction();
    return logAction({
      actionType: 'config_change',
      description,
      beforeState: before,
      afterState: after,
      riskLevel: 'medium',
    });
  }, [logAction, startAction]);

  const logDataAccess = useCallback((description: string, componentAffected?: string, metadata?: Record<string, unknown>) => {
    return logAction({
      actionType: 'data_access',
      description,
      componentAffected,
      riskLevel: 'low',
      metadata,
    });
  }, [logAction]);

  const logDataModification = useCallback((description: string, before?: Record<string, unknown>, after?: Record<string, unknown>) => {
    startAction();
    return logAction({
      actionType: 'data_modification',
      description,
      beforeState: before,
      afterState: after,
      riskLevel: 'high',
      requiresApproval: true,
    });
  }, [logAction, startAction]);

  const logSystemRepair = useCallback((description: string, metadata?: Record<string, unknown>) => {
    startAction();
    return logAction({
      actionType: 'system_repair',
      description,
      riskLevel: 'high',
      metadata,
    });
  }, [logAction, startAction]);

  const logError = useCallback((description: string, metadata?: Record<string, unknown>) => {
    return logAction({
      actionType: 'error_occurred',
      description,
      riskLevel: 'medium',
      metadata,
    });
  }, [logAction]);

  const logSessionStart = useCallback(() => {
    return logAction({
      actionType: 'session_start',
      description: 'Sesión de soporte remoto iniciada',
      riskLevel: 'low',
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    });
  }, [logAction]);

  const logSessionEnd = useCallback((summary?: Record<string, unknown>) => {
    return logAction({
      actionType: 'session_end',
      description: 'Sesión de soporte remoto finalizada',
      riskLevel: 'low',
      metadata: {
        ...summary,
        timestamp: new Date().toISOString(),
      },
    });
  }, [logAction]);

  return {
    // State
    actions,
    loading,
    isLogging,
    error,
    lastRefresh,
    // Actions
    logAction,
    startAction,
    fetchActions,
    getSessionSummary,
    clearError,
    // Convenience methods
    logConfigChange,
    logDataAccess,
    logDataModification,
    logSystemRepair,
    logError,
    logSessionStart,
    logSessionEnd,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoadingState,
    isSuccess,
    isError,
    lastSuccess,
    retryCount,
    reset,
  };
}

// Helper function to format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
