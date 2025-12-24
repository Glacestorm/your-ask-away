/**
 * useRetentionPlaybooks - KB 2.0 Migration
 * Enterprise-grade retention playbooks with state machine and telemetry
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

// === ERROR TIPADO KB 2.0 ===
export type RetentionPlaybooksError = KBError;

export interface RetentionPlaybook {
  id: string;
  name: string;
  description: string | null;
  trigger_type: 'manual' | 'automatic' | 'ai_suggested';
  trigger_conditions: Record<string, any>;
  target_segment: string | null;
  priority: number;
  estimated_duration_days: number;
  success_criteria: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybookStep {
  id: string;
  playbook_id: string;
  step_number: number;
  step_type: 'task' | 'email' | 'call' | 'meeting' | 'wait' | 'condition' | 'ai_action';
  title: string;
  description: string | null;
  action_config: Record<string, any>;
  wait_days: number;
  condition_logic: Record<string, any> | null;
  required: boolean;
  created_at: string;
}

export interface PlaybookExecution {
  id: string;
  playbook_id: string;
  company_id: string;
  triggered_by: string | null;
  trigger_reason: string | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  current_step: number;
  started_at: string;
  completed_at: string | null;
  outcome: string | null;
  outcome_notes: string | null;
  variables: Record<string, any>;
  ai_recommendations: any[];
  created_at: string;
  updated_at: string;
  playbook?: RetentionPlaybook;
  company?: { id: string; name: string };
}

export interface PlaybookStepExecution {
  id: string;
  execution_id: string;
  step_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  result_data: Record<string, any>;
  notes: string | null;
  created_at: string;
  step?: PlaybookStep;
}

export function useRetentionPlaybooks() {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isQueryLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Fetch all playbooks
  const { data: playbooks = [], isLoading: loadingPlaybooks, refetch: refetchPlaybooks } = useQuery({
    queryKey: ['retention-playbooks'],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('retention_playbooks')
        .select('*')
        .order('priority', { ascending: true });
      
      if (fetchError) {
        const kbError = createKBError('FETCH_PLAYBOOKS_ERROR', fetchError.message, { retryable: true });
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        collectTelemetry('useRetentionPlaybooks', 'fetchPlaybooks', 'error', 0, kbError);
        throw fetchError;
      }
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setStatus('success');
      return data as RetentionPlaybook[];
    }
  });

  // Fetch playbook steps
  const fetchPlaybookSteps = useCallback(async (playbookId: string): Promise<PlaybookStep[]> => {
    const { data, error } = await supabase
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', playbookId)
      .order('step_number', { ascending: true });
    
    if (error) throw error;
    return data as PlaybookStep[];
  }, []);

  // Fetch active executions
  const { data: activeExecutions = [], isLoading: loadingExecutions, refetch: refetchExecutions } = useQuery({
    queryKey: ['playbook-executions-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbook_executions')
        .select('*')
        .in('status', ['active', 'paused'])
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as PlaybookExecution[];
    }
  });

  // Start playbook execution
  const startPlaybookMutation = useMutation({
    mutationFn: async ({ 
      playbookId, 
      companyId, 
      triggerReason 
    }: { 
      playbookId: string; 
      companyId: string; 
      triggerReason?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create execution
      const { data: execution, error: execError } = await supabase
        .from('playbook_executions')
        .insert({
          playbook_id: playbookId,
          company_id: companyId,
          triggered_by: user?.id,
          trigger_reason: triggerReason,
          status: 'active',
          current_step: 1
        })
        .select()
        .single();
      
      if (execError) throw execError;

      // Get steps and create step executions
      const steps = await fetchPlaybookSteps(playbookId);
      
      const stepExecutions = steps.map(step => ({
        execution_id: execution.id,
        step_id: step.id,
        status: step.step_number === 1 ? 'in_progress' : 'pending'
      }));

      const { error: stepsError } = await supabase
        .from('playbook_step_executions')
        .insert(stepExecutions);

      if (stepsError) throw stepsError;

      return execution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-executions-active'] });
      toast.success('Playbook iniciado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al iniciar playbook: ${error.message}`);
    }
  });

  // Complete step
  const completeStepMutation = useMutation({
    mutationFn: async ({ 
      stepExecutionId, 
      resultData, 
      notes 
    }: { 
      stepExecutionId: string; 
      resultData?: Record<string, any>; 
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('playbook_step_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
          result_data: resultData || {},
          notes
        })
        .eq('id', stepExecutionId)
        .select('*, playbook_executions:execution_id (*)')
        .single();

      if (error) throw error;

      // Advance to next step
      const execution = data.playbook_executions;
      const nextStep = (execution.current_step || 1) + 1;

      // Check if there are more steps
      const { data: nextStepExec } = await supabase
        .from('playbook_step_executions')
        .select('id')
        .eq('execution_id', execution.id)
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (nextStepExec) {
        // Start next step
        await supabase
          .from('playbook_step_executions')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', nextStepExec.id);

        await supabase
          .from('playbook_executions')
          .update({ current_step: nextStep })
          .eq('id', execution.id);
      } else {
        // Complete playbook
        await supabase
          .from('playbook_executions')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', execution.id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-executions-active'] });
      toast.success('Paso completado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Skip step
  const skipStepMutation = useMutation({
    mutationFn: async ({ stepExecutionId, reason }: { stepExecutionId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('playbook_step_executions')
        .update({
          status: 'skipped',
          completed_at: new Date().toISOString(),
          notes: reason
        })
        .eq('id', stepExecutionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-executions-active'] });
      toast.info('Paso omitido');
    }
  });

  // Pause/Resume execution
  const toggleExecutionMutation = useMutation({
    mutationFn: async ({ executionId, action }: { executionId: string; action: 'pause' | 'resume' }) => {
      const { data, error } = await supabase
        .from('playbook_executions')
        .update({ status: action === 'pause' ? 'paused' : 'active' })
        .eq('id', executionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['playbook-executions-active'] });
      toast.success(action === 'pause' ? 'Playbook pausado' : 'Playbook reanudado');
    }
  });

  // Cancel execution
  const cancelExecutionMutation = useMutation({
    mutationFn: async (executionId: string) => {
      const { error } = await supabase
        .from('playbook_executions')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', executionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-executions-active'] });
      toast.info('Playbook cancelado');
    }
  });

  // Get suggested playbooks for a company
  const getSuggestedPlaybooks = useCallback(async (companyId: string): Promise<RetentionPlaybook[]> => {
    // Return active playbooks as suggestions (simplified)
    return playbooks.filter(p => p.is_active);
  }, [playbooks]);

  return {
    // Data
    playbooks,
    activeExecutions,
    data: playbooks,
    
    // State Machine KB 2.0
    status,
    isIdle,
    isLoading: loadingPlaybooks || loadingExecutions || isQueryLoading,
    isSuccess,
    isError,
    
    // Error Management KB 2.0
    error,
    clearError,
    
    // Metadata
    lastRefresh,
    lastSuccess,
    retryCount,
    
    // Control
    reset,
    loadingPlaybooks,
    loadingExecutions,
    refetchPlaybooks,
    refetchExecutions,
    
    // Actions
    fetchPlaybookSteps,
    startPlaybook: startPlaybookMutation.mutateAsync,
    completeStep: completeStepMutation.mutateAsync,
    skipStep: skipStepMutation.mutateAsync,
    toggleExecution: toggleExecutionMutation.mutateAsync,
    cancelExecution: cancelExecutionMutation.mutateAsync,
    getSuggestedPlaybooks,
    isStarting: startPlaybookMutation.isPending,
    isCompleting: completeStepMutation.isPending,
  };
}

export default useRetentionPlaybooks;
