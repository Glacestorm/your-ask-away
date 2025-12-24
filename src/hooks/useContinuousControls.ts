import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, parseError, collectTelemetry } from '@/hooks/core/useKBBase';

// Re-export for backwards compat
export type ContinuousControlsError = KBError;

export interface ContinuousControl {
  id: string;
  control_code: string;
  control_name: string;
  control_description: string | null;
  control_category: 'compliance' | 'risk' | 'performance' | 'security';
  check_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  threshold_config: Record<string, unknown>;
  severity_on_failure: 'low' | 'medium' | 'high' | 'critical';
  auto_generate_evidence: boolean;
  is_active: boolean;
  last_execution_at: string | null;
  // Computed fields
  last_status?: 'passed' | 'failed' | 'warning' | 'error' | 'running' | 'unknown';
  items_checked?: number;
  items_failed?: number;
}

export interface ControlExecution {
  id: string;
  control_id: string;
  control?: ContinuousControl;
  execution_start: string;
  execution_end: string | null;
  status: 'running' | 'passed' | 'failed' | 'warning' | 'error';
  items_checked: number;
  items_passed: number;
  items_failed: number;
  findings: ControlFinding[];
  metrics_collected: Record<string, unknown>;
  evidence_ids: string[];
  ai_analysis: string | null;
  ai_recommendations: string[];
}

export interface ControlFinding {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  description: string;
  details: Record<string, unknown>;
}

export interface ControlAlert {
  id: string;
  control_id: string;
  control?: ContinuousControl;
  execution_id: string | null;
  alert_type: 'threshold_breach' | 'anomaly' | 'trend' | 'compliance_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  affected_entities: unknown[];
  affected_count: number;
  recommended_actions: RecommendedAction[];
  evidence_summary: Record<string, unknown>;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  actionType: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ControlStats {
  totalControls: number;
  activeControls: number;
  passedControls: number;
  failedControls: number;
  warningControls: number;
  openAlerts: number;
  criticalAlerts: number;
  evidenceGenerated: number;
  byCategory: Record<string, { total: number; passed: number; failed: number }>;
}

export function useContinuousControls() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

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

