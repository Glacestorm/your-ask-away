/**
 * useERPAdvancedRatios - Hook para análisis financieros avanzados
 * Fase 5: Z-Score, DuPont, Capital Circulante, EBIT/EBITDA, Sectoriales, Rating Bancario, Valor Añadido
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface BalanceSheetData {
  fiscal_year: number;
  // Activo Corriente
  inventory: number;
  trade_receivables: number;
  short_term_financial_investments: number;
  cash_equivalents: number;
  accruals_assets: number;
  non_current_assets_held_for_sale: number;
  short_term_group_receivables: number;
  // Activo No Corriente
  tangible_assets: number;
  intangible_assets: number;
  real_estate_investments: number;
  long_term_financial_investments: number;
  goodwill: number;
  deferred_tax_assets: number;
  // Pasivo Corriente
  short_term_debts: number;
  trade_payables: number;
  other_creditors: number;
  short_term_provisions: number;
  short_term_group_debts: number;
  short_term_accruals: number;
  // Pasivo No Corriente
  long_term_debts: number;
  long_term_provisions: number;
  long_term_group_debts: number;
  deferred_tax_liabilities: number;
  // Patrimonio Neto
  share_capital: number;
  share_premium: number;
  legal_reserve: number;
  voluntary_reserves: number;
  retained_earnings: number;
  current_year_result: number;
  statutory_reserves: number;
  revaluation_reserve: number;
  interim_dividend: number;
}

export interface IncomeStatementData {
  fiscal_year: number;
  net_turnover: number;
  supplies: number;
  personnel_expenses: number;
  other_operating_expenses: number;
  depreciation: number;
  other_operating_income: number;
  other_operating_results: number;
  financial_income: number;
  financial_expenses: number;
  impairment_trade_operations: number;
  impairment_financial_instruments: number;
  other_financial_results: number;
  exchange_differences: number;
  corporate_tax: number;
  inventory_variation: number;
  capitalized_work: number;
}

export interface ZScoreData {
  year: number;
  x1: number; // Fondo Maniobra / Activo Total
  x2: number; // Beneficios Retenidos / Activo Total
  x3: number; // EBIT / Activo Total
  x4: number; // Patrimonio Neto / Pasivo Exigible
  x5: number; // Ventas / Activo Total
  zScore: number;
  zone: 'safe' | 'gray' | 'distress';
  interpretation: string;
}

export interface DuPontData {
  year: number;
  // Componentes
  ventas: number;
  activo: number;
  activoCorriente: number;
  activoNoCorriente: number;
  bait: number;
  // Ratios
  rotacionActivo: number;
  baitSobreVentas: number;
  roa: number;
  apalancamiento: number;
  roe: number;
}

export interface WorkingCapitalData {
  year: number;
  // Activo Corriente
  totalCurrentAssets: number;
  inventory: number;
  tradeReceivables: number;
  cashEquivalents: number;
  // Pasivo Corriente
  totalCurrentLiabilities: number;
  shortTermDebts: number;
  tradePayables: number;
  // Ratios
  workingCapital: number;
  nof: number; // Necesidades Operativas de Fondos
  solvencyRatio: number;
  acidTestRatio: number;
  liquidityRatio: number;
  basicFinancingCoefficient: number;
}

export interface EBITEBITDAData {
  year: number;
  ventas: number;
  margenBruto: number;
  ebit: number;
  ebitda: number;
  // Márgenes
  margenBrutoPercent: number;
  margenEbit: number;
  margenEbitda: number;
  // Componentes
  amortizaciones: number;
  gastosFinancieros: number;
  resultadoOrdinario: number;
}

export interface SectoralRatioData {
  name: string;
  companyValue: number;
  sectorValue: number;
  deviation: number;
  rating: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
}

export interface BankRatingData {
  score: number;
  rating: string;
  riskLevel: 'bajo' | 'medio' | 'alto' | 'muy_alto';
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    contribution: number;
  }>;
}

export interface AddedValueData {
  year: number;
  vendasNetes: number;
  valorProduccio: number;
  valorAfegitBrut: number;
  valorAfegitNet: number;
  // Distribución
  gastosPersonal: number;
  amortitzacions: number;
  resultadoNeto: number;
  impuestos: number;
}

export interface AdvancedRatiosData {
  zScore: ZScoreData[];
  duPont: DuPontData[];
  workingCapital: WorkingCapitalData[];
  ebitEbitda: EBITEBITDAData[];
  sectoralRatios: SectoralRatioData[];
  bankRating: BankRatingData;
  addedValue: AddedValueData[];
  calculatedAt: string;
}

export interface AIAdvancedInsights {
  overallAssessment: string;
  healthScore: number;
  riskIndicators: Array<{
    indicator: string;
    level: 'low' | 'medium' | 'high';
    description: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    area: string;
    action: string;
    expectedImpact: string;
  }>;
  zScoreInterpretation: string;
  duPontAnalysis: string;
  workingCapitalAnalysis: string;
  sectorComparison: string;
}

// === HOOK ===
export function useERPAdvancedRatios() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<AdvancedRatiosData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIAdvancedInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);

  // Z-Score Coefficients por sector
  const getZScoreCoefficients = useCallback((sector: string) => {
    const coefficients: Record<string, { x1: number; x2: number; x3: number; x4: number; x5: number; safeMin: number; grayMin: number }> = {
      manufacturing: { x1: 1.2, x2: 1.4, x3: 3.3, x4: 0.6, x5: 1.0, safeMin: 2.99, grayMin: 1.81 },
      services: { x1: 1.1, x2: 1.2, x3: 3.1, x4: 0.7, x5: 0.9, safeMin: 2.90, grayMin: 1.75 },
      retail: { x1: 1.3, x2: 1.5, x3: 3.2, x4: 0.5, x5: 1.2, safeMin: 2.95, grayMin: 1.78 },
      technology: { x1: 1.0, x2: 1.3, x3: 3.4, x4: 0.8, x5: 0.8, safeMin: 3.05, grayMin: 1.85 },
      general: { x1: 1.2, x2: 1.4, x3: 3.3, x4: 0.6, x5: 1.0, safeMin: 2.99, grayMin: 1.81 },
    };
    return coefficients[sector] || coefficients.general;
  }, []);

  // === CALCULAR Z-SCORE ===
  const calculateZScore = useCallback((
    balance: BalanceSheetData,
    income: IncomeStatementData,
    sector: string = 'general'
  ): ZScoreData => {
    const coef = getZScoreCoefficients(sector);
    
    const activoCorriente = (balance.inventory || 0) + (balance.trade_receivables || 0) + 
      (balance.cash_equivalents || 0) + (balance.short_term_financial_investments || 0);
    
    const activoNoCorriente = (balance.tangible_assets || 0) + (balance.intangible_assets || 0) + 
      (balance.real_estate_investments || 0) + (balance.long_term_financial_investments || 0);
    
    const totalActivo = activoCorriente + activoNoCorriente;
    
    const pasivoCorriente = (balance.short_term_debts || 0) + (balance.trade_payables || 0) + 
      (balance.other_creditors || 0) + (balance.short_term_provisions || 0);
    
    const pasivoNoCorriente = (balance.long_term_debts || 0) + (balance.long_term_provisions || 0);
    const pasivoExigible = pasivoCorriente + pasivoNoCorriente;
    
    const patrimonioNeto = (balance.share_capital || 0) + (balance.retained_earnings || 0) + 
      (balance.current_year_result || 0) + (balance.voluntary_reserves || 0);
    
    const fondoManiobra = activoCorriente - pasivoCorriente;
    const netTurnover = income.net_turnover || 0;
    const ebit = netTurnover - Math.abs(income.supplies || 0) - Math.abs(income.personnel_expenses || 0) - 
      Math.abs(income.depreciation || 0) - Math.abs(income.other_operating_expenses || 0);
    const beneficioRetenido = (balance.current_year_result || 0) - (balance.interim_dividend || 0);

    const x1 = totalActivo > 0 ? fondoManiobra / totalActivo : 0;
    const x2 = totalActivo > 0 ? beneficioRetenido / totalActivo : 0;
    const x3 = totalActivo > 0 ? ebit / totalActivo : 0;
    const x4 = pasivoExigible > 0 ? patrimonioNeto / pasivoExigible : 0;
    const x5 = totalActivo > 0 ? netTurnover / totalActivo : 0;

    const zScore = coef.x1 * x1 + coef.x2 * x2 + coef.x3 * x3 + coef.x4 * x4 + coef.x5 * x5;
    
    let zone: 'safe' | 'gray' | 'distress';
    let interpretation: string;
    
    if (zScore >= coef.safeMin) {
      zone = 'safe';
      interpretation = 'Zona segura - Baja probabilidad de quiebra';
    } else if (zScore >= coef.grayMin) {
      zone = 'gray';
      interpretation = 'Zona gris - Probabilidad moderada, requiere monitoreo';
    } else {
      zone = 'distress';
      interpretation = 'Zona de riesgo - Alta probabilidad de quiebra';
    }

    return {
      year: balance.fiscal_year,
      x1, x2, x3, x4, x5,
      zScore,
      zone,
      interpretation
    };
  }, [getZScoreCoefficients]);

  // === CALCULAR DUPONT ===
  const calculateDuPont = useCallback((
    balance: BalanceSheetData,
    income: IncomeStatementData
  ): DuPontData => {
    const netTurnover = income.net_turnover || 0;
    const supplies = Math.abs(income.supplies || 0);
    const personnelExpenses = Math.abs(income.personnel_expenses || 0);
    const depreciation = Math.abs(income.depreciation || 0);
    const otherExpenses = Math.abs(income.other_operating_expenses || 0);
    
    const tangibleAssets = balance.tangible_assets || 0;
    const intangibleAssets = balance.intangible_assets || 0;
    const inventory = balance.inventory || 0;
    const tradeReceivables = balance.trade_receivables || 0;
    const cashEquivalents = balance.cash_equivalents || 0;
    
    const activoNoCorriente = tangibleAssets + intangibleAssets + (balance.real_estate_investments || 0);
    const activoCorriente = inventory + tradeReceivables + cashEquivalents + (balance.short_term_financial_investments || 0);
    const totalActivo = activoNoCorriente + activoCorriente;
    
    const bait = netTurnover - supplies - personnelExpenses - depreciation - otherExpenses;
    
    const patrimonioNeto = (balance.share_capital || 0) + (balance.retained_earnings || 0) + 
      (balance.current_year_result || 0);
    
    const rotacionActivo = totalActivo !== 0 ? netTurnover / totalActivo : 0;
    const baitSobreVentas = netTurnover !== 0 ? bait / netTurnover : 0;
    const roa = rotacionActivo * baitSobreVentas;
    const apalancamiento = patrimonioNeto !== 0 ? totalActivo / patrimonioNeto : 0;
    const roe = roa * apalancamiento;

    return {
      year: balance.fiscal_year,
      ventas: netTurnover,
      activo: totalActivo,
      activoCorriente,
      activoNoCorriente,
      bait,
      rotacionActivo,
      baitSobreVentas,
      roa,
      apalancamiento,
      roe
    };
  }, []);

  // === CALCULAR CAPITAL CIRCULANTE ===
  const calculateWorkingCapital = useCallback((balance: BalanceSheetData): WorkingCapitalData => {
    const inventory = balance.inventory || 0;
    const tradeReceivables = balance.trade_receivables || 0;
    const cashEquivalents = balance.cash_equivalents || 0;
    const shortTermFinancialInvestments = balance.short_term_financial_investments || 0;
    
    const totalCurrentAssets = inventory + tradeReceivables + cashEquivalents + 
      shortTermFinancialInvestments + (balance.accruals_assets || 0);
    
    const shortTermDebts = balance.short_term_debts || 0;
    const tradePayables = balance.trade_payables || 0;
    const otherCreditors = balance.other_creditors || 0;
    const shortTermProvisions = balance.short_term_provisions || 0;
    
    const totalCurrentLiabilities = shortTermDebts + tradePayables + otherCreditors + shortTermProvisions;
    
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const nof = (inventory + tradeReceivables) - tradePayables; // NOF simplificado
    
    const solvencyRatio = totalCurrentLiabilities !== 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const acidTestRatio = totalCurrentLiabilities !== 0 ? 
      (cashEquivalents + shortTermFinancialInvestments + tradeReceivables) / totalCurrentLiabilities : 0;
    const liquidityRatio = totalCurrentLiabilities !== 0 ? 
      (cashEquivalents + shortTermFinancialInvestments) / totalCurrentLiabilities : 0;
    const basicFinancingCoefficient = totalCurrentAssets !== 0 ? 
      (totalCurrentAssets - inventory) / totalCurrentAssets : 0;

    return {
      year: balance.fiscal_year,
      totalCurrentAssets,
      inventory,
      tradeReceivables,
      cashEquivalents,
      totalCurrentLiabilities,
      shortTermDebts,
      tradePayables,
      workingCapital,
      nof,
      solvencyRatio,
      acidTestRatio,
      liquidityRatio,
      basicFinancingCoefficient
    };
  }, []);

  // === CALCULAR EBIT/EBITDA ===
  const calculateEBITEBITDA = useCallback((income: IncomeStatementData): EBITEBITDAData => {
    const ventas = income.net_turnover || 0;
    const supplies = Math.abs(income.supplies || 0);
    const personnelExpenses = Math.abs(income.personnel_expenses || 0);
    const depreciation = Math.abs(income.depreciation || 0);
    const otherExpenses = Math.abs(income.other_operating_expenses || 0);
    const financialExpenses = Math.abs(income.financial_expenses || 0);
    const financialIncome = income.financial_income || 0;
    
    const margenBruto = ventas - supplies;
    const ebit = margenBruto - personnelExpenses - depreciation - otherExpenses;
    const ebitda = ebit + depreciation;
    const resultadoOrdinario = ebit + financialIncome - financialExpenses;
    
    return {
      year: income.fiscal_year,
      ventas,
      margenBruto,
      ebit,
      ebitda,
      margenBrutoPercent: ventas !== 0 ? (margenBruto / ventas) * 100 : 0,
      margenEbit: ventas !== 0 ? (ebit / ventas) * 100 : 0,
      margenEbitda: ventas !== 0 ? (ebitda / ventas) * 100 : 0,
      amortizaciones: depreciation,
      gastosFinancieros: financialExpenses,
      resultadoOrdinario
    };
  }, []);

  // === CALCULAR RATING BANCARIO ===
  const calculateBankRating = useCallback((
    zScore: ZScoreData,
    duPont: DuPontData,
    workingCapital: WorkingCapitalData
  ): BankRatingData => {
    const factors = [
      { name: 'Z-Score', value: zScore.zScore, weight: 0.25, contribution: 0 },
      { name: 'Solvencia', value: workingCapital.solvencyRatio, weight: 0.20, contribution: 0 },
      { name: 'ROE', value: duPont.roe * 100, weight: 0.20, contribution: 0 },
      { name: 'Rotación Activos', value: duPont.rotacionActivo, weight: 0.15, contribution: 0 },
      { name: 'Test Ácido', value: workingCapital.acidTestRatio, weight: 0.10, contribution: 0 },
      { name: 'Liquidez', value: workingCapital.liquidityRatio, weight: 0.10, contribution: 0 },
    ];

    let totalScore = 0;
    factors.forEach(f => {
      // Normalizar valor a escala 0-100
      let normalized = 0;
      switch (f.name) {
        case 'Z-Score':
          normalized = Math.min(100, Math.max(0, (f.value / 3) * 100));
          break;
        case 'Solvencia':
          normalized = Math.min(100, Math.max(0, (f.value / 2) * 100));
          break;
        case 'ROE':
          normalized = Math.min(100, Math.max(0, (f.value / 20) * 100));
          break;
        case 'Rotación Activos':
          normalized = Math.min(100, Math.max(0, f.value * 50));
          break;
        default:
          normalized = Math.min(100, Math.max(0, f.value * 100));
      }
      f.contribution = normalized * f.weight;
      totalScore += f.contribution;
    });

    let rating: string;
    let riskLevel: 'bajo' | 'medio' | 'alto' | 'muy_alto';
    
    if (totalScore >= 80) { rating = 'AAA'; riskLevel = 'bajo'; }
    else if (totalScore >= 70) { rating = 'AA'; riskLevel = 'bajo'; }
    else if (totalScore >= 60) { rating = 'A'; riskLevel = 'medio'; }
    else if (totalScore >= 50) { rating = 'BBB'; riskLevel = 'medio'; }
    else if (totalScore >= 40) { rating = 'BB'; riskLevel = 'alto'; }
    else if (totalScore >= 30) { rating = 'B'; riskLevel = 'alto'; }
    else { rating = 'CCC'; riskLevel = 'muy_alto'; }

    return {
      score: totalScore,
      rating,
      riskLevel,
      factors
    };
  }, []);

  // === CALCULAR VALOR AÑADIDO ===
  const calculateAddedValue = useCallback((income: IncomeStatementData): AddedValueData => {
    const vendasNetes = income.net_turnover || 0;
    const variacioExistencies = income.inventory_variation || 0;
    const treballs = income.capitalized_work || 0;
    const valorProduccio = vendasNetes + variacioExistencies + treballs;
    
    const consumsExplotacio = Math.abs(income.supplies || 0);
    const gastosExterns = Math.abs(income.other_operating_expenses || 0);
    const otresIngressos = income.other_operating_income || 0;
    
    const valorAfegitBrut = valorProduccio - consumsExplotacio - gastosExterns + otresIngressos;
    
    const amortitzacions = Math.abs(income.depreciation || 0);
    const valorAfegitNet = valorAfegitBrut - amortitzacions;
    
    const gastosPersonal = Math.abs(income.personnel_expenses || 0);
    const impuestos = Math.abs(income.corporate_tax || 0);
    const resultadoNeto = valorAfegitNet - gastosPersonal - impuestos;

    return {
      year: income.fiscal_year,
      vendasNetes,
      valorProduccio,
      valorAfegitBrut,
      valorAfegitNet,
      gastosPersonal,
      amortitzacions,
      resultadoNeto,
      impuestos
    };
  }, []);

  // === FETCH Y CALCULAR TODO ===
  const fetchAndCalculate = useCallback(async (
    companyId: string,
    sector: string = 'general'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener estados financieros
      const { data: statements, error: stmtError } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      if (stmtError) throw stmtError;
      if (!statements?.length) {
        setError('No se encontraron estados financieros');
        return null;
      }

      // Obtener balances e income statements
      const balancePromises = statements.map(s => 
        supabase.from('balance_sheets').select('*').eq('statement_id', s.id).single()
      );
      const incomePromises = statements.map(s => 
        supabase.from('income_statements').select('*').eq('statement_id', s.id).single()
      );

      const balanceResults = await Promise.all(balancePromises);
      const incomeResults = await Promise.all(incomePromises);

      const balances: BalanceSheetData[] = [];
      const incomes: IncomeStatementData[] = [];

      statements.forEach((stmt, i) => {
        if (balanceResults[i].data) {
          balances.push({ ...balanceResults[i].data, fiscal_year: stmt.fiscal_year } as BalanceSheetData);
        }
        if (incomeResults[i].data) {
          incomes.push({ ...incomeResults[i].data, fiscal_year: stmt.fiscal_year } as IncomeStatementData);
        }
      });

      // Calcular todos los ratios
      const zScoreData = balances.map((b, i) => 
        calculateZScore(b, incomes[i] || {} as IncomeStatementData, sector)
      );
      
      const duPontData = balances.map((b, i) => 
        calculateDuPont(b, incomes[i] || {} as IncomeStatementData)
      );
      
      const workingCapitalData = balances.map(b => calculateWorkingCapital(b));
      
      const ebitEbitdaData = incomes.map(i => calculateEBITEBITDA(i));
      
      const addedValueData = incomes.map(i => calculateAddedValue(i));

      // Calcular rating bancario del año más reciente
      const bankRating = zScoreData.length > 0 && duPontData.length > 0 && workingCapitalData.length > 0
        ? calculateBankRating(zScoreData[0], duPontData[0], workingCapitalData[0])
        : { score: 0, rating: 'N/A', riskLevel: 'muy_alto' as const, factors: [] };

      // Ratios sectoriales (simplificado)
      const sectoralRatios: SectoralRatioData[] = [
        { name: 'Margen EBITDA', companyValue: ebitEbitdaData[0]?.margenEbitda || 0, sectorValue: 15, deviation: 0, rating: 'NEUTRO' },
        { name: 'ROE', companyValue: (duPontData[0]?.roe || 0) * 100, sectorValue: 12, deviation: 0, rating: 'NEUTRO' },
        { name: 'Solvencia', companyValue: workingCapitalData[0]?.solvencyRatio || 0, sectorValue: 1.5, deviation: 0, rating: 'NEUTRO' },
        { name: 'Rotación Activo', companyValue: duPontData[0]?.rotacionActivo || 0, sectorValue: 1.2, deviation: 0, rating: 'NEUTRO' },
      ];

      sectoralRatios.forEach(r => {
        r.deviation = r.sectorValue !== 0 ? ((r.companyValue - r.sectorValue) / r.sectorValue) * 100 : 0;
        r.rating = r.deviation > 10 ? 'POSITIVO' : r.deviation < -10 ? 'NEGATIVO' : 'NEUTRO';
      });

      const result: AdvancedRatiosData = {
        zScore: zScoreData,
        duPont: duPontData,
        workingCapital: workingCapitalData,
        ebitEbitda: ebitEbitdaData,
        sectoralRatios,
        bankRating,
        addedValue: addedValueData,
        calculatedAt: new Date().toISOString()
      };

      setData(result);
      setLastCalculation(new Date());
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al calcular ratios avanzados';
      setError(message);
      console.error('[useERPAdvancedRatios] fetchAndCalculate error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [calculateZScore, calculateDuPont, calculateWorkingCapital, calculateEBITEBITDA, calculateAddedValue, calculateBankRating]);

  // === ANÁLISIS IA ===
  const analyzeWithAI = useCallback(async (ratiosData: AdvancedRatiosData, sector: string = 'general') => {
    setIsAnalyzing(true);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'erp-advanced-analysis',
        {
          body: {
            action: 'analyze',
            ratios: ratiosData,
            sector,
            includeRecommendations: true
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.insights) {
        setAiInsights(fnData.insights);
        return fnData.insights;
      }

      throw new Error(fnData?.error || 'Error en análisis IA');
    } catch (err) {
      console.error('[useERPAdvancedRatios] analyzeWithAI error:', err);
      toast.error('Error al analizar con IA');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // === UTILIDADES ===
  const formatNumber = useCallback((value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }, []);

  const formatPercent = useCallback((value: number): string => {
    return `${value.toFixed(2)}%`;
  }, []);

  const formatCurrency = useCallback((value: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  return {
    isLoading,
    isAnalyzing,
    data,
    aiInsights,
    error,
    lastCalculation,
    fetchAndCalculate,
    analyzeWithAI,
    formatNumber,
    formatPercent,
    formatCurrency
  };
}

export default useERPAdvancedRatios;
