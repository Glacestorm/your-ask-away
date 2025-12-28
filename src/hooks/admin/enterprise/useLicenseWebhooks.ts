/**
 * License Webhooks Hook
 * Gestión de webhooks para eventos de licencias
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LicenseWebhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret_key: string | null;
  events: string[];
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at: string | null;
  last_status: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  attempt_number: number;
  delivered_at: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface CreateWebhookParams {
  name: string;
  url: string;
  events: string[];
  secret_key?: string;
  retry_count?: number;
  timeout_seconds?: number;
}

export const WEBHOOK_EVENTS = [
  { value: 'license.created', label: 'Licencia creada' },
  { value: 'license.activated', label: 'Licencia activada' },
  { value: 'license.expired', label: 'Licencia expirada' },
  { value: 'license.renewed', label: 'Licencia renovada' },
  { value: 'license.suspended', label: 'Licencia suspendida' },
  { value: 'license.revoked', label: 'Licencia revocada' },
  { value: 'device.activated', label: 'Dispositivo activado' },
  { value: 'device.deactivated', label: 'Dispositivo desactivado' },
  { value: 'anomaly.detected', label: 'Anomalía detectada' },
  { value: 'usage.limit_reached', label: 'Límite de uso alcanzado' },
];

export function useLicenseWebhooks() {
  const [webhooks, setWebhooks] = useState<LicenseWebhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('license_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWebhooks((data || []) as LicenseWebhook[]);
    } catch (err) {
      console.error('[useLicenseWebhooks] fetchWebhooks error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (webhookId?: string) => {
    try {
      let query = supabase
        .from('license_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setLogs((data || []) as WebhookLog[]);
    } catch (err) {
      console.error('[useLicenseWebhooks] fetchLogs error:', err);
    }
  }, []);

  const createWebhook = useCallback(async (params: CreateWebhookParams) => {
    try {
      const { data, error: insertError } = await supabase
        .from('license_webhooks')
        .insert([{
          organization_id: '00000000-0000-0000-0000-000000000001',
          name: params.name,
          url: params.url,
          events: params.events,
          secret_key: params.secret_key || null,
          retry_count: params.retry_count || 3,
          timeout_seconds: params.timeout_seconds || 30,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      setWebhooks(prev => [data as LicenseWebhook, ...prev]);
      toast.success('Webhook creado correctamente');
      return data as LicenseWebhook;
    } catch (err) {
      console.error('[useLicenseWebhooks] createWebhook error:', err);
      toast.error('Error al crear webhook');
      return null;
    }
  }, []);

  const updateWebhook = useCallback(async (id: string, updates: Partial<CreateWebhookParams & { is_active: boolean }>) => {
    try {
      const { error: updateError } = await supabase
        .from('license_webhooks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, ...updates } as LicenseWebhook : w));
      toast.success('Webhook actualizado');
      return true;
    } catch (err) {
      console.error('[useLicenseWebhooks] updateWebhook error:', err);
      toast.error('Error al actualizar webhook');
      return false;
    }
  }, []);

  const deleteWebhook = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('license_webhooks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast.success('Webhook eliminado');
      return true;
    } catch (err) {
      console.error('[useLicenseWebhooks] deleteWebhook error:', err);
      toast.error('Error al eliminar webhook');
      return false;
    }
  }, []);

  const testWebhook = useCallback(async (webhook: LicenseWebhook) => {
    try {
      const testPayload = {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        data: { message: 'Test webhook from Obelixia License System' }
      };

      // Log the test attempt
      await supabase
        .from('license_webhook_logs')
        .insert([{
          webhook_id: webhook.id,
          event_type: 'test.ping',
          payload: testPayload,
          attempt_number: 1,
        }]);

      toast.success('Test de webhook enviado');
      return true;
    } catch (err) {
      console.error('[useLicenseWebhooks] testWebhook error:', err);
      toast.error('Error al probar webhook');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    logs,
    loading,
    error,
    fetchWebhooks,
    fetchLogs,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
  };
}

export default useLicenseWebhooks;
