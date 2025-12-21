import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predicted-nps', companyId],
    queryFn: async () => {
      let query = supabase
        .from('predicted_nps')
        .select('*')
        .gte('valid_until', new Date().toISOString())
        .order('prediction_date', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PredictedNPS[];
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
      toast.success('Predicción NPS generada correctamente');
    },
    onError: (error) => {
      toast.error(`Error al predecir NPS: ${error.message}`);
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
  };
}
