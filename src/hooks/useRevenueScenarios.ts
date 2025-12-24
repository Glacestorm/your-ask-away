import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

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
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoadingState = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isRetrying = status === 'retrying';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  const { data: scenarios, isLoading, refetch } = useQuery({
    queryKey: ['revenue-scenarios'],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_scenarios')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setError(null);
        
        collectTelemetry({
          hookName: 'useRevenueScenarios',
          operationName: 'fetchScenarios',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as RevenueScenario[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        
        collectTelemetry({
          hookName: 'useRevenueScenarios',
          operationName: 'fetchScenarios',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
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
    const startTime = new Date();
    setIsCalculating(true);
    setError(null);
    setStatus('loading');
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('calculate-scenario-projection', {
        body: { baseMRR, variables, timeHorizonMonths, scenarioName, saveScenario }
      });
      
      if (invokeError) throw invokeError;
      
      if (saveScenario) {
        queryClient.invalidateQueries({ queryKey: ['revenue-scenarios'] });
        toast.success('Escenario guardado');
      }
      
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      
      collectTelemetry({
        hookName: 'useRevenueScenarios',
        operationName: 'calculateProjection',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount
      });
      
      return data;
    } catch (err) {
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      toast.error('Error al calcular proyección');
      
      collectTelemetry({
        hookName: 'useRevenueScenarios',
        operationName: 'calculateProjection',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount
      });
      
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, [queryClient, retryCount]);

  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from('revenue_scenarios').delete().eq('id', id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-scenarios'] });
      setLastSuccess(new Date());
      toast.success('Escenario eliminado');
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
    }
  });

  return {
    scenarios,
    isLoading,
    refetch,
    calculateProjection,
    isCalculating,
    deleteScenario: deleteScenario.mutateAsync,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoadingState,
    isSuccess,
    isError,
    isRetrying,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
};
