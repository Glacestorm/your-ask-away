/**
 * useERPESGCarbon - Hook para ESG y huella de carbono
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CarbonFootprint {
  total_emissions_kg: number;
  breakdown: {
    scope1: number; // Emisiones directas
    scope2: number; // Electricidad
    scope3: number; // Cadena de valor
  };
  by_category: Array<{
    category: string;
    emissions_kg: number;
    percentage: number;
  }>;
  comparison: {
    industry_average: number;
    percentile: number;
  };
}

export interface ESGScore {
  overall_score: number;
  environmental: {
    score: number;
    metrics: Record<string, number>;
  };
  social: {
    score: number;
    metrics: Record<string, number>;
  };
  governance: {
    score: number;
    metrics: Record<string, number>;
  };
  recommendations: string[];
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
}

export interface SustainabilityReport {
  period: string;
  executive_summary: string;
  key_metrics: Record<string, number>;
  achievements: string[];
  challenges: string[];
  goals_progress: Array<{
    goal: string;
    target: number;
    current: number;
    status: 'on_track' | 'at_risk' | 'behind';
  }>;
  recommendations: string[];
}

export function useERPESGCarbon() {
  const [isLoading, setIsLoading] = useState(false);
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprint | null>(null);
  const [esgScore, setEsgScore] = useState<ESGScore | null>(null);
  const [report, setReport] = useState<SustainabilityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateCarbonFootprint = useCallback(async (
    companyId: string,
    period: { start: string; end: string },
    activityData: {
      energy_kwh?: number;
      fuel_liters?: number;
      travel_km?: number;
      waste_kg?: number;
      purchases?: Array<{ category: string; amount: number }>;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-esg-carbon',
        {
          body: {
            action: 'calculate_carbon',
            company_id: companyId,
            period,
            activity_data: activityData
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setCarbonFootprint(data.data);
        return data.data;
      }

      throw new Error(data?.error || 'Error calculando huella de carbono');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en cálculo de carbono');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateESGScore = useCallback(async (
    companyId: string,
    companyData: {
      environmental?: Record<string, unknown>;
      social?: Record<string, unknown>;
      governance?: Record<string, unknown>;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-esg-carbon',
        {
          body: {
            action: 'esg_scoring',
            company_id: companyId,
            company_data: companyData
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setEsgScore(data.data);
        return data.data;
      }

      throw new Error(data?.error || 'Error calculando score ESG');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en scoring ESG');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSustainabilityReport = useCallback(async (
    companyId: string,
    period: { start: string; end: string },
    includeRecommendations: boolean = true
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-esg-carbon',
        {
          body: {
            action: 'sustainability_report',
            company_id: companyId,
            period,
            include_recommendations: includeRecommendations
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setReport(data.data);
        return data.data;
      }

      throw new Error(data?.error || 'Error generando informe');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en informe de sostenibilidad');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateReductionPlan = useCallback(async (
    companyId: string,
    currentEmissions: number,
    targetReduction: number,
    timeframeMonths: number = 12
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-esg-carbon',
        {
          body: {
            action: 'reduction_plan',
            company_id: companyId,
            current_emissions: currentEmissions,
            target_reduction: targetReduction,
            timeframe_months: timeframeMonths
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Plan de reducción generado');
        return data.data;
      }

      throw new Error(data?.error || 'Error generando plan');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error en plan de reducción');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    carbonFootprint,
    esgScore,
    report,
    error,
    calculateCarbonFootprint,
    calculateESGScore,
    generateSustainabilityReport,
    generateReductionPlan
  };
}

export default useERPESGCarbon;
