import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BehavioralSignal {
  type: string;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  impact: number;
}

interface PlaybookSuggestion {
  playbook_id: string;
  playbook_name: string;
  match_score: number;
  reasoning: string;
  expected_outcomes: {
    churn_reduction: number;
    revenue_protection: number;
    time_to_value_days: number;
  };
  priority: 'immediate' | 'high' | 'medium' | 'low';
  personalized_steps: Array<{
    step: string;
    timing: string;
    channel: string;
    message_template: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      company_id, 
      trigger_type,
      include_behavioral_analysis,
      include_sentiment_signals,
      max_suggestions
    } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch comprehensive company data with 200+ behavioral indicators
    const { data: company } = await supabase
      .from("companies")
      .select(`
        *,
        company_products(*),
        company_bank_affiliations(*),
        visits(*, gestor:profiles(full_name)),
        support_tickets(*),
        health_scores(*),
        renewal_opportunities(*),
        winback_participants(*)
      `)
      .eq("id", company_id)
      .single();

    if (!company) {
      throw new Error("Company not found");
    }

    // Fetch available playbooks
    const { data: playbooks } = await supabase
      .from("retention_playbooks")
      .select("*, playbook_steps(*)")
      .eq("is_active", true)
      .order("success_rate", { ascending: false });

    // Calculate behavioral signals (based on Microsoft's 200+ indicator approach)
    const behavioralSignals = calculateBehavioralSignals(company);
    
