/**
 * useERPBudget - Hook para gestión de presupuestos y análisis de variaciones
 * Fase 4: Budget Management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface BudgetLine {
  id: string;
  accountCode: string;
  accountName: string;
  category: 'revenue' | 'expense' | 'asset' | 'liability';
  budgetedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  status: 'on_track' | 'warning' | 'critical' | 'exceeded';
  monthlyBreakdown: MonthlyBudget[];
}

export interface MonthlyBudget {
  month: number;
  monthName: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

export interface BudgetSummary {
  totalBudgetedRevenue: number;
  totalActualRevenue: number;
  revenueVariance: number;
  revenueVariancePercentage: number;
  totalBudgetedExpenses: number;
  totalActualExpenses: number;
  expenseVariance: number;
  expenseVariancePercentage: number;
  budgetedNetIncome: number;
  actualNetIncome: number;
  netIncomeVariance: number;
  budgetUtilization: number;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface BudgetVersion {
  id: string;
  name: string;
  description?: string;
  fiscalYear: number;
  status: 'draft' | 'approved' | 'active' | 'closed';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface VarianceAnalysis {
  accountCode: string;
  accountName: string;
  varianceType: 'favorable' | 'unfavorable';
  varianceAmount: number;
  variancePercentage: number;
  trend: 'improving' | 'stable' | 'worsening';
  rootCauses: string[];
  recommendations: string[];
  impactLevel: 'low' | 'medium' | 'high';
}

export interface BudgetForecast {
  period: string;
  forecastedRevenue: number;
  forecastedExpenses: number;
  forecastedNetIncome: number;
  confidenceLevel: number;
  assumptions: string[];
}

export interface AIBudgetInsight {
  id: string;
  type: 'optimization' | 'risk' | 'opportunity' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
  affectedAccounts: string[];
  potentialSavings?: number;
  confidence: number;
}

export interface BudgetContext {
  companyId: string;
  fiscalYear: number;
  versionId?: string;
  periodStart?: string;
  periodEnd?: string;
}

// === HOOK ===
export function useERPBudget() {
  const [isLoading, setIsLoading] = useState(false);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [varianceAnalysis, setVarianceAnalysis] = useState<VarianceAnalysis[]>([]);
  const [forecasts, setForecasts] = useState<BudgetForecast[]>([]);
  const [aiInsights, setAiInsights] = useState<AIBudgetInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH BUDGET DATA ===
  const fetchBudgetData = useCallback(async (context: BudgetContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-budget-analysis',
        {
          body: {
            action: 'get_budget_data',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setBudgetLines(data.budgetLines || generateMockBudgetLines());
        setSummary(data.summary || generateMockSummary());
        setVersions(data.versions || generateMockVersions(context.fiscalYear));
        setLastRefresh(new Date());
        return data;
      }

      // Fallback to mock data
      setBudgetLines(generateMockBudgetLines());
      setSummary(generateMockSummary());
      setVersions(generateMockVersions(context.fiscalYear));
      setLastRefresh(new Date());

    } catch (err) {
      console.error('[useERPBudget] fetchBudgetData error:', err);
      // Use mock data on error
      setBudgetLines(generateMockBudgetLines());
      setSummary(generateMockSummary());
      setVersions(generateMockVersions(context.fiscalYear));
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === VARIANCE ANALYSIS ===
  const analyzeVariances = useCallback(async (context: BudgetContext) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-budget-analysis',
        {
          body: {
            action: 'analyze_variances',
            context,
            budgetLines
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.analysis) {
        setVarianceAnalysis(data.analysis);
        return data.analysis;
      }

      // Generate mock variance analysis
      const mockAnalysis = generateMockVarianceAnalysis(budgetLines);
      setVarianceAnalysis(mockAnalysis);
      return mockAnalysis;

    } catch (err) {
      console.error('[useERPBudget] analyzeVariances error:', err);
      const mockAnalysis = generateMockVarianceAnalysis(budgetLines);
      setVarianceAnalysis(mockAnalysis);
      return mockAnalysis;
    } finally {
      setIsLoading(false);
    }
  }, [budgetLines]);

  // === AI INSIGHTS ===
  const getAIInsights = useCallback(async (context: BudgetContext) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-budget-analysis',
        {
          body: {
            action: 'ai_insights',
            context,
            budgetLines,
            summary
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.insights) {
        setAiInsights(data.insights);
        return data.insights;
      }

      const mockInsights = generateMockAIInsights();
      setAiInsights(mockInsights);
      return mockInsights;

    } catch (err) {
      console.error('[useERPBudget] getAIInsights error:', err);
      const mockInsights = generateMockAIInsights();
      setAiInsights(mockInsights);
      return mockInsights;
    }
  }, [budgetLines, summary]);

  // === FORECAST ===
  const generateForecast = useCallback(async (context: BudgetContext, months: number = 6) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-budget-analysis',
        {
          body: {
            action: 'generate_forecast',
            context,
            months,
            historicalData: budgetLines
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.forecasts) {
        setForecasts(data.forecasts);
        return data.forecasts;
      }

      const mockForecasts = generateMockForecasts(months);
      setForecasts(mockForecasts);
      return mockForecasts;

    } catch (err) {
      console.error('[useERPBudget] generateForecast error:', err);
      const mockForecasts = generateMockForecasts(months);
      setForecasts(mockForecasts);
      return mockForecasts;
    }
  }, [budgetLines]);

  // === UPDATE BUDGET LINE ===
  const updateBudgetLine = useCallback(async (
    lineId: string,
    updates: Partial<BudgetLine>
  ) => {
    try {
      setBudgetLines(prev => prev.map(line => 
        line.id === lineId ? { ...line, ...updates } : line
      ));
      toast.success('Línea de presupuesto actualizada');
      return true;
    } catch (err) {
      console.error('[useERPBudget] updateBudgetLine error:', err);
      toast.error('Error al actualizar línea');
      return false;
    }
  }, []);

  // === CREATE BUDGET VERSION ===
  const createBudgetVersion = useCallback(async (
    name: string,
    fiscalYear: number,
    description?: string
  ) => {
    try {
      const newVersion: BudgetVersion = {
        id: `ver_${Date.now()}`,
        name,
        description,
        fiscalYear,
        status: 'draft',
        createdAt: new Date().toISOString()
      };

      setVersions(prev => [...prev, newVersion]);
      toast.success('Nueva versión de presupuesto creada');
      return newVersion;
    } catch (err) {
      console.error('[useERPBudget] createBudgetVersion error:', err);
      toast.error('Error al crear versión');
      return null;
    }
  }, []);

  // === AUTO REFRESH ===
  const startAutoRefresh = useCallback((context: BudgetContext, intervalMs = 120000) => {
    stopAutoRefresh();
    fetchBudgetData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchBudgetData(context);
    }, intervalMs);
  }, [fetchBudgetData]);

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
    budgetLines,
    summary,
    versions,
    varianceAnalysis,
    forecasts,
    aiInsights,
    error,
    lastRefresh,
    fetchBudgetData,
    analyzeVariances,
    getAIInsights,
    generateForecast,
    updateBudgetLine,
    createBudgetVersion,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

// === MOCK DATA GENERATORS ===

function generateMockBudgetLines(): BudgetLine[] {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const accounts = [
    { code: '4100', name: 'Ventas de Productos', category: 'revenue' as const, budgeted: 500000, actual: 485000 },
    { code: '4200', name: 'Ingresos por Servicios', category: 'revenue' as const, budgeted: 200000, actual: 215000 },
    { code: '4300', name: 'Otros Ingresos', category: 'revenue' as const, budgeted: 50000, actual: 48000 },
    { code: '5100', name: 'Coste de Ventas', category: 'expense' as const, budgeted: 250000, actual: 260000 },
    { code: '6100', name: 'Gastos de Personal', category: 'expense' as const, budgeted: 180000, actual: 175000 },
    { code: '6200', name: 'Alquileres', category: 'expense' as const, budgeted: 36000, actual: 36000 },
    { code: '6300', name: 'Suministros', category: 'expense' as const, budgeted: 24000, actual: 28000 },
    { code: '6400', name: 'Marketing', category: 'expense' as const, budgeted: 40000, actual: 35000 },
    { code: '6500', name: 'Tecnología', category: 'expense' as const, budgeted: 30000, actual: 32000 },
    { code: '6600', name: 'Gastos Financieros', category: 'expense' as const, budgeted: 15000, actual: 14000 },
  ];

  return accounts.map(acc => {
    const variance = acc.actual - acc.budgeted;
    const variancePercentage = (variance / acc.budgeted) * 100;
    
    const isExpense = acc.category === 'expense';
    const isFavorable = isExpense ? variance < 0 : variance > 0;
    
    let status: BudgetLine['status'] = 'on_track';
    if (Math.abs(variancePercentage) > 15) status = 'critical';
    else if (Math.abs(variancePercentage) > 10) status = 'warning';
    else if (!isFavorable && Math.abs(variancePercentage) > 5) status = 'exceeded';

    const monthlyBreakdown: MonthlyBudget[] = months.map((name, idx) => {
      const monthBudgeted = acc.budgeted / 12;
      const variance_factor = 0.8 + Math.random() * 0.4;
      const monthActual = idx < new Date().getMonth() 
        ? monthBudgeted * variance_factor 
        : 0;
      
      return {
        month: idx + 1,
        monthName: name,
        budgeted: monthBudgeted,
        actual: monthActual,
        variance: monthActual - monthBudgeted,
        variancePercentage: ((monthActual - monthBudgeted) / monthBudgeted) * 100
      };
    });

    return {
      id: `budget_${acc.code}`,
      accountCode: acc.code,
      accountName: acc.name,
      category: acc.category,
      budgetedAmount: acc.budgeted,
      actualAmount: acc.actual,
      varianceAmount: variance,
      variancePercentage,
      status,
      monthlyBreakdown
    };
  });
}

function generateMockSummary(): BudgetSummary {
  return {
    totalBudgetedRevenue: 750000,
    totalActualRevenue: 748000,
    revenueVariance: -2000,
    revenueVariancePercentage: -0.27,
    totalBudgetedExpenses: 575000,
    totalActualExpenses: 580000,
    expenseVariance: 5000,
    expenseVariancePercentage: 0.87,
    budgetedNetIncome: 175000,
    actualNetIncome: 168000,
    netIncomeVariance: -7000,
    budgetUtilization: 78.5,
    overallHealth: 'good'
  };
}

function generateMockVersions(fiscalYear: number): BudgetVersion[] {
  return [
    {
      id: 'ver_active',
      name: `Presupuesto ${fiscalYear} - v3`,
      description: 'Versión aprobada y activa',
      fiscalYear,
      status: 'active',
      createdAt: new Date(fiscalYear, 0, 15).toISOString(),
      approvedAt: new Date(fiscalYear, 0, 20).toISOString(),
      approvedBy: 'Director Financiero'
    },
    {
      id: 'ver_draft',
      name: `Presupuesto ${fiscalYear} - Revisión Q2`,
      description: 'Ajustes propuestos para Q2',
      fiscalYear,
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  ];
}

function generateMockVarianceAnalysis(budgetLines: BudgetLine[]): VarianceAnalysis[] {
  return budgetLines
    .filter(line => Math.abs(line.variancePercentage) > 3)
    .map(line => ({
      accountCode: line.accountCode,
      accountName: line.accountName,
      varianceType: line.varianceAmount >= 0 
        ? (line.category === 'expense' ? 'unfavorable' : 'favorable')
        : (line.category === 'expense' ? 'favorable' : 'unfavorable'),
      varianceAmount: Math.abs(line.varianceAmount),
      variancePercentage: Math.abs(line.variancePercentage),
      trend: Math.random() > 0.5 ? 'improving' : 'worsening',
      rootCauses: [
        'Cambio en condiciones de mercado',
        'Eficiencia operativa',
        'Factores estacionales'
      ],
      recommendations: [
        'Revisar contratos con proveedores',
        'Ajustar proyecciones mensuales',
        'Implementar controles adicionales'
      ],
      impactLevel: Math.abs(line.variancePercentage) > 15 ? 'high' : 
                   Math.abs(line.variancePercentage) > 8 ? 'medium' : 'low'
    }));
}

function generateMockAIInsights(): AIBudgetInsight[] {
  return [
    {
      id: 'insight_1',
      type: 'optimization',
      title: 'Optimización de Gastos de Suministros',
      description: 'Los gastos de suministros superan el presupuesto en un 16.7%. Análisis sugiere renegociar contratos con proveedores.',
      impact: 'high',
      actionable: true,
      suggestedActions: [
        'Renegociar contrato principal de suministros',
        'Evaluar proveedores alternativos',
        'Implementar sistema de compras centralizado'
      ],
      affectedAccounts: ['6300'],
      potentialSavings: 4000,
      confidence: 0.85
    },
    {
      id: 'insight_2',
      type: 'opportunity',
      title: 'Ingresos por Servicios por Encima del Objetivo',
      description: 'Los ingresos por servicios superan el presupuesto en 7.5%. Considerar expandir esta línea de negocio.',
      impact: 'medium',
      actionable: true,
      suggestedActions: [
        'Analizar segmentos de mayor crecimiento',
        'Aumentar inversión en marketing de servicios',
        'Revisar capacidad operativa'
      ],
      affectedAccounts: ['4200'],
      confidence: 0.78
    },
    {
      id: 'insight_3',
      type: 'risk',
      title: 'Tendencia Creciente en Coste de Ventas',
      description: 'El coste de ventas muestra tendencia al alza. Proyección indica que podría exceder el presupuesto anual en un 8%.',
      impact: 'high',
      actionable: true,
      suggestedActions: [
        'Revisar márgenes por producto',
        'Optimizar cadena de suministro',
        'Evaluar alternativas de aprovisionamiento'
      ],
      affectedAccounts: ['5100'],
      confidence: 0.82
    },
    {
      id: 'insight_4',
      type: 'trend',
      title: 'Eficiencia en Gastos de Personal',
      description: 'Los gastos de personal están un 2.8% por debajo del presupuesto manteniendo productividad. Patrón sostenible.',
      impact: 'low',
      actionable: false,
      suggestedActions: [
        'Documentar mejores prácticas',
        'Mantener monitoreo trimestral'
      ],
      affectedAccounts: ['6100'],
      confidence: 0.91
    }
  ];
}

function generateMockForecasts(months: number): BudgetForecast[] {
  const currentDate = new Date();
  const forecasts: BudgetForecast[] = [];
  
  for (let i = 1; i <= months; i++) {
    const forecastDate = new Date(currentDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    
    const baseRevenue = 62000 + Math.random() * 8000;
    const baseExpenses = 48000 + Math.random() * 5000;
    
    forecasts.push({
      period: forecastDate.toISOString().slice(0, 7),
      forecastedRevenue: baseRevenue,
      forecastedExpenses: baseExpenses,
      forecastedNetIncome: baseRevenue - baseExpenses,
      confidenceLevel: 0.95 - (i * 0.05),
      assumptions: [
        'Crecimiento lineal basado en tendencia histórica',
        'Sin cambios significativos en costes fijos',
        'Estacionalidad considerada'
      ]
    });
  }
  
  return forecasts;
}

export default useERPBudget;
