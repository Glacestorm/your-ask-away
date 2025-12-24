import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

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
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED STATES ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const { data: sessions, refetch } = useQuery({
    queryKey: ['copilot-sessions'],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const { data, error: fetchError } = await supabase
          .from('revenue_copilot_sessions')
          .select('*')
          .eq('is_active', true)
          .order('last_message_at', { ascending: false })
          .limit(10);
        
        if (fetchError) throw fetchError;
        
        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setError(null);
        collectTelemetry('useRevenueCopilot', 'fetchSessions', 'success', Date.now() - startTime);
        return (data as unknown) as CopilotSession[];
      } catch (err) {
        const parsedErr = parseError(err);
        const kbError = createKBError('FETCH_SESSIONS_ERROR', parsedErr.message, { originalError: String(err) });
        setError(kbError);
        collectTelemetry('useRevenueCopilot', 'fetchSessions', 'error', Date.now() - startTime, kbError);
        throw err;
      }
    }
  });

  const sendMessage = useCallback(async (
    message: string,
    context?: Record<string, unknown>
  ): Promise<{ response: string; sessionId: string; insights: string[] }> => {
    const startTime = Date.now();
    setStatus('loading');
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
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useRevenueCopilot', 'sendMessage', 'success', Date.now() - startTime);
      
      return {
        response: data.message,
        sessionId: data.sessionId,
        insights: data.insights || []
      };
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('SEND_MESSAGE_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useRevenueCopilot', 'sendMessage', 'error', Date.now() - startTime, kbError);
      toast.error('Error en el copilot');
      throw err;
    }
  }, [currentSessionId, queryClient]);

  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    sessions,
    currentSessionId,
    sendMessage,
    startNewSession,
    setCurrentSessionId,
    refetch,
    // === KB 2.0 STATE ===
    status,
    error,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
  };
};
