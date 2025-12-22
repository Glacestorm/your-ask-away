import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DAFOSuggestion {
  category: 'threats' | 'opportunities' | 'weaknesses' | 'strengths';
  items: {
    description: string;
    importance: number;
    concept: string;
    action_plan: string;
  }[];
}

interface BusinessPlanCoachResponse {
  section_recommendations: {
    section_number: number;
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  overall_assessment: string;
  improvement_areas: string[];
  strengths: string[];
}

interface ScenarioPrediction {
  scenario_type: 'optimistic' | 'realistic' | 'pessimistic';
  probability: number;
  projected_metrics: {
    revenue_year_5: number;
    profit_year_5: number;
    breakeven_year: number;
    npv: number;
    irr: number;
  };
  key_assumptions: string[];
  risks: string[];
}

export function useStrategicAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate DAFO suggestions using AI
  const generateDAFOSuggestions = useCallback(async (
    sectorKey: string,
    projectDescription: string,
    existingItems?: { category: string; description: string }[]
  ): Promise<DAFOSuggestion[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('strategic-ai', {
        body: {
          action: 'generate_dafo',
          data: {
            sector_key: sectorKey,
            project_description: projectDescription,
            existing_items: existingItems || []
          }
        }
      });

      if (fnError) throw fnError;
      
      // Log AI analysis
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('strategic_ai_analyses').insert({
        entity_type: 'dafo',
        entity_id: crypto.randomUUID(),
        analysis_type: 'generation',
        input_data: { sector_key: sectorKey, project_description: projectDescription },
        output_data: data.suggestions,
        model_used: 'gemini-2.5-flash',
        created_by: user?.user?.id
      });

      toast.success('Sugerencias DAFO generadas con IA');
      return data.suggestions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando sugerencias DAFO';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get AI coaching for Business Plan
  const getBusinessPlanCoaching = useCallback(async (
    evaluationId: string,
    sections: { section_number: number; section_name: string; section_score: number; questions: any[] }[]
  ): Promise<BusinessPlanCoachResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('strategic-ai', {
        body: {
          action: 'coach_business_plan',
          data: {
            evaluation_id: evaluationId,
            sections
          }
        }
      });

      if (fnError) throw fnError;

      // Log AI analysis
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('strategic_ai_analyses').insert({
        entity_type: 'business_plan',
        entity_id: evaluationId,
        analysis_type: 'coaching',
        input_data: { sections },
        output_data: data.coaching,
        model_used: 'gemini-2.5-flash',
        created_by: user?.user?.id
      });

      toast.success('Coaching de Business Plan generado');
      return data.coaching;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error obteniendo coaching';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Predict scenarios for Financial Plan
  const predictScenarios = useCallback(async (
    planId: string,
    baselineData: {
      revenues: number[];
      costs: number[];
      investments: number[];
      sector_key: string;
    }
  ): Promise<ScenarioPrediction[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('strategic-ai', {
        body: {
          action: 'predict_scenarios',
          data: {
            plan_id: planId,
            baseline_data: baselineData
          }
        }
      });

      if (fnError) throw fnError;

      // Log AI analysis
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('strategic_ai_analyses').insert({
        entity_type: 'financial_plan',
        entity_id: planId,
        analysis_type: 'prediction',
        input_data: baselineData,
        output_data: data.scenarios,
        model_used: 'gemini-2.5-flash',
        created_by: user?.user?.id
      });

      toast.success('Escenarios predichos con IA');
      return data.scenarios;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error prediciendo escenarios';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get sector benchmarks
  const getSectorBenchmarks = useCallback(async (sectorKey: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sector_chart_of_accounts')
        .select('optimal_ratios, z_score_coefficients')
        .eq('sector_key', sectorKey)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('Error fetching sector benchmarks:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    generateDAFOSuggestions,
    getBusinessPlanCoaching,
    predictScenarios,
    getSectorBenchmarks
  };
}
