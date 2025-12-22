import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      company_id,
      include_ticket_analysis,
      include_visit_sentiment,
      include_communication_patterns,
      time_range_days
    } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const timeRangeDays = time_range_days || 90;
    const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch company with all interaction data
    const { data: company } = await supabase
      .from("companies")
      .select(`
        *,
        support_tickets(*),
        visits(*),
        satisfaction_surveys(*),
        health_scores(*)
      `)
      .eq("id", company_id)
      .single();

    if (!company) {
      throw new Error("Company not found");
    }

    // Filter recent interactions
    const recentTickets = company.support_tickets?.filter((t: any) => 
      new Date(t.created_at) >= new Date(startDate)
    ) || [];
    
    const recentVisits = company.visits?.filter((v: any) => 
      new Date(v.date) >= new Date(startDate)
    ) || [];

    const recentSurveys = company.satisfaction_surveys?.filter((s: any) => 
      new Date(s.created_at) >= new Date(startDate)
    ) || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en análisis de sentimiento del cliente con enfoque en Customer Success B2B.

METODOLOGÍA DE ANÁLISIS DE SENTIMIENTO (basada en Qualtrics y mejores prácticas):

1. Las emociones del cliente son 50% más predictivas de churn que las métricas de uso.

2. SEÑALES DE SENTIMIENTO A ANALIZAR:
   - Escalada de frustración en tickets de soporte a lo largo del tiempo
   - Degradación del sentimiento en comunicaciones
   - Cambios en nivel de satisfacción en encuestas
   - Tono emocional en feedback del producto

3. MONITOREO DE SALUD DE LA RELACIÓN EN TIEMPO REAL:
   - Correlación de tiempo de respuesta con deterioro del sentimiento
   - Patrones de frecuencia de comunicación y calidad del engagement
   - Cambios en complejidad del lenguaje y formalidad indicando distancia
   - Detección de señales de advocacy en comunicaciones

4. MÉTRICAS DE ÉXITO:
   - 32% mejora en precisión de predicción de churn combinando sentimiento + uso
   - 45% más rápido identificación de clientes en riesgo
   - 28% incremento en satisfacción del cliente
   - 60% mejora en lifetime value

Responde SOLO con JSON válido.`;

    const userPrompt = `Analiza el sentimiento de este cliente:

DATOS DEL CLIENTE:
${JSON.stringify({
  id: company.id,
  name: company.name,
  sector: company.sector,
  segment: company.segment,
  health_score: company.health_scores?.[0]?.overall_score
}, null, 2)}

TICKETS DE SOPORTE (últimos ${timeRangeDays} días):
${JSON.stringify(recentTickets.map((t: any) => ({
  id: t.id,
  subject: t.subject,
  description: t.description?.substring(0, 200),
  priority: t.priority,
  status: t.status,
  created_at: t.created_at,
  category: t.category
})), null, 2)}

VISITAS RECIENTES:
${JSON.stringify(recentVisits.map((v: any) => ({
  id: v.id,
  date: v.date,
  result: v.result,
  notes: v.notes?.substring(0, 200),
  next_steps: v.next_steps?.substring(0, 200)
})), null, 2)}

ENCUESTAS DE SATISFACCIÓN:
${JSON.stringify(recentSurveys.map((s: any) => ({
  score: s.score,
  feedback: s.feedback?.substring(0, 200),
  survey_type: s.survey_type,
  created_at: s.created_at
})), null, 2)}

CONFIGURACIÓN:
- Incluir análisis de tickets: ${include_ticket_analysis ?? true}
- Incluir sentimiento de visitas: ${include_visit_sentiment ?? true}
- Incluir patrones de comunicación: ${include_communication_patterns ?? true}
- Rango de tiempo: ${timeRangeDays} días

