/**
 * erp-regulations-ai - Edge function para consultas normativas con IA
 * Fase 3: Asesor normativo inteligente
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegulationRequest {
  action: 'consult' | 'check_compliance' | 'get_updates';
  query?: string;
  regulations?: string[];
  context?: Record<string, unknown>;
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

    const { action, query, regulations, context } = await req.json() as RegulationRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'consult':
        systemPrompt = `Eres un experto consultor en normativa contable y fiscal española e internacional.

TU ROL:
- Responder consultas sobre PGC, NIIF/IFRS, normativa fiscal española
- Explicar tratamientos contables específicos
- Citar normas y artículos relevantes
- Proporcionar ejemplos prácticos cuando sea útil

NORMATIVAS QUE DOMINAS:
- Plan General Contable (PGC) español
- Normas Internacionales de Información Financiera (NIIF/IFRS)
- Ley del Impuesto sobre Sociedades
- Normativa de IVA
- RGPD en contexto contable

FORMATO DE RESPUESTA:
Responde de forma clara y estructurada. Si aplica, incluye:
1. Respuesta directa a la consulta
2. Base normativa (artículos/normas relevantes)
3. Ejemplo práctico si es útil
4. Consideraciones adicionales`;

        userPrompt = query || 'Consulta general sobre normativa contable';
        break;

      case 'check_compliance':
        systemPrompt = `Eres un auditor de cumplimiento normativo contable.

TU ROL:
- Evaluar el cumplimiento de normativas contables
- Identificar áreas de riesgo
- Proporcionar recomendaciones de mejora

FORMATO DE RESPUESTA (JSON estricto):
{
  "checks": [
    {
      "regulationId": "string",
      "regulationName": "string",
      "status": "compliant" | "partial" | "non_compliant",
      "score": 0-100,
      "findings": ["string"],
      "recommendations": ["string"]
    }
  ],
  "overallScore": 0-100,
  "summary": "string"
}`;

        userPrompt = `Evalúa el cumplimiento de las siguientes normativas: ${regulations?.join(', ') || 'PGC, NIIF'}

Contexto disponible: ${JSON.stringify(context || {})}`;
        break;

      case 'get_updates':
        systemPrompt = `Eres un experto en actualizaciones normativas contables.

Proporciona información sobre cambios recientes en normativa contable española e internacional.

FORMATO DE RESPUESTA (JSON):
{
  "updates": [
    {
      "regulation": "string",
      "changeType": "new" | "amendment" | "clarification",
      "effectiveDate": "YYYY-MM-DD",
      "summary": "string",
      "impact": "low" | "medium" | "high"
    }
  ]
}`;

        userPrompt = 'Lista las actualizaciones normativas contables más recientes y relevantes.';
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-regulations-ai] Processing action: ${action}`);

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
          success: false,
          error: 'Rate limit exceeded' 
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
    if (action === 'consult') {
      result = { response: content };
    } else {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = { rawContent: content };
        }
      } catch {
        result = { rawContent: content };
      }
    }

    console.log(`[erp-regulations-ai] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-regulations-ai] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
