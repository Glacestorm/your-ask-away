/**
 * Lead Scorer Edge Function
 * Puntúa y prioriza leads usando IA
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadScoreRequest {
  action: 'score' | 'prioritize' | 'enrich';
  lead?: {
    company: string;
    sector: string;
    size: string;
    source: string;
    engagement: Record<string, number>;
    firmographics?: Record<string, unknown>;
  };
  leads?: Array<{
    id: string;
    company: string;
    sector: string;
    currentScore?: number;
  }>;
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

    const { action, lead, leads } = await req.json() as LeadScoreRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'score':
        systemPrompt = `Eres un sistema de lead scoring para empresas B2B SaaS.

MODELO DE SCORING:
- Fit Score (0-40): Coincidencia con ICP
- Engagement Score (0-30): Nivel de interacción
- Intent Score (0-30): Señales de compra

FORMATO DE RESPUESTA (JSON estricto):
{
  "totalScore": 0-100,
  "breakdown": {
    "fit": { "score": 0-40, "factors": ["string"] },
    "engagement": { "score": 0-30, "factors": ["string"] },
    "intent": { "score": 0-30, "factors": ["string"] }
  },
  "tier": "A" | "B" | "C" | "D",
  "readiness": "hot" | "warm" | "cold",
  "recommendedAction": "string",
  "estimatedDealSize": number,
  "conversionProbability": 0-100
}`;

        userPrompt = lead 
          ? `Puntúa este lead:
Empresa: ${lead.company}
Sector: ${lead.sector}
Tamaño: ${lead.size}
Fuente: ${lead.source}
Engagement: ${JSON.stringify(lead.engagement)}
Firmographics: ${JSON.stringify(lead.firmographics || {})}`
          : 'Error: No se proporcionó información del lead';
        break;

      case 'prioritize':
        systemPrompt = `Eres un sistema de priorización de pipeline comercial.

CRITERIOS DE PRIORIZACIÓN:
1. Score actual + tendencia
2. Valor potencial del deal
3. Urgencia / timing
4. Probabilidad de cierre

FORMATO DE RESPUESTA (JSON estricto):
{
  "prioritizedLeads": [
    {
      "id": "string",
      "rank": number,
      "priorityScore": 0-100,
      "reasoning": "string",
      "suggestedNextStep": "string",
      "urgency": "high" | "medium" | "low"
    }
  ],
  "insights": {
    "pipelineHealth": "string",
    "focusRecommendation": "string"
  }
}`;

        userPrompt = `Prioriza estos leads: ${JSON.stringify(leads)}`;
        break;

      case 'enrich':
        systemPrompt = `Eres un sistema de enriquecimiento de datos B2B.

FORMATO DE RESPUESTA (JSON estricto):
{
  "enrichedData": {
    "industry": "string",
    "subIndustry": "string",
    "estimatedRevenue": "string",
    "employeeCount": "string",
    "techStack": ["string"],
    "buyingSignals": ["string"],
    "competitorProducts": ["string"]
  },
  "qualificationQuestions": ["string"],
  "discoveryAngles": ["string"],
  "confidenceLevel": 0-100
}`;

        userPrompt = `Enriquece datos para: ${JSON.stringify(lead)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[lead-scorer] Processing action: ${action}`);

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
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

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[lead-scorer] JSON parse error:', parseError);
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
    console.error('[lead-scorer] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
