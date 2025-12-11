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
    const { companyId, config } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch transaction/visit data for the company
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - (config?.lookback_days || 90));

    const { data: visits } = await supabase
      .from("visits")
      .select("*")
      .eq("company_id", companyId)
      .gte("date", lookbackDate.toISOString().split('T')[0]);

    const { data: visitSheets } = await supabase
      .from("visit_sheets")
      .select("*")
      .eq("company_id", companyId)
      .gte("created_at", lookbackDate.toISOString());

    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Ets un expert en detecció de frau i anomalies en banca. Analitza les dades i detecta patrons anòmals.

TIPUS D'ANOMALIES A DETECTAR:
1. velocity: canvis sobtats en freqüència de transaccions/visites
2. amount: imports fora del rang normal
3. pattern: canvis en patrons de comportament
4. geographic: activitat en ubicacions inusuals
5. behavioral: canvis en comportament del client

NIVELLS DE SEVERITAT:
- low: anomalia menor, monitoritzar
- medium: requereix atenció
- high: investigar immediatament
- critical: possible frau, acció urgent

Respon NOMÉS amb JSON vàlid.`;

    const userPrompt = `Analitza les següents dades per detectar anomalies:

EMPRESA:
${JSON.stringify(company, null, 2)}

VISITES (últims ${config?.lookback_days || 90} dies):
${JSON.stringify(visits || [], null, 2)}

FITXES DE VISITA:
${JSON.stringify(visitSheets || [], null, 2)}

CONFIG SENSIBILITAT: ${config?.sensitivity || 'medium'}
CONFIANÇA MÍNIMA: ${config?.min_confidence || 0.7}

Retorna JSON amb:
{
  "anomalies": [
    {
      "anomaly_id": "uuid",
      "type": "velocity"|"amount"|"pattern"|"geographic"|"behavioral",
      "severity": "low"|"medium"|"high"|"critical",
      "confidence": 0-1,
      "description": "descripció anomalia",
      "detected_at": "ISO date",
      "transaction_ids": ["ids relacionats"],
      "indicators": [
        {
          "name": "nom indicador",
          "value": valor actual,
          "threshold": valor llindar,
          "deviation": desviació estàndard,
          "historical_baseline": valor històric normal
        }
      ],
      "recommended_actions": ["accions recomanades"],
      "false_positive_likelihood": 0-1
    }
  ],
  "summary": {
    "total_anomalies": número,
    "critical_count": número,
    "high_count": número,
    "analysis_period": "dates",
    "data_points_analyzed": número
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

    // Log critical anomalies
    const criticalAnomalies = result.anomalies?.filter((a: any) => 
      a.severity === 'critical' || a.severity === 'high'
    ) || [];

    if (criticalAnomalies.length > 0) {
      await supabase.from("audit_logs").insert({
        action: "anomaly_detected",
        table_name: "companies",
        record_id: companyId,
        new_data: { anomalies: criticalAnomalies },
        category: "security",
        severity: "warn"
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("detect-anomalies error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
