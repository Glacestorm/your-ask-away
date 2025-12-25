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

    const { action, product_ids, product_id, days } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'forecast':
        systemPrompt = `Eres un modelo de forecasting de demanda con ML.

Predice demanda futura considerando estacionalidad, tendencias y factores externos.

FORMATO JSON:
{
  "predictions": [
    {
      "product_id": "uuid",
      "product_name": "string",
      "period": "YYYY-MM",
      "predicted_demand": number,
      "confidence": 0-100,
      "confidence_low": number,
      "confidence_high": number,
      "seasonality_factor": number,
      "trend_direction": "up|stable|down",
      "recommended_stock": number,
      "reorder_point": number
    }
  ],
  "drivers": [
    {
      "driver": "string",
      "correlation": -1 to 1,
      "lag_days": number,
      "predictive_power": 0-100,
      "current_value": number,
      "forecast_impact": "positive|neutral|negative"
    }
  ],
  "patterns": [
    {
      "pattern_name": "string",
      "peak_months": [1-12],
      "trough_months": [1-12],
      "amplitude": number,
      "confidence": 0-100
    }
  ]
}`;
        userPrompt = `Genera forecast de demanda para ${days || 90} días${product_ids?.length ? ` para productos: ${product_ids.join(', ')}` : ''}. Incluye 6-10 productos.`;
        break;

      case 'optimize_inventory':
        systemPrompt = `Eres un sistema de optimización de inventario.

FORMATO JSON:
{
  "optimizations": [
    {
      "product_id": "uuid",
      "current_stock": number,
      "optimal_stock": number,
      "days_of_supply": number,
      "stockout_risk": 0-100,
      "overstock_cost": number,
      "recommended_action": "order_now|reduce_stock|maintain|urgent_order",
      "order_quantity": number
    }
  ]
}`;
        userPrompt = `Optimiza inventario${product_ids?.length ? ` para: ${product_ids.join(', ')}` : ' completo'}`;
        break;

      case 'detect_anomalies':
        systemPrompt = `Detecta anomalías en patrones de demanda.

FORMATO JSON:
{
  "anomalies": [
    {
      "date": "YYYY-MM-DD",
      "type": "spike|drop|pattern_break",
      "deviation": number,
      "probable_cause": "string",
      "confidence": 0-100
    }
  ]
}`;
        userPrompt = `Detecta anomalías para producto: ${product_id}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[predictive-demand] Processing: ${action}`);

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
    console.error('[predictive-demand] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
