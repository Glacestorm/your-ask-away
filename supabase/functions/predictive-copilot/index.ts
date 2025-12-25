import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CopilotRequest {
  action: 'predict' | 'get_suggestions' | 'execute_suggestion' | 'provide_feedback' | 'get_config' | 'update_config' | 'learn_pattern';
  userId?: string;
  suggestionId?: string;
  predictionId?: string;
  context?: Record<string, unknown>;
  feedback?: { rating: number; helpful: boolean; notes?: string };
  config?: Record<string, unknown>;
  pattern?: Record<string, unknown>;
}

const COPILOT_PROMPT = `Eres un copiloto predictivo inteligente para una plataforma bancaria enterprise.
Tu rol es anticipar las necesidades del usuario y proporcionar sugerencias proactivas.

CAPACIDADES:
- Predecir próximas acciones basándote en patrones de comportamiento
- Sugerir optimizaciones y mejoras
- Alertar sobre anomalías o riesgos
- Automatizar tareas repetitivas
- Personalizar la experiencia según el rol del usuario

CONTEXTO DEL ROL:
- Tienes acceso al historial de acciones del usuario
- Conoces los patrones típicos de su rol
- Puedes ver métricas y KPIs relevantes

FORMATO DE RESPUESTA (JSON estricto):
{
  "predictions": [
    {
      "type": "next_action" | "optimization" | "risk_alert" | "automation",
      "title": "string",
      "description": "string",
      "confidence": 0-100,
      "priority": 1-10,
      "action": {
        "type": "navigate" | "execute" | "remind" | "automate",
        "target": "string",
        "params": {}
      },
      "reasoning": "string",
      "estimatedImpact": "string"
    }
  ],
  "insights": [
    {
      "type": "trend" | "anomaly" | "opportunity",
      "title": "string",
      "description": "string",
      "relevance": 0-100
    }
  ],
  "contextualHelp": {
    "currentTask": "string",
    "tips": ["string"],
    "relatedResources": ["string"]
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, userId, suggestionId, predictionId, context, feedback, config, pattern } = await req.json() as CopilotRequest;

    console.log(`[predictive-copilot] Action: ${action}, UserId: ${userId}`);

    switch (action) {
      case 'predict': {
        if (!userId) throw new Error('userId required');

        // Get user's behavior patterns
        const { data: patterns } = await supabase
          .from('user_behavior_patterns')
          .select('*')
          .eq('user_id', userId)
          .order('last_occurred', { ascending: false })
          .limit(10);

        // Get user's copilot config
        const { data: copilotConfig } = await supabase
          .from('copilot_configurations')
          .select('*')
          .eq('user_id', userId)
          .single();

        const userContext = {
          ...context,
          learnedPatterns: patterns || [],
          preferences: copilotConfig?.preferences || {},
          enabledFeatures: copilotConfig?.enabled_features || ['predictions', 'suggestions']
        };

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: COPILOT_PROMPT },
              { role: 'user', content: `Contexto del usuario:\n${JSON.stringify(userContext, null, 2)}\n\nGenera predicciones y sugerencias personalizadas.` }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        let result;
        try {
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
        } catch {
          result = { rawContent: content };
        }

        // Store predictions
        if (result.predictions?.length) {
          for (const prediction of result.predictions) {
            await supabase.from('copilot_predictions').insert({
              user_id: userId,
              prediction_type: prediction.type,
              prediction_data: prediction,
              confidence_score: prediction.confidence,
              context_snapshot: context,
              status: 'active'
            });
          }
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_suggestions': {
        if (!userId) throw new Error('userId required');

        const { data, error } = await supabase
          .from('copilot_predictions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'execute_suggestion': {
        if (!predictionId) throw new Error('predictionId required');

        const { data, error } = await supabase
          .from('copilot_predictions')
          .update({ 
            status: 'executed',
            acted_on_at: new Date().toISOString()
          })
          .eq('id', predictionId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'provide_feedback': {
        if (!predictionId || !feedback) throw new Error('predictionId and feedback required');

        const { data, error } = await supabase
          .from('copilot_predictions')
          .update({ 
            user_feedback: feedback,
            status: feedback.helpful ? 'helpful' : 'dismissed'
          })
          .eq('id', predictionId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_config': {
        if (!userId) throw new Error('userId required');

        const { data, error } = await supabase
          .from('copilot_configurations')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        return new Response(JSON.stringify({ success: true, data: data || null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_config': {
        if (!userId || !config) throw new Error('userId and config required');

        const { data: existing } = await supabase
          .from('copilot_configurations')
          .select('id')
          .eq('user_id', userId)
          .single();

        let result;
        if (existing) {
          const { data, error } = await supabase
            .from('copilot_configurations')
            .update(config)
            .eq('user_id', userId)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase
            .from('copilot_configurations')
            .insert({ user_id: userId, ...config })
            .select()
            .single();
          if (error) throw error;
          result = data;
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'learn_pattern': {
        if (!userId || !pattern) throw new Error('userId and pattern required');

        const { data: existing } = await supabase
          .from('user_behavior_patterns')
          .select('*')
          .eq('user_id', userId)
          .eq('pattern_type', pattern.type)
          .single();

        let result;
        if (existing) {
          const existingPatternData = typeof existing.pattern_data === 'object' && existing.pattern_data !== null 
            ? existing.pattern_data 
            : {};
          const newPatternData = typeof pattern.data === 'object' && pattern.data !== null 
            ? pattern.data 
            : {};
          
          const { data, error } = await supabase
            .from('user_behavior_patterns')
            .update({
              occurrence_count: (existing.occurrence_count || 0) + 1,
              last_occurred: new Date().toISOString(),
              pattern_data: { ...existingPatternData, ...newPatternData }
            })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase
            .from('user_behavior_patterns')
            .insert({
              user_id: userId,
              pattern_type: pattern.type,
              pattern_data: pattern.data,
              occurrence_count: 1,
              first_detected: new Date().toISOString(),
              last_occurred: new Date().toISOString()
            })
            .select()
            .single();
          if (error) throw error;
          result = data;
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[predictive-copilot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