Retorna JSON con:
{
  "overall_sentiment": {
    "score": -1 a 1 (-1 muy negativo, 0 neutral, 1 muy positivo),
    "trend": "improving"|"stable"|"declining",
    "trend_velocity": "slow"|"moderate"|"fast",
    "confidence": 0-100
  },
  "sentiment_breakdown": {
    "support_sentiment": {
      "score": -1 a 1,
      "key_issues": ["problemas principales"],
      "frustration_level": "low"|"medium"|"high"|"critical",
      "resolution_satisfaction": 0-100
    },
    "relationship_sentiment": {
      "score": -1 a 1,
      "engagement_quality": "low"|"medium"|"high",
      "communication_tone": "formal"|"neutral"|"friendly"|"cold",
      "advocacy_signals": ["señales de advocacy detectadas"]
    },
    "product_sentiment": {
      "score": -1 a 1,
      "adoption_satisfaction": 0-100,
      "feature_feedback": ["feedback sobre features"]
    }
  },
  "emotional_journey": [
    {
      "period": "período (ej: 'últimas 2 semanas')",
      "sentiment_score": -1 a 1,
      "key_events": ["eventos clave"],
      "emotional_state": "satisfied"|"neutral"|"frustrated"|"at_risk"
    }
  ],
  "churn_risk_indicators": {
    "sentiment_based_risk": "low"|"medium"|"high"|"critical",
    "risk_score": 0-100,
    "warning_signals": [
      {
        "signal": "descripción",
        "severity": "info"|"warning"|"critical",
        "first_detected": "fecha aproximada",
        "trend": "improving"|"stable"|"worsening"
      }
    ]
  },
  "communication_patterns": {
    "response_time_trend": "improving"|"stable"|"declining",
    "communication_frequency": "increasing"|"stable"|"decreasing",
    "formality_changes": "becoming_more_formal"|"stable"|"becoming_less_formal",
    "engagement_depth": "shallow"|"moderate"|"deep"
  },
  "actionable_insights": [
    {
      "insight": "insight accionable",
      "urgency": "immediate"|"high"|"medium"|"low",
      "recommended_action": "acción recomendada",
      "expected_impact": "impacto esperado en sentimiento",
      "owner": "rol responsable"
    }
  ],
  "sentiment_drivers": {
    "positive_drivers": [
      {
        "driver": "factor positivo",
        "impact": 0-100,
        "sustainability": "low"|"medium"|"high"
      }
    ],
    "negative_drivers": [
      {
        "driver": "factor negativo",
        "impact": 0-100,
        "addressability": "easy"|"moderate"|"difficult"
      }
    ]
  },
  "recovery_opportunities": [
    {
      "opportunity": "oportunidad de recuperación",
      "potential_sentiment_improvement": puntos de mejora,
      "effort_required": "low"|"medium"|"high",
      "timeline": "tiempo estimado"
    }
  ],
  "next_best_actions": [
    {
      "action": "acción específica",
      "timing": "cuándo ejecutar",
      "channel": "email"|"call"|"meeting"|"in_app",
      "message_tone": "tono recomendado para el mensaje",
      "success_probability": 0-100
    }
  ]
}`;

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
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const result = JSON.parse(content);

    // Update health score with sentiment data
    if (company.health_scores?.[0]) {
      await supabase
        .from("health_scores")
        .update({
          sentiment_score: Math.round((result.overall_sentiment?.score + 1) * 50), // Convert -1,1 to 0-100
          updated_at: new Date().toISOString()
        })
        .eq("id", company.health_scores[0].id);
    }

    // Log critical sentiment findings
    if (result.churn_risk_indicators?.sentiment_based_risk === 'critical' || 
        result.churn_risk_indicators?.sentiment_based_risk === 'high') {
      await supabase.from("audit_logs").insert({
        action: "sentiment_risk_detected",
        table_name: "companies",
        record_id: company_id,
        new_data: { 
          sentiment_score: result.overall_sentiment?.score,
          risk_level: result.churn_risk_indicators?.sentiment_based_risk,
          warning_signals: result.churn_risk_indicators?.warning_signals?.length
        },
        category: "ai_analysis",
        severity: result.churn_risk_indicators?.sentiment_based_risk === 'critical' ? 'error' : 'warn'
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-customer-sentiment error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
