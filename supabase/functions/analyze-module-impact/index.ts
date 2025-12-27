import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImpactAnalysisRequest {
  module_key: string;
  current_state: Record<string, unknown>;
  proposed_state: Record<string, unknown>;
  dependencies: Array<{ module_key: string; depends_on: string; dependency_type: string }>;
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

    const { module_key, current_state, proposed_state, dependencies } = await req.json() as ImpactAnalysisRequest;

    console.log(`[analyze-module-impact] Analyzing: ${module_key}`);

    // Find affected modules
    const affectedModules = dependencies
      .filter(d => d.depends_on === module_key)
      .map(d => d.module_key);

    const systemPrompt = `Eres un experto en análisis de impacto de cambios en sistemas modulares enterprise.
Analiza los cambios propuestos y genera un informe de riesgos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "risk_level": "safe" | "warning" | "breaking",
  "summary": "Resumen del análisis",
  "breaking_changes": ["lista de cambios que rompen compatibilidad"],
  "warnings": ["lista de advertencias"],
  "recommendations": ["lista de recomendaciones"],
  "affected_modules_analysis": [{"module": "nombre", "impact": "descripción del impacto"}],
  "migration_steps": ["pasos para migrar si es necesario"],
  "confidence_score": 0-100
}`;

    const userPrompt = `Analiza el impacto de los siguientes cambios en el módulo "${module_key}":

ESTADO ACTUAL:
${JSON.stringify(current_state, null, 2)}

ESTADO PROPUESTO:
${JSON.stringify(proposed_state, null, 2)}

MÓDULOS AFECTADOS (dependen de este módulo):
${affectedModules.length > 0 ? affectedModules.join(', ') : 'Ninguno'}

Genera un análisis de impacto detallado.`;

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
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      analysis = {
        risk_level: 'warning',
        summary: 'No se pudo analizar automáticamente',
        breaking_changes: [],
        warnings: ['Análisis manual requerido'],
        recommendations: ['Revisar cambios manualmente'],
        affected_modules_analysis: [],
        migration_steps: [],
        confidence_score: 50,
      };
    }

    console.log(`[analyze-module-impact] Complete: ${module_key}, risk: ${analysis.risk_level}`);

    return new Response(JSON.stringify({
      success: true,
      module_key,
      affected_modules: affectedModules,
      analysis,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[analyze-module-impact] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
