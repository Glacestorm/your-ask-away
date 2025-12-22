import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  context: 'dafo' | 'business-plan' | 'financial' | 'scenarios';
  projectName?: string;
  projectData?: any;
  conversationHistory?: { role: string; content: string }[];
  webSearchEnabled?: boolean;
}

const CONTEXT_SYSTEM_PROMPTS: Record<string, string> = {
  dafo: `Eres un experto en planificación estratégica especializado en análisis DAFO (SWOT).
Tu rol es ayudar a identificar y analizar:
- Fortalezas: capacidades internas, recursos únicos, ventajas competitivas
- Debilidades: limitaciones internas, áreas de mejora, carencias
- Oportunidades: tendencias de mercado, cambios regulatorios, nichos
- Amenazas: competencia, riesgos externos, cambios adversos

Proporciona ejemplos específicos y accionables. Si tienes información de búsqueda web, cítala.`,

  'business-plan': `Eres un consultor experto en evaluación de Business Plans.
Analizas planes de negocio en 10 dimensiones:
1. Idea de Negocio (10%) - Claridad y diferenciación
2. Equipo Promotor (12%) - Experiencia y complementariedad
3. Análisis de Mercado (12%) - Tamaño, segmentación, competencia
4. Estrategia Comercial (10%) - Marketing, pricing, canales
5. Plan de Operaciones (10%) - Procesos, proveedores, tecnología
6. Organización y RRHH (8%) - Estructura y plan de contratación
7. Plan Económico-Financiero (15%) - Proyecciones y viabilidad
8. Viabilidad del Proyecto (10%) - Rentabilidad y sostenibilidad
9. Aspectos Legales (5%) - Forma jurídica, licencias, IP
10. Presentación (8%) - Claridad y profesionalidad

Da recomendaciones específicas para mejorar cada sección.`,

  financial: `Eres un analista financiero experto en modelos de viabilidad.
Ayudas con:
- Proyecciones financieras a 5 años
- Estados financieros: Balance, PyG, Cash Flow
- Ratios financieros: liquidez, solvencia, rentabilidad
- Benchmarks sectoriales
- Interpretación de métricas clave

Explica los conceptos de forma clara y proporciona fórmulas cuando sea útil.`,

  scenarios: `Eres un experto en análisis de escenarios financieros.
Ayudas a:
- Diseñar escenarios optimista, realista y pesimista
- Análisis de sensibilidad de variables clave
- Calcular e interpretar VAN, TIR, Payback
- Identificar puntos de equilibrio
- Evaluar riesgos y oportunidades

Proporciona análisis cuantitativo cuando sea posible.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ChatRequest = await req.json();
    const { message, context, projectName, projectData, conversationHistory, webSearchEnabled } = body;

    console.log('Strategic Assistant request:', { context, message: message.substring(0, 100) });

    let webSearchResults: { url: string; title: string; content: string }[] = [];

    // Web search with Firecrawl if enabled or if message suggests searching
    if (webSearchEnabled || message.toLowerCase().includes('busca') || message.toLowerCase().includes('buscar')) {
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlKey) {
        try {
          console.log('Performing web search...');
          const searchQuery = message.replace(/^busca?\s*/i, '').trim() || `${context} ${projectName || ''} análisis`;
          
          const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchQuery,
              limit: 3,
              lang: 'es',
              country: 'ES',
              scrapeOptions: { formats: ['markdown'] }
            }),
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.data) {
              webSearchResults = searchData.data.map((r: any) => ({
                url: r.url,
                title: r.title || r.url,
                content: r.markdown?.substring(0, 1000) || r.description || ''
              }));
              console.log('Web search results:', webSearchResults.length);
            }
          }
        } catch (err) {
          console.error('Firecrawl error:', err);
        }
      }
    }

    // Build messages for AI
    const systemPrompt = CONTEXT_SYSTEM_PROMPTS[context] || CONTEXT_SYSTEM_PROMPTS.dafo;
    
    let enrichedSystemPrompt = systemPrompt;
    if (projectName) {
      enrichedSystemPrompt += `\n\nProyecto actual: "${projectName}"`;
    }
    if (projectData) {
      enrichedSystemPrompt += `\n\nDatos del proyecto: ${JSON.stringify(projectData).substring(0, 1000)}`;
    }
    if (webSearchResults.length > 0) {
      enrichedSystemPrompt += `\n\nInformación de búsqueda web:\n${webSearchResults.map(r => 
        `- ${r.title}: ${r.content.substring(0, 500)}...\n  Fuente: ${r.url}`
      ).join('\n\n')}`;
    }

    const messages = [
      { role: 'system', content: enrichedSystemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || 'No pude generar una respuesta.';

    return new Response(JSON.stringify({
      response: responseContent,
      sources: webSearchResults.map(r => ({ url: r.url, title: r.title }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Strategic assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
