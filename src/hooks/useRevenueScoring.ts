import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RevenueScore {
  id: string;
  company_id: string;
  score_date: string;
  overall_score: number;
  health_score: number;
  expansion_score: number;
  retention_score: number;
  engagement_score: number;
  satisfaction_score: number | null;
  growth_potential_score: number | null;
  risk_score: number | null;
  prioritization_quadrant: string | null;
  recommended_action: string | null;
  action_priority: number | null;
  score_factors: Record<string, unknown> | null;
  score_trend: string | null;
  trend_velocity: number | null;
  ai_recommendation: string | null;
  next_best_action: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string };
}

export const useRevenueScoring = () => {
  const queryClient = useQueryClient();

  const { data: scores, isLoading, refetch } = useQuery({
    queryKey: ['revenue-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_scores')
        .select(`
          *,
          company:companies(name)
        `)
        .order('score_date', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as RevenueScore[];
    }
  });

  const calculateScoreMutation = useMutation({
    mutationFn: async (params: { 
      companyId: string;
      metrics: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('calculate-revenue-score', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-scores'] });
      toast.success('Puntuación calculada');
    },
    onError: (error) => {
      toast.error('Error al calcular puntuación: ' + error.message);
    }
  });

  const getLatestScoreByCompany = (companyId: string) => {
    return scores?.find(s => s.company_id === companyId);
  };

  const getScoresByTrend = (trend: string) => {
    return scores?.filter(s => s.score_trend === trend) || [];
  };

  const getTopPerformers = (limit: number = 10) => {
    if (!scores) return [];
    const uniqueCompanies = new Map<string, RevenueScore>();
    scores.forEach(s => {
      if (!uniqueCompanies.has(s.company_id)) {
        uniqueCompanies.set(s.company_id, s);
      }
    });
    return Array.from(uniqueCompanies.values())
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, limit);
  };

  const getAtRiskAccounts = (threshold: number = 50) => {
    if (!scores) return [];
    const uniqueCompanies = new Map<string, RevenueScore>();
    scores.forEach(s => {
      if (!uniqueCompanies.has(s.company_id) && s.overall_score < threshold) {
        uniqueCompanies.set(s.company_id, s);
      }
    });
    return Array.from(uniqueCompanies.values());
  };

  const getAverageScores = () => {
    if (!scores || scores.length === 0) return null;
    const latestScores = new Map<string, RevenueScore>();
    scores.forEach(s => {
      if (!latestScores.has(s.company_id)) {
        latestScores.set(s.company_id, s);
      }
    });
    const values = Array.from(latestScores.values());
    return {
      overall: values.reduce((sum, s) => sum + s.overall_score, 0) / values.length,
      health: values.reduce((sum, s) => sum + s.health_score, 0) / values.length,
      expansion: values.reduce((sum, s) => sum + s.expansion_score, 0) / values.length,
      retention: values.reduce((sum, s) => sum + s.retention_score, 0) / values.length,
      engagement: values.reduce((sum, s) => sum + s.engagement_score, 0) / values.length
    };
  };

  const getScoreDistribution = () => {
    if (!scores) return [];
    const buckets = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 }
    ];
    
    const latestScores = new Map<string, number>();
    scores.forEach(s => {
      if (!latestScores.has(s.company_id)) {
        latestScores.set(s.company_id, s.overall_score);
      }
    });

    latestScores.forEach(score => {
      if (score <= 20) buckets[0].count++;
      else if (score <= 40) buckets[1].count++;
      else if (score <= 60) buckets[2].count++;
      else if (score <= 80) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  };

  const getByQuadrant = (quadrant: string) => {
    return scores?.filter(s => s.prioritization_quadrant === quadrant) || [];
  };

  return {
    scores,
    isLoading,
    refetch,
    calculateScore: calculateScoreMutation.mutateAsync,
    isCalculating: calculateScoreMutation.isPending,
    getLatestScoreByCompany,
    getScoresByTrend,
    getTopPerformers,
    getAtRiskAccounts,
    getAverageScores,
    getScoreDistribution,
    getByQuadrant
  };
};
