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
    console.log('Generating weekly news report...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Calculate week range
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    // Get top news from the week
    const { data: topNews, error: newsError } = await supabase
      .from('news_articles')
      .select('*')
      .gte('published_at', weekStart.toISOString())
      .lte('published_at', weekEnd.toISOString())
      .order('relevance_score', { ascending: false })
      .limit(10);
    
    if (newsError) {
      throw new Error(`Error fetching news: ${newsError.message}`);
    }
    
    // Get all trends from the week
    const allTrends: string[] = [];
    topNews?.forEach(article => {
      if (article.detected_trends) {
        allTrends.push(...article.detected_trends);
      }
    });
    
    // Count trend frequency
    const trendCounts: Record<string, number> = {};
    allTrends.forEach(trend => {
      trendCounts[trend] = (trendCounts[trend] || 0) + 1;
    });
    
    const topTrends = Object.entries(trendCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([trend, count]) => ({ trend, count }));
    
    // Get pending improvement proposals
    const { data: pendingInsights, error: insightsError } = await supabase
      .from('news_improvement_insights')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
    }
    
    // Get fetch logs statistics
    const { data: fetchLogs } = await supabase
      .from('news_fetch_logs')
      .select('*')
      .gte('execution_time', weekStart.toISOString())
      .lte('execution_time', weekEnd.toISOString());
    
    const statistics = {
      total_articles_fetched: fetchLogs?.reduce((sum, log) => sum + (log.articles_fetched || 0), 0) || 0,
      total_articles_processed: fetchLogs?.reduce((sum, log) => sum + (log.articles_processed || 0), 0) || 0,
      total_articles_saved: fetchLogs?.reduce((sum, log) => sum + (log.articles_saved || 0), 0) || 0,
      total_executions: fetchLogs?.length || 0,
      successful_executions: fetchLogs?.filter(log => log.status === 'success').length || 0,
      failed_executions: fetchLogs?.filter(log => log.status === 'failed').length || 0,
      critical_news: topNews?.filter(n => n.importance_level === 'critical').length || 0,
      high_relevance_news: topNews?.filter(n => n.relevance_score >= 80).length || 0,
      articles_with_product_connection: topNews?.filter(n => n.product_connection).length || 0
    };
    
    // Generate AI summary of the week
    let weekSummary = '';
    if (lovableApiKey && topNews && topNews.length > 0) {
      try {
        const newsContext = topNews.slice(0, 5).map(n => `- ${n.title}: ${n.ai_summary}`).join('\n');
        const trendsContext = topTrends.slice(0, 5).map(t => t.trend).join(', ');
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Eres un analista de noticias empresariales. Genera un resumen ejecutivo de la semana en español, destacando los puntos más importantes para empresas españolas. Máximo 300 palabras.'
              },
              {
                role: 'user',
                content: `Noticias principales de la semana:\n${newsContext}\n\nTendencias detectadas: ${trendsContext}`
              }
            ],
            temperature: 0.5,
            max_tokens: 500
          })
        });

        if (response.ok) {
          const data = await response.json();
          weekSummary = data.choices?.[0]?.message?.content || '';
        }
      } catch (error) {
        console.error('Error generating summary:', error);
      }
    }
    
    // Save weekly report
    const reportData = {
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      report_data: {
        generated_at: new Date().toISOString(),
        ai_generated: !!lovableApiKey
      },
      summary: weekSummary || `Informe semanal: ${statistics.total_articles_saved} artículos procesados, ${statistics.critical_news} noticias críticas detectadas.`,
      top_news: topNews?.map(n => ({
        id: n.id,
        title: n.title,
        category: n.category,
        relevance_score: n.relevance_score,
        importance_level: n.importance_level,
        product_connection: n.product_connection
      })),
      detected_trends: topTrends,
      improvement_proposals: pendingInsights?.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        priority: i.priority
      })),
      statistics
    };
    
    const { data: savedReport, error: saveError } = await supabase
      .from('news_weekly_reports')
      .insert(reportData)
      .select()
      .single();
    
    if (saveError) {
      throw new Error(`Error saving report: ${saveError.message}`);
    }
    
    console.log('Weekly report generated successfully:', savedReport.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        report_id: savedReport.id,
        summary: weekSummary.substring(0, 200) + '...',
        statistics,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating weekly report:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
