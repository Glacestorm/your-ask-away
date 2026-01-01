/**
 * useERPFinancialRatios - Hook para cálculo y análisis de ratios financieros
 * Fase 2: Ratios Financieros Avanzados con análisis IA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface LiquidityRatios {
  currentRatio: number | null;        // Activo corriente / Pasivo corriente
  quickRatio: number | null;          // (Activo corriente - Inventario) / Pasivo corriente
  cashRatio: number | null;           // Efectivo / Pasivo corriente
  workingCapital: number | null;      // Activo corriente - Pasivo corriente
  defensiveInterval: number | null;   // Activos líquidos / Gastos diarios
}

export interface SolvencyRatios {
  debtToEquity: number | null;        // Pasivo total / Patrimonio neto
  debtRatio: number | null;           // Pasivo total / Activo total
  equityRatio: number | null;         // Patrimonio neto / Activo total
  interestCoverage: number | null;    // EBIT / Gastos por intereses
  debtServiceCoverage: number | null; // EBITDA / Servicio de deuda
  financialLeverage: number | null;   // Activo total / Patrimonio neto
}

export interface ProfitabilityRatios {
  roe: number | null;                 // Return on Equity - Beneficio neto / Patrimonio neto
  roa: number | null;                 // Return on Assets - Beneficio neto / Activo total
  roic: number | null;                // Return on Invested Capital
  grossMargin: number | null;         // (Ingresos - Coste ventas) / Ingresos
  operatingMargin: number | null;     // EBIT / Ingresos
  netMargin: number | null;           // Beneficio neto / Ingresos
  ebitdaMargin: number | null;        // EBITDA / Ingresos
}

export interface EfficiencyRatios {
  inventoryTurnover: number | null;       // Coste ventas / Inventario medio
  inventoryDays: number | null;           // 365 / Rotación inventario
  receivablesTurnover: number | null;     // Ventas / Cuentas por cobrar medias
  daysReceivables: number | null;         // PMC - Días de cobro
  payablesTurnover: number | null;        // Compras / Cuentas por pagar medias
  daysPayables: number | null;            // PMP - Días de pago
  assetTurnover: number | null;           // Ventas / Activo total
  cashConversionCycle: number | null;     // Días inventario + Días cobro - Días pago
}

export interface MarketRatios {
  eps: number | null;                     // Earnings Per Share
  priceToEarnings: number | null;         // P/E ratio
  priceToBook: number | null;             // P/B ratio
  dividendYield: number | null;           // Dividendo / Precio
  payoutRatio: number | null;             // Dividendos / Beneficio neto
}

export interface FinancialRatiosData {
  liquidity: LiquidityRatios;
  solvency: SolvencyRatios;
  profitability: ProfitabilityRatios;
  efficiency: EfficiencyRatios;
  market?: MarketRatios;
  calculatedAt: string;
  fiscalYear: string;
  companyId: string;
}

export interface RatioAnalysis {
  category: string;
  ratioName: string;
  value: number | null;
  benchmark: number | null;
  industryAvg: number | null;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  interpretation: string;
  recommendation?: string;
}

export interface AIRatioInsight {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number;
  summary: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    area: string;
    action: string;
    expectedImpact: string;
  }>;
  sectorComparison: {
    sector: string;
    percentile: number;
    comparison: string;
  };
  trends: Array<{
    ratio: string;
    direction: 'improving' | 'stable' | 'deteriorating';
    note: string;
  }>;
}

export interface BalanceSheetData {
  // Activos
  currentAssets: number;
  cash: number;
  receivables: number;
  inventory: number;
  nonCurrentAssets: number;
  totalAssets: number;
  // Pasivos
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  totalLiabilities: number;
  // Patrimonio
  equity: number;
}

export interface IncomeStatementData {
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  ebit: number;
  ebitda: number;
  netIncome: number;
  depreciation: number;
}

// === HOOK ===
export function useERPFinancialRatios() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ratios, setRatios] = useState<FinancialRatiosData | null>(null);
  const [analysis, setAnalysis] = useState<RatioAnalysis[]>([]);
  const [aiInsights, setAiInsights] = useState<AIRatioInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === CALCULAR RATIOS DE LIQUIDEZ ===
  const calculateLiquidityRatios = useCallback((
    balance: BalanceSheetData,
    income?: IncomeStatementData
  ): LiquidityRatios => {
    const currentRatio = balance.currentLiabilities > 0 
      ? balance.currentAssets / balance.currentLiabilities 
      : null;
    
    const quickRatio = balance.currentLiabilities > 0 
      ? (balance.currentAssets - balance.inventory) / balance.currentLiabilities 
      : null;
    
    const cashRatio = balance.currentLiabilities > 0 
      ? balance.cash / balance.currentLiabilities 
      : null;
    
    const workingCapital = balance.currentAssets - balance.currentLiabilities;
    
    // Intervalo defensivo: días que puede operar con activos líquidos
    const dailyExpenses = income ? income.operatingExpenses / 365 : 0;
    const defensiveInterval = dailyExpenses > 0 
      ? (balance.cash + balance.receivables) / dailyExpenses 
      : null;

    return {
      currentRatio,
      quickRatio,
      cashRatio,
      workingCapital,
      defensiveInterval
    };
  }, []);

  // === CALCULAR RATIOS DE SOLVENCIA ===
  const calculateSolvencyRatios = useCallback((
    balance: BalanceSheetData,
    income?: IncomeStatementData
  ): SolvencyRatios => {
    const debtToEquity = balance.equity > 0 
      ? balance.totalLiabilities / balance.equity 
      : null;
    
    const debtRatio = balance.totalAssets > 0 
      ? balance.totalLiabilities / balance.totalAssets 
      : null;
    
    const equityRatio = balance.totalAssets > 0 
      ? balance.equity / balance.totalAssets 
      : null;
    
    const interestCoverage = income && income.interestExpense > 0 
      ? income.ebit / income.interestExpense 
      : null;
    
    // DSCR simplificado
    const debtServiceCoverage = income && income.interestExpense > 0 
      ? income.ebitda / (income.interestExpense * 1.2) // Aproximación
      : null;
    
    const financialLeverage = balance.equity > 0 
      ? balance.totalAssets / balance.equity 
      : null;

    return {
      debtToEquity,
      debtRatio,
      equityRatio,
      interestCoverage,
      debtServiceCoverage,
      financialLeverage
    };
  }, []);

  // === CALCULAR RATIOS DE RENTABILIDAD ===
  const calculateProfitabilityRatios = useCallback((
    balance: BalanceSheetData,
    income: IncomeStatementData
  ): ProfitabilityRatios => {
    const roe = balance.equity > 0 
      ? (income.netIncome / balance.equity) * 100 
      : null;
    
    const roa = balance.totalAssets > 0 
      ? (income.netIncome / balance.totalAssets) * 100 
      : null;
    
    // ROIC: Return on Invested Capital
    const investedCapital = balance.equity + balance.nonCurrentLiabilities;
    const roic = investedCapital > 0 
      ? (income.ebit * (1 - 0.25) / investedCapital) * 100 // Asumiendo 25% impuestos
      : null;
    
    const grossMargin = income.revenue > 0 
      ? (income.grossProfit / income.revenue) * 100 
      : null;
    
    const operatingMargin = income.revenue > 0 
      ? (income.operatingIncome / income.revenue) * 100 
      : null;
    
    const netMargin = income.revenue > 0 
      ? (income.netIncome / income.revenue) * 100 
      : null;
    
    const ebitdaMargin = income.revenue > 0 
      ? (income.ebitda / income.revenue) * 100 
      : null;

    return {
      roe,
      roa,
      roic,
      grossMargin,
      operatingMargin,
      netMargin,
      ebitdaMargin
    };
  }, []);

  // === CALCULAR RATIOS DE EFICIENCIA ===
  const calculateEfficiencyRatios = useCallback((
    balance: BalanceSheetData,
    income: IncomeStatementData,
    purchases?: number
  ): EfficiencyRatios => {
    const inventoryTurnover = balance.inventory > 0 
      ? income.costOfSales / balance.inventory 
      : null;
    
    const inventoryDays = inventoryTurnover && inventoryTurnover > 0 
      ? 365 / inventoryTurnover 
      : null;
    
    const receivablesTurnover = balance.receivables > 0 
      ? income.revenue / balance.receivables 
      : null;
    
    const daysReceivables = receivablesTurnover && receivablesTurnover > 0 
      ? 365 / receivablesTurnover 
      : null;
    
    // Para payables, usamos compras o estimamos desde coste de ventas
    const estimatedPurchases = purchases || income.costOfSales * 0.8;
    const payablesAmount = balance.currentLiabilities * 0.4; // Estimación
    const payablesTurnover = payablesAmount > 0 
      ? estimatedPurchases / payablesAmount 
      : null;
    
    const daysPayables = payablesTurnover && payablesTurnover > 0 
      ? 365 / payablesTurnover 
      : null;
    
    const assetTurnover = balance.totalAssets > 0 
      ? income.revenue / balance.totalAssets 
      : null;
    
    const cashConversionCycle = 
      (inventoryDays || 0) + (daysReceivables || 0) - (daysPayables || 0);

    return {
      inventoryTurnover,
      inventoryDays,
      receivablesTurnover,
      daysReceivables,
      payablesTurnover,
      daysPayables,
      assetTurnover,
      cashConversionCycle
    };
  }, []);

  // === CALCULAR TODOS LOS RATIOS ===
  const calculateAllRatios = useCallback((
    balance: BalanceSheetData,
    income: IncomeStatementData,
    companyId: string,
    fiscalYear: string,
    purchases?: number
  ): FinancialRatiosData => {
    return {
      liquidity: calculateLiquidityRatios(balance, income),
      solvency: calculateSolvencyRatios(balance, income),
      profitability: calculateProfitabilityRatios(balance, income),
      efficiency: calculateEfficiencyRatios(balance, income, purchases),
      calculatedAt: new Date().toISOString(),
      fiscalYear,
      companyId
    };
  }, [calculateLiquidityRatios, calculateSolvencyRatios, calculateProfitabilityRatios, calculateEfficiencyRatios]);

  // === FETCH DATOS FINANCIEROS Y CALCULAR ===
  const fetchAndCalculateRatios = useCallback(async (
    companyId: string,
    fiscalYear?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener el último año fiscal si no se especifica
      const year = fiscalYear ?? new Date().getFullYear().toString();

      // Buscar estados financieros
      const { data: statements, error: stmtError } = await supabase
        .from('company_financial_statements')
        .select(`
          *,
          balance_sheets(*),
          income_statements(*)
        `)
        .eq('company_id', companyId)
        .eq('fiscal_year', Number(year))
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (stmtError) throw stmtError;

      if (!statements || statements.length === 0) {
        setError('No se encontraron estados financieros para calcular ratios');
        return null;
      }

      const statement = statements[0];
      const balanceSheet = statement.balance_sheets?.[0];
      const incomeStatement = statement.income_statements?.[0];

      if (!balanceSheet || !incomeStatement) {
        setError('Faltan datos del balance o cuenta de resultados');
        return null;
      }

      // Mapear datos al formato esperado
      const balance: BalanceSheetData = {
        currentAssets: Number(balanceSheet.current_assets) || 0,
        cash: Number(balanceSheet.cash_and_equivalents) || 0,
        receivables: Number(balanceSheet.trade_receivables) || 0,
        inventory: Number(balanceSheet.inventories) || 0,
        nonCurrentAssets: Number(balanceSheet.non_current_assets) || 0,
        totalAssets: Number(balanceSheet.total_assets) || 0,
        currentLiabilities: Number(balanceSheet.current_liabilities) || 0,
        nonCurrentLiabilities: Number(balanceSheet.non_current_liabilities) || 0,
        totalLiabilities: Number(balanceSheet.total_liabilities) || 0,
        equity: Number(balanceSheet.total_equity) || 0,
      };

      const income: IncomeStatementData = {
        revenue: Number(incomeStatement.revenue) || 0,
        costOfSales: Number(incomeStatement.cost_of_sales) || 0,
        grossProfit: Number(incomeStatement.gross_profit) || 0,
        operatingExpenses: Number(incomeStatement.operating_expenses) || 0,
        operatingIncome: Number(incomeStatement.operating_income) || 0,
        interestExpense: Number(incomeStatement.interest_expense) || 0,
        ebit: Number(incomeStatement.operating_income) || 0,
        ebitda: (Number(incomeStatement.operating_income) || 0) + (Number(incomeStatement.depreciation) || 0),
        netIncome: Number(incomeStatement.net_income) || 0,
        depreciation: Number(incomeStatement.depreciation) || 0,
      };

      const calculatedRatios = calculateAllRatios(balance, income, companyId, year);
      setRatios(calculatedRatios);
      setLastCalculation(new Date());

      return calculatedRatios;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al calcular ratios';
      setError(message);
      console.error('[useERPFinancialRatios] fetchAndCalculateRatios error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [calculateAllRatios]);

  // === ANÁLISIS IA DE RATIOS ===
  const analyzeWithAI = useCallback(async (
    ratiosData: FinancialRatiosData,
    sector?: string
  ) => {
    setIsAnalyzing(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-ratio-analysis',
        {
          body: {
            action: 'analyze',
            ratios: ratiosData,
            sector: sector || 'general',
            includeRecommendations: true
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setAnalysis(data.analysis || []);
        setAiInsights(data.insights || null);
        return data;
      }

      throw new Error(data?.error || 'Error en análisis IA');
    } catch (err) {
      console.error('[useERPFinancialRatios] analyzeWithAI error:', err);
      toast.error('Error al analizar ratios con IA');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // === OBTENER BENCHMARKS SECTORIALES ===
  const getBenchmarks = useCallback(async (sector: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-ratio-analysis',
        {
          body: {
            action: 'benchmarks',
            sector
          }
        }
      );

      if (fnError) throw fnError;
      return data?.benchmarks || null;
    } catch (err) {
      console.error('[useERPFinancialRatios] getBenchmarks error:', err);
      return null;
    }
  }, []);

  // === COMPARAR CON HISTÓRICO ===
  const compareTrend = useCallback(async (
    companyId: string,
    years: number = 3
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-ratio-analysis',
        {
          body: {
            action: 'trend',
            companyId,
            years
          }
        }
      );

      if (fnError) throw fnError;
      return data?.trend || null;
    } catch (err) {
      console.error('[useERPFinancialRatios] compareTrend error:', err);
      return null;
    }
  }, []);

  // === FORMATEAR RATIO ===
  const formatRatio = useCallback((value: number | null, type: 'ratio' | 'percent' | 'days' | 'times' | 'currency' = 'ratio'): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/D';
    
    switch (type) {
      case 'percent':
        return `${value.toFixed(2)}%`;
      case 'days':
        return `${Math.round(value)} días`;
      case 'times':
        return `${value.toFixed(2)}x`;
      case 'currency':
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
      default:
        return value.toFixed(2);
    }
  }, []);

  // === EVALUAR ESTADO DEL RATIO ===
  const evaluateRatioStatus = useCallback((
    value: number | null,
    ratioType: string
  ): 'excellent' | 'good' | 'warning' | 'critical' | 'neutral' => {
    if (value === null) return 'neutral';

    // Umbrales por tipo de ratio
    const thresholds: Record<string, { excellent: number; good: number; warning: number }> = {
      currentRatio: { excellent: 2.0, good: 1.5, warning: 1.0 },
      quickRatio: { excellent: 1.5, good: 1.0, warning: 0.7 },
      cashRatio: { excellent: 0.5, good: 0.3, warning: 0.1 },
      debtToEquity: { excellent: 0.5, good: 1.0, warning: 2.0 }, // Inverso
      debtRatio: { excellent: 0.3, good: 0.5, warning: 0.7 }, // Inverso
      interestCoverage: { excellent: 5.0, good: 3.0, warning: 1.5 },
      roe: { excellent: 20, good: 15, warning: 8 },
      roa: { excellent: 10, good: 5, warning: 2 },
      grossMargin: { excellent: 40, good: 25, warning: 15 },
      operatingMargin: { excellent: 20, good: 10, warning: 5 },
      netMargin: { excellent: 15, good: 8, warning: 3 },
    };

    const threshold = thresholds[ratioType];
    if (!threshold) return 'neutral';

    // Ratios donde menor es mejor
    const inverseRatios = ['debtToEquity', 'debtRatio'];
    
    if (inverseRatios.includes(ratioType)) {
      if (value <= threshold.excellent) return 'excellent';
      if (value <= threshold.good) return 'good';
      if (value <= threshold.warning) return 'warning';
      return 'critical';
    } else {
      if (value >= threshold.excellent) return 'excellent';
      if (value >= threshold.good) return 'good';
      if (value >= threshold.warning) return 'warning';
      return 'critical';
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((companyId: string, intervalMs = 300000) => {
    stopAutoRefresh();
    fetchAndCalculateRatios(companyId);
    autoRefreshInterval.current = setInterval(() => {
      fetchAndCalculateRatios(companyId);
    }, intervalMs);
  }, [fetchAndCalculateRatios]);

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

  return {
    // Estado
    isLoading,
    isAnalyzing,
    ratios,
    analysis,
    aiInsights,
    error,
    lastCalculation,
    // Acciones
    fetchAndCalculateRatios,
    calculateAllRatios,
    analyzeWithAI,
    getBenchmarks,
    compareTrend,
    startAutoRefresh,
    stopAutoRefresh,
    // Utilidades
    formatRatio,
    evaluateRatioStatus,
    // Cálculos individuales
    calculateLiquidityRatios,
    calculateSolvencyRatios,
    calculateProfitabilityRatios,
    calculateEfficiencyRatios,
  };
}

export default useERPFinancialRatios;
