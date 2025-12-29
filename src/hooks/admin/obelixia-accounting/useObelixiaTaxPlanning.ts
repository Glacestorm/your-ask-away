/**
 * useObelixiaTaxPlanning - Fase 9: Intelligent Tax Planning & Optimization
 * Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface TaxOptimization {
  id: string;
  category: 'deduction' | 'credit' | 'timing' | 'structure' | 'incentive';
  title: string;
  description: string;
  potentialSavings: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  deadline: string | null;
  requirements: string[];
  status: 'identified' | 'in_review' | 'approved' | 'implemented' | 'rejected';
  aiConfidence: number;
}

export interface TaxScenario {
  id: string;
  name: string;
  description: string;
  assumptions: Record<string, number | string>;
  projectedTaxLiability: number;
  effectiveTaxRate: number;
  comparedToBase: number;
  recommendations: string[];
  createdAt: string;
}

export interface TaxCalendarEvent {
  id: string;
  eventType: 'filing' | 'payment' | 'deadline' | 'review' | 'planning';
  title: string;
  description: string;
  dueDate: string;
  taxType: string;
  estimatedAmount: number | null;
  status: 'pending' | 'completed' | 'overdue' | 'upcoming';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reminderDays: number[];
}

export interface DeductionOpportunity {
  id: string;
  category: string;
  description: string;
  currentAmount: number;
  maxAllowable: number;
  potentialAdditional: number;
  requirements: string[];
  expiresAt: string | null;
  confidence: number;
}

export interface TaxSummary {
  currentYearLiability: number;
  estimatedAnnualTax: number;
  effectiveTaxRate: number;
  potentialSavings: number;
  optimizationsIdentified: number;
  upcomingDeadlines: number;
  complianceScore: number;
  yearOverYearChange: number;
}

export interface TaxPlanningContext {
  organizationId?: string;
  fiscalYear?: number;
  jurisdiction?: string;
  entityType?: string;
}

// === HOOK ===
export function useObelixiaTaxPlanning() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [optimizations, setOptimizations] = useState<TaxOptimization[]>([]);
  const [scenarios, setScenarios] = useState<TaxScenario[]>([]);
  const [calendar, setCalendar] = useState<TaxCalendarEvent[]>([]);
  const [deductions, setDeductions] = useState<DeductionOpportunity[]>([]);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs for auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH TAX SUMMARY ===
  const fetchTaxSummary = useCallback(async (context?: TaxPlanningContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-tax-planning',
        {
          body: {
            action: 'get_tax_summary',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setSummary(fnData.data.summary || null);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response from tax planning function');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching tax summary';
      setError(message);
      console.error('[useObelixiaTaxPlanning] fetchTaxSummary error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET OPTIMIZATION OPPORTUNITIES ===
  const getOptimizationOpportunities = useCallback(async (context?: TaxPlanningContext) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-tax-planning',
        {
          body: {
            action: 'analyze_optimizations',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setOptimizations(fnData.data.optimizations || []);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTaxPlanning] getOptimizationOpportunities error:', err);
      toast.error('Error al analizar optimizaciones fiscales');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SIMULATE TAX SCENARIO ===
  const simulateScenario = useCallback(async (
    scenarioName: string,
    assumptions: Record<string, number | string>,
    context?: TaxPlanningContext
  ) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-tax-planning',
        {
          body: {
            action: 'simulate_scenario',
            context,
            params: { scenarioName, assumptions }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        const newScenario = fnData.data.scenario;
        if (newScenario) {
          setScenarios(prev => [newScenario, ...prev]);
        }
        toast.success('Escenario simulado correctamente');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTaxPlanning] simulateScenario error:', err);
      toast.error('Error en simulación de escenario fiscal');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET TAX CALENDAR ===
  const getTaxCalendar = useCallback(async (context?: TaxPlanningContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-tax-planning',
        {
          body: {
            action: 'get_tax_calendar',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setCalendar(fnData.data.events || []);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTaxPlanning] getTaxCalendar error:', err);
      return null;
    }
  }, []);

  // === ANALYZE DEDUCTIONS ===
  const analyzeDeductions = useCallback(async (context?: TaxPlanningContext) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-tax-planning',
        {
          body: {
            action: 'analyze_deductions',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setDeductions(fnData.data.deductions || []);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTaxPlanning] analyzeDeductions error:', err);
      toast.error('Error al analizar deducciones');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE OPTIMIZATION STATUS ===
  const updateOptimizationStatus = useCallback(async (
    optimizationId: string,
    status: TaxOptimization['status'],
    notes?: string
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-tax-planning',
        {
          body: {
            action: 'update_optimization',
            params: { optimizationId, status, notes }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setOptimizations(prev => prev.map(o => 
          o.id === optimizationId ? { ...o, status } : o
        ));
        toast.success('Estado actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useObelixiaTaxPlanning] updateOptimizationStatus error:', err);
      toast.error('Error al actualizar estado');
      return false;
    }
  }, []);

  // === GENERATE TAX REPORT ===
  const generateTaxReport = useCallback(async (
    reportType: 'summary' | 'detailed' | 'planning',
    context?: TaxPlanningContext
  ) => {
    setIsLoading(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-tax-planning',
        {
          body: {
            action: 'generate_report',
            context,
            params: { reportType }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        toast.success('Informe generado correctamente');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaTaxPlanning] generateTaxReport error:', err);
      toast.error('Error al generar informe fiscal');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === REFRESH ALL DATA ===
  const refreshAll = useCallback(async (context?: TaxPlanningContext) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTaxSummary(context),
        getOptimizationOpportunities(context),
        getTaxCalendar(context),
        analyzeDeductions(context)
      ]);
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [fetchTaxSummary, getOptimizationOpportunities, getTaxCalendar, analyzeDeductions]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: TaxPlanningContext, intervalMs = 180000) => {
    stopAutoRefresh();
    refreshAll(context);
    autoRefreshInterval.current = setInterval(() => {
      refreshAll(context);
    }, intervalMs);
  }, [refreshAll]);

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
    // State
    isLoading,
    optimizations,
    scenarios,
    calendar,
    deductions,
    summary,
    error,
    lastRefresh,
    // Actions
    fetchTaxSummary,
    getOptimizationOpportunities,
    simulateScenario,
    getTaxCalendar,
    analyzeDeductions,
    updateOptimizationStatus,
    generateTaxReport,
    refreshAll,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaTaxPlanning;
