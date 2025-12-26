/**
 * useWhatsAppBusiness - WhatsApp Business API Integration Hook
 * Fase 1.2 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface WhatsAppTemplate {
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  language: string;
  category: string;
  components?: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  parameters?: string[];
}

export interface WhatsAppMessage {
  id: string;
  externalId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video';
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  templateName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface WhatsAppConversation {
  phoneNumber: string;
  contactName?: string;
  crmCompanyId?: string;
  messages: WhatsAppMessage[];
  lastMessage?: WhatsAppMessage;
  unreadCount: number;
  lastActivity: Date;
}

export interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  name?: string;
  crmCompanyId?: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncedAt?: Date;
}

export interface ChatbotResponse {
  message: string;
  intent: string;
  sentiment: string;
  autoReply: boolean;
  suggestedActions: string[];
}

export interface WhatsAppStats {
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  deliveryRate: number;
  readRate: number;
  activeConversations: number;
  averageResponseTime: number;
}

// === HOOK ===
export function useWhatsAppBusiness() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-business-api', {
        body: { action: 'get_templates' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setTemplates(data.data?.templates || []);
        setIsConnected(!data.data?.demo);
        return data.data?.templates;
      }

      throw new Error(data?.error || 'Failed to fetch templates');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useWhatsAppBusiness] fetchTemplates error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SEND TEMPLATE MESSAGE ===
  const sendTemplate = useCallback(async (
    phone: string,
    templateName: string,
    params?: Record<string, string>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-business-api', {
        body: {
          action: 'send_template',
          phone,
          templateName,
          templateParams: params
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Template enviado correctamente');
        return data.data;
      }

      throw new Error(data?.error || 'Failed to send template');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error enviando template';
      toast.error(message);
      console.error('[useWhatsAppBusiness] sendTemplate error:', err);
      return null;
    }
  }, []);

  // === SEND MESSAGE ===
  const sendMessage = useCallback(async (phone: string, message: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-business-api', {
        body: {
          action: 'send_message',
          phone,
          message
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Mensaje enviado');
        return data.data;
      }

      throw new Error(data?.error || 'Failed to send message');
    } catch (err) {
      const message_err = err instanceof Error ? err.message : 'Error enviando mensaje';
      toast.error(message_err);
      console.error('[useWhatsAppBusiness] sendMessage error:', err);
      return null;
    }
  }, []);

  // === FETCH CONVERSATIONS ===
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-business-api', {
        body: { action: 'get_conversations' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        const convs = (data.data?.conversations || []).map((c: any) => ({
          ...c,
          lastActivity: c.lastMessage ? new Date(c.lastMessage.created_at) : new Date(),
          messages: c.messages.map((m: any) => ({
            id: m.id,
            externalId: m.external_id,
            phoneNumber: m.phone_number,
            direction: m.direction,
            type: m.type,
            content: m.content,
            status: m.status,
            templateName: m.template_name,
            metadata: m.metadata,
            createdAt: new Date(m.created_at)
          }))
        }));
        setConversations(convs);
        setLastRefresh(new Date());
        return convs;
      }

      throw new Error(data?.error || 'Failed to fetch conversations');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useWhatsAppBusiness] fetchConversations error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SYNC CONTACTS ===
  const syncContacts = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-business-api', {
        body: { action: 'sync_contacts' }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`${data.data?.syncedCount} contactos sincronizados`);
        return data.data;
      }

      throw new Error(data?.error || 'Failed to sync contacts');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error sincronizando contactos';
      toast.error(message);
      console.error('[useWhatsAppBusiness] syncContacts error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET CHATBOT RESPONSE ===
  const getChatbotResponse = useCallback(async (
    phone: string,
    message: string,
    context?: Record<string, unknown>
  ): Promise<ChatbotResponse | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-business-api', {
        body: {
          action: 'chatbot_response',
          phone,
          message,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      throw new Error(data?.error || 'Failed to get chatbot response');
    } catch (err) {
      console.error('[useWhatsAppBusiness] getChatbotResponse error:', err);
      return null;
    }
  }, []);

  // === UPDATE CRM ===
  const updateCRM = useCallback(async (phone: string, contactId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('whatsapp-business-api', {
        body: {
          action: 'update_crm',
          phone,
          contactId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('CRM actualizado');
        return data.data;
      }

      throw new Error(data?.error || 'Failed to update CRM');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error actualizando CRM';
      toast.error(message);
      console.error('[useWhatsAppBusiness] updateCRM error:', err);
      return null;
    }
  }, []);

  // === CALCULATE STATS ===
  const calculateStats = useCallback(() => {
    if (conversations.length === 0) {
      setStats(null);
      return;
    }

    const allMessages = conversations.flatMap(c => c.messages);
    const sent = allMessages.filter(m => m.direction === 'outbound');
    const received = allMessages.filter(m => m.direction === 'inbound');
    const delivered = sent.filter(m => ['delivered', 'read'].includes(m.status));
    const read = sent.filter(m => m.status === 'read');

    setStats({
      totalMessages: allMessages.length,
      messagesSent: sent.length,
      messagesReceived: received.length,
      deliveryRate: sent.length > 0 ? (delivered.length / sent.length) * 100 : 0,
      readRate: sent.length > 0 ? (read.length / sent.length) * 100 : 0,
      activeConversations: conversations.filter(c => c.unreadCount > 0).length,
      averageResponseTime: 5.2 // minutes - would be calculated from actual data
    });
  }, [conversations]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchConversations();
    fetchTemplates();
    autoRefreshInterval.current = setInterval(() => {
      fetchConversations();
    }, intervalMs);
  }, [fetchConversations, fetchTemplates]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === EFFECTS ===
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // State
    templates,
    conversations,
    contacts,
    stats,
    isLoading,
    error,
    lastRefresh,
    isConnected,
    // Actions
    fetchTemplates,
    sendTemplate,
    sendMessage,
    fetchConversations,
    syncContacts,
    getChatbotResponse,
    updateCRM,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useWhatsAppBusiness;
