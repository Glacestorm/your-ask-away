import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommunityRequest {
  action: 'moderate_post' | 'suggest_answers' | 'categorize_post' | 'detect_duplicate' | 'generate_summary' | 'highlight_best_answers';
  postId?: string;
  content?: string;
  title?: string;
  courseId?: string;
  existingPosts?: Array<{ id: string; title: string; content: string }>;
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

    const { action, postId, content, title, courseId, existingPosts } = await req.json() as CommunityRequest;

    console.log(`[academia-community] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'moderate_post':
        systemPrompt = `Eres un moderador de contenido para una comunidad educativa.

CRITERIOS DE MODERACIÓN:
- Contenido apropiado para ambiente educativo
- Sin spam, publicidad o contenido ofensivo
- Relevante para el curso o tema
- Sin información personal sensible

FORMATO DE RESPUESTA (JSON estricto):
{
  "approved": true,
  "moderationScore": 0-100,
  "flags": ["flag1", "flag2"],
  "reasons": ["razón1"],
  "suggestions": ["sugerencia para mejorar"],
  "category": "question" | "discussion" | "resource" | "help"
}`;

        userPrompt = `Modera este post:
Título: ${title}
Contenido: ${content}`;
        break;

      case 'suggest_answers':
        systemPrompt = `Eres un asistente educativo que sugiere respuestas a preguntas de estudiantes.

FORMATO DE RESPUESTA (JSON estricto):
{
  "suggestedAnswers": [
    {
      "answer": "Respuesta sugerida",
      "confidence": 0-100,
      "sources": ["fuente1"],
      "relatedTopics": ["tema1"]
    }
  ],
  "relatedQuestions": ["pregunta relacionada 1"],
  "expertiseLevel": "beginner" | "intermediate" | "advanced"
}`;

        userPrompt = `Sugiere respuestas para esta pregunta:
Título: ${title}
Contenido: ${content}
Curso ID: ${courseId}`;
        break;

      case 'categorize_post':
        systemPrompt = `Eres un sistema de categorización de posts educativos.

CATEGORÍAS DISPONIBLES:
- question: Pregunta sobre el material
- discussion: Discusión general
- resource: Compartir recursos
- help: Solicitud de ayuda
- project: Proyecto o ejercicio
- feedback: Retroalimentación

FORMATO DE RESPUESTA (JSON estricto):
{
  "primaryCategory": "question",
  "secondaryCategories": ["help"],
  "tags": ["tag1", "tag2"],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "urgency": "low" | "medium" | "high",
  "suggestedExperts": ["tipo de experto necesario"]
}`;

        userPrompt = `Categoriza este post:
Título: ${title}
Contenido: ${content}`;
        break;

      case 'detect_duplicate':
        systemPrompt = `Eres un sistema de detección de duplicados para una comunidad educativa.

FORMATO DE RESPUESTA (JSON estricto):
{
  "isDuplicate": false,
  "similarPosts": [
    {
      "postId": "id",
      "title": "título",
      "similarity": 0-100,
      "reason": "razón de similitud"
    }
  ],
  "recommendation": "proceed" | "merge" | "refer",
  "suggestedAction": "Acción recomendada"
}`;

        userPrompt = `Detecta si este post es duplicado:
Título: ${title}
Contenido: ${content}

Posts existentes: ${JSON.stringify(existingPosts || [])}`;
        break;

      case 'generate_summary':
        systemPrompt = `Eres un sistema de resumen de discusiones educativas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": "Resumen conciso de la discusión",
  "keyPoints": ["punto clave 1", "punto clave 2"],
  "conclusion": "Conclusión principal",
  "openQuestions": ["pregunta aún sin resolver"],
  "bestAnswers": [
    {
      "answerId": "id",
      "summary": "resumen de la respuesta",
      "votes": 0
    }
  ],
  "participationStats": {
    "totalComments": 0,
    "uniqueParticipants": 0,
    "avgResponseTime": "tiempo promedio"
  }
}`;

        userPrompt = `Genera un resumen para el post: ${postId}
Contenido: ${content}`;
        break;

      case 'highlight_best_answers':
        systemPrompt = `Eres un sistema de evaluación de respuestas educativas.

CRITERIOS DE EVALUACIÓN:
- Precisión técnica
- Claridad de explicación
- Ejemplos prácticos
- Referencias a materiales del curso

FORMATO DE RESPUESTA (JSON estricto):
{
  "rankedAnswers": [
    {
      "answerId": "id",
      "score": 0-100,
      "strengths": ["fortaleza1"],
      "improvements": ["mejora sugerida"],
      "isBestAnswer": true
    }
  ],
  "overallQuality": "excellent" | "good" | "average" | "needs_improvement"
}`;

        userPrompt = `Evalúa las respuestas del post: ${postId}`;
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
    const content_response = data.choices?.[0]?.message?.content;

    if (!content_response) throw new Error('No content in AI response');

    let result;
    try {
      const jsonMatch = content_response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[academia-community] JSON parse error:', parseError);
      result = { rawContent: content_response, parseError: true };
    }

    console.log(`[academia-community] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[academia-community] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
