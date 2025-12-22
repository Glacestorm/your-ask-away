import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RevenueScenario {
  id: string;
  name: string;
  description: string | null;
  scenario_type: string;
  base_mrr: number;
  variables: Record<string, unknown>;
  projections: Record<string, unknown>;
  time_horizon_months: number;
  is_baseline: boolean;
  confidence_level: number;
  assumptions: string[] | null;
  risks: string[] | null;
  created_at: string;
}

export interface ScenarioVariables {
  churnRate: number;
  expansionRate: number;
  newBusinessMRR: number;
  pricingChange: number;
  seasonalityFactor?: number;
}

export const useRevenueScenarios = () => {
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: scenarios, isLoading, refetch } = useQuery({
    queryKey: ['revenue-scenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_scenarios')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RevenueScenario[];
    }
  });

  const calculateProjection = useCallback(async (
    baseMRR: number,
    variables: ScenarioVariables,
    timeHorizonMonths: number = 12,
    scenarioName?: string,
    saveScenario: boolean = false
  ) => {
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-scenario-projection', {
        body: { baseMRR, variables, timeHorizonMonths, scenarioName, saveScenario }
      });
      if (error) throw error;
      if (saveScenario) {
        queryClient.invalidateQueries({ queryKey: ['revenue-scenarios'] });
        toast.success('Escenario guardado');
      }
      return data;
    } catch (err) {
      toast.error('Error al calcular proyección');
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, [queryClient]);

  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('revenue_scenarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-scenarios'] });
      toast.success('Escenario eliminado');
    }
  });

  return {
    scenarios,
    isLoading,
    refetch,
    calculateProjection,
    isCalculating,
    deleteScenario: deleteScenario.mutateAsync
  };
};
