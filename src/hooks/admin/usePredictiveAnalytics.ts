import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface ForecastPrediction {
  period: string;
  value: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export interface Forecast {
  metricId: string;
  metricName: string;
  currentValue: number;
  predictions: ForecastPrediction[];
  trend: 'ascending' | 'descending' | 'stable' | 'volatile';
  seasonality: {
    detected: boolean;
    pattern: string;
    strength: number;
  };
  accuracy: number;
}

export interface ForecastResult {
  forecasts: Forecast[];
  methodology: string;
  dataQuality: number;
  recommendations: string[];
  nextUpdate: string;
}

export interface Trend {
  trendId: string;
  name: string;
  category: string;
  direction: 'upward' | 'downward' | 'sideways';
  strength: number;
  momentum: number;
  duration: string;
  significance: 'high' | 'medium' | 'low';
  drivers: string[];
  correlatedMetrics: string[];
}

export interface InflectionPoint {
  date: string;
  metric: string;
  type: 'peak' | 'trough' | 'reversal';
  impact: string;
}

export interface TrendAnalysisResult {
  trends: Trend[];
  inflectionPoints: InflectionPoint[];
  emergingPatterns: string[];
  summary: string;
}

export interface PredictedAnomaly {
  anomalyId: string;
  metric: string;
  predictedDate: string;
  probability: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'spike' | 'drop' | 'pattern_break' | 'threshold_breach';
  expectedDeviation: number;
  potentialCauses: string[];
  preventiveActions: string[];
}

export interface AnomalyPredictionResult {
  predictedAnomalies: PredictedAnomaly[];
  riskScore: number;
  monitoringRecommendations: string[];
  earlyWarningSignals: string[];
}

export interface ScenarioOutcome {
  metric: string;
  projectedValue: number;
  changePercent: number;
}

export interface Scenario {
  scenarioId: string;
  name: string;
  type: 'optimistic' | 'baseline' | 'pessimistic' | 'custom';
  probability: number;
  assumptions: Array<{ variable: string; value: string; impact: string }>;
  outcomes: ScenarioOutcome[];
  keyDrivers: string[];
  risks: string[];
  opportunities: string[];
}

export interface ScenarioModelingResult {
  scenarios: Scenario[];
  sensitivityAnalysis: Array<{ variable: string; sensitivity: number; criticalThreshold: number }>;
  recommendedScenario: string;
  strategicImplications: string[];
}

export interface PredictedRisk {
  riskId: string;
  name: string;
  category: 'operational' | 'financial' | 'strategic' | 'compliance' | 'reputational';
  probability: number;
  impact: number;
  riskScore: number;
  timeHorizon: string;
  triggers: string[];
  earlyIndicators: string[];
  mitigationStrategies: Array<{ action: string; effectiveness: number; cost: string }>;
}

export interface RiskPredictionResult {
  predictedRisks: PredictedRisk[];
  overallRiskLevel: 'critical' | 'high' | 'moderate' | 'low';
  portfolioExposure: number;
  concentrationRisks: string[];
  recommendations: string[];
}

export interface Opportunity {
  opportunityId: string;
  name: string;
  type: 'market' | 'product' | 'efficiency' | 'partnership' | 'expansion';
  potential: number;
  probability: number;
  timeToRealize: string;
  investmentRequired: string;
  expectedROI: number;
  competitiveAdvantage: string;
  prerequisites: string[];
  risks: string[];
}

export interface OpportunityDetectionResult {
  opportunities: Opportunity[];
  prioritizedActions: Array<{ action: string; priority: number; deadline: string }>;
  marketTiming: string;
  totalPotentialValue: number;
}

export interface DemandForecast {
  productId: string;
  productName: string;
  forecasts: Array<{ period: string; expectedDemand: number; lowerBound: number; upperBound: number }>;
  seasonalFactors: Array<{ season: string; factor: number }>;
  trend: 'growing' | 'declining' | 'stable';
  volatility: number;
}

export interface DemandForecastingResult {
  demandForecasts: DemandForecast[];
  capacityRecommendations: Array<{ resource: string; currentCapacity: number; recommendedCapacity: number; gap: number }>;
  inventoryOptimization: {
    safetyStock: number;
    reorderPoint: number;
    orderQuantity: number;
  };
  accuracy: number;
}

export interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  valueAtRisk: number;
  churnSignals: Array<{ signal: string; weight: number; detected: string }>;
  retentionStrategies: Array<{ strategy: string; expectedImpact: number; cost: number }>;
  predictedChurnDate: string;
}

