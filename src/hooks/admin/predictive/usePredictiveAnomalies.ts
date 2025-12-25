import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Anomaly {
  id: string;
  anomaly_type: 'revenue' | 'usage' | 'behavior' | 'security' | 'performance' | 'cost';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  metric_name: string;
  expected_value: number;
  actual_value: number;
  deviation_percentage: number;
  confidence: number;
  root_cause_analysis: RootCause[];
  recommended_actions: AnomalyAction[];
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

export interface RootCause {
  cause: string;
  probability: number;
  evidence: string[];
  related_anomalies: string[];
}

export interface AnomalyAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  automated: boolean;
  estimated_time_minutes: number;
}

export interface AnomalyStats {
  total_detected: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  false_positive_rate: number;
  avg_resolution_time_hours: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface AnomalyPattern {
  pattern_id: string;
  pattern_name: string;
  frequency: number;
  typical_severity: string;
  common_causes: string[];
  auto_resolution_possible: boolean;
}

export function usePredictiveAnomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [stats, setStats] = useState<AnomalyStats | null>(null);
  const [patterns, setPatterns] = useState<AnomalyPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monitorInterval = useRef<NodeJS.Timeout | null>(null);

  const detectAnomalies = useCallback(async (scope?: {
    entity_types?: string[];
    time_range_hours?: number;
    min_severity?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-anomalies', {
        body: { action: 'detect', scope }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setAnomalies(data.anomalies || []);
        setStats(data.stats || null);
        return data;
      }

      throw new Error(data?.error || 'Anomaly detection failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Error en detección de anomalías');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeAnomaly = useCallback(async (anomalyId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-anomalies', {
        body: { action: 'analyze', anomaly_id: anomalyId }
      });

      if (fnError) throw fnError;
      return data?.analysis || null;
    } catch (err) {
      console.error('[usePredictiveAnomalies] analyzeAnomaly error:', err);
      return null;
    }
  }, []);

  const updateAnomalyStatus = useCallback(async (
    anomalyId: string,
    status: Anomaly['status'],
    notes?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-anomalies', {
        body: { action: 'update_status', anomaly_id: anomalyId, status, notes }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setAnomalies(prev => prev.map(a => 
          a.id === anomalyId ? { ...a, status } : a
        ));
        toast.success('Estado actualizado');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[usePredictiveAnomalies] updateAnomalyStatus error:', err);
      toast.error('Error al actualizar estado');
      return false;
    }
  }, []);

  const getPatterns = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-anomalies', {
        body: { action: 'get_patterns' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setPatterns(data.patterns || []);
        return data.patterns;
      }
      return null;
    } catch (err) {
      console.error('[usePredictiveAnomalies] getPatterns error:', err);
      return null;
    }
  }, []);

  const startMonitoring = useCallback((intervalMs: number = 60000) => {
    stopMonitoring();
    detectAnomalies();
    monitorInterval.current = setInterval(() => detectAnomalies(), intervalMs);
  }, [detectAnomalies]);

  const stopMonitoring = useCallback(() => {
    if (monitorInterval.current) {
      clearInterval(monitorInterval.current);
      monitorInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  return {
    anomalies,
    stats,
    patterns,
    isLoading,
    error,
    detectAnomalies,
    analyzeAnomaly,
    updateAnomalyStatus,
    getPatterns,
    startMonitoring,
    stopMonitoring
  };
}

export default usePredictiveAnomalies;
