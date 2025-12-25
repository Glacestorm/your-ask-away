import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskRequest {
  action: 'assess_risk' | 'predict_risk' | 'get_mitigation' | 'analyze_portfolio' | 'stress_test';
  context?: {
    entityType?: string;
    entityData?: Record<string, unknown>;
    riskCategories?: string[];
    scenario?: string;
  };
  entityId?: string;
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

    const { action, context, entityId } = await req.json() as RiskRequest;
    console.log(`[risk-assessment-ia] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'assess_risk':
        systemPrompt = `Eres un experto en evaluación de riesgos empresariales.

EVALÚA el riesgo de la entidad proporcionada.

RESPONDE EN JSON ESTRICTO:
{
  "overallRiskScore": number,
  "riskLevel": "critical" | "high" | "medium" | "low",
  "riskBreakdown": [
    {
      "category": string,
      "score": number,
      "factors": string[],
      "trend": "increasing" | "stable" | "decreasing"
    }
  ],
  "keyRiskIndicators": [
    { "indicator": string, "value": number, "threshold": number, "status": string }
  ],
  "immediateActions": string[],
  "monitoringRecommendations": string[]
}`;
        userPrompt = `Evalúa riesgo para ${context?.entityType}: ${entityId}
Datos: ${JSON.stringify(context?.entityData || {})}
Categorías de riesgo: ${context?.riskCategories?.join(', ')}`;
        break;

      case 'predict_risk':
        systemPrompt = `Eres un sistema predictivo de riesgos.

PREDICE la evolución del riesgo.

RESPONDE EN JSON ESTRICTO:
{
  "currentRisk": number,
  "predictedRisk30Days": number,
  "predictedRisk90Days": number,
  "confidenceLevel": number,
  "riskDrivers": [{ "factor": string, "impact": number, "direction": string }],
  "earlyWarningSignals": string[],
  "scenarioAnalysis": [
    { "scenario": string, "probability": number, "riskImpact": number }
  ]
}`;
        userPrompt = `Predice riesgo futuro para: ${entityId}`;
        break;

      case 'get_mitigation':
        systemPrompt = `Eres un especialista en mitigación de riesgos.

GENERA un plan de mitigación de riesgos.

RESPONDE EN JSON ESTRICTO:
{
  "mitigationStrategies": [
    {
      "riskArea": string,
      "strategy": string,
      "actions": string[],
      "expectedReduction": number,
      "timeline": string,
      "resources": string[],
      "cost": string
    }
  ],
  "priorityMatrix": [{ "action": string, "impact": string, "urgency": string }],
  "contingencyPlans": string[],
  "kpisToMonitor": string[]
}`;
        userPrompt = `Genera plan de mitigación para riesgos: ${context?.riskCategories?.join(', ')}`;
        break;

      case 'analyze_portfolio':
        systemPrompt = `Eres un analista de riesgo de portafolio.

ANALIZA el riesgo agregado del portafolio.

RESPONDE EN JSON ESTRICTO:
{
  "portfolioRiskScore": number,
  "diversificationScore": number,
  "concentrationRisks": [{ "dimension": string, "concentration": number, "risk": string }],
  "correlations": [{ "pair": string, "correlation": number }],
  "valueAtRisk": { "var95": number, "var99": number },
  "recommendations": string[]
}`;
        userPrompt = `Analiza riesgo del portafolio`;
        break;

      case 'stress_test':
        systemPrompt = `Eres un experto en stress testing financiero.

EJECUTA un análisis de estrés.

RESPONDE EN JSON ESTRICTO:
{
  "scenario": string,
  "baselineMetrics": object,
  "stressedMetrics": object,
  "impact": {
    "revenue": number,
    "margin": number,
    "cashFlow": number,
    "riskScore": number
  },
  "breakingPoints": string[],
  "resilience": "high" | "medium" | "low",
  "recommendations": string[]
}`;
        userPrompt = `Ejecuta stress test con escenario: ${context?.scenario}`;
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
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[risk-assessment-ia] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[risk-assessment-ia] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
