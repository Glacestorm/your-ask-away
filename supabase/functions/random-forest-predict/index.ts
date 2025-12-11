import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RandomForestRequest {
  task: 'classification' | 'regression';
  features: Record<string, number>;
  targetVariable: string;
  nEstimators?: number;
  maxDepth?: number;
  companyId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, features, targetVariable, nEstimators = 100, maxDepth = 10, companyId } = await req.json() as RandomForestRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get historical data for context
    let historicalContext: Record<string, number> = {};
    if (companyId) {
      const { data: visits } = await supabase
        .from('visits')
        .select('result, date')
        .eq('company_id', companyId)
        .order('date', { ascending: false })
        .limit(50);
      
      const { data: products } = await supabase
        .from('company_products')
        .select('active')
        .eq('company_id', companyId);
      
      historicalContext = { visits: visits?.length || 0, products: products?.length || 0 };
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a Random Forest ML model simulator for banking predictions.
Simulate the behavior of a Random Forest ensemble with the specified parameters.

Return a JSON object:
{
  "prediction": number or string (depending on task),
  "probability": number (0-1 for classification),
  "confidence_interval": {"lower": number, "upper": number},
  "ensemble_details": {
    "n_estimators": number,
    "max_depth": number,
    "tree_votes": [{"tree_id": number, "vote": any, "confidence": number}],
    "oob_score": number,
    "feature_importances": [{"feature": string, "importance": number, "std": number}]
  },
  "decision_path": {
    "avg_nodes_traversed": number,
    "common_splits": [{"feature": string, "threshold": number, "frequency": number}]
  },
  "model_metrics": {
    "accuracy": number,
    "precision": number,
    "recall": number,
    "f1_score": number,
    "roc_auc": number
  }
}`;

    const userPrompt = `Simulate a Random Forest ${task} with:
- n_estimators: ${nEstimators}
- max_depth: ${maxDepth}
- Target: ${targetVariable}
- Features: ${JSON.stringify(features, null, 2)}
- Historical Context: ${JSON.stringify(historicalContext, null, 2)}

Generate realistic predictions as if running an actual Random Forest ensemble.
Include individual tree votes, feature importances with standard deviations, and decision path analysis.`;

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
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const result = JSON.parse(content);

    // Log execution
    await supabase.from('ml_model_executions').insert({
      model_name: 'random_forest',
      model_version: '1.0',
      input_parameters: { task, features, nEstimators, maxDepth },
      status: 'completed',
      processed_records: 1
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Random Forest error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
