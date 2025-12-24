import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface RevenueCopilotError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

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
  // === ESTADO KB ===
  const [error, setError] = useState<RevenueCopilotError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const { data: sessions, refetch } = useQuery({
    queryKey: ['copilot-sessions'],
    queryFn: async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_copilot_sessions')
          .select('*')
          .eq('is_active', true)
          .order('last_message_at', { ascending: false })
          .limit(10);
        
        if (fetchError) throw fetchError;
        
        setLastRefresh(new Date());
        setError(null);
        return (data as unknown) as CopilotSession[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError({
          code: 'FETCH_SESSIONS_ERROR',
          message,
          details: { originalError: String(err) }
        });
        throw err;
      }
    }
  });

  const sendMessage = useCallback(async (
    message: string,
    context?: Record<string, unknown>
  ): Promise<{ response: string; sessionId: string; insights: string[] }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('revenue-copilot-chat', {
        body: { message, sessionId: currentSessionId, context }
      });
      
      if (invokeError) throw invokeError;
      
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }
      
      queryClient.invalidateQueries({ queryKey: ['copilot-sessions'] });
      setLastRefresh(new Date());
      
      return {
        response: data.message,
        sessionId: data.sessionId,
        insights: data.insights || []
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en el copilot';
      setError({
        code: 'SEND_MESSAGE_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error('Error en el copilot');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, queryClient]);

  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setError(null);
  }, []);

  return {
    sessions,
    currentSessionId,
    isLoading,
    sendMessage,
    startNewSession,
    setCurrentSessionId,
    refetch,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
};
