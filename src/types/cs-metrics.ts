/**
 * CS Metrics Knowledge Hub - Tipos y Interfaces
 * Sistema completo de métricas de Customer Success
 */

// === CATEGORÍAS DE MÉTRICAS ===
export type MetricCategory = 
  | 'perception'     // NPS, CSAT, CES
  | 'retention'      // Churn, Retention, NRR, GRR
  | 'value'          // CLV, CAC, ARR, ROI
  | 'engagement'     // Feature Adoption, Time-to-Value
  | 'growth'         // Expansion Rate, Quick Ratio
  | 'health';        // Health Score Compuesto

export type MetricTrend = 'up' | 'down' | 'stable';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type BenchmarkPosition = 'below' | 'average' | 'above' | 'top_quartile';

// === DEFINICIÓN DE MÉTRICA ===
export interface CSMetricDefinition {
  id: string;
  name: string;
  shortName: string;
  category: MetricCategory;
  description: string;
  formula: string;
  formulaExplanation: string;
  unit: 'percentage' | 'currency' | 'ratio' | 'score' | 'days' | 'months';
  higherIsBetter: boolean;
  
  // Benchmarks por industria
  benchmarks: {
    saas: { low: number; average: number; good: number; excellent: number };
    ecommerce?: { low: number; average: number; good: number; excellent: number };
    fintech?: { low: number; average: number; good: number; excellent: number };
    general: { low: number; average: number; good: number; excellent: number };
  };
  
  // Interpretación
  interpretation: {
    ranges: Array<{
      min: number;
      max: number;
      label: string;
      color: string;
      recommendation: string;
    }>;
  };
  
  // Correlaciones con otras métricas
  correlations: Array<{
    metricId: string;
    strength: 'weak' | 'moderate' | 'strong';
    direction: 'positive' | 'negative';
    description: string;
  }>;
  
  // Casos de uso y ejemplos
  useCases: string[];
  examples: Array<{
    scenario: string;
    values: Record<string, number>;
    result: number;
    interpretation: string;
  }>;
  
  // Tags para búsqueda
  tags: string[];
  
  // Nivel de importancia
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Es métrica 2025 avanzada
  isAdvanced2025: boolean;
}

// === VALOR DE MÉTRICA CALCULADO ===
export interface CSMetricValue {
  metricId: string;
  value: number;
  previousValue?: number;
  trend: MetricTrend;
  trendPercentage?: number;
  benchmarkPosition: BenchmarkPosition;
  riskLevel: RiskLevel;
  calculatedAt: string;
  period: {
    start: string;
    end: string;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  breakdown?: Record<string, number>;
}

// === CALCULADORA DE MÉTRICAS ===
export interface MetricCalculationInput {
  metricId: string;
  inputs: Record<string, number>;
}

export interface MetricCalculationResult {
  metricId: string;
  value: number;
  interpretation: string;
  benchmarkComparison: string;
  recommendations: string[];
}

// === DASHBOARD DE MÉTRICAS ===
export interface CSMetricsDashboardConfig {
  layout: 'grid' | 'list' | 'compact';
  categories: MetricCategory[];
  showTrends: boolean;
  showBenchmarks: boolean;
  showCorrelations: boolean;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface CSMetricCard {
  metric: CSMetricDefinition;
  value: CSMetricValue;
  sparklineData?: number[];
  alerts?: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
  }>;
}

// === HEALTH SCORE COMPUESTO ===
export interface CompositeHealthScoreConfig {
  weights: {
    nps: number;
    csat: number;
    ces: number;
    engagement: number;
    usage: number;
    support: number;
  };
  thresholds: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
}

export interface CompositeHealthScoreResult {
  overallScore: number;
  status: 'healthy' | 'at_risk' | 'critical';
  components: Array<{
    name: string;
    score: number;
    weight: number;
    contribution: number;
  }>;
  recommendations: string[];
  trend: MetricTrend;
}

// === PREDICCIONES Y ANALYTICS ===
export interface CSPrediction {
  type: 'churn' | 'expansion' | 'renewal' | 'health_decline';
  probability: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
  recommendedActions: string[];
  timeframe: string;
}

export interface MetricsCorrelation {
  metricA: string;
  metricB: string;
  correlationCoefficient: number;
  significance: number;
  interpretation: string;
  causality: 'none' | 'possible' | 'likely' | 'confirmed';
}

// === CHATBOT ASSISTANT ===
export interface CSMetricsQuestion {
  id: string;
  category: 'explain' | 'calculate' | 'compare' | 'recommend' | 'benchmark';
  question: string;
  quickAction: boolean;
}

export interface CSMetricsConversation {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: {
      metricsMentioned?: string[];
      calculationsPerformed?: MetricCalculationResult[];
    };
  }>;
  context: {
    currentMetrics?: Record<string, number>;
    industry?: string;
    companySize?: string;
  };
}

// === EXPORTACIÓN Y REPORTES ===
export interface CSMetricsReport {
  id: string;
  title: string;
  generatedAt: string;
  period: { start: string; end: string };
  metrics: CSMetricValue[];
  healthScore: CompositeHealthScoreResult;
  predictions: CSPrediction[];
  executiveSummary: string;
  recommendations: string[];
}

// === HELPERS DE COLORES ===
export const getMetricCategoryColor = (category: MetricCategory): string => {
  const colors: Record<MetricCategory, string> = {
    perception: 'hsl(var(--chart-1))',
    retention: 'hsl(var(--chart-2))',
    value: 'hsl(var(--chart-3))',
    engagement: 'hsl(var(--chart-4))',
    growth: 'hsl(var(--chart-5))',
    health: 'hsl(var(--primary))',
  };
  return colors[category];
};

export const getRiskLevelColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    low: 'hsl(var(--success))',
    medium: 'hsl(var(--warning))',
    high: 'hsl(var(--destructive))',
    critical: 'hsl(0 84% 40%)',
  };
  return colors[level];
};

export const getTrendIcon = (trend: MetricTrend): string => {
  const icons: Record<MetricTrend, string> = {
    up: '↑',
    down: '↓',
    stable: '→',
  };
  return icons[trend];
};