  // Get all controls with latest status
  const { data: controls, isLoading: controlsLoading, refetch: refetchControls } = useQuery({
    queryKey: ['continuous-controls'],
    queryFn: async () => {
      const startTime = Date.now();
      setStatus('loading');
      
      try {
        const { data: controlsData, error: fetchError } = await supabase
          .from('continuous_controls')
          .select('*')
          .order('control_category', { ascending: true })
          .order('severity_on_failure', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        // Get latest execution for each control
        const controlsWithStatus = await Promise.all(
          (controlsData || []).map(async (control) => {
            const { data: latestExecution } = await supabase
              .from('control_executions')
              .select('status, items_checked, items_failed')
              .eq('control_id', control.id)
              .order('execution_start', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            return {
              ...control,
              threshold_config: control.threshold_config as Record<string, unknown>,
              last_status: latestExecution?.status || 'unknown',
              items_checked: latestExecution?.items_checked || 0,
              items_failed: latestExecution?.items_failed || 0,
            } as ContinuousControl;
          })
        );
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setRetryCount(0);
        collectTelemetry('useContinuousControls', 'fetchControls', 'success', Date.now() - startTime);
        return controlsWithStatus;
      } catch (err) {
        const parsedErr = parseError(err);
        const kbError = createKBError('FETCH_CONTROLS_ERROR', parsedErr.message, { originalError: String(err) });
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        collectTelemetry('useContinuousControls', 'fetchControls', 'error', Date.now() - startTime, kbError);
        throw err;
      }
    },
  });

  // Get open alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['control-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('control_alerts')
        .select(`
          *,
          control:continuous_controls(*)
        `)
        .in('status', ['open', 'acknowledged', 'in_progress'])
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(alert => ({
        ...alert,
        control: alert.control as unknown as ContinuousControl,
        affected_entities: (alert.affected_entities || []) as unknown as unknown[],
        recommended_actions: (alert.recommended_actions || []) as unknown as RecommendedAction[],
        evidence_summary: (alert.evidence_summary || {}) as unknown as Record<string, unknown>,
      })) as ControlAlert[];
    },
  });

  // Get recent executions
  const { data: recentExecutions } = useQuery({
    queryKey: ['control-executions-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('control_executions')
        .select(`
          *,
          control:continuous_controls(*)
        `)
        .order('execution_start', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return (data || []).map(exec => ({
        ...exec,
        control: exec.control as unknown as ContinuousControl,
        findings: (exec.findings || []) as unknown as ControlFinding[],
        metrics_collected: (exec.metrics_collected || {}) as unknown as Record<string, unknown>,
        ai_recommendations: (exec.ai_recommendations || []) as unknown as string[],
      })) as ControlExecution[];
    },
  });

  // Calculate stats
  const stats: ControlStats | null = controls ? {
    totalControls: controls.length,
    activeControls: controls.filter(c => c.is_active).length,
    passedControls: controls.filter(c => c.last_status === 'passed').length,
    failedControls: controls.filter(c => c.last_status === 'failed').length,
    warningControls: controls.filter(c => c.last_status === 'warning').length,
    openAlerts: alerts?.filter(a => a.status === 'open').length || 0,
    criticalAlerts: alerts?.filter(a => a.severity === 'critical' && a.status === 'open').length || 0,
    evidenceGenerated: recentExecutions?.reduce((sum, e) => sum + (e.evidence_ids?.length || 0), 0) || 0,
    byCategory: controls.reduce((acc, control) => {
      const cat = control.control_category;
      if (!acc[cat]) acc[cat] = { total: 0, passed: 0, failed: 0 };
      acc[cat].total++;
      if (control.last_status === 'passed') acc[cat].passed++;
      if (control.last_status === 'failed') acc[cat].failed++;
      return acc;
    }, {} as Record<string, { total: number; passed: number; failed: number }>),
  } : null;

  // Run controls
  const runControls = useMutation({
    mutationFn: async (controlIds?: string[]) => {
      setIsRunning(true);
      
      const { data, error } = await supabase.functions.invoke('run-continuous-controls', {
        body: { controlIds },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.executed || 0} controles ejecutados`);
      refetchControls();
      refetchAlerts();
      queryClient.invalidateQueries({ queryKey: ['control-executions-recent'] });
    },
    onError: (error) => {
      console.error('Error running controls:', error);
      toast.error('Error al ejecutar controles');
    },
    onSettled: () => {
      setIsRunning(false);
    },
  });

  // Acknowledge alert
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('control_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alerta reconocida');
      refetchAlerts();
    },
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('control_alerts')
        .update({
          status: 'resolved',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alerta resuelta');
      refetchAlerts();
    },
  });

  // Dismiss alert
  const dismissAlert = useMutation({
    mutationFn: async ({ alertId, reason }: { alertId: string; reason?: string }) => {
      const { error } = await supabase
        .from('control_alerts')
        .update({
          status: 'dismissed',
          resolution_notes: reason,
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Alerta descartada');
      refetchAlerts();
    },
  });

  // Toggle control active status
  const toggleControlActive = useMutation({
    mutationFn: async ({ controlId, isActive }: { controlId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('continuous_controls')
        .update({ is_active: isActive })
        .eq('id', controlId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      toast.success(`Control ${isActive ? 'activado' : 'desactivado'}`);
      refetchControls();
    },
  });

  // Get controls by category
  const getControlsByCategory = useCallback((category: string) => {
    return (controls || []).filter(c => c.control_category === category);
  }, [controls]);

  // Get critical alerts
  const getCriticalAlerts = useCallback(() => {
    return (alerts || []).filter(a => a.severity === 'critical' && a.status === 'open');
  }, [alerts]);

  return {
    controls: controls || [],
    alerts: alerts || [],
    recentExecutions: recentExecutions || [],
    stats,
    isLoading: controlsLoading || alertsLoading,
    isRunning,
    runControls: runControls.mutate,
    acknowledgeAlert: acknowledgeAlert.mutate,
    resolveAlert: resolveAlert.mutate,
    dismissAlert: dismissAlert.mutate,
    toggleControlActive: toggleControlActive.mutate,
    getControlsByCategory,
    getCriticalAlerts,
    refetchControls,
    refetchAlerts,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoadingState,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
