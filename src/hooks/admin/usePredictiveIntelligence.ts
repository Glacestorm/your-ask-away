import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  currentTrend: 'up' | 'down' | 'stable';
}

export interface OutcomePrediction {
  prediction: {
    outcome: string;
    value: number;
    unit: string;
    confidence: number;
    timeframe: string;
  };
  factors: PredictionFactor[];
  confidenceInterval: {
    low: number;
    high: number;
    probability: number;
  };
  assumptions: string[];
  risks: string[];
  recommendations: string[];
}

export interface ScenarioOutcome {
  revenue: { change: number; value: number };
  customers: { change: number; value: number };
  efficiency: { change: number; value: number };
}

export interface Scenario {
  name: string;
  type: 'optimistic' | 'pessimistic' | 'base' | 'alternative';
  probability: number;
  description: string;
  keyDrivers: string[];
  outcomes: ScenarioOutcome;
  timeline: string;
  triggers: string[];
  mitigations: string[];
}

export interface ScenarioAnalysis {
  scenarios: Scenario[];
  comparison: {
    bestCase: string;
    worstCase: string;
    mostLikely: string;
  };
  criticalDecisions: string[];
  monitoringMetrics: string[];
}

export interface DecisionOption {
  name: string;
  score: number;
  pros: string[];
  cons: string[];
  costs: { immediate: number; ongoing: number };
  benefits: { shortTerm: number; longTerm: number };
  risks: string[];
  timeline: string;
}

export interface DecisionOptimization {
  decision: {
    recommended: string;
    confidence: number;
    rationale: string;
  };
  options: DecisionOption[];
  criteria: Array<{ name: string; weight: number; description: string }>;
  constraints: string[];
  sensitivity: {
    criticalFactors: string[];
    robustness: number;
  };
  implementation: {
    steps: string[];
    milestones: string[];
    kpis: string[];
  };
}

export interface ResourceAllocationItem {
  resource: string;
  currentAllocation: number;
  recommendedAllocation: number;
  change: number;
  justification: string;
}

export interface Bottleneck {
  area: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  resolution: string;
}

export interface ResourceAllocation {
  allocation: {
    optimal: ResourceAllocationItem[];
    totalBudget: number;
    expectedROI: number;
  };
  efficiency: {
    currentScore: number;
    projectedScore: number;
    improvement: number;
  };
  bottlenecks: Bottleneck[];
  scenarios: Array<{
    name: string;
    allocation: Record<string, number>;
    expectedOutcome: number;
  }>;
  constraints: string[];
  timeline: string;
}

export interface RiskMitigation {
  action: string;
  effectiveness: number;
  cost: number;
  timeline: string;
}

export interface Risk {
  id: string;
  name: string;
  category: 'operational' | 'financial' | 'strategic' | 'compliance' | 'reputational';
  probability: number;
  impact: number;
  riskScore: number;
  description: string;
  triggers: string[];
  mitigations: RiskMitigation[];
  owner: string;
  status: 'identified' | 'mitigating' | 'accepted' | 'transferred';
}

