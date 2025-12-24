import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

export interface JourneyStep {
  id: string;
  journey_id: string;
  step_order: number;
  step_type: 'action' | 'condition' | 'delay' | 'split' | 'end';
  action_type?: string;
  config: Record<string, any>;
  next_step_id?: string;
  yes_step_id?: string;
  no_step_id?: string;
  delay_duration?: string;
  delay_until_time?: string;
  template_id?: string;
  stats: {
    processed: number;
    success: number;
    failed: number;
  };
}

export interface CustomerJourney {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'event' | 'segment' | 'schedule' | 'manual';
  trigger_config: Record<string, any>;
  status: 'draft' | 'active' | 'paused' | 'archived';
  entry_segment_id?: string;
  exit_conditions: Array<Record<string, any>>;
  goals: Array<Record<string, any>>;
  bpmn_process_id?: string;
  stats: {
    enrolled: number;
    completed: number;
    converted: number;
  };
  created_by?: string;
  created_at: string;
  updated_at: string;
  steps?: JourneyStep[];
}

export interface JourneyEnrollment {
  id: string;
  journey_id: string;
  company_id: string;
  contact_id?: string;
  current_step_id?: string;
  status: 'active' | 'completed' | 'exited' | 'paused' | 'failed';
  enrolled_at: string;
  completed_at?: string;
  exited_at?: string;
  exit_reason?: string;
  step_history: Array<Record<string, any>>;
  variables: Record<string, any>;
  next_action_at?: string;
}

export function useCustomerJourneys() {
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

  const { data: journeys = [], isLoading: isLoadingJourneys } = useQuery({
    queryKey: ['customer-journeys'],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        const { data, error: fetchError } = await supabase
          .from('customer_journeys')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setError(null);
        
        collectTelemetry({
          hookName: 'useCustomerJourneys',
          operationName: 'fetchJourneys',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as unknown as CustomerJourney[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        
        collectTelemetry({
          hookName: 'useCustomerJourneys',
          operationName: 'fetchJourneys',
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

  const createJourney = useMutation({
    mutationFn: async (journey: Omit<CustomerJourney, 'id' | 'created_at' | 'updated_at' | 'stats'>) => {
      const { data, error } = await supabase
        .from('customer_journeys')
        .insert({
          ...journey,
          stats: { enrolled: 0, completed: 0, converted: 0 },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-journeys'] });
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      toast.success('Journey creado correctamente');
    },
    onError: (err: any) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al crear journey: ' + kbError.message);
    },
  });

  const updateJourney = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomerJourney> & { id: string }) => {
      const { data, error } = await supabase
        .from('customer_journeys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-journeys'] });
      toast.success('Journey actualizado');
    },
    onError: (err: any) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al actualizar: ' + kbError.message);
    },
  });

  const deleteJourney = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_journeys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-journeys'] });
      toast.success('Journey eliminado');
    },
    onError: (err: any) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al eliminar: ' + kbError.message);
    },
  });

  const activateJourney = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_journeys')
        .update({ status: 'active' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-journeys'] });
      toast.success('Journey activado');
    },
  });

  const pauseJourney = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_journeys')
        .update({ status: 'paused' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-journeys'] });
      toast.success('Journey pausado');
    },
  });

  return {
    journeys,
    isLoading: isLoadingJourneys,
    createJourney: createJourney.mutate,
    updateJourney: updateJourney.mutate,
    deleteJourney: deleteJourney.mutate,
    activateJourney: activateJourney.mutate,
    pauseJourney: pauseJourney.mutate,
    isCreating: createJourney.isPending,
    isUpdating: updateJourney.isPending,
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

export function useJourneySteps(journeyId: string | null) {
  const queryClient = useQueryClient();

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['journey-steps', journeyId],
    queryFn: async () => {
      if (!journeyId) return [];
      
      const { data, error } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId)
        .order('step_order');

      if (error) throw error;
      return data as unknown as JourneyStep[];
    },
    enabled: !!journeyId,
  });

  const addStep = useMutation({
    mutationFn: async (step: Omit<JourneyStep, 'id' | 'stats'>) => {
      const { data, error } = await supabase
        .from('journey_steps')
        .insert({
          ...step,
          stats: { processed: 0, success: 0, failed: 0 },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
      toast.success('Paso añadido');
    },
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JourneyStep> & { id: string }) => {
      const { data, error } = await supabase
        .from('journey_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
    },
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('journey_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
      toast.success('Paso eliminado');
    },
  });

  return {
    steps,
    isLoading,
    addStep: addStep.mutate,
    updateStep: updateStep.mutate,
    deleteStep: deleteStep.mutate,
  };
}

export function useJourneyEnrollments(journeyId?: string, companyId?: string) {
  const queryClient = useQueryClient();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['journey-enrollments', journeyId, companyId],
    queryFn: async () => {
      let query = supabase
        .from('journey_enrollments')
        .select('*')
        .order('enrolled_at', { ascending: false });

      if (journeyId) query = query.eq('journey_id', journeyId);
      if (companyId) query = query.eq('company_id', companyId);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as unknown as JourneyEnrollment[];
    },
    enabled: !!journeyId || !!companyId,
  });

  const enrollCompany = useMutation({
    mutationFn: async ({
      journeyId,
      companyId,
      contactId,
      variables = {},
    }: {
      journeyId: string;
      companyId: string;
      contactId?: string;
      variables?: Record<string, any>;
    }) => {
      // Get first step
      const { data: firstStep } = await supabase
        .from('journey_steps')
        .select('id')
        .eq('journey_id', journeyId)
        .order('step_order')
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('journey_enrollments')
        .insert({
          journey_id: journeyId,
          company_id: companyId,
          contact_id: contactId,
          current_step_id: firstStep?.id,
          status: 'active',
          variables,
          step_history: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-enrollments'] });
      toast.success('Empresa inscrita en el journey');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });

  const exitEnrollment = useMutation({
    mutationFn: async ({ enrollmentId, reason }: { enrollmentId: string; reason: string }) => {
      const { error } = await supabase
        .from('journey_enrollments')
        .update({
          status: 'exited',
          exited_at: new Date().toISOString(),
          exit_reason: reason,
        })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-enrollments'] });
      toast.success('Enrollment finalizado');
    },
  });

  return {
    enrollments,
    isLoading,
    enrollCompany: enrollCompany.mutate,
    exitEnrollment: exitEnrollment.mutate,
  };
}
