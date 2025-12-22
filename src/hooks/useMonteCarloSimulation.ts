import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonteCarloSimulation {
  id: string;
  simulation_name: string;
  simulation_date: string;
  simulation_type: string | null;
  num_iterations: number;
  time_horizon_months: number | null;
  input_parameters: Record<string, unknown> | null;
  base_mrr: number | null;
  base_arr: number | null;
  results_summary: Record<string, unknown> | null;
  percentile_10: number | null;
  percentile_25: number | null;
  percentile_50: number | null;
  percentile_75: number | null;
  percentile_90: number | null;
  mean_outcome: number | null;
  std_deviation: number | null;
  probability_of_target: number | null;
  target_value: number | null;
  worst_case: number | null;
  best_case: number | null;
  confidence_interval_95_low: number | null;
  confidence_interval_95_high: number | null;
  key_risk_factors: Record<string, unknown> | null;
  sensitivity_analysis: Record<string, unknown> | null;
  distribution_data: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export const useMonteCarloSimulation = () => {
  const queryClient = useQueryClient();

  const { data: simulations, isLoading, refetch } = useQuery({
    queryKey: ['monte-carlo-simulations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monte_carlo_simulations')
        .select('*')
        .order('simulation_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as MonteCarloSimulation[];
    }
  });

  const runSimulationMutation = useMutation({
    mutationFn: async (params: { 
      simulationName: string;
      numIterations: number;
      baseMetrics: Record<string, unknown>;
      variabilityRanges: Record<string, { min: number; max: number }>;
    }) => {
      const { data, error } = await supabase.functions.invoke('run-monte-carlo', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monte-carlo-simulations'] });
      toast.success('Simulación Monte Carlo completada');
    },
    onError: (error) => {
      toast.error('Error en simulación: ' + error.message);
    }
  });

  const getLatestSimulation = () => {
    return simulations?.[0];
  };

  const getSimulationById = (id: string) => {
    return simulations?.find(s => s.id === id);
  };

  const getPercentileRange = (simulation: MonteCarloSimulation) => {
    return {
      pessimistic: simulation.percentile_10,
      likely: simulation.percentile_50,
      optimistic: simulation.percentile_90,
      range: (simulation.percentile_90 || 0) - (simulation.percentile_10 || 0)
    };
  };

  const getConfidenceLevel = (simulation: MonteCarloSimulation, targetValue: number) => {
    if (!simulation.distribution_data) return 0;
    const distribution = simulation.distribution_data as { values?: number[] };
    if (!distribution.values) return simulation.probability_of_target || 0;
    
    const belowTarget = distribution.values.filter(v => v >= targetValue).length;
    return (belowTarget / distribution.values.length) * 100;
  };

  const compareSimulations = (simIds: string[]) => {
    const selected = simulations?.filter(s => simIds.includes(s.id)) || [];
    return selected.map(s => ({
      id: s.id,
      name: s.simulation_name,
      date: s.simulation_date,
      p50: s.percentile_50,
      mean: s.mean_outcome,
      stdDev: s.std_deviation
    }));
  };

  return {
    simulations,
    isLoading,
    refetch,
    runSimulation: runSimulationMutation.mutateAsync,
    isRunning: runSimulationMutation.isPending,
    getLatestSimulation,
    getSimulationById,
    getPercentileRange,
    getConfidenceLevel,
    compareSimulations
  };
};
