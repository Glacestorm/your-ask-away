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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { articleId, manualTrigger } = await req.json();

    // Get article details
    let articles = [];
    if (articleId) {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', articleId)
        .single();
      if (data) articles = [data];
    } else {
      // Get recent critical/high importance articles not yet alerted
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .in('importance_level', ['critical', 'high'])
        .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false })
        .limit(10);
      articles = data || [];
    }

    if (articles.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No hay artículos para alertar' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get users with active alert channels
    const { data: channels, error: channelsError } = await supabase
      .from('user_alert_channels')
      .select('*')
      .eq('is_active', true)
      .eq('is_verified', true);

    if (channelsError) throw channelsError;

    const alertsSent: string[] = [];
    const alertsFailed: string[] = [];

    for (const article of articles) {
      // Check if already alerted
      const { data: existingAlert } = await supabase
        .from('news_alert_log')
        .select('id')
        .eq('article_id', article.id)
        .eq('status', 'sent')
        .limit(1);

      if (existingAlert && existingAlert.length > 0 && !manualTrigger) {
        continue; // Already alerted
      }

      for (const channel of channels || []) {
        // Check if article matches user filters
        const alertLevels = channel.alert_levels || ['critical', 'high'];
        if (!alertLevels.includes(article.importance_level)) continue;

        // Check quiet hours
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        if (channel.quiet_hours_start && channel.quiet_hours_end) {
          if (currentTime >= channel.quiet_hours_start && currentTime <= channel.quiet_hours_end) {
            continue; // In quiet hours
          }
        }

        // Build alert message
        const message = `🔔 *${article.importance_level === 'critical' ? '⚠️ CRÍTICO' : 'IMPORTANTE'}*\n\n` +
          `📰 *${article.title}*\n\n` +
          `${article.ai_summary || article.excerpt || ''}\n\n` +
          `📊 Relevancia: ${article.relevance_score}%\n` +
          `🏷️ ${article.category || 'General'}\n` +
          `📅 ${new Date(article.published_at).toLocaleDateString('es-ES')}`;

        try {
          let status = 'sent';
          let externalId = null;

          // Send based on channel type
          if (channel.channel_type === 'telegram') {
            const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
            if (telegramToken) {
              const chatId = channel.channel_config?.chat_id;
              if (chatId) {
                const response = await fetch(
                  `https://api.telegram.org/bot${telegramToken}/sendMessage`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: message,
                      parse_mode: 'Markdown',
                    }),
                  }
                );
                const result = await response.json();
                if (!result.ok) {
                  throw new Error(result.description);
                }
                externalId = result.result?.message_id?.toString();
              }
            }
          } else if (channel.channel_type === 'email') {
            // Use Resend for email
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey) {
              const email = channel.channel_config?.email;
              if (email) {
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'ObelixIA <noticias@obelixia.com>',
                    to: [email],
                    subject: `📰 ${article.importance_level === 'critical' ? '⚠️ CRÍTICO: ' : ''}${article.title}`,
                    html: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">${article.title}</h2>
                        <p style="color: #666;">${article.ai_summary || article.excerpt || ''}</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                          <p><strong>Relevancia:</strong> ${article.relevance_score}%</p>
                          <p><strong>Categoría:</strong> ${article.category || 'General'}</p>
                          <p><strong>Fecha:</strong> ${new Date(article.published_at).toLocaleDateString('es-ES')}</p>
                        </div>
                        <a href="${article.source_url}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Ver noticia completa</a>
                      </div>
                    `,
                  }),
                });
              }
            }
          }
          // Note: WhatsApp requires Business API approval - placeholder for future implementation

          // Log the alert
          await supabase.from('news_alert_log').insert({
            article_id: article.id,
            user_id: channel.user_id,
            channel: channel.channel_type,
            recipient: channel.channel_config?.chat_id || channel.channel_config?.email || channel.channel_config?.phone || 'unknown',
            message_content: message,
            status,
            external_id: externalId,
            sent_at: new Date().toISOString(),
          });

          alertsSent.push(`${channel.channel_type}:${channel.user_id}`);
        } catch (error) {
          console.error(`Error sending ${channel.channel_type} alert:`, error);
          
          await supabase.from('news_alert_log').insert({
            article_id: article.id,
            user_id: channel.user_id,
            channel: channel.channel_type,
            recipient: channel.channel_config?.chat_id || channel.channel_config?.email || channel.channel_config?.phone || 'unknown',
            message_content: message,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });

          alertsFailed.push(`${channel.channel_type}:${channel.user_id}`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      articlesProcessed: articles.length,
      alertsSent: alertsSent.length,
      alertsFailed: alertsFailed.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in dispatch-news-alerts:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
