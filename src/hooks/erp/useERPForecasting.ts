/**
 * useERPForecasting - Hook para pronósticos financieros IA
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ForecastResult {
  type: string;
  forecast: {
    periods: Array<{
      period: string;
      projected_revenue?: number;
      projected_expenses?: number;
      projected_net?: number;
      confidence: number;
    }>;
    summary: {
      total_projected: number;
      trend: 'growth' | 'stable' | 'decline';
      risk_factors: string[];
    };
  };
  generated_at: string;
}

export interface ScenarioAnalysis {
  scenarios: Array<{
    name: string;
    assumptions: Record<string, number>;
    projections: {
      revenue: number;
      expenses: number;
      profit: number;
      cash_position: number;
    };
    probability: number;
    recommendations: string[];
  }>;
}

export function useERPForecasting() {
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateForecast = useCallback(async (
    companyId: string,
    forecastType: 'revenue' | 'expenses' | 'cashflow' | 'comprehensive',
    periodMonths: number = 12,
    historicalData?: Record<string, unknown>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-financial-forecasting',
        {
          body: {
            action: 'generate_forecast',
            company_id: companyId,
            forecast_type: forecastType,
            period_months: periodMonths,
            historical_data: historicalData
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setForecast(data.data);
        return data.data;
      }

      throw new Error(data?.error || 'Error generando pronóstico');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en pronóstico financiero');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeScenarios = useCallback(async (
    companyId: string,
    baseProjections: Record<string, number>,
    scenarioParams?: Array<{ name: string; adjustments: Record<string, number> }>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-financial-forecasting',
        {
          body: {
            action: 'scenario_analysis',
            company_id: companyId,
            base_projections: baseProjections,
            scenario_params: scenarioParams
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setScenarios(data.data);
        return data.data;
      }

      throw new Error(data?.error || 'Error en análisis de escenarios');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en análisis de escenarios');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const projectCashflow = useCallback(async (
    companyId: string,
    currentBalance: number,
    expectedInflows: Array<{ date: string; amount: number; description: string }>,
    expectedOutflows: Array<{ date: string; amount: number; description: string }>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-financial-forecasting',
        {
          body: {
            action: 'cashflow_projection',
            company_id: companyId,
            current_balance: currentBalance,
            expected_inflows: expectedInflows,
            expected_outflows: expectedOutflows
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      throw new Error(data?.error || 'Error en proyección de cashflow');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en proyección de flujo de caja');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    forecast,
    scenarios,
    error,
    generateForecast,
    analyzeScenarios,
    projectCashflow
  };
}

export default useERPForecasting;
