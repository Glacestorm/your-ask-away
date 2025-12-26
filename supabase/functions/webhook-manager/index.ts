import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  action: 'list_webhooks' | 'create' | 'update' | 'delete' | 'test' | 'list_deliveries' | 'retry_delivery';
  webhook?: Record<string, unknown>;
  webhookId?: string;
  updates?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  deliveryId?: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, webhook, webhookId, updates, payload, deliveryId, limit } = await req.json() as WebhookRequest;
    console.log(`[webhook-manager] Action: ${action}`);

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'list_webhooks':
        result = {
          webhooks: [
            {
              id: 'wh_001',
              name: 'Order Created Webhook',
              url: 'https://api.partner.com/orders',
              direction: 'outgoing',
              event_types: ['order.created', 'order.updated'],
              secret_hash: 'whsec_xxx',
              is_active: true,
              retry_policy: { max_retries: 3, backoff_ms: 1000 },
              headers: { 'X-Source': 'MyApp' },
              last_triggered_at: new Date().toISOString(),
              success_count: 1250,
              failure_count: 12,
              created_at: new Date().toISOString()
            },
            {
              id: 'wh_002',
              name: 'Payment Received',
              url: 'https://api.accounting.com/payments',
              direction: 'outgoing',
              event_types: ['payment.success'],
              secret_hash: 'whsec_yyy',
              is_active: true,
              retry_policy: { max_retries: 5, backoff_ms: 2000 },
              headers: {},
              last_triggered_at: new Date().toISOString(),
              success_count: 890,
              failure_count: 3,
              created_at: new Date().toISOString()
            }
          ]
        };
        break;

      case 'create':
        result = {
          webhook: {
            id: `wh_${Date.now()}`,
            ...webhook,
            is_active: true,
            success_count: 0,
            failure_count: 0,
            created_at: new Date().toISOString()
          }
        };
        break;

      case 'update':
        result = { updated: true, webhookId };
        break;

      case 'delete':
        result = { deleted: true, webhookId };
        break;

      case 'test':
        result = {
          result: {
            status_code: 200,
            response_time_ms: Math.floor(Math.random() * 300) + 50,
            response_body: '{"received": true}',
            tested_at: new Date().toISOString()
          }
        };
        break;

      case 'list_deliveries':
        result = {
          deliveries: Array.from({ length: Math.min(limit || 10, 10) }, (_, i) => ({
            id: `del_${Date.now()}_${i}`,
            webhook_id: webhookId,
            event_type: 'order.created',
            payload: { order_id: `ord_${1000 + i}` },
            response_status: i === 3 ? 500 : 200,
            response_body: i === 3 ? '{"error": "timeout"}' : '{"ok": true}',
            attempt_count: i === 3 ? 3 : 1,
            status: i === 3 ? 'failed' : 'success',
            delivered_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }))
        };
        break;

      case 'retry_delivery':
        result = { retried: true, deliveryId };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[webhook-manager] Success: ${action}`);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[webhook-manager] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
