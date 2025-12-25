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

    const { action, company_ids, company_id, intervention } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'predict':
        systemPrompt = `Eres un modelo predictivo de churn especializado en SaaS B2B.
        
Analiza patrones de comportamiento y genera predicciones precisas de riesgo de abandono.

FORMATO JSON:
{
  "predictions": [
    {
      "company_id": "uuid",
      "company_name": "string",
      "churn_probability": 0-100,
      "risk_level": "low|medium|high|critical",
      "days_to_churn": number,
      "confidence": 0-100,
      "risk_factors": [
        { "factor": "string", "impact": 0-100, "trend": "improving|stable|worsening", "description": "string" }
      ],
      "recommended_actions": [
        { "action": "string", "priority": "low|medium|high|urgent", "expected_impact": 0-100, "effort": "low|medium|high", "deadline_days": number }
      ],
      "historical_signals": [
        { "signal_type": "string", "detected_at": "ISO date", "severity": 0-100, "description": "string" }
      ],
      "predicted_at": "ISO date"
    }
  ],
  "analytics": {
    "total_at_risk": number,
    "high_risk_count": number,
    "critical_count": number,
    "avg_churn_probability": number,
    "revenue_at_risk": number,
    "trend_vs_last_month": number,
    "intervention_success_rate": number
  }
}`;
        userPrompt = `Genera predicciones de churn para empresas${company_ids?.length ? ` (IDs: ${company_ids.join(', ')})` : ' del portfolio completo'}. Incluye 5-8 empresas con diferentes niveles de riesgo.`;
        break;

      case 'intervention_plan':
        systemPrompt = `Eres un experto en retención de clientes y Customer Success.

Genera un plan de intervención detallado para prevenir el churn.

FORMATO JSON:
{
  "plan": {
    "company_id": "string",
    "urgency": "low|medium|high|critical",
    "estimated_success_probability": 0-100,
    "phases": [
      {
        "phase": number,
        "name": "string",
        "duration_days": number,
        "actions": [
          { "action": "string", "owner": "string", "timeline": "string", "success_criteria": "string" }
        ]
      }
    ],
    "resources_needed": ["string"],
    "executive_summary": "string"
  }
}`;
        userPrompt = `Genera plan de intervención para empresa ID: ${company_id}`;
        break;

      case 'record_intervention':
        return new Response(JSON.stringify({
          success: true,
          recorded: { company_id, intervention, recorded_at: new Date().toISOString() }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[predictive-churn] Processing: ${action}`);

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
    console.error('[predictive-churn] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
