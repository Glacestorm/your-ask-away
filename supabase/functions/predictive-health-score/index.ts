/**
 * Predictive Health Score Edge Function
 * Fase 11 - Enterprise SaaS 2025-2026
 * Health Score predictivo con ML para Customer Success
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_health_dashboard' | 'recalculate_score' | 'run_churn_prediction' | 'generate_playbook' | 'dismiss_insight';
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

    const { action, context, params } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_health_dashboard':
        systemPrompt = `Eres un sistema de Health Score predictivo para Customer Success enterprise.
        
CONTEXTO DEL ROL:
- Calcular health scores multidimensionales
- Predecir churn y oportunidades de expansión
- Generar insights y playbooks de intervención

FORMATO DE RESPUESTA (JSON estricto):
{
  "scores": [
    {
      "id": "uuid",
      "customerId": "customer_id",
      "customerName": "Acme Corp",
      "currentScore": 78,
      "previousScore": 75,
      "trend": "improving",
      "riskLevel": "medium",
      "components": {
        "usage": 82,
        "engagement": 75,
        "satisfaction": 80,
        "support": 70,
        "financial": 85
      },
      "predictedChurn": 12,
      "predictedExpansion": 35,
      "lastUpdated": "ISO date"
    }
  ],
  "insights": [
    {
      "id": "uuid",
      "customerId": "customer_id",
      "insightType": "risk",
      "title": "Declining Usage Pattern",
      "description": "Usage dropped 25% in last 30 days",
      "impact": "high",
      "suggestedAction": "Schedule health check call",
      "deadline": "ISO date",
      "createdAt": "ISO date"
    }
  ],
  "trends": [
    {
      "date": "2025-01-01",
      "averageScore": 76,
      "atRiskCount": 5,
      "healthyCount": 45,
      "improvingCount": 12,
      "decliningCount": 3
    }
  ],
  "summary": {
    "averageScore": 78,
    "atRiskCount": 5,
    "healthyCount": 45,
    "churnPrediction": 8.5
  }
}`;

        userPrompt = context 
          ? `Genera dashboard de health score para: ${JSON.stringify(context)}`
          : 'Genera un dashboard de health score predictivo completo';
        break;

      case 'recalculate_score':
        systemPrompt = `Recalcula el health score de un cliente.

FORMATO DE RESPUESTA (JSON estricto):
{
  "score": {
    "id": "uuid",
    "customerId": "customer_id",
    "customerName": "Customer Name",
    "currentScore": 75,
    "previousScore": 72,
    "trend": "improving",
    "riskLevel": "medium",
    "components": {...},
    "predictedChurn": 15,
    "predictedExpansion": 25,
    "lastUpdated": "ISO date"
  }
}`;

        userPrompt = `Recalcula score para cliente: ${JSON.stringify(params)}`;
        break;

      case 'run_churn_prediction':
        systemPrompt = `Ejecuta modelo predictivo de churn.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "customerId": "id",
      "churnProbability": 25,
      "riskFactors": ["Low usage", "Support tickets"],
      "recommendedActions": ["Outreach", "Training"]
    }
  ],
  "aggregateRisk": 12.5
}`;

        userPrompt = `Ejecuta predicción de churn: ${JSON.stringify(params)}`;
        break;

      case 'generate_playbook':
        systemPrompt = `Genera playbook de intervención personalizado.

FORMATO DE RESPUESTA (JSON estricto):
{
  "playbook": {
    "id": "uuid",
    "customerId": "customer_id",
    "title": "Retention Playbook",
    "riskLevel": "high",
    "steps": [
      {"order": 1, "action": "Schedule call", "owner": "CSM", "timeline": "24h"},
      {"order": 2, "action": "Review account", "owner": "CSM", "timeline": "48h"}
    ],
    "expectedOutcome": "Reduce churn risk by 40%",
    "createdAt": "ISO date"
  }
}`;

        userPrompt = `Genera playbook para cliente: ${JSON.stringify(params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[predictive-health-score] Processing action: ${action}`);

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
      console.error('[predictive-health-score] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[predictive-health-score] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[predictive-health-score] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
