// Support External Integrations Hook - Phase 6C: External Integrations
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface WebhookResult {
  webhook_id: string;
  url: string;
  event_type: string;
  payload: Record<string, unknown>;
  sent_at: string;
  status: string;
  response_code: number;
  response_time_ms: number;
  retry_count: number;
}

export interface NotificationResult {
  notification_id: string;
  type: 'email' | 'sms' | 'push' | 'slack' | 'teams';
  recipients: string[];
  title: string;
  message: string;
  priority: string;
  sent_at: string;
  status: string;
  delivery_status: Array<{
    recipient: string;
    status: string;
    delivered_at: string;
  }>;
}

export interface ExternalTicket {
  internal_id: string;
  external_id: string;
  external_system: 'jira' | 'zendesk' | 'freshdesk' | 'servicenow' | 'custom';
  title: string;
  description: string;
  priority: string;
  assignee?: string;
  labels: string[];
  status: string;
  created_at: string;
  external_url: string;
  sync_status: string;
  last_synced_at: string;
}

export interface TicketSyncResult {
  internal_id: string;
  sync_direction: string;
  fields_synced: string[];
  last_synced_at: string;
  changes_detected: Array<{
    field: string;
    old_value: unknown;
    new_value: unknown;
    source: string;
  }>;
  conflicts: unknown[];
  next_sync_scheduled: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'ticketing' | 'notifications' | 'webhooks' | 'alerting';
  status: 'connected' | 'disconnected' | 'pending';
  last_sync?: string;
  last_message?: string;
  last_alert?: string;
  tickets_synced?: number;
  webhooks_configured?: number;
  events_dispatched_today?: number;
  incidents_created?: number;
  channels?: string[];
  config?: Record<string, unknown>;
}

export interface ConnectionTestResult {
  integration_id?: string;
  test_started_at: string;
  test_completed_at: string;
  status: 'success' | 'failed';
  latency_ms: number;
  tests: Array<{
    name: string;
    status: 'pass' | 'fail';
    duration_ms: number;
  }>;
  message: string;
}

// === HOOK ===
export function useSupportExternalIntegrations() {
  const [isLoading, setIsLoading] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [tickets, setTickets] = useState<ExternalTicket[]>([]);
  const [webhookResults, setWebhookResults] = useState<WebhookResult[]>([]);
  const [notificationResults, setNotificationResults] = useState<NotificationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === SEND WEBHOOK ===
  const sendWebhook = useCallback(async (params: {
    webhook_url: string;
    event_type: string;
    payload: Record<string, unknown>;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-external-integrations', {
        body: { action: 'send_webhook', params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setWebhookResults(prev => [data.data, ...prev]);
        toast.success('Webhook enviado correctamente');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error sending webhook';
      setError(message);
      toast.error('Error al enviar webhook');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SEND NOTIFICATION ===
  const sendNotification = useCallback(async (notification: {
    type: 'email' | 'sms' | 'push' | 'slack' | 'teams';
    recipients: string[];
    title: string;
    message: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-external-integrations', {
        body: { action: 'send_notification', params: { notification } }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setNotificationResults(prev => [data.data, ...prev]);
        toast.success('Notificación enviada');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error sending notification';
      setError(message);
      toast.error('Error al enviar notificación');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CREATE TICKET ===
  const createTicket = useCallback(async (ticket: {
    external_system: 'jira' | 'zendesk' | 'freshdesk' | 'servicenow' | 'custom';
    title: string;
    description: string;
    priority: string;
    assignee?: string;
    labels?: string[];
    custom_fields?: Record<string, unknown>;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-external-integrations', {
        body: { action: 'create_ticket', params: { ticket } }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setTickets(prev => [data.data, ...prev]);
        toast.success(`Ticket creado: ${data.data.external_id}`);
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating ticket';
      setError(message);
      toast.error('Error al crear ticket');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SYNC TICKET ===
  const syncTicket = useCallback(async (ticketId: string): Promise<TicketSyncResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-external-integrations', {
        body: { action: 'sync_ticket', params: { ticket: { external_system: ticketId } } }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        toast.success('Ticket sincronizado');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error syncing ticket';
      setError(message);
      toast.error('Error al sincronizar ticket');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET INTEGRATIONS ===
  const getIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-external-integrations', {
        body: { action: 'get_integrations' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setIntegrations(data.data.integrations || []);
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching integrations';
      setError(message);
      toast.error('Error al obtener integraciones');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CONFIGURE INTEGRATION ===
  const configureIntegration = useCallback(async (integrationId: string, config: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-external-integrations', {
        body: { action: 'configure_integration', params: { integration_id: integrationId, config } }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        // Update local state
        setIntegrations(prev => prev.map(i => 
          i.id === integrationId ? { ...i, status: 'connected' as const, config } : i
        ));
        toast.success('Integración configurada');
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error configuring integration';
      setError(message);
      toast.error('Error al configurar integración');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === TEST CONNECTION ===
  const testConnection = useCallback(async (integrationId: string): Promise<ConnectionTestResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-external-integrations', {
        body: { action: 'test_connection', params: { integration_id: integrationId } }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        if (data.data.status === 'success') {
          toast.success('Conexión exitosa');
        } else {
          toast.error('Error de conexión');
        }
        return data.data;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error testing connection';
      setError(message);
      toast.error('Error al probar conexión');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CLEAR STATE ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setIntegrations([]);
    setTickets([]);
    setWebhookResults([]);
    setNotificationResults([]);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    integrations,
    tickets,
    webhookResults,
    notificationResults,
    error,
    // Actions
    sendWebhook,
    sendNotification,
    createTicket,
    syncTicket,
    getIntegrations,
    configureIntegration,
    testConnection,
    clearError,
    reset
  };
}

export default useSupportExternalIntegrations;
