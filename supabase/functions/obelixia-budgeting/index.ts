import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetingRequest {
  action: 'get_budgets' | 'create_budget' | 'analyze_variance' | 'forecast_scenario' | 'optimize_allocation';
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

    const { action, context, params } = await req.json() as BudgetingRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_budgets':
        systemPrompt = `Eres un experto en planificación presupuestaria y control de gestión.

FORMATO DE RESPUESTA (JSON estricto):
{
  "budgets": [
    {
      "id": "string",
      "name": "string",
      "type": "operational" | "capital" | "project" | "departmental" | "consolidated",
      "period": "string",
      "status": "draft" | "approved" | "active" | "closed",
      "totalBudget": number,
      "consumed": number,
      "remaining": number,
      "variance": number,
      "variancePercentage": number,
      "categories": [],
      "lastUpdated": "ISO date"
    }
  ],
  "summary": {
    "totalBudgeted": number,
    "totalConsumed": number,
    "overallVariance": number,
    "healthScore": 0-100
  },
  "alerts": []
}`;
        userPrompt = context 
          ? `Obtén presupuestos para: ${JSON.stringify(context)}`
          : 'Lista todos los presupuestos activos';
        break;

      case 'create_budget':
        systemPrompt = `Eres un planificador presupuestario experto con IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "budget": {
    "id": "string",
    "name": "string",
    "type": "string",
    "period": { "start": "ISO date", "end": "ISO date" },
    "categories": [
      {
        "id": "string",
        "name": "string",
        "amount": number,
        "percentage": number,
        "subcategories": []
      }
    ],
    "totalAmount": number,
    "assumptions": ["string"],
    "risks": ["string"],
    "approvalWorkflow": []
  },
  "aiSuggestions": {
    "optimizations": ["string"],
    "benchmarkComparison": {},
    "confidenceScore": 0-100
  }
}`;
        userPrompt = `Crea presupuesto con: ${JSON.stringify(params)}`;
        break;

      case 'analyze_variance':
        systemPrompt = `Eres un analista de variaciones presupuestarias experto.

FORMATO DE RESPUESTA (JSON estricto):
{
  "varianceAnalysis": {
    "period": "string",
    "totalBudget": number,
    "totalActual": number,
    "totalVariance": number,
    "variancePercentage": number,
    "status": "favorable" | "unfavorable" | "on_track",
    "byCategory": [
      {
        "category": "string",
        "budget": number,
        "actual": number,
        "variance": number,
        "variancePercentage": number,
        "status": "string",
        "explanation": "string",
        "trend": "improving" | "worsening" | "stable"
      }
    ],
    "topVariances": [],
    "rootCauses": ["string"]
  },
  "recommendations": [
    {
      "priority": number,
      "action": "string",
      "expectedImpact": number,
      "timeline": "string"
    }
  ],
  "forecast": {
    "yearEndProjection": number,
    "adjustedBudget": number
  }
}`;
        userPrompt = `Analiza variaciones: ${JSON.stringify(params)}`;
        break;

      case 'forecast_scenario':
        systemPrompt = `Eres un experto en modelado de escenarios financieros.

FORMATO DE RESPUESTA (JSON estricto):
{
  "scenarios": [
    {
      "id": "string",
      "name": "string",
      "type": "optimistic" | "baseline" | "pessimistic" | "stress",
      "probability": number,
      "assumptions": {},
      "projections": {
        "revenue": number,
        "expenses": number,
        "profit": number,
        "cashFlow": number
      },
      "impacts": [],
      "risks": [],
      "mitigations": []
    }
  ],
  "comparison": {
    "bestCase": {},
    "worstCase": {},
    "mostLikely": {}
  },
  "sensitivity": [],
  "recommendation": "string"
}`;
        userPrompt = `Modela escenarios: ${JSON.stringify(params)}`;
        break;

      case 'optimize_allocation':
        systemPrompt = `Eres un optimizador de asignación de recursos financieros con IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "optimization": {
    "currentAllocation": {},
    "optimizedAllocation": {},
    "improvements": [
      {
        "area": "string",
        "currentAmount": number,
        "suggestedAmount": number,
        "change": number,
        "rationale": "string",
        "expectedROI": number
      }
    ],
    "totalSavings": number,
    "efficiencyGain": number
  },
  "constraints": ["string"],
  "tradeoffs": ["string"],
  "implementationPlan": []
}`;
        userPrompt = `Optimiza asignación: ${JSON.stringify(params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-budgeting] Processing action: ${action}`);

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
      console.error('[obelixia-budgeting] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-budgeting] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-budgeting] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
