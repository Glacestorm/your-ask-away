import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

export interface PredictedNPS {
  id: string;
  company_id: string;
  contact_id?: string;
  predicted_score: number;
  confidence_level: number;
  behavioral_signals: Record<string, unknown>;
  risk_factors: string[];
  prediction_date: string;
  valid_until: string;
  model_version: string;
  actual_nps?: number;
  prediction_accuracy?: number;
  validated_at?: string;
  created_at: string;
}

export function usePredictedNPS(companyId?: string) {
  const queryClient = useQueryClient();
  
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

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predicted-nps', companyId],
    queryFn: async () => {
      const startTime = new Date();
      setStatus('loading');
      
      try {
        let query = supabase
          .from('predicted_nps')
          .select('*')
          .gte('valid_until', new Date().toISOString())
          .order('prediction_date', { ascending: false });

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastSuccess(new Date());
        setLastRefresh(new Date());
        setError(null);
        
        collectTelemetry({
          hookName: 'usePredictedNPS',
          operationName: 'fetchPredictions',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount
        });
        
        return data as unknown as PredictedNPS[];
      } catch (err) {
        const kbError = parseError(err);
        setError(kbError);
        setStatus('error');
        
        collectTelemetry({
          hookName: 'usePredictedNPS',
          operationName: 'fetchPredictions',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
        });
        
        throw err;
      }
    },
    enabled: true,
  });

  const predictNPS = useMutation({
    mutationFn: async (targetCompanyId: string) => {
      const { data, error } = await supabase.functions.invoke('predict-nps', {
        body: { companyId: targetCompanyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predicted-nps'] });
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      toast.success('Predicción NPS generada correctamente');
    },
    onError: (err) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error al predecir NPS: ${kbError.message}`);
    },
  });

  const getRiskLevel = (riskFactors: string[]): string => {
    if (!riskFactors || riskFactors.length === 0) return 'low';
    if (riskFactors.length >= 3) return 'high';
    if (riskFactors.length >= 1) return 'medium';
    return 'low';
  };

  const getRiskColor = (riskFactors: string[]) => {
    const level = getRiskLevel(riskFactors);
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskLabel = (riskFactors: string[]) => {
    const level = getRiskLevel(riskFactors);
    switch (level) {
      case 'high': return 'Alto Riesgo';
      case 'medium': return 'Riesgo Medio';
      case 'low': return 'Bajo Riesgo';
      default: return 'Sin evaluar';
    }
  };

  return {
    predictions,
    isLoading,
    predictNPS: predictNPS.mutate,
    isPredicting: predictNPS.isPending,
    getRiskColor,
    getRiskLabel,
    getRiskLevel,
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
}
