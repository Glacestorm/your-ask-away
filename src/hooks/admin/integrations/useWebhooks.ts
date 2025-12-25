import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
  retry_policy: {
    max_retries: number;
    retry_delay_ms: number;
  };
  headers?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status?: number;
  response_body?: string;
  attempts: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  delivered_at?: string;
  created_at: string;
}

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async (): Promise<Webhook[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhooks-manager', {
        body: { action: 'list_webhooks' }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.webhooks) {
        setWebhooks(data.webhooks);
        return data.webhooks;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching webhooks';
      setError(message);
      console.error('[useWebhooks] fetchWebhooks error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWebhook = useCallback(async (webhook: Partial<Webhook>): Promise<Webhook | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhooks-manager', {
        body: { action: 'create_webhook', webhook }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.webhook) {
        setWebhooks(prev => [...prev, data.webhook]);
        toast.success('Webhook creado');
        return data.webhook;
      }

      return null;
    } catch (err) {
      console.error('[useWebhooks] createWebhook error:', err);
      toast.error('Error al crear webhook');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateWebhook = useCallback(async (id: string, updates: Partial<Webhook>): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhooks-manager', {
        body: { action: 'update_webhook', id, updates }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setWebhooks(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
        toast.success('Webhook actualizado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useWebhooks] updateWebhook error:', err);
      toast.error('Error al actualizar webhook');
      return false;
    }
  }, []);

  const deleteWebhook = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhooks-manager', {
        body: { action: 'delete_webhook', id }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
        toast.success('Webhook eliminado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useWebhooks] deleteWebhook error:', err);
      toast.error('Error al eliminar webhook');
      return false;
    }
  }, []);

  const fetchDeliveries = useCallback(async (webhookId?: string, limit: number = 50): Promise<WebhookDelivery[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhooks-manager', {
        body: { action: 'list_deliveries', webhookId, limit }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.deliveries) {
        setDeliveries(data.deliveries);
        return data.deliveries;
      }

      return [];
    } catch (err) {
      console.error('[useWebhooks] fetchDeliveries error:', err);
      return [];
    }
  }, []);

  const retryDelivery = useCallback(async (deliveryId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('webhooks-manager', {
        body: { action: 'retry_delivery', deliveryId }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Reintento iniciado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useWebhooks] retryDelivery error:', err);
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
    fetchDeliveries,
    retryDelivery,
  };
}

export default useWebhooks;
