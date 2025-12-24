import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCelebration } from './useCelebration';
import { Json } from '@/integrations/supabase/types';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, collectTelemetry } from '@/hooks/core/useKBBase';

// === ERROR TIPADO KB 2.0 ===
export type OnboardingError = KBError;

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action_type: 'task' | 'video' | 'quiz' | 'integration' | 'demo';
  action_url?: string;
  points: number;
  estimated_minutes: number;
  badge_reward?: string;
  dependencies?: string[];
  celebration_type?: 'confetti' | 'stars' | 'fireworks';
}

export interface OnboardingTemplate {
  id: string;
  template_name: string;
  segment_type: string;
  description?: string;
  steps: OnboardingStep[];
  product_keys?: string[];
  gamification_config?: {
    total_points: number;
    badges: string[];
    streak_bonus: number;
    completion_reward: string;
  };
  estimated_total_minutes?: number;
  is_active?: boolean;
  version?: number;
}

export interface OnboardingProgress {
  id: string;
  company_id?: string;
  template_id?: string;
  status?: string;
  progress_percentage?: number;
  completed_steps?: Record<string, { completed_at: string; points_earned: number }>;
  current_step_id?: string;
  started_at?: string;
  completed_at?: string;
  total_points_earned?: number;
  badges_earned?: string[];
  stalled_at?: string;
  stall_reason?: string;
  last_activity_at?: string;
  celebration_triggered?: boolean;
  estimated_completion_date?: string;
  actual_time_spent_minutes?: number;
  skipped_steps?: string[];
  assigned_to?: string;
}