export interface EarlyWarning {
  indicator: string;
  threshold: number;
  currentValue: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface RiskAssessment {
  riskProfile: {
    overallScore: number;
    category: 'low' | 'medium' | 'high' | 'critical';
    trend: 'improving' | 'stable' | 'deteriorating';
  };
  risks: Risk[];
  earlyWarnings: EarlyWarning[];
  recommendations: string[];
  contingencyPlans: string[];
}

export interface MarketTrend {
  name: string;
  direction: 'up' | 'down' | 'stable';
  strength: number;
  impact: string;
  timeline: string;
}

export interface MarketSegment {
  name: string;
  currentShare: number;
  projectedShare: number;
  growth: number;
  opportunity: 'high' | 'medium' | 'low';
}

export interface Competitor {
  name: string;
  currentPosition: number;
  projectedPosition: number;
  threat: 'high' | 'medium' | 'low';
  strategy: string;
}

export interface MarketForecast {
  forecast: {
    market: string;
    period: string;
    currentSize: number;
    projectedSize: number;
    growthRate: number;
    confidence: number;
  };
  trends: MarketTrend[];
  segments: MarketSegment[];
  competitors: Competitor[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

export interface CustomerIntervention {
  trigger: string;
  action: string;
  expectedImpact: number;
  priority: 'high' | 'medium' | 'low';
  timing: string;
}

export interface CustomerLifecycle {
  lifecycle: {
    stage: 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral' | 'at_risk' | 'churned';
    healthScore: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  predictions: {
    churnProbability: number;
    churnTimeframe: string;
    upsellProbability: number;
    lifetimeValue: number;
    nextPurchase: {
      probability: number;
      timeframe: string;
      expectedValue: number;
    };
  };
  segments: Array<{
    name: string;
    size: number;
    characteristics: string[];
    avgLifetimeValue: number;
    churnRate: number;
  }>;
  interventions: CustomerIntervention[];
  riskIndicators: string[];
  opportunities: string[];
}

export interface CascadeEffect {
  from: string;
  to: string;
  effect: string;
  magnitude: number;
  delay: string;
}

export interface WhatIfSimulation {
  simulation: {
    id: string;
    name: string;
    baselineValue: number;
    simulatedValue: number;
    change: number;
    changePercent: number;
  };
  variables: Array<{
    name: string;
    baseValue: number;
    modifiedValue: number;
    sensitivity: number;
    elasticity: number;
  }>;
  impacts: Array<{
    metric: string;
    baseline: number;
    simulated: number;
    change: number;
    direction: 'positive' | 'negative' | 'neutral';
  }>;
  cascadeEffects: CascadeEffect[];
  confidence: number;
  assumptions: string[];
  limitations: string[];
  recommendations: string[];
}

export interface StrategicObjective {
  id: string;
  name: string;
  description: string;
  category: 'growth' | 'efficiency' | 'innovation' | 'sustainability';
  target: number;
  unit: string;
  timeline: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface StrategicInitiative {
  name: string;
  objective: string;
  description: string;
  investment: number;
  expectedROI: number;
  timeline: string;
  milestones: string[];
  risks: string[];
}

export interface StrategicPlan {
  strategicPlan: {
    vision: string;
    mission: string;
    horizon: string;
    overallConfidence: number;
  };
  swot: {
    strengths: Array<{ item: string; leverage: string }>;
    weaknesses: Array<{ item: string; mitigation: string }>;
    opportunities: Array<{ item: string; capture: string }>;
    threats: Array<{ item: string; defense: string }>;
  };
  objectives: StrategicObjective[];
  initiatives: StrategicInitiative[];
  roadmap: Array<{
    phase: string;
    timeframe: string;
    focus: string[];
    deliverables: string[];
    resources: number;
  }>;
  kpis: Array<{
    name: string;
    target: number;
    current: number;
    frequency: string;
  }>;
}

export interface KPIPrediction {
  kpi: string;
  currentValue: number;
  predictedValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  timeframe: string;
  range: { low: number; high: number };
}

export interface KPIDriver {
  kpi: string;
  driver: string;
  impact: number;
  direction: 'positive' | 'negative';
  controllable: boolean;
}

export interface KPIAlert {
  kpi: string;
  type: 'warning' | 'critical' | 'opportunity';
  message: string;
  threshold: number;
  predictedValue: number;
  timeToEvent: string;
}

export interface KPIPredictions {
  predictions: KPIPrediction[];
  drivers: KPIDriver[];
  alerts: KPIAlert[];
  correlations: Array<{
    kpi1: string;
    kpi2: string;
    correlation: number;
    lag: string;
  }>;
  recommendations: string[];
  modelAccuracy: number;
}

export interface PredictiveContext {
  entityId?: string;
  entityType?: string;
  businessUnit?: string;
  currentMetrics?: Record<string, number>;
  historicalData?: Array<Record<string, unknown>>;
}

// === HOOK ===

export function usePredictiveIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrediction, setLastPrediction] = useState<Date | null>(null);
  
  // Cache de predicciones
  const predictionCache = useRef<Map<string, { data: unknown; timestamp: Date }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // === FUNCIÓN BASE ===
  const invokePredictive = useCallback(async <T>(
    action: string,
    params: Record<string, unknown>
  ): Promise<T | null> => {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    const cached = predictionCache.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < CACHE_TTL) {
      return cached.data as T;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'predictive-intelligence',
        { body: { action, ...params } }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        predictionCache.current.set(cacheKey, { 
          data: data.data, 
          timestamp: new Date() 
        });
        setLastPrediction(new Date());
        return data.data as T;
      }

      throw new Error(data?.error || 'Error en predicción');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[usePredictiveIntelligence] ${action} error:`, err);
      toast.error(`Error: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === PREDICCIÓN DE RESULTADOS ===
  const predictOutcome = useCallback(async (
    context: PredictiveContext,
    timeHorizon?: string
  ): Promise<OutcomePrediction | null> => {
    return invokePredictive<OutcomePrediction>('predict_outcome', { context, timeHorizon });
  }, [invokePredictive]);

  // === ANÁLISIS DE ESCENARIOS ===
  const analyzeScenarios = useCallback(async (
    context: PredictiveContext,
    scenarios?: Array<Record<string, unknown>>,
    timeHorizon?: string
  ): Promise<ScenarioAnalysis | null> => {
    return invokePredictive<ScenarioAnalysis>('scenario_analysis', { 
      context, 
      scenarios, 
      timeHorizon 
    });
  }, [invokePredictive]);

  // === OPTIMIZACIÓN DE DECISIONES ===
  const optimizeDecision = useCallback(async (
    context: PredictiveContext,
    options: Array<Record<string, unknown>>,
    criteria?: Array<{ name: string; weight: number }>
  ): Promise<DecisionOptimization | null> => {
    return invokePredictive<DecisionOptimization>('decision_optimization', {
      context,
      params: { options, criteria }
    });
  }, [invokePredictive]);

  // === ASIGNACIÓN DE RECURSOS ===
  const optimizeResources = useCallback(async (
    context: PredictiveContext,
    resources: Array<Record<string, unknown>>,
    objectives: string[]
  ): Promise<ResourceAllocation | null> => {
    return invokePredictive<ResourceAllocation>('resource_allocation', {
      context,
      params: { resources, objectives }
    });
  }, [invokePredictive]);

  // === EVALUACIÓN DE RIESGOS ===
  const assessRisks = useCallback(async (
    context: PredictiveContext,
    focusArea?: string,
    timeHorizon?: string
  ): Promise<RiskAssessment | null> => {
    return invokePredictive<RiskAssessment>('risk_assessment', {
      context,
      params: { focusArea },
      timeHorizon
    });
  }, [invokePredictive]);

  // === PRONÓSTICO DE MERCADO ===
  const forecastMarket = useCallback(async (
    context: PredictiveContext,
    segments?: string[],
    timeHorizon?: string
  ): Promise<MarketForecast | null> => {
    return invokePredictive<MarketForecast>('market_forecast', {
      context,
      params: { segments },
      timeHorizon
    });
  }, [invokePredictive]);

  // === CICLO DE VIDA DEL CLIENTE ===
  const analyzeCustomerLifecycle = useCallback(async (
    context: PredictiveContext,
    customerData: Record<string, unknown>,
    history?: Array<Record<string, unknown>>
  ): Promise<CustomerLifecycle | null> => {
    return invokePredictive<CustomerLifecycle>('customer_lifecycle', {
      context,
      params: { customerData, history }
    });
  }, [invokePredictive]);

  // === SIMULACIÓN WHAT-IF ===
  const simulateWhatIf = useCallback(async (
    context: PredictiveContext,
    variables: Array<{ name: string; baseValue: number; modifiedValue: number }>,
    metrics: string[]
  ): Promise<WhatIfSimulation | null> => {
    return invokePredictive<WhatIfSimulation>('what_if_simulation', {
      context,
      params: { variables, metrics }
    });
  }, [invokePredictive]);

  // === PLANIFICACIÓN ESTRATÉGICA ===
  const planStrategically = useCallback(async (
    context: PredictiveContext,
    priorities?: string[],
    timeHorizon?: string
  ): Promise<StrategicPlan | null> => {
    return invokePredictive<StrategicPlan>('strategic_planning', {
      context,
      params: { priorities },
      timeHorizon
    });
  }, [invokePredictive]);

  // === PREDICCIÓN DE KPIs ===
  const predictKPIs = useCallback(async (
    context: PredictiveContext,
    kpis: string[],
    timeHorizon?: string
  ): Promise<KPIPredictions | null> => {
    return invokePredictive<KPIPredictions>('kpi_prediction', {
      context,
      params: { kpis },
      timeHorizon
    });
  }, [invokePredictive]);

  // === LIMPIAR CACHE ===
  const clearCache = useCallback(() => {
    predictionCache.current.clear();
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      predictionCache.current.clear();
    };
  }, []);

  return {
    // Estado
    isLoading,
    error,
    lastPrediction,
    
    // Predicciones
    predictOutcome,
    analyzeScenarios,
    optimizeDecision,
    optimizeResources,
    assessRisks,
    forecastMarket,
    analyzeCustomerLifecycle,
    simulateWhatIf,
    planStrategically,
    predictKPIs,
    
    // Utilidades
    clearCache,
  };
}

export default usePredictiveIntelligence;
