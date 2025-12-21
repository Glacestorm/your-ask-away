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

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get articles from last 30 days for trend analysis
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('id, title, category, tags, published_at, relevance_score, importance_level')
      .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false });

    if (articlesError) throw articlesError;

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No hay artículos suficientes para análisis de tendencias' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract all tags and categories
    const tagCounts: Record<string, { count: number; articles: string[]; dates: string[] }> = {};
    
    for (const article of articles) {
      const allTags = [
        ...(article.tags || []),
        article.category,
      ].filter(Boolean);

      for (const tag of allTags) {
        const normalizedTag = tag.toLowerCase().trim();
        if (!tagCounts[normalizedTag]) {
          tagCounts[normalizedTag] = { count: 0, articles: [], dates: [] };
        }
        tagCounts[normalizedTag].count++;
        tagCounts[normalizedTag].articles.push(article.id);
        tagCounts[normalizedTag].dates.push(article.published_at);
      }
    }

    // Filter trends with at least 3 mentions
    const significantTrends = Object.entries(tagCounts)
      .filter(([_, data]) => data.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20);

    // Calculate trend velocity (mentions in last 7 days vs previous 7 days)
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const trendAnalysis: any[] = [];

    for (const [trendName, data] of significantTrends) {
      const recentMentions = data.dates.filter(d => new Date(d).getTime() > oneWeekAgo).length;
      const previousMentions = data.dates.filter(d => {
        const time = new Date(d).getTime();
        return time > twoWeeksAgo && time <= oneWeekAgo;
      }).length;

      // Calculate velocity score
      let velocityScore = 0;
      if (previousMentions === 0 && recentMentions > 0) {
        velocityScore = 100; // New trend
      } else if (previousMentions > 0) {
        velocityScore = ((recentMentions - previousMentions) / previousMentions) * 100;
      }

      // Determine status
      let status = 'stable';
      if (velocityScore > 50) status = 'emerging';
      else if (velocityScore > 20) status = 'growing';
      else if (velocityScore < -20) status = 'declining';
      else if (recentMentions > 5) status = 'peaking';

      trendAnalysis.push({
        name: trendName,
        count: data.count,
        recentMentions,
        previousMentions,
        velocityScore,
        status,
        articles: data.articles.slice(0, 5),
      });
    }

    // Use AI to predict growth for top emerging trends
    const emergingTrends = trendAnalysis.filter(t => t.status === 'emerging' || t.status === 'growing');
    
    if (emergingTrends.length > 0 && lovableApiKey) {
      const trendNames = emergingTrends.slice(0, 5).map(t => t.name).join(', ');
      
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
                content: 'Eres un analista de tendencias del sector financiero. Predice el crecimiento de tendencias. Responde SOLO con JSON array: [{"trend": "nombre", "predicted_growth": 0-100, "confidence": 0-1, "peak_days": numero_dias_hasta_pico, "category": "categoria"}]'
              },
              {
                role: 'user',
                content: `Analiza estas tendencias emergentes del sector bancario español: ${trendNames}. Contexto: son temas que han aumentado en menciones en noticias financieras en las últimas semanas.`
              }
            ],
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          try {
            const predictions = JSON.parse(content);
            for (const pred of predictions) {
              const trend = trendAnalysis.find(t => 
                t.name.toLowerCase() === pred.trend.toLowerCase()
              );
              if (trend) {
                trend.predicted_growth = pred.predicted_growth;
                trend.confidence = pred.confidence;
                trend.peak_days = pred.peak_days;
                trend.category = pred.category;
              }
            }
          } catch {
            // Ignore parsing errors
          }
        }
      } catch (error) {
        console.error('AI prediction error:', error);
      }
    }

    // Save trend history for today
    const today = new Date().toISOString().split('T')[0];
    
    for (const trend of trendAnalysis) {
      const recentArticles = articles.filter(a => 
        new Date(a.published_at).toISOString().split('T')[0] === today &&
        (a.tags?.includes(trend.name) || a.category?.toLowerCase() === trend.name)
      );

      await supabase
        .from('news_trend_history')
        .upsert({
          trend_name: trend.name,
          mention_count: recentArticles.length,
          article_ids: recentArticles.map(a => a.id),
          date: today,
        }, {
          onConflict: 'trend_name,date'
        });
    }

    // Save predictions
    for (const trend of trendAnalysis.filter(t => t.status !== 'declining' && t.status !== 'stable')) {
      const peakDate = trend.peak_days 
        ? new Date(Date.now() + trend.peak_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      await supabase
        .from('news_trend_predictions')
        .upsert({
          trend_name: trend.name,
          trend_category: trend.category || null,
          current_mentions: trend.count,
          predicted_growth: trend.predicted_growth || trend.velocityScore,
          confidence_score: trend.confidence || 0.5,
          peak_prediction_date: peakDate,
          velocity_score: trend.velocityScore,
          supporting_articles: trend.articles,
          status: trend.status,
          analysis_date: today,
          analysis_factors: {
            recent_mentions: trend.recentMentions,
            previous_mentions: trend.previousMentions,
          },
        }, {
          onConflict: 'id'
        });
    }

    return new Response(JSON.stringify({
      success: true,
      articlesAnalyzed: articles.length,
      trendsIdentified: trendAnalysis.length,
      emergingTrends: trendAnalysis.filter(t => t.status === 'emerging').length,
      trends: trendAnalysis.slice(0, 10),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predict-news-trends:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
