import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RealTimeInsightsRequest {
  action: 'initialize' | 'acknowledge' | 'execute_action' | 'subscribe_stream' | 'unsubscribe_stream';
  context?: Record<string, unknown>;
  insightId?: string;
  actionId?: string;
  actionPayload?: Record<string, unknown>;
  streamId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, context, insightId, streamId } = await req.json() as RealTimeInsightsRequest;

    console.log(`[realtime-insights] Processing action: ${action}`);

    switch (action) {
      case 'initialize':
        return new Response(JSON.stringify({
          success: true,
          insights: [
            {
              id: 'insight-rt-1',
              type: 'opportunity',
              category: 'sales',
              title: 'Oportunidad de Upsell detectada',
              description: 'Cliente con alto engagement listo para upgrade',
              severity: 'high',
              confidence: 0.89,
              impact: { type: 'revenue', estimatedValue: 5000, unit: 'EUR' },
              source: { table: 'customers', recordId: 'cust-123', trigger: 'engagement_score_threshold' },
              actions: [
                { id: 'act-1', label: 'Ver cliente', type: 'navigate', payload: { path: '/customers/cust-123' }, isPrimary: true },
                { id: 'act-2', label: 'Asignar tarea', type: 'execute', payload: { action: 'create_task' } }
              ],
              createdAt: new Date().toISOString(),
              acknowledged: false
            },
            {
              id: 'insight-rt-2',
              type: 'risk',
              category: 'churn',
              title: 'Riesgo de abandono',
              description: 'Cliente sin actividad en 15 días',
              severity: 'critical',
              confidence: 0.82,
              impact: { type: 'revenue', estimatedValue: 12000, unit: 'EUR' },
              source: { table: 'customers', recordId: 'cust-456', trigger: 'inactivity_threshold' },
              actions: [
                { id: 'act-3', label: 'Contactar cliente', type: 'execute', payload: { action: 'send_email' }, isPrimary: true }
              ],
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              acknowledged: false
            },
            {
              id: 'insight-rt-3',
              type: 'trend',
              category: 'performance',
              title: 'Tendencia positiva en conversiones',
              description: 'Conversión 15% superior a la media',
              severity: 'low',
              confidence: 0.94,
              impact: { type: 'efficiency', estimatedValue: 8, unit: '%' },
              source: { table: 'analytics', trigger: 'trend_detection' },
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              acknowledged: true,
              acknowledgedBy: 'user-1',
              acknowledgedAt: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          streams: [
            { id: 'stream-sales', name: 'Ventas', description: 'Insights de oportunidades comerciales', filters: [], isActive: true, subscriberCount: 12, lastInsightAt: new Date().toISOString() },
            { id: 'stream-churn', name: 'Riesgo de Churn', description: 'Alertas de riesgo de abandono', filters: [], isActive: true, subscriberCount: 8, lastInsightAt: new Date().toISOString() },
            { id: 'stream-performance', name: 'Performance', description: 'Métricas de rendimiento', filters: [], isActive: true, subscriberCount: 15, lastInsightAt: new Date().toISOString() }
          ],
          stats: {
            total: 156,
            byType: { opportunity: 45, risk: 32, trend: 48, anomaly: 18, milestone: 8, alert: 5 },
            bySeverity: { low: 62, medium: 54, high: 28, critical: 12 },
            unacknowledged: 23,
            avgConfidence: 0.86,
            impactSummary: {
              totalRevenue: 125000,
              totalCost: 15000,
              opportunitiesCount: 45,
              risksCount: 32
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'acknowledge':
        console.log(`[realtime-insights] Acknowledging insight: ${insightId}`);
        return new Response(JSON.stringify({
          success: true,
          insightId,
          acknowledgedAt: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'execute_action':
        console.log(`[realtime-insights] Executing action for insight: ${insightId}`);
        return new Response(JSON.stringify({
          success: true,
          message: 'Action executed successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'subscribe_stream':
        console.log(`[realtime-insights] Subscribing to stream: ${streamId}`);
        return new Response(JSON.stringify({
          success: true,
          streamId,
          subscribed: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'unsubscribe_stream':
        console.log(`[realtime-insights] Unsubscribing from stream: ${streamId}`);
        return new Response(JSON.stringify({
          success: true,
          streamId,
          subscribed: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({
          success: true,
          message: 'Action processed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('[realtime-insights] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
