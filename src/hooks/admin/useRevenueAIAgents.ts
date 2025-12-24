/**
 * useRevenueAIAgents - Enterprise Revenue Operations AI Agents
 * Autonomous agents for forecasting, deal coaching, and risk monitoring
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === TIPOS ===
export type AgentType = 
  | 'forecasting'
  | 'deal_coaching' 
  | 'risk_monitoring'
  | 'expansion_detection'
  | 'churn_prevention';

export type AgentStatus = 'idle' | 'analyzing' | 'completed' | 'error';

export interface AIAgent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  status: AgentStatus;
  lastRun: Date | null;
  nextScheduledRun: Date | null;
  accuracy: number;
  insightsGenerated: number;
  isActive: boolean;
}

export interface ForecastInsight {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  horizon: string;
  trend: 'up' | 'down' | 'stable';
  factors: ExplainabilityFactor[];
  recommendations: string[];
  scenarioAnalysis: ScenarioResult[];
}

export interface DealCoachingInsight {
  id: string;
  dealId: string;
  dealName: string;
  currentStage: string;
  winProbability: number;
  recommendedActions: CoachingAction[];
  riskFactors: RiskFactor[];
  competitorIntel: string[];
  nextBestAction: string;
  urgencyScore: number;
}

export interface RiskMonitoringInsight {
  id: string;
  entityType: 'deal' | 'account' | 'revenue_stream';
  entityId: string;
  entityName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: RiskFactor[];
  mitigationActions: MitigationAction[];
  impactAmount: number;
  timeToAction: number;
  explanation: string;
}

export interface ExplainabilityFactor {
  factor: string;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
  confidence: number;
  dataPoints: number;
  humanReadable: string;
}

export interface CoachingAction {
  action: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  successProbability: number;
  reasoning: string;
}

export interface RiskFactor {
  factor: string;
  severity: number;
  trend: 'improving' | 'stable' | 'worsening';
  description: string;
  dataSource: string;
}

export interface MitigationAction {
  action: string;
  expectedImpact: number;
  priority: number;
  owner: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ScenarioResult {
  scenario: 'pessimistic' | 'base' | 'optimistic';
  probability: number;
  value: number;
  assumptions: string[];
}

export interface AgentContext {
  companyId?: string;
  timeRange?: { start: Date; end: Date };
  focusAreas?: string[];
  thresholds?: {
    riskLevel?: number;
    confidenceMin?: number;
  };
}

// === MOCK DATA GENERATION ===
function generateMockAgents(): AIAgent[] {
  return [
    {
      id: 'agent-forecast',
      type: 'forecasting',
      name: 'Revenue Forecaster',
      description: 'Predicción de ingresos con Monte Carlo y análisis de escenarios',
      status: 'idle',
      lastRun: new Date(Date.now() - 3600000),
      nextScheduledRun: new Date(Date.now() + 3600000),
      accuracy: 94.2,
      insightsGenerated: 156,
      isActive: true,
    },
    {
      id: 'agent-coaching',
      type: 'deal_coaching',
      name: 'Deal Coach AI',
      description: 'Coaching en tiempo real para cerrar más deals',
      status: 'idle',
      lastRun: new Date(Date.now() - 1800000),
      nextScheduledRun: new Date(Date.now() + 1800000),
      accuracy: 87.5,
      insightsGenerated: 423,
      isActive: true,
    },
    {
      id: 'agent-risk',
      type: 'risk_monitoring',
      name: 'Risk Monitor',
      description: 'Monitorización continua de riesgos en pipeline y cuentas',
      status: 'idle',
      lastRun: new Date(Date.now() - 900000),
      nextScheduledRun: new Date(Date.now() + 900000),
      accuracy: 91.8,
      insightsGenerated: 89,
      isActive: true,
    },
    {
      id: 'agent-expansion',
      type: 'expansion_detection',
      name: 'Expansion Detector',
      description: 'Identificación de oportunidades de expansión en cuentas existentes',
      status: 'idle',
      lastRun: new Date(Date.now() - 7200000),
      nextScheduledRun: new Date(Date.now() + 7200000),
      accuracy: 82.3,
      insightsGenerated: 67,
      isActive: true,
    },
    {
      id: 'agent-churn',
      type: 'churn_prevention',
      name: 'Churn Preventer',
      description: 'Detección temprana y prevención proactiva de churn',
      status: 'idle',
      lastRun: new Date(Date.now() - 5400000),
      nextScheduledRun: new Date(Date.now() + 5400000),
      accuracy: 89.1,
      insightsGenerated: 34,
      isActive: true,
    },
  ];
}

function generateMockForecastInsights(): ForecastInsight[] {
  return [
    {
      id: 'fi-1',
      metric: 'MRR',
      currentValue: 485000,
      predictedValue: 542000,
      confidence: 0.87,
      horizon: '90 días',
      trend: 'up',
      factors: [
        {
          factor: 'Pipeline Velocity',
          contribution: 0.35,
          direction: 'positive',
          confidence: 0.92,
          dataPoints: 156,
          humanReadable: 'La velocidad del pipeline ha aumentado 23% vs trimestre anterior',
        },
        {
          factor: 'Expansion Revenue',
          contribution: 0.28,
          direction: 'positive',
          confidence: 0.88,
          dataPoints: 89,
          humanReadable: 'Upsells y cross-sells proyectan +€45K adicionales',
        },
        {
          factor: 'Seasonality',
          contribution: 0.15,
          direction: 'positive',
          confidence: 0.95,
          dataPoints: 720,
          humanReadable: 'Q4 históricamente fuerte (+18% vs media anual)',
        },
      ],
      recommendations: [
        'Acelerar deals en Stage 3+ para capturar ventana Q4',
        'Priorizar expansiones en top 20 cuentas',
        'Reforzar retención en cuentas con contratos venciendo',
      ],
      scenarioAnalysis: [
        { scenario: 'pessimistic', probability: 0.15, value: 498000, assumptions: ['Win rate -5%', 'Churn +2%'] },
        { scenario: 'base', probability: 0.60, value: 542000, assumptions: ['Tendencia actual'] },
        { scenario: 'optimistic', probability: 0.25, value: 589000, assumptions: ['Win rate +3%', '2 mega-deals'] },
      ],
    },
    {
      id: 'fi-2',
      metric: 'ARR',
      currentValue: 5820000,
      predictedValue: 6504000,
      confidence: 0.82,
      horizon: '12 meses',
      trend: 'up',
      factors: [
        {
          factor: 'Net Revenue Retention',
          contribution: 0.42,
          direction: 'positive',
          confidence: 0.89,
          dataPoints: 234,
          humanReadable: 'NRR de 118% indica fuerte expansión',
        },
        {
          factor: 'New Logo Acquisition',
          contribution: 0.33,
          direction: 'positive',
          confidence: 0.78,
          dataPoints: 67,
          humanReadable: 'Pipeline de nuevos clientes saludable',
        },
      ],
      recommendations: [
        'Mantener foco en NRR sobre new logos',
        'Invertir en customer success para expansiones',
      ],
      scenarioAnalysis: [
        { scenario: 'pessimistic', probability: 0.20, value: 6100000, assumptions: ['Churn +3%'] },
        { scenario: 'base', probability: 0.55, value: 6504000, assumptions: ['Tendencia actual'] },
        { scenario: 'optimistic', probability: 0.25, value: 7100000, assumptions: ['NRR 125%'] },
      ],
    },
  ];
}

function generateMockDealCoachingInsights(): DealCoachingInsight[] {
  return [
    {
      id: 'dc-1',
      dealId: 'deal-123',
      dealName: 'Enterprise Suite - TechCorp',
      currentStage: 'Negociación',
      winProbability: 0.72,
      recommendedActions: [
        {
          action: 'Agendar demo técnica con equipo de IT',
          impact: 0.15,
          effort: 'medium',
          timeline: 'Esta semana',
          successProbability: 0.85,
          reasoning: 'Stakeholder técnico no ha visto producto - bloqueador común en esta fase',
        },
        {
          action: 'Enviar caso de éxito sector similar',
          impact: 0.08,
          effort: 'low',
          timeline: 'Hoy',
          successProbability: 0.90,
          reasoning: 'Referencias del sector aumentan confianza del comprador',
        },
        {
          action: 'Proponer call con cliente referencia',
          impact: 0.12,
          effort: 'medium',
          timeline: 'Próximos 3 días',
          successProbability: 0.75,
          reasoning: 'Peer validation acelera decisiones enterprise',
        },
      ],
      riskFactors: [
        {
          factor: 'Champion débil',
          severity: 0.65,
          trend: 'stable',
          description: 'Contacto principal no tiene autoridad de compra directa',
          dataSource: 'Análisis de comunicaciones',
        },
        {
          factor: 'Competidor activo',
          severity: 0.45,
          trend: 'worsening',
          description: 'Salesforce mencionado en última llamada',
          dataSource: 'Transcripción llamada',
        },
      ],
      competitorIntel: [
        'Salesforce ofrece 15% descuento primer año',
        'HubSpot no tiene capacidades enterprise requeridas',
      ],
      nextBestAction: 'Agendar demo técnica con equipo de IT',
      urgencyScore: 8.5,
    },
    {
      id: 'dc-2',
      dealId: 'deal-456',
      dealName: 'Platform Pro - RetailCo',
      currentStage: 'Propuesta',
      winProbability: 0.58,
      recommendedActions: [
        {
          action: 'Revisar propuesta económica - descuento estratégico',
          impact: 0.20,
          effort: 'low',
          timeline: 'Hoy',
          successProbability: 0.70,
          reasoning: 'Precio citado como objeción principal',
        },
      ],
      riskFactors: [
        {
          factor: 'Presupuesto congelado',
          severity: 0.80,
          trend: 'worsening',
          description: 'Cliente menciona restricciones presupuestarias Q4',
          dataSource: 'Email del 15/11',
        },
      ],
      competitorIntel: [],
      nextBestAction: 'Proponer modelo de pago flexible',
      urgencyScore: 9.2,
    },
  ];
}

function generateMockRiskInsights(): RiskMonitoringInsight[] {
  return [
    {
      id: 'rm-1',
      entityType: 'account',
      entityId: 'acc-789',
      entityName: 'MegaCorp Industries',
      riskLevel: 'high',
      riskScore: 78,
      riskFactors: [
        {
          factor: 'Uso decreciente',
          severity: 0.85,
          trend: 'worsening',
          description: 'DAUs han caído 45% en últimos 30 días',
          dataSource: 'Analytics de producto',
        },
        {
          factor: 'Tickets sin resolver',
          severity: 0.60,
          trend: 'worsening',
          description: '3 tickets críticos abiertos >7 días',
          dataSource: 'Sistema de soporte',
        },
        {
          factor: 'Renovación próxima',
          severity: 0.70,
          trend: 'stable',
          description: 'Contrato vence en 45 días',
          dataSource: 'CRM',
        },
      ],
      mitigationActions: [
        {
          action: 'Llamada ejecutiva inmediata',
          expectedImpact: 0.35,
          priority: 1,
          owner: 'CSM Lead',
          deadline: 'Mañana',
          status: 'pending',
        },
        {
          action: 'Resolver tickets prioritarios',
          expectedImpact: 0.25,
          priority: 2,
          owner: 'Support Lead',
          deadline: '48 horas',
          status: 'in_progress',
        },
        {
          action: 'Ofrecer sesión de re-onboarding',
          expectedImpact: 0.20,
          priority: 3,
          owner: 'CSM',
          deadline: 'Esta semana',
          status: 'pending',
        },
      ],
      impactAmount: 156000,
      timeToAction: 2,
      explanation: 'Cuenta enterprise con ARR €156K muestra señales claras de desengagement. La combinación de uso decreciente + tickets sin resolver + renovación próxima indica riesgo crítico de churn. Acción inmediata requerida.',
    },
    {
      id: 'rm-2',
      entityType: 'deal',
      entityId: 'deal-321',
      entityName: 'Expansion - FinanceGroup',
      riskLevel: 'medium',
      riskScore: 52,
      riskFactors: [
        {
          factor: 'Cambio de champion',
          severity: 0.55,
          trend: 'stable',
          description: 'Contacto principal cambió de rol',
          dataSource: 'LinkedIn',
        },
      ],
      mitigationActions: [
        {
          action: 'Identificar nuevo champion',
          expectedImpact: 0.40,
          priority: 1,
          owner: 'AE',
          deadline: 'Esta semana',
          status: 'pending',
        },
      ],
      impactAmount: 85000,
      timeToAction: 5,
      explanation: 'Oportunidad de expansión en riesgo por cambio organizacional en cliente.',
    },
  ];
}

// === HOOK ===
export function useRevenueAIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [forecastInsights, setForecastInsights] = useState<ForecastInsight[]>([]);
  const [dealCoachingInsights, setDealCoachingInsights] = useState<DealCoachingInsight[]>([]);
  const [riskInsights, setRiskInsights] = useState<RiskMonitoringInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === INITIALIZE AGENTS ===
  const initializeAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, this would fetch from edge function
      const mockAgents = generateMockAgents();
      setAgents(mockAgents);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error initializing agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RUN SPECIFIC AGENT ===
  const runAgent = useCallback(async (agentType: AgentType, context?: AgentContext) => {
    setIsLoading(true);
    setError(null);

    try {
      // Update agent status
      setAgents(prev => prev.map(a => 
        a.type === agentType ? { ...a, status: 'analyzing' as AgentStatus } : a
      ));

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('revenue-ai-agents', {
        body: { action: agentType, context }
      });

      if (fnError) throw fnError;

      // Process results based on agent type
      switch (agentType) {
        case 'forecasting':
          setForecastInsights(data?.insights || generateMockForecastInsights());
          break;
        case 'deal_coaching':
          setDealCoachingInsights(data?.insights || generateMockDealCoachingInsights());
          break;
        case 'risk_monitoring':
        case 'churn_prevention':
          setRiskInsights(data?.insights || generateMockRiskInsights());
          break;
        case 'expansion_detection':
          // Handle expansion insights
          break;
      }

      // Update agent status
      setAgents(prev => prev.map(a => 
        a.type === agentType 
          ? { ...a, status: 'completed' as AgentStatus, lastRun: new Date(), insightsGenerated: a.insightsGenerated + 1 } 
          : a
      ));

      setLastRefresh(new Date());
      toast.success(`Agente ${agentType} completado`);

    } catch (err) {
      console.error(`[useRevenueAIAgents] runAgent error:`, err);
      
      // Fallback to mock data
      switch (agentType) {
        case 'forecasting':
          setForecastInsights(generateMockForecastInsights());
          break;
        case 'deal_coaching':
          setDealCoachingInsights(generateMockDealCoachingInsights());
          break;
        case 'risk_monitoring':
        case 'churn_prevention':
          setRiskInsights(generateMockRiskInsights());
          break;
      }

      setAgents(prev => prev.map(a => 
        a.type === agentType 
          ? { ...a, status: 'completed' as AgentStatus, lastRun: new Date() } 
          : a
      ));
      
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RUN ALL AGENTS ===
  const runAllAgents = useCallback(async (context?: AgentContext) => {
    const agentTypes: AgentType[] = ['forecasting', 'deal_coaching', 'risk_monitoring'];
    
    for (const agentType of agentTypes) {
      await runAgent(agentType, context);
    }
  }, [runAgent]);

  // === TOGGLE AGENT ===
  const toggleAgent = useCallback((agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, isActive: !a.isActive } : a
    ));
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context?: AgentContext, intervalMs = 300000) => {
    stopAutoRefresh();
    initializeAgents();
    autoRefreshInterval.current = setInterval(() => {
      runAllAgents(context);
    }, intervalMs);
  }, [initializeAgents, runAllAgents]);

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
  const activeAgentsCount = agents.filter(a => a.isActive).length;
  const totalInsights = forecastInsights.length + dealCoachingInsights.length + riskInsights.length;
  const highRiskCount = riskInsights.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
  const totalValueAtRisk = riskInsights.reduce((sum, r) => sum + r.impactAmount, 0);

  return {
    // Data
    agents,
    forecastInsights,
    dealCoachingInsights,
    riskInsights,
    
    // State
    isLoading,
    error,
    lastRefresh,
    
    // Actions
    initializeAgents,
    runAgent,
    runAllAgents,
    toggleAgent,
    startAutoRefresh,
    stopAutoRefresh,
    
    // Computed
    activeAgentsCount,
    totalInsights,
    highRiskCount,
    totalValueAtRisk,
  };
}

export default useRevenueAIAgents;
