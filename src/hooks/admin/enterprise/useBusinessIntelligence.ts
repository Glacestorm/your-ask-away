/**
 * useBusinessIntelligence Hook
 * Fase 11 - Enterprise SaaS 2025-2026
 * Business Intelligence con análisis predictivo IA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface BIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  achievement: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  category: string;
  period: string;
  sparkline: number[];
}

export interface BIInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  dataPoints: Record<string, unknown>;
  createdAt: string;
}

export interface BIPrediction {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  predictionDate: string;
  confidence: number;
  scenario: 'optimistic' | 'baseline' | 'pessimistic';
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
}

export interface BIDashboard {
  id: string;
  name: string;
  description: string;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    config: Record<string, unknown>;
  }>;
  isDefault: boolean;
  createdAt: string;
}

export interface BIContext {
  organizationId?: string;
  dashboardId?: string;
  dateRange?: { start: string; end: string };
  filters?: Record<string, unknown>;
}

// === HOOK ===
export function useBusinessIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<BIMetric[]>([]);
  const [insights, setInsights] = useState<BIInsight[]>([]);
  const [predictions, setPredictions] = useState<BIPrediction[]>([]);
  const [dashboards, setDashboards] = useState<BIDashboard[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<BIDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH BI DATA ===
  const fetchBIData = useCallback(async (context?: BIContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'get_bi_dashboard',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setMetrics(fnData.data?.metrics || []);
        setInsights(fnData.data?.insights || []);
        setPredictions(fnData.data?.predictions || []);
        setDashboards(fnData.data?.dashboards || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from BI service');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useBusinessIntelligence] fetchBIData error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERATE INSIGHTS ===
  const generateInsights = useCallback(async (context?: BIContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'generate_insights',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setInsights(fnData.data?.insights || []);
        toast.success('Insights generados con IA');
        return fnData.data?.insights;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessIntelligence] generateInsights error:', err);
      toast.error('Error al generar insights');
      return null;
    }
  }, []);

  // === RUN PREDICTION ===
  const runPrediction = useCallback(async (
    metricId: string, 
    horizonDays: number = 30
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'run_prediction',
            params: { metricId, horizonDays }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        const newPrediction = fnData.data?.prediction;
        if (newPrediction) {
          setPredictions(prev => [...prev.filter(p => p.metric !== metricId), newPrediction]);
        }
        toast.success('Predicción generada');
        return newPrediction;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessIntelligence] runPrediction error:', err);
      toast.error('Error al generar predicción');
      return null;
    }
  }, []);

  // === CREATE DASHBOARD ===
  const createDashboard = useCallback(async (
    name: string, 
    widgets: BIDashboard['widgets']
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'create_dashboard',
            params: { name, widgets }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        const newDashboard = fnData.data?.dashboard;
        if (newDashboard) {
          setDashboards(prev => [...prev, newDashboard]);
        }
        toast.success('Dashboard creado');
        return newDashboard;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessIntelligence] createDashboard error:', err);
      toast.error('Error al crear dashboard');
      return null;
    }
  }, []);

  // === EXPORT REPORT ===
  const exportReport = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'business-intelligence',
        {
          body: {
            action: 'export_report',
            params: { format, dashboardId: activeDashboard?.id }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Reporte exportado en formato ${format.toUpperCase()}`);
        return fnData.data?.downloadUrl;
      }

      return null;
    } catch (err) {
      console.error('[useBusinessIntelligence] exportReport error:', err);
      toast.error('Error al exportar reporte');
      return null;
    }
  }, [activeDashboard]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: BIContext, intervalMs = 60000) => {
    stopAutoRefresh();
    fetchBIData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchBIData(context);
    }, intervalMs);
  }, [fetchBIData]);

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
    metrics,
    insights,
    predictions,
    dashboards,
    activeDashboard,
    error,
    lastRefresh,
    fetchBIData,
    generateInsights,
    runPrediction,
    createDashboard,
    exportReport,
    setActiveDashboard,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useBusinessIntelligence;
