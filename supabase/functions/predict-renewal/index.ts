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
      renewal_id,
      company_id,
      include_scenario_analysis,
      include_competitor_risk,
      include_expansion_signals
    } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch renewal opportunity with company data
    let query = supabase
      .from("renewal_opportunities")
      .select(`
        *,
        company:companies(
          *,
          company_products(*),
          company_bank_affiliations(*),
          visits(*),
          support_tickets(*),
          health_scores(*),
          adoption_scores(*)
        ),
        nurturing_activities(*)
      `);

    let renewal: any;
    if (renewal_id) {
      const { data, error } = await query.eq("id", renewal_id).single();
      if (error || !data) throw new Error("Renewal opportunity not found");
      renewal = data;
    } else if (company_id) {
      const { data, error } = await query.eq("company_id", company_id).order("renewal_date", { ascending: true }).limit(1).single();
      if (error || !data) throw new Error("Renewal opportunity not found");
      renewal = data;
    } else {
      throw new Error("Either renewal_id or company_id is required");
    }

    const company = (renewal as any).company;
    
    // Calculate key metrics for prediction
    const metrics = calculateRenewalMetrics(renewal, company);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en predicción de renovaciones B2B/SaaS con conocimiento profundo en:

METODOLOGÍA DE PREDICCIÓN (basada en benchmarks de la industria):

1. MODELO DE PROBABILIDAD DE RENOVACIÓN:
   - Indicadores de estabilidad y satisfacción
   - Métricas de uso y adopción del producto
   - Salud de la relación (NPS, CSAT, engagement)
   - Historial de renovaciones previas
   - Tiempo hasta renovación y comportamiento pre-renovación

2. SEÑALES DE EXPANSIÓN vs CONTRACCIÓN:
   - Crecimiento del equipo y nuevos usuarios
   - Adopción de nuevas features
   - Solicitudes de capacidades adicionales
   - Comparación con peers del sector

3. ANÁLISIS DE ESCENARIOS:
   - Best case: condiciones óptimas
   - Base case: proyección realista
   - Worst case: factores de riesgo materializados
   - Early warning: señales a monitorear

4. FACTORES DE RIESGO COMPETITIVO:
   - Actividad de competidores en la cuenta
   - Cambios en el mercado
   - Presión de precios
   - Alternativas evaluadas

5. CALIBRACIÓN DEL MODELO:
   - AUC-ROC objetivo: 0.72-0.88
   - Brier Score objetivo: <0.15
   - Precisión@70% threshold: 75-85%

BENCHMARKS DE REFERENCIA:
- Churn SaaS promedio: 5-7% mensual
- Net Retention Rate objetivo: >110%
- Tiempo a valor: 6-9 meses
- ROI de programa de renovación: 3-5x

Responde SOLO con JSON válido.`;

    const userPrompt = `Predice el resultado de esta renovación:

DATOS DE LA RENOVACIÓN:
${JSON.stringify({
  renewal_id: renewal.id,
  mrr: renewal.mrr,
  renewal_date: renewal.renewal_date,
  days_until_renewal: Math.ceil((new Date(renewal.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  current_probability: renewal.probability,
  status: renewal.status,
  risk_factors: renewal.risk_factors,
  nurturing_activities_count: renewal.nurturing_activities?.length || 0,
  last_contact_date: renewal.last_contact_date
}, null, 2)}

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
  health_score: company.health_scores?.[0]?.overall_score,
  adoption_score: company.adoption_scores?.[0]?.overall_score,
  open_tickets: company.support_tickets?.filter((t: any) => t.status !== 'closed').length || 0,
  last_visit: company.fecha_ultima_visita
}, null, 2)}

MÉTRICAS CALCULADAS:
${JSON.stringify(metrics, null, 2)}

CONFIGURACIÓN:
- Incluir análisis de escenarios: ${include_scenario_analysis ?? true}
- Incluir riesgo competitivo: ${include_competitor_risk ?? true}
- Incluir señales de expansión: ${include_expansion_signals ?? true}

