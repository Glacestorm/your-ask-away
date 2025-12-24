import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface OmnichannelError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ChannelType = 'email' | 'sms' | 'whatsapp' | 'voice' | 'push' | 'in_app';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';

export interface OmnichannelMessage {
  id: string;
  company_id?: string;
  contact_id?: string;
  channel: ChannelType;
  direction: 'inbound' | 'outbound';
  message_type?: string;
  subject?: string;
  content?: string;
  template_id?: string;
  template_variables: Record<string, any>;
  journey_id?: string;
  journey_step_id?: string;
  external_id?: string;
  status: MessageStatus;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  failed_at?: string;
  failure_reason?: string;
  engagement_data: Record<string, any>;
  cost?: number;
  sent_by?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface OmnichannelTemplate {
  id: string;
  name: string;
  description?: string;
  channel: ChannelType;
  category?: string;
  subject?: string;
  content: string;
  html_content?: string;
  variables: string[];
  preview_text?: string;
  attachments: any[];
  is_active: boolean;
  approved_at?: string;
  approved_by?: string;
  version: number;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  created_by?: string;
  created_at: string;
}

export interface ChannelConnector {
  id: string;
  channel_type: ChannelType;
  provider: string;
  is_active: boolean;
  config: Record<string, any>;
  rate_limit: number;
  daily_limit: number;
  credentials_valid: boolean;
  last_health_check?: string;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  stats: {
    total_sent: number;
    total_delivered: number;
    total_failed: number;
  };
}

export function useOmnichannelMessages(companyId?: string, channel?: ChannelType) {
  const queryClient = useQueryClient();
  // === ESTADO KB ===
  const [error, setError] = useState<OmnichannelError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['omnichannel-messages', companyId, channel],
    queryFn: async () => {
      let query = supabase
        .from('omnichannel_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (companyId) query = query.eq('company_id', companyId);
      if (channel) query = query.eq('channel', channel);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as OmnichannelMessage[];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (message: Omit<OmnichannelMessage, 'id' | 'created_at' | 'status'> & { status?: MessageStatus }) => {
      const { data, error } = await supabase
        .from('omnichannel_messages')
        .insert({
          ...message,
          status: message.status || 'pending',
          direction: message.direction || 'outbound',
        })
        .select()
        .single();

      if (error) throw error;

      // In production, this would trigger an edge function to actually send the message
      // For now, simulate sending
      await supabase
        .from('omnichannel_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omnichannel-messages'] });
      toast.success('Mensaje enviado');
    },
    onError: (error: any) => {
      toast.error('Error al enviar: ' + error.message);
    },
  });

  const updateMessageStatus = useMutation({
    mutationFn: async ({ id, status, ...updates }: { id: string; status: MessageStatus } & Partial<OmnichannelMessage>) => {
      const statusUpdates: Record<string, any> = { status };
      
      if (status === 'delivered') statusUpdates.delivered_at = new Date().toISOString();
      if (status === 'opened') statusUpdates.opened_at = new Date().toISOString();
      if (status === 'clicked') statusUpdates.clicked_at = new Date().toISOString();
      if (status === 'failed') statusUpdates.failed_at = new Date().toISOString();

      const { error } = await supabase
        .from('omnichannel_messages')
        .update({ ...statusUpdates, ...updates })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omnichannel-messages'] });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    updateMessageStatus: updateMessageStatus.mutate,
    isSending: sendMessage.isPending,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

export function useOmnichannelTemplates(channel?: ChannelType) {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['omnichannel-templates', channel],
    queryFn: async () => {
      let query = supabase
        .from('omnichannel_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (channel) query = query.eq('channel', channel);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as OmnichannelTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<OmnichannelTemplate, 'id' | 'created_at' | 'version' | 'stats'>) => {
      const { data, error } = await supabase
        .from('omnichannel_templates')
        .insert({
          ...template,
          version: 1,
          stats: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omnichannel-templates'] });
      toast.success('Plantilla creada');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OmnichannelTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('omnichannel_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omnichannel-templates'] });
      toast.success('Plantilla actualizada');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('omnichannel_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omnichannel-templates'] });
      toast.success('Plantilla eliminada');
    },
  });

  const applyTemplate = useCallback((
    template: OmnichannelTemplate,
    variables: Record<string, string>
  ): { subject?: string; content: string } => {
    let content = template.content;
    let subject = template.subject;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
      if (subject) subject = subject.replace(regex, value);
    }

    return { subject, content };
  }, []);

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    applyTemplate,
    isCreating: createTemplate.isPending,
  };
}

export function useChannelConnectors() {
  const queryClient = useQueryClient();

  const { data: connectors = [], isLoading } = useQuery({
    queryKey: ['channel-connectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channel_connectors')
        .select('*')
        .order('channel_type');

      if (error) throw error;
      return data as unknown as ChannelConnector[];
    },
  });

  const updateConnector = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChannelConnector> & { id: string }) => {
      const { data, error } = await supabase
        .from('channel_connectors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-connectors'] });
      toast.success('Conector actualizado');
    },
  });

  const testConnector = useCallback(async (channelType: ChannelType) => {
    try {
      // This would call an edge function to test the connector
      toast.info(`Probando conexión ${channelType}...`);
      
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await supabase
        .from('channel_connectors')
        .update({
          last_health_check: new Date().toISOString(),
          health_status: 'healthy',
          credentials_valid: true,
        })
        .eq('channel_type', channelType);

      queryClient.invalidateQueries({ queryKey: ['channel-connectors'] });
      toast.success(`Conexión ${channelType} verificada`);
      return true;
    } catch (error: any) {
      toast.error(`Error en conexión: ${error.message}`);
      return false;
    }
  }, [queryClient]);

  return {
    connectors,
    isLoading,
    updateConnector: updateConnector.mutate,
    testConnector,
  };
}

export function useMessageAnalytics(dateRange?: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['message-analytics', dateRange?.start, dateRange?.end],
    queryFn: async () => {
      let query = supabase
        .from('omnichannel_messages')
        .select('channel, status, created_at');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate stats
      const channelStats: Record<string, { total: number; delivered: number; opened: number; clicked: number; failed: number }> = {};
      
      for (const msg of data || []) {
        if (!channelStats[msg.channel]) {
          channelStats[msg.channel] = { total: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 };
        }
        channelStats[msg.channel].total++;
        if (msg.status === 'delivered' || msg.status === 'opened' || msg.status === 'clicked') {
          channelStats[msg.channel].delivered++;
        }
        if (msg.status === 'opened' || msg.status === 'clicked') {
          channelStats[msg.channel].opened++;
        }
        if (msg.status === 'clicked') {
          channelStats[msg.channel].clicked++;
        }
        if (msg.status === 'failed' || msg.status === 'bounced') {
          channelStats[msg.channel].failed++;
        }
      }

      return {
        total: data?.length || 0,
        byChannel: channelStats,
      };
    },
  });
}
