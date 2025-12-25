import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface PerformanceMetric {
  metric_name: string;
  current_value: number;
  target_value: number;
  previous_value: number;
  trend: 'up' | 'down' | 'stable';
  percentile_rank: number;
}

export interface CoachingInsight {
  id: string;
  category: 'strength' | 'improvement' | 'opportunity' | 'risk';
  title: string;
  description: string;
  action_items: string[];
  priority: 'high' | 'medium' | 'low';
  related_metrics: string[];
  resources?: Array<{ title: string; url: string }>;
}

export interface CoachingSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  insights_generated: number;
  actions_completed: number;
  improvement_score: number;
}

export interface GrowthPlan {
  id: string;
  title: string;
  objectives: Array<{ description: string; target_date: string; completed: boolean }>;
  milestones: Array<{ name: string; due_date: string; status: string }>;
  recommended_training: string[];
  progress_percentage: number;
}

// === HOOK ===
export function usePerformanceCoach() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [growthPlan, setGrowthPlan] = useState<GrowthPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === GET PERFORMANCE ANALYSIS ===
  const analyzePerformance = useCallback(async (userId?: string): Promise<{
    metrics: PerformanceMetric[];
    insights: CoachingInsight[];
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('performance-coach', {
        body: { action: 'analyze_performance', userId }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setMetrics(data.metrics || []);
        setInsights(data.insights || []);
        return { metrics: data.metrics || [], insights: data.insights || [] };
      }

      return { metrics: [], insights: [] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing performance';
      setError(message);
      console.error('[usePerformanceCoach] analyzePerformance error:', err);
      return { metrics: [], insights: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === START COACHING SESSION ===
  const startSession = useCallback(async (userId?: string): Promise<CoachingSession | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('performance-coach', {
        body: { action: 'start_session', userId }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.session) {
        setSessions(prev => [data.session, ...prev]);
        toast.success('Sesión de coaching iniciada');
        return data.session;
      }

      return null;
    } catch (err) {
      console.error('[usePerformanceCoach] startSession error:', err);
      toast.error('Error al iniciar sesión');
      return null;
    }
  }, []);

  // === GET GROWTH PLAN ===
  const fetchGrowthPlan = useCallback(async (userId?: string): Promise<GrowthPlan | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('performance-coach', {
        body: { action: 'get_growth_plan', userId }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.plan) {
        setGrowthPlan(data.plan);
        return data.plan;
      }

      return null;
    } catch (err) {
      console.error('[usePerformanceCoach] fetchGrowthPlan error:', err);
      return null;
    }
  }, []);

  // === GENERATE RECOMMENDATIONS ===
  const generateRecommendations = useCallback(async (
    focusAreas: string[]
  ): Promise<CoachingInsight[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('performance-coach', {
        body: { action: 'generate_recommendations', focusAreas }
      });

      if (fnError) throw fnError;

      if (data?.recommendations) {
        return data.recommendations;
      }

      return [];
    } catch (err) {
      console.error('[usePerformanceCoach] generateRecommendations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === MARK INSIGHT ACTION COMPLETE ===
  const completeAction = useCallback(async (insightId: string, actionIndex: number): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('performance-coach', {
        body: { action: 'complete_action', insightId, actionIndex }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Acción completada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[usePerformanceCoach] completeAction error:', err);
      return false;
    }
  }, []);

  // === GET PEER COMPARISON ===
  const getPeerComparison = useCallback(async (userId?: string): Promise<{
    rank: number;
    percentile: number;
    comparison: Record<string, { user: number; avg: number; top: number }>;
  } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('performance-coach', {
        body: { action: 'peer_comparison', userId }
      });

      if (fnError) throw fnError;

      return data?.comparison || null;
    } catch (err) {
      console.error('[usePerformanceCoach] getPeerComparison error:', err);
      return null;
    }
  }, []);

  // === GET CATEGORY COLOR ===
  const getCategoryColor = useCallback((category: string): string => {
    const colors: Record<string, string> = {
      strength: 'text-green-500',
      improvement: 'text-yellow-500',
      opportunity: 'text-blue-500',
      risk: 'text-red-500'
    };
    return colors[category] || 'text-muted-foreground';
  }, []);

  return {
    metrics,
    insights,
    sessions,
    growthPlan,
    isLoading,
    error,
    analyzePerformance,
    startSession,
    fetchGrowthPlan,
    generateRecommendations,
    completeAction,
    getPeerComparison,
    getCategoryColor,
  };
}

export default usePerformanceCoach;
