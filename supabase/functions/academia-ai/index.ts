import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcademiaRequest {
  action: 'recommend_courses' | 'analyze_progress' | 'generate_summary' | 'answer_question' | 'suggest_next_steps';
  userId?: string;
  courseId?: string;
  context?: {
    enrolledCourses?: string[];
    completedCourses?: string[];
    interests?: string[];
    currentProgress?: number;
    learningGoals?: string[];
    questionContent?: string;
    lessonContent?: string;
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

    const { action, userId, courseId, context } = await req.json() as AcademiaRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'recommend_courses':
        systemPrompt = `Eres un asistente de aprendizaje especializado en recomendar cursos personalizados.

CONTEXTO:
- Analiza el historial de aprendizaje del usuario
- Considera sus intereses y objetivos
- Sugiere cursos que complementen su conocimiento actual

FORMATO DE RESPUESTA (JSON estricto):
{
  "recommendations": [
    {
      "reason": "string - Por qué este curso es relevante",
      "priority": "high" | "medium" | "low",
      "matchScore": 0-100,
      "category": "string"
    }
  ],
  "learningPath": {
    "suggested": ["curso1", "curso2"],
    "estimatedTime": "X semanas",
    "difficulty": "beginner" | "intermediate" | "advanced"
  },
  "tips": ["string"]
}`;
        userPrompt = `Usuario con:
- Cursos completados: ${context?.completedCourses?.join(', ') || 'ninguno'}
- Cursos en progreso: ${context?.enrolledCourses?.join(', ') || 'ninguno'}
- Intereses: ${context?.interests?.join(', ') || 'no especificados'}
- Objetivos: ${context?.learningGoals?.join(', ') || 'no especificados'}

Recomienda cursos y un path de aprendizaje personalizado.`;
        break;

      case 'analyze_progress':
        systemPrompt = `Eres un analista de aprendizaje que evalúa el progreso del estudiante.

CONTEXTO:
- Analiza el avance actual del usuario
- Identifica patrones de aprendizaje
- Detecta posibles bloqueos o dificultades

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "overallProgress": 0-100,
    "learningPace": "slow" | "normal" | "fast",
    "strengths": ["string"],
    "areasToImprove": ["string"],
    "engagementLevel": "low" | "medium" | "high"
  },
  "insights": ["string"],
  "predictions": {
    "estimatedCompletion": "fecha estimada",
    "riskOfDropout": "low" | "medium" | "high",
    "recommendedActions": ["string"]
  },
  "motivation": "string - mensaje motivacional personalizado"
}`;
        userPrompt = `Analiza el progreso:
- Curso actual: ${courseId || 'no especificado'}
- Progreso: ${context?.currentProgress || 0}%
- Cursos completados: ${context?.completedCourses?.length || 0}
- Tiempo en plataforma: basado en actividad reciente`;
        break;

      case 'generate_summary':
        systemPrompt = `Eres un asistente educativo que genera resúmenes de lecciones.

CONTEXTO:
- Crea resúmenes claros y concisos
- Destaca los puntos clave
- Incluye ejemplos prácticos cuando sea posible

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": {
    "title": "string",
    "keyPoints": ["string"],
    "mainConcepts": [
      {
        "concept": "string",
        "explanation": "string",
        "example": "string"
      }
    ],
    "practicalApplications": ["string"]
  },
  "flashcards": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "nextSteps": ["string"]
}`;
        userPrompt = `Genera un resumen educativo para:
${context?.lessonContent || 'Contenido de lección no proporcionado'}`;
        break;

      case 'answer_question':
        systemPrompt = `Eres un tutor virtual experto en responder preguntas de estudiantes.

CONTEXTO:
- Responde de forma clara y didáctica
- Proporciona ejemplos cuando sea útil
- Sugiere recursos adicionales

FORMATO DE RESPUESTA (JSON estricto):
{
  "answer": {
    "main": "string - respuesta principal",
    "explanation": "string - explicación detallada",
    "examples": ["string"],
    "relatedConcepts": ["string"]
  },
  "confidence": 0-100,
  "suggestedResources": ["string"],
  "followUpQuestions": ["string"]
}`;
        userPrompt = `Pregunta del estudiante:
${context?.questionContent || 'Pregunta no proporcionada'}

Contexto del curso: ${courseId || 'general'}`;
        break;

      case 'suggest_next_steps':
        systemPrompt = `Eres un mentor de aprendizaje que sugiere próximos pasos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "nextSteps": [
    {
      "action": "string",
      "reason": "string",
      "priority": 1-5,
      "estimatedTime": "string"
    }
  ],
  "goals": {
    "shortTerm": ["string"],
    "longTerm": ["string"]
  },
  "challenges": [
    {
      "type": "quiz" | "project" | "reading",
      "title": "string",
      "description": "string"
    }
  ],
  "encouragement": "string"
}`;
        userPrompt = `Sugiere próximos pasos para un estudiante con:
- Progreso actual: ${context?.currentProgress || 0}%
- Cursos en progreso: ${context?.enrolledCourses?.join(', ') || 'ninguno'}
- Objetivos: ${context?.learningGoals?.join(', ') || 'mejorar habilidades'}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[academia-ai] Processing action: ${action}`);

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
      console.error('[academia-ai] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[academia-ai] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[academia-ai] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
