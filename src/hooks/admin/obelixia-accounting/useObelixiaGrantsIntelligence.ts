/**
 * useObelixiaGrantsIntelligence Hook
 * Fase 15 Extended: Strategic Financial Agent - Grants Intelligence Module
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Grant = Database['public']['Tables']['obelixia_grants']['Row'];
type GrantApplication = Database['public']['Tables']['obelixia_grant_applications']['Row'];

export type { Grant, GrantApplication };

export interface GrantsContext {
  companyProfile?: Record<string, unknown>;
  sectors?: string[];
  region?: string;
  companySize?: string;
  fundingNeeds?: number;
}

export function useObelixiaGrantsIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch available grants - first try DB, then fallback to AI scan
  const fetchGrants = useCallback(async (filters?: { level?: string; status?: string; sector?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to get from database
      let query = supabase
        .from('obelixia_grants')
        .select('*')
        .eq('status', 'active')
        .order('deadline_date', { ascending: true });

      if (filters?.level) query = query.eq('level', filters.level);

      const { data, error: fetchError } = await query.limit(50);

      // If we have data from DB, use it
      if (!fetchError && data && data.length > 0) {
        setGrants(data);
        setLastRefresh(new Date());
        return data;
      }

      // Otherwise, use AI to scan for grants
      console.log('[useObelixiaGrantsIntelligence] No DB data, using AI scan');
      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        'obelixia-grants-intelligence',
        {
          body: {
            action: 'scan_grants',
            context: {
              companyType: 'startup',
              sector: filters?.sector || 'technology',
              region: 'catalonia'
            }
          }
        }
      );

      if (aiError) throw aiError;

      if (aiData?.success && aiData?.data?.grants) {
        // Transform AI results to match Grant type structure
        const aiGrants = aiData.data.grants.map((g: any, index: number) => ({
          id: g.id || `ai-grant-${Date.now()}-${index}`,
          name: g.name,
          description: g.aiNotes || `${g.organization} - ${g.type}`,
          organization: g.organization,
          level: g.level,
          grant_type: g.type,
          min_amount: g.minAmount || 0,
          max_amount: g.maxAmount,
          deadline_date: g.deadline,
          status: 'active',
          sectors: g.focus || [],
          requirements: g.requirements || [],
          eligibility_criteria: g.requirements || [],
          source_url: g.sourceUrl || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setGrants(aiGrants as any);
        setLastRefresh(new Date());
        return aiGrants;
      }

      setGrants([]);
      setLastRefresh(new Date());
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching grants';
      setError(message);
      console.error('[useObelixiaGrantsIntelligence] fetchGrants error:', err);
      setGrants([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's grant applications
  const fetchApplications = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('obelixia_grant_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setApplications(data || []);
      return data;
    } catch (err) {
      console.error('[useObelixiaGrantsIntelligence] fetchApplications error:', err);
      return null;
    }
  }, []);

  // Analyze eligibility for a grant using AI
  const analyzeEligibility = useCallback(async (
    grantId: string,
    companyProfile: Record<string, unknown>
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-grants-intelligence',
        {
          body: {
            action: 'analyze_eligibility',
            grantId,
            companyProfile
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Análisis de elegibilidad completado');
        await fetchApplications();
        return data.data;
      }

      throw new Error(data?.error || 'Error en análisis');
    } catch (err) {
      console.error('[useObelixiaGrantsIntelligence] analyzeEligibility error:', err);
      toast.error('Error al analizar elegibilidad');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchApplications]);

  // Search grants using AI
  const searchGrants = useCallback(async (context: GrantsContext) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-grants-intelligence',
        {
          body: {
            action: 'search_grants',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      throw new Error(data?.error || 'Error en búsqueda');
    } catch (err) {
      console.error('[useObelixiaGrantsIntelligence] searchGrants error:', err);
      toast.error('Error al buscar subvenciones');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate application draft
  const generateApplicationDraft = useCallback(async (
    grantId: string,
    companyProfile: Record<string, unknown>
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-grants-intelligence',
        {
          body: {
            action: 'generate_application',
            grantId,
            companyProfile
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Borrador de solicitud generado');
        return data.data;
      }

      throw new Error(data?.error || 'Error generando borrador');
    } catch (err) {
      console.error('[useObelixiaGrantsIntelligence] generateApplicationDraft error:', err);
      toast.error('Error al generar borrador');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh
  const startAutoRefresh = useCallback((intervalMs = 300000) => {
    stopAutoRefresh();
    fetchGrants();
    fetchApplications();
    autoRefreshInterval.current = setInterval(() => {
      fetchGrants();
      fetchApplications();
    }, intervalMs);
  }, [fetchGrants, fetchApplications]);

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
    grants,
    applications,
    error,
    lastRefresh,
    fetchGrants,
    fetchApplications,
    analyzeEligibility,
    searchGrants,
    generateApplicationDraft,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaGrantsIntelligence;
