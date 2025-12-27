import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ABTestRequest {
  action: 'create_experiment' | 'get_experiments' | 'update_experiment' | 'assign_variant' | 'record_conversion' | 'get_results' | 'declare_winner';
  moduleKey?: string;
  experimentId?: string;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, moduleKey, experimentId, params } = await req.json() as ABTestRequest;

    console.log(`[module-ab-testing] Action: ${action}, Module: ${moduleKey}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'create_experiment':
        systemPrompt = `Eres un experto en A/B testing y experimentación de producto.
        
TAREA: Crear un experimento A/B para un módulo de software.

FORMATO DE RESPUESTA (JSON estricto):
{
  "experiment": {
    "id": "exp_uuid",
    "name": "string",
    "description": "string",
    "hypothesis": "string",
    "variants": [
      {"id": "control", "name": "Control", "weight": 50, "config": {}},
      {"id": "treatment", "name": "Treatment", "weight": 50, "config": {}}
    ],
    "metrics": ["primary_metric", "secondary_metrics"],
    "targetAudience": {"percentage": 100, "segments": []},
    "duration": {"days": 14, "minSampleSize": 1000},
    "status": "draft"
  },
  "recommendations": ["tip1", "tip2"]
}`;
        userPrompt = `Crea un experimento A/B para el módulo "${moduleKey}" con estos parámetros: ${JSON.stringify(params)}`;
        break;

      case 'get_experiments':
        return new Response(JSON.stringify({
          success: true,
          data: {
            experiments: [
              {
                id: 'exp_001',
                name: 'New Dashboard Layout',
                moduleKey,
                status: 'running',
                variants: [
                  { id: 'control', name: 'Control', users: 1250, conversions: 125 },
                  { id: 'treatment', name: 'New Layout', users: 1248, conversions: 156 }
                ],
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { primaryMetric: 'conversion_rate', significance: 0.92 }
              },
              {
                id: 'exp_002',
                name: 'Simplified Onboarding',
                moduleKey,
                status: 'completed',
                winner: 'treatment',
                variants: [
                  { id: 'control', name: 'Control', users: 2000, conversions: 180 },
                  { id: 'treatment', name: 'Simplified', users: 2000, conversions: 240 }
                ],
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { primaryMetric: 'completion_rate', significance: 0.98, lift: 33.3 }
              }
            ]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_results':
        systemPrompt = `Eres un estadístico experto en análisis de experimentos A/B.

TAREA: Analizar los resultados de un experimento y determinar significancia estadística.

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "experimentId": "string",
    "status": "running" | "significant" | "inconclusive",
    "winner": "control" | "treatment" | null,
    "confidence": 0-100,
    "sampleSize": {"control": number, "treatment": number},
    "conversions": {"control": number, "treatment": number},
    "conversionRates": {"control": number, "treatment": number},
    "lift": number,
    "pValue": number,
    "powerAnalysis": {"currentPower": number, "requiredSampleSize": number}
  },
  "insights": ["insight1", "insight2"],
  "recommendation": "string"
}`;
        userPrompt = `Analiza los resultados del experimento ${experimentId}: ${JSON.stringify(params)}`;
        break;

      case 'declare_winner':
        systemPrompt = `Eres un experto en experimentación de producto.

TAREA: Declarar ganador y generar plan de rollout.

FORMATO DE RESPUESTA (JSON estricto):
{
  "decision": {
    "winner": "control" | "treatment",
    "confidence": number,
    "rationale": "string",
    "rolloutPlan": {
      "phases": [
        {"name": "Phase 1", "percentage": 25, "duration": "2 days"},
        {"name": "Phase 2", "percentage": 50, "duration": "3 days"},
        {"name": "Phase 3", "percentage": 100, "duration": "2 days"}
      ],
      "rollbackCriteria": ["criteria1", "criteria2"]
    }
  },
  "impact": {
    "expectedLift": number,
    "affectedUsers": number,
    "revenueImpact": number
  }
}`;
        userPrompt = `Declara ganador para el experimento ${experimentId} con estos datos: ${JSON.stringify(params)}`;
        break;

      case 'assign_variant':
        // Deterministic assignment based on user ID
        const userId = params?.userId as string || 'anonymous';
        const hash = userId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
        const variant = Math.abs(hash) % 2 === 0 ? 'control' : 'treatment';
        
        return new Response(JSON.stringify({
          success: true,
          data: { variant, userId, experimentId }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[module-ab-testing] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-ab-testing] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-ab-testing] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
