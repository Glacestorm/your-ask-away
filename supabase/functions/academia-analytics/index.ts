import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsRequest {
  action: "course_overview" | "student_performance" | "engagement_trends" | "content_effectiveness" | "predictive_insights";
  course_id?: string;
  user_id?: string;
  date_range?: { start: string; end: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, course_id, user_id, date_range } = await req.json() as AnalyticsRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch comprehensive data
    const [enrollmentsRes, lessonsRes, quizzesRes, emotionalRes] = await Promise.all([
      supabase.from("academia_enrollments")
        .select("*")
        .eq(course_id ? "course_id" : "id", course_id || "id"),
      supabase.from("academia_lesson_progress")
        .select("*")
        .eq(course_id ? "course_id" : "id", course_id || "id"),
      supabase.from("academia_quiz_attempts")
        .select("*, academia_quizzes(*)"),
      supabase.from("academia_emotional_analytics")
        .select("*")
        .eq(course_id ? "course_id" : "id", course_id || "id")
    ]);

    const analyticsData = {
      enrollments: enrollmentsRes.data || [],
      lessons: lessonsRes.data || [],
      quizzes: quizzesRes.data || [],
      emotional: emotionalRes.data || []
    };

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "course_overview":
        systemPrompt = `Eres un analista de datos educativos experto.
Genera un resumen ejecutivo del rendimiento del curso.

Responde SOLO con JSON válido.`;

        userPrompt = `Genera análisis del curso:

DATOS:
- Total matriculados: ${analyticsData.enrollments.length}
- Lecciones completadas: ${analyticsData.lessons.filter((l: any) => l.status === 'completed').length}
- Intentos de quiz: ${analyticsData.quizzes.length}
- Registros emocionales: ${analyticsData.emotional.length}

DETALLES:
${JSON.stringify({
  enrollments: analyticsData.enrollments.slice(0, 50),
  recent_activity: analyticsData.lessons.slice(-20),
  quiz_performance: analyticsData.quizzes.slice(-20)
}, null, 2)}

Retorna JSON:
{
  "overview": {
    "total_students": número,
    "active_students": número,
    "completion_rate": 0-100,
    "avg_progress": 0-100,
    "avg_quiz_score": 0-100,
    "engagement_score": 0-100
  },
  "trends": {
    "enrollment_trend": "growing"|"stable"|"declining",
    "completion_trend": "improving"|"stable"|"declining",
    "engagement_trend": "high"|"medium"|"low"
  },
  "highlights": [
    {
      "type": "success"|"warning"|"info",
      "title": "título",
      "description": "descripción",
      "metric": valor
    }
  ],
  "recommendations": [
    {
      "priority": "high"|"medium"|"low",
      "action": "acción recomendada",
      "expected_impact": "impacto esperado"
    }
  ]
}`;
        break;

      case "student_performance":
        systemPrompt = `Eres un analista de rendimiento estudiantil.
Analiza el desempeño individual de estudiantes con métricas detalladas.

Responde SOLO con JSON válido.`;

        userPrompt = `Analiza rendimiento de estudiantes:

DATOS:
${JSON.stringify({
  enrollments: analyticsData.enrollments,
  lessons_by_user: analyticsData.lessons.reduce((acc: any, l: any) => {
    acc[l.user_id] = acc[l.user_id] || [];
    acc[l.user_id].push(l);
    return acc;
  }, {}),
  quizzes_by_user: analyticsData.quizzes.reduce((acc: any, q: any) => {
    acc[q.user_id] = acc[q.user_id] || [];
    acc[q.user_id].push(q);
    return acc;
  }, {})
}, null, 2)}

Retorna JSON:
{
  "students": [
    {
      "user_id": "uuid",
      "performance_score": 0-100,
      "ranking": número,
      "percentile": 0-100,
      "metrics": {
        "progress": 0-100,
        "quiz_avg": 0-100,
        "engagement": 0-100,
        "consistency": 0-100
      },
      "strengths": ["fortalezas"],
      "areas_to_improve": ["áreas de mejora"],
      "learning_style": "visual"|"auditory"|"kinesthetic"|"mixed",
      "pace": "fast"|"normal"|"slow"
    }
  ],
  "class_distribution": {
    "top_performers": número,
    "average": número,
    "struggling": número,
    "at_risk": número
  },
  "insights": ["insights clave"]
}`;
        break;

      case "engagement_trends":
        systemPrompt = `Eres un experto en análisis de engagement educativo.
Identifica patrones de participación y tendencias temporales.

Responde SOLO con JSON válido.`;

        userPrompt = `Analiza tendencias de engagement:

DATOS EMOCIONALES:
${JSON.stringify(analyticsData.emotional.slice(-100), null, 2)}

ACTIVIDAD DE LECCIONES:
${JSON.stringify(analyticsData.lessons.slice(-100), null, 2)}

Retorna JSON:
{
  "engagement_metrics": {
    "current_score": 0-100,
    "trend": "up"|"stable"|"down",
    "change_percentage": número
  },
  "temporal_patterns": {
    "peak_hours": ["HH:MM"],
    "peak_days": ["día"],
    "avg_session_duration_minutes": número,
    "sessions_per_week": número
  },
  "emotional_distribution": {
    "engaged": porcentaje,
    "neutral": porcentaje,
    "confused": porcentaje,
    "frustrated": porcentaje,
    "tired": porcentaje
  },
  "content_engagement": [
    {
      "lesson_id": "uuid",
      "engagement_score": 0-100,
      "completion_rate": 0-100,
      "avg_time_spent": minutos
    }
  ],
  "alerts": [
    {
      "type": "low_engagement"|"high_frustration"|"declining_participation",
      "severity": "low"|"medium"|"high",
      "affected_users": número,
      "recommendation": "acción sugerida"
    }
  ]
}`;
        break;

      case "content_effectiveness":
        systemPrompt = `Eres un analista de efectividad de contenido educativo.
Evalúa qué contenido funciona mejor y por qué.

Responde SOLO con JSON válido.`;

        userPrompt = `Analiza efectividad del contenido:

PROGRESO DE LECCIONES:
${JSON.stringify(analyticsData.lessons, null, 2)}

RESULTADOS DE QUIZZES:
${JSON.stringify(analyticsData.quizzes, null, 2)}

Retorna JSON:
{
  "lessons_effectiveness": [
    {
      "lesson_id": "uuid",
      "effectiveness_score": 0-100,
      "completion_rate": 0-100,
      "avg_score_after": 0-100,
      "engagement_level": "high"|"medium"|"low",
      "common_struggles": ["dificultades"],
      "improvement_suggestions": ["sugerencias"]
    }
  ],
  "quiz_effectiveness": [
    {
      "quiz_id": "uuid",
      "difficulty_alignment": "too_easy"|"appropriate"|"too_hard",
      "avg_score": 0-100,
      "pass_rate": 0-100,
      "discrimination_index": 0-1,
      "problematic_questions": ["question_ids"]
    }
  ],
  "content_gaps": [
    {
      "topic": "tema",
      "gap_description": "descripción",
      "evidence": ["evidencia"],
      "recommended_action": "acción"
    }
  ],
  "top_performing_content": ["lesson_ids"],
  "needs_revision": ["lesson_ids"]
}`;
        break;

      case "predictive_insights":
        systemPrompt = `Eres un científico de datos educativos especializado en predicciones.
Genera insights predictivos sobre el curso y estudiantes.

Responde SOLO con JSON válido.`;

        userPrompt = `Genera insights predictivos:

DATOS HISTÓRICOS:
${JSON.stringify({
  enrollments: analyticsData.enrollments.length,
  completions: analyticsData.enrollments.filter((e: any) => e.status === 'completed').length,
  avg_progress: analyticsData.enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / (analyticsData.enrollments.length || 1),
  emotional_trends: analyticsData.emotional.slice(-50)
}, null, 2)}

Retorna JSON:
{
  "predictions": {
    "expected_completion_rate": 0-100,
    "expected_avg_score": 0-100,
    "churn_risk_students": número,
    "estimated_time_to_complete_avg": días
  },
  "forecasts": [
    {
      "metric": "nombre",
      "current_value": valor,
      "predicted_value_30d": valor,
      "predicted_value_90d": valor,
      "confidence": 0-1,
      "trend": "up"|"stable"|"down"
    }
  ],
  "opportunities": [
    {
      "type": "engagement"|"conversion"|"retention"|"satisfaction",
      "description": "oportunidad",
      "potential_impact": "alto"|"medio"|"bajo",
      "suggested_action": "acción"
    }
  ],
  "risks": [
    {
      "type": "churn"|"low_engagement"|"poor_performance",
      "probability": 0-1,
      "impact": "alto"|"medio"|"bajo",
      "mitigation": "estrategia de mitigación"
    }
  ]
}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[academia-analytics] Processing: ${action}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded" 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("[academia-analytics] Parse error:", parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[academia-analytics] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[academia-analytics] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
