// supabase/functions/erp-cash-flow-analysis/index.ts
// Edge function para análisis de flujo de caja con IA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CashFlowContext {
  companyId: string;
  fiscalYear: number;
  startDate: string;
  endDate: string;
  currency: string;
}

interface FunctionRequest {
  action: 'get_full_analysis' | 'generate_projections' | 'analyze_liquidity' | 'get_ai_insights' | 'what_if_scenario';
  context: CashFlowContext;
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

    console.log(`[erp-cash-flow-analysis] Action: ${action}, Company: ${context?.companyId}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_full_analysis':
        systemPrompt = `Eres un experto en análisis de flujo de caja y tesorería empresarial.
        
CONTEXTO DEL ROL:
- Analista financiero senior especializado en gestión de liquidez
- Experiencia en proyecciones de cash flow y gestión de tesorería
- Conocimiento profundo de métricas de liquidez y solvencia

DATOS A GENERAR:
Genera un análisis completo de flujo de caja con datos realistas para una empresa.

FORMATO DE RESPUESTA (JSON estricto):
{
  "items": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "type": "inflow" | "outflow",
      "category": "string",
      "description": "string",
      "amount": number,
      "account_name": "string",
      "status": "pending" | "confirmed" | "projected"
    }
  ],
  "projections": [
    {
      "date": "YYYY-MM-DD",
      "projected_inflows": number,
      "projected_outflows": number,
      "net_cash_flow": number,
      "cumulative_balance": number,
      "confidence_level": 0-100
    }
  ],
  "metrics": {
    "current_cash": number,
    "days_cash_available": number,
    "cash_burn_rate": number,
    "cash_runway_days": number,
    "liquidity_ratio": number,
    "quick_ratio": number,
    "cash_conversion_cycle": number,
    "working_capital": number,
    "free_cash_flow": number
  },
  "summary": {
    "period": "string",
    "opening_balance": number,
    "total_inflows": number,
    "total_outflows": number,
    "net_cash_flow": number,
    "closing_balance": number,
    "operating_cash_flow": number,
    "investing_cash_flow": number,
    "financing_cash_flow": number
  },
  "categories": [
    {
      "category": "string",
      "type": "inflow" | "outflow",
      "amount": number,
      "percentage": number,
      "trend": "up" | "down" | "stable",
      "trend_percentage": number
    }
  ],
  "insights": [
    {
      "id": "string",
      "type": "prediction" | "recommendation" | "warning" | "opportunity",
      "title": "string",
      "description": "string",
      "impact_score": 0-100,
      "confidence": 0-100,
      "suggested_actions": ["string"]
    }
  ]
}`;

        userPrompt = `Genera un análisis completo de flujo de caja para:
- Empresa ID: ${context.companyId}
- Año fiscal: ${context.fiscalYear}
- Período: ${context.startDate} a ${context.endDate}
- Moneda: ${context.currency}

Incluye:
1. 15-20 movimientos de caja recientes (cobros, pagos, transferencias)
2. Proyecciones para los próximos 90 días
3. Métricas de liquidez actualizadas
4. Resumen del período
5. Desglose por categorías
6. 3-5 insights de IA con recomendaciones accionables`;
        break;

      case 'generate_projections':
        const horizonDays = (params?.horizon_days as number) || 90;
        
        systemPrompt = `Eres un experto en proyecciones financieras y modelado de cash flow.

FORMATO DE RESPUESTA (JSON estricto):
{
  "projections": [
    {
      "date": "YYYY-MM-DD",
      "projected_inflows": number,
      "projected_outflows": number,
      "net_cash_flow": number,
      "cumulative_balance": number,
      "confidence_level": 0-100
    }
  ],
  "assumptions": ["string"],
  "risk_factors": ["string"],
  "best_case_balance": number,
  "worst_case_balance": number
}`;

        userPrompt = `Genera proyecciones de flujo de caja para los próximos ${horizonDays} días.
Contexto: Empresa ${context.companyId}, año ${context.fiscalYear}, moneda ${context.currency}.

Incluye proyecciones diarias/semanales con niveles de confianza decrecientes a medida que aumenta el horizonte.`;
        break;

      case 'analyze_liquidity':
        systemPrompt = `Eres un analista especializado en liquidez y gestión de tesorería.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": {
    "current_cash": number,
    "days_cash_available": number,
    "cash_burn_rate": number,
    "cash_runway_days": number,
    "liquidity_ratio": number,
    "quick_ratio": number,
    "cash_conversion_cycle": number,
    "working_capital": number,
    "free_cash_flow": number
  },
  "alerts": [
    {
      "id": "string",
      "type": "critical" | "warning" | "info",
      "category": "liquidity" | "projection" | "variance" | "pattern",
      "title": "string",
      "message": "string",
      "metric_value": number,
      "threshold_value": number,
      "recommendations": ["string"]
    }
  ],
  "health_score": 0-100,
  "trend": "improving" | "stable" | "deteriorating"
}`;

        userPrompt = `Analiza la situación de liquidez de la empresa ${context.companyId}.
Período: ${context.startDate} a ${context.endDate}
Moneda: ${context.currency}

Proporciona métricas de liquidez, alertas si hay problemas, y evalúa la salud financiera general.`;
        break;

      case 'get_ai_insights':
        systemPrompt = `Eres un asesor financiero IA especializado en optimización de flujo de caja.

FORMATO DE RESPUESTA (JSON estricto):
{
  "insights": [
    {
      "id": "string",
      "type": "prediction" | "recommendation" | "warning" | "opportunity",
      "title": "string",
      "description": "string",
      "impact_score": 0-100,
      "confidence": 0-100,
      "suggested_actions": ["string"],
      "data_points": {"key": number}
    }
  ],
  "priority_actions": ["string"],
  "optimization_potential": number
}`;

        userPrompt = `Genera insights de IA para optimizar el flujo de caja de la empresa ${context.companyId}.
Período analizado: ${context.startDate} a ${context.endDate}

Proporciona:
1. Predicciones sobre tendencias de cash flow
2. Recomendaciones para mejorar la liquidez
3. Alertas sobre posibles problemas
4. Oportunidades de optimización`;
        break;

      case 'what_if_scenario':
        const scenario = params?.scenario as Record<string, unknown>;
        
        systemPrompt = `Eres un modelador financiero experto en análisis de escenarios.

FORMATO DE RESPUESTA (JSON estricto):
{
  "scenario_result": {
    "scenario_name": "string",
    "base_closing_balance": number,
    "projected_closing_balance": number,
    "difference": number,
    "difference_percentage": number,
    "monthly_projections": [
      {
        "month": "string",
        "base_balance": number,
        "scenario_balance": number,
        "cumulative_impact": number
      }
    ],
    "risk_assessment": "low" | "medium" | "high",
    "viability_score": 0-100,
    "recommendations": ["string"],
    "key_assumptions": ["string"]
  }
}`;

        userPrompt = `Ejecuta un análisis de escenario what-if para la empresa ${context.companyId}:

Escenario: ${JSON.stringify(scenario)}

Calcula el impacto en:
- Balance de caja proyectado
- Métricas de liquidez
- Runway de efectivo
- Viabilidad financiera`;
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
      console.error('[erp-cash-flow-analysis] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[erp-cash-flow-analysis] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-cash-flow-analysis] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
