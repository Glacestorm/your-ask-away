import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmotionalAnalysisRequest {
  action: 'analyze_text' | 'analyze_interaction' | 'get_trends' | 'get_team_mood';
  text?: string;
  interaction?: {
    type: string;
    content: string;
    context?: Record<string, unknown>;
  };
  entityId?: string;
  entityType?: string;
  timeRange?: { start: string; end: string };
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

    const { action, text, interaction, entityId, entityType, timeRange } = await req.json() as EmotionalAnalysisRequest;
    console.log(`[emotional-analysis-ia] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze_text':
        systemPrompt = `Eres un experto en análisis emocional y detección de sentimientos.
        
ANALIZA el texto y devuelve:
1. Emoción dominante (joy, sadness, anger, fear, surprise, disgust, trust, anticipation)
2. Sentimiento general (positive, negative, neutral)
3. Intensidad (0-100)
4. Emociones secundarias detectadas
5. Señales de alerta (frustración, urgencia, etc.)

RESPONDE EN JSON ESTRICTO:
{
  "dominantEmotion": string,
  "sentiment": "positive" | "negative" | "neutral",
  "intensity": number,
  "secondaryEmotions": string[],
  "alerts": string[],
  "confidence": number,
  "keywords": string[],
  "summary": string
}`;
        userPrompt = `Analiza este texto: "${text}"`;
        break;

      case 'analyze_interaction':
        systemPrompt = `Eres un analista de interacciones cliente-empresa especializado en CX.

ANALIZA la interacción y evalúa:
1. Estado emocional del cliente
2. Nivel de satisfacción implícito
3. Riesgo de churn basado en el tono
4. Recomendaciones de acción

RESPONDE EN JSON ESTRICTO:
{
  "customerEmotion": string,
  "satisfactionLevel": number,
  "churnRiskFromTone": "low" | "medium" | "high",
  "escalationNeeded": boolean,
  "recommendedActions": string[],
  "keyInsights": string[]
}`;
        userPrompt = `Analiza esta interacción de tipo "${interaction?.type}": ${interaction?.content}
Contexto adicional: ${JSON.stringify(interaction?.context || {})}`;
        break;

      case 'get_trends':
        systemPrompt = `Eres un analista de tendencias emocionales organizacionales.

GENERA un análisis de tendencias emocionales simulado pero realista basado en el período.

RESPONDE EN JSON ESTRICTO:
{
  "overallTrend": "improving" | "declining" | "stable",
  "dominantEmotions": [{ "emotion": string, "percentage": number }],
  "weeklyBreakdown": [{ "week": string, "avgSentiment": number, "topEmotion": string }],
  "alerts": string[],
  "recommendations": string[]
}`;
        userPrompt = `Genera análisis de tendencias emocionales para ${entityType} ${entityId} en el período ${timeRange?.start} a ${timeRange?.end}`;
        break;

      case 'get_team_mood':
        systemPrompt = `Eres un especialista en clima laboral y bienestar organizacional.

GENERA un análisis del estado de ánimo del equipo.

RESPONDE EN JSON ESTRICTO:
{
  "overallMood": number,
  "moodCategory": "excellent" | "good" | "neutral" | "concerning" | "critical",
  "topEmotions": string[],
  "stressIndicators": string[],
  "positiveSignals": string[],
  "suggestions": string[]
}`;
        userPrompt = `Analiza el estado de ánimo del equipo/entidad ${entityId}`;
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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[emotional-analysis-ia] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[emotional-analysis-ia] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
