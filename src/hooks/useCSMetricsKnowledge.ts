/**
 * useCSMetricsKnowledge - Hook para acceder a la Knowledge Base de CS Metrics
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  CS_METRICS_KNOWLEDGE, 
  METRIC_CATEGORIES, 
  QUICK_QUESTIONS,
  getMetricById,
  getMetricsByCategory,
  getAdvancedMetrics2025,
  getCoreMetrics,
  searchMetrics
} from '@/data/cs-metrics-knowledge';
import { 
  CSMetricDefinition, 
  MetricCategory, 
  MetricCalculationInput,
  MetricCalculationResult,
  BenchmarkPosition
} from '@/types/cs-metrics';

export function useCSMetricsKnowledge() {
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedOnly, setShowAdvancedOnly] = useState(false);

  // === MÉTRICAS FILTRADAS ===
  const filteredMetrics = useMemo(() => {
    let metrics = CS_METRICS_KNOWLEDGE;

    // Filtrar por búsqueda
    if (searchQuery) {
      metrics = searchMetrics(searchQuery);
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      metrics = metrics.filter(m => m.category === selectedCategory);
    }

    // Filtrar solo avanzadas
    if (showAdvancedOnly) {
      metrics = metrics.filter(m => m.isAdvanced2025);
    }

    return metrics;
  }, [selectedCategory, searchQuery, showAdvancedOnly]);

  // === CALCULADORA DE MÉTRICAS ===
  const calculateMetric = useCallback((input: MetricCalculationInput): MetricCalculationResult | null => {
    const metric = getMetricById(input.metricId);
    if (!metric) return null;

    let value = 0;
    const inputs = input.inputs;

    // Cálculos específicos por métrica
    switch (input.metricId) {
      case 'nps':
        value = (inputs.promoters || 0) - (inputs.detractors || 0);
        break;
      case 'csat':
        value = inputs.total ? ((inputs.satisfied || 0) / inputs.total) * 100 : 0;
        break;
      case 'ces':
        value = inputs.responses ? (inputs.total_score || 0) / inputs.responses : 0;
        break;
      case 'churn_rate':
        value = inputs.customers_start ? ((inputs.customers_lost || 0) / inputs.customers_start) * 100 : 0;
        break;
      case 'retention_rate':
        value = inputs.customers_start 
          ? (((inputs.customers_end || 0) - (inputs.new_customers || 0)) / inputs.customers_start) * 100 
          : 0;
        break;
      case 'nrr':
        value = inputs.revenue_start ? ((inputs.revenue_end_existing || 0) / inputs.revenue_start) * 100 : 0;
        break;
      case 'grr':
        value = inputs.revenue_start 
          ? (((inputs.revenue_start || 0) - (inputs.churn || 0) - (inputs.contraction || 0)) / inputs.revenue_start) * 100 
          : 0;
        break;
      case 'clv':
        value = ((inputs.monthly_revenue || 0) * (inputs.duration_months || 0)) - (inputs.cac || 0);
        break;
      case 'cac':
        value = inputs.new_customers ? ((inputs.marketing_cost || 0) + (inputs.sales_cost || 0)) / inputs.new_customers : 0;
        break;
      case 'arr':
        value = (inputs.mrr || 0) * 12;
        break;
      case 'roi':
        value = inputs.investment ? (((inputs.benefit || 0) - inputs.investment) / inputs.investment) * 100 : 0;
        break;
      case 'quick_ratio':
        const gains = (inputs.new_mrr || 0) + (inputs.expansion_mrr || 0);
        const losses = (inputs.churn_mrr || 0) + (inputs.contraction_mrr || 0);
        value = losses > 0 ? gains / losses : gains > 0 ? 999 : 0;
        break;
      case 'time_to_value':
        value = (inputs.first_value_date || 0) - (inputs.signup_date || 0);
        break;
      case 'feature_adoption_rate':
        value = inputs.total_active_users 
          ? ((inputs.users_using_feature || 0) / inputs.total_active_users) * 100 
          : 0;
        break;
      case 'expansion_rate':
        value = inputs.starting_revenue 
          ? ((inputs.expansion_revenue || 0) / inputs.starting_revenue) * 100 
          : 0;
        break;
      case 'payback_period':
        const monthlyGrossRevenue = (inputs.arpu || 0) * (inputs.gross_margin || 0.75);
        value = monthlyGrossRevenue > 0 ? (inputs.cac || 0) / monthlyGrossRevenue : 0;
        break;
      default:
        value = 0;
    }

    // Encontrar interpretación
    const interpretation = metric.interpretation.ranges.find(
      r => value >= r.min && value <= r.max
    );

    // Benchmark comparison
    const benchmark = metric.benchmarks.saas || metric.benchmarks.general;
    let benchmarkComparison = '';
    if (metric.higherIsBetter) {
      if (value >= benchmark.excellent) benchmarkComparison = 'Top 10% de la industria';
      else if (value >= benchmark.good) benchmarkComparison = 'Por encima del promedio';
      else if (value >= benchmark.average) benchmarkComparison = 'En el promedio';
      else benchmarkComparison = 'Por debajo del promedio';
    } else {
      if (value <= benchmark.excellent) benchmarkComparison = 'Top 10% de la industria';
      else if (value <= benchmark.good) benchmarkComparison = 'Por encima del promedio';
      else if (value <= benchmark.average) benchmarkComparison = 'En el promedio';
      else benchmarkComparison = 'Por debajo del promedio';
    }

    return {
      metricId: input.metricId,
      value: Math.round(value * 100) / 100,
      interpretation: interpretation?.label || 'Sin interpretación',
      benchmarkComparison,
      recommendations: interpretation ? [interpretation.recommendation] : [],
    };
  }, []);

  // === OBTENER POSICIÓN EN BENCHMARK ===
  const getBenchmarkPosition = useCallback((metricId: string, value: number): BenchmarkPosition => {
    const metric = getMetricById(metricId);
    if (!metric) return 'average';

    const benchmark = metric.benchmarks.saas || metric.benchmarks.general;
    
    if (metric.higherIsBetter) {
      if (value >= benchmark.excellent) return 'top_quartile';
      if (value >= benchmark.good) return 'above';
      if (value >= benchmark.average) return 'average';
      return 'below';
    } else {
      if (value <= benchmark.excellent) return 'top_quartile';
      if (value <= benchmark.good) return 'above';
      if (value <= benchmark.average) return 'average';
      return 'below';
    }
  }, []);

  // === OBTENER CORRELACIONES ===
  const getCorrelatedMetrics = useCallback((metricId: string): CSMetricDefinition[] => {
    const metric = getMetricById(metricId);
    if (!metric) return [];

    const correlatedIds = metric.correlations.map(c => c.metricId);
    return CS_METRICS_KNOWLEDGE.filter(m => correlatedIds.includes(m.id));
  }, []);

  // === GENERAR RECOMENDACIONES ===
  const getRecommendations = useCallback((metricId: string, value: number): string[] => {
    const metric = getMetricById(metricId);
    if (!metric) return [];

    const range = metric.interpretation.ranges.find(
      r => value >= r.min && value <= r.max
    );

    const recommendations: string[] = [];
    
    if (range) {
      recommendations.push(range.recommendation);
    }

    // Añadir recomendaciones basadas en correlaciones
    metric.correlations.forEach(correlation => {
      if (correlation.strength === 'strong') {
        recommendations.push(`Considera optimizar ${correlation.metricId}: ${correlation.description}`);
      }
    });

    return recommendations.slice(0, 3);
  }, []);

  return {
    // Estado
    selectedCategory,
    searchQuery,
    showAdvancedOnly,
    
    // Setters
    setSelectedCategory,
    setSearchQuery,
    setShowAdvancedOnly,
    
    // Datos
    allMetrics: CS_METRICS_KNOWLEDGE,
    filteredMetrics,
    categories: METRIC_CATEGORIES,
    quickQuestions: QUICK_QUESTIONS,
    
    // Getters
    getMetricById,
    getMetricsByCategory,
    getAdvancedMetrics2025,
    getCoreMetrics,
    searchMetrics,
    getCorrelatedMetrics,
    getBenchmarkPosition,
    getRecommendations,
    
    // Calculadora
    calculateMetric,
  };
}

export default useCSMetricsKnowledge;
