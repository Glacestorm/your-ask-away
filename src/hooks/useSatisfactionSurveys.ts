import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  SatisfactionSurvey, 
  SurveyCampaign, 
  SurveyResponse, 
  SurveyType,
  SurveyTrigger
} from '@/types/satisfaction';

// === ERROR TIPADO KB ===
export interface SatisfactionSurveysError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function useSatisfactionSurveys() {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<SatisfactionSurveysError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // Fetch all surveys
  const { data: surveys, isLoading: loadingSurveys } = useQuery({
    queryKey: ['satisfaction-surveys'],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('satisfaction_surveys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        setError({
          code: 'FETCH_SURVEYS_ERROR',
          message: fetchError.message,
          details: { originalError: String(fetchError) }
        });
        throw fetchError;
      }
      setLastRefresh(new Date());
      return data as SatisfactionSurvey[];
    }
  });

  // Create survey
  const createSurveyMutation = useMutation({
    mutationFn: async (survey: Partial<SatisfactionSurvey>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('satisfaction_surveys')
        .insert([{
          name: survey.name!,
          survey_type: survey.survey_type!,
          question_text: survey.question_text!,
          description: survey.description,
          follow_up_question: survey.follow_up_question,
          is_active: survey.is_active ?? true,
          trigger_type: survey.trigger_type ?? 'manual',
          trigger_config: survey.trigger_config ?? {},
          delay_hours: survey.delay_hours ?? 0,
          target_segment: survey.target_segment,
          created_by: user.user?.id
        }] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['satisfaction-surveys'] });
      toast.success('Encuesta creada correctamente');
    },
    onError: (error) => {
      toast.error(`Error al crear encuesta: ${error.message}`);
    }
  });

  // Update survey
  const updateSurveyMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SatisfactionSurvey> & { id: string }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.survey_type !== undefined) updateData.survey_type = updates.survey_type;
      if (updates.question_text !== undefined) updateData.question_text = updates.question_text;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.follow_up_question !== undefined) updateData.follow_up_question = updates.follow_up_question;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
      if (updates.trigger_config !== undefined) updateData.trigger_config = updates.trigger_config;
      if (updates.delay_hours !== undefined) updateData.delay_hours = updates.delay_hours;
      if (updates.target_segment !== undefined) updateData.target_segment = updates.target_segment;

      const { data, error } = await supabase
        .from('satisfaction_surveys')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['satisfaction-surveys'] });
      toast.success('Encuesta actualizada');
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    }
  });

  // Delete survey
  const deleteSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('satisfaction_surveys')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['satisfaction-surveys'] });
      toast.success('Encuesta eliminada');
    },
    onError: (error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    }
  });

  return {
    surveys,
    loadingSurveys,
    createSurvey: createSurveyMutation.mutateAsync,
    updateSurvey: updateSurveyMutation.mutateAsync,
    deleteSurvey: deleteSurveyMutation.mutateAsync,
    isCreating: createSurveyMutation.isPending,
    isUpdating: updateSurveyMutation.isPending,
    isDeleting: deleteSurveyMutation.isPending,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

export function useSurveyCampaigns() {
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['survey-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_campaigns')
        .select(`
          *,
          survey:satisfaction_surveys(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SurveyCampaign[];
    }
  });

  // Create campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Partial<SurveyCampaign>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('survey_campaigns')
        .insert([{
          survey_id: campaign.survey_id!,
          name: campaign.name!,
          status: campaign.status ?? 'draft',
          target_companies: campaign.target_companies ?? [],
          target_segments: campaign.target_segments ?? [],
          scheduled_at: campaign.scheduled_at,
          channel: campaign.channel ?? 'email',
          created_by: user.user?.id
        }] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-campaigns'] });
      toast.success('Campaña creada correctamente');
    },
    onError: (error) => {
      toast.error(`Error al crear campaña: ${error.message}`);
    }
  });

  // Start campaign
  const startCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('survey_campaigns')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-campaigns'] });
      toast.success('Campaña iniciada');
    },
    onError: (error) => {
      toast.error(`Error al iniciar campaña: ${error.message}`);
    }
  });

  return {
    campaigns,
    loadingCampaigns,
    createCampaign: createCampaignMutation.mutateAsync,
    startCampaign: startCampaignMutation.mutateAsync,
    isCreating: createCampaignMutation.isPending,
    isStarting: startCampaignMutation.isPending
  };
}

export function useSurveyResponses(options?: { 
  companyId?: string; 
  surveyType?: SurveyType;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  // Fetch responses
  const { data: responses, isLoading: loadingResponses, refetch } = useQuery({
    queryKey: ['survey-responses', options],
    queryFn: async () => {
      let query = supabase
        .from('survey_responses')
        .select(`
          *,
          survey:satisfaction_surveys(*),
          company:companies(id, name)
        `)
        .order('responded_at', { ascending: false });
      
      if (options?.companyId) {
        query = query.eq('company_id', options.companyId);
      }
      
      if (options?.surveyType) {
        query = query.eq('survey.survey_type', options.surveyType);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SurveyResponse[];
    }
  });

  // Submit response (for public survey forms)
  const submitResponseMutation = useMutation({
    mutationFn: async (response: Partial<SurveyResponse>) => {
      const { data, error } = await supabase
        .from('survey_responses')
        .insert([{
          survey_id: response.survey_id!,
          score: response.score!,
          campaign_id: response.campaign_id,
          company_id: response.company_id,
          contact_id: response.contact_id,
          respondent_name: response.respondent_name,
          respondent_email: response.respondent_email,
          feedback_text: response.feedback_text,
          trigger_context: response.trigger_context ?? {},
          product_id: response.product_id,
          gestor_id: response.gestor_id,
          channel: response.channel ?? 'email'
        }] as any)
        .select()
        .single();
      
      if (error) throw error;

      // Analyze sentiment if there's feedback text
      if (response.feedback_text && response.company_id) {
        try {
          await supabase.functions.invoke('analyze-sentiment', {
            body: {
              content: response.feedback_text,
              company_id: response.company_id,
              source_type: 'survey_response',
              source_id: data.id,
              gestor_id: response.gestor_id
            }
          });
        } catch (e) {
          console.error('Error analyzing sentiment:', e);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
      queryClient.invalidateQueries({ queryKey: ['nps-metrics'] });
    }
  });

  return {
    responses,
    loadingResponses,
    submitResponse: submitResponseMutation.mutateAsync,
    isSubmitting: submitResponseMutation.isPending,
    refetch
  };
}

export function useNPSMetrics(options?: {
  companyId?: string;
  gestorId?: string;
  segment?: string;
  periodType?: string;
}) {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['nps-metrics', options],
    queryFn: async () => {
      let query = supabase
        .from('nps_metrics')
        .select('*')
        .order('period_start', { ascending: false });
      
      if (options?.companyId) {
        query = query.eq('company_id', options.companyId);
      }
      
      if (options?.gestorId) {
        query = query.eq('gestor_id', options.gestorId);
      }
      
      if (options?.segment) {
        query = query.eq('segment', options.segment);
      }
      
      if (options?.periodType) {
        query = query.eq('period_type', options.periodType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Calculate aggregate stats
  const aggregateStats = metrics ? {
    totalResponses: metrics.reduce((sum, m) => sum + (m.total_responses || 0), 0),
    avgNPS: metrics.length > 0 
      ? Math.round(metrics.reduce((sum, m) => sum + (m.nps_score || 0), 0) / metrics.length)
      : null,
    totalPromoters: metrics.reduce((sum, m) => sum + (m.promoters || 0), 0),
    totalPassives: metrics.reduce((sum, m) => sum + (m.passives || 0), 0),
    totalDetractors: metrics.reduce((sum, m) => sum + (m.detractors || 0), 0),
    latestNPS: metrics[0]?.nps_score ?? null,
    trend: metrics.length >= 2 
      ? (metrics[0]?.nps_score || 0) - (metrics[1]?.nps_score || 0)
      : null
  } : null;

  return {
    metrics,
    aggregateStats,
    isLoading,
    refetch
  };
}

export default useSatisfactionSurveys;
