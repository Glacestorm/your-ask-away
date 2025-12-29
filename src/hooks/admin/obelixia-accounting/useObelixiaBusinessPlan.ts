/**
 * useObelixiaBusinessPlan Hook
 * Fase 15 Extended: Strategic Financial Agent - Business Plan Generator
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type BusinessPlan = Database['public']['Tables']['obelixia_business_plans']['Row'];

export type { BusinessPlan };

export interface BusinessPlanContext {
  companyName: string;
  industry: string;
  businessModel?: string;
  targetMarket?: string;
  fundingGoal?: number;
  teamSize?: number;
  existingRevenue?: number;
}

export function useObelixiaBusinessPlan() {
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<BusinessPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch all business plans
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('obelixia_business_plans')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPlans(data || []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching plans';
      setError(message);
      console.error('[useObelixiaBusinessPlan] fetchPlans error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new business plan using AI
  const generatePlan = useCallback(async (context: BusinessPlanContext) => {
    setIsLoading(true);
    setGenerationProgress(10);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-business-plan-generator',
        {
          body: {
            action: 'generate_plan',
            context
          }
        }
      );

      setGenerationProgress(90);

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Plan de negocio generado exitosamente');
        setGenerationProgress(100);
        await fetchPlans();
        return data.data;
      }

      throw new Error(data?.error || 'Error generando plan');
    } catch (err) {
      console.error('[useObelixiaBusinessPlan] generatePlan error:', err);
      toast.error('Error al generar plan de negocio');
      return null;
    } finally {
      setIsLoading(false);
      setGenerationProgress(0);
    }
  }, [fetchPlans]);

  // Generate specific section
  const generateSection = useCallback(async (
    planId: string,
    section: string,
    context: Record<string, unknown>
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-business-plan-generator',
        {
          body: {
            action: 'generate_section',
            planId,
            section,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Sección "${section}" generada`);
        await fetchPlans();
        return data.data;
      }

      throw new Error(data?.error || 'Error generando sección');
    } catch (err) {
      console.error('[useObelixiaBusinessPlan] generateSection error:', err);
      toast.error('Error al generar sección');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlans]);

  // Update plan
  const updatePlan = useCallback(async (
    planId: string,
    updates: Database['public']['Tables']['obelixia_business_plans']['Update']
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('obelixia_business_plans')
        .update(updates)
        .eq('id', planId);

      if (updateError) throw updateError;

      toast.success('Plan actualizado');
      await fetchPlans();
      return true;
    } catch (err) {
      console.error('[useObelixiaBusinessPlan] updatePlan error:', err);
      toast.error('Error al actualizar plan');
      return false;
    }
  }, [fetchPlans]);

  // Export plan to PDF data
  const exportPlan = useCallback(async (planId: string, format: 'pdf' | 'docx' | 'json') => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-business-plan-generator',
        {
          body: {
            action: 'export_plan',
            planId,
            format
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Plan exportado');
        return data.data;
      }

      throw new Error(data?.error || 'Error exportando');
    } catch (err) {
      console.error('[useObelixiaBusinessPlan] exportPlan error:', err);
      toast.error('Error al exportar plan');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get AI suggestions for improvement
  const getAISuggestions = useCallback(async (planId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-business-plan-generator',
        {
          body: {
            action: 'get_suggestions',
            planId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      throw new Error(data?.error || 'Error obteniendo sugerencias');
    } catch (err) {
      console.error('[useObelixiaBusinessPlan] getAISuggestions error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh
  const startAutoRefresh = useCallback((intervalMs = 300000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchPlans();
    autoRefreshInterval.current = setInterval(fetchPlans, intervalMs);
  }, [fetchPlans]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    plans,
    currentPlan,
    error,
    generationProgress,
    setCurrentPlan,
    fetchPlans,
    generatePlan,
    generateSection,
    updatePlan,
    exportPlan,
    getAISuggestions,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaBusinessPlan;
