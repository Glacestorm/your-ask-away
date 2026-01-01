import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForecastRequest {
  action: 'generate_forecast' | 'scenario_analysis' | 'cash_flow_projection';
  params?: {
    period?: string;
    months?: number;
    scenario?: 'optimistic' | 'base' | 'pessimistic';
    metrics?: string[];
  };
  historicalData?: Record<string, number[]>;
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

    const { action, params, historicalData } = await req.json() as ForecastRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate_forecast':
        systemPrompt = `Eres un experto en análisis financiero predictivo.
        
CAPACIDADES:
- Proyecciones de ingresos y gastos
- Análisis de tendencias
- Estacionalidad y patrones cíclicos
- Machine Learning aplicado a finanzas

FORMATO JSON ESTRICTO:
{
  "forecast": {
    "period": "string",
    "predictions": [
      {
        "month": "YYYY-MM",
        "revenue": number,
        "expenses": number,
        "profit": number,
        "confidence": number
      }
    ],
    "trends": {
      "revenue_growth": number,
      "expense_trend": "increasing|stable|decreasing",
      "profit_margin_forecast": number
    },
    "risks": ["string"],
    "opportunities": ["string"]
  },
  "accuracy_metrics": {
    "mape": number,
    "rmse": number,
    "confidence_level": number
  }
}`;
        userPrompt = `Genera pronóstico financiero para ${params?.months || 6} meses.
Período: ${params?.period || 'próximo semestre'}
Datos históricos: ${JSON.stringify(historicalData || {})}`;
        break;

      case 'scenario_analysis':
        systemPrompt = `Eres un analista de escenarios financieros.
        
ESCENARIOS A MODELAR:
- Optimista: crecimiento agresivo
- Base: tendencia actual
- Pesimista: condiciones adversas

FORMATO JSON ESTRICTO:
{
  "scenarios": {
    "optimistic": {
      "probability": number,
      "revenue_change": number,
      "profit_impact": number,
      "key_drivers": ["string"],
      "monthly_projections": [{"month": "string", "value": number}]
    },
    "base": {...},
    "pessimistic": {...}
  },
  "recommendations": ["string"],
  "key_assumptions": ["string"],
  "sensitivity_factors": [
    {"factor": "string", "impact_low": number, "impact_high": number}
  ]
}`;
        userPrompt = `Análisis de escenarios para: ${params?.metrics?.join(', ') || 'ingresos, gastos, beneficio'}
Escenario focus: ${params?.scenario || 'todos'}`;
        break;

      case 'cash_flow_projection':
        systemPrompt = `Eres un experto en gestión de tesorería y cash flow.
        
ANÁLISIS INCLUYE:
- Flujo de caja operativo
- Flujo de inversión
- Flujo de financiación
- Posición de liquidez

FORMATO JSON ESTRICTO:
{
  "cash_flow": {
    "projections": [
      {
        "month": "YYYY-MM",
        "opening_balance": number,
        "operating_inflows": number,
        "operating_outflows": number,
        "investing_flows": number,
        "financing_flows": number,
        "closing_balance": number
      }
    ],
    "summary": {
      "total_inflows": number,
      "total_outflows": number,
      "net_change": number,
      "minimum_balance": number,
      "maximum_balance": number
    },
    "liquidity_alerts": [
      {"month": "string", "alert_type": "string", "severity": "low|medium|high"}
    ],
    "recommendations": ["string"]
  }
}`;
        userPrompt = `Proyección de flujo de caja para ${params?.months || 3} meses.`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-financial-forecasting] Processing: ${action}`);

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
        temperature: 0.6,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
    } catch {
      result = { rawContent: content };
    }

    console.log(`[erp-financial-forecasting] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-financial-forecasting] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
