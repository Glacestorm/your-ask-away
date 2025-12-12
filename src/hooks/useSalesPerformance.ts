import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SalesQuota {
  id: string;
  gestor_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  target_value: number;
  actual_value: number;
  target_visits: number;
  actual_visits: number;
  target_new_clients: number;
  actual_new_clients: number;
  target_products_sold: number;
  actual_products_sold: number;
  achievement_percentage: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesAchievement {
  id: string;
  gestor_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string | null;
  points: number;
  badge_icon: string | null;
  badge_color: string | null;
  unlocked_at: string;
  quota_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SalesLeaderboardEntry {
  id: string;
  gestor_id: string;
  period_type: string;
  period_start: string;
  rank_position: number;
  total_points: number;
  total_value: number;
  total_visits: number;
  total_deals_won: number;
  achievements_count: number;
  streak_days: number;
  badges: unknown[];
  previous_rank: number | null;
  rank_change: number;
  calculated_at: string;
  gestor?: {
    full_name: string;
    avatar_url: string | null;
    oficina: string | null;
  };
}

export interface RevenueSignal {
  id: string;
  signal_type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  gestor_id: string | null;
  office: string | null;
  confidence_score: number;
  potential_value: number;
  recommended_action: string | null;
  ai_analysis: Record<string, unknown>;
  is_read: boolean;
  is_actioned: boolean;
  actioned_at: string | null;
  actioned_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AITask {
  id: string;
  task_type: string;
  priority: number;
  target_gestor_id: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  task_title: string;
  task_description: string | null;
  suggested_action: string | null;
  ai_reasoning: string | null;
  estimated_value: number;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'expired';
  completed_at: string | null;
  completed_by: string | null;
  result_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineSnapshot {
  id: string;
  snapshot_date: string;
  gestor_id: string | null;
  office: string | null;
  total_opportunities: number;
  total_value: number;
  by_stage: Record<string, unknown>;
  avg_deal_age_days: number;
  avg_deal_value: number;
  conversion_rate: number;
  win_rate: number;
  velocity_score: number;
  health_score: number;
  created_at: string;
}

export function useSalesQuotas(gestorId?: string, periodType?: string) {
  return useQuery({
    queryKey: ['sales-quotas', gestorId, periodType],
    queryFn: async () => {
      let query = supabase
        .from('sales_quotas')
        .select('*')
        .order('period_start', { ascending: false });

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }
      if (periodType) {
        query = query.eq('period_type', periodType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SalesQuota[];
    }
  });
}

export function useSalesAchievements(gestorId?: string) {
  return useQuery({
    queryKey: ['sales-achievements', gestorId],
    queryFn: async () => {
      let query = supabase
        .from('sales_achievements')
        .select('*')
        .order('unlocked_at', { ascending: false });

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as SalesAchievement[];
    }
  });
}

export function useSalesLeaderboard(periodType: string = 'monthly') {
  return useQuery({
    queryKey: ['sales-leaderboard', periodType],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sales_leaderboard')
        .select(`
          *,
          gestor:profiles!sales_leaderboard_gestor_id_fkey(full_name, avatar_url, oficina)
        `)
        .eq('period_type', periodType)
        .gte('period_start', startOfMonth.toISOString().split('T')[0])
        .order('rank_position', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as SalesLeaderboardEntry[];
    }
  });
}

export function useRevenueSignals(gestorId?: string, unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ['revenue-signals', gestorId, unreadOnly],
    queryFn: async () => {
      let query = supabase
        .from('revenue_signals')
        .select('*')
        .order('created_at', { ascending: false });

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as RevenueSignal[];
    }
  });
}

export function useAITasks(gestorId?: string, status?: string) {
  return useQuery({
    queryKey: ['ai-tasks', gestorId, status],
    queryFn: async () => {
      let query = supabase
        .from('ai_task_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (gestorId) {
        query = query.eq('target_gestor_id', gestorId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as AITask[];
    }
  });
}

export function usePipelineSnapshots(gestorId?: string, office?: string) {
  return useQuery({
    queryKey: ['pipeline-snapshots', gestorId, office],
    queryFn: async () => {
      let query = supabase
        .from('pipeline_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false });

      if (gestorId) {
        query = query.eq('gestor_id', gestorId);
      }
      if (office) {
        query = query.eq('office', office);
      }

      const { data, error } = await query.limit(30);
      if (error) throw error;
      return data as PipelineSnapshot[];
    }
  });
}

export function useSalesPerformanceMutations() {
  const queryClient = useQueryClient();

  const markSignalRead = useMutation({
    mutationFn: async (signalId: string) => {
      const { error } = await supabase
        .from('revenue_signals')
        .update({ is_read: true })
        .eq('id', signalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-signals'] });
    }
  });

  const actionSignal = useMutation({
    mutationFn: async ({ signalId, userId }: { signalId: string; userId: string }) => {
      const { error } = await supabase
        .from('revenue_signals')
        .update({ 
          is_actioned: true, 
          actioned_at: new Date().toISOString(),
          actioned_by: userId 
        })
        .eq('id', signalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-signals'] });
      toast.success('Señal marcada como accionada');
    }
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ 
      taskId, 
      status, 
      userId, 
      notes 
    }: { 
      taskId: string; 
      status: string; 
      userId: string;
      notes?: string;
    }) => {
      const updates: Record<string, unknown> = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = userId;
      }
      if (notes) {
        updates.result_notes = notes;
      }

      const { error } = await supabase
        .from('ai_task_queue')
        .update(updates)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tasks'] });
      toast.success('Tarea actualizada');
    }
  });

  const createQuota = useMutation({
    mutationFn: async (quota: {
      gestor_id: string;
      period_type: string;
      period_start: string;
      period_end: string;
      target_value: number;
      target_visits?: number;
      target_new_clients?: number;
      target_products_sold?: number;
    }) => {
      const { data, error } = await supabase
        .from('sales_quotas')
        .insert({
          ...quota,
          actual_value: 0,
          actual_visits: 0,
          actual_new_clients: 0,
          actual_products_sold: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
      toast.success('Objetivo creado correctamente');
    }
  });

  return {
    markSignalRead,
    actionSignal,
    updateTaskStatus,
    createQuota
  };
}

export function useCalculateSalesPerformance() {
  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = async () => {
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-sales-performance', {
        body: { calculateAll: true }
      });
      
      if (error) throw error;
      toast.success('Rendimiento de ventas calculado');
      return data;
    } catch (error) {
      console.error('Error calculating sales performance:', error);
      toast.error('Error al calcular el rendimiento');
      throw error;
    } finally {
      setIsCalculating(false);
    }
  };

  return { calculate, isCalculating };
}
