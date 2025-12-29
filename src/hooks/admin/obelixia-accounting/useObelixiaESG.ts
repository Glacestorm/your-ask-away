/**
 * useObelixiaESG Hook
 * Fase 13: ESG & Sustainability Reporting
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ESGMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  target: number;
  progress: number;
  trend: 'improving' | 'stable' | 'worsening';
  period: string;
}

export interface ESGScores {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

export interface CarbonFootprint {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  intensity: number;
}

export interface ESGTarget {
  id: string;
  name: string;
  baseline: { year: number; value: number };
  target: { year: number; value: number };
  reduction: number;
  type: 'absolute' | 'intensity';
  scope: string;
  sbtiAligned: boolean;
  pathway: unknown[];
  milestones: unknown[];
}

export interface ESGContext {
  companyId: string;
  fiscalYear?: string;
  framework?: 'GRI' | 'SASB' | 'TCFD' | 'CDP';
}

export function useObelixiaESG() {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<{
    environmental: ESGMetric[];
    social: ESGMetric[];
    governance: ESGMetric[];
  }>({ environmental: [], social: [], governance: [] });
  const [scores, setScores] = useState<ESGScores>({ environmental: 0, social: 0, governance: 0, overall: 0 });
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async (context?: ESGContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-esg', {
        body: { action: 'get_metrics', context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setMetrics(data.data.metrics || { environmental: [], social: [], governance: [] });
        setScores(data.data.scores || { environmental: 0, social: 0, governance: 0, overall: 0 });
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaESG] fetchMetrics error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (framework: string, period: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-esg', {
        body: { action: 'generate_report', params: { framework, period } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Reporte ESG generado');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaESG] generateReport error:', err);
      toast.error('Error al generar reporte ESG');
      return null;
    }
  }, []);

  const analyzeImpact = useCallback(async (params: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-esg', {
        body: { action: 'analyze_impact', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        if (data.data.carbonFootprint) {
          setCarbonFootprint(data.data.carbonFootprint);
        }
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaESG] analyzeImpact error:', err);
      toast.error('Error en análisis de impacto');
      return null;
    }
  }, []);

  const benchmark = useCallback(async (industry: string, peerGroup?: string[]) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-esg', {
        body: { action: 'benchmark', params: { industry, peerGroup } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaESG] benchmark error:', err);
      toast.error('Error en benchmark ESG');
      return null;
    }
  }, []);

  const setTargets = useCallback(async (targets: Partial<ESGTarget>[]) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('obelixia-esg', {
        body: { action: 'set_targets', params: { targets } }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Objetivos ESG definidos');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaESG] setTargets error:', err);
      toast.error('Error al definir objetivos');
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((context: ESGContext, intervalMs = 300000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchMetrics(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchMetrics(context);
    }, intervalMs);
  }, [fetchMetrics]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    metrics,
    scores,
    carbonFootprint,
    error,
    fetchMetrics,
    generateReport,
    analyzeImpact,
    benchmark,
    setTargets,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaESG;
