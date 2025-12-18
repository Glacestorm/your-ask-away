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
    const { content, title, meta_description, keywords } = await req.json()

    if (!content) {
      throw new Error('Content is required')
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    console.log('[CMS Analyze Quality] Analyzing content quality...')

    const systemPrompt = `Eres un experto en análisis de calidad de contenido web, SEO y UX writing.
Analiza el contenido proporcionado y devuelve métricas precisas.`

    const userPrompt = `Analiza la calidad del siguiente contenido:

TÍTULO: ${title || 'Sin título'}
META DESCRIPCIÓN: ${meta_description || 'Sin descripción'}
PALABRAS CLAVE OBJETIVO: ${keywords?.join(', ') || 'No especificadas'}

CONTENIDO:
"""
${content}
"""

Proporciona un análisis detallado en formato JSON:
{
  "overall_score": 0-100,
  "readability": {
    "score": 0-100,
    "grade_level": "...",
    "avg_sentence_length": 0,
    "avg_word_length": 0,
    "complex_words_percentage": 0,
    "passive_voice_percentage": 0,
    "issues": ["..."],
    "suggestions": ["..."]
  },
  "seo": {
    "score": 0-100,
    "title_analysis": {
      "length": 0,
      "has_keyword": true/false,
      "is_compelling": true/false,
      "score": 0-100
    },
    "meta_description_analysis": {
      "length": 0,
      "has_keyword": true/false,
      "has_cta": true/false,
      "score": 0-100
    },
    "keyword_density": 0,
    "heading_structure": {
      "has_h1": true/false,
      "h2_count": 0,
      "h3_count": 0,
      "score": 0-100
    },
    "internal_links": 0,
    "issues": ["..."],
    "suggestions": ["..."]
  },
  "engagement": {
    "score": 0-100,
    "predicted_bounce_rate": "alto|medio|bajo",
    "predicted_time_on_page": "corto|medio|largo",
    "emotional_appeal": 0-100,
    "call_to_action_strength": 0-100,
    "visual_elements_needed": ["..."],
    "suggestions": ["..."]
  },
  "grammar": {
    "score": 0-100,
    "errors_found": 0,
    "issues": [{"text": "...", "suggestion": "...", "type": "..."}]
  },
  "tone": {
    "detected": "formal|informal|técnico|conversacional|...",
    "consistency": 0-100,
    "brand_alignment": "alto|medio|bajo"
  },
  "word_count": 0,
  "character_count": 0,
  "paragraph_count": 0,
  "estimated_read_time": "X min",
  "summary": "...",
  "top_improvements": ["...", "...", "..."]
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
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CMS Analyze Quality] API error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`AI API error: ${response.status}`)
    }

    const result = await response.json()
    let analysisContent = result.choices?.[0]?.message?.content?.trim() || ''
    
    let analysis
    try {
      analysisContent = analysisContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(analysisContent)
    } catch {
      analysis = { raw: analysisContent, overall_score: 50 }
    }

    console.log('[CMS Analyze Quality] Analysis complete, score:', analysis.overall_score)

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        analyzed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CMS Analyze Quality] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
