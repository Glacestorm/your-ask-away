import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveRequest {
  action: 'predict_outcome' | 'scenario_analysis' | 'decision_optimization' | 
          'resource_allocation' | 'risk_assessment' | 'market_forecast' |
          'customer_lifecycle' | 'what_if_simulation' | 'strategic_planning' |
          'kpi_prediction';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
  timeHorizon?: string;
  scenarios?: Array<Record<string, unknown>>;
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

    const { action, context, params, timeHorizon, scenarios } = await req.json() as PredictiveRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'predict_outcome':
        systemPrompt = `Eres un motor de predicción empresarial avanzado que utiliza análisis multivariable.

CAPACIDADES:
- Predicción de resultados basada en datos históricos y tendencias
- Análisis de factores contribuyentes con pesos relativos
- Intervalos de confianza y márgenes de error
- Identificación de variables críticas

RESPUESTA JSON:
{
  "prediction": {
    "outcome": "descripción del resultado predicho",
    "value": number,
    "unit": "string",
    "confidence": 0-100,
    "timeframe": "string"
  },
  "factors": [
    {
      "name": "string",
      "impact": "positive" | "negative" | "neutral",
      "weight": 0-100,
      "currentTrend": "up" | "down" | "stable"
    }
  ],
  "confidenceInterval": {
    "low": number,
    "high": number,
    "probability": 0-100
  },
  "assumptions": ["string"],
  "risks": ["string"],
  "recommendations": ["string"]
}`;
        userPrompt = `Predice el resultado para: ${JSON.stringify(context)}
Horizonte temporal: ${timeHorizon || '30 días'}
Parámetros adicionales: ${JSON.stringify(params)}`;
        break;

      case 'scenario_analysis':
        systemPrompt = `Eres un analista de escenarios estratégicos que evalúa múltiples futuros posibles.

CAPACIDADES:
- Análisis de escenarios optimista, pesimista y base
- Evaluación de probabilidades y impactos
- Identificación de puntos de inflexión
- Recomendaciones por escenario

RESPUESTA JSON:
{
  "scenarios": [
    {
      "name": "string",
      "type": "optimistic" | "pessimistic" | "base" | "alternative",
      "probability": 0-100,
      "description": "string",
      "keyDrivers": ["string"],
      "outcomes": {
        "revenue": { "change": number, "value": number },
        "customers": { "change": number, "value": number },
        "efficiency": { "change": number, "value": number }
      },
      "timeline": "string",
      "triggers": ["string"],
      "mitigations": ["string"]
    }
  ],
  "comparison": {
    "bestCase": "string",
    "worstCase": "string",
    "mostLikely": "string"
  },
  "criticalDecisions": ["string"],
  "monitoringMetrics": ["string"]
}`;
        userPrompt = `Analiza escenarios para: ${JSON.stringify(context)}
Escenarios específicos a evaluar: ${JSON.stringify(scenarios)}
Horizonte: ${timeHorizon || '12 meses'}`;
        break;

      case 'decision_optimization':
        systemPrompt = `Eres un motor de optimización de decisiones empresariales basado en IA.

CAPACIDADES:
- Evaluación multicriterio de opciones
- Optimización bajo restricciones
- Análisis de trade-offs
- Recomendaciones priorizadas

RESPUESTA JSON:
{
  "decision": {
    "recommended": "string",
    "confidence": 0-100,
    "rationale": "string"
  },
  "options": [
    {
      "name": "string",
      "score": 0-100,
      "pros": ["string"],
      "cons": ["string"],
      "costs": { "immediate": number, "ongoing": number },
      "benefits": { "shortTerm": number, "longTerm": number },
      "risks": ["string"],
      "timeline": "string"
    }
  ],
  "criteria": [
    {
      "name": "string",
      "weight": 0-100,
      "description": "string"
    }
  ],
  "constraints": ["string"],
  "sensitivity": {
    "criticalFactors": ["string"],
    "robustness": 0-100
  },
  "implementation": {
    "steps": ["string"],
    "milestones": ["string"],
    "kpis": ["string"]
  }
}`;
        userPrompt = `Optimiza la decisión para: ${JSON.stringify(context)}
Opciones a evaluar: ${JSON.stringify(params?.options)}
Criterios de decisión: ${JSON.stringify(params?.criteria)}`;
        break;

      case 'resource_allocation':
        systemPrompt = `Eres un optimizador de asignación de recursos empresariales.

CAPACIDADES:
- Optimización de distribución de recursos
- Balanceo de carga y capacidad
- Maximización de ROI
- Identificación de cuellos de botella

RESPUESTA JSON:
{
  "allocation": {
    "optimal": [
      {
        "resource": "string",
        "currentAllocation": number,
        "recommendedAllocation": number,
        "change": number,
        "justification": "string"
      }
    ],
    "totalBudget": number,
    "expectedROI": number
  },
  "efficiency": {
    "currentScore": 0-100,
    "projectedScore": 0-100,
    "improvement": number
  },
  "bottlenecks": [
    {
      "area": "string",
      "severity": "high" | "medium" | "low",
      "impact": "string",
      "resolution": "string"
    }
  ],
  "scenarios": [
    {
      "name": "string",
      "allocation": Record<string, number>,
      "expectedOutcome": number
    }
  ],
  "constraints": ["string"],
  "timeline": "string"
}`;
        userPrompt = `Optimiza la asignación de recursos: ${JSON.stringify(context)}
Recursos disponibles: ${JSON.stringify(params?.resources)}
Objetivos: ${JSON.stringify(params?.objectives)}`;
        break;

      case 'risk_assessment':
        systemPrompt = `Eres un sistema avanzado de evaluación y gestión de riesgos empresariales.

CAPACIDADES:
- Identificación proactiva de riesgos
- Cuantificación de impacto y probabilidad
- Estrategias de mitigación
- Monitoreo de indicadores de alerta

RESPUESTA JSON:
{
  "riskProfile": {
    "overallScore": 0-100,
    "category": "low" | "medium" | "high" | "critical",
    "trend": "improving" | "stable" | "deteriorating"
  },
  "risks": [
    {
      "id": "string",
      "name": "string",
      "category": "operational" | "financial" | "strategic" | "compliance" | "reputational",
      "probability": 0-100,
      "impact": 0-100,
      "riskScore": 0-100,
      "description": "string",
      "triggers": ["string"],
      "mitigations": [
        {
          "action": "string",
          "effectiveness": 0-100,
          "cost": number,
          "timeline": "string"
        }
      ],
      "owner": "string",
      "status": "identified" | "mitigating" | "accepted" | "transferred"
    }
  ],
  "earlyWarnings": [
    {
      "indicator": "string",
      "threshold": number,
      "currentValue": number,
      "status": "normal" | "warning" | "critical"
    }
  ],
  "recommendations": ["string"],
  "contingencyPlans": ["string"]
}`;
        userPrompt = `Evalúa riesgos para: ${JSON.stringify(context)}
Área de enfoque: ${JSON.stringify(params?.focusArea)}
Horizonte temporal: ${timeHorizon || '12 meses'}`;
        break;

      case 'market_forecast':
        systemPrompt = `Eres un sistema de pronóstico de mercado con capacidades predictivas avanzadas.

CAPACIDADES:
- Análisis de tendencias de mercado
- Predicción de demanda
- Análisis competitivo predictivo
- Identificación de oportunidades

RESPUESTA JSON:
{
  "forecast": {
    "market": "string",
    "period": "string",
    "currentSize": number,
    "projectedSize": number,
    "growthRate": number,
    "confidence": 0-100
  },
  "trends": [
    {
      "name": "string",
      "direction": "up" | "down" | "stable",
      "strength": 0-100,
      "impact": "string",
      "timeline": "string"
    }
  ],
  "segments": [
    {
      "name": "string",
      "currentShare": number,
      "projectedShare": number,
      "growth": number,
      "opportunity": "high" | "medium" | "low"
    }
  ],
  "competitors": [
    {
      "name": "string",
      "currentPosition": number,
      "projectedPosition": number,
      "threat": "high" | "medium" | "low",
      "strategy": "string"
    }
  ],
  "opportunities": ["string"],
  "threats": ["string"],
  "recommendations": ["string"]
}`;
        userPrompt = `Pronostica el mercado: ${JSON.stringify(context)}
Segmentos de interés: ${JSON.stringify(params?.segments)}
Horizonte: ${timeHorizon || '24 meses'}`;
        break;

      case 'customer_lifecycle':
        systemPrompt = `Eres un motor predictivo de ciclo de vida del cliente con IA avanzada.

CAPACIDADES:
- Predicción de comportamiento del cliente
- Análisis de valor de vida del cliente (CLV)
- Predicción de churn
- Segmentación predictiva

RESPUESTA JSON:
{
  "lifecycle": {
    "stage": "acquisition" | "activation" | "retention" | "revenue" | "referral" | "at_risk" | "churned",
    "healthScore": 0-100,
    "trend": "improving" | "stable" | "declining"
  },
  "predictions": {
    "churnProbability": 0-100,
    "churnTimeframe": "string",
    "upsellProbability": 0-100,
    "lifetimeValue": number,
    "nextPurchase": {
      "probability": 0-100,
      "timeframe": "string",
      "expectedValue": number
    }
  },
  "segments": [
    {
      "name": "string",
      "size": number,
      "characteristics": ["string"],
      "avgLifetimeValue": number,
      "churnRate": number
    }
  ],
  "interventions": [
    {
      "trigger": "string",
      "action": "string",
      "expectedImpact": number,
      "priority": "high" | "medium" | "low",
      "timing": "string"
    }
  ],
  "riskIndicators": ["string"],
  "opportunities": ["string"]
}`;
        userPrompt = `Analiza ciclo de vida del cliente: ${JSON.stringify(context)}
Datos del cliente: ${JSON.stringify(params?.customerData)}
Historial: ${JSON.stringify(params?.history)}`;
        break;

      case 'what_if_simulation':
        systemPrompt = `Eres un motor de simulación what-if para análisis de escenarios empresariales.

CAPACIDADES:
- Simulación de cambios en variables
- Análisis de sensibilidad
- Modelado de impacto en cascada
- Comparación de resultados

RESPUESTA JSON:
{
  "simulation": {
    "id": "string",
    "name": "string",
    "baselineValue": number,
    "simulatedValue": number,
    "change": number,
    "changePercent": number
  },
  "variables": [
    {
      "name": "string",
      "baseValue": number,
      "modifiedValue": number,
      "sensitivity": 0-100,
      "elasticity": number
    }
  ],
  "impacts": [
    {
      "metric": "string",
      "baseline": number,
      "simulated": number,
      "change": number,
      "direction": "positive" | "negative" | "neutral"
    }
  ],
  "cascadeEffects": [
    {
      "from": "string",
      "to": "string",
      "effect": "string",
      "magnitude": number,
      "delay": "string"
    }
  ],
  "confidence": 0-100,
  "assumptions": ["string"],
  "limitations": ["string"],
  "recommendations": ["string"]
}`;
        userPrompt = `Simula escenario what-if: ${JSON.stringify(context)}
Variables a modificar: ${JSON.stringify(params?.variables)}
Métricas a evaluar: ${JSON.stringify(params?.metrics)}`;
        break;

      case 'strategic_planning':
        systemPrompt = `Eres un asistente estratégico de planificación empresarial con visión a largo plazo.

CAPACIDADES:
- Análisis estratégico FODA predictivo
- Definición de objetivos estratégicos
- Roadmap de implementación
- KPIs y métricas de éxito

RESPUESTA JSON:
{
  "strategicPlan": {
    "vision": "string",
    "mission": "string",
    "horizon": "string",
    "overallConfidence": 0-100
  },
  "swot": {
    "strengths": [{ "item": "string", "leverage": "string" }],
    "weaknesses": [{ "item": "string", "mitigation": "string" }],
    "opportunities": [{ "item": "string", "capture": "string" }],
    "threats": [{ "item": "string", "defense": "string" }]
  },
  "objectives": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "growth" | "efficiency" | "innovation" | "sustainability",
      "target": number,
      "unit": "string",
      "timeline": "string",
      "priority": "critical" | "high" | "medium" | "low"
    }
  ],
  "initiatives": [
    {
      "name": "string",
      "objective": "string",
      "description": "string",
      "investment": number,
      "expectedROI": number,
      "timeline": "string",
      "milestones": ["string"],
      "risks": ["string"]
    }
  ],
  "roadmap": [
    {
      "phase": "string",
      "timeframe": "string",
      "focus": ["string"],
      "deliverables": ["string"],
      "resources": number
    }
  ],
  "kpis": [
    {
      "name": "string",
      "target": number,
      "current": number,
      "frequency": "string"
    }
  ]
}`;
        userPrompt = `Desarrolla plan estratégico: ${JSON.stringify(context)}
Horizonte: ${timeHorizon || '3 años'}
Prioridades: ${JSON.stringify(params?.priorities)}`;
        break;

      case 'kpi_prediction':
        systemPrompt = `Eres un motor de predicción de KPIs empresariales con modelado avanzado.

CAPACIDADES:
- Predicción de KPIs clave
- Análisis de tendencias
- Identificación de drivers
- Alertas predictivas

RESPUESTA JSON:
{
  "predictions": [
    {
      "kpi": "string",
      "currentValue": number,
      "predictedValue": number,
      "change": number,
      "changePercent": number,
      "trend": "up" | "down" | "stable",
      "confidence": 0-100,
      "timeframe": "string",
      "range": { "low": number, "high": number }
    }
  ],
  "drivers": [
    {
      "kpi": "string",
      "driver": "string",
      "impact": number,
      "direction": "positive" | "negative",
      "controllable": boolean
    }
  ],
  "alerts": [
    {
      "kpi": "string",
      "type": "warning" | "critical" | "opportunity",
      "message": "string",
      "threshold": number,
      "predictedValue": number,
      "timeToEvent": "string"
    }
  ],
  "correlations": [
    {
      "kpi1": "string",
      "kpi2": "string",
      "correlation": number,
      "lag": "string"
    }
  ],
  "recommendations": ["string"],
  "modelAccuracy": 0-100
}`;
        userPrompt = `Predice KPIs: ${JSON.stringify(context)}
KPIs a predecir: ${JSON.stringify(params?.kpis)}
Horizonte: ${timeHorizon || '90 días'}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[predictive-intelligence] Processing: ${action}`);

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
      console.error('[predictive-intelligence] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[predictive-intelligence] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[predictive-intelligence] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
