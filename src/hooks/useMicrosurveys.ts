import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// === ERROR TIPADO KB ===
export interface MicrosurveysError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  // === ESTADO KB ===
  const [error, setError] = useState<MicrosurveysError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: microsurveys, isLoading } = useQuery({
    queryKey: ['microsurveys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsurveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Microsurvey[];
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
      const { error } = await supabase
        .from('microsurveys')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsurveys'] });
      toast.success('Estado actualizado');
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
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}
