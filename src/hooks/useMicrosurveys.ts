import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

// Re-export for backwards compat
export type MicrosurveysError = KBError;

export interface Microsurvey {
  id: string;
  name: string;
  survey_type: string;
  question_text: string;
  options: Json;
  trigger_event: string;
  trigger_conditions: Json;
  target_segment: string | null;
  priority: number;
  cooldown_days: number;
  max_impressions_per_contact: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MicrosurveyResponse {
  id: string;
  microsurvey_id: string;
  company_id: string;
  contact_id: string | null;
  response_value: string;
  response_score: number | null;
  open_feedback: string | null;
  trigger_context: Json;
  response_time_seconds: number | null;
  responded_at: string;
  created_at: string;
}

export function useMicrosurveys() {
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

  const { data: microsurveys, isLoading } = useQuery({
    queryKey: ['microsurveys'],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        const { data, error: fetchError } = await supabase
          .from('microsurveys')
          .select('*')
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        
        collectTelemetry({
          hookName: 'useMicrosurveys',
          operationName: 'fetchMicrosurveys',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as unknown as Microsurvey[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        throw err;
      }
    },
  });

  const { data: responses, isLoading: loadingResponses } = useQuery({
    queryKey: ['microsurvey-responses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsurvey_responses')
        .select(`
          *,
          microsurvey:microsurveys(name, survey_type)
        `)
        .order('responded_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as (MicrosurveyResponse & { microsurvey: { name: string; survey_type: string } })[];
    },
  });

  const createMicrosurvey = useMutation({
    mutationFn: async (survey: Partial<Microsurvey>) => {
      const { data, error } = await supabase
        .from('microsurveys')
        .insert(survey as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsurveys'] });
      toast.success('Microencuesta creada correctamente');
    },
    onError: (error) => {
      toast.error(`Error al crear microencuesta: ${error.message}`);
    },
  });

  const submitResponse = useMutation({
    mutationFn: async (response: Partial<MicrosurveyResponse>) => {
      const { data, error } = await supabase
        .from('microsurvey_responses')
        .insert(response as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsurvey-responses'] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error: updateError } = await supabase
        .from('microsurveys')
        .update({ is_active: isActive })
        .eq('id', id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsurveys'] });
      setLastSuccess(new Date());
      toast.success('Estado actualizado');
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error: ' + kbError.message);
    },
  });

  return {
    microsurveys,
    responses,
    isLoading,
    loadingResponses,
    createMicrosurvey: createMicrosurvey.mutate,
    submitResponse: submitResponse.mutate,
    toggleActive: toggleActive.mutate,
    isCreating: createMicrosurvey.isPending,
    isSubmitting: submitResponse.isPending,
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
