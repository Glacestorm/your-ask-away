import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
}

interface SendSMSOptions {
  phoneNumber: string;
  message: string;
  templateId?: string;
  companyId?: string;
  contactName?: string;
  scheduledAt?: Date;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  message_id?: string;
  status?: string;
  error?: string;
}

export function useSMS() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);

  const loadTemplates = useCallback(async () => {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('id, name, content, variables, category')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
    return data || [];
  }, []);

  const sendSMS = async (phoneNumber: string, message: string): Promise<SMSResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone_number: phoneNumber,
          message,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('SMS enviat correctament');
      } else {
        toast.error(data.error || 'Error enviant SMS');
      }

      return data;
    } catch (error: any) {
      console.error('SMS Error:', error);
      toast.error('Error enviant SMS');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const sendSMSAdvanced = useCallback(async (options: SendSMSOptions): Promise<SMSResult> => {
    if (!user) {
      return { success: false, error: 'No autenticat' };
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone_number: options.phoneNumber,
          message: options.message,
          user_id: user.id,
          template_id: options.templateId,
          company_id: options.companyId,
          contact_name: options.contactName,
          scheduled_at: options.scheduledAt?.toISOString(),
        },
      });

      if (error) throw error;

      if (data.success) {
        return { success: true, messageId: data.message_id };
      } else {
        return { success: false, error: data.error || 'Error desconegut' };
      }
    } catch (error: any) {
      console.error('Send SMS error:', error);
      return { success: false, error: error.message || 'Error enviant SMS' };
    } finally {
      setSending(false);
    }
  }, [user]);

  const sendBulkSMS = useCallback(async (
    recipients: Array<{ phoneNumber: string; contactName?: string }>,
    message: string,
    templateId?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> => {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const recipient of recipients) {
      const result = await sendSMSAdvanced({
        phoneNumber: recipient.phoneNumber,
        message,
        templateId,
        contactName: recipient.contactName,
      });

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${recipient.phoneNumber}: ${result.error}`);
      }
    }

    return results;
  }, [sendSMSAdvanced]);

  const applyTemplate = useCallback((
    templateContent: string,
    variables: Record<string, string>
  ): string => {
    let result = templateContent;
    
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    
    return result;
  }, []);

  const getSMSHistory = async (limit = 50) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('sms_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching SMS history:', error);
      return [];
    }

    return data || [];
  };

  const getDeliveryStatus = useCallback(async (smsId: string) => {
    const { data, error } = await supabase
      .from('sms_delivery_logs')
      .select('*')
      .eq('sms_id', smsId)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Error loading delivery logs:', error);
      return [];
    }

    return data || [];
  }, []);

  return {
    sendSMS,
    sendSMSAdvanced,
    sendBulkSMS,
    getSMSHistory,
    getDeliveryStatus,
    loadTemplates,
    applyTemplate,
    loading,
    sending,
    templates,
  };
}
