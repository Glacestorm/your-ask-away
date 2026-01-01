import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HelpRequest {
  action: 'get_contextual_help';
  context: {
    module: string;
    action?: string;
    entityType?: string;
    entityData?: Record<string, unknown>;
  };
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

    const { action, context } = await req.json() as HelpRequest;

    if (action !== 'get_contextual_help') {
      throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-dynamic-help] Getting help for: ${context.module} - ${context.action}`);

    const systemPrompt = `Eres un sistema de ayuda contextual para un ERP contable español.
Genera ayuda relevante basada en el contexto proporcionado.

MÓDULOS DISPONIBLES:
- plan-cuentas: Gestión del plan de cuentas (PGC)
- asientos: Libro diario y asientos contables
- mayor: Libro mayor
- balance: Balances de situación y comprobación
- resultados: Cuenta de pérdidas y ganancias
- iva: Gestión de IVA y modelos fiscales
- cierre: Cierre de ejercicio

FORMATO DE RESPUESTA (JSON estricto):
{
  "topics": [
    {
      "id": "unique_id",
      "title": "Título del tema",
      "summary": "Resumen breve (1-2 líneas)",
      "content": "Contenido detallado con información práctica",
      "category": "normativa|procedimiento|ejemplo|tip",
      "relevance": 0-100,
      "source": "Fuente (opcional, ej: 'Art. 35 PGC')"
    }
  ],
  "tips": [
    {
      "id": "tip_id",
      "type": "info|warning|success",
      "message": "Mensaje del tip contextual",
      "action": "Acción sugerida (opcional)"
    }
  ]
}

REGLAS:
1. Genera 3-5 topics relevantes ordenados por relevancia
2. Genera 1-3 tips contextuales si aplican
3. Prioriza información práctica y aplicable
4. Cita normativa específica cuando sea posible
5. Los ejemplos deben ser realistas y útiles`;

    const userPrompt = `Genera ayuda contextual para:
Módulo: ${context.module}
Acción: ${context.action || 'visualización'}
Tipo de entidad: ${context.entityType || 'general'}
Datos adicionales: ${context.entityData ? JSON.stringify(context.entityData) : 'ninguno'}`;

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
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          topics: [],
          tips: [{ id: 'rate_limit', type: 'warning', message: 'Ayuda temporal no disponible. Intenta más tarde.' }]
        }), {
          status: 200,
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
      console.error('[erp-dynamic-help] JSON parse error:', parseError);
      result = { topics: [], tips: [], parseError: true };
    }

    console.log(`[erp-dynamic-help] Generated ${result.topics?.length || 0} topics, ${result.tips?.length || 0} tips`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-dynamic-help] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      topics: [],
      tips: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
