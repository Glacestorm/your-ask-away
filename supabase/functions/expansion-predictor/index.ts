/**
 * Expansion Predictor Edge Function
 * Predice oportunidades de expansión usando IA
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpansionRequest {
  action: 'analyze' | 'predict' | 'recommend';
  companyId?: string;
  companyData?: {
    name: string;
    sector: string;
    currentMRR: number;
    tenure: number;
    productUsage: Record<string, number>;
    healthScore: number;
  };
  context?: Record<string, unknown>;
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

    const { action, companyId, companyData, context } = await req.json() as ExpansionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze':
        systemPrompt = `Eres un analista de Customer Success especializado en identificar oportunidades de expansión.

CONTEXTO DEL ROL:
- Analiza datos de uso de productos y comportamiento del cliente
- Identifica patrones que indican potencial de upsell/cross-sell
- Evalúa el timing óptimo para propuestas de expansión

FORMATO DE RESPUESTA (JSON estricto):
{
  "expansionScore": 0-100,
  "signals": [
    {
      "type": "usage" | "engagement" | "growth" | "timing",
      "description": "string",
      "strength": "weak" | "moderate" | "strong",
      "impact": 0-100
    }
  ],
  "recommendations": [
    {
      "product": "string",
      "reason": "string",
      "confidence": 0-100,
      "estimatedValue": number
    }
  ],
  "riskFactors": ["string"],
  "optimalTiming": "immediate" | "next_month" | "next_quarter" | "not_ready"
}`;

        userPrompt = companyData 
          ? `Analiza el potencial de expansión para:
Empresa: ${companyData.name}
Sector: ${companyData.sector}
MRR Actual: €${companyData.currentMRR}
Antigüedad: ${companyData.tenure} meses
Health Score: ${companyData.healthScore}
Uso de productos: ${JSON.stringify(companyData.productUsage)}`
          : 'Proporciona un análisis general de señales de expansión';
        break;

      case 'predict':
        systemPrompt = `Eres un sistema predictivo de revenue expansion para SaaS B2B.

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "timeframe": "30d" | "60d" | "90d",
      "predictedExpansion": number,
      "probability": 0-100,
      "drivers": ["string"]
    }
  ],
  "modelConfidence": 0-100,
  "factors": {
    "positive": ["string"],
    "negative": ["string"]
  }
}`;

        userPrompt = `Predice la expansión de revenue basándote en: ${JSON.stringify(context)}`;
        break;

      case 'recommend':
        systemPrompt = `Eres un sistema de recomendaciones para Customer Success Managers.

FORMATO DE RESPUESTA (JSON estricto):
{
  "actions": [
    {
      "priority": 1-5,
      "type": "outreach" | "demo" | "review" | "proposal",
      "title": "string",
      "description": "string",
      "expectedOutcome": "string",
      "effort": "low" | "medium" | "high"
    }
  ],
  "talkingPoints": ["string"],
  "objectionHandling": {
    "objection": "response"
  }
}`;

        userPrompt = `Genera recomendaciones de acciones para maximizar la expansión: ${JSON.stringify(context)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[expansion-predictor] Processing action: ${action}`);

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
        max_tokens: 2000,
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
      console.error('[expansion-predictor] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[expansion-predictor] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[expansion-predictor] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
