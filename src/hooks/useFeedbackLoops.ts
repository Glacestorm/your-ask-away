import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

export interface FeedbackLoop {
  id: string;
  survey_response_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  original_score: number;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_at: string | null;
  root_cause: string | null;
  resolution_notes: string | null;
  actions_taken: Json;
  recovery_score: number | null;
  recovery_date: string | null;
  escalation_level: number;
  escalated_at: string | null;
  escalated_to: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
  };
}

export function useFeedbackLoops() {
  const queryClient = useQueryClient();
  
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
  const isRetrying = status === 'retrying';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const { data: feedbackLoops, isLoading } = useQuery({
    queryKey: ['feedback-loops'],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        const { data, error: fetchError } = await supabase
          .from('feedback_loops')
          .select(`
            *,
            company:companies(id, name)
          `)
          .order('created_at', { ascending: false });
          
        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setError(null);
        
        collectTelemetry({
          hookName: 'useFeedbackLoops',
          operationName: 'fetchFeedbackLoops',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as unknown as FeedbackLoop[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        
        collectTelemetry({
          hookName: 'useFeedbackLoops',
          operationName: 'fetchFeedbackLoops',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
        });
        
        throw err;
      }
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['feedback-loops-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_loops')
        .select('status, priority, sla_breached, recovery_score');
      if (error) throw error;

      const typedData = data as unknown as { status: string; priority: string; sla_breached: boolean; recovery_score: number | null }[];
      const total = typedData.length;
      const open = typedData.filter(f => f.status === 'open').length;
      const inProgress = typedData.filter(f => f.status === 'in_progress').length;
      const resolved = typedData.filter(f => f.status === 'resolved').length;
      const recovered = typedData.filter(f => f.status === 'recovered').length;
      const slaBreach = typedData.filter(f => f.sla_breached).length;
      const withRecovery = typedData.filter(f => f.recovery_score !== null);
      const avgRecovery = withRecovery.length > 0 
        ? withRecovery.reduce((sum, f) => sum + (f.recovery_score || 0), 0) / withRecovery.length
        : 0;

      return {
        total,
        open,
        inProgress,
        resolved,
        recovered,
        slaBreach,
        avgRecoveryScore: Math.round(avgRecovery * 10) / 10,
        recoveryRate: total > 0 ? Math.round((recovered / total) * 100) : 0,
      };
    },
  });

  const processAction = useMutation({
    mutationFn: async ({ 
      feedbackId, 
      action, 
      notes 
    }: { 
      feedbackId: string; 
      action: string; 
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('process-closed-loop', {
        body: { feedbackId, action, notes },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-loops'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-loops-stats'] });
      setLastSuccess(new Date());
      toast.success('Acción procesada correctamente');
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error al procesar acción: ${kbError.message}`);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'recovered': return 'bg-emerald-100 text-emerald-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'contacted': return 'Contactado';
      case 'resolved': return 'Resuelto';
      case 'recovered': return 'Recuperado';
      case 'escalated': return 'Escalado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  return {
    feedbackLoops,
    stats,
    isLoading,
    processAction: processAction.mutate,
    isProcessing: processAction.isPending,
    getStatusColor,
    getStatusLabel,
    getPriorityColor,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoadingState,
    isSuccess,
    isError,
    isRetrying,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
