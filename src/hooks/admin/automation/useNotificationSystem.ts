import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in_app' | 'webhook';
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  channel_type: 'email' | 'push' | 'sms' | 'slack' | 'teams' | 'webhook';
  config: Record<string, unknown>;
  is_active: boolean;
  rate_limit?: number;
  retry_config?: {
    max_retries: number;
    retry_delay_ms: number;
  };
}

export interface NotificationLog {
  id: string;
  template_id: string;
  channel_id: string;
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreference {
  user_id: string;
  channel_type: string;
  notification_type: string;
  is_enabled: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly';
}

export interface NotificationContext {
  userId?: string;
  channelType?: string;
}

// === HOOK ===
export function useNotificationSystem() {
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'list_templates'
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.templates) {
        setTemplates(fnData.templates);
        setLastRefresh(new Date());
        return fnData.templates;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useNotificationSystem] fetchTemplates error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH CHANNELS ===
  const fetchChannels = useCallback(async () => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'list_channels'
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.channels) {
        setChannels(fnData.channels);
        return fnData.channels;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] fetchChannels error:', err);
      return null;
    }
  }, []);

  // === SEND NOTIFICATION ===
  const sendNotification = useCallback(async (
    templateId: string,
    recipients: string[],
    variables: Record<string, string>,
    channels?: string[]
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'send_notification',
            templateId,
            recipients,
            variables,
            channels
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Notificación enviada a ${recipients.length} destinatarios`);
        return fnData.results;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] sendNotification error:', err);
      toast.error('Error al enviar notificación');
      return null;
    }
  }, []);

  // === CREATE TEMPLATE ===
  const createTemplate = useCallback(async (template: Partial<NotificationTemplate>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'create_template',
            template
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Plantilla creada');
        return fnData.template;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] createTemplate error:', err);
      toast.error('Error al crear plantilla');
      return null;
    }
  }, []);

  // === GET LOGS ===
  const fetchLogs = useCallback(async (filters?: { 
    status?: string; 
    channelType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'get_logs',
            filters
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.logs) {
        setLogs(fnData.logs);
        return fnData.logs;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] fetchLogs error:', err);
      return null;
    }
  }, []);

  // === GET STATS ===
  const getStats = useCallback(async (period: 'day' | 'week' | 'month' = 'week') => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'get_stats',
            period
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        return fnData.stats;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] getStats error:', err);
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchTemplates();
    fetchChannels();
    autoRefreshInterval.current = setInterval(() => {
      fetchTemplates();
      fetchChannels();
    }, intervalMs);
  }, [fetchTemplates, fetchChannels]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    templates,
    channels,
    logs,
    error,
    lastRefresh,
    fetchTemplates,
    fetchChannels,
    sendNotification,
    createTemplate,
    fetchLogs,
    getStats,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useNotificationSystem;
