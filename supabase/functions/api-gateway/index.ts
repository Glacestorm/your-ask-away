import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GatewayRequest {
  action: 'list_endpoints' | 'create_endpoint' | 'update_endpoint' | 'get_metrics' | 'list_api_keys' | 'create_api_key' | 'revoke_api_key';
  endpoint?: Record<string, unknown>;
  endpointId?: string;
  updates?: Record<string, unknown>;
  period?: string;
  name?: string;
  scopes?: string[];
  expiresAt?: string;
  keyId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, endpoint, endpointId, updates, period, name, scopes, expiresAt, keyId } = await req.json() as GatewayRequest;
    console.log(`[api-gateway] Action: ${action}`);

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'list_endpoints':
        result = {
          endpoints: [
            {
              id: 'ep_001',
              path: '/api/v1/customers',
              method: 'GET',
              name: 'List Customers',
              description: 'Retrieve paginated list of customers',
              is_public: false,
              rate_limit: 100,
              rate_limit_window_ms: 60000,
              authentication_required: true,
              allowed_origins: ['*'],
              cache_ttl_seconds: 300,
              is_active: true,
              version: 'v1',
              created_at: new Date().toISOString()
            },
            {
              id: 'ep_002',
              path: '/api/v1/orders',
              method: 'POST',
              name: 'Create Order',
              description: 'Create a new order',
              is_public: false,
              rate_limit: 50,
              rate_limit_window_ms: 60000,
              authentication_required: true,
              allowed_origins: ['https://app.example.com'],
              cache_ttl_seconds: null,
              is_active: true,
              version: 'v1',
              created_at: new Date().toISOString()
            },
            {
              id: 'ep_003',
              path: '/api/v1/health',
              method: 'GET',
              name: 'Health Check',
              description: 'API health status',
              is_public: true,
              rate_limit: 1000,
              rate_limit_window_ms: 60000,
              authentication_required: false,
              allowed_origins: ['*'],
              cache_ttl_seconds: 10,
              is_active: true,
              version: 'v1',
              created_at: new Date().toISOString()
            }
          ]
        };
        break;

      case 'create_endpoint':
        result = {
          endpoint: {
            id: `ep_${Date.now()}`,
            ...endpoint,
            is_active: true,
            created_at: new Date().toISOString()
          }
        };
        break;

      case 'update_endpoint':
        result = { updated: true, endpointId };
        break;

      case 'get_metrics':
        result = {
          metrics: [
            {
              endpoint_id: endpointId || 'ep_001',
              total_requests: 15420,
              success_count: 15350,
              error_count: 70,
              avg_latency_ms: 45,
              p95_latency_ms: 120,
              requests_per_minute: 25.7,
              period_start: new Date(Date.now() - 86400000).toISOString(),
              period_end: new Date().toISOString()
            }
          ]
        };
        break;

      case 'list_api_keys':
        result = {
          apiKeys: [
            {
              id: 'key_001',
              name: 'Production Mobile App',
              key_prefix: 'sk_live_xxx',
              scopes: ['read:customers', 'write:orders'],
              rate_limit: 1000,
              expires_at: null,
              is_active: true,
              last_used_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            },
            {
              id: 'key_002',
              name: 'Partner Integration',
              key_prefix: 'sk_live_yyy',
              scopes: ['read:products'],
              rate_limit: 500,
              expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
              is_active: true,
              last_used_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          ]
        };
        break;

      case 'create_api_key':
        const newKey = `sk_live_${crypto.randomUUID().replace(/-/g, '').substring(0, 32)}`;
        result = {
          apiKey: {
            id: `key_${Date.now()}`,
            name,
            key: newKey, // Full key only shown once
            key_prefix: newKey.substring(0, 12) + '...',
            scopes: scopes || [],
            rate_limit: null,
            expires_at: expiresAt || null,
            is_active: true,
            last_used_at: null,
            created_at: new Date().toISOString()
          }
        };
        break;

      case 'revoke_api_key':
        result = { revoked: true, keyId };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[api-gateway] Success: ${action}`);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[api-gateway] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