export function useOnboarding(companyId?: string) {
  const queryClient = useQueryClient();
  const { celebrateGoalAchievement, fireCelebration, fireStarBurst } = useCelebration();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
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

  // Fetch available templates
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['onboarding-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .eq('is_active', true)
        .order('segment_type');

      if (error) throw error;
      return data.map(t => ({
        ...t,
        steps: (t.steps as unknown as OnboardingStep[]) || [],
        gamification_config: t.gamification_config as OnboardingTemplate['gamification_config'],
      })) as OnboardingTemplate[];
    },
  });

  // Fetch progress for a company
  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['onboarding-progress', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('onboarding_progress')
        .select(`
          *,
          onboarding_templates (*)
        `)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const template = data.onboarding_templates ? {
        ...data.onboarding_templates,
        steps: (data.onboarding_templates.steps as unknown as OnboardingStep[]) || [],
        gamification_config: data.onboarding_templates.gamification_config as OnboardingTemplate['gamification_config'],
      } : null;

      return {
        ...data,
        completed_steps: (data.completed_steps as Record<string, { completed_at: string; points_earned: number }>) || {},
        onboarding_templates: template,
      } as OnboardingProgress & { onboarding_templates: OnboardingTemplate | null };
    },
    enabled: !!companyId,
  });

  // Start onboarding for a company
  const startOnboarding = useMutation({
    mutationFn: async ({ companyId, templateId }: { companyId: string; templateId: string }) => {
      const template = templates?.find(t => t.id === templateId);
      const estimatedDays = template?.estimated_total_minutes 
        ? Math.ceil(template.estimated_total_minutes / 60 / 2) // 2 hours per day estimate
        : 14;

      const estimatedCompletion = new Date();
      estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedDays);

      const { data, error } = await supabase
        .from('onboarding_progress')
        .insert({
          company_id: companyId,
          template_id: templateId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString(),
          completed_steps: {},
          total_points_earned: 0,
          badges_earned: [],
          estimated_completion_date: estimatedCompletion.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      toast.success('¡Onboarding iniciado! Comienza tu viaje de activación');
      fireCelebration();
    },
    onError: (error) => {
      toast.error(`Error al iniciar onboarding: ${error.message}`);
    },
  });

  // Complete a step with gamification
  const completeStep = useMutation({
    mutationFn: async ({ 
      progressId, 
      stepId, 
      pointsEarned,
      badgeEarned,
      celebrationType
    }: { 
      progressId: string; 
      stepId: string; 
      pointsEarned: number;
      badgeEarned?: string;
      celebrationType?: 'confetti' | 'stars' | 'fireworks';
    }) => {
      const currentProgress = progress;
      if (!currentProgress) throw new Error('No progress found');

      const completedSteps = {
        ...(currentProgress.completed_steps || {}),
        [stepId]: {
          completed_at: new Date().toISOString(),
          points_earned: pointsEarned,
        },
      };

      const template = templates?.find(t => t.id === currentProgress.template_id);
      const totalSteps = template?.steps?.length || 1;
      const completedCount = Object.keys(completedSteps).length;
      const newPercentage = Math.round((completedCount / totalSteps) * 100);
      const newTotalPoints = (currentProgress.total_points_earned || 0) + pointsEarned;
      
      const newBadges = badgeEarned 
        ? [...(currentProgress.badges_earned || []), badgeEarned]
        : currentProgress.badges_earned;

      const isCompleted = newPercentage >= 100;

      const { data, error } = await supabase
        .from('onboarding_progress')
        .update({
          completed_steps: completedSteps as unknown as Json,
          progress_percentage: newPercentage,
          total_points_earned: newTotalPoints,
          badges_earned: newBadges,
          last_activity_at: new Date().toISOString(),
          actual_time_spent_minutes: (currentProgress.actual_time_spent_minutes || 0) + 5,
          status: isCompleted ? 'completed' : 'in_progress',
          completed_at: isCompleted ? new Date().toISOString() : null,
          celebration_triggered: isCompleted,
        })
        .eq('id', progressId)
        .select()
        .single();

      if (error) throw error;
      return { data, celebrationType, isCompleted, badgeEarned };
    },
    onSuccess: ({ celebrationType, isCompleted, badgeEarned }) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      
      // Trigger celebration based on type
      if (celebrationType === 'stars') {
        fireStarBurst();
      } else if (celebrationType === 'fireworks' || isCompleted) {
        celebrateGoalAchievement(`onboarding-${Date.now()}`);
      } else {
        fireCelebration();
      }

      if (badgeEarned) {
        toast.success(`🏆 ¡Badge desbloqueado: ${badgeEarned}!`);
      } else if (isCompleted) {
        toast.success('🎉 ¡Onboarding completado! Has desbloqueado todo el potencial');
      } else {
        toast.success('✅ ¡Paso completado! Sigue avanzando');
      }
    },
    onError: (error) => {
      toast.error(`Error al completar paso: ${error.message}`);
    },
  });

  // Skip a step
  const skipStep = useMutation({
    mutationFn: async ({ progressId, stepId, reason }: { progressId: string; stepId: string; reason?: string }) => {
      const currentProgress = progress;
      if (!currentProgress) throw new Error('No progress found');

      const skippedSteps = [...(currentProgress.skipped_steps || []), stepId];

      const { data, error } = await supabase
        .from('onboarding_progress')
        .update({
          skipped_steps: skippedSteps,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', progressId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      toast.info('Paso omitido. Puedes volver a él más tarde');
    },
  });

  // Mark as stalled (for intervention)
  const markStalled = useMutation({
    mutationFn: async ({ progressId, reason }: { progressId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .update({
          status: 'stalled',
          stalled_at: new Date().toISOString(),
          stall_reason: reason,
        })
        .eq('id', progressId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });

  // Get recommended template based on company segment
  const getRecommendedTemplate = (segmentType: string, productKeys?: string[]) => {
    if (!templates) return null;

    // Find exact match by segment
    let recommended = templates.find(t => t.segment_type === segmentType);
    
    // If no exact match, find by product keys
    if (!recommended && productKeys?.length) {
      recommended = templates.find(t => 
        t.product_keys?.some(pk => productKeys.includes(pk))
      );
    }

    // Fallback to default template
    if (!recommended) {
      recommended = templates.find(t => t.segment_type === 'default');
    }

    return recommended;
  };

  // Calculate next step
  const getNextStep = (): OnboardingStep | null => {
    if (!progress || !templates) return null;

    const template = templates.find(t => t.id === progress.template_id);
    if (!template?.steps) return null;

    const completedSteps = progress.completed_steps || {};
    const skippedSteps = progress.skipped_steps || [];

    return template.steps.find(step => 
      !completedSteps[step.id] && !skippedSteps.includes(step.id)
    ) || null;
  };

  // Calculate streak
  const calculateStreak = (): number => {
    if (!progress?.completed_steps) return 0;

    const completedDates = Object.values(progress.completed_steps)
      .map(s => new Date(s.completed_at).toDateString())
      .sort()
      .reverse();

    if (completedDates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();

    for (const dateStr of completedDates) {
      const stepDate = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - stepDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = stepDate;
      } else {
        break;
      }
    }

    return streak;
  };

  return {
    templates,
    progress,
    loadingTemplates,
    loadingProgress,
    startOnboarding: startOnboarding.mutate,
    isStarting: startOnboarding.isPending,
    completeStep: completeStep.mutate,
    isCompletingStep: completeStep.isPending,
    skipStep: skipStep.mutate,
    markStalled: markStalled.mutate,
    getRecommendedTemplate,
    getNextStep,
    calculateStreak,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading: isLoading || loadingTemplates || loadingProgress,
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
