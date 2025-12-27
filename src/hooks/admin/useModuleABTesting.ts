/**
 * useModuleABTesting - Sistema de A/B Testing para módulos
 * Experimentos, segmentación, métricas y análisis estadístico
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  weight: number;
  config: Record<string, unknown>;
  metrics: {
    users: number;
    conversions: number;
    conversionRate: number;
    avgEngagement: number;
  };
}

export interface ABExperiment {
  id: string;
  moduleKey: string;
  name: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string | null;
  endDate: string | null;
  variants: ABVariant[];
  targetAudience: {
    percentage: number;
    filters: Record<string, unknown>;
  };
  primaryMetric: string;
  secondaryMetrics: string[];
  statisticalSignificance: number;
  winner: string | null;
  createdAt: string;
  createdBy: string;
}

export interface ExperimentResults {
  experimentId: string;
  totalUsers: number;
  variantResults: {
    variantId: string;
    variantName: string;
    users: number;
    conversions: number;
    conversionRate: number;
    improvement: number;
    confidence: number;
    isWinner: boolean;
  }[];
  isSignificant: boolean;
  recommendedAction: 'continue' | 'stop' | 'declare_winner';
  analysisNotes: string[];
}

export interface ABTestingState {
  experiments: ABExperiment[];
  activeExperiment: ABExperiment | null;
  results: ExperimentResults | null;
  isLoading: boolean;
  isCreating: boolean;
  isAnalyzing: boolean;
}

export function useModuleABTesting(moduleKey?: string) {
  const [state, setState] = useState<ABTestingState>({
    experiments: [],
    activeExperiment: null,
    results: null,
    isLoading: false,
    isCreating: false,
    isAnalyzing: false
  });

  // Fetch all experiments for a module
  const fetchExperiments = useCallback(async (key?: string) => {
    const targetKey = key || moduleKey;
    if (!targetKey) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-ab-testing', {
        body: {
          action: 'list_experiments',
          moduleKey: targetKey
        }
      });

      if (error) throw error;

      const experiments: ABExperiment[] = (data?.experiments || []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        moduleKey: targetKey,
        name: (e.name as string) || 'Unnamed Experiment',
        description: (e.description as string) || '',
        hypothesis: (e.hypothesis as string) || '',
        status: (e.status as ABExperiment['status']) || 'draft',
        startDate: e.start_date as string | null,
        endDate: e.end_date as string | null,
        variants: ((e.variants as Record<string, unknown>[]) || []).map((v: Record<string, unknown>) => ({
          id: v.id as string,
          name: (v.name as string) || 'Variant',
          description: (v.description as string) || '',
          weight: (v.weight as number) || 50,
          config: (v.config as Record<string, unknown>) || {},
          metrics: {
            users: (v.users as number) || 0,
            conversions: (v.conversions as number) || 0,
            conversionRate: (v.conversion_rate as number) || 0,
            avgEngagement: (v.avg_engagement as number) || 0
          }
        })),
        targetAudience: {
          percentage: (e.target_percentage as number) || 100,
          filters: (e.target_filters as Record<string, unknown>) || {}
        },
        primaryMetric: (e.primary_metric as string) || 'conversion_rate',
        secondaryMetrics: (e.secondary_metrics as string[]) || [],
        statisticalSignificance: (e.statistical_significance as number) || 0,
        winner: e.winner as string | null,
        createdAt: (e.created_at as string) || new Date().toISOString(),
        createdBy: (e.created_by as string) || 'system'
      }));

      setState(prev => ({ ...prev, experiments, isLoading: false }));
      return experiments;
    } catch (error) {
      console.error('[useModuleABTesting] fetchExperiments error:', error);
      // Return mock data for development
      const mockExperiments: ABExperiment[] = [
        {
          id: '1',
          moduleKey: targetKey,
          name: 'Button Color Test',
          description: 'Testing different button colors for conversion',
          hypothesis: 'Blue buttons will have higher conversion rate',
          status: 'running',
          startDate: new Date(Date.now() - 604800000).toISOString(),
          endDate: null,
          variants: [
            {
              id: 'a',
              name: 'Control (Green)',
              description: 'Original green button',
              weight: 50,
              config: { buttonColor: 'green' },
              metrics: { users: 1234, conversions: 123, conversionRate: 9.97, avgEngagement: 45 }
            },
            {
              id: 'b',
              name: 'Variant (Blue)',
              description: 'New blue button',
              weight: 50,
              config: { buttonColor: 'blue' },
              metrics: { users: 1256, conversions: 156, conversionRate: 12.42, avgEngagement: 52 }
            }
          ],
          targetAudience: { percentage: 100, filters: {} },
          primaryMetric: 'conversion_rate',
          secondaryMetrics: ['engagement', 'time_on_page'],
          statisticalSignificance: 94.5,
          winner: null,
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          createdBy: 'admin'
        }
      ];
      setState(prev => ({ ...prev, experiments: mockExperiments, isLoading: false }));
      return mockExperiments;
    }
  }, [moduleKey]);

  // Create a new experiment
  const createExperiment = useCallback(async (
    experiment: Omit<ABExperiment, 'id' | 'createdAt' | 'createdBy' | 'statisticalSignificance' | 'winner'>
  ) => {
    setState(prev => ({ ...prev, isCreating: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-ab-testing', {
        body: {
          action: 'create_experiment',
          experiment
        }
      });

      if (error) throw error;

      toast.success('Experimento creado');
      await fetchExperiments();
      setState(prev => ({ ...prev, isCreating: false }));
      return data;
    } catch (error) {
      console.error('[useModuleABTesting] createExperiment error:', error);
      toast.error('Error al crear experimento');
      setState(prev => ({ ...prev, isCreating: false }));
      return null;
    }
  }, [fetchExperiments]);

  // Start an experiment
  const startExperiment = useCallback(async (experimentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('module-ab-testing', {
        body: {
          action: 'start_experiment',
          experimentId
        }
      });

      if (error) throw error;

      toast.success('Experimento iniciado');
      await fetchExperiments();
      return true;
    } catch (error) {
      console.error('[useModuleABTesting] startExperiment error:', error);
      toast.error('Error al iniciar experimento');
      return false;
    }
  }, [fetchExperiments]);

  // Pause an experiment
  const pauseExperiment = useCallback(async (experimentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('module-ab-testing', {
        body: {
          action: 'pause_experiment',
          experimentId
        }
      });

      if (error) throw error;

      toast.success('Experimento pausado');
      await fetchExperiments();
      return true;
    } catch (error) {
      console.error('[useModuleABTesting] pauseExperiment error:', error);
      toast.error('Error al pausar experimento');
      return false;
    }
  }, [fetchExperiments]);

  // Get experiment results
  const getExperimentResults = useCallback(async (experimentId: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const { data, error } = await supabase.functions.invoke('module-ab-testing', {
        body: {
          action: 'get_results',
          experimentId
        }
      });

      if (error) throw error;

      const results: ExperimentResults = {
        experimentId,
        totalUsers: data?.totalUsers || 0,
        variantResults: data?.variantResults || [],
        isSignificant: data?.isSignificant || false,
        recommendedAction: data?.recommendedAction || 'continue',
        analysisNotes: data?.analysisNotes || []
      };

      setState(prev => ({ ...prev, results, isAnalyzing: false }));
      return results;
    } catch (error) {
      console.error('[useModuleABTesting] getExperimentResults error:', error);
      // Return mock results
      const mockResults: ExperimentResults = {
        experimentId,
        totalUsers: 2490,
        variantResults: [
          {
            variantId: 'a',
            variantName: 'Control',
            users: 1234,
            conversions: 123,
            conversionRate: 9.97,
            improvement: 0,
            confidence: 50,
            isWinner: false
          },
          {
            variantId: 'b',
            variantName: 'Variant B',
            users: 1256,
            conversions: 156,
            conversionRate: 12.42,
            improvement: 24.5,
            confidence: 94.5,
            isWinner: true
          }
        ],
        isSignificant: true,
        recommendedAction: 'declare_winner',
        analysisNotes: ['Variant B shows 24.5% improvement', 'Statistical significance reached at 94.5%']
      };
      setState(prev => ({ ...prev, results: mockResults, isAnalyzing: false }));
      return mockResults;
    }
  }, []);

  // Declare a winner and end experiment
  const declareWinner = useCallback(async (experimentId: string, variantId: string) => {
    try {
      const { error } = await supabase.functions.invoke('module-ab-testing', {
        body: {
          action: 'declare_winner',
          experimentId,
          variantId
        }
      });

      if (error) throw error;

      toast.success('Ganador declarado - Experimento completado');
      await fetchExperiments();
      return true;
    } catch (error) {
      console.error('[useModuleABTesting] declareWinner error:', error);
      toast.error('Error al declarar ganador');
      return false;
    }
  }, [fetchExperiments]);

  // Select an experiment for detailed view
  const selectExperiment = useCallback((experiment: ABExperiment | null) => {
    setState(prev => ({ ...prev, activeExperiment: experiment, results: null }));
  }, []);

  return {
    ...state,
    fetchExperiments,
    createExperiment,
    startExperiment,
    pauseExperiment,
    getExperimentResults,
    declareWinner,
    selectExperiment
  };
}

export default useModuleABTesting;
