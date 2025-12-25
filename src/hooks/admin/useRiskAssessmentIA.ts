import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

export interface RiskAssessment {
  id: string;
  entity_id: string;
  entity_type: 'company' | 'transaction' | 'user' | 'operation';
  overall_score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  factors: RiskFactor[];
  recommendations: string[];
  mitigations: Array<{ action: string; impact: number; effort: string }>;
  assessed_at: string;
  valid_until: string;
}

export interface RiskTrend {
  period: string;
  avg_score: number;
  high_risk_count: number;
  assessments_count: number;
}

export interface RiskAlert {
  id: string;
  entity_id: string;
  entity_name: string;
  risk_level: string;
  change: number;
  trigger: string;
  created_at: string;
}

// === HOOK ===
export function useRiskAssessmentIA() {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [trends, setTrends] = useState<RiskTrend[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === ASSESS RISK ===
  const assessRisk = useCallback(async (
    entityId: string,
    entityType: RiskAssessment['entity_type'],
    context?: Record<string, unknown>
  ): Promise<RiskAssessment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('risk-assessment-ia', {
        body: { action: 'assess', entityId, entityType, context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.assessment) {
        setAssessment(data.assessment);
        return data.assessment;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error assessing risk';
      setError(message);
      console.error('[useRiskAssessmentIA] assessRisk error:', err);
      toast.error('Error en evaluación de riesgo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === BATCH ASSESS ===
  const batchAssess = useCallback(async (
    entities: Array<{ id: string; type: RiskAssessment['entity_type'] }>
  ): Promise<RiskAssessment[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('risk-assessment-ia', {
        body: { action: 'batch_assess', entities }
      });

      if (fnError) throw fnError;

      if (data?.assessments) {
        setAssessments(data.assessments);
        return data.assessments;
      }

      return [];
    } catch (err) {
      console.error('[useRiskAssessmentIA] batchAssess error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET TRENDS ===
  const fetchTrends = useCallback(async (entityType?: string, days: number = 30): Promise<RiskTrend[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('risk-assessment-ia', {
        body: { action: 'get_trends', entityType, days }
      });

      if (fnError) throw fnError;

      if (data?.trends) {
        setTrends(data.trends);
        return data.trends;
      }

      return [];
    } catch (err) {
      console.error('[useRiskAssessmentIA] fetchTrends error:', err);
      return [];
    }
  }, []);

  // === GET ALERTS ===
  const fetchAlerts = useCallback(async (minRiskLevel?: string): Promise<RiskAlert[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('risk-assessment-ia', {
        body: { action: 'get_alerts', minRiskLevel }
      });

      if (fnError) throw fnError;

      if (data?.alerts) {
        setAlerts(data.alerts);
        return data.alerts;
      }

      return [];
    } catch (err) {
      console.error('[useRiskAssessmentIA] fetchAlerts error:', err);
      return [];
    }
  }, []);

  // === SIMULATE MITIGATION ===
  const simulateMitigation = useCallback(async (
    assessmentId: string,
    mitigations: string[]
  ): Promise<{
    original_score: number;
    projected_score: number;
    reduction_percentage: number;
  } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('risk-assessment-ia', {
        body: { action: 'simulate_mitigation', assessmentId, mitigations }
      });

      if (fnError) throw fnError;

      return data?.simulation || null;
    } catch (err) {
      console.error('[useRiskAssessmentIA] simulateMitigation error:', err);
      return null;
    }
  }, []);

  // === EXPLAIN RISK ===
  const explainRisk = useCallback(async (assessmentId: string): Promise<string | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('risk-assessment-ia', {
        body: { action: 'explain', assessmentId }
      });

      if (fnError) throw fnError;

      return data?.explanation || null;
    } catch (err) {
      console.error('[useRiskAssessmentIA] explainRisk error:', err);
      return null;
    }
  }, []);

  // === GET RISK LEVEL COLOR ===
  const getRiskLevelColor = useCallback((level: string): string => {
    const colors: Record<string, string> = {
      critical: 'text-red-600',
      high: 'text-red-500',
      medium: 'text-yellow-500',
      low: 'text-green-500',
      minimal: 'text-green-400'
    };
    return colors[level] || 'text-muted-foreground';
  }, []);

  // === GET RISK SCORE COLOR ===
  const getRiskScoreColor = useCallback((score: number): string => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-green-500';
    return 'text-green-400';
  }, []);

  return {
    assessment,
    assessments,
    trends,
    alerts,
    isLoading,
    error,
    assessRisk,
    batchAssess,
    fetchTrends,
    fetchAlerts,
    simulateMitigation,
    explainRisk,
    getRiskLevelColor,
    getRiskScoreColor,
  };
}

export default useRiskAssessmentIA;
