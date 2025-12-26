/**
 * usePredictiveHealthScore Hook
 * Fase 11 - Enterprise SaaS 2025-2026
 * Health Score predictivo con ML para Customer Success
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CustomerHealthScore {
  id: string;
  customerId: string;
  customerName: string;
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  components: {
    usage: number;
    engagement: number;
    satisfaction: number;
    support: number;
    financial: number;
  };
  predictedChurn: number;
  predictedExpansion: number;
  lastUpdated: string;
}

export interface HealthInsight {
  id: string;
  customerId: string;
  insightType: 'risk' | 'opportunity' | 'milestone' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestedAction: string;
  deadline?: string;
  createdAt: string;
}

export interface HealthTrend {
  date: string;
  averageScore: number;
  atRiskCount: number;
  healthyCount: number;
  improvingCount: number;
  decliningCount: number;
}

export interface HealthScoreContext {
  organizationId?: string;
  segment?: string;
  riskLevel?: string[];
  dateRange?: { start: string; end: string };
}

// === HOOK ===
export function usePredictiveHealthScore() {
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<CustomerHealthScore[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [summary, setSummary] = useState<{
    averageScore: number;
    atRiskCount: number;
    healthyCount: number;
    churnPrediction: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH HEALTH SCORES ===
  const fetchHealthScores = useCallback(async (context?: HealthScoreContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'predictive-health-score',
        {
          body: {
            action: 'get_health_dashboard',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setScores(fnData.data?.scores || []);
        setInsights(fnData.data?.insights || []);
        setTrends(fnData.data?.trends || []);
        setSummary(fnData.data?.summary || null);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from health score service');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[usePredictiveHealthScore] fetchHealthScores error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RECALCULATE SCORE ===
  const recalculateScore = useCallback(async (customerId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'predictive-health-score',
        {
          body: {
            action: 'recalculate_score',
            params: { customerId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        const updatedScore = fnData.data?.score;
        if (updatedScore) {
          setScores(prev => prev.map(score => 
            score.customerId === customerId ? updatedScore : score
          ));
        }
        toast.success('Score recalculado');
        return updatedScore;
      }

      return null;
    } catch (err) {
      console.error('[usePredictiveHealthScore] recalculateScore error:', err);
      toast.error('Error al recalcular score');
      return null;
    }
  }, []);

  // === RUN PREDICTION ===
  const runChurnPrediction = useCallback(async (customerId?: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'predictive-health-score',
        {
          body: {
            action: 'run_churn_prediction',
            params: { customerId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Predicción de churn ejecutada');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[usePredictiveHealthScore] runChurnPrediction error:', err);
      toast.error('Error al ejecutar predicción');
      return null;
    }
  }, []);

  // === GENERATE PLAYBOOK ===
  const generatePlaybook = useCallback(async (customerId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'predictive-health-score',
        {
          body: {
            action: 'generate_playbook',
            params: { customerId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Playbook generado con IA');
        return fnData.data?.playbook;
      }

      return null;
    } catch (err) {
      console.error('[usePredictiveHealthScore] generatePlaybook error:', err);
      toast.error('Error al generar playbook');
      return null;
    }
  }, []);

  // === DISMISS INSIGHT ===
  const dismissInsight = useCallback(async (insightId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'predictive-health-score',
        {
          body: {
            action: 'dismiss_insight',
            params: { insightId }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setInsights(prev => prev.filter(insight => insight.id !== insightId));
        return true;
      }

      return false;
    } catch (err) {
      console.error('[usePredictiveHealthScore] dismissInsight error:', err);
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: HealthScoreContext, intervalMs = 90000) => {
    stopAutoRefresh();
    fetchHealthScores(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchHealthScores(context);
    }, intervalMs);
  }, [fetchHealthScores]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    scores,
    insights,
    trends,
    summary,
    error,
    lastRefresh,
    fetchHealthScores,
    recalculateScore,
    runChurnPrediction,
    generatePlaybook,
    dismissInsight,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default usePredictiveHealthScore;
