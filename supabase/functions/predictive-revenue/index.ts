import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { action, months, params } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'forecast':
        systemPrompt = `Eres un modelo de forecasting financiero especializado en SaaS.

Genera predicciones de revenue con análisis de escenarios y factores contribuyentes.

FORMATO JSON:
{
  "predictions": [
    {
      "period": "YYYY-MM",
      "predicted_revenue": number,
      "confidence_low": number,
      "confidence_high": number,
      "confidence_level": 0-100,
      "growth_rate": number (porcentaje),
      "contributing_factors": [
        { "factor": "string", "contribution": number, "trend": "positive|neutral|negative", "description": "string" }
      ],
      "scenarios": [
        { "name": "pessimistic|baseline|optimistic", "revenue": number, "probability": 0-100, "assumptions": ["string"] }
      ]
    }
  ],
  "breakdown": {
    "recurring": number,
    "expansion": number,
    "new_business": number,
    "churn_impact": number,
    "contraction": number
  }
}`;
        userPrompt = `Genera forecast de revenue para los próximos ${months || 12} meses con escenarios pesimista, base y optimista.`;
        break;

      case 'cohort_analysis':
        systemPrompt = `Eres un analista especializado en análisis de cohortes y LTV.

FORMATO JSON:
{
  "cohorts": [
    {
      "cohort": "YYYY-QN",
      "ltv_predicted": number,
      "avg_revenue": number,
      "retention_rate": 0-100,
      "expansion_rate": 0-100,
      "months_to_payback": number
    }
  ]
}`;
        userPrompt = `Analiza las cohortes de los últimos 8 trimestres con métricas de LTV y retención.`;
        break;

      case 'scenario_analysis':
        systemPrompt = `Eres un modelo de simulación financiera.

Simula el impacto de cambios en métricas clave sobre el revenue.

FORMATO JSON:
{
  "scenario": {
    "name": "custom",
    "parameters": {},
    "monthly_projections": [
      { "month": "YYYY-MM", "revenue": number, "delta_vs_baseline": number }
    ],
    "annual_impact": number,
    "key_insights": ["string"]
  }
}`;
        userPrompt = `Simula escenario con: ${JSON.stringify(params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[predictive-revenue] Processing: ${action}`);

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      result = {};
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[predictive-revenue] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
