import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HelpRequest {
  action: 'contextual_help' | 'search' | 'regulation_info';
  context?: {
    current_screen?: string;
    current_action?: string;
    selected_account?: string;
    error_message?: string;
    module?: string;
  };
  query?: string;
  regulation_code?: string;
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

    const { action, context, query, regulation_code } = await req.json() as HelpRequest;

    console.log(`[erp-dynamic-help] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'contextual_help':
        systemPrompt = `Eres un sistema de ayuda contextual para un ERP contable español.
        
PROPORCIONA:
1. Un resumen breve del contexto actual
2. Detalles relevantes sobre la pantalla o acción
3. Temas relacionados que podrían interesar
4. Ejemplos prácticos si aplica
5. Referencias a normativa si es relevante

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": "Resumen breve",
  "details": "Explicación detallada",
  "related_topics": ["tema1", "tema2"],
  "examples": ["ejemplo1"],
  "regulations": ["normativa aplicable"]
}`;

        userPrompt = `Proporciona ayuda contextual para:
- Pantalla: ${context?.current_screen || 'General'}
- Acción: ${context?.current_action || 'Navegación'}
- Cuenta: ${context?.selected_account || 'Ninguna'}
- Módulo: ${context?.module || 'Contabilidad'}
${context?.error_message ? `- Error: ${context.error_message}` : ''}`;
        break;

      case 'search':
        systemPrompt = `Eres un buscador de ayuda para un ERP contable español.

BUSCA Y DEVUELVE información sobre:
- Plan General Contable (PGC)
- Normativa fiscal española
- Procedimientos contables
- Funcionalidades del sistema

FORMATO DE RESPUESTA (JSON estricto):
{
  "topics": [
    {
      "id": "unique_id",
      "title": "Título del tema",
      "content": "Contenido resumido",
      "category": "normativa|procedimiento|ejemplo",
      "relevance": 0.95
    }
  ],
  "suggestions": ["sugerencia1", "sugerencia2"]
}`;

        userPrompt = `Busca información sobre: "${query}"`;
        break;

      case 'regulation_info':
        systemPrompt = `Eres un experto en normativa contable y fiscal española.

PROPORCIONA información detallada sobre regulaciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "regulation_name": "Nombre completo",
  "summary": "Resumen ejecutivo",
  "key_points": ["punto1", "punto2"],
  "practical_implications": ["implicación1"],
  "related_regulations": ["normativa relacionada"]
}`;

        userPrompt = `Proporciona información sobre: "${regulation_code}"`;
        break;

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
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Límite de solicitudes alcanzado' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No se recibió respuesta');

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { rawContent: content };
      }
    } catch (parseError) {
      console.error('[erp-dynamic-help] JSON parse error:', parseError);
      result = { rawContent: content };
    }

    console.log(`[erp-dynamic-help] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-dynamic-help] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
