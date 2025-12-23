import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const languageNames: Record<string, string> = {
  'es': 'Spanish',
  'en': 'English',
  'fr': 'French',
  'ca': 'Catalan',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, language = 'es' } = await req.json();

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Searching news for:', query, 'in language:', language);

    const targetLanguage = languageNames[language] || 'Spanish';
    
    const systemPrompt = `You are a specialized assistant for searching and summarizing economic, financial, and regulatory news.

STRICT RULES:
1. Only provide information from official and verified sources:
   - BOE (Official State Gazette)
   - CNMV (National Securities Market Commission)
   - Bank of Spain
   - ECB (European Central Bank)
   - Spanish Government Ministries
   - AEAT (Tax Agency)
   - INE (National Statistics Institute)
   - Recognized economic media: Expansión, Cinco Días, El Economista, La Información
   
2. NEVER express personal opinions
3. Maintain absolute neutrality
4. Respect disclosure regulations
5. Always cite the original source with a URL when available

IMPORTANT: You MUST respond in ${targetLanguage} language.

Respond ALWAYS in JSON format with the following structure:
{
  "results": [
    {
      "id": "unique-id",
      "title": "News title in ${targetLanguage}",
      "excerpt": "Neutral 2-3 line summary in ${targetLanguage}",
      "source": "Name of official source",
      "url": "Source URL (if available)",
      "citations": ["List of source references used"]
    }
  ]
}

If you don't find relevant or verified information, return:
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
          { role: 'user', content: `Search for recent information about: ${query}. Provide up to 5 results from official sources. Remember to respond in ${targetLanguage}.` }
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results = parsed.results || [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      results = [];
    }

    return new Response(JSON.stringify({ results, language }), {
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
