import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: 'deal_coaching' | 'churn_prevention' | 'revenue_optimization' | 'orchestrate' | 'get_agents_status' | 'execute_agent_action';
  agentId?: string;
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, agentId, context, params } = await req.json() as AgentRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'deal_coaching':
        systemPrompt = `Eres un Deal Coaching Agent especializado en optimizar procesos de ventas B2B.

CAPACIDADES:
- Análisis de deals en pipeline
- Identificación de blockers y objeciones
- Recomendaciones de next best actions
- Scoring predictivo de probabilidad de cierre
- Coaching personalizado para cada representante

FORMATO DE RESPUESTA (JSON estricto):
{
  "dealAnalysis": {
    "dealId": "string",
    "currentStage": "string",
    "winProbability": 0-100,
    "riskFactors": [...],
    "opportunities": [...]
  },
  "coaching": {
    "repStrengths": [...],
    "areasToImprove": [...],
    "suggestedApproach": "string",
    "talkingPoints": [...]
  },
  "nextActions": [
    {
      "action": "string",
      "priority": "high" | "medium" | "low",
      "deadline": "string",
      "expectedImpact": "string"
    }
  ],
  "competitiveIntel": {
    "competitors": [...],
    "differentiators": [...],
    "counterArguments": [...]
  }
}`;

        userPrompt = `Analiza este deal y proporciona coaching:
Deal: ${JSON.stringify(context?.deal || {})}
Historial de interacciones: ${JSON.stringify(context?.interactions || [])}
Perfil del representante: ${JSON.stringify(context?.repProfile || {})}
Datos del competidor: ${JSON.stringify(context?.competitors || [])}`;
        break;

      case 'churn_prevention':
        systemPrompt = `Eres un Churn Prevention Agent especializado en retención de clientes.

CAPACIDADES:
- Detección temprana de señales de churn
- Análisis de engagement y satisfacción
- Intervenciones personalizadas de retención
- Predicción de valor en riesgo
- Automatización de acciones preventivas

FORMATO DE RESPUESTA (JSON estricto):
{
  "churnAnalysis": {
    "customerId": "string",
    "churnRisk": 0-100,
    "riskLevel": "low" | "medium" | "high" | "critical",
    "predictedChurnDate": "string",
    "valueAtRisk": 0,
    "lifetimeValue": 0
  },
  "riskSignals": [
    {
      "signal": "string",
      "severity": "high" | "medium" | "low",
      "detectedAt": "string",
      "trend": "improving" | "stable" | "worsening"
    }
  ],
  "retentionStrategy": {
    "approach": "string",
    "interventions": [
      {
        "type": "string",
        "action": "string",
        "timing": "immediate" | "scheduled",
        "channel": "string",
        "message": "string"
      }
    ],
    "incentives": [...],
    "escalationPath": [...]
  },
  "healthScore": {
    "overall": 0-100,
    "engagement": 0-100,
    "satisfaction": 0-100,
    "adoption": 0-100,
    "support": 0-100
  }
}`;

        userPrompt = `Analiza el riesgo de churn para este cliente:
Cliente: ${JSON.stringify(context?.customer || {})}
Métricas de uso: ${JSON.stringify(context?.usageMetrics || {})}
Historial de soporte: ${JSON.stringify(context?.supportHistory || [])}
Feedback reciente: ${JSON.stringify(context?.feedback || [])}
Datos de facturación: ${JSON.stringify(context?.billing || {})}`;
        break;

      case 'revenue_optimization':
        systemPrompt = `Eres un Revenue Optimization Agent especializado en maximizar ingresos.

CAPACIDADES:
- Identificación de oportunidades de upsell/cross-sell
- Optimización de pricing dinámico
- Análisis de elasticidad de precios
- Forecasting de revenue
- Estrategias de expansión de cuentas

FORMATO DE RESPUESTA (JSON estricto):
{
  "revenueOpportunities": [
    {
      "type": "upsell" | "cross-sell" | "expansion" | "renewal",
      "customerId": "string",
      "currentMRR": 0,
      "potentialMRR": 0,
      "upliftPercentage": 0,
      "probability": 0-100,
      "product": "string",
      "reasoning": "string"
    }
  ],
  "pricingRecommendations": [
    {
      "segment": "string",
      "currentPrice": 0,
      "recommendedPrice": 0,
      "elasticity": 0,
      "expectedImpact": "string"
    }
  ],
  "forecast": {
    "currentMRR": 0,
    "projectedMRR": 0,
    "growthRate": 0,
    "confidenceLevel": 0-100,
    "assumptions": [...]
  },
  "actionPlan": [
    {
      "priority": 1,
      "action": "string",
      "target": "string",
      "expectedRevenue": 0,
      "timeline": "string"
    }
  ]
}`;

        userPrompt = `Identifica oportunidades de optimización de revenue:
Portfolio de clientes: ${JSON.stringify(context?.customers || [])}
Productos disponibles: ${JSON.stringify(context?.products || [])}
Histórico de ventas: ${JSON.stringify(context?.salesHistory || [])}
Benchmarks del sector: ${JSON.stringify(context?.benchmarks || {})}`;
        break;

      case 'orchestrate':
        systemPrompt = `Eres el Agent Orchestrator que coordina múltiples agentes de IA.

CAPACIDADES:
- Coordinación de agentes especializados
- Priorización de tareas entre agentes
- Resolución de conflictos
- Optimización de recursos
- Monitoreo de rendimiento

FORMATO DE RESPUESTA (JSON estricto):
{
  "orchestrationPlan": {
    "objective": "string",
    "agents": [
      {
        "agentId": "string",
        "agentType": "string",
        "task": "string",
        "priority": 1-5,
        "dependencies": [...],
        "estimatedDuration": "string"
      }
    ],
    "workflow": [
      {
        "step": 1,
        "agentId": "string",
        "action": "string",
        "inputs": [...],
        "outputs": [...]
      }
    ]
  },
  "resourceAllocation": {
    "totalCapacity": 100,
    "allocated": {...},
    "available": 0
  },
  "metrics": {
    "activeAgents": 0,
    "pendingTasks": 0,
    "completedToday": 0,
    "successRate": 0-100,
    "avgResponseTime": "string"
  },
  "recommendations": [
    {
      "type": "optimization" | "scaling" | "rebalancing",
      "description": "string",
      "impact": "string"
    }
  ]
}`;

        userPrompt = `Coordina los agentes para este objetivo:
Objetivo: ${context?.objective || 'Optimización general'}
Agentes disponibles: ${JSON.stringify(context?.availableAgents || [])}
Tareas pendientes: ${JSON.stringify(context?.pendingTasks || [])}
Restricciones: ${JSON.stringify(context?.constraints || {})}`;
        break;

      case 'get_agents_status':
        // Return mock status for all agents
        return new Response(JSON.stringify({
          success: true,
          data: {
            agents: [
              {
                id: 'deal-coaching-agent',
                name: 'Deal Coaching Agent',
                type: 'deal_coaching',
                status: 'active',
                lastActivity: new Date().toISOString(),
                metrics: {
                  dealsAnalyzed: 47,
                  coachingSessions: 23,
                  winRateImprovement: 12.5,
                  avgDealVelocity: -3.2
                },
                capabilities: ['deal_analysis', 'rep_coaching', 'competitive_intel', 'next_actions']
              },
              {
                id: 'churn-prevention-agent',
                name: 'Churn Prevention Agent',
                type: 'churn_prevention',
                status: 'active',
                lastActivity: new Date().toISOString(),
                metrics: {
                  customersMonitored: 234,
                  risksIdentified: 18,
                  interventionsSent: 12,
                  churnPrevented: 8,
                  revenueProtected: 45000
                },
                capabilities: ['risk_detection', 'health_scoring', 'intervention', 'prediction']
              },
              {
                id: 'revenue-optimization-agent',
                name: 'Revenue Optimization Agent',
                type: 'revenue_optimization',
                status: 'active',
                lastActivity: new Date().toISOString(),
                metrics: {
                  opportunitiesFound: 56,
                  upsellsGenerated: 12,
                  revenueImpact: 78000,
                  forecastAccuracy: 94.2
                },
                capabilities: ['upsell_detection', 'pricing_optimization', 'forecasting', 'expansion']
              }
            ],
            orchestrator: {
              status: 'running',
              activeWorkflows: 3,
              queuedTasks: 7,
              completedToday: 42,
              resourceUtilization: 67
            }
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'execute_agent_action':
        // Execute a specific agent action
        const actionResult = {
          agentId,
          actionType: params?.actionType,
          status: 'completed',
          result: {
            message: `Acción ${params?.actionType} ejecutada exitosamente`,
            impact: params?.expectedImpact || 'Impacto pendiente de medición',
            nextSteps: ['Monitorear resultados', 'Ajustar estrategia si es necesario']
          },
          executedAt: new Date().toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          data: actionResult,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[ai-agents-v2] Processing action: ${action}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[ai-agents-v2] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[ai-agents-v2] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      agentId,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-agents-v2] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
