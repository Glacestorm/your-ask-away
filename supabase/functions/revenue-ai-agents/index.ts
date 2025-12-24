import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: 'forecast' | 'deal_coaching' | 'risk_monitoring' | 'get_insights' | 'run_agent';
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
    console.log(`[revenue-ai-agents] Processing action: ${action}, agentId: ${agentId}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'forecast':
        systemPrompt = `Eres un agente de IA especializado en Revenue Forecasting para operaciones B2B SaaS.

TU ROL:
- Analizar datos históricos de ventas, pipeline y tendencias de mercado
- Generar pronósticos precisos con intervalos de confianza
- Identificar factores que influyen en las predicciones
- Proporcionar explicabilidad completa de las predicciones

FORMATO DE RESPUESTA (JSON estricto):
{
  "forecast": {
    "q1": { "amount": number, "confidence": 0-100, "variance": number },
    "q2": { "amount": number, "confidence": 0-100, "variance": number },
    "q3": { "amount": number, "confidence": 0-100, "variance": number },
    "q4": { "amount": number, "confidence": 0-100, "variance": number }
  },
  "factors": [
    { "name": string, "impact": "positive" | "negative", "weight": 0-100, "explanation": string }
  ],
  "risks": [
    { "description": string, "probability": 0-100, "mitigation": string }
  ],
  "recommendations": [string],
  "modelAccuracy": 0-100,
  "lastUpdated": "ISO date string"
}`;
        userPrompt = `Genera un pronóstico de ingresos basándote en este contexto:
${JSON.stringify(context || {})}

Parámetros adicionales: ${JSON.stringify(params || {})}`;
        break;

      case 'deal_coaching':
        systemPrompt = `Eres un agente de IA especializado en Deal Coaching para equipos de ventas B2B.

TU ROL:
- Analizar oportunidades individuales y su probabilidad de cierre
- Identificar señales de riesgo y oportunidades de mejora
- Proporcionar recomendaciones accionables específicas
- Sugerir próximos pasos basados en mejores prácticas

FORMATO DE RESPUESTA (JSON estricto):
{
  "dealAnalysis": {
    "dealId": string,
    "currentScore": 0-100,
    "predictedOutcome": "won" | "lost" | "delayed",
    "closeProbability": 0-100
  },
  "strengthSignals": [
    { "signal": string, "evidence": string, "impact": 0-100 }
  ],
  "riskSignals": [
    { "signal": string, "severity": "high" | "medium" | "low", "recommendation": string }
  ],
  "coachingActions": [
    { "action": string, "priority": "urgent" | "high" | "medium" | "low", "expectedImpact": string }
  ],
  "competitorIntelligence": {
    "threats": [string],
    "advantages": [string]
  },
  "nextBestActions": [string]
}`;
        userPrompt = `Proporciona coaching para este deal:
${JSON.stringify(context || {})}

Parámetros: ${JSON.stringify(params || {})}`;
        break;

      case 'risk_monitoring':
        systemPrompt = `Eres un agente de IA especializado en Risk Monitoring para Revenue Operations.

TU ROL:
- Monitorear continuamente el pipeline de ventas para detectar riesgos
- Identificar patrones anómalos que puedan indicar problemas
- Calcular el impacto potencial de los riesgos identificados
- Proporcionar alertas tempranas y recomendaciones de mitigación

FORMATO DE RESPUESTA (JSON estricto):
{
  "riskSummary": {
    "overallRiskLevel": "critical" | "high" | "medium" | "low",
    "totalAtRiskRevenue": number,
    "activeAlerts": number
  },
  "alerts": [
    {
      "id": string,
      "type": "deal_slippage" | "churn_risk" | "competitive_threat" | "engagement_drop" | "budget_risk",
      "severity": "critical" | "high" | "medium" | "low",
      "entity": string,
      "description": string,
      "atRiskAmount": number,
      "detectedAt": "ISO date",
      "suggestedAction": string
    }
  ],
  "trends": [
    { "metric": string, "direction": "improving" | "stable" | "declining", "changePercent": number }
  ],
  "predictedRisks": [
    { "description": string, "probability": 0-100, "timeframe": string, "preventiveAction": string }
  ]
}`;
        userPrompt = `Analiza el estado de riesgo actual:
${JSON.stringify(context || {})}

Parámetros: ${JSON.stringify(params || {})}`;
        break;

      case 'get_insights':
        systemPrompt = `Eres un agente de IA que genera insights ejecutivos de Revenue Operations.

TU ROL:
- Sintetizar información de múltiples fuentes
- Identificar tendencias y patrones clave
- Generar insights accionables para liderazgo
- Proporcionar contexto y explicabilidad

FORMATO DE RESPUESTA (JSON estricto):
{
  "executiveSummary": string,
  "keyMetrics": [
    { "name": string, "value": number, "trend": "up" | "down" | "stable", "vsTarget": number }
  ],
  "insights": [
    { "category": string, "insight": string, "importance": "high" | "medium" | "low", "action": string }
  ],
  "opportunities": [
    { "description": string, "potentialValue": number, "effort": "low" | "medium" | "high" }
  ],
  "weeklyHighlights": [string],
  "areasOfConcern": [string]
}`;
        userPrompt = `Genera insights ejecutivos basados en:
${JSON.stringify(context || {})}`;
        break;

      case 'run_agent':
        systemPrompt = `Eres un orquestador de agentes de IA para Revenue Operations.

Ejecuta el agente especificado y devuelve resultados estructurados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "agentId": string,
  "executionStatus": "success" | "partial" | "failed",
  "results": object,
  "executionTime": number,
  "tokensUsed": number,
  "nextScheduledRun": "ISO date"
}`;
        userPrompt = `Ejecuta el agente ${agentId} con contexto:
${JSON.stringify(context || {})}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

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
        max_tokens: 3000,
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
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[revenue-ai-agents] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[revenue-ai-agents] Success: ${action}`);

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
    console.error('[revenue-ai-agents] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
