import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAGRequest {
  action: 'search' | 'answer' | 'suggest_related' | 'summarize_topic';
  query?: string;
  topic?: string;
  context?: {
    department?: string;
    userRole?: string;
    previousQueries?: string[];
  };
  filters?: {
    categories?: string[];
    dateRange?: { start: string; end: string };
    sources?: string[];
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

    const { action, query, topic, context, filters } = await req.json() as RAGRequest;
    console.log(`[knowledge-base-rag] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'search':
        systemPrompt = `Eres un sistema de búsqueda semántica de base de conocimiento empresarial.

SIMULA una búsqueda en la base de conocimiento y devuelve resultados relevantes.

RESPONDE EN JSON ESTRICTO:
{
  "results": [
    {
      "id": string,
      "title": string,
      "snippet": string,
      "relevanceScore": number,
      "category": string,
      "source": string,
      "lastUpdated": string,
      "author": string
    }
  ],
  "totalResults": number,
  "suggestedFilters": string[],
  "relatedQueries": string[]
}`;
        userPrompt = `Busca: "${query}"
Departamento: ${context?.department || 'todos'}
Filtros: ${JSON.stringify(filters || {})}`;
        break;

      case 'answer':
        systemPrompt = `Eres un asistente de conocimiento empresarial que responde preguntas basándose en documentación interna.

PROPORCIONA una respuesta completa y precisa, citando fuentes.

RESPONDE EN JSON ESTRICTO:
{
  "answer": string,
  "confidence": number,
  "sources": [
    { "title": string, "url": string, "relevance": number }
  ],
  "relatedTopics": string[],
  "followUpQuestions": string[],
  "disclaimer": string | null
}`;
        userPrompt = `Pregunta: "${query}"
Contexto del usuario: ${JSON.stringify(context || {})}`;
        break;

      case 'suggest_related':
        systemPrompt = `Eres un sistema de recomendación de contenido de base de conocimiento.

SUGIERE contenido relacionado basado en el tema actual.

RESPONDE EN JSON ESTRICTO:
{
  "relatedArticles": [
    { "title": string, "summary": string, "relevance": string }
  ],
  "expertContacts": [
    { "name": string, "expertise": string, "department": string }
  ],
  "trainingResources": string[],
  "externalResources": string[]
}`;
        userPrompt = `Sugiere contenido relacionado con: "${topic}"`;
        break;

      case 'summarize_topic':
        systemPrompt = `Eres un sintetizador de conocimiento corporativo.

GENERA un resumen completo del tema basado en la base de conocimiento.

RESPONDE EN JSON ESTRICTO:
{
  "topicSummary": string,
  "keyDefinitions": [{ "term": string, "definition": string }],
  "bestPractices": string[],
  "commonMistakes": string[],
  "usefulLinks": string[],
  "lastUpdated": string
}`;
        userPrompt = `Resume el tema: "${topic}"`;
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
        temperature: 0.6,
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

    console.log(`[knowledge-base-rag] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[knowledge-base-rag] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
