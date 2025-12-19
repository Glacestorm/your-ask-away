import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

interface MetricPayload {
  metrics: WebVitalMetric[];
  url?: string;
  userAgent?: string;
  sessionId?: string;
  pagePath?: string;
  deviceType?: string;
  connectionType?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorPayload {
  errorMessage: string;
  errorStack?: string;
  errorCode?: string;
  severity?: 'info' | 'warn' | 'error' | 'critical';
  componentName?: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// Thresholds for alerting
const THRESHOLDS = {
  LCP: { warning: 2500, critical: 4000 },
  CLS: { warning: 0.1, critical: 0.25 },
  INP: { warning: 200, critical: 500 },
  FID: { warning: 100, critical: 300 },
  FCP: { warning: 1800, critical: 3000 },
  TTFB: { warning: 800, critical: 1800 },
};

function checkThreshold(metric: WebVitalMetric): { shouldAlert: boolean; severity: 'warning' | 'critical' } | null {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  if (!threshold) return null;

  if (metric.value > threshold.critical) {
    return { shouldAlert: true, severity: 'critical' };
  }
  if (metric.value > threshold.warning) {
    return { shouldAlert: true, severity: 'warning' };
  }
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const action = body.action || 'metrics';

    if (action === 'metrics') {
      const payload = body as MetricPayload;
      
      if (!payload.metrics || !Array.isArray(payload.metrics)) {
        return new Response(
          JSON.stringify({ error: 'Invalid payload: metrics array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[collect-metrics] Receiving ${payload.metrics.length} metrics`);

      const metricsToInsert = payload.metrics.map(metric => ({
        metric_name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        url: payload.url,
        user_agent: payload.userAgent,
        session_id: payload.sessionId,
        page_path: payload.pagePath,
        device_type: payload.deviceType,
        connection_type: payload.connectionType,
        metadata: payload.metadata || {},
      }));

      // Insert metrics
      const { error: insertError } = await supabase
        .from('performance_metrics')
        .insert(metricsToInsert);

      if (insertError) {
        console.error('[collect-metrics] Insert error:', insertError);
        throw insertError;
      }

      // Check thresholds and create alerts if needed
      const alertsToInsert = [];
      for (const metric of payload.metrics) {
        const alertCheck = checkThreshold(metric);
        if (alertCheck?.shouldAlert) {
          alertsToInsert.push({
            alert_type: 'performance_threshold',
            metric_name: metric.name,
            threshold_value: THRESHOLDS[metric.name as keyof typeof THRESHOLDS]?.[alertCheck.severity] || 0,
            actual_value: metric.value,
            severity: alertCheck.severity,
            message: `${metric.name} exceeded ${alertCheck.severity} threshold: ${metric.value}`,
            metadata: { url: payload.url, sessionId: payload.sessionId },
          });
        }
      }

      if (alertsToInsert.length > 0) {
        const { error: alertError } = await supabase
          .from('performance_alerts')
          .insert(alertsToInsert);

        if (alertError) {
          console.error('[collect-metrics] Alert insert error:', alertError);
        } else {
          console.log(`[collect-metrics] Created ${alertsToInsert.length} alerts`);
        }
      }

      console.log(`[collect-metrics] Successfully stored ${metricsToInsert.length} metrics`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          metricsStored: metricsToInsert.length,
          alertsCreated: alertsToInsert.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'error') {
      const payload = body as ErrorPayload;

      if (!payload.errorMessage) {
        return new Response(
          JSON.stringify({ error: 'Invalid payload: errorMessage required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[collect-metrics] Logging error: ${payload.errorMessage}`);

      const { error: insertError } = await supabase
        .from('error_logs')
        .insert({
          error_message: payload.errorMessage,
          error_stack: payload.errorStack,
          error_code: payload.errorCode,
          severity: payload.severity || 'error',
          component_name: payload.componentName,
          url: payload.url,
          user_agent: payload.userAgent,
          session_id: payload.sessionId,
          metadata: payload.metadata || {},
        });

      if (insertError) {
        console.error('[collect-metrics] Error log insert error:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[collect-metrics] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
