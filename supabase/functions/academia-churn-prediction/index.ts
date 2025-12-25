import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChurnPredictionRequest {
  action: "predict" | "get_risk_factors" | "get_interventions";
  course_id?: string;
  user_id?: string;
  student_ids?: string[];
  timeframe_days?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, course_id, user_id, student_ids, timeframe_days = 30 } = 
      await req.json() as ChurnPredictionRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch student data
    let studentsQuery = supabase
      .from("academia_enrollments")
      .select(`
        *,
        academia_lesson_progress(*),
        academia_quiz_attempts(*),
        academia_emotional_analytics(*)
      `);

    if (course_id) {
      studentsQuery = studentsQuery.eq("course_id", course_id);
    }
    if (student_ids && student_ids.length > 0) {
      studentsQuery = studentsQuery.in("user_id", student_ids);
    }

    const { data: enrollments, error: enrollError } = await studentsQuery;
    if (enrollError) throw enrollError;

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "predict":
        systemPrompt = `Eres un experto en predicción de abandono educativo (churn).
Analiza los datos de estudiantes y predice la probabilidad de abandono.

FACTORES A CONSIDERAR:
1. Frecuencia de acceso: días desde última actividad
2. Progreso del curso: % completado vs tiempo transcurrido
3. Rendimiento en quizzes: puntuaciones y tendencias
4. Engagement emocional: niveles de frustración, confusión
5. Patrones de interacción: duración sesiones, horarios
6. Velocidad de progreso: lecciones/semana

NIVELES DE RIESGO:
- low: <20% probabilidad abandono
- medium: 20-50% probabilidad
- high: 50-80% probabilidad
- critical: >80% probabilidad

Responde SOLO con JSON válido.`;

        userPrompt = `Predice el riesgo de abandono para estos estudiantes:

DATOS DE ESTUDIANTES:
${JSON.stringify(enrollments?.map(e => ({
  user_id: e.user_id,
  course_id: e.course_id,
  progress: e.progress_percentage,
  status: e.status,
  last_accessed: e.last_accessed_at,
  enrolled_at: e.enrolled_at,
  lessons_completed: e.academia_lesson_progress?.length || 0,
  quiz_attempts: e.academia_quiz_attempts?.length || 0,
  avg_quiz_score: e.academia_quiz_attempts?.length > 0 
    ? e.academia_quiz_attempts.reduce((sum: number, q: any) => sum + (q.percentage || 0), 0) / e.academia_quiz_attempts.length 
    : null,
  emotional_states: e.academia_emotional_analytics?.slice(-5).map((em: any) => em.emotional_state) || []
})) || [], null, 2)}

TIMEFRAME: ${timeframe_days} días

Retorna JSON:
{
  "predictions": [
    {
      "user_id": "uuid",
      "course_id": "uuid",
      "churn_probability": 0-1,
      "risk_level": "low"|"medium"|"high"|"critical",
      "predicted_churn_date": "ISO date o null",
      "confidence": 0-1,
      "risk_factors": [
        {
          "factor": "nombre",
          "impact": 0-1,
          "description": "explicación"
        }
      ],
      "early_warning_signals": ["señales detectadas"]
    }
  ],
  "summary": {
    "total_analyzed": número,
    "high_risk_count": número,
    "avg_churn_probability": 0-1
  }
}`;
        break;

      case "get_risk_factors":
        systemPrompt = `Eres un analista educativo especializado en factores de riesgo de abandono.
Identifica y prioriza los factores que contribuyen al abandono estudiantil.

Responde SOLO con JSON válido.`;

        userPrompt = `Analiza los factores de riesgo para el estudiante:

USER_ID: ${user_id}
COURSE_ID: ${course_id}

DATOS:
${JSON.stringify(enrollments?.find(e => e.user_id === user_id) || {}, null, 2)}

Retorna JSON:
{
  "user_id": "uuid",
  "risk_factors": [
    {
      "category": "engagement"|"performance"|"emotional"|"temporal"|"behavioral",
      "factor": "nombre específico",
      "severity": "low"|"medium"|"high"|"critical",
      "current_value": valor actual,
      "threshold_value": valor umbral,
      "trend": "improving"|"stable"|"declining",
      "description": "explicación detallada",
      "data_points": ["evidencia específica"]
    }
  ],
  "overall_risk_score": 0-100,
  "primary_concern": "factor principal"
}`;
        break;

      case "get_interventions":
        systemPrompt = `Eres un experto en retención estudiantil y estrategias de intervención.
Genera intervenciones personalizadas basadas en los factores de riesgo identificados.

TIPOS DE INTERVENCIÓN:
1. Automatizada: emails, notificaciones push, recordatorios
2. Personal: contacto directo del instructor
3. Contenido: recursos adicionales, tutoriales
4. Gamificación: desafíos, incentivos, badges
5. Social: grupos de estudio, mentores peer

Responde SOLO con JSON válido.`;

        userPrompt = `Genera intervenciones para el estudiante en riesgo:

USER_ID: ${user_id}
COURSE_ID: ${course_id}

DATOS:
${JSON.stringify(enrollments?.find(e => e.user_id === user_id) || {}, null, 2)}

Retorna JSON:
{
  "user_id": "uuid",
  "interventions": [
    {
      "type": "automated"|"personal"|"content"|"gamification"|"social",
      "priority": 1-5,
      "action": "acción específica",
      "message_template": "mensaje sugerido",
      "timing": "cuándo ejecutar",
      "expected_impact": 0-1,
      "effort_required": "low"|"medium"|"high",
      "success_indicators": ["indicadores de éxito"]
    }
  ],
  "recommended_sequence": ["orden de intervenciones"],
  "escalation_plan": {
    "trigger": "cuándo escalar",
    "next_steps": ["acciones de escalación"]
  }
}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[academia-churn-prediction] Processing: ${action}`);

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
          error: "Rate limit exceeded",
          message: "Demasiadas solicitudes. Intenta más tarde."
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required",
          message: "Créditos de IA insuficientes."
        }), {
          status: 402,
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
      console.error("[academia-churn-prediction] Parse error:", parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[academia-churn-prediction] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[academia-churn-prediction] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
