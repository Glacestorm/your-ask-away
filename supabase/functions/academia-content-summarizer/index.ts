import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContentSummarizerRequest {
  action: "summarize_lesson" | "summarize_module" | "generate_study_guide" | "create_flashcards" | "extract_key_concepts";
  lesson_id?: string;
  module_id?: string;
  course_id?: string;
  content?: string;
  options?: {
    length?: "brief" | "standard" | "detailed";
    format?: "text" | "bullets" | "outline";
    language?: string;
    include_examples?: boolean;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, lesson_id, module_id, course_id, content, options = {} } = 
      await req.json() as ContentSummarizerRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch content based on parameters
    let sourceContent = content || "";
    let contextData: any = {};

    if (lesson_id) {
      const { data: lesson } = await supabase
        .from("academia_lessons")
        .select("*, academia_modules(*), academia_courses(*)")
        .eq("id", lesson_id)
        .single();
      
      if (lesson) {
        sourceContent = lesson.content || "";
        contextData = {
          title: lesson.title,
          module: lesson.academia_modules?.title,
          course: lesson.academia_courses?.title,
          duration: lesson.duration_minutes
        };
      }
    }

    if (module_id) {
      const { data: module } = await supabase
        .from("academia_modules")
        .select("*, academia_lessons(*), academia_courses(*)")
        .eq("id", module_id)
        .single();
      
      if (module) {
        sourceContent = module.academia_lessons?.map((l: any) => l.content).join("\n\n") || "";
        contextData = {
          title: module.title,
          course: module.academia_courses?.title,
          lessons_count: module.academia_lessons?.length
        };
      }
    }

    const { length = "standard", format = "text", language = "es", include_examples = true } = options;

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "summarize_lesson":
        systemPrompt = `Eres un experto en síntesis de contenido educativo.
Crea resúmenes claros, concisos y pedagógicamente efectivos.
Idioma: ${language}

Responde SOLO con JSON válido.`;

        userPrompt = `Resume la siguiente lección:

CONTEXTO:
${JSON.stringify(contextData, null, 2)}

CONTENIDO:
${sourceContent}

OPCIONES:
- Longitud: ${length}
- Formato: ${format}
- Incluir ejemplos: ${include_examples}

Retorna JSON:
{
  "summary": {
    "title": "título del resumen",
    "main_points": ["puntos principales"],
    "key_takeaways": ["conclusiones clave"],
    "content": "resumen en formato ${format}"
  },
  "learning_objectives": ["objetivos cubiertos"],
  "difficulty_level": "beginner"|"intermediate"|"advanced",
  "estimated_read_time_minutes": número,
  "related_topics": ["temas relacionados"],
  "review_questions": [
    {
      "question": "pregunta",
      "answer_hint": "pista de respuesta"
    }
  ]
}`;
        break;

      case "summarize_module":
        systemPrompt = `Eres un experto en síntesis de módulos educativos.
Crea resúmenes integradores que conecten las lecciones del módulo.
Idioma: ${language}

Responde SOLO con JSON válido.`;

        userPrompt = `Resume el siguiente módulo:

CONTEXTO:
${JSON.stringify(contextData, null, 2)}

CONTENIDO DE LECCIONES:
${sourceContent}

OPCIONES:
- Longitud: ${length}
- Formato: ${format}

Retorna JSON:
{
  "module_summary": {
    "title": "título",
    "overview": "visión general del módulo",
    "lessons_covered": número,
    "main_themes": ["temas principales"],
    "progression": "cómo se conectan las lecciones"
  },
  "lesson_summaries": [
    {
      "lesson_number": número,
      "title": "título",
      "key_points": ["puntos clave"],
      "connection_to_next": "conexión con siguiente lección"
    }
  ],
  "module_objectives_achieved": ["objetivos logrados"],
  "preparation_for_next_module": "preparación para siguiente módulo",
  "assessment_readiness": {
    "ready": true/false,
    "areas_to_review": ["áreas a repasar"]
  }
}`;
        break;

      case "generate_study_guide":
        systemPrompt = `Eres un experto en creación de guías de estudio.
Genera guías estructuradas, prácticas y orientadas al aprendizaje efectivo.
Idioma: ${language}

Responde SOLO con JSON válido.`;

        userPrompt = `Genera una guía de estudio:

CONTENIDO:
${sourceContent}

CONTEXTO:
${JSON.stringify(contextData, null, 2)}

Retorna JSON:
{
  "study_guide": {
    "title": "título de la guía",
    "objectives": ["objetivos de aprendizaje"],
    "prerequisites": ["conocimientos previos"],
    "estimated_study_time": "tiempo estimado"
  },
  "sections": [
    {
      "title": "título sección",
      "content_summary": "resumen",
      "key_terms": [
        {
          "term": "término",
          "definition": "definición"
        }
      ],
      "examples": ["ejemplos"],
      "practice_exercises": [
        {
          "type": "exercise"|"reflection"|"application",
          "instruction": "instrucción",
          "expected_outcome": "resultado esperado"
        }
      ]
    }
  ],
  "review_checklist": ["items de repaso"],
  "common_mistakes": ["errores comunes a evitar"],
  "additional_resources": [
    {
      "type": "book"|"video"|"article"|"tool",
      "title": "título",
      "description": "descripción"
    }
  ],
  "self_assessment": {
    "questions": ["preguntas de autoevaluación"],
    "mastery_indicators": ["indicadores de dominio"]
  }
}`;
        break;

      case "create_flashcards":
        systemPrompt = `Eres un experto en creación de flashcards educativas.
Genera tarjetas de memoria efectivas usando técnicas de repetición espaciada.
Idioma: ${language}

Responde SOLO con JSON válido.`;

        userPrompt = `Crea flashcards del contenido:

CONTENIDO:
${sourceContent}

CONTEXTO:
${JSON.stringify(contextData, null, 2)}

Retorna JSON:
{
  "flashcard_set": {
    "title": "título del set",
    "topic": "tema",
    "total_cards": número,
    "difficulty": "beginner"|"intermediate"|"advanced"
  },
  "flashcards": [
    {
      "id": número,
      "front": "pregunta o concepto",
      "back": "respuesta o explicación",
      "hint": "pista opcional",
      "category": "categoría",
      "difficulty": 1-5,
      "tags": ["etiquetas"]
    }
  ],
  "study_tips": ["consejos de estudio"],
  "recommended_schedule": {
    "initial_review": "cuándo",
    "first_repetition": "cuándo",
    "subsequent_reviews": ["programa"]
  }
}`;
        break;

      case "extract_key_concepts":
        systemPrompt = `Eres un experto en extracción de conceptos clave educativos.
Identifica y estructura los conceptos fundamentales del contenido.
Idioma: ${language}

Responde SOLO con JSON válido.`;

        userPrompt = `Extrae conceptos clave:

CONTENIDO:
${sourceContent}

CONTEXTO:
${JSON.stringify(contextData, null, 2)}

Retorna JSON:
{
  "concepts": [
    {
      "name": "nombre del concepto",
      "definition": "definición clara",
      "importance": "high"|"medium"|"low",
      "category": "categoría",
      "related_concepts": ["conceptos relacionados"],
      "examples": ["ejemplos"],
      "common_misconceptions": ["malentendidos comunes"],
      "real_world_applications": ["aplicaciones"]
    }
  ],
  "concept_map": {
    "central_theme": "tema central",
    "main_branches": [
      {
        "branch": "rama",
        "concepts": ["conceptos en esta rama"]
      }
    ],
    "connections": [
      {
        "from": "concepto A",
        "to": "concepto B",
        "relationship": "tipo de relación"
      }
    ]
  },
  "learning_path": {
    "sequence": ["orden recomendado de conceptos"],
    "dependencies": [
      {
        "concept": "concepto",
        "requires": ["conceptos previos necesarios"]
      }
    ]
  },
  "assessment_focus": ["conceptos clave para evaluación"]
}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[academia-content-summarizer] Processing: ${action}`);

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
    let aiContent = aiResponse.choices?.[0]?.message?.content || "";
    aiContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("[academia-content-summarizer] Parse error:", parseError);
      result = { rawContent: aiContent, parseError: true };
    }

    console.log(`[academia-content-summarizer] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[academia-content-summarizer] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
