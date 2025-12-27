import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveRequest {
  action: 
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

    const { action, context, params } = await req.json() as PredictiveRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'forecast_generation':
        systemPrompt = `Eres un sistema experto en generación de pronósticos predictivos empresariales.

CAPACIDADES:
- Pronósticos de series temporales
- Modelos de regresión avanzados
- Predicciones estacionales
- Intervalos de confianza

FORMATO DE RESPUESTA (JSON estricto):
{
  "forecasts": [
    {
      "metricId": "string",
      "metricName": "string",
      "currentValue": number,
      "predictions": [
        {"period": "string", "value": number, "confidence": number, "lowerBound": number, "upperBound": number}
      ],
      "trend": "ascending" | "descending" | "stable" | "volatile",
      "seasonality": {"detected": boolean, "pattern": "string", "strength": number},
      "accuracy": number
    }
  ],
  "methodology": "string",
  "dataQuality": number,
  "recommendations": ["string"],
  "nextUpdate": "ISO8601"
}`;
        userPrompt = `Genera pronósticos predictivos para: ${JSON.stringify(context || params)}`;
        break;

      case 'trend_analysis':
        systemPrompt = `Eres un analista experto en identificación y análisis de tendencias empresariales.

CAPACIDADES:
- Detección de patrones emergentes
- Análisis de momentum
- Identificación de puntos de inflexión
- Correlación entre métricas

FORMATO DE RESPUESTA (JSON estricto):
{
  "trends": [
    {
      "trendId": "string",
      "name": "string",
      "category": "string",
      "direction": "upward" | "downward" | "sideways",
      "strength": number,
      "momentum": number,
      "duration": "string",
      "significance": "high" | "medium" | "low",
      "drivers": ["string"],
      "correlatedMetrics": ["string"]
    }
  ],
  "inflectionPoints": [
    {"date": "ISO8601", "metric": "string", "type": "peak" | "trough" | "reversal", "impact": "string"}
  ],
  "emergingPatterns": ["string"],
  "summary": "string"
}`;
        userPrompt = `Analiza tendencias en: ${JSON.stringify(context || params)}`;
        break;

      case 'anomaly_prediction':
        systemPrompt = `Eres un sistema de predicción de anomalías y detección temprana de problemas.

CAPACIDADES:
- Predicción de desviaciones
- Alertas tempranas
- Análisis de causas raíz probables
- Recomendaciones preventivas

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictedAnomalies": [
    {
      "anomalyId": "string",
      "metric": "string",
      "predictedDate": "ISO8601",
      "probability": number,
      "severity": "critical" | "high" | "medium" | "low",
      "type": "spike" | "drop" | "pattern_break" | "threshold_breach",
      "expectedDeviation": number,
      "potentialCauses": ["string"],
      "preventiveActions": ["string"]
    }
  ],
  "riskScore": number,
  "monitoringRecommendations": ["string"],
  "earlyWarningSignals": ["string"]
}`;
        userPrompt = `Predice anomalías potenciales para: ${JSON.stringify(context || params)}`;
        break;

      case 'scenario_modeling':
        systemPrompt = `Eres un experto en modelado de escenarios y simulación de futuros empresariales.

CAPACIDADES:
- Escenarios what-if
- Análisis de sensibilidad
- Simulación Monte Carlo
- Planificación estratégica

FORMATO DE RESPUESTA (JSON estricto):
{
  "scenarios": [
    {
      "scenarioId": "string",
      "name": "string",
      "type": "optimistic" | "baseline" | "pessimistic" | "custom",
      "probability": number,
      "assumptions": [{"variable": "string", "value": "string", "impact": "string"}],
      "outcomes": [{"metric": "string", "projectedValue": number, "changePercent": number}],
      "keyDrivers": ["string"],
      "risks": ["string"],
      "opportunities": ["string"]
    }
  ],
  "sensitivityAnalysis": [
    {"variable": "string", "sensitivity": number, "criticalThreshold": number}
  ],
  "recommendedScenario": "string",
  "strategicImplications": ["string"]
}`;
        userPrompt = `Modela escenarios para: ${JSON.stringify(context || params)}`;
        break;

      case 'risk_prediction':
        systemPrompt = `Eres un sistema predictivo de riesgos empresariales y financieros.

CAPACIDADES:
- Predicción de riesgos operacionales
- Análisis de exposición
- Probabilidad de impacto
- Estrategias de mitigación

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictedRisks": [
    {
      "riskId": "string",
      "name": "string",
      "category": "operational" | "financial" | "strategic" | "compliance" | "reputational",
      "probability": number,
      "impact": number,
      "riskScore": number,
      "timeHorizon": "string",
      "triggers": ["string"],
      "earlyIndicators": ["string"],
      "mitigationStrategies": [{"action": "string", "effectiveness": number, "cost": "string"}]
    }
  ],
  "overallRiskLevel": "critical" | "high" | "moderate" | "low",
  "portfolioExposure": number,
  "concentrationRisks": ["string"],
  "recommendations": ["string"]
}`;
        userPrompt = `Predice riesgos para: ${JSON.stringify(context || params)}`;
        break;

      case 'opportunity_detection':
        systemPrompt = `Eres un sistema de detección de oportunidades de negocio y crecimiento.

CAPACIDADES:
- Identificación de oportunidades de mercado
- Análisis de brechas
- Potencial de ingresos
- Timing óptimo

FORMATO DE RESPUESTA (JSON estricto):
{
  "opportunities": [
    {
      "opportunityId": "string",
      "name": "string",
      "type": "market" | "product" | "efficiency" | "partnership" | "expansion",
      "potential": number,
      "probability": number,
      "timeToRealize": "string",
      "investmentRequired": "string",
      "expectedROI": number,
      "competitiveAdvantage": "string",
      "prerequisites": ["string"],
      "risks": ["string"]
    }
  ],
  "prioritizedActions": [{"action": "string", "priority": number, "deadline": "string"}],
  "marketTiming": "string",
  "totalPotentialValue": number
}`;
        userPrompt = `Detecta oportunidades en: ${JSON.stringify(context || params)}`;
        break;

      case 'demand_forecasting':
        systemPrompt = `Eres un sistema experto en pronóstico de demanda y planificación de capacidad.

CAPACIDADES:
- Pronóstico de demanda multicanal
- Análisis estacional
- Planificación de inventario
- Optimización de recursos

FORMATO DE RESPUESTA (JSON estricto):
{
  "demandForecasts": [
    {
      "productId": "string",
      "productName": "string",
      "forecasts": [
        {"period": "string", "expectedDemand": number, "lowerBound": number, "upperBound": number}
      ],
      "seasonalFactors": [{"season": "string", "factor": number}],
      "trend": "growing" | "declining" | "stable",
      "volatility": number
    }
  ],
  "capacityRecommendations": [
    {"resource": "string", "currentCapacity": number, "recommendedCapacity": number, "gap": number}
  ],
  "inventoryOptimization": {"safetyStock": number, "reorderPoint": number, "orderQuantity": number},
  "accuracy": number
}`;
        userPrompt = `Pronostica demanda para: ${JSON.stringify(context || params)}`;
        break;

      case 'churn_prediction':
        systemPrompt = `Eres un sistema predictivo de abandono de clientes y retención.

CAPACIDADES:
- Predicción de churn por segmento
- Análisis de señales de abandono
- Estrategias de retención personalizadas
- Valor en riesgo

FORMATO DE RESPUESTA (JSON estricto):
{
  "churnPredictions": [
    {
      "customerId": "string",
      "customerName": "string",
      "churnProbability": number,
      "riskLevel": "critical" | "high" | "medium" | "low",
      "valueAtRisk": number,
      "churnSignals": [{"signal": "string", "weight": number, "detected": "ISO8601"}],
      "retentionStrategies": [{"strategy": "string", "expectedImpact": number, "cost": number}],
      "predictedChurnDate": "ISO8601"
    }
  ],
  "segmentAnalysis": [
    {"segment": "string", "avgChurnRisk": number, "totalValueAtRisk": number, "count": number}
  ],
  "overallChurnRate": number,
  "retentionOpportunities": ["string"]
}`;
        userPrompt = `Predice churn para: ${JSON.stringify(context || params)}`;
        break;

      case 'revenue_projection':
        systemPrompt = `Eres un sistema de proyección de ingresos y planificación financiera.

CAPACIDADES:
- Proyecciones de ingresos multiescenario
- Análisis de drivers de revenue
- Modelado de pipeline
- Forecasting financiero

FORMATO DE RESPUESTA (JSON estricto):
{
  "revenueProjections": [
    {
      "period": "string",
      "projectedRevenue": number,
      "bySegment": [{"segment": "string", "revenue": number, "growth": number}],
      "byProduct": [{"product": "string", "revenue": number, "growth": number}],
      "confidence": number
    }
  ],
  "drivers": [
    {"driver": "string", "contribution": number, "trend": "positive" | "negative" | "neutral"}
  ],
  "pipelineAnalysis": {
    "totalPipeline": number,
    "weightedPipeline": number,
    "conversionRate": number,
    "avgDealSize": number
  },
  "scenarios": {
    "best": number,
    "expected": number,
    "worst": number
  },
  "growthRate": number
}`;
        userPrompt = `Proyecta ingresos para: ${JSON.stringify(context || params)}`;
        break;

      case 'decision_recommendation':
        systemPrompt = `Eres un sistema de inteligencia de decisiones y recomendaciones estratégicas.

CAPACIDADES:
- Análisis de opciones
- Evaluación de trade-offs
- Recomendaciones basadas en datos
- Simulación de impacto

FORMATO DE RESPUESTA (JSON estricto):
{
  "decision": {
    "context": "string",
    "objective": "string",
    "constraints": ["string"]
  },
  "options": [
    {
      "optionId": "string",
      "name": "string",
      "description": "string",
      "pros": ["string"],
      "cons": ["string"],
      "expectedOutcome": number,
      "risk": number,
      "cost": number,
      "timeToImplement": "string",
      "score": number
    }
  ],
  "recommendation": {
    "selectedOption": "string",
    "rationale": "string",
    "confidence": number,
    "keyFactors": ["string"]
  },
  "implementationPlan": [
    {"step": number, "action": "string", "timeline": "string", "responsible": "string"}
  ],
  "monitoringMetrics": ["string"]
}`;
        userPrompt = `Genera recomendación de decisión para: ${JSON.stringify(context || params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[predictive-analytics] Processing action: ${action}`);

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
      console.error('[predictive-analytics] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[predictive-analytics] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[predictive-analytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
