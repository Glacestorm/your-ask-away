import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SMSResult {
  success: boolean;
  message_id?: string;
  status?: string;
  error?: string;
}

export function useSMS() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error('SMS Error:', error);
      toast.error('Error enviant SMS');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

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

  return {
    sendSMS,
    getSMSHistory,
    loading,
  };
}
