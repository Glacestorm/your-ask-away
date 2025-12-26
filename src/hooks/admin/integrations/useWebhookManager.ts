/**
 * useWebhookManager Hook
 * Fase 10 - Integration & External Services
 * Gestión de webhooks entrantes y salientes
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  direction: 'incoming' | 'outgoing';
  event_types: string[];
  secret_hash: string | null;
  is_active: boolean;
  retry_policy: {
    max_retries: number;
    backoff_ms: number;
  };
  headers: Record<string, string>;
  last_triggered_at: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  attempt_count: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  delivered_at: string | null;
  created_at: string;
}

export function useWebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhook-manager', {
        body: { action: 'list_webhooks' }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setWebhooks(data.webhooks || []);
        return data.webhooks;
      }
      throw new Error(data?.error || 'Error fetching webhooks');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useWebhookManager] fetchWebhooks error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWebhook = useCallback(async (webhook: Partial<Webhook>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhook-manager', {
        body: { action: 'create', webhook }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Webhook creado');
        setWebhooks(prev => [...prev, data.webhook]);
        return data.webhook;
      }
      throw new Error(data?.error || 'Creation failed');
    } catch (err) {
      toast.error('Error al crear webhook');
      return null;
    }
  }, []);

  const updateWebhook = useCallback(async (id: string, updates: Partial<Webhook>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhook-manager', {
        body: { action: 'update', webhookId: id, updates }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Webhook actualizado');
        setWebhooks(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al actualizar');
      return false;
    }
  }, []);

  const deleteWebhook = useCallback(async (id: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhook-manager', {
        body: { action: 'delete', webhookId: id }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Webhook eliminado');
        setWebhooks(prev => prev.filter(w => w.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al eliminar');
      return false;
    }
  }, []);

  const testWebhook = useCallback(async (id: string, testPayload?: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhook-manager', {
        body: { action: 'test', webhookId: id, payload: testPayload }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Test enviado correctamente');
        return data.result;
      }
      toast.error('Test fallido');
      return null;
    } catch (err) {
      toast.error('Error en test');
      return null;
    }
  }, []);

  const fetchDeliveries = useCallback(async (webhookId: string, limit = 50) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhook-manager', {
        body: { action: 'list_deliveries', webhookId, limit }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        setDeliveries(data.deliveries || []);
        return data.deliveries;
      }
      return [];
    } catch (err) {
      console.error('[useWebhookManager] fetchDeliveries error:', err);
      return [];
    }
  }, []);

  const retryDelivery = useCallback(async (deliveryId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhook-manager', {
        body: { action: 'retry_delivery', deliveryId }
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Reintento programado');
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al reintentar');
      return false;
    }
  }, []);

  return {
    webhooks,
    deliveries,
    isLoading,
    error,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    fetchDeliveries,
    retryDelivery,
  };
}

export default useWebhookManager;
