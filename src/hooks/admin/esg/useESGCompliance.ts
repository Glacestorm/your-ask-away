/**
 * useESGCompliance Hook
 * Hook para gestionar ESG & Sustainability
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface CarbonFootprint {
  scope1: {
    breakdown: Record<string, number>;
    total: number;
  };
  scope2: {
    breakdown: Record<string, number>;
    total: number;
  };
  scope3: {
    breakdown: Record<string, number>;
    total: number;
  };
  total_emissions_kg: number;
  total_emissions_tons: number;
  per_employee: number;
  per_million_revenue: number;
  carbon_intensity: number;
  region: string;
  calculation_date: string;
  methodology: string;
  recommendations: string[];
}

export interface ESGScore {
  environmental: {
    score: number;
    risks: string[];
    opportunities: string[];
  };
  social: {
    score: number;
    risks: string[];
    opportunities: string[];
  };
  governance: {
    score: number;
    risks: string[];
    opportunities: string[];
  };
  overall_score: number;
  rating: string;
  key_risks: string[];
  action_plan: string[];
  sdg_alignment: string[];
  materiality_matrix: Array<{
    topic: string;
    importance: number;
    impact: number;
  }>;
}

export interface SustainabilityReport {
  report_title: string;
  executive_summary: string;
  sections: Array<{
    section_id: string;
    title: string;
    content: string;
    metrics: Array<{ name: string; value: string; unit: string; trend: string }>;
    targets: Array<{ name: string; target: string; progress: number }>;
    disclosures: string[];
  }>;
  materiality_assessment: string;
  governance_structure: string;
  risk_management: string;
  strategy: string;
  targets_and_metrics: string;
  compliance_checklist: Array<{ requirement: string; status: string }>;
  assurance_statement: string;
  appendices: string[];
}

export interface CarbonTarget {
  id: string;
  name: string;
  baseline: number;
  target: number;
  current: number;
  deadline: string;
  progress: number;
  expected_progress: number;
  on_track: boolean;
  remaining: number;
  annual_reduction_needed: number;
}

export interface CarbonOffset {
  id: string;
  name: string;
  price_per_ton: number;
  type: string;
  location: string;
  rating: number;
  tons_available: number;
  total_cost: number;
  verification: string;
  co_benefits: string[];
}

export interface SupplyChainAnalysis {
  high_risk_suppliers: Array<{
    name: string;
    risk_score: number;
    main_risks: string[];
  }>;
  country_risk_matrix: Array<{
    country: string;
    environmental_risk: string;
    social_risk: string;
    governance_risk: string;
  }>;
  category_analysis: Array<{
    category: string;
    emissions_intensity: string;
    recommendations: string[];
  }>;
  scope3_hotspots: string[];
  due_diligence_recommendations: string[];
  supplier_engagement_plan: string[];
}

export interface IndustryBenchmark {
  environmental: number;
  social: number;
  governance: number;
}

export interface ESGContext {
  organizationId?: string;
  industry?: string;
  region?: string;
  period?: string;
}

// === HOOK ===

export function useESGCompliance() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprint | null>(null);
  const [esgScore, setESGScore] = useState<ESGScore | null>(null);
  const [report, setReport] = useState<SustainabilityReport | null>(null);
  const [targets, setTargets] = useState<CarbonTarget[]>([]);
  const [offsets, setOffsets] = useState<CarbonOffset[]>([]);
  const [supplyChainAnalysis, setSupplyChainAnalysis] = useState<SupplyChainAnalysis | null>(null);
  const [benchmarks, setBenchmarks] = useState<Record<string, IndustryBenchmark>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === CALCULAR HUELLA DE CARBONO ===
  const calculateCarbonFootprint = useCallback(async (
    consumption: Record<string, number>,
    options: { region?: string; employees?: number; revenue?: number } = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'esg-sustainability',
        {
          body: {
            action: 'calculate_carbon',
            params: {
              consumption,
              region: options.region || 'europe',
              employees: options.employees || 1,
              revenue: options.revenue || 1000000
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setCarbonFootprint(data.data);
        setLastRefresh(new Date());
        return data.data as CarbonFootprint;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error calculando huella de carbono';
      setError(message);
      console.error('[useESGCompliance] calculateCarbonFootprint error:', err);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EVALUAR RIESGO ESG ===
  const assessESGRisk = useCallback(async (
    industry: string,
    companyData: Record<string, unknown> = {},
    context?: ESGContext
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'esg-sustainability',
        {
          body: {
            action: 'assess_esg_risk',
            params: { industry, companyData },
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setESGScore(data.data.assessment);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error evaluando riesgo ESG';
      setError(message);
      console.error('[useESGCompliance] assessESGRisk error:', err);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GENERAR INFORME ===
  const generateReport = useCallback(async (
    reportType: 'CSRD' | 'GRI' | 'TCFD' | 'SASB' | 'CDP',
    options: {
      period?: string;
      companyData?: Record<string, unknown>;
      emissions?: CarbonFootprint;
      esgScore?: ESGScore;
    } = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'esg-sustainability',
        {
          body: {
            action: 'generate_report',
            params: {
              reportType,
              period: options.period || new Date().getFullYear().toString(),
              companyData: options.companyData,
              emissions: options.emissions || carbonFootprint,
              esgScore: options.esgScore || esgScore
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setReport(data.data.report);
        setLastRefresh(new Date());
        toast.success(`Informe ${reportType} generado correctamente`);
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando informe';
      setError(message);
      console.error('[useESGCompliance] generateReport error:', err);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [carbonFootprint, esgScore]);

  // === OBTENER BENCHMARKS ===
  const getBenchmarks = useCallback(async (industry?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'esg-sustainability',
        {
          body: {
            action: 'get_benchmarks',
            params: { industry }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setBenchmarks(data.data.all_industries || {});
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useESGCompliance] getBenchmarks error:', err);
      return null;
    }
  }, []);

  // === OBTENER OPCIONES DE OFFSET ===
  const getOffsetOptions = useCallback(async (emissionsTons: number, budget?: number) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'esg-sustainability',
        {
          body: {
            action: 'get_offset_options',
            params: { emissions_tons: emissionsTons, budget }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setOffsets(data.data.options || []);
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useESGCompliance] getOffsetOptions error:', err);
      toast.error('Error obteniendo opciones de compensación');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SEGUIMIENTO DE OBJETIVOS ===
  const trackTargets = useCallback(async (
    targetsList: Array<{ name: string; baseline: number; target: number; current: number; deadline: string }>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'esg-sustainability',
        {
          body: {
            action: 'track_targets',
            params: { targets: targetsList }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setTargets(data.data.targets || []);
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useESGCompliance] trackTargets error:', err);
      return null;
    }
  }, []);

  // === ANÁLISIS DE CADENA DE SUMINISTRO ===
  const analyzeSupplyChain = useCallback(async (
    suppliers: Array<{ name: string; category: string; spend: number; country: string }>
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'esg-sustainability',
        {
          body: {
            action: 'analyze_supply_chain',
            params: { suppliers }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setSupplyChainAnalysis(data.data.analysis);
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useESGCompliance] analyzeSupplyChain error:', err);
      toast.error('Error analizando cadena de suministro');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: ESGContext, intervalMs = 300000) => {
    stopAutoRefresh();
    if (context.industry) {
      getBenchmarks(context.industry);
    }
    autoRefreshInterval.current = setInterval(() => {
      if (context.industry) {
        getBenchmarks(context.industry);
      }
    }, intervalMs);
  }, [getBenchmarks]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    carbonFootprint,
    esgScore,
    report,
    targets,
    offsets,
    supplyChainAnalysis,
    benchmarks,
    error,
    lastRefresh,
    // Acciones
    calculateCarbonFootprint,
    assessESGRisk,
    generateReport,
    getBenchmarks,
    getOffsetOptions,
    trackTargets,
    analyzeSupplyChain,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useESGCompliance;