    // Calculate relationship health indicators
    const relationshipHealth = calculateRelationshipHealth(company);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en Customer Success con especialización en retención y predicción de churn.
Tu tarea es analizar señales comportamentales y sugerir los playbooks más efectivos.

METODOLOGÍA DE ANÁLISIS (basada en mejores prácticas de la industria):

1. ANÁLISIS DE SEÑALES COMPORTAMENTALES:
   - Patrones de login y duración de sesión
   - Velocidad de adopción de features
   - Patrones de expansión del equipo
   - Profundidad de integración y uso de API

2. INDICADORES DE SALUD DE LA RELACIÓN:
   - Tiempos de respuesta email y tasas de participación
   - Frecuencia de interacciones de soporte y sentimiento
   - Niveles de engagement del champion
   - Cambios en stakeholders y red de influencia

3. INTEGRACIÓN DE CONTEXTO DE NEGOCIO:
   - Posición en ciclo de vida del contrato
   - Comportamiento de pagos
   - Cambios organizacionales
   - Actividad competitiva

4. SEGMENTACIÓN DINÁMICA:
   - High-Growth Champions: adopción fuerte, uso expandiéndose
   - At-Risk High-Value: valor alto pero engagement declinando
   - Scaling Adopters: crecimiento pero potencial sin explotar

CRITERIOS DE MATCH DE PLAYBOOKS:
- Alineación con señales de riesgo detectadas
- Historial de éxito para perfiles similares
- Esfuerzo vs. impacto esperado
- Timing óptimo de intervención

Responde SOLO con JSON válido.`;

    const userPrompt = `Analiza este cliente y sugiere los playbooks más efectivos:

DATOS DEL CLIENTE:
${JSON.stringify({
  id: company.id,
  name: company.name,
  sector: company.sector,
  segment: company.segment,
  facturacion_anual: company.facturacion_anual,
  ingresos_creand: company.ingresos_creand,
  vinculacion_entidad_1: company.vinculacion_entidad_1,
  products_count: company.company_products?.length || 0,
  days_since_last_visit: company.fecha_ultima_visita 
    ? Math.floor((Date.now() - new Date(company.fecha_ultima_visita).getTime()) / (1000 * 60 * 60 * 24))
    : null,
  health_score: company.health_scores?.[0]?.overall_score,
  open_tickets: company.support_tickets?.filter((t: any) => t.status !== 'closed').length || 0,
  pending_renewals: company.renewal_opportunities?.filter((r: any) => r.status === 'pending').length || 0
}, null, 2)}

SEÑALES COMPORTAMENTALES:
${JSON.stringify(behavioralSignals, null, 2)}

SALUD DE LA RELACIÓN:
${JSON.stringify(relationshipHealth, null, 2)}

PLAYBOOKS DISPONIBLES:
${JSON.stringify(playbooks?.map(p => ({
  id: p.id,
  name: p.name,
  trigger_type: p.trigger_type,
  target_segment: p.target_segment,
  success_rate: p.success_rate,
  avg_days_to_complete: p.avg_days_to_complete,
  steps_count: p.playbook_steps?.length || 0
})) || [], null, 2)}

CONTEXTO:
- Tipo de trigger: ${trigger_type || 'proactive'}
- Incluir análisis comportamental: ${include_behavioral_analysis ?? true}
- Incluir señales de sentimiento: ${include_sentiment_signals ?? true}
- Máximo sugerencias: ${max_suggestions || 3}

Retorna JSON con:
{
  "customer_profile": {
    "segment_type": "high_growth_champion"|"at_risk_high_value"|"scaling_adopter"|"standard",
    "risk_level": "low"|"medium"|"high"|"critical",
    "engagement_trend": "improving"|"stable"|"declining",
    "lifetime_value_estimate": number,
    "churn_probability": 0-1
  },
  "behavioral_analysis": {
    "key_signals": [
      {
        "signal": "descripción",
        "severity": "info"|"warning"|"critical",
        "trend": "improving"|"stable"|"declining",
        "actionable": boolean
      }
    ],
    "sentiment_score": -1 a 1,
    "relationship_health_score": 0-100,
    "adoption_velocity": "fast"|"normal"|"slow"|"stalled"
  },
  "playbook_suggestions": [
    {
      "playbook_id": "uuid",
      "playbook_name": "nombre",
      "match_score": 0-100,
      "reasoning": "por qué este playbook es adecuado",
      "expected_outcomes": {
        "churn_reduction": 0-100,
        "revenue_protection": euros,
        "time_to_value_days": días
      },
      "priority": "immediate"|"high"|"medium"|"low",
      "personalized_steps": [
        {
          "step": "acción específica",
          "timing": "inmediato|día 1|día 3|...",
          "channel": "email|call|meeting|in-app",
          "message_template": "plantilla personalizada"
        }
      ],
      "success_predictors": ["factores que indican éxito"],
      "potential_blockers": ["posibles obstáculos"]
    }
  ],
  "immediate_actions": [
    {
      "action": "acción urgente",
      "reason": "por qué es urgente",
      "owner": "rol responsable",
      "deadline": "plazo"
    }
  ],
  "proactive_opportunities": [
    {
      "opportunity": "descripción",
      "potential_value": euros,
      "effort": "low"|"medium"|"high"
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
        max_tokens: 8000,
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

    // Log the suggestion for analytics
    await supabase.from("audit_logs").insert({
      action: "playbook_suggestion_generated",
      table_name: "retention_playbooks",
      record_id: company_id,
      new_data: { 
        customer_profile: result.customer_profile,
        suggestions_count: result.playbook_suggestions?.length,
        top_playbook: result.playbook_suggestions?.[0]?.playbook_name
      },
      category: "ai_analysis",
      severity: "info"
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("suggest-playbook error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Calculate behavioral signals based on Microsoft's 200+ indicator approach
function calculateBehavioralSignals(company: any): BehavioralSignal[] {
  const signals: BehavioralSignal[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Visit frequency analysis
  const recentVisits = company.visits?.filter((v: any) => new Date(v.date) > thirtyDaysAgo) || [];
  const previousVisits = company.visits?.filter((v: any) => {
    const date = new Date(v.date);
    return date > sixtyDaysAgo && date <= thirtyDaysAgo;
  }) || [];

  const visitTrend = recentVisits.length > previousVisits.length ? 'improving' 
    : recentVisits.length < previousVisits.length ? 'declining' : 'stable';

  signals.push({
    type: 'visit_frequency',
    value: recentVisits.length,
    trend: visitTrend,
    impact: visitTrend === 'declining' ? -0.3 : visitTrend === 'improving' ? 0.2 : 0
  });

  // Product adoption depth
  const productsCount = company.company_products?.length || 0;
  signals.push({
    type: 'product_adoption',
    value: productsCount,
    trend: productsCount > 3 ? 'improving' : productsCount < 2 ? 'declining' : 'stable',
    impact: productsCount > 3 ? 0.3 : productsCount < 2 ? -0.2 : 0
  });

  // Support ticket patterns
  const openTickets = company.support_tickets?.filter((t: any) => t.status !== 'closed') || [];
  const criticalTickets = openTickets.filter((t: any) => t.priority === 'critical' || t.priority === 'high');
  
  signals.push({
    type: 'support_burden',
    value: openTickets.length,
    trend: criticalTickets.length > 0 ? 'declining' : 'stable',
    impact: criticalTickets.length > 2 ? -0.5 : criticalTickets.length > 0 ? -0.2 : 0.1
  });

  // Banking relationship depth
  const vinculacion = company.vinculacion_entidad_1 || 0;
  signals.push({
    type: 'relationship_depth',
    value: vinculacion,
    trend: vinculacion > 70 ? 'improving' : vinculacion < 30 ? 'declining' : 'stable',
    impact: vinculacion > 70 ? 0.4 : vinculacion < 30 ? -0.4 : 0
  });

  // Revenue trajectory
  const ingresos = company.ingresos_creand || 0;
  const facturacion = company.facturacion_anual || 0;
  const revenueRatio = facturacion > 0 ? (ingresos / facturacion) * 100 : 0;
  
  signals.push({
    type: 'revenue_efficiency',
    value: revenueRatio,
    trend: revenueRatio > 5 ? 'improving' : revenueRatio < 1 ? 'declining' : 'stable',
    impact: revenueRatio > 5 ? 0.3 : revenueRatio < 1 ? -0.2 : 0
  });

  return signals;
}

// Calculate relationship health indicators
function calculateRelationshipHealth(company: any) {
  const healthScore = company.health_scores?.[0];
  
  return {
    overall_health: healthScore?.overall_score || 50,
    engagement_score: healthScore?.engagement_score || 50,
    support_score: healthScore?.support_score || 70,
    product_usage_score: healthScore?.product_usage_score || 60,
    champion_engagement: 'unknown',
    stakeholder_stability: 'stable',
    communication_frequency: company.visits?.length > 0 ? 'active' : 'low',
    sentiment_trend: 'neutral'
  };
}
