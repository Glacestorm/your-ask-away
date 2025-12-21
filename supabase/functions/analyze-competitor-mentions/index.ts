import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active competitors
    const { data: competitors, error: compError } = await supabase
      .from('news_competitors')
      .select('*')
      .eq('is_active', true);

    if (compError) throw compError;

    if (!competitors || competitors.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No hay competidores configurados' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get recent articles not yet analyzed for competitors
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('id, title, content, ai_summary, category, published_at')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(50);

    if (articlesError) throw articlesError;

    let mentionsFound = 0;
    const mentionsData: any[] = [];

    for (const article of articles || []) {
      const textToSearch = `${article.title} ${article.ai_summary || ''} ${article.content || ''}`.toLowerCase();

      for (const competitor of competitors) {
        // Check if already analyzed
        const { data: existing } = await supabase
          .from('news_competitor_mentions')
          .select('id')
          .eq('competitor_id', competitor.id)
          .eq('article_id', article.id)
          .single();

        if (existing) continue;

        // Search for competitor keywords
        const keywords = competitor.keywords || [competitor.name];
        let matchedKeyword = null;
        let prominence = 'body';

        for (const keyword of keywords) {
          const kw = keyword.toLowerCase();
          if (article.title.toLowerCase().includes(kw)) {
            matchedKeyword = keyword;
            prominence = 'headline';
            break;
          } else if ((article.ai_summary || '').toLowerCase().includes(kw)) {
            matchedKeyword = keyword;
            prominence = 'lead';
            break;
          } else if (textToSearch.includes(kw)) {
            matchedKeyword = keyword;
            prominence = 'body';
          }
        }

        if (matchedKeyword) {
          // Analyze sentiment using AI
          let sentiment = 'neutral';
          let sentimentScore = 0.5;
          let mentionContext = '';

          if (lovableApiKey) {
            try {
              const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${lovableApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash',
                  messages: [
                    {
                      role: 'system',
                      content: 'Analiza el sentimiento de la mención de una empresa en una noticia. Responde SOLO con un JSON: {"sentiment": "positive"|"negative"|"neutral"|"mixed", "score": 0.0-1.0, "context": "breve extracto relevante (máx 200 caracteres)"}'
                    },
                    {
                      role: 'user',
                      content: `Empresa: ${competitor.name}\nKeyword encontrada: ${matchedKeyword}\nTítulo: ${article.title}\nResumen: ${article.ai_summary || 'N/A'}`
                    }
                  ],
                }),
              });

              if (response.ok) {
                const aiData = await response.json();
                const content = aiData.choices?.[0]?.message?.content || '';
                try {
                  const parsed = JSON.parse(content);
                  sentiment = parsed.sentiment || 'neutral';
                  sentimentScore = parsed.score || 0.5;
                  mentionContext = parsed.context || '';
                } catch {
                  // Use defaults if parsing fails
                }
              }
            } catch (error) {
              console.error('AI analysis error:', error);
            }
          }

          mentionsData.push({
            competitor_id: competitor.id,
            article_id: article.id,
            mention_context: mentionContext || article.ai_summary?.substring(0, 200),
            sentiment,
            sentiment_score: sentimentScore,
            keyword_matched: matchedKeyword,
            prominence,
          });

          mentionsFound++;
        }
      }
    }

    // Insert all mentions
    if (mentionsData.length > 0) {
      const { error: insertError } = await supabase
        .from('news_competitor_mentions')
        .insert(mentionsData);

      if (insertError) {
        console.error('Error inserting mentions:', insertError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      competitorsAnalyzed: competitors.length,
      articlesScanned: articles?.length || 0,
      mentionsFound,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-competitor-mentions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
