import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Searching news for:', query);

    const systemPrompt = `Eres un asistente especializado en buscar y resumir noticias económicas, financieras y de normativas oficiales.

REGLAS ESTRICTAS:
1. Solo proporciona información de fuentes oficiales y contrastadas:
   - BOE (Boletín Oficial del Estado)
   - CNMV (Comisión Nacional del Mercado de Valores)
   - Banco de España
   - BCE (Banco Central Europeo)
   - Ministerios del Gobierno de España
   - AEAT (Agencia Tributaria)
   - INE (Instituto Nacional de Estadística)
   - Medios económicos reconocidos: Expansión, Cinco Días, El Economista, La Información
   
2. NUNCA expreses opiniones personales
3. Mantén neutralidad absoluta
4. Respeta las normativas de divulgación
5. Cita siempre la fuente original

Responde SIEMPRE en formato JSON con la siguiente estructura:
{
  "results": [
    {
      "id": "unique-id",
      "title": "Título de la noticia",
      "excerpt": "Resumen neutral de 2-3 líneas",
      "source": "Nombre de la fuente oficial",
      "url": "URL de la fuente (si está disponible)"
    }
  ]
}

Si no encuentras información relevante o contrastada, devuelve:
{
  "results": []
}`;

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
          { role: 'user', content: `Busca información reciente sobre: ${query}. Proporciona hasta 5 resultados de fuentes oficiales.` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log('AI Response:', content);

    // Parse JSON from response
    let results = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results = parsed.results || [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      results = [];
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in news-ai-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
