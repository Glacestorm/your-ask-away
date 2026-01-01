/**
 * ERP Predictive Analytics - Análisis predictivo financiero
 * Tendencia 2025-2027: Forecasting IA, scenario planning
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveRequest {
  action: 'cash_flow_forecast' | 'revenue_prediction' | 'expense_forecast' | 'scenario_analysis' | 'working_capital';
  company_id?: string;
  historical_data?: any;
  current_data?: any;
  scenarios?: any[];
  horizon_months?: number;
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

    const { action, historical_data, current_data, scenarios, horizon_months = 12 } = await req.json() as PredictiveRequest;

    let systemPrompt = '';
    let userPrompt = '';
    let result: any = {};

    switch (action) {
      case 'cash_flow_forecast':
        systemPrompt = `Eres un sistema avanzado de forecasting de tesorería.

METODOLOGÍA:
1. Análisis de series temporales
2. Estacionalidad y tendencias
3. Patrones de cobro/pago
4. Impacto de días festivos
5. Correlaciones macroeconómicas

GENERA previsiones diarias, semanales y mensuales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "forecast": {
    "daily": [
      {
        "date": "string",
        "opening_balance": number,
        "inflows": number,
        "outflows": number,
        "net_flow": number,
        "closing_balance": number,
        "confidence": 0-100
      }
    ],
    "weekly_summary": [],
    "monthly_summary": []
  },
  "key_dates": [
    {
      "date": "string",
      "event": "string",
      "impact": number,
      "type": "inflow" | "outflow"
    }
  ],
  "risk_alerts": [
    {
      "date": "string",
      "issue": "string",
      "severity": "low" | "medium" | "high",
      "recommendation": "string"
    }
  ],
  "optimal_actions": [
    {
      "action": "string",
      "timing": "string",
      "expected_benefit": number
    }
  ],
  "accuracy_metrics": {
    "mape": number,
    "confidence_level": number
  }
}`;

        userPrompt = `Genera forecast de tesorería para ${horizon_months} meses:

DATOS HISTÓRICOS:
${JSON.stringify(historical_data, null, 2)}

SITUACIÓN ACTUAL:
${JSON.stringify(current_data, null, 2)}`;
        break;

      case 'revenue_prediction':
        systemPrompt = `Eres un sistema de predicción de ingresos con ML.

FACTORES A CONSIDERAR:
1. Tendencia histórica
2. Estacionalidad del negocio
3. Pipeline comercial
4. Renovaciones automáticas
5. Churn esperado
6. Nuevos clientes proyectados
7. Cambios de precios
8. Factores macroeconómicos

FORMATO DE RESPUESTA (JSON estricto):
{
  "revenue_forecast": [
    {
      "period": "string",
      "base_revenue": number,
      "new_business": number,
      "churn_impact": number,
      "expansion": number,
      "total_revenue": number,
      "yoy_growth": number,
      "confidence": 0-100,
      "range": { "low": number, "high": number }
    }
  ],
  "drivers": [
    {
      "driver": "string",
      "impact_pct": number,
      "trend": "increasing" | "stable" | "decreasing"
    }
  ],
  "risks": [
    {
      "risk": "string",
      "probability": number,
      "impact": number,
      "mitigation": "string"
    }
  ],
  "opportunities": [
    {
      "opportunity": "string",
      "potential_revenue": number,
      "actions_required": ["string"]
    }
  ],
  "scenarios": {
    "optimistic": number,
    "base": number,
    "pessimistic": number
  }
}`;

        userPrompt = `Predice ingresos para ${horizon_months} meses:

${JSON.stringify(historical_data, null, 2)}`;
        break;

      case 'scenario_analysis':
        systemPrompt = `Eres un analista de escenarios financieros.

GENERA análisis de sensibilidad y escenarios what-if.

FORMATO DE RESPUESTA (JSON estricto):
{
  "base_case": {
    "assumptions": {},
    "projections": {},
    "kpis": {}
  },
  "scenarios": [
    {
      "name": "string",
      "description": "string",
      "probability": 0-100,
      "assumptions_changes": {},
      "impact": {
        "revenue": number,
        "profit": number,
        "cash_flow": number
      },
      "projections": {},
      "recommended_actions": ["string"]
    }
  ],
  "sensitivity_analysis": [
    {
      "variable": "string",
      "base_value": number,
      "test_range": { "min": number, "max": number },
      "impact_on_profit": [
        { "variable_value": number, "profit_change": number }
      ],
      "breakeven_point": number
    }
  ],
  "monte_carlo_summary": {
    "simulations": number,
    "profit_distribution": {
      "p10": number,
      "p50": number,
      "p90": number
    },
    "probability_positive": number
  }
}`;

        userPrompt = `Analiza estos escenarios:

DATOS BASE:
${JSON.stringify(current_data, null, 2)}

ESCENARIOS A EVALUAR:
${JSON.stringify(scenarios, null, 2)}`;
        break;

      case 'working_capital':
        systemPrompt = `Eres un experto en gestión de capital circulante.

ANALIZA Y OPTIMIZA:
1. DSO (Days Sales Outstanding)
2. DPO (Days Payable Outstanding)
3. DIO (Days Inventory Outstanding)
4. Ciclo de conversión de efectivo

FORMATO DE RESPUESTA (JSON estricto):
{
  "current_metrics": {
    "dso": number,
    "dpo": number,
    "dio": number,
    "cash_conversion_cycle": number,
    "working_capital_eur": number,
    "wc_to_revenue_ratio": number
  },
  "benchmarks": {
    "sector_dso": number,
    "sector_dpo": number,
    "sector_ccc": number
  },
  "optimization_opportunities": [
    {
      "area": "receivables" | "payables" | "inventory",
      "current_value": number,
      "target_value": number,
      "cash_release_potential": number,
      "actions": ["string"],
      "implementation_timeline": "string"
    }
  ],
  "aged_analysis": {
    "receivables": [
      { "bucket": "string", "amount": number, "risk": "string" }
    ],
    "payables": []
  },
  "forecast": {
    "periods": [],
    "cash_release_cumulative": number
  }
}`;

        userPrompt = `Optimiza el capital circulante:

${JSON.stringify(current_data, null, 2)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-predictive-analytics] Processing action: ${action}`);

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
        temperature: 0.3,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded' 
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

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[erp-predictive-analytics] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-predictive-analytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
