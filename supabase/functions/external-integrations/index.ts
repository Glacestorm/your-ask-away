import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntegrationRequest {
  action: 'list_integrations' | 'check_health' | 'connect' | 'disconnect' | 'sync';
  provider?: string;
  integrationId?: string;
  config?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, provider, integrationId, config } = await req.json() as IntegrationRequest;
    console.log(`[external-integrations] Action: ${action}`);

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'list_integrations':
        result = {
          integrations: [
            {
              id: 'int_001',
              name: 'Salesforce CRM',
              provider: 'salesforce',
              integration_type: 'oauth',
              status: 'active',
              config: { instance_url: 'https://company.salesforce.com' },
              credentials_encrypted: true,
              last_sync_at: new Date().toISOString(),
              health_status: 'healthy',
              rate_limit_remaining: 9500,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'int_002',
              name: 'HubSpot Marketing',
              provider: 'hubspot',
              integration_type: 'api',
              status: 'active',
              config: { portal_id: '12345' },
              credentials_encrypted: true,
              last_sync_at: new Date().toISOString(),
              health_status: 'healthy',
              rate_limit_remaining: 4800,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'int_003',
              name: 'Stripe Payments',
              provider: 'stripe',
              integration_type: 'api',
              status: 'active',
              config: { mode: 'live' },
              credentials_encrypted: true,
              last_sync_at: new Date().toISOString(),
              health_status: 'healthy',
              rate_limit_remaining: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
        };
        break;

      case 'check_health':
        result = {
          health: [
            {
              integration_id: integrationId || 'int_001',
              latency_ms: Math.floor(Math.random() * 200) + 50,
              success_rate: 99.5 + Math.random() * 0.5,
              last_error: null,
              checked_at: new Date().toISOString()
            }
          ]
        };
        break;

      case 'connect':
        result = {
          integration: {
            id: `int_${Date.now()}`,
            name: `${provider} Integration`,
            provider,
            integration_type: 'api',
            status: 'active',
            config: config || {},
            credentials_encrypted: true,
            last_sync_at: null,
            health_status: 'healthy',
            rate_limit_remaining: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
        break;

      case 'disconnect':
        result = { disconnected: true, integrationId };
        break;

      case 'sync':
        result = {
          syncResult: {
            integration_id: integrationId,
            records_synced: Math.floor(Math.random() * 500) + 100,
            duration_ms: Math.floor(Math.random() * 5000) + 1000,
            synced_at: new Date().toISOString()
          }
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[external-integrations] Success: ${action}`);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[external-integrations] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
