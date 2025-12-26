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
    const { companyIds, prediction_horizon_days, min_probability, include_recommendations } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query for companies
    let query = supabase
      .from("companies")
      .select("*, company_products(*), company_bank_affiliations(*), visits(*)");

    if (companyIds && companyIds.length > 0) {
      query = query.in("id", companyIds);
    } else {
      query = query.limit(100);
    }

    const { data: companies } = await query;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Ets un expert en predicció de churn per a banca. Analitza els clients i prediu la probabilitat d'abandonament.

FACTORS DE CHURN A ANALITZAR:
1. Activitat recent: freqüència visites, interaccions
2. Evolució vinculació: canvis en % vinculació bancària
3. Productes: nombre i diversitat de productes
4. Rendibilitat: ingressos generats
5. Queixes/incidències: problemes reportats
6. Comportament comparatiu: vs clients similars
7. Canvis en facturació: tendència negocis client

NIVELLS DE RISC:
- low: <25% probabilitat churn
- medium: 25-50% probabilitat
- high: 50-75% probabilitat
- critical: >75% probabilitat

Respon NOMÉS amb JSON vàlid.`;

    const userPrompt = `Prediu el churn per als següents clients:

CLIENTS:
${JSON.stringify(companies?.map(c => ({
  id: c.id,
  name: c.name,
  sector: c.sector,
  facturacion_anual: c.facturacion_anual,
  ingresos_entidad_principal: c.ingresos_entidad_principal,
  vinculacion_entidad_1: c.vinculacion_entidad_1,
  products_count: c.company_products?.length || 0,
  recent_visits: c.visits?.filter((v: any) => new Date(v.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length || 0,
  last_visit: c.fecha_ultima_visita
})) || [], null, 2)}

CONFIG:
- Horitzó predicció: ${prediction_horizon_days || 90} dies
- Probabilitat mínima: ${min_probability || 0}
- Incloure recomanacions: ${include_recommendations ?? true}

Retorna JSON amb:
{
  "predictions": [
    {
      "company_id": "uuid",
      "company_name": "nom",
      "churn_probability": 0-1,
      "risk_level": "low"|"medium"|"high"|"critical",
      "predicted_churn_date": "ISO date o null",
      "confidence": 0-1,
      "contributing_factors": [
        {
          "factor": "nom factor",
          "impact": -1 a 1 (negatiu = contribueix a churn),
          "trend": "improving"|"stable"|"declining",
          "description": "explicació",
          "actionable": true/false
        }
      ],
      "retention_recommendations": [
        {
          "action": "acció recomanada",
          "expected_impact": reducció % churn esperada,
          "effort": "low"|"medium"|"high",
          "timeline": "temps implementació",
          "responsible": "rol responsable",
          "success_probability": 0-1
        }
      ],
      "lifetime_value_at_risk": valor € en risc,
      "early_warning_signals": ["senyals d'alerta primerenca"]
    }
  ],
  "summary": {
    "total_analyzed": número,
    "high_risk_count": número,
    "total_value_at_risk": € total
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
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Clean up AI response for JSON parsing
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Try to extract JSON object from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", content.substring(0, 500));
      throw new Error("Invalid AI response format");
    }
    
    let jsonContent = jsonMatch[0];
    
    // Fix common JSON issues from AI responses
    // Remove trailing commas before closing brackets
    jsonContent = jsonContent.replace(/,\s*([}\]])/g, '$1');
    // Fix unescaped quotes in strings (basic attempt)
    jsonContent = jsonContent.replace(/:\s*"([^"]*?)(?<!\\)"([^"]*?)"/g, ': "$1\\"$2"');
    
    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Attempted to parse:", jsonContent.substring(0, 1000));
      
      // Return a safe fallback response
      result = {
        predictions: [],
        summary: {
          total_analyzed: 0,
          high_risk_count: 0,
          total_value_at_risk: 0,
          error: "Failed to parse AI response"
        }
      };
    }

    // Log high-risk predictions
    const highRisk = result.predictions?.filter((p: any) => 
      p.risk_level === 'high' || p.risk_level === 'critical'
    ) || [];

    if (highRisk.length > 0) {
      await supabase.from("audit_logs").insert({
        action: "churn_prediction_alert",
        table_name: "companies",
        new_data: { 
          high_risk_count: highRisk.length,
          total_value_at_risk: result.summary?.total_value_at_risk 
        },
        category: "ai_analysis",
        severity: "warn"
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("predict-churn error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
