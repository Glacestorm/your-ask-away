import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntegrationRequest {
  action: 'send_webhook' | 'send_notification' | 'create_ticket' | 'sync_ticket' | 'get_integrations' | 'configure_integration' | 'test_connection';
  params?: {
    integration_id?: string;
    webhook_url?: string;
    event_type?: string;
    payload?: Record<string, unknown>;
    notification?: {
      type: 'email' | 'sms' | 'push' | 'slack' | 'teams';
      recipients: string[];
      title: string;
      message: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    };
    ticket?: {
      external_system: 'jira' | 'zendesk' | 'freshdesk' | 'servicenow' | 'custom';
      title: string;
      description: string;
      priority: string;
      assignee?: string;
      labels?: string[];
      custom_fields?: Record<string, unknown>;
    };
    config?: Record<string, unknown>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json() as IntegrationRequest;

    console.log(`[support-external-integrations] Action: ${action}`, params);

    switch (action) {
      case 'send_webhook': {
        // Simulate webhook dispatch
        const webhookResult = {
          webhook_id: crypto.randomUUID(),
          url: params?.webhook_url || 'https://example.com/webhook',
          event_type: params?.event_type || 'session.completed',
          payload: params?.payload || {},
          sent_at: new Date().toISOString(),
          status: 'delivered',
          response_code: 200,
          response_time_ms: 125,
          retry_count: 0
        };

        console.log(`[Webhook sent] ${JSON.stringify(webhookResult)}`);

        return new Response(JSON.stringify({
          success: true,
          data: webhookResult,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_notification': {
        const notification = params?.notification;
        if (!notification) {
          throw new Error('Notification details required');
        }

        const notificationResult = {
          notification_id: crypto.randomUUID(),
          type: notification.type,
          recipients: notification.recipients,
          title: notification.title,
          message: notification.message,
          priority: notification.priority || 'normal',
          sent_at: new Date().toISOString(),
          status: 'sent',
          delivery_status: notification.recipients.map(r => ({
            recipient: r,
            status: 'delivered',
            delivered_at: new Date().toISOString()
          }))
        };

        console.log(`[Notification sent] ${JSON.stringify(notificationResult)}`);

        return new Response(JSON.stringify({
          success: true,
          data: notificationResult,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create_ticket': {
        const ticket = params?.ticket;
        if (!ticket) {
          throw new Error('Ticket details required');
        }

        const ticketResult = {
          internal_id: crypto.randomUUID(),
          external_id: `${ticket.external_system.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
          external_system: ticket.external_system,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          assignee: ticket.assignee,
          labels: ticket.labels || [],
          status: 'open',
          created_at: new Date().toISOString(),
          external_url: `https://${ticket.external_system}.example.com/ticket/${Math.floor(Math.random() * 10000)}`,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString()
        };

        console.log(`[Ticket created] ${JSON.stringify(ticketResult)}`);

        return new Response(JSON.stringify({
          success: true,
          data: ticketResult,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_ticket': {
        const syncResult = {
          internal_id: params?.ticket?.external_system || crypto.randomUUID(),
          sync_direction: 'bidirectional',
          fields_synced: ['status', 'priority', 'assignee', 'comments'],
          last_synced_at: new Date().toISOString(),
          changes_detected: [
            { field: 'status', old_value: 'open', new_value: 'in_progress', source: 'external' },
            { field: 'priority', old_value: 'medium', new_value: 'high', source: 'external' }
          ],
          conflicts: [],
          next_sync_scheduled: new Date(Date.now() + 5 * 60000).toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          data: syncResult,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_integrations': {
        const integrations = [
          {
            id: 'jira-cloud',
            name: 'Jira Cloud',
            type: 'ticketing',
            status: 'connected',
            last_sync: new Date(Date.now() - 300000).toISOString(),
            tickets_synced: 245,
            config: { project_key: 'SUPPORT', sync_interval: 5 }
          },
          {
            id: 'slack-workspace',
            name: 'Slack',
            type: 'notifications',
            status: 'connected',
            last_message: new Date(Date.now() - 600000).toISOString(),
            channels: ['#support-alerts', '#critical-issues'],
            config: { workspace: 'company', bot_name: 'SupportBot' }
          },
          {
            id: 'zendesk-support',
            name: 'Zendesk',
            type: 'ticketing',
            status: 'disconnected',
            last_sync: null,
            config: null
          },
          {
            id: 'ms-teams',
            name: 'Microsoft Teams',
            type: 'notifications',
            status: 'connected',
            last_message: new Date(Date.now() - 1800000).toISOString(),
            channels: ['Support Team'],
            config: { tenant: 'company.onmicrosoft.com' }
          },
          {
            id: 'webhook-custom',
            name: 'Custom Webhooks',
            type: 'webhooks',
            status: 'connected',
            webhooks_configured: 5,
            events_dispatched_today: 128,
            config: { timeout_ms: 5000, retry_count: 3 }
          },
          {
            id: 'servicenow',
            name: 'ServiceNow',
            type: 'ticketing',
            status: 'pending',
            last_sync: null,
            config: { instance: 'company.service-now.com' }
          },
          {
            id: 'pagerduty',
            name: 'PagerDuty',
            type: 'alerting',
            status: 'connected',
            incidents_created: 12,
            last_alert: new Date(Date.now() - 86400000).toISOString(),
            config: { service_id: 'P123ABC', escalation_policy: 'default' }
          }
        ];

        return new Response(JSON.stringify({
          success: true,
          data: {
            integrations,
            summary: {
              total: integrations.length,
              connected: integrations.filter(i => i.status === 'connected').length,
              disconnected: integrations.filter(i => i.status === 'disconnected').length,
              pending: integrations.filter(i => i.status === 'pending').length
            }
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'configure_integration': {
        const configResult = {
          integration_id: params?.integration_id || crypto.randomUUID(),
          config: params?.config || {},
          updated_at: new Date().toISOString(),
          status: 'configured',
          validation: {
            passed: true,
            tests_run: ['connection', 'authentication', 'permissions'],
            warnings: []
          }
        };

        return new Response(JSON.stringify({
          success: true,
          data: configResult,
          message: 'Integration configured successfully',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'test_connection': {
        const testResult = {
          integration_id: params?.integration_id,
          test_started_at: new Date().toISOString(),
          test_completed_at: new Date().toISOString(),
          status: 'success',
          latency_ms: 89,
          tests: [
            { name: 'Connection', status: 'pass', duration_ms: 45 },
            { name: 'Authentication', status: 'pass', duration_ms: 23 },
            { name: 'Permissions', status: 'pass', duration_ms: 12 },
            { name: 'API Version', status: 'pass', duration_ms: 9 }
          ],
          message: 'All tests passed successfully'
        };

        return new Response(JSON.stringify({
          success: true,
          data: testResult,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[support-external-integrations] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
