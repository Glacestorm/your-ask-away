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
    const { content, title, url_slug, target_keywords, industry } = await req.json()

    if (!content && !title) {
      throw new Error('Content or title is required')
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    console.log('[CMS Suggest SEO] Generating SEO recommendations...')

    const systemPrompt = `Eres un experto SEO especializado en contenido web para el sector ${industry || 'empresarial'}.
Proporciona recomendaciones accionables y específicas basadas en las mejores prácticas de SEO 2024.`

    const userPrompt = `Analiza y proporciona recomendaciones SEO completas para:

TÍTULO ACTUAL: ${title || 'Sin título'}
URL SLUG: ${url_slug || 'no-definido'}
PALABRAS CLAVE OBJETIVO: ${target_keywords?.join(', ') || 'No especificadas'}
INDUSTRIA: ${industry || 'General'}

CONTENIDO:
"""
${content?.substring(0, 3000) || 'Sin contenido'}
"""

Proporciona recomendaciones en formato JSON:
{
  "current_seo_score": 0-100,
  "title_recommendations": {
    "current": "...",
    "issues": ["..."],
    "suggestions": [
      {"text": "...", "reason": "...", "impact": "alto|medio|bajo"}
    ],
    "optimal_length": "50-60 caracteres"
  },
  "meta_description_recommendations": {
    "suggested": [
      {"text": "...", "focus": "informativo|persuasivo|cta"}
    ],
    "optimal_length": "150-160 caracteres"
  },
  "url_slug_recommendations": {
    "current": "...",
    "suggested": "...",
    "issues": ["..."]
  },
  "keyword_recommendations": {
    "primary": {"keyword": "...", "search_volume_estimate": "alto|medio|bajo", "competition": "alta|media|baja"},
    "secondary": [{"keyword": "...", "relevance": 0-100}],
    "long_tail": [{"keyword": "...", "intent": "informacional|transaccional|navegacional"}],
    "lsi_keywords": ["..."],
    "to_avoid": ["..."]
  },
  "content_structure_recommendations": {
    "h1": {"current": "...", "suggested": "..."},
    "h2_suggestions": ["...", "..."],
    "h3_suggestions": ["...", "..."],
    "paragraph_optimization": ["..."],
    "internal_linking_opportunities": ["..."],
    "external_linking_suggestions": ["..."]
  },
  "technical_seo": {
    "schema_markup_suggestions": ["Article", "FAQ", "HowTo", "..."],
    "canonical_url": "...",
    "hreflang_needed": true/false,
    "image_alt_suggestions": ["..."]
  },
  "competitor_insights": {
    "estimated_ranking_difficulty": "fácil|moderado|difícil",
    "content_gap_opportunities": ["..."],
    "unique_angle_suggestions": ["..."]
  },
  "quick_wins": [
    {"action": "...", "impact": "alto|medio|bajo", "effort": "bajo|medio|alto"}
  ],
  "priority_actions": [
    {"priority": 1, "action": "...", "expected_impact": "..."}
  ]
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
        max_tokens: 3500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CMS Suggest SEO] API error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`AI API error: ${response.status}`)
    }

    const result = await response.json()
    let seoContent = result.choices?.[0]?.message?.content?.trim() || ''
    
    let recommendations
    try {
      seoContent = seoContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      recommendations = JSON.parse(seoContent)
    } catch {
      recommendations = { raw: seoContent, current_seo_score: 50 }
    }

    console.log('[CMS Suggest SEO] Recommendations generated')

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CMS Suggest SEO] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
