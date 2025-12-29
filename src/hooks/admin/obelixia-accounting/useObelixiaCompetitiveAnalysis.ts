/**
 * useObelixiaCompetitiveAnalysis Hook
 * Fase 15 Extended: Strategic Financial Agent - Competitive Analysis Module
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompetitorAnalysis = Database['public']['Tables']['obelixia_competitor_analysis']['Row'];

export type { CompetitorAnalysis };

export interface CompetitiveContext {
  analysisName: string;
  industry: string;
  ourCompanyProfile: Record<string, unknown>;
  competitors?: string[];
  focusAreas?: string[];
}

export function useObelixiaCompetitiveAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch all competitive analyses
  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('obelixia_competitor_analysis')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAnalyses(data || []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching analyses';
      setError(message);
      console.error('[useObelixiaCompetitiveAnalysis] fetchAnalyses error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new competitive analysis using AI
  const generateAnalysis = useCallback(async (context: CompetitiveContext) => {
    setIsLoading(true);
    setAnalysisProgress(10);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-competitive-analysis',
        {
          body: {
            action: 'generate_analysis',
            context
          }
        }
      );

      setAnalysisProgress(90);

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Análisis competitivo generado');
        setAnalysisProgress(100);
        await fetchAnalyses();
        return data.data;
      }

      throw new Error(data?.error || 'Error generando análisis');
    } catch (err) {
      console.error('[useObelixiaCompetitiveAnalysis] generateAnalysis error:', err);
      toast.error('Error al generar análisis competitivo');
      return null;
    } finally {
      setIsLoading(false);
      setAnalysisProgress(0);
    }
  }, [fetchAnalyses]);

  // Research competitor
  const researchCompetitor = useCallback(async (
    analysisId: string,
    competitorInfo: { name: string; website?: string; industry?: string }
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-competitive-analysis',
        {
          body: {
            action: 'research_competitor',
            analysisId,
            competitorInfo
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Competidor "${competitorInfo.name}" investigado`);
        await fetchAnalyses();
        return data.data;
      }

      throw new Error(data?.error || 'Error investigando competidor');
    } catch (err) {
      console.error('[useObelixiaCompetitiveAnalysis] researchCompetitor error:', err);
      toast.error('Error al investigar competidor');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAnalyses]);

  // Generate SWOT analysis
  const generateSWOT = useCallback(async (analysisId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-competitive-analysis',
        {
          body: {
            action: 'generate_swot',
            analysisId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Análisis DAFO generado');
        await fetchAnalyses();
        return data.data;
      }

      throw new Error(data?.error || 'Error generando DAFO');
    } catch (err) {
      console.error('[useObelixiaCompetitiveAnalysis] generateSWOT error:', err);
      toast.error('Error al generar DAFO');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAnalyses]);

  // Generate positioning matrix
  const generatePositioningMatrix = useCallback(async (
    analysisId: string,
    axes: { x: string; y: string }
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-competitive-analysis',
        {
          body: {
            action: 'positioning_matrix',
            analysisId,
            axes
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Matriz de posicionamiento generada');
        return data.data;
      }

      throw new Error(data?.error || 'Error generando matriz');
    } catch (err) {
      console.error('[useObelixiaCompetitiveAnalysis] generatePositioningMatrix error:', err);
      toast.error('Error al generar matriz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update analysis
  const updateAnalysis = useCallback(async (
    analysisId: string,
    updates: Database['public']['Tables']['obelixia_competitor_analysis']['Update']
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('obelixia_competitor_analysis')
        .update(updates)
        .eq('id', analysisId);

      if (updateError) throw updateError;

      toast.success('Análisis actualizado');
      await fetchAnalyses();
      return true;
    } catch (err) {
      console.error('[useObelixiaCompetitiveAnalysis] updateAnalysis error:', err);
      toast.error('Error al actualizar análisis');
      return false;
    }
  }, [fetchAnalyses]);

  // Export analysis
  const exportAnalysis = useCallback(async (analysisId: string, format: 'pdf' | 'pptx' | 'json') => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-competitive-analysis',
        {
          body: {
            action: 'export_analysis',
            analysisId,
            format
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Análisis exportado');
        return data.data;
      }

      throw new Error(data?.error || 'Error exportando');
    } catch (err) {
      console.error('[useObelixiaCompetitiveAnalysis] exportAnalysis error:', err);
      toast.error('Error al exportar análisis');
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
    fetchAnalyses();
    autoRefreshInterval.current = setInterval(fetchAnalyses, intervalMs);
  }, [fetchAnalyses]);

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
    analyses,
    currentAnalysis,
    error,
    analysisProgress,
    setCurrentAnalysis,
    fetchAnalyses,
    generateAnalysis,
    researchCompetitor,
    generateSWOT,
    generatePositioningMatrix,
    updateAnalysis,
    exportAnalysis,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaCompetitiveAnalysis;
