import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface RevenueScenariosError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  // === ESTADO KB ===
  const [error, setError] = useState<RevenueScenariosError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: scenarios, isLoading, refetch } = useQuery({
    queryKey: ['revenue-scenarios'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_scenarios')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setLastRefresh(new Date());
        setError(null);
        return data as RevenueScenario[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError({
          code: 'FETCH_SCENARIOS_ERROR',
          message,
          details: { originalError: String(err) }
        });
        throw err;
      }
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
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('calculate-scenario-projection', {
        body: { baseMRR, variables, timeHorizonMonths, scenarioName, saveScenario }
      });
      
      if (invokeError) throw invokeError;
      
      if (saveScenario) {
        queryClient.invalidateQueries({ queryKey: ['revenue-scenarios'] });
        toast.success('Escenario guardado');
      }
      
      setLastRefresh(new Date());
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al calcular proyección';
      setError({
        code: 'CALCULATE_PROJECTION_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error('Error al calcular proyección');
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, [queryClient]);

  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from('revenue_scenarios').delete().eq('id', id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-scenarios'] });
      toast.success('Escenario eliminado');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al eliminar escenario';
      setError({
        code: 'DELETE_SCENARIO_ERROR',
        message,
        details: { originalError: String(err) }
      });
    }
  });

  return {
    scenarios,
    isLoading,
    refetch,
    calculateProjection,
    isCalculating,
    deleteScenario: deleteScenario.mutateAsync,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
};
