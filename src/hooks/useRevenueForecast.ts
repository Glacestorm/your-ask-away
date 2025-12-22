import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RevenueForecast {
  id: string;
  forecast_date: string;
  forecast_horizon_months: number;
  scenario: string;
  predicted_mrr: number;
  predicted_arr: number;
  confidence_level: number;
  confidence_interval_low: number | null;
  confidence_interval_high: number | null;
  growth_rate_predicted: number | null;
  churn_rate_predicted: number | null;
  expansion_rate_predicted: number | null;
  key_drivers: Record<string, unknown> | null;
  risk_factors: Record<string, unknown> | null;
  model_version: string | null;
  model_accuracy: number | null;
  ai_insights: string | null;
  created_at: string;
  updated_at: string;
}

export const useRevenueForecast = () => {
  const queryClient = useQueryClient();

  const { data: forecasts, isLoading, refetch } = useQuery({
    queryKey: ['revenue-forecasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_forecasts')
        .select('*')
        .order('forecast_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as RevenueForecast[];
    }
  });

  const generateForecastMutation = useMutation({
    mutationFn: async (params: { 
      forecastType: 'monthly' | 'quarterly' | 'yearly';
      historicalData: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('forecast-revenue', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-forecasts'] });
      toast.success('Pronóstico generado correctamente');
    },
    onError: (error) => {
      toast.error('Error al generar pronóstico: ' + error.message);
    }
  });

  const getLatestForecast = (scenario: string = 'expected') => {
    return forecasts?.find(f => f.scenario === scenario);
  };

  const getForecastsByScenario = (scenario: string) => {
    return forecasts?.filter(f => f.scenario === scenario) || [];
  };

  const getConfidenceIntervals = () => {
    const latest = forecasts?.[0];
    if (!latest) return null;
    return {
      low: latest.confidence_interval_low,
      high: latest.confidence_interval_high,
      predicted: latest.predicted_mrr
    };
  };

  const getForecastTrend = () => {
    if (!forecasts || forecasts.length < 2) return [];
    return forecasts
      .filter(f => f.scenario === 'expected')
      .slice(0, 12)
      .reverse()
      .map(f => ({
        date: f.forecast_date,
        predicted: f.predicted_mrr,
        low: f.confidence_interval_low,
        high: f.confidence_interval_high,
        confidence: f.confidence_level
      }));
  };

  return {
    forecasts,
    isLoading,
    refetch,
    generateForecast: generateForecastMutation.mutateAsync,
    isGenerating: generateForecastMutation.isPending,
    getLatestForecast,
    getForecastsByScenario,
    getConfidenceIntervals,
    getForecastTrend
  };
};
