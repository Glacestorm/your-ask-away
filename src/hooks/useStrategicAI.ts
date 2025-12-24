import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

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
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED STATES ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  // Generate DAFO suggestions using AI
  const generateDAFOSuggestions = useCallback(async (
    sectorKey: string,
    projectDescription: string,
    existingItems?: { category: string; description: string }[]
  ): Promise<DAFOSuggestion[]> => {
    const startTime = Date.now();
    setStatus('loading');
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

      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useStrategicAI', 'generateDAFOSuggestions', 'success', Date.now() - startTime);
      toast.success('Sugerencias DAFO generadas con IA');
      return data.suggestions;
    } catch (err) {
      const kbError = createKBError('DAFO_GENERATION_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useStrategicAI', 'generateDAFOSuggestions', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return [];
    }
  }, []);

  // Get AI coaching for Business Plan
  const getBusinessPlanCoaching = useCallback(async (
    evaluationId: string,
    sections: { section_number: number; section_name: string; section_score: number; questions: any[] }[]
  ): Promise<BusinessPlanCoachResponse | null> => {
    const startTime = Date.now();
    setStatus('loading');
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

      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useStrategicAI', 'getBusinessPlanCoaching', 'success', Date.now() - startTime);
      toast.success('Coaching de Business Plan generado');
      return data.coaching;
    } catch (err) {
      const kbError = createKBError('COACHING_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useStrategicAI', 'getBusinessPlanCoaching', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return null;
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
    const startTime = Date.now();
    setStatus('loading');
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

      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useStrategicAI', 'predictScenarios', 'success', Date.now() - startTime);
      toast.success('Escenarios predichos con IA');
      return data.scenarios;
    } catch (err) {
      const kbError = createKBError('SCENARIO_PREDICTION_ERROR', parseError(err), { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useStrategicAI', 'predictScenarios', 'error', Date.now() - startTime, kbError);
      toast.error(kbError.message);
      return [];
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
    generateDAFOSuggestions,
    getBusinessPlanCoaching,
    predictScenarios,
    getSectorBenchmarks,
    // === KB 2.0 STATE ===
    status,
    error,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
  };
}
