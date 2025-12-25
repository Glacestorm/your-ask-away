import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Customer360Request {
  action: 'get_customer_360' | 'list_customers' | 'predict_behavior' | 'get_nba' | 'generate_insights' | 'compare_customers';
  customerId?: string;
  customerIds?: string[];
  filters?: {
    riskLevel?: string;
    healthScoreMin?: number;
    segment?: string;
  };
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

    const { action, customerId, customerIds, filters } = await req.json() as Customer360Request;
    console.log(`[customer-360-ia] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_customer_360':
        systemPrompt = `Eres un sistema de Customer 360 que proporciona una visión unificada del cliente.

GENERA un perfil completo y realista del cliente.

RESPONDE EN JSON ESTRICTO:
{
  "customer": {
    "id": string,
    "customer_id": string,
    "name": string,
    "demographics": {
      "company_name": string,
      "industry": string,
      "size": string,
      "location": string,
      "contact_info": object
    },
    "financial": {
      "lifetime_value": number,
      "monthly_revenue": number,
      "payment_status": string,
      "credit_score": number,
      "outstanding_balance": number
    },
    "engagement": {
      "health_score": number,
      "last_interaction": string,
      "interaction_frequency": number,
      "preferred_channel": string,
      "sentiment_trend": "improving" | "declining" | "stable"
    },
    "products": [{ "name": string, "status": string, "start_date": string, "value": number }],
    "predictions": {
      "churn_probability": number,
      "expansion_probability": number,
      "next_best_action": string,
      "predicted_ltv": number
    },
    "recent_activities": [{ "type": string, "description": string, "date": string, "outcome": string }],
    "alerts": [{ "type": "risk" | "opportunity", "message": string, "priority": "high" | "medium" | "low" }]
  }
}`;
        userPrompt = `Genera perfil 360 para el cliente ID: ${customerId}`;
        break;

      case 'list_customers':
        systemPrompt = `Eres un sistema de gestión de clientes.

GENERA una lista de clientes resumida.

RESPONDE EN JSON ESTRICTO:
{
  "customers": [
    {
      "id": string,
      "name": string,
      "health_score": number,
      "ltv": number,
      "churn_risk": number,
      "last_activity": string
    }
  ]
}`;
        userPrompt = `Lista clientes con filtros: ${JSON.stringify(filters || {})}`;
        break;

      case 'predict_behavior':
        systemPrompt = `Eres un sistema predictivo de comportamiento de clientes.

RESPONDE EN JSON ESTRICTO:
{
  "prediction": {
    "predictions": {
      "churn_probability": number,
      "expansion_probability": number,
      "next_best_action": string,
      "predicted_ltv": number
    },
    "confidence": number
  }
}`;
        userPrompt = `Predice comportamiento del cliente: ${customerId}`;
        break;

      case 'get_nba':
        systemPrompt = `Eres un sistema de Next Best Action para clientes.

RESPONDE EN JSON ESTRICTO:
{
  "actions": [
    {
      "action": string,
      "description": string,
      "expected_impact": string,
      "priority": number
    }
  ]
}`;
        userPrompt = `Genera acciones recomendadas para cliente: ${customerId}`;
        break;

      case 'generate_insights':
        systemPrompt = `Eres un generador de insights de cliente.

RESPONDE EN JSON ESTRICTO:
{
  "insights": string[]
}`;
        userPrompt = `Genera insights para el cliente: ${customerId}`;
        break;

      case 'compare_customers':
        systemPrompt = `Eres un comparador de clientes.

RESPONDE EN JSON ESTRICTO:
{
  "comparison": {
    "comparison": object,
    "highlights": string[]
  }
}`;
        userPrompt = `Compara clientes: ${customerIds?.join(', ')}`;
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

    console.log(`[customer-360-ia] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[customer-360-ia] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
