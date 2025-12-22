import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface CopilotSession {
  id: string;
  messages: CopilotMessage[];
  context: Record<string, unknown>;
  is_active: boolean;
  started_at: string;
  last_message_at: string;
}

export const useRevenueCopilot = () => {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: sessions } = useQuery({
    queryKey: ['copilot-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_copilot_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data as unknown) as CopilotSession[];
    }
  });

  const sendMessage = useCallback(async (
    message: string,
    context?: Record<string, unknown>
  ): Promise<{ response: string; sessionId: string; insights: string[] }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('revenue-copilot-chat', {
        body: { message, sessionId: currentSessionId, context }
      });
      if (error) throw error;
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }
      queryClient.invalidateQueries({ queryKey: ['copilot-sessions'] });
      return {
        response: data.message,
        sessionId: data.sessionId,
        insights: data.insights || []
      };
    } catch (err) {
      toast.error('Error en el copilot');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, queryClient]);

  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  return {
    sessions,
    currentSessionId,
    isLoading,
    sendMessage,
    startNewSession,
    setCurrentSessionId
  };
};
