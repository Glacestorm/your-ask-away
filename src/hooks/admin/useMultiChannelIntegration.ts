import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ChannelMessage {
  id: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'push' | 'in_app';
  direction: 'inbound' | 'outbound';
  sender_id: string;
  recipient_id: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChannelConfig {
  channel: string;
  enabled: boolean;
  api_configured: boolean;
  daily_limit?: number;
  templates_count: number;
}

export interface ConversationThread {
  id: string;
  contact_id: string;
  contact_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  channels_used: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: string;
  content: string;
  variables: string[];
  approved: boolean;
}

// === HOOK ===
export function useMultiChannelIntegration() {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === SEND MESSAGE ===
  const sendMessage = useCallback(async (
    channel: string,
    recipientId: string,
    content: string,
    templateId?: string,
    variables?: Record<string, string>
  ): Promise<ChannelMessage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('multi-channel', {
        body: {
          action: 'send_message',
          channel,
          recipientId,
          content,
          templateId,
          variables
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.message) {
        setMessages(prev => [data.message, ...prev]);
        toast.success('Mensaje enviado');
        return data.message;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error sending message';
      setError(message);
      console.error('[useMultiChannelIntegration] sendMessage error:', err);
      toast.error('Error al enviar mensaje');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH THREADS ===
  const fetchThreads = useCallback(async (filter?: { channel?: string; unreadOnly?: boolean }): Promise<ConversationThread[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('multi-channel', {
        body: { action: 'list_threads', filter }
      });

      if (fnError) throw fnError;

      if (data?.threads) {
        setThreads(data.threads);
        return data.threads;
      }

      return [];
    } catch (err) {
      console.error('[useMultiChannelIntegration] fetchThreads error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH MESSAGES ===
  const fetchMessages = useCallback(async (threadId: string): Promise<ChannelMessage[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('multi-channel', {
        body: { action: 'list_messages', threadId }
      });

      if (fnError) throw fnError;

      if (data?.messages) {
        setMessages(data.messages);
        return data.messages;
      }

      return [];
    } catch (err) {
      console.error('[useMultiChannelIntegration] fetchMessages error:', err);
      return [];
    }
  }, []);

  // === GET CHANNEL STATUS ===
  const fetchChannelStatus = useCallback(async (): Promise<ChannelConfig[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('multi-channel', {
        body: { action: 'get_channel_status' }
      });

      if (fnError) throw fnError;

      if (data?.channels) {
        setChannels(data.channels);
        return data.channels;
      }

      return [];
    } catch (err) {
      console.error('[useMultiChannelIntegration] fetchChannelStatus error:', err);
      return [];
    }
  }, []);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async (channel?: string): Promise<MessageTemplate[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('multi-channel', {
        body: { action: 'list_templates', channel }
      });

      if (fnError) throw fnError;

      if (data?.templates) {
        setTemplates(data.templates);
        return data.templates;
      }

      return [];
    } catch (err) {
      console.error('[useMultiChannelIntegration] fetchTemplates error:', err);
      return [];
    }
  }, []);

  // === BROADCAST MESSAGE ===
  const broadcastMessage = useCallback(async (
    channel: string,
    recipientIds: string[],
    templateId: string,
    variables?: Record<string, string>
  ): Promise<{ sent: number; failed: number }> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('multi-channel', {
        body: {
          action: 'broadcast',
          channel,
          recipientIds,
          templateId,
          variables
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Enviados: ${data.sent}, Fallidos: ${data.failed}`);
        return { sent: data.sent, failed: data.failed };
      }

      return { sent: 0, failed: recipientIds.length };
    } catch (err) {
      console.error('[useMultiChannelIntegration] broadcastMessage error:', err);
      toast.error('Error en broadcast');
      return { sent: 0, failed: recipientIds.length };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET CHANNEL ICON ===
  const getChannelIcon = useCallback((channel: string): string => {
    const icons: Record<string, string> = {
      whatsapp: '💬',
      email: '📧',
      sms: '📱',
      push: '🔔',
      in_app: '📌'
    };
    return icons[channel] || '💬';
  }, []);

  return {
    messages,
    threads,
    channels,
    templates,
    isLoading,
    error,
    sendMessage,
    fetchThreads,
    fetchMessages,
    fetchChannelStatus,
    fetchTemplates,
    broadcastMessage,
    getChannelIcon,
  };
}

export default useMultiChannelIntegration;
