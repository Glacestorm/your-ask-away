import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, moduleKey, dateRange } = await req.json();
    console.log(`[module-analytics] Action: ${action}, Module: ${moduleKey}`);

    const generateMetrics = async (prompt: string) => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Genera métricas realistas de módulos enterprise en JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return { error: 'Rate limit exceeded', status: 429 };
        }
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        return {};
      }
    };

    switch (action) {
      case 'get_dashboard': {
        const result = await generateMetrics(`Genera dashboard de analytics con:
{
  "summary": { "totalModules": number, "activeModules": number, "totalUsers": number, "avgHealthScore": number, "topPerformers": ["string"], "needsAttention": ["string"] },
  "trends": [{ "date": "YYYY-MM-DD", "usage": number, "performance": number, "adoption": number }]
}`);

        return new Response(JSON.stringify({
          success: true,
          data: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_usage': {
        const result = await generateMetrics(`Genera métricas de uso para módulo ${moduleKey}:
{
  "moduleKey": "${moduleKey}",
  "moduleName": "string",
  "totalUsers": number,
  "activeUsers": number,
  "dailyActiveUsers": number,
  "weeklyActiveUsers": number,
  "monthlyActiveUsers": number,
  "avgSessionDuration": number,
  "totalSessions": number,
  "featureUsage": { "feature1": number },
  "lastUpdated": "ISO date"
}`);

        return new Response(JSON.stringify({
          success: true,
          metrics: { ...result, moduleKey }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_performance': {
        const result = await generateMetrics(`Genera métricas de rendimiento para módulo ${moduleKey}:
{
  "loadTime": number (ms),
  "renderTime": number (ms),
  "errorRate": number (0-1),
  "crashRate": number (0-1),
  "memoryUsage": number (MB),
  "cpuUsage": number (%),
  "networkRequests": number,
  "cacheHitRate": number (0-1),
  "lastUpdated": "ISO date"
}`);

        return new Response(JSON.stringify({
          success: true,
          metrics: { ...result, moduleKey }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_adoption': {
        const result = await generateMetrics(`Genera métricas de adopción para módulo ${moduleKey}:
{
  "installCount": number,
  "uninstallCount": number,
  "retentionRate": number (0-100),
  "activationRate": number (0-100),
  "churnRate": number (0-100),
  "nps": number (-100 to 100),
  "satisfactionScore": number (0-10),
  "avgTimeToValue": number (days),
  "adoptionTrend": [{ "date": "YYYY-MM-DD", "value": number }],
  "lastUpdated": "ISO date"
}`);

        return new Response(JSON.stringify({
          success: true,
          metrics: { ...result, moduleKey }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_health_score': {
        const result = await generateMetrics(`Genera health score para módulo ${moduleKey}:
{
  "overallScore": number (0-100),
  "usageScore": number (0-100),
  "performanceScore": number (0-100),
  "adoptionScore": number (0-100),
  "stabilityScore": number (0-100),
  "trend": "up" | "down" | "stable",
  "alerts": ["string"],
  "recommendations": ["string"]
}`);

        return new Response(JSON.stringify({
          success: true,
          healthScore: { ...result, moduleKey }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'export_report': {
        return new Response(JSON.stringify({
          success: true,
          url: `https://example.com/reports/${moduleKey}-${Date.now()}.pdf`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[module-analytics] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