Retorna JSON con:
{
  "prediction": {
    "renewal_probability": 0-100,
    "confidence_level": 0-100,
    "predicted_outcome": "renew_expand"|"renew_flat"|"renew_contract"|"churn",
    "predicted_mrr_change": porcentaje de cambio,
    "risk_level": "low"|"medium"|"high"|"critical",
    "urgency": "immediate"|"this_week"|"this_month"|"standard"
  },
  "probability_breakdown": {
    "base_probability": 0-100,
    "usage_impact": -20 a +20,
    "relationship_impact": -20 a +20,
    "support_impact": -15 a +15,
    "timing_impact": -10 a +10,
    "competitive_impact": -15 a 0,
    "final_adjusted": 0-100
  },
  "scenario_analysis": {
    "best_case": {
      "probability": 0-100,
      "mrr_change": porcentaje,
      "conditions": ["condiciones necesarias"],
      "actions_required": ["acciones para lograr"]
    },
    "base_case": {
      "probability": 0-100,
      "mrr_change": porcentaje,
      "assumptions": ["supuestos"]
    },
    "worst_case": {
      "probability": 0-100,
      "mrr_change": porcentaje,
      "risk_triggers": ["triggers de riesgo"],
      "mitigation_actions": ["acciones de mitigación"]
    }
  },
  "feature_importances": [
    {
      "feature": "nombre del factor",
      "importance": 0-1,
      "direction": "positive"|"negative",
      "current_value": valor actual,
      "optimal_value": valor óptimo,
      "improvement_potential": potencial de mejora
    }
  ],
  "expansion_signals": [
    {
      "signal": "descripción",
      "strength": "weak"|"moderate"|"strong",
      "potential_revenue": euros adicionales,
      "recommended_action": "acción"
    }
  ],
  "contraction_risks": [
    {
      "risk": "descripción",
      "likelihood": "low"|"medium"|"high",
      "potential_impact": euros en riesgo,
      "prevention_action": "acción preventiva"
    }
  ],
  "competitive_analysis": {
    "competitive_pressure": "low"|"medium"|"high",
    "known_alternatives": ["alternativas identificadas"],
    "differentiation_opportunities": ["oportunidades de diferenciación"],
    "pricing_sensitivity": "low"|"medium"|"high"
  },
  "recommended_actions": [
    {
      "action": "acción específica",
      "priority": "immediate"|"high"|"medium"|"low",
      "owner": "rol responsable",
      "expected_impact_on_probability": +X puntos,
      "timing": "cuándo ejecutar",
      "success_metrics": ["métricas de éxito"]
    }
  ],
  "early_warning_signals": [
    {
      "signal": "señal a monitorear",
      "current_status": "green"|"yellow"|"red",
      "threshold": "umbral de alarma",
      "monitoring_frequency": "frecuencia de revisión"
    }
  ],
  "next_best_actions": {
    "immediate": ["acciones inmediatas (24-48h)"],
    "this_week": ["acciones esta semana"],
    "pre_renewal": ["acciones antes de renovación"]
  }
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

    // Update renewal with prediction
    await supabase
      .from("renewal_opportunities")
      .update({
        probability: result.prediction?.renewal_probability,
        predicted_outcome: result.prediction?.predicted_outcome,
        ai_analysis: result,
        updated_at: new Date().toISOString()
      })
      .eq("id", renewal.id);

    // Store prediction for analytics
    await supabase.from("analytics_predictions").insert({
      entity_type: "renewal",
      entity_id: renewal.id,
      prediction_type: "renewal_probability",
      model_name: "gemini-2.5-flash",
      predicted_value: result.prediction?.renewal_probability,
      predicted_category: result.prediction?.predicted_outcome,
      confidence_level: result.prediction?.confidence_level,
      prediction_horizon_days: Math.ceil((new Date(renewal.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      feature_importances: result.feature_importances,
      recommendations: result.recommended_actions
    });

    // Log the prediction
    await supabase.from("audit_logs").insert({
      action: "renewal_prediction_generated",
      table_name: "renewal_opportunities",
      record_id: renewal.id,
      new_data: { 
        probability: result.prediction?.renewal_probability,
        outcome: result.prediction?.predicted_outcome,
        risk_level: result.prediction?.risk_level
      },
      category: "ai_analysis",
      severity: result.prediction?.risk_level === 'critical' ? 'error' : 
                result.prediction?.risk_level === 'high' ? 'warn' : 'info'
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("predict-renewal error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateRenewalMetrics(renewal: any, company: any) {
  const now = new Date();
  const renewalDate = new Date(renewal.renewal_date);
  const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Visit frequency in last 90 days
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const recentVisits = company.visits?.filter((v: any) => new Date(v.date) > ninetyDaysAgo) || [];
  
  // Support ticket metrics
  const openTickets = company.support_tickets?.filter((t: any) => t.status !== 'closed') || [];
  const criticalTickets = openTickets.filter((t: any) => t.priority === 'critical' || t.priority === 'high');
  
  // Nurturing activity
  const activities = renewal.nurturing_activities || [];
  const recentActivities = activities.filter((a: any) => 
    new Date(a.activity_date) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  );
  
  // Calculate engagement score
  const engagementScore = Math.min(100, 
    (recentVisits.length * 15) + 
    (company.company_products?.length || 0) * 10 +
    (recentActivities.length * 20) -
    (criticalTickets.length * 25)
  );

  // Calculate relationship score
  const relationshipScore = Math.min(100,
    (company.vinculacion_entidad_1 || 0) +
    (company.health_scores?.[0]?.support_score || 50) / 2
  );

  // Calculate risk score
  const riskScore = Math.max(0,
    (criticalTickets.length * 20) +
    (daysUntilRenewal < 30 && recentActivities.length === 0 ? 30 : 0) +
    (company.segment === 'Lost' || company.segment === 'Inactivo' ? 40 : 0) +
    (engagementScore < 30 ? 20 : 0)
  );

  return {
    days_until_renewal: daysUntilRenewal,
    renewal_urgency: daysUntilRenewal < 30 ? 'critical' : daysUntilRenewal < 60 ? 'high' : daysUntilRenewal < 90 ? 'medium' : 'low',
    visit_frequency_90d: recentVisits.length,
    avg_visits_per_month: (recentVisits.length / 3).toFixed(1),
    product_count: company.company_products?.length || 0,
    relationship_depth: company.vinculacion_entidad_1 || 0,
    open_tickets: openTickets.length,
    critical_tickets: criticalTickets.length,
    nurturing_activities_30d: recentActivities.length,
    total_nurturing_activities: activities.length,
    engagement_score: engagementScore,
    relationship_score: relationshipScore,
    risk_score: Math.min(100, riskScore),
    health_score: company.health_scores?.[0]?.overall_score || 50,
    adoption_score: company.adoption_scores?.[0]?.overall_score || 50,
    revenue_at_risk: renewal.mrr * 12,
    customer_lifetime_months: company.created_at 
      ? Math.floor((now.getTime() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0
  };
}
