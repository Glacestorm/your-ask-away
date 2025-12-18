import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content, title, existing_categories, existing_tags, language } = await req.json()

    if (!content && !title) {
      throw new Error('Content or title is required')
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    console.log('[CMS Auto Tag] Analyzing content for tags and categories...')

    const systemPrompt = `Eres un experto en clasificación y categorización de contenido.
Analiza el contenido y sugiere etiquetas y categorías relevantes.
Responde siempre en ${language || 'español'}.`

    const userPrompt = `Analiza el siguiente contenido y sugiere etiquetas y categorías:

TÍTULO: ${title || 'Sin título'}

CONTENIDO:
"""
${content?.substring(0, 4000) || 'Sin contenido adicional'}
"""

CATEGORÍAS EXISTENTES EN EL SISTEMA: ${existing_categories?.join(', ') || 'Ninguna definida'}
ETIQUETAS EXISTENTES EN EL SISTEMA: ${existing_tags?.join(', ') || 'Ninguna definida'}

Proporciona análisis en formato JSON:
{
  "suggested_categories": [
    {
      "name": "...",
      "confidence": 0-100,
      "reason": "...",
      "is_existing": true/false
    }
  ],
  "suggested_tags": [
    {
      "name": "...",
      "type": "topic|entity|concept|action|emotion",
      "confidence": 0-100,
      "is_existing": true/false
    }
  ],
  "entities_detected": {
    "people": ["..."],
    "organizations": ["..."],
    "locations": ["..."],
    "products": ["..."],
    "concepts": ["..."]
  },
  "topics": [
    {"topic": "...", "relevance": 0-100}
  ],
  "sentiment": {
    "overall": "positivo|neutro|negativo",
    "score": -1 to 1,
    "emotions": ["..."]
  },
  "content_type": {
    "detected": "artículo|noticia|tutorial|opinión|producto|servicio|...",
    "confidence": 0-100
  },
  "audience": {
    "suggested": "general|técnico|ejecutivo|consumidor|...",
    "age_group": "joven|adulto|senior|todos",
    "expertise_level": "principiante|intermedio|avanzado"
  },
  "related_topics": ["...", "...", "..."],
  "auto_summary": "...",
  "key_phrases": ["...", "...", "..."]
}`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CMS Auto Tag] API error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`AI API error: ${response.status}`)
    }

    const result = await response.json()
    let tagContent = result.choices?.[0]?.message?.content?.trim() || ''
    
    let analysis
    try {
      tagContent = tagContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(tagContent)
    } catch {
      analysis = { raw: tagContent, suggested_tags: [], suggested_categories: [] }
    }

    console.log('[CMS Auto Tag] Analysis complete')

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        analyzed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CMS Auto Tag] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
