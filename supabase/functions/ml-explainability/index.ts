import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExplainabilityRequest {
  modelType: 'credit_scoring' | 'churn_prediction' | 'anomaly_detection' | 'segmentation';
  companyId?: string;
  predictionData: Record<string, number>;
  method: 'shap' | 'lime' | 'both';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelType, companyId, predictionData, method } = await req.json() as ExplainabilityRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company data if provided
    let companyContext = {};
    if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (company) {
        companyContext = {
          name: company.name,
          sector: company.sector,
          facturacion: company.facturacion_anual,
          employees: company.employees,
          vinculacion: [company.vinculacion_entidad_1, company.vinculacion_entidad_2, company.vinculacion_entidad_3]
        };
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an ML Explainability Expert implementing SHAP and LIME analysis for banking models.
You must return a JSON object with the following structure:

{
  "shap_values": {
    "feature_contributions": [
      {"feature": "string", "contribution": number, "direction": "positive|negative", "importance_rank": number}
    ],
    "base_value": number,
    "output_value": number,
    "interaction_effects": [
      {"features": ["string", "string"], "interaction_value": number}
    ]
  },
  "lime_explanation": {
    "local_interpretable_model": "linear_regression",
    "feature_weights": [
      {"feature": "string", "weight": number, "confidence": number}
    ],
    "model_fidelity": number,
    "coverage": number
  },
  "summary": {
    "top_positive_factors": ["string"],
    "top_negative_factors": ["string"],
    "confidence_score": number,
    "explanation_text": "string"
  }
}`;

    const userPrompt = `Analyze the following prediction using ${method === 'both' ? 'SHAP and LIME' : method.toUpperCase()} explainability methods:

Model Type: ${modelType}
Prediction Data: ${JSON.stringify(predictionData, null, 2)}
Company Context: ${JSON.stringify(companyContext, null, 2)}

Generate realistic SHAP values showing feature contributions to the prediction, and LIME weights showing local feature importance.
For banking context, consider features like revenue, employees, sector risk, payment history, etc.`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Clean markdown
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const explainability = JSON.parse(content);

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'ml_explainability',
      table_name: 'ml_models',
      new_data: { modelType, method, companyId }
    });

    return new Response(JSON.stringify(explainability), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("ML Explainability error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
