import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface LTVPredictionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface LTVPrediction {
  id: string;
  company_id: string;
  prediction_date: string;
  predicted_ltv: number;
  ltv_confidence_low: number | null;
  ltv_confidence_high: number | null;
  confidence_score: number | null;
  cac: number | null;
  ltv_cac_ratio: number | null;
  payback_months: number | null;
  expected_lifetime_months: number | null;
  churn_probability: number | null;
  expansion_probability: number | null;
  health_score: number | null;
  engagement_score: number | null;
  feature_usage_score: number | null;
  input_features: Record<string, unknown> | null;
  model_version: string | null;
  segment: string | null;
  created_at: string;
  updated_at: string;
  company?: { name: string };
}

export const useLTVPrediction = () => {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<LTVPredictionError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: predictions, isLoading, refetch } = useQuery({
    queryKey: ['ltv-predictions'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('ltv_predictions')
          .select(`
            *,
            company:companies(name)
          `)
          .order('prediction_date', { ascending: false })
          .limit(100);
        
        if (fetchError) throw fetchError;
        
        setLastRefresh(new Date());
        setError(null);
        return data as LTVPrediction[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError({
          code: 'FETCH_PREDICTIONS_ERROR',
          message,
          details: { originalError: String(err) }
        });
        throw err;
      }
    }
  });

  const predictLTVMutation = useMutation({
    mutationFn: async (params: { 
      companyId: string;
      customerData: Record<string, unknown>;
    }) => {
      const { data, error: invokeError } = await supabase.functions.invoke('predict-ltv', {
        body: params
      });
      
      if (invokeError) throw invokeError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ltv-predictions'] });
      setLastRefresh(new Date());
      toast.success('Predicción LTV calculada');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error al calcular LTV';
      setError({
        code: 'PREDICT_LTV_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error('Error al calcular LTV: ' + message);
    }
  });

  const getLTVByCompany = (companyId: string) => {
    return predictions?.find(p => p.company_id === companyId);
  };

  const getAverageLTV = () => {
    if (!predictions || predictions.length === 0) return 0;
    return predictions.reduce((sum, p) => sum + p.predicted_ltv, 0) / predictions.length;
  };

  const getAverageLTVToCAC = () => {
    const withRatio = predictions?.filter(p => p.ltv_cac_ratio !== null) || [];
    if (withRatio.length === 0) return 0;
    return withRatio.reduce((sum, p) => sum + (p.ltv_cac_ratio || 0), 0) / withRatio.length;
  };

  const getLTVBySegment = () => {
    if (!predictions) return {};
    const segments: Record<string, { count: number; totalLTV: number; avgLTV: number }> = {};
    
    predictions.forEach(p => {
      const segment = p.segment || 'Sin segmento';
      if (!segments[segment]) {
        segments[segment] = { count: 0, totalLTV: 0, avgLTV: 0 };
      }
      segments[segment].count++;
      segments[segment].totalLTV += p.predicted_ltv;
    });

    Object.keys(segments).forEach(key => {
      segments[key].avgLTV = segments[key].totalLTV / segments[key].count;
    });

    return segments;
  };

  const getHighValueCustomers = (threshold: number = 50000) => {
    return predictions?.filter(p => p.predicted_ltv >= threshold) || [];
  };

  const getChurnRiskCustomers = (threshold: number = 0.5) => {
    return predictions?.filter(p => (p.churn_probability || 0) >= threshold) || [];
  };

  return {
    predictions,
    isLoading,
    refetch,
    predictLTV: predictLTVMutation.mutateAsync,
    isPredicting: predictLTVMutation.isPending,
    getLTVByCompany,
    getAverageLTV,
    getAverageLTVToCAC,
    getLTVBySegment,
    getHighValueCustomers,
    getChurnRiskCustomers,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
};
