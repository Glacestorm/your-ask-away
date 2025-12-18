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
    const { type, topic, tone, language, keywords, length, context } = await req.json()

    if (!type || !topic) {
      throw new Error('Type and topic are required')
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    console.log('[CMS Generate Content] Generating:', type, 'about:', topic)

    const systemPrompt = `Eres un experto redactor de contenido para CMS bancario y empresarial. 
Genera contenido profesional, claro y orientado a la conversión.
IMPORTANTE: Responde SIEMPRE en ${language || 'español'}.
Tono: ${tone || 'profesional'}
${keywords ? `Palabras clave a incluir: ${keywords.join(', ')}` : ''}
${context ? `Contexto adicional: ${context}` : ''}`

    let userPrompt = ''
    
    switch (type) {
      case 'title':
        userPrompt = `Genera 5 títulos creativos y atractivos para un artículo/página sobre: "${topic}".
        
Formato de respuesta JSON:
{
  "titles": [
    {"title": "...", "type": "informativo"},
    {"title": "...", "type": "pregunta"},
    {"title": "...", "type": "llamada_accion"},
    {"title": "...", "type": "numerico"},
    {"title": "...", "type": "emocional"}
  ]
}`
        break
        
      case 'description':
        userPrompt = `Genera 3 meta descripciones SEO optimizadas (máximo 160 caracteres cada una) para: "${topic}".
        
Formato de respuesta JSON:
{
  "descriptions": [
    {"text": "...", "characters": 0, "style": "informativo"},
    {"text": "...", "characters": 0, "style": "persuasivo"},
    {"text": "...", "characters": 0, "style": "directo"}
  ]
}`
        break
        
      case 'article':
        const wordCount = length === 'short' ? '300-500' : length === 'medium' ? '800-1200' : '1500-2500'
        userPrompt = `Escribe un artículo completo sobre: "${topic}".
Longitud objetivo: ${wordCount} palabras.

Incluye:
- Introducción enganchadora
- Subtítulos H2 y H3 bien estructurados
- Párrafos claros y concisos
- Conclusión con llamada a la acción
- Lista de puntos clave si aplica

Formato de respuesta JSON:
{
  "article": {
    "title": "...",
    "introduction": "...",
    "sections": [
      {
        "heading": "...",
        "level": 2,
        "content": "...",
        "subsections": [
          {"heading": "...", "level": 3, "content": "..."}
        ]
      }
    ],
    "conclusion": "...",
    "key_points": ["...", "..."],
    "word_count": 0
  }
}`
        break
        
      case 'summary':
        userPrompt = `Resume el siguiente contenido de forma clara y concisa, extrayendo los puntos principales:

"${topic}"

Formato de respuesta JSON:
{
  "summary": {
    "short": "...",
    "medium": "...",
    "key_points": ["...", "..."],
    "main_topic": "...",
    "sentiment": "positivo|neutro|negativo"
  }
}`
        break
        
      case 'social':
        userPrompt = `Genera publicaciones para redes sociales sobre: "${topic}".

Formato de respuesta JSON:
{
  "social_posts": {
    "twitter": {"text": "...", "characters": 0, "hashtags": ["..."]},
    "linkedin": {"text": "...", "format": "profesional"},
    "instagram": {"caption": "...", "hashtags": ["..."]},
    "facebook": {"text": "...", "emoji_count": 0}
  }
}`
        break
        
      case 'cta':
        userPrompt = `Genera 5 llamadas a la acción (CTAs) efectivas para: "${topic}".

Formato de respuesta JSON:
{
  "ctas": [
    {"text": "...", "type": "boton", "urgency": "alta|media|baja"},
    {"text": "...", "type": "enlace", "urgency": "alta|media|baja"},
    {"text": "...", "type": "banner", "urgency": "alta|media|baja"},
    {"text": "...", "type": "popup", "urgency": "alta|media|baja"},
    {"text": "...", "type": "email", "urgency": "alta|media|baja"}
  ]
}`
        break
        
      default:
        userPrompt = `Genera contenido de tipo "${type}" sobre: "${topic}".
Responde en formato JSON estructurado.`
    }

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
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CMS Generate Content] API error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`AI API error: ${response.status}`)
    }

    const result = await response.json()
    let content = result.choices?.[0]?.message?.content?.trim() || ''
    
    // Parse JSON from response
    let parsedContent
    try {
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedContent = JSON.parse(content)
    } catch {
      parsedContent = { raw: content }
    }

    console.log('[CMS Generate Content] Generated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        type,
        content: parsedContent,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CMS Generate Content] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