export interface ChurnPredictionResult {
  churnPredictions: ChurnPrediction[];
  segmentAnalysis: Array<{ segment: string; avgChurnRisk: number; totalValueAtRisk: number; count: number }>;
  overallChurnRate: number;
  retentionOpportunities: string[];
}

export interface RevenueProjection {
  period: string;
  projectedRevenue: number;
  bySegment: Array<{ segment: string; revenue: number; growth: number }>;
  byProduct: Array<{ product: string; revenue: number; growth: number }>;
  confidence: number;
}

export interface RevenueProjectionResult {
  revenueProjections: RevenueProjection[];
  drivers: Array<{ driver: string; contribution: number; trend: 'positive' | 'negative' | 'neutral' }>;
  pipelineAnalysis: {
    totalPipeline: number;
    weightedPipeline: number;
    conversionRate: number;
    avgDealSize: number;
  };
  scenarios: {
    best: number;
    expected: number;
    worst: number;
  };
  growthRate: number;
}

export interface DecisionOption {
  optionId: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  expectedOutcome: number;
  risk: number;
  cost: number;
  timeToImplement: string;
  score: number;
}

export interface DecisionRecommendationResult {
  decision: {
    context: string;
    objective: string;
    constraints: string[];
  };
  options: DecisionOption[];
  recommendation: {
    selectedOption: string;
    rationale: string;
    confidence: number;
    keyFactors: string[];
  };
  implementationPlan: Array<{ step: number; action: string; timeline: string; responsible: string }>;
  monitoringMetrics: string[];
}

export interface PredictiveContext {
  entityId?: string;
  entityType?: string;
  timeframe?: string;
  metrics?: string[];
  historicalData?: Record<string, unknown>;
}

type ActionType = 
  | 'forecast_generation'
  | 'trend_analysis'
  | 'anomaly_prediction'
  | 'scenario_modeling'
  | 'risk_prediction'
  | 'opportunity_detection'
  | 'demand_forecasting'
  | 'churn_prediction'
  | 'revenue_projection'
  | 'decision_recommendation';

// === HOOK ===

