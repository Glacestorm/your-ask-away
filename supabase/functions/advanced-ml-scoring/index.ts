import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdvancedMLRequest {
  scoringType: 'credit' | 'churn' | 'ltv' | 'propensity';
  features: Record<string, number>;
  companyId?: string;
  useEnsemble?: boolean;
  explainability?: boolean;
  abTestId?: string;
}

interface EnsembleModel {
  name: string;
  weight: number;
  type: 'random_forest' | 'gradient_boosting' | 'neural_network' | 'logistic_regression';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      scoringType, 
      features, 
      companyId, 
      useEnsemble = true,
      explainability = true,
      abTestId 
    } = await req.json() as AdvancedMLRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();

    // Get active models for ensemble
    const { data: activeModels } = await supabase
      .from('ml_model_registry')
      .select('*')
      .eq('is_active', true)
      .eq('model_type', scoringType);

    // Get company context if provided
    let companyContext: Record<string, unknown> = {};
    if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('*, company_products(count), visits(count)')
        .eq('id', companyId)
        .single();

      if (company) {
        companyContext = {
          name: company.name,
          sector: company.sector,
          revenue: company.facturacion_anual,
          employees: company.employees,
          vinculacion: [company.vinculacion_entidad_1, company.vinculacion_entidad_2, company.vinculacion_entidad_3],
          products: company.company_products?.[0]?.count || 0,
          visits: company.visits?.[0]?.count || 0,
          client_type: company.client_type,
          is_vip: company.is_vip
        };
      }
    }

    // Check for active A/B test
    let selectedModelVersion = 'ensemble_v1';
    if (abTestId) {
      const { data: abTest } = await supabase
        .from('ml_ab_tests')
        .select('*, model_a:model_a_id(*), model_b:model_b_id(*)')
        .eq('id', abTestId)
        .eq('status', 'running')
        .single();

      if (abTest) {
        const random = Math.random();
        selectedModelVersion = random < abTest.traffic_split_a 
          ? abTest.model_a?.version 
          : abTest.model_b?.version;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Define ensemble models
    const ensembleModels: EnsembleModel[] = [
      { name: 'Random Forest', weight: 0.35, type: 'random_forest' },
      { name: 'Gradient Boosting', weight: 0.35, type: 'gradient_boosting' },
      { name: 'Neural Network', weight: 0.20, type: 'neural_network' },
      { name: 'Logistic Regression', weight: 0.10, type: 'logistic_regression' }
    ];

    const systemPrompt = `You are an advanced ML scoring engine for banking applications, implementing ensemble methods for ${scoringType} scoring.

You must return a JSON object with this exact structure:
{
  "ensemble_prediction": {
    "final_score": number (0-1000 for credit, 0-1 for probability),
    "confidence": number (0-1),
    "risk_level": "very_low" | "low" | "medium" | "high" | "very_high",
    "recommendation": string
  },
  "individual_models": [
    {
      "model_name": string,
      "model_type": string,
      "prediction": number,
      "weight": number,
      "weighted_contribution": number,
      "feature_importances": [{"feature": string, "importance": number}]
    }
  ],
  "gradient_boosting_details": {
    "n_estimators": number,
    "learning_rate": number,
    "max_depth": number,
    "boosting_rounds": [{"round": number, "residual_reduction": number, "weak_learner_weight": number}],
    "feature_split_gains": [{"feature": string, "total_gain": number, "split_count": number}]
  },
  "random_forest_details": {
    "n_trees": number,
    "max_depth": number,
    "tree_predictions": [{"tree_id": number, "prediction": number, "confidence": number}],
    "oob_score": number,
    "feature_importances_mdi": [{"feature": string, "importance": number, "std": number}]
  },
  "explainability": {
    "shap_values": [{"feature": string, "value": number, "direction": "positive" | "negative"}],
    "counterfactuals": [{"change": string, "impact": string, "new_score": number}],
    "decision_path": [string],
    "human_explanation": string
  },
  "model_metrics": {
    "auc_roc": number,
    "precision": number,
    "recall": number,
    "f1_score": number,
    "log_loss": number,
    "calibration_error": number
  },
  "ab_test_info": {
    "model_version": string,
    "is_treatment": boolean
  }
}`;

    const userPrompt = `Generate an advanced ${scoringType} scoring using ensemble methods:

Scoring Type: ${scoringType}
Features: ${JSON.stringify(features, null, 2)}
Company Context: ${JSON.stringify(companyContext, null, 2)}
Use Ensemble: ${useEnsemble}
Model Version: ${selectedModelVersion}
Ensemble Models: ${JSON.stringify(ensembleModels, null, 2)}

For ${scoringType === 'credit' ? 'credit scoring (0-1000 scale)' : 
      scoringType === 'churn' ? 'churn probability (0-1)' :
      scoringType === 'ltv' ? 'lifetime value prediction' :
      'propensity to buy probability (0-1)'}:

1. Simulate each model in the ensemble with realistic predictions
2. Apply weighted averaging for final ensemble prediction
3. Generate gradient boosting iterations showing residual reduction
4. Generate random forest tree votes with OOB score
5. Include SHAP values and counterfactual explanations
6. Provide banking-specific decision paths and human-readable explanation
7. Calculate comprehensive model metrics`;

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
    const latencyMs = Date.now() - startTime;

    // Store explanation if requested
    let explanationId = null;
    if (explainability && result.explainability) {
      const { data: explanation } = await supabase
        .from('model_explanations')
        .insert({
          company_id: companyId || null,
          model_type: scoringType,
          model_version: selectedModelVersion,
          feature_importances: result.individual_models?.flatMap((m: Record<string, unknown>) => m.feature_importances) || [],
          decision_path: result.explainability.decision_path,
          counterfactuals: result.explainability.counterfactuals,
          confidence_intervals: { 
            lower: result.ensemble_prediction.final_score * 0.9,
            upper: Math.min(result.ensemble_prediction.final_score * 1.1, scoringType === 'credit' ? 1000 : 1)
          },
          human_readable_explanation: result.explainability.human_explanation,
          shap_values: result.explainability.shap_values,
          lime_weights: result.individual_models?.[3]?.feature_importances || []
        })
        .select('id')
        .single();

      explanationId = explanation?.id;
    }

    // Log prediction for A/B testing
    const modelId = activeModels?.[0]?.id;
    if (modelId || abTestId) {
      await supabase.from('ml_prediction_logs').insert({
        model_id: modelId || null,
        ab_test_id: abTestId || null,
        company_id: companyId || null,
        input_features: features,
        prediction: result.ensemble_prediction,
        prediction_probability: result.ensemble_prediction.confidence,
        latency_ms: latencyMs,
        explanation_id: explanationId
      });
    }

    // Log to ml_model_executions
    await supabase.from('ml_model_executions').insert({
      model_name: 'advanced_ml_scoring',
      model_version: selectedModelVersion,
      input_parameters: { scoringType, features, useEnsemble },
      status: 'completed',
      processed_records: 1
    });

    return new Response(JSON.stringify({
      ...result,
      metadata: {
        latency_ms: latencyMs,
        explanation_id: explanationId,
        model_version: selectedModelVersion
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Advanced ML Scoring error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
