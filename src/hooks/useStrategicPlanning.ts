import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// Types
export interface DafoAnalysis {
  id: string;
  company_id: string | null;
  project_name: string;
  description: string | null;
  analysis_date: string;
  status: string;
  ai_generated: boolean;
  sector_key: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DafoItem {
  id: string;
  dafo_id: string;
  category: string;
  description: string;
  importance: number;
  concept: string | null;
  action_plan: string | null;
  ai_suggestions: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessPlanEvaluation {
  id: string;
  company_id: string | null;
  project_name: string;
  project_description: string | null;
  evaluation_date: string;
  evaluator_id: string | null;
  total_score: number;
  viability_level: string | null;
  status: string;
  ai_recommendations: Json;
  created_at: string;
  updated_at: string;
}

export interface BusinessPlanSection {
  id: string;
  evaluation_id: string;
  section_number: number;
  section_name: string;
  section_weight: number;
  questions: Json;
  section_score: number;
  section_max_score: number;
  ai_recommendations: Json;
  notes: string | null;
}

export interface FinancialViabilityPlan {
  id: string;
  company_id: string | null;
  plan_name: string;
  description: string | null;
  start_year: number;
  projection_years: number;
  base_currency: string;
  status: string;
  synced_with_accounting: boolean;
  last_sync_at: string | null;
  sync_source: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialPlanAccount {
  id: string;
  plan_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_code: string | null;
  year: number;
  amount: number;
  source: string;
  formula: string | null;
  notes: string | null;
  sort_order: number;
}

export interface FinancialPlanRatio {
  id: string;
  plan_id: string;
  year: number;
  ratio_key: string;
  ratio_name: string;
  ratio_value: number | null;
  benchmark_value: number | null;
  status: string | null;
  category: string | null;
}

export interface FinancialScenario {
  id: string;
  plan_id: string;
  scenario_name: string;
  scenario_type: string;
  description: string | null;
  is_base_scenario: boolean;
  variables: Json;
  projections: Json;
  summary_metrics: Json;
  breakeven_year: number | null;
  npv: number | null;
  irr: number | null;
  payback_period: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// DAFO Hook
export function useDafoAnalysis(companyId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<DafoAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<DafoAnalysis | null>(null);
  const [items, setItems] = useState<DafoItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('business_dafo_analysis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setAnalyses((data || []) as DafoAnalysis[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching DAFO analyses');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchItems = useCallback(async (dafoId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('dafo_items')
        .select('*')
        .eq('dafo_id', dafoId)
        .order('sort_order', { ascending: true });
      
      if (fetchError) throw fetchError;
      setItems((data || []) as DafoItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching DAFO items');
    }
  }, []);

  const createAnalysis = useCallback(async (data: Partial<DafoAnalysis>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: newAnalysis, error: insertError } = await supabase
        .from('business_dafo_analysis')
        .insert({
          project_name: data.project_name || 'Nuevo Análisis DAFO',
          description: data.description,
          company_id: data.company_id,
          sector_key: data.sector_key,
          status: data.status || 'draft',
          ai_generated: data.ai_generated || false,
          created_by: user?.user?.id
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      toast.success('Análisis DAFO creado');
      await fetchAnalyses();
      return newAnalysis as DafoAnalysis;
    } catch (err) {
      toast.error('Error al crear análisis DAFO');
      throw err;
    }
  }, [fetchAnalyses]);

  const updateAnalysis = useCallback(async (id: string, data: Partial<DafoAnalysis>) => {
    try {
      const { error: updateError } = await supabase
        .from('business_dafo_analysis')
        .update({
          project_name: data.project_name,
          description: data.description,
          status: data.status,
          sector_key: data.sector_key
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      toast.success('Análisis DAFO actualizado');
      await fetchAnalyses();
    } catch (err) {
      toast.error('Error al actualizar análisis DAFO');
      throw err;
    }
  }, [fetchAnalyses]);

  const addItem = useCallback(async (dafoId: string, item: Partial<DafoItem>) => {
    try {
      const { error: insertError } = await supabase
        .from('dafo_items')
        .insert({
          dafo_id: dafoId,
          category: item.category || 'strengths',
          description: item.description || '',
          importance: item.importance || 5,
          concept: item.concept,
          action_plan: item.action_plan,
          sort_order: item.sort_order || 0
        });
      
      if (insertError) throw insertError;
      await fetchItems(dafoId);
    } catch (err) {
      toast.error('Error al añadir elemento');
      throw err;
    }
  }, [fetchItems]);

  const updateItem = useCallback(async (itemId: string, data: Partial<DafoItem>, dafoId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('dafo_items')
        .update({
          description: data.description,
          importance: data.importance,
          concept: data.concept,
          action_plan: data.action_plan,
          sort_order: data.sort_order
        })
        .eq('id', itemId);
      
      if (updateError) throw updateError;
      await fetchItems(dafoId);
    } catch (err) {
      toast.error('Error al actualizar elemento');
      throw err;
    }
  }, [fetchItems]);

  const deleteItem = useCallback(async (itemId: string, dafoId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('dafo_items')
        .delete()
        .eq('id', itemId);
      
      if (deleteError) throw deleteError;
      await fetchItems(dafoId);
    } catch (err) {
      toast.error('Error al eliminar elemento');
      throw err;
    }
  }, [fetchItems]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  return {
    analyses,
    currentAnalysis,
    setCurrentAnalysis,
    items,
    isLoading,
    error,
    fetchAnalyses,
    fetchItems,
    createAnalysis,
    updateAnalysis,
    addItem,
    updateItem,
    deleteItem
  };
}

// Business Plan Evaluation Hook
export function useBusinessPlanEvaluation(companyId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<BusinessPlanEvaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<BusinessPlanEvaluation | null>(null);
  const [sections, setSections] = useState<BusinessPlanSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const SECTION_TEMPLATES = [
    { number: 1, name: 'Idea de Negocio', weight: 0.10 },
    { number: 2, name: 'Equipo Promotor', weight: 0.12 },
    { number: 3, name: 'Análisis de Mercado', weight: 0.12 },
    { number: 4, name: 'Estrategia Comercial', weight: 0.10 },
    { number: 5, name: 'Plan de Operaciones', weight: 0.10 },
    { number: 6, name: 'Organización y RRHH', weight: 0.08 },
    { number: 7, name: 'Plan Económico-Financiero', weight: 0.15 },
    { number: 8, name: 'Viabilidad del Proyecto', weight: 0.10 },
    { number: 9, name: 'Aspectos Legales', weight: 0.05 },
    { number: 10, name: 'Presentación y Documentación', weight: 0.08 }
  ];

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('business_plan_evaluations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setEvaluations((data || []) as BusinessPlanEvaluation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching evaluations');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchSections = useCallback(async (evaluationId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('business_plan_sections')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('section_number', { ascending: true });
      
      if (fetchError) throw fetchError;
      setSections((data || []) as BusinessPlanSection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching sections');
    }
  }, []);

  const createEvaluation = useCallback(async (data: Partial<BusinessPlanEvaluation>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: newEval, error: insertError } = await supabase
        .from('business_plan_evaluations')
        .insert({
          project_name: data.project_name || 'Nueva Evaluación',
          project_description: data.project_description,
          company_id: data.company_id,
          evaluator_id: user?.user?.id,
          status: 'in_progress'
        })
        .select()
        .single();
      
      if (insertError) throw insertError;

      // Create default sections
      const sectionsToInsert = SECTION_TEMPLATES.map(s => ({
        evaluation_id: newEval.id,
        section_number: s.number,
        section_name: s.name,
        section_weight: s.weight,
        questions: [] as Json,
        section_score: 0,
        section_max_score: 100
      }));

      await supabase.from('business_plan_sections').insert(sectionsToInsert);

      toast.success('Evaluación creada');
      await fetchEvaluations();
      return newEval as BusinessPlanEvaluation;
    } catch (err) {
      toast.error('Error al crear evaluación');
      throw err;
    }
  }, [fetchEvaluations]);

  const updateSection = useCallback(async (sectionId: string, data: Partial<BusinessPlanSection>, evaluationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('business_plan_sections')
        .update({
          questions: data.questions,
          section_score: data.section_score,
          notes: data.notes
        })
        .eq('id', sectionId);
      
      if (updateError) throw updateError;
      await fetchSections(evaluationId);
    } catch (err) {
      toast.error('Error al actualizar sección');
      throw err;
    }
  }, [fetchSections]);

  const calculateTotalScore = useCallback((sectionsList: BusinessPlanSection[]) => {
    const totalScore = sectionsList.reduce((acc, section) => {
      const normalizedScore = (section.section_score / section.section_max_score) * 100;
      return acc + (normalizedScore * section.section_weight);
    }, 0);
    
    let viabilityLevel = 'critical';
    if (totalScore >= 80) viabilityLevel = 'excellent';
    else if (totalScore >= 65) viabilityLevel = 'good';
    else if (totalScore >= 50) viabilityLevel = 'acceptable';
    else if (totalScore >= 35) viabilityLevel = 'weak';
    
    return { totalScore, viabilityLevel };
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  return {
    evaluations,
    currentEvaluation,
    setCurrentEvaluation,
    sections,
    isLoading,
    error,
    fetchEvaluations,
    fetchSections,
    createEvaluation,
    updateSection,
    calculateTotalScore,
    SECTION_TEMPLATES
  };
}

// Financial Plan Hook
export function useFinancialPlan(companyId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<FinancialViabilityPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<FinancialViabilityPlan | null>(null);
  const [accounts, setAccounts] = useState<FinancialPlanAccount[]>([]);
  const [ratios, setRatios] = useState<FinancialPlanRatio[]>([]);
  const [scenarios, setScenarios] = useState<FinancialScenario[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('financial_viability_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setPlans((data || []) as FinancialViabilityPlan[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching financial plans');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchPlanDetails = useCallback(async (planId: string) => {
    try {
      const [accountsRes, ratiosRes, scenariosRes] = await Promise.all([
        supabase.from('financial_plan_accounts').select('*').eq('plan_id', planId).order('sort_order'),
        supabase.from('financial_plan_ratios').select('*').eq('plan_id', planId).order('year'),
        supabase.from('financial_scenarios').select('*').eq('plan_id', planId)
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (ratiosRes.error) throw ratiosRes.error;
      if (scenariosRes.error) throw scenariosRes.error;

      setAccounts((accountsRes.data || []) as FinancialPlanAccount[]);
      setRatios((ratiosRes.data || []) as FinancialPlanRatio[]);
      setScenarios((scenariosRes.data || []) as FinancialScenario[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching plan details');
    }
  }, []);

  const createPlan = useCallback(async (data: Partial<FinancialViabilityPlan>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: newPlan, error: insertError } = await supabase
        .from('financial_viability_plans')
        .insert({
          plan_name: data.plan_name || 'Nuevo Plan Financiero',
          description: data.description,
          company_id: data.company_id,
          start_year: data.start_year || new Date().getFullYear(),
          projection_years: data.projection_years || 5,
          status: 'draft',
          created_by: user?.user?.id
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      toast.success('Plan financiero creado');
      await fetchPlans();
      return newPlan as FinancialViabilityPlan;
    } catch (err) {
      toast.error('Error al crear plan financiero');
      throw err;
    }
  }, [fetchPlans]);

  const updatePlan = useCallback(async (id: string, data: Partial<FinancialViabilityPlan>) => {
    try {
      const { error: updateError } = await supabase
        .from('financial_viability_plans')
        .update({
          plan_name: data.plan_name,
          description: data.description,
          status: data.status
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      toast.success('Plan financiero actualizado');
      await fetchPlans();
    } catch (err) {
      toast.error('Error al actualizar plan financiero');
      throw err;
    }
  }, [fetchPlans]);

  const upsertAccount = useCallback(async (planId: string, account: Partial<FinancialPlanAccount>) => {
    try {
      const { error: upsertError } = await supabase
        .from('financial_plan_accounts')
        .upsert({
          plan_id: planId,
          account_code: account.account_code || '',
          account_name: account.account_name || '',
          account_type: account.account_type || 'balance_asset',
          year: account.year || new Date().getFullYear(),
          amount: account.amount || 0,
          source: account.source || 'manual'
        }, {
          onConflict: 'plan_id,account_code,year'
        });
      
      if (upsertError) throw upsertError;
      await fetchPlanDetails(planId);
    } catch (err) {
      toast.error('Error al guardar cuenta');
      throw err;
    }
  }, [fetchPlanDetails]);

  const createScenario = useCallback(async (planId: string, scenario: Partial<FinancialScenario>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: newScenario, error: insertError } = await supabase
        .from('financial_scenarios')
        .insert({
          plan_id: planId,
          scenario_name: scenario.scenario_name || 'Nuevo Escenario',
          scenario_type: scenario.scenario_type || 'custom',
          description: scenario.description,
          is_base_scenario: scenario.is_base_scenario || false,
          variables: scenario.variables || {},
          projections: scenario.projections || {},
          summary_metrics: scenario.summary_metrics || {},
          created_by: user?.user?.id
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      toast.success('Escenario creado');
      await fetchPlanDetails(planId);
      return newScenario as FinancialScenario;
    } catch (err) {
      toast.error('Error al crear escenario');
      throw err;
    }
  }, [fetchPlanDetails]);

  // Financial calculations
  const calculateRatios = useCallback((accountsByYear: Record<number, FinancialPlanAccount[]>) => {
    const calculatedRatios: Partial<FinancialPlanRatio>[] = [];
    
    Object.entries(accountsByYear).forEach(([year, accts]) => {
      const getAmount = (code: string) => accts.find(a => a.account_code === code)?.amount || 0;
      
      // Assets
      const currentAssets = getAmount('10') + getAmount('30') + getAmount('40') + getAmount('57');
      const totalAssets = getAmount('20') + getAmount('21') + getAmount('22') + currentAssets;
      
      // Liabilities
      const currentLiabilities = getAmount('40P') + getAmount('52');
      const longTermDebt = getAmount('17');
      const totalEquity = getAmount('10E') + getAmount('11') + getAmount('12');
      
      // P&L
      const revenue = getAmount('70');
      const operatingProfit = getAmount('EBIT');
      const netProfit = getAmount('129');
      
      // Liquidity Ratios
      calculatedRatios.push({
        year: parseInt(year),
        ratio_key: 'current_ratio',
        ratio_name: 'Ratio de Liquidez',
        ratio_value: currentLiabilities ? currentAssets / currentLiabilities : 0,
        benchmark_value: 1.5,
        category: 'liquidity'
      });
      
      // Solvency Ratios
      calculatedRatios.push({
        year: parseInt(year),
        ratio_key: 'debt_ratio',
        ratio_name: 'Ratio de Endeudamiento',
        ratio_value: totalEquity ? (currentLiabilities + longTermDebt) / totalEquity : 0,
        benchmark_value: 0.6,
        category: 'solvency'
      });
      
      // Profitability Ratios
      calculatedRatios.push({
        year: parseInt(year),
        ratio_key: 'roa',
        ratio_name: 'ROA (Rentabilidad sobre Activos)',
        ratio_value: totalAssets ? (netProfit / totalAssets) * 100 : 0,
        benchmark_value: 5,
        category: 'profitability'
      });
      
      calculatedRatios.push({
        year: parseInt(year),
        ratio_key: 'roe',
        ratio_name: 'ROE (Rentabilidad sobre Fondos Propios)',
        ratio_value: totalEquity ? (netProfit / totalEquity) * 100 : 0,
        benchmark_value: 10,
        category: 'profitability'
      });
      
      calculatedRatios.push({
        year: parseInt(year),
        ratio_key: 'operating_margin',
        ratio_name: 'Margen Operativo',
        ratio_value: revenue ? (operatingProfit / revenue) * 100 : 0,
        benchmark_value: 8,
        category: 'profitability'
      });
    });
    
    return calculatedRatios;
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    currentPlan,
    setCurrentPlan,
    accounts,
    ratios,
    scenarios,
    isLoading,
    error,
    fetchPlans,
    fetchPlanDetails,
    createPlan,
    updatePlan,
    upsertAccount,
    createScenario,
    calculateRatios
  };
}
