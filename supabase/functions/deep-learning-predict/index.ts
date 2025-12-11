import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeepLearningRequest {
  modelArchitecture: 'mlp' | 'lstm' | 'transformer' | 'autoencoder';
  task: 'classification' | 'regression' | 'anomaly_detection' | 'time_series';
  features: Record<string, number>;
  sequenceData?: number[][];
  companyId?: string;
  layers?: number[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      modelArchitecture, 
      task, 
      features, 
      sequenceData,
      companyId,
      layers = [128, 64, 32]
    } = await req.json() as DeepLearningRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch time series data if needed
    let timeSeriesContext = [];
    if (companyId && (modelArchitecture === 'lstm' || task === 'time_series')) {
      const { data: visits } = await supabase
        .from('visits')
        .select('date, result')
        .eq('company_id', companyId)
        .order('date', { ascending: true })
        .limit(100);
      
      timeSeriesContext = visits || [];
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const architectureDescriptions = {
      mlp: "Multi-Layer Perceptron with fully connected layers and ReLU activation",
      lstm: "Long Short-Term Memory network for sequential data processing",
      transformer: "Attention-based Transformer architecture",
      autoencoder: "Encoder-Decoder architecture for dimensionality reduction and anomaly detection"
    };

    const systemPrompt = `You are a Deep Learning model simulator for banking AI applications.
Simulate the behavior of a ${architectureDescriptions[modelArchitecture]} neural network.

Return a JSON object:
{
  "prediction": number or array,
  "confidence": number,
  "architecture": {
    "type": "${modelArchitecture}",
    "layers": [{"name": string, "units": number, "activation": string, "params": number}],
    "total_params": number,
    "trainable_params": number
  },
  "activations": {
    "layer_outputs": [{"layer": string, "shape": array, "mean": number, "std": number}],
    "attention_weights": array (if transformer),
    "hidden_states": array (if lstm)
  },
  "gradients": {
    "feature_gradients": [{"feature": string, "gradient": number, "saliency": number}],
    "integrated_gradients": [{"feature": string, "attribution": number}]
  },
  "uncertainty": {
    "epistemic": number,
    "aleatoric": number,
    "total": number,
    "prediction_interval": {"lower": number, "upper": number}
  },
  "training_metrics": {
    "loss": number,
    "val_loss": number,
    "epochs": number,
    "batch_size": number,
    "learning_rate": number
  }
}`;

    const userPrompt = `Simulate a ${modelArchitecture.toUpperCase()} deep learning model for ${task}:
- Architecture: ${modelArchitecture}
- Layers: ${JSON.stringify(layers)}
- Features: ${JSON.stringify(features, null, 2)}
${sequenceData ? `- Sequence Data: ${JSON.stringify(sequenceData.slice(0, 5))}... (${sequenceData.length} timesteps)` : ''}
${timeSeriesContext.length > 0 ? `- Time Series Context: ${timeSeriesContext.length} historical records` : ''}

Generate realistic neural network outputs including layer activations, gradient-based explanations, and uncertainty quantification.`;

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
        max_tokens: 5000,
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
      model_name: `deep_learning_${modelArchitecture}`,
      model_version: '1.0',
      input_parameters: { modelArchitecture, task, layers },
      status: 'completed',
      processed_records: 1
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Deep Learning error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
