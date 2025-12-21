import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  impact_level: string;
  product_connection: string;
  created_at: string;
}

interface CriticalNews {
  id: string;
  title: string;
  importance_level: string;
  product_connection: string;
  published_at: string;
  source_name: string;
}

interface TrendData {
  trend: string;
  count: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { recipientEmails, testMode } = await req.json();

    // Get date range for last week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Fetch critical news from last week
    const { data: criticalNews } = await supabase
      .from("news_articles")
      .select("id, title, importance_level, product_connection, published_at, source_name")
      .in("importance_level", ["critical", "high"])
      .gte("published_at", startDate.toISOString())
      .lte("published_at", endDate.toISOString())
      .order("published_at", { ascending: false })
      .limit(10);

    // Fetch insights from last week
    const { data: insights } = await supabase
      .from("news_improvement_insights")
      .select("id, insight_type, title, description, impact_level, product_connection, created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(15);

    // Get trend analysis from all articles in last week
    const { data: allArticles } = await supabase
      .from("news_articles")
      .select("detected_trends")
      .gte("published_at", startDate.toISOString())
      .not("detected_trends", "is", null);

    // Count trends
    const trendCounts: Record<string, number> = {};
    allArticles?.forEach((article: any) => {
      if (article.detected_trends && Array.isArray(article.detected_trends)) {
        article.detected_trends.forEach((trend: string) => {
          trendCounts[trend] = (trendCounts[trend] || 0) + 1;
        });
      }
    });

    const topTrends: TrendData[] = Object.entries(trendCounts)
      .map(([trend, count]) => ({ trend, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Get statistics
    const { count: totalArticles } = await supabase
      .from("news_articles")
      .select("*", { count: "exact", head: true })
      .gte("published_at", startDate.toISOString());

    const { count: pendingInsights } = await supabase
      .from("news_improvement_insights")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Format date for email
    const formatDate = (date: Date) => date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    // Build HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: #e2e8f0;
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 700px; 
      margin: 0 auto; 
      background: linear-gradient(145deg, #1e1e2d 0%, #252538 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ec4899 100%);
      padding: 40px;
      text-align: center;
    }
    .header h1 { 
      color: white; 
      margin: 0; 
      font-size: 28px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .header p { 
      color: rgba(255,255,255,0.9); 
      margin: 10px 0 0;
      font-size: 14px;
    }
    .content { padding: 30px; }
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 15px; 
      margin-bottom: 30px; 
    }
    .stat-card { 
      background: linear-gradient(145deg, #2d2d44 0%, #1e1e2d 100%);
      border-radius: 12px; 
      padding: 20px; 
      text-align: center;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }
    .stat-value { 
      font-size: 32px; 
      font-weight: bold; 
      background: linear-gradient(135deg, #667eea 0%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .stat-label { font-size: 12px; color: #94a3b8; margin-top: 5px; }
    .section { margin-bottom: 30px; }
    .section-title { 
      font-size: 18px; 
      font-weight: 600; 
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #f1f5f9;
    }
    .section-title::before {
      content: '';
      width: 4px;
      height: 20px;
      background: linear-gradient(135deg, #667eea 0%, #ec4899 100%);
      border-radius: 2px;
    }
    .news-item { 
      background: rgba(45, 45, 68, 0.5);
      border-radius: 10px; 
      padding: 15px; 
      margin-bottom: 10px;
      border-left: 3px solid #667eea;
    }
    .news-item.critical { border-left-color: #ef4444; }
    .news-item.high { border-left-color: #f59e0b; }
    .news-title { font-weight: 600; color: #f1f5f9; margin-bottom: 5px; }
    .news-meta { font-size: 12px; color: #94a3b8; }
    .insight-item {
      background: linear-gradient(145deg, rgba(102, 126, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 10px;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .insight-title { font-weight: 600; color: #a78bfa; }
    .insight-desc { font-size: 14px; color: #cbd5e1; margin-top: 8px; }
    .trend-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .trend-tag { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }
    .trend-count { 
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
      font-size: 11px;
    }
    .badge { 
      display: inline-block; 
      padding: 3px 8px; 
      border-radius: 12px; 
      font-size: 11px; 
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-critical { background: #fee2e2; color: #dc2626; }
    .badge-high { background: #fef3c7; color: #d97706; }
    .badge-product { background: #ddd6fe; color: #7c3aed; }
    .footer { 
      background: #1a1a2e;
      padding: 25px;
      text-align: center;
      border-top: 1px solid rgba(139, 92, 246, 0.2);
    }
    .footer p { margin: 0; color: #64748b; font-size: 12px; }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Informe Semanal de Noticias</h1>
      <p>${formatDate(startDate)} - ${formatDate(endDate)}</p>
    </div>
    
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalArticles || 0}</div>
          <div class="stat-label">Artículos Analizados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${criticalNews?.length || 0}</div>
          <div class="stat-label">Noticias Críticas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${pendingInsights || 0}</div>
          <div class="stat-label">Insights Pendientes</div>
        </div>
      </div>

      ${topTrends.length > 0 ? `
      <div class="section">
        <div class="section-title">🔥 Tendencias Detectadas</div>
        <div class="trend-grid">
          ${topTrends.map(t => `
            <span class="trend-tag">${t.trend}<span class="trend-count">${t.count}</span></span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${criticalNews && criticalNews.length > 0 ? `
      <div class="section">
        <div class="section-title">⚠️ Noticias Críticas de la Semana</div>
        ${criticalNews.map((news: CriticalNews) => `
          <div class="news-item ${news.importance_level}">
            <div class="news-title">${news.title}</div>
            <div class="news-meta">
              <span class="badge badge-${news.importance_level}">${news.importance_level}</span>
              ${news.product_connection ? `<span class="badge badge-product">${news.product_connection}</span>` : ''}
              · ${news.source_name || 'Fuente desconocida'}
              · ${new Date(news.published_at).toLocaleDateString('es-ES')}
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${insights && insights.length > 0 ? `
      <div class="section">
        <div class="section-title">💡 Insights y Mejoras Detectadas</div>
        ${insights.slice(0, 5).map((insight: NewsInsight) => `
          <div class="insight-item">
            <div class="insight-title">
              ${insight.insight_type === 'feature' ? '✨' : insight.insight_type === 'improvement' ? '🔧' : '🎯'} 
              ${insight.title}
            </div>
            <div class="insight-desc">${insight.description}</div>
            ${insight.product_connection ? `
              <div class="news-meta" style="margin-top: 10px;">
                <span class="badge badge-product">${insight.product_connection}</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://obelixia.com/admin" class="cta-button">Ver Dashboard Completo →</a>
      </div>
    </div>

    <div class="footer">
      <p>Este informe fue generado automáticamente por <strong>ObelixIA</strong></p>
      <p style="margin-top: 5px;">Inteligencia artificial al servicio del compliance financiero</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send emails
    const emails = recipientEmails || ["team@obelixia.com"];
    const results: any[] = [];

    for (const email of emails) {
      try {
        if (!testMode) {
          const { data, error } = await resend.emails.send({
            from: "ObelixIA News <onboarding@resend.dev>",
            to: [email],
            subject: `📊 Informe Semanal de Noticias | ${formatDate(startDate)} - ${formatDate(endDate)}`,
            html: emailHtml,
          });

          if (error) throw error;
          results.push({ email, status: "sent", id: data?.id });
        } else {
          results.push({ email, status: "test_mode", message: "Email not sent in test mode" });
        }
      } catch (emailError: any) {
        console.error(`Error sending to ${email}:`, emailError);
        results.push({ email, status: "error", error: emailError.message });
      }
    }

    // Log the report generation
    await supabase.from("news_weekly_reports").insert({
      report_date: new Date().toISOString(),
      week_start: startDate.toISOString(),
      week_end: endDate.toISOString(),
      total_articles: totalArticles || 0,
      critical_news_count: criticalNews?.length || 0,
      insights_generated: insights?.length || 0,
      top_trends: topTrends,
      key_insights: insights?.slice(0, 5).map((i: NewsInsight) => i.title) || [],
      email_sent: !testMode,
      recipients: emails,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Report ${testMode ? 'generated (test mode)' : 'sent'} successfully`,
        results,
        stats: {
          totalArticles,
          criticalNews: criticalNews?.length || 0,
          insights: insights?.length || 0,
          trends: topTrends.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating weekly report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
