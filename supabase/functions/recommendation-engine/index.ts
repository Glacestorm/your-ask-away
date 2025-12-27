import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  action: 'get_recommendations' | 'submit_feedback' | 'get_config' | 'update_config' | 'get_metrics' | 
          'train_model' | 'explain' |
          'personalize' | 'cross_sell' | 'content_recommend' | 'next_best_offer';
  entityId?: string;
  entityType?: string;
  options?: { types?: string[]; limit?: number };
  feedback?: {
    recommendation_id: string;
    accepted: boolean;
    rating?: number;
    feedback_text?: string;
  };
  updates?: Record<string, unknown>;
  days?: number;
  recommendationId?: string;
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

// Mock data generators
function generateMockRecommendations(entityId: string, limit: number = 5) {
  const types = ['product', 'action', 'content', 'offer', 'upsell', 'cross_sell'] as const;
  return Array.from({ length: limit }, (_, i) => ({
    id: `rec-${Date.now()}-${i}`,
    type: types[i % types.length],
    title: `Recomendación ${i + 1}`,
    description: `Descripción de la recomendación personalizada para ${entityId}`,
    confidence: 0.75 + Math.random() * 0.2,
    relevance_score: 0.8 + Math.random() * 0.15,
    reasoning: 'Basado en historial de comportamiento y preferencias similares',
    target_entity_id: entityId,
    target_entity_type: 'customer',
    metadata: { category: 'enterprise', priority: 'high' },
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString()
  }));
}

function generateMockConfig() {
  return {
    enabled: true,
    algorithms: ['collaborative_filtering', 'content_based', 'hybrid'],
    min_confidence: 0.6,
    max_recommendations: 10,
    personalization_level: 'high' as const,
    include_reasoning: true
  };
}

function generateMockMetrics() {
  return {
    total_generated: 15420,
    acceptance_rate: 0.42,
    avg_confidence: 0.78,
    conversion_rate: 0.18,
    revenue_attributed: 125000
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json() as RecommendationRequest;
    const { action } = requestBody;
    console.log(`[recommendation-engine] Processing action: ${action}`);

    // Handle mock data actions (no AI needed)
    switch (action) {
      case 'get_recommendations':
        const recommendations = generateMockRecommendations(
          requestBody.entityId || 'default',
          requestBody.options?.limit || 5
        );
        return new Response(JSON.stringify({
          success: true,
          recommendations,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_config':
        return new Response(JSON.stringify({
          success: true,
          config: generateMockConfig(),
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_metrics':
        return new Response(JSON.stringify({
          success: true,
          metrics: generateMockMetrics(),
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'submit_feedback':
        return new Response(JSON.stringify({
          success: true,
          feedback_id: `fb-${Date.now()}`,
          recommendation_id: requestBody.feedback?.recommendation_id,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update_config':
        return new Response(JSON.stringify({
          success: true,
          config: { ...generateMockConfig(), ...requestBody.updates },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'train_model':
        return new Response(JSON.stringify({
          success: true,
          message: 'Modelo entrenado con 15,420 ejemplos. Precisión: 0.87',
          training_id: `train-${Date.now()}`,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'explain':
        return new Response(JSON.stringify({
          success: true,
          explanation: {
            factors: [
              { name: 'Historial de compras', weight: 0.35, description: 'Basado en productos similares adquiridos' },
              { name: 'Perfil demográfico', weight: 0.25, description: 'Segmento de cliente enterprise' },
              { name: 'Comportamiento reciente', weight: 0.25, description: 'Páginas visitadas en últimos 7 días' },
              { name: 'Tendencias del mercado', weight: 0.15, description: 'Productos populares en la industria' }
            ],
            similar_cases: 342,
            explanation_text: 'Esta recomendación se basa en el análisis de clientes con perfiles similares que han mostrado interés en productos de esta categoría.'
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // For AI-powered actions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';
    const { context, category, limit = 5 } = requestBody;

    switch (action) {
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
