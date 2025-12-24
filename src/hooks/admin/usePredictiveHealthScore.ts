/**
 * usePredictiveHealthScore - Predictive Customer Health Score with ML
 * Predicts churn 90 days ahead with explainable factors
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === TYPES ===
export interface CustomerHealthScore {
  id: string;
  companyId: string;
  companyName: string;
  overallScore: number;
  previousScore: number;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  churnProbability90Days: number;
  predictedChurnDate: string | null;
  confidence: number;
  riskLevel: 'healthy' | 'at_risk' | 'high_risk' | 'critical';
  dimensions: HealthDimension[];
  explainableFactors: ExplainableFactor[];
  earlyWarningSignals: EarlyWarningSignal[];
  recommendedActions: RecommendedAction[];
  historicalScores: HistoricalScore[];
  lastUpdated: Date;
  nextPrediction: Date;
}

export interface HealthDimension {
  id: string;
  name: string;
  score: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  components: DimensionComponent[];
}

export interface DimensionComponent {
  name: string;
  value: number;
  benchmark: number;
  status: 'good' | 'warning' | 'critical';
}

export interface ExplainableFactor {
  id: string;
  factor: string;
  category: 'usage' | 'engagement' | 'support' | 'financial' | 'relationship';
  impact: number;
  direction: 'positive' | 'negative';
  weight: number;
  dataPoints: number;
  confidence: number;
  explanation: string;
  actionable: boolean;
  suggestedAction?: string;
  trend: {
    current: number;
    previous: number;
    change: number;
  };
}

export interface EarlyWarningSignal {
  id: string;
  signal: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  description: string;
  associatedChurnRisk: number;
  relatedFactors: string[];
  autoResponse?: {
    type: string;
    status: 'pending' | 'triggered' | 'completed';
    triggeredAt?: Date;
  };
}

export interface RecommendedAction {
  id: string;
  action: string;
  category: 'engagement' | 'support' | 'product' | 'commercial' | 'executive';
  priority: number;
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  owner: string;
  successProbability: number;
  aiReasoning: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface HistoricalScore {
  date: string;
  score: number;
  churnProbability: number;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  lastTraining: Date;
  dataPoints: number;
  featureImportance: { feature: string; importance: number }[];
}

// === MOCK DATA ===
function generateMockHealthScores(): CustomerHealthScore[] {
  const now = new Date();
  
  return [
    {
      id: 'hs-1',
      companyId: 'comp-1',
      companyName: 'TechCorp Industries',
      overallScore: 82,
      previousScore: 78,
      trend: 'improving',
      churnProbability90Days: 0.08,
      predictedChurnDate: null,
      confidence: 0.91,
      riskLevel: 'healthy',
      dimensions: [
        {
          id: 'dim-usage',
          name: 'Uso del Producto',
          score: 85,
          weight: 0.30,
          trend: 'up',
          components: [
            { name: 'DAU/MAU Ratio', value: 0.42, benchmark: 0.35, status: 'good' },
            { name: 'Feature Adoption', value: 0.78, benchmark: 0.60, status: 'good' },
            { name: 'Session Duration', value: 12.5, benchmark: 10, status: 'good' },
          ],
        },
        {
          id: 'dim-engagement',
          name: 'Engagement',
          score: 79,
          weight: 0.25,
          trend: 'stable',
          components: [
            { name: 'Login Frequency', value: 4.2, benchmark: 3, status: 'good' },
            { name: 'Email Open Rate', value: 0.35, benchmark: 0.30, status: 'good' },
            { name: 'Webinar Attendance', value: 0.60, benchmark: 0.50, status: 'good' },
          ],
        },
        {
          id: 'dim-support',
          name: 'Soporte',
          score: 88,
          weight: 0.20,
          trend: 'up',
          components: [
            { name: 'Ticket Volume', value: 2, benchmark: 5, status: 'good' },
            { name: 'CSAT Score', value: 4.5, benchmark: 4.0, status: 'good' },
            { name: 'Resolution Time', value: 4, benchmark: 8, status: 'good' },
          ],
        },
        {
          id: 'dim-financial',
          name: 'Financiero',
          score: 75,
          weight: 0.25,
          trend: 'stable',
          components: [
            { name: 'Payment History', value: 0.98, benchmark: 0.95, status: 'good' },
            { name: 'Contract Value Trend', value: 1.15, benchmark: 1.0, status: 'good' },
            { name: 'Expansion Revenue', value: 0.22, benchmark: 0.15, status: 'good' },
          ],
        },
      ],
      explainableFactors: [
        {
          id: 'ef-1',
          factor: 'Incremento en uso de funcionalidades avanzadas',
          category: 'usage',
          impact: 0.28,
          direction: 'positive',
          weight: 0.25,
          dataPoints: 1240,
          confidence: 0.94,
          explanation: 'El cliente ha incrementado el uso de features avanzadas un 45% en los últimos 30 días, indicando mayor adopción y value realization.',
          actionable: false,
          trend: { current: 78, previous: 54, change: 44.4 },
        },
        {
          id: 'ef-2',
          factor: 'NPS Score alto y estable',
          category: 'relationship',
          impact: 0.22,
          direction: 'positive',
          weight: 0.20,
          dataPoints: 12,
          confidence: 0.88,
          explanation: 'NPS de 72 consistente en últimas 3 encuestas. Champions identificados en el equipo.',
          actionable: true,
          suggestedAction: 'Solicitar caso de éxito o referencia',
          trend: { current: 72, previous: 68, change: 5.9 },
        },
        {
          id: 'ef-3',
          factor: 'Renovación próxima con engagement positivo',
          category: 'financial',
          impact: 0.18,
          direction: 'positive',
          weight: 0.15,
          dataPoints: 45,
          confidence: 0.85,
          explanation: 'Contrato renueva en 45 días con todas las métricas de engagement en verde.',
          actionable: true,
          suggestedAction: 'Iniciar conversación de renovación con propuesta de expansión',
          trend: { current: 85, previous: 82, change: 3.7 },
        },
      ],
      earlyWarningSignals: [],
      recommendedActions: [
        {
          id: 'ra-1',
          action: 'Proponer upgrade a tier Enterprise',
          category: 'commercial',
          priority: 1,
          expectedImpact: 0.35,
          effort: 'medium',
          timeline: 'Próximas 2 semanas',
          owner: 'CSM',
          successProbability: 0.72,
          aiReasoning: 'Alto uso de features enterprise-only en trial. ROI demostrado. Champions internos identificados.',
          status: 'pending',
        },
      ],
      historicalScores: Array.from({ length: 12 }, (_, i) => ({
        date: new Date(now.getTime() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        score: 70 + Math.floor(Math.random() * 15) + i,
        churnProbability: 0.15 - i * 0.005,
      })),
      lastUpdated: now,
      nextPrediction: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
    {
      id: 'hs-2',
      companyId: 'comp-2',
      companyName: 'RetailMax Group',
      overallScore: 45,
      previousScore: 58,
      trend: 'declining',
      churnProbability90Days: 0.68,
      predictedChurnDate: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString(),
      confidence: 0.87,
      riskLevel: 'high_risk',
      dimensions: [
        {
          id: 'dim-usage',
          name: 'Uso del Producto',
          score: 35,
          weight: 0.30,
          trend: 'down',
          components: [
            { name: 'DAU/MAU Ratio', value: 0.12, benchmark: 0.35, status: 'critical' },
            { name: 'Feature Adoption', value: 0.28, benchmark: 0.60, status: 'critical' },
            { name: 'Session Duration', value: 3.2, benchmark: 10, status: 'critical' },
          ],
        },
        {
          id: 'dim-engagement',
          name: 'Engagement',
          score: 42,
          weight: 0.25,
          trend: 'down',
          components: [
            { name: 'Login Frequency', value: 0.8, benchmark: 3, status: 'critical' },
            { name: 'Email Open Rate', value: 0.08, benchmark: 0.30, status: 'critical' },
            { name: 'Webinar Attendance', value: 0.0, benchmark: 0.50, status: 'critical' },
          ],
        },
        {
          id: 'dim-support',
          name: 'Soporte',
          score: 55,
          weight: 0.20,
          trend: 'down',
          components: [
            { name: 'Ticket Volume', value: 12, benchmark: 5, status: 'warning' },
            { name: 'CSAT Score', value: 2.8, benchmark: 4.0, status: 'critical' },
            { name: 'Resolution Time', value: 18, benchmark: 8, status: 'critical' },
          ],
        },
        {
          id: 'dim-financial',
          name: 'Financiero',
          score: 52,
          weight: 0.25,
          trend: 'stable',
          components: [
            { name: 'Payment History', value: 0.85, benchmark: 0.95, status: 'warning' },
            { name: 'Contract Value Trend', value: 0.90, benchmark: 1.0, status: 'warning' },
            { name: 'Expansion Revenue', value: 0.0, benchmark: 0.15, status: 'critical' },
          ],
        },
      ],
      explainableFactors: [
        {
          id: 'ef-4',
          factor: 'Caída drástica en uso del producto',
          category: 'usage',
          impact: -0.42,
          direction: 'negative',
          weight: 0.35,
          dataPoints: 890,
          confidence: 0.96,
          explanation: 'DAUs han caído 65% en últimos 45 días. Múltiples usuarios clave han dejado de acceder.',
          actionable: true,
          suggestedAction: 'Llamada de rescate urgente con sponsor ejecutivo',
          trend: { current: 12, previous: 34, change: -64.7 },
        },
        {
          id: 'ef-5',
          factor: 'Tickets de soporte críticos sin resolver',
          category: 'support',
          impact: -0.28,
          direction: 'negative',
          weight: 0.25,
          dataPoints: 15,
          confidence: 0.92,
          explanation: '5 tickets críticos abiertos por más de 10 días. Cliente ha escalado a management.',
          actionable: true,
          suggestedAction: 'Escalación inmediata y resolución prioritaria',
          trend: { current: 12, previous: 3, change: 300 },
        },
        {
          id: 'ef-6',
          factor: 'Champion ha dejado la empresa',
          category: 'relationship',
          impact: -0.35,
          direction: 'negative',
          weight: 0.30,
          dataPoints: 1,
          confidence: 0.99,
          explanation: 'El sponsor principal y champion del proyecto cambió de empresa hace 3 semanas. No hay nuevo champion identificado.',
          actionable: true,
          suggestedAction: 'Identificar y desarrollar nuevo champion urgentemente',
          trend: { current: 0, previous: 1, change: -100 },
        },
      ],
      earlyWarningSignals: [
        {
          id: 'ews-1',
          signal: 'Uso crítico bajo',
          severity: 'critical',
          detectedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          description: 'DAU/MAU ratio bajo umbral crítico (<15%) por 2 semanas',
          associatedChurnRisk: 0.45,
          relatedFactors: ['ef-4'],
          autoResponse: {
            type: 'email_reengagement',
            status: 'triggered',
            triggeredAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          },
        },
        {
          id: 'ews-2',
          signal: 'Champion perdido',
          severity: 'critical',
          detectedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
          description: 'Stakeholder principal identificado en LinkedIn como empleado de otra empresa',
          associatedChurnRisk: 0.35,
          relatedFactors: ['ef-6'],
        },
        {
          id: 'ews-3',
          signal: 'Escalación de soporte',
          severity: 'high',
          detectedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
          description: 'Cliente ha escalado tickets directamente a VP de Customer Success',
          associatedChurnRisk: 0.25,
          relatedFactors: ['ef-5'],
        },
      ],
      recommendedActions: [
        {
          id: 'ra-2',
          action: 'Llamada ejecutiva de rescate inmediata',
          category: 'executive',
          priority: 1,
          expectedImpact: 0.40,
          effort: 'high',
          timeline: 'Hoy',
          owner: 'VP Customer Success',
          successProbability: 0.55,
          aiReasoning: 'Cuenta en riesgo crítico requiere intervención ejecutiva. Sin acción inmediata, churn es prácticamente seguro.',
          status: 'pending',
        },
        {
          id: 'ra-3',
          action: 'Resolver todos los tickets críticos',
          category: 'support',
          priority: 2,
          expectedImpact: 0.28,
          effort: 'high',
          timeline: '48 horas',
          owner: 'Support Lead',
          successProbability: 0.85,
          aiReasoning: 'Los tickets sin resolver son frustrantes para el cliente y amplifican la percepción negativa.',
          status: 'in_progress',
        },
        {
          id: 'ra-4',
          action: 'Identificar y desarrollar nuevo champion',
          category: 'engagement',
          priority: 3,
          expectedImpact: 0.35,
          effort: 'medium',
          timeline: '1 semana',
          owner: 'CSM',
          successProbability: 0.60,
          aiReasoning: 'Sin champion interno, cualquier esfuerzo de retención tendrá impacto limitado.',
          status: 'pending',
        },
        {
          id: 'ra-5',
          action: 'Ofrecer sesión de re-onboarding gratuita',
          category: 'product',
          priority: 4,
          expectedImpact: 0.22,
          effort: 'medium',
          timeline: '2 semanas',
          owner: 'CSM',
          successProbability: 0.70,
          aiReasoning: 'Reiniciar la relación con training personalizado puede recuperar engagement.',
          status: 'pending',
        },
      ],
      historicalScores: Array.from({ length: 12 }, (_, i) => ({
        date: new Date(now.getTime() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        score: Math.max(35, 75 - i * 3 - Math.floor(Math.random() * 5)),
        churnProbability: Math.min(0.75, 0.15 + i * 0.05),
      })),
      lastUpdated: now,
      nextPrediction: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  ];
}

function generateMockModelPerformance(): ModelPerformance {
  return {
    accuracy: 0.89,
    precision: 0.86,
    recall: 0.91,
    f1Score: 0.88,
    auc: 0.94,
    lastTraining: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dataPoints: 15420,
    featureImportance: [
      { feature: 'DAU/MAU Ratio', importance: 0.18 },
      { feature: 'Login Frequency', importance: 0.15 },
      { feature: 'Feature Adoption', importance: 0.14 },
      { feature: 'Support Tickets', importance: 0.12 },
      { feature: 'NPS Score', importance: 0.11 },
      { feature: 'Payment History', importance: 0.10 },
      { feature: 'Champion Engagement', importance: 0.09 },
      { feature: 'Session Duration', importance: 0.07 },
      { feature: 'Contract Age', importance: 0.04 },
    ],
  };
}

// === HOOK ===
export function usePredictiveHealthScore() {
  const [healthScores, setHealthScores] = useState<CustomerHealthScore[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH HEALTH SCORES ===
  const fetchHealthScores = useCallback(async (companyIds?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predict-churn', {
        body: { 
          action: 'health_scores',
          companyIds,
          prediction_horizon_days: 90,
          include_explainability: true
        }
      });

      if (fnError) throw fnError;

      if (data?.healthScores) {
        setHealthScores(data.healthScores);
      } else {
        // Fallback to mock data
        setHealthScores(generateMockHealthScores());
      }
      
      setLastRefresh(new Date());

    } catch (err) {
      console.error('[usePredictiveHealthScore] Error:', err);
      // Use mock data on error
      setHealthScores(generateMockHealthScores());
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH MODEL PERFORMANCE ===
  const fetchModelPerformance = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predict-churn', {
        body: { action: 'model_performance' }
      });

      if (fnError) throw fnError;

      if (data?.performance) {
        setModelPerformance(data.performance);
      } else {
        setModelPerformance(generateMockModelPerformance());
      }

    } catch (err) {
      console.error('[usePredictiveHealthScore] Model performance error:', err);
      setModelPerformance(generateMockModelPerformance());
    }
  }, []);

  // === UPDATE ACTION STATUS ===
  const updateActionStatus = useCallback(async (
    healthScoreId: string,
    actionId: string,
    status: RecommendedAction['status']
  ) => {
    setHealthScores(prev => prev.map(hs => {
      if (hs.id !== healthScoreId) return hs;
      return {
        ...hs,
        recommendedActions: hs.recommendedActions.map(action => 
          action.id === actionId ? { ...action, status } : action
        ),
      };
    }));

    toast.success('Estado de acción actualizado');
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchHealthScores();
    fetchModelPerformance();
    autoRefreshInterval.current = setInterval(() => {
      fetchHealthScores();
    }, intervalMs);
  }, [fetchHealthScores, fetchModelPerformance]);

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

  // === COMPUTED VALUES ===
  const criticalAccounts = healthScores.filter(hs => hs.riskLevel === 'critical');
  const highRiskAccounts = healthScores.filter(hs => hs.riskLevel === 'high_risk');
  const atRiskAccounts = healthScores.filter(hs => hs.riskLevel === 'at_risk');
  const healthyAccounts = healthScores.filter(hs => hs.riskLevel === 'healthy');
  
  const averageScore = healthScores.length > 0 
    ? healthScores.reduce((sum, hs) => sum + hs.overallScore, 0) / healthScores.length 
    : 0;
  
  const averageChurnProbability = healthScores.length > 0
    ? healthScores.reduce((sum, hs) => sum + hs.churnProbability90Days, 0) / healthScores.length
    : 0;

  const totalValueAtRisk = highRiskAccounts.length * 50000 + criticalAccounts.length * 100000; // Simplified calculation

  const getScoreColor = useCallback((score: number): string => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  const getRiskBadgeVariant = useCallback((riskLevel: CustomerHealthScore['riskLevel']) => {
    switch (riskLevel) {
      case 'healthy': return 'default' as const;
      case 'at_risk': return 'secondary' as const;
      case 'high_risk': return 'destructive' as const;
      case 'critical': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  }, []);

  return {
    // Data
    healthScores,
    modelPerformance,
    
    // State
    isLoading,
    error,
    lastRefresh,
    
    // Actions
    fetchHealthScores,
    fetchModelPerformance,
    updateActionStatus,
    startAutoRefresh,
    stopAutoRefresh,
    
    // Computed
    criticalAccounts,
    highRiskAccounts,
    atRiskAccounts,
    healthyAccounts,
    averageScore,
    averageChurnProbability,
    totalValueAtRisk,
    
    // Utilities
    getScoreColor,
    getRiskBadgeVariant,
  };
}

export default usePredictiveHealthScore;
