import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface PredictedNPSError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  // === ESTADO KB ===
  const [error, setError] = useState<PredictedNPSError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predicted-nps', companyId],
    queryFn: async () => {
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
        setLastRefresh(new Date());
        setError(null);
        return data as unknown as PredictedNPS[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError({
          code: 'FETCH_PREDICTIONS_ERROR',
          message,
          details: { originalError: String(err) }
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
      setLastRefresh(new Date());
      toast.success('Predicción NPS generada correctamente');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al predecir NPS';
      setError({
        code: 'PREDICT_NPS_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error(`Error al predecir NPS: ${message}`);
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
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
}