export function usePredictiveAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  
  // Cache for results
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [trendResult, setTrendResult] = useState<TrendAnalysisResult | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyPredictionResult | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioModelingResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskPredictionResult | null>(null);
  const [opportunityResult, setOpportunityResult] = useState<OpportunityDetectionResult | null>(null);
  const [demandResult, setDemandResult] = useState<DemandForecastingResult | null>(null);
  const [churnResult, setChurnResult] = useState<ChurnPredictionResult | null>(null);
  const [revenueResult, setRevenueResult] = useState<RevenueProjectionResult | null>(null);
  const [decisionResult, setDecisionResult] = useState<DecisionRecommendationResult | null>(null);

  // Auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GENERIC INVOKE ===
  const invokeAction = useCallback(async <T>(
    action: ActionType,
    context?: PredictiveContext,
    params?: Record<string, unknown>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-analytics', {
        body: { action, context, params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setLastAnalysis(new Date());
        return data.data as T;
      }

      throw new Error(data?.error || 'Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[usePredictiveAnalytics] ${action} error:`, err);
      toast.error(`Error en ${action}: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SPECIFIC ACTIONS ===
  const generateForecasts = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<ForecastResult>('forecast_generation', context);
    if (result) setForecastResult(result);
    return result;
  }, [invokeAction]);

  const analyzeTrends = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<TrendAnalysisResult>('trend_analysis', context);
    if (result) setTrendResult(result);
    return result;
  }, [invokeAction]);

  const predictAnomalies = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<AnomalyPredictionResult>('anomaly_prediction', context);
    if (result) setAnomalyResult(result);
    return result;
  }, [invokeAction]);

  const modelScenarios = useCallback(async (context?: PredictiveContext, params?: Record<string, unknown>) => {
    const result = await invokeAction<ScenarioModelingResult>('scenario_modeling', context, params);
    if (result) setScenarioResult(result);
    return result;
  }, [invokeAction]);

  const predictRisks = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<RiskPredictionResult>('risk_prediction', context);
    if (result) setRiskResult(result);
    return result;
  }, [invokeAction]);

  const detectOpportunities = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<OpportunityDetectionResult>('opportunity_detection', context);
    if (result) setOpportunityResult(result);
    return result;
  }, [invokeAction]);

  const forecastDemand = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<DemandForecastingResult>('demand_forecasting', context);
    if (result) setDemandResult(result);
    return result;
  }, [invokeAction]);

  const predictChurn = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<ChurnPredictionResult>('churn_prediction', context);
    if (result) setChurnResult(result);
    return result;
  }, [invokeAction]);

  const projectRevenue = useCallback(async (context?: PredictiveContext) => {
    const result = await invokeAction<RevenueProjectionResult>('revenue_projection', context);
    if (result) setRevenueResult(result);
    return result;
  }, [invokeAction]);

  const getDecisionRecommendation = useCallback(async (context?: PredictiveContext, params?: Record<string, unknown>) => {
    const result = await invokeAction<DecisionRecommendationResult>('decision_recommendation', context, params);
    if (result) setDecisionResult(result);
    return result;
  }, [invokeAction]);

  // === COMPREHENSIVE ANALYSIS ===
  const runFullAnalysis = useCallback(async (context?: PredictiveContext) => {
    setIsLoading(true);
    try {
      const [forecasts, trends, anomalies, risks, opportunities] = await Promise.all([
        invokeAction<ForecastResult>('forecast_generation', context),
        invokeAction<TrendAnalysisResult>('trend_analysis', context),
        invokeAction<AnomalyPredictionResult>('anomaly_prediction', context),
        invokeAction<RiskPredictionResult>('risk_prediction', context),
        invokeAction<OpportunityDetectionResult>('opportunity_detection', context)
      ]);

      if (forecasts) setForecastResult(forecasts);
      if (trends) setTrendResult(trends);
      if (anomalies) setAnomalyResult(anomalies);
      if (risks) setRiskResult(risks);
      if (opportunities) setOpportunityResult(opportunities);

      toast.success('Análisis predictivo completo ejecutado');
      return { forecasts, trends, anomalies, risks, opportunities };
    } catch (err) {
      console.error('[usePredictiveAnalytics] Full analysis error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [invokeAction]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: PredictiveContext, intervalMs = 300000) => {
    stopAutoRefresh();
    runFullAnalysis(context);
    autoRefreshInterval.current = setInterval(() => {
      runFullAnalysis(context);
    }, intervalMs);
  }, [runFullAnalysis]);

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

  // === CLEAR CACHE ===
  const clearCache = useCallback(() => {
    setForecastResult(null);
    setTrendResult(null);
    setAnomalyResult(null);
    setScenarioResult(null);
    setRiskResult(null);
    setOpportunityResult(null);
    setDemandResult(null);
    setChurnResult(null);
    setRevenueResult(null);
    setDecisionResult(null);
    setLastAnalysis(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    lastAnalysis,
    
    // Cached Results
    forecastResult,
    trendResult,
    anomalyResult,
    scenarioResult,
    riskResult,
    opportunityResult,
    demandResult,
    churnResult,
    revenueResult,
    decisionResult,
    
    // Actions
    generateForecasts,
    analyzeTrends,
    predictAnomalies,
    modelScenarios,
    predictRisks,
    detectOpportunities,
    forecastDemand,
    predictChurn,
    projectRevenue,
    getDecisionRecommendation,
    
    // Comprehensive
    runFullAnalysis,
    
    // Control
    startAutoRefresh,
    stopAutoRefresh,
    clearCache,
  };
}

export default usePredictiveAnalytics;
