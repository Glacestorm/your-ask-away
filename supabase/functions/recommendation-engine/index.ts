import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  action: 'get_recommendations' | 'personalize' | 'cross_sell' | 'content_recommend' | 'next_best_offer';
  context?: {
    userId?: string;
    userProfile?: Record<string, unknown>;
    currentProducts?: string[];
    browsingHistory?: string[];
    purchaseHistory?: string[];
    preferences?: string[];
  };
  category?: string;
  limit?: number;
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

    const { action, context, category, limit = 5 } = await req.json() as RecommendationRequest;
    console.log(`[recommendation-engine] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_recommendations':
        systemPrompt = `Eres un sistema de recomendaciones empresariales inteligente.

GENERA recomendaciones personalizadas basadas en el perfil del usuario.

RESPONDE EN JSON ESTRICTO:
{
  "recommendations": [
    {
      "id": string,
      "type": string,
      "title": string,
      "description": string,
      "relevanceScore": number,
      "reason": string,
      "expectedValue": string,
      "actionUrl": string
    }
  ],
  "personalizationFactors": string[],
  "alternativeRecommendations": string[]
}`;
        userPrompt = `Genera ${limit} recomendaciones para:
Usuario: ${context?.userId}
Perfil: ${JSON.stringify(context?.userProfile || {})}
Historial: ${context?.purchaseHistory?.join(', ')}
Categoría: ${category || 'todas'}`;
        break;

      case 'personalize':
        systemPrompt = `Eres un motor de personalización avanzado.

PERSONALIZA la experiencia del usuario.

RESPONDE EN JSON ESTRICTO:
{
  "personalizedContent": [
    { "contentId": string, "type": string, "title": string, "relevance": number }
  ],
  "userSegment": string,
  "preferredChannels": string[],
  "optimalContactTime": string,
  "communicationStyle": string,
  "contentPreferences": object
}`;
        userPrompt = `Personaliza experiencia para usuario: ${context?.userId}
Preferencias: ${context?.preferences?.join(', ')}
Historial de navegación: ${context?.browsingHistory?.join(', ')}`;
        break;

      case 'cross_sell':
        systemPrompt = `Eres un sistema de cross-selling inteligente.

IDENTIFICA oportunidades de venta cruzada.

RESPONDE EN JSON ESTRICTO:
{
  "crossSellOpportunities": [
    {
      "product": string,
      "complementsProduct": string,
      "probability": number,
      "expectedRevenue": number,
      "pitch": string
    }
  ],
  "bundleRecommendations": [
    { "products": string[], "discount": string, "value": string }
  ],
  "timing": string
}`;
        userPrompt = `Identifica cross-sell para:
Productos actuales: ${context?.currentProducts?.join(', ')}
Historial de compras: ${context?.purchaseHistory?.join(', ')}`;
        break;

      case 'content_recommend':
        systemPrompt = `Eres un sistema de recomendación de contenido.

RECOMIENDA contenido relevante.

RESPONDE EN JSON ESTRICTO:
{
  "contentRecommendations": [
    {
      "id": string,
      "title": string,
      "type": "article" | "video" | "webinar" | "guide" | "case_study",
      "topic": string,
      "duration": string,
      "relevanceScore": number,
      "reason": string
    }
  ],
  "learningPath": string[],
  "trendingContent": string[]
}`;
        userPrompt = `Recomienda contenido para usuario con preferencias: ${context?.preferences?.join(', ')}
Categoría: ${category}`;
        break;

      case 'next_best_offer':
        systemPrompt = `Eres un sistema de Next Best Offer (NBO).

DETERMINA la mejor oferta para el cliente.

RESPONDE EN JSON ESTRICTO:
{
  "bestOffer": {
    "offerId": string,
    "name": string,
    "description": string,
    "value": string,
    "probability": number,
    "validUntil": string,
    "channel": string,
    "messaging": string
  },
  "alternativeOffers": [
    { "offerId": string, "name": string, "probability": number }
  ],
  "timing": string,
  "contextTriggers": string[]
}`;
        userPrompt = `Determina next best offer para:
Cliente: ${context?.userId}
Productos: ${context?.currentProducts?.join(', ')}
Perfil: ${JSON.stringify(context?.userProfile || {})}`;
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

    console.log(`[recommendation-engine] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[recommendation-engine] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
