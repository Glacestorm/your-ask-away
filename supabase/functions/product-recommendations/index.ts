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
    const { companyId, max_recommendations, include_cross_sell, min_relevance } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company with products
    const { data: company } = await supabase
      .from("companies")
      .select("*, company_products(*, products(*))")
      .eq("id", companyId)
      .single();

    // Fetch all available products
    const { data: allProducts } = await supabase
      .from("products")
      .select("*")
      .eq("active", true);

    // Fetch similar companies (same sector/size)
    const { data: similarCompanies } = await supabase
      .from("companies")
      .select("*, company_products(*, products(*))")
      .eq("sector", company?.sector)
      .neq("id", companyId)
      .limit(20);

    // Fetch visit history for context
    const { data: visits } = await supabase
      .from("visits")
      .select("*")
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Ets un expert en banca comercial. Genera recomanacions de productes personalitzades basant-te en el perfil del client i patrons de clients similars.

FACTORS A CONSIDERAR:
1. Productes actuals del client (evitar redundància)
2. Productes adoptats per clients similars
3. Cicle de vida del client
4. Senyals de comportament (visites, necessitats detectades)
5. Potencial de cross-sell i up-sell

TIMING DE RECOMANACIÓ:
- immediate: necessitat urgent detectada
- short_term: 1-3 mesos
- medium_term: 3-6 mesos
- long_term: 6-12 mesos

Respon NOMÉS amb JSON vàlid.`;

    const currentProducts = company?.company_products?.map((cp: any) => cp.products?.name).filter(Boolean) || [];

    const userPrompt = `Genera recomanacions de productes per a:

EMPRESA:
${JSON.stringify({
  name: company?.name,
  sector: company?.sector,
  employees: company?.employees,
  facturacion_anual: company?.facturacion_anual,
  cnae: company?.cnae,
  client_type: company?.client_type
}, null, 2)}

PRODUCTES ACTUALS:
${JSON.stringify(currentProducts, null, 2)}

PRODUCTES DISPONIBLES:
${JSON.stringify(allProducts?.map(p => ({ id: p.id, name: p.name, category: p.category })) || [], null, 2)}

PRODUCTES ADOPTATS PER CLIENTS SIMILARS:
${JSON.stringify(
  similarCompanies?.flatMap((c: any) => 
    c.company_products?.map((cp: any) => cp.products?.name)
  ).filter(Boolean).reduce((acc: Record<string, number>, name: string) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {}),
  null, 2
)}

HISTORIAL VISITES:
${JSON.stringify(visits?.slice(0, 5) || [], null, 2)}

CONFIG:
- Màxim recomanacions: ${max_recommendations || 5}
- Incloure cross-sell: ${include_cross_sell ?? true}
- Rellevància mínima: ${min_relevance || 0.6}

Retorna JSON amb:
{
  "recommendations": [
    {
      "product_id": "uuid",
      "product_name": "nom producte",
      "category": "categoria",
      "relevance_score": 0-1,
      "estimated_value": valor anual estimat €,
      "conversion_probability": 0-1,
      "reasoning": ["motius recomanació"],
      "next_best_action": "acció suggerida per gestor",
      "timing_recommendation": "immediate"|"short_term"|"medium_term"|"long_term",
      "cross_sell_opportunities": ["productes relacionats"]
    }
  ],
  "context": {
    "company_profile": {
      "sector": "sector",
      "size": "micro/pyme/mitjana/gran",
      "lifecycle_stage": "nova/creixement/maduresa/declivi"
    },
    "behavioral_signals": ["senyals detectats"],
    "similar_companies_adopted": ["productes populars en sector"],
    "current_products": ["productes actuals"]
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
        max_tokens: 4000,
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
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("product-recommendations error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
