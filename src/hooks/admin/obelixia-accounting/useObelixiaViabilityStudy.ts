/**
 * useObelixiaViabilityStudy Hook
 * Fase 15 Extended: Strategic Financial Agent - Viability Study Module
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ViabilityStudy = Database['public']['Tables']['obelixia_viability_studies']['Row'];

export type { ViabilityStudy };

export interface ViabilityContext {
  projectName: string;
  projectType: string;
  description?: string;
  initialInvestment: number;
  projectionYears?: number;
  industry?: string;
  targetMarket?: string;
  expectedRevenue?: number;
  operatingCosts?: number;
}

export function useObelixiaViabilityStudy() {
  const [isLoading, setIsLoading] = useState(false);
  const [studies, setStudies] = useState<ViabilityStudy[]>([]);
  const [currentStudy, setCurrentStudy] = useState<ViabilityStudy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch all viability studies
  const fetchStudies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('obelixia_viability_studies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setStudies(data || []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching studies';
      setError(message);
      console.error('[useObelixiaViabilityStudy] fetchStudies error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new viability study using AI
  const generateStudy = useCallback(async (context: ViabilityContext) => {
    setIsLoading(true);
    setAnalysisProgress(10);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-viability-study',
        {
          body: {
            action: 'generate_study',
            context
          }
        }
      );

      setAnalysisProgress(90);

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Estudio de viabilidad generado');
        setAnalysisProgress(100);
        await fetchStudies();
        return data.data;
      }

      throw new Error(data?.error || 'Error generando estudio');
    } catch (err) {
      console.error('[useObelixiaViabilityStudy] generateStudy error:', err);
      toast.error('Error al generar estudio de viabilidad');
      return null;
    } finally {
      setIsLoading(false);
      setAnalysisProgress(0);
    }
  }, [fetchStudies]);

  // Run sensitivity analysis
  const runSensitivityAnalysis = useCallback(async (
    studyId: string,
    variables: { name: string; range: [number, number] }[]
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-viability-study',
        {
          body: {
            action: 'sensitivity_analysis',
            studyId,
            variables
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Análisis de sensibilidad completado');
        await fetchStudies();
        return data.data;
      }

      throw new Error(data?.error || 'Error en análisis');
    } catch (err) {
      console.error('[useObelixiaViabilityStudy] runSensitivityAnalysis error:', err);
      toast.error('Error en análisis de sensibilidad');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStudies]);

  // Calculate financial metrics
  const calculateMetrics = useCallback(async (
    studyId: string,
    financialData: Record<string, unknown>
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-viability-study',
        {
          body: {
            action: 'calculate_metrics',
            studyId,
            financialData
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Métricas calculadas');
        await fetchStudies();
        return data.data;
      }

      throw new Error(data?.error || 'Error calculando métricas');
    } catch (err) {
      console.error('[useObelixiaViabilityStudy] calculateMetrics error:', err);
      toast.error('Error al calcular métricas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStudies]);

  // Update study
  const updateStudy = useCallback(async (
    studyId: string,
    updates: Database['public']['Tables']['obelixia_viability_studies']['Update']
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('obelixia_viability_studies')
        .update(updates)
        .eq('id', studyId);

      if (updateError) throw updateError;

      toast.success('Estudio actualizado');
      await fetchStudies();
      return true;
    } catch (err) {
      console.error('[useObelixiaViabilityStudy] updateStudy error:', err);
      toast.error('Error al actualizar estudio');
      return false;
    }
  }, [fetchStudies]);

  // Export study
  const exportStudy = useCallback(async (studyId: string, format: 'pdf' | 'xlsx' | 'json') => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-viability-study',
        {
          body: {
            action: 'export_study',
            studyId,
            format
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Estudio exportado');
        return data.data;
      }

      throw new Error(data?.error || 'Error exportando');
    } catch (err) {
      console.error('[useObelixiaViabilityStudy] exportStudy error:', err);
      toast.error('Error al exportar estudio');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh
  const startAutoRefresh = useCallback((intervalMs = 300000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchStudies();
    autoRefreshInterval.current = setInterval(fetchStudies, intervalMs);
  }, [fetchStudies]);

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
    studies,
    currentStudy,
    error,
    analysisProgress,
    setCurrentStudy,
    fetchStudies,
    generateStudy,
    runSensitivityAnalysis,
    calculateMetrics,
    updateStudy,
    exportStudy,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaViabilityStudy;
