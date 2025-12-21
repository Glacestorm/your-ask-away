import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface SuccessPlanObjective {
  id: string;
  title: string;
  description: string;
  target_value?: number;
  current_value?: number;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'at_risk';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface SuccessPlan {
  id: string;
  company_id?: string;
  plan_name: string;
  plan_type?: string;
  status?: string;
  objectives?: SuccessPlanObjective[];
  success_criteria?: Array<{ criterion: string; met: boolean }>;
  risk_factors?: Array<{ factor: string; severity: string; mitigation: string }>;
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  owner_id?: string;
  current_health_score?: number;
  target_health_score?: number;
  review_frequency?: string;
  next_review_date?: string;
  notes?: string;
  ai_generated?: boolean;
  ai_generation_context?: {
    segment: string;
    products: string[];
    risk_level: string;
    recommendations: string[];
  };
}

export interface SuccessPlanGoal {
  id: string;
  plan_id?: string;
  goal_title: string;
  goal_description?: string;
  goal_type?: string;
  target_metric?: string;
  target_value?: number;
  current_value?: number;
  start_value?: number;
  due_date?: string;
  status?: string;
  progress_percentage?: number;
  milestones?: Array<{ name: string; completed: boolean; date?: string }>;
  last_updated_at?: string;
  completed_at?: string;
  owner_id?: string;
  ai_recommendations?: unknown;
}

export interface QBRRecord {
  id: string;
  company_id?: string;
  success_plan_id?: string;
  quarter: string;
  year: number;
  scheduled_date?: string;
  actual_date?: string;
  status?: string;
  conducted_by?: string;
  prepared_by?: string;
  attendees?: Array<{ name: string; role: string; email?: string }>;
  agenda?: Array<{ topic: string; duration_minutes: number }>;
  achievements?: Array<{ achievement: string; impact: string }>;
  challenges?: Array<{ challenge: string; status: string; action_plan: string }>;
  metrics_reviewed?: Record<string, number>;
  health_score_at_review?: number;
  nps_at_review?: number;
  customer_satisfaction_score?: number;
  next_quarter_goals?: SuccessPlanObjective[];
  action_items?: Array<{ item: string; owner: string; due_date: string; status: string }>;
  decisions_made?: Array<{ decision: string; rationale: string }>;
  renewal_discussion?: { status: string; notes: string; next_steps: string };
  expansion_opportunities?: Array<{ opportunity: string; value: number; probability: number }>;
  customer_feedback?: string;
  notes?: string;
  ai_generated_summary?: string;
  ai_generated_recommendations?: Array<{ recommendation: string; priority: string }>;
  ai_risk_assessment?: { level: string; factors: string[]; recommendations: string[] };
  recording_url?: string;
  duration_minutes?: number;
}

export function useSuccessPlans(companyId?: string) {
  const queryClient = useQueryClient();

  // Fetch success plans
  const { data: successPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['success-plans', companyId],
    queryFn: async () => {
      let query = supabase
        .from('success_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(plan => ({
        ...plan,
        objectives: (plan.objectives as unknown as SuccessPlanObjective[]) || [],
        success_criteria: (plan.success_criteria as SuccessPlan['success_criteria']) || [],
        risk_factors: (plan.risk_factors as SuccessPlan['risk_factors']) || [],
        ai_generation_context: (plan.ai_generation_context as SuccessPlan['ai_generation_context']),
      })) as SuccessPlan[];
    },
  });

  // Fetch goals for a plan
  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ['success-plan-goals', companyId],
    queryFn: async () => {
      if (!successPlans?.length) return [];

      const planIds = successPlans.map(p => p.id);
      const { data, error } = await supabase
        .from('success_plan_goals')
        .select('*')
        .in('plan_id', planIds)
        .order('due_date');

      if (error) throw error;
      return data.map(goal => ({
        ...goal,
        goal_title: goal.goal_title,
        milestones: (goal.milestones as SuccessPlanGoal['milestones']) || [],
      })) as SuccessPlanGoal[];
    },
    enabled: !!successPlans?.length,
  });

  // Fetch QBR records
  const { data: qbrRecords, isLoading: loadingQBRs } = useQuery({
    queryKey: ['qbr-records', companyId],
    queryFn: async () => {
      let query = supabase
        .from('qbr_records')
        .select('*')
        .order('year', { ascending: false })
        .order('quarter', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map(qbr => ({
        ...qbr,
        attendees: (qbr.attendees as unknown as QBRRecord['attendees']) || [],
        agenda: (qbr.agenda as unknown as QBRRecord['agenda']) || [],
        achievements: (qbr.achievements as unknown as QBRRecord['achievements']) || [],
        challenges: (qbr.challenges as unknown as QBRRecord['challenges']) || [],
        metrics_reviewed: (qbr.metrics_reviewed as unknown as Record<string, number>) || {},
        next_quarter_goals: (qbr.next_quarter_goals as unknown as SuccessPlanObjective[]) || [],
        action_items: (qbr.action_items as unknown as QBRRecord['action_items']) || [],
        decisions_made: (qbr.decisions_made as unknown as QBRRecord['decisions_made']) || [],
        renewal_discussion: (qbr.renewal_discussion as unknown as QBRRecord['renewal_discussion']),
        expansion_opportunities: (qbr.expansion_opportunities as unknown as QBRRecord['expansion_opportunities']) || [],
        ai_generated_recommendations: (qbr.ai_generated_recommendations as unknown as QBRRecord['ai_generated_recommendations']) || [],
        ai_risk_assessment: (qbr.ai_risk_assessment as unknown as QBRRecord['ai_risk_assessment']),
      })) as QBRRecord[];
    },
  });

  // Generate AI success plan
  const generateSuccessPlan = useMutation({
    mutationFn: async (targetCompanyId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-success-plan', {
        body: { companyId: targetCompanyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-plans'] });
      toast.success('✨ Plan de éxito generado con IA');
    },
    onError: (error) => {
      toast.error(`Error al generar plan: ${error.message}`);
    },
  });

  // Create manual success plan
  const createSuccessPlan = useMutation({
    mutationFn: async (plan: Partial<SuccessPlan>) => {
      const { data, error } = await supabase
        .from('success_plans')
        .insert({
          company_id: plan.company_id,
          plan_name: plan.plan_name || 'Nuevo Plan de Éxito',
          plan_type: plan.plan_type || 'standard',
          status: 'active',
          objectives: (plan.objectives || []) as unknown as Json,
          success_criteria: (plan.success_criteria || []) as unknown as Json,
          risk_factors: (plan.risk_factors || []) as unknown as Json,
          start_date: plan.start_date || new Date().toISOString(),
          target_completion_date: plan.target_completion_date,
          owner_id: plan.owner_id,
          current_health_score: plan.current_health_score || 70,
          target_health_score: plan.target_health_score || 85,
          review_frequency: plan.review_frequency || 'quarterly',
          ai_generated: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-plans'] });
      toast.success('Plan de éxito creado');
    },
    onError: (error) => {
      toast.error(`Error al crear plan: ${error.message}`);
    },
  });

  // Update success plan
  const updateSuccessPlan = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: Partial<SuccessPlan> }) => {
      const { data, error } = await supabase
        .from('success_plans')
        .update({
          ...updates,
          objectives: updates.objectives as unknown as Json,
          success_criteria: updates.success_criteria as unknown as Json,
          risk_factors: updates.risk_factors as unknown as Json,
          ai_generation_context: updates.ai_generation_context as unknown as Json,
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-plans'] });
      toast.success('Plan actualizado');
    },
  });

  // Add goal to plan
  const addGoal = useMutation({
    mutationFn: async (goal: Partial<SuccessPlanGoal>) => {
      const { data, error } = await supabase
        .from('success_plan_goals')
        .insert({
          plan_id: goal.plan_id,
          goal_title: goal.goal_title || 'Nuevo Objetivo',
          goal_description: goal.goal_description,
          goal_type: goal.goal_type || 'growth',
          target_metric: goal.target_metric,
          target_value: goal.target_value,
          current_value: goal.current_value || 0,
          start_value: goal.start_value || 0,
          due_date: goal.due_date,
          status: 'pending',
          progress_percentage: 0,
          milestones: (goal.milestones || []) as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-plan-goals'] });
      toast.success('Objetivo añadido');
    },
  });

  // Update goal progress
  const updateGoalProgress = useMutation({
    mutationFn: async ({
      goalId,
      currentValue,
      status,
    }: {
      goalId: string;
      currentValue: number;
      status?: string;
    }) => {
      const goal = goals?.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const targetValue = goal.target_value || 100;
      const startValue = goal.start_value || 0;
      const progress = Math.min(100, Math.round(((currentValue - startValue) / (targetValue - startValue)) * 100));
      const isAchieved = currentValue >= targetValue;

      const { data, error } = await supabase
        .from('success_plan_goals')
        .update({
          current_value: currentValue,
          progress_percentage: progress,
          status: isAchieved ? 'achieved' : status || goal.status,
          last_updated_at: new Date().toISOString(),
          achieved_at: isAchieved ? new Date().toISOString() : null,
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return { data, isAchieved };
    },
    onSuccess: ({ isAchieved }) => {
      queryClient.invalidateQueries({ queryKey: ['success-plan-goals'] });
      if (isAchieved) {
        toast.success('🎯 ¡Objetivo alcanzado!');
      } else {
        toast.success('Progreso actualizado');
      }
    },
  });

  // Generate QBR with AI
  const generateQBR = useMutation({
    mutationFn: async ({
      companyId,
      quarter,
      year,
    }: {
      companyId: string;
      quarter: string;
      year: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-qbr', {
        body: { companyId, quarter, year },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qbr-records'] });
      toast.success('📊 QBR generado con IA');
    },
    onError: (error) => {
      toast.error(`Error al generar QBR: ${error.message}`);
    },
  });

  // Schedule QBR
  const scheduleQBR = useMutation({
    mutationFn: async (qbr: Partial<QBRRecord>) => {
      const { data, error } = await supabase
        .from('qbr_records')
        .insert({
          company_id: qbr.company_id,
          success_plan_id: qbr.success_plan_id,
          quarter: qbr.quarter || 'Q1',
          year: qbr.year || new Date().getFullYear(),
          scheduled_date: qbr.scheduled_date,
          status: 'scheduled',
          prepared_by: qbr.prepared_by,
          attendees: (qbr.attendees || []) as unknown as Json,
          agenda: (qbr.agenda || []) as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qbr-records'] });
      toast.success('QBR programado');
    },
  });

  // Complete QBR
  const completeQBR = useMutation({
    mutationFn: async ({
      qbrId,
      data: qbrData,
    }: {
      qbrId: string;
      data: Partial<QBRRecord>;
    }) => {
      const { data, error } = await supabase
        .from('qbr_records')
        .update({
          ...qbrData,
          status: 'completed',
          actual_date: new Date().toISOString(),
          attendees: qbrData.attendees as unknown as Json,
          agenda: qbrData.agenda as unknown as Json,
          achievements: qbrData.achievements as unknown as Json,
          challenges: qbrData.challenges as unknown as Json,
          metrics_reviewed: qbrData.metrics_reviewed as unknown as Json,
          next_quarter_goals: qbrData.next_quarter_goals as unknown as Json,
          action_items: qbrData.action_items as unknown as Json,
          decisions_made: qbrData.decisions_made as unknown as Json,
          renewal_discussion: qbrData.renewal_discussion as unknown as Json,
          expansion_opportunities: qbrData.expansion_opportunities as unknown as Json,
          ai_generated_recommendations: qbrData.ai_generated_recommendations as unknown as Json,
          ai_risk_assessment: qbrData.ai_risk_assessment as unknown as Json,
        })
        .eq('id', qbrId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qbr-records'] });
      toast.success('QBR completado');
    },
  });

  // Get upcoming QBRs
  const getUpcomingQBRs = () => {
    if (!qbrRecords) return [];
    
    const now = new Date();
    return qbrRecords.filter(qbr => {
      if (qbr.status === 'completed') return false;
      if (!qbr.scheduled_date) return true;
      return new Date(qbr.scheduled_date) >= now;
    });
  };

  // Get overdue goals
  const getOverdueGoals = () => {
    if (!goals) return [];
    
    const now = new Date();
    return goals.filter(goal => {
      if (goal.status === 'achieved') return false;
      if (!goal.due_date) return false;
      return new Date(goal.due_date) < now;
    });
  };

  // Calculate plan health
  const calculatePlanHealth = (planId: string) => {
    const plan = successPlans?.find(p => p.id === planId);
    const planGoals = goals?.filter(g => g.plan_id === planId);
    
    if (!plan || !planGoals?.length) return null;

    const achievedGoals = planGoals.filter(g => g.status === 'achieved').length;
    const atRiskGoals = planGoals.filter(g => g.status === 'at_risk').length;
    const avgProgress = planGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / planGoals.length;

    return {
      goalCompletion: (achievedGoals / planGoals.length) * 100,
      avgProgress,
      atRiskCount: atRiskGoals,
      healthScore: Math.round(avgProgress * 0.6 + (achievedGoals / planGoals.length) * 40),
    };
  };

  return {
    successPlans,
    goals,
    qbrRecords,
    loadingPlans,
    loadingGoals,
    loadingQBRs,
    generateSuccessPlan: generateSuccessPlan.mutate,
    isGeneratingPlan: generateSuccessPlan.isPending,
    createSuccessPlan: createSuccessPlan.mutate,
    updateSuccessPlan: updateSuccessPlan.mutate,
    addGoal: addGoal.mutate,
    updateGoalProgress: updateGoalProgress.mutate,
    generateQBR: generateQBR.mutate,
    isGeneratingQBR: generateQBR.isPending,
    scheduleQBR: scheduleQBR.mutate,
    completeQBR: completeQBR.mutate,
    getUpcomingQBRs,
    getOverdueGoals,
    calculatePlanHealth,
  };
}
