/**
 * Hook for logging granular session actions during remote support sessions
 * Provides real-time action tracking for compliance and auditing
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  action_description: string;
  component_affected?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  duration_ms?: number;
  screenshot_url?: string;
  risk_level: RiskLevel;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LogActionParams {
  actionType: ActionType;
  description: string;
  componentAffected?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  riskLevel?: RiskLevel;
  requiresApproval?: boolean;
  screenshotUrl?: string;
  metadata?: Record<string, unknown>;
}

export function useSessionActionLogger(sessionId: string | null) {
  const [actions, setActions] = useState<SessionAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const actionStartTime = useRef<number | null>(null);

  // Start timing an action
  const startAction = useCallback(() => {
    actionStartTime.current = Date.now();
  }, []);

  // Log an action to the database
  const logAction = useCallback(async (params: LogActionParams): Promise<SessionAction | null> => {
    if (!sessionId) {
      console.error('No session ID provided for action logging');
      return null;
    }

    setIsLogging(true);
    const duration = actionStartTime.current ? Date.now() - actionStartTime.current : undefined;
    actionStartTime.current = null;

    try {
      const insertData = {
        session_id: sessionId,
        action_type: params.actionType,
        action_description: params.description,
        component_affected: params.componentAffected,
        before_state: params.beforeState as Record<string, unknown> | undefined,
        after_state: params.afterState as Record<string, unknown> | undefined,
        duration_ms: duration,
        screenshot_url: params.screenshotUrl,
        risk_level: params.riskLevel || 'low',
        requires_approval: params.requiresApproval || false,
        metadata: params.metadata || {},
      };

      const { data, error } = await supabase
        .from('session_action_logs')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      const newAction = data as unknown as SessionAction;
      setActions(prev => [...prev, newAction]);

      // Show toast for high-risk actions
      if (params.riskLevel === 'high' || params.riskLevel === 'critical') {
        toast.warning(`Acción de alto riesgo registrada: ${params.description}`);
      }

      return newAction;
    } catch (error) {
      console.error('Error logging action:', error);
      toast.error('Error al registrar acción');
      return null;
    } finally {
      setIsLogging(false);
    }
  }, [sessionId]);

  // Fetch all actions for the current session
  const fetchActions = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_action_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setActions(data as SessionAction[]);
    } catch (error) {
      console.error('Error fetching actions:', error);
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
    actions,
    loading,
    isLogging,
    logAction,
    startAction,
    fetchActions,
    getSessionSummary,
    // Convenience methods
    logConfigChange,
    logDataAccess,
    logDataModification,
    logSystemRepair,
    logError,
    logSessionStart,
    logSessionEnd,
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
