/**
 * useERPAccountingChatbot - Hook para chatbot contable con IA
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: string;
  attachments?: Array<{
    type: 'chart' | 'table' | 'link';
    data: unknown;
  }>;
}

export interface ChatContext {
  company_id: string;
  company_name?: string;
  fiscal_year?: string;
  current_module?: string;
  recent_entries?: Array<{ id: string; description: string }>;
}

export function useERPAccountingChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string>(crypto.randomUUID());

  const sendMessage = useCallback(async (
    content: string,
    context?: ChatContext
  ) => {
    if (!content.trim()) return null;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-accounting-chatbot',
        {
          body: {
            action: 'chat',
            message: content,
            conversation_id: conversationId.current,
            context,
            history: messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.response) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response.content || data.response,
          timestamp: new Date(),
          attachments: data.response.attachments
        };

        setMessages(prev => [...prev, assistantMessage]);
        return assistantMessage;
      }

      throw new Error(data?.error || 'Sin respuesta del asistente');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const askAboutEntry = useCallback(async (
    entryId: string,
    question: string,
    context?: ChatContext
  ) => {
    const enhancedQuestion = `Sobre el asiento contable ${entryId}: ${question}`;
    return sendMessage(enhancedQuestion, context);
  }, [sendMessage]);

  const explainAccount = useCallback(async (
    accountCode: string,
    context?: ChatContext
  ) => {
    const question = `Explícame la cuenta contable ${accountCode}, su uso típico y normativa aplicable.`;
    return sendMessage(question, context);
  }, [sendMessage]);

  const suggestEntry = useCallback(async (
    description: string,
    context?: ChatContext
  ) => {
    const question = `Necesito registrar: "${description}". ¿Qué asiento contable me recomiendas?`;
    return sendMessage(question, context);
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    conversationId.current = crypto.randomUUID();
    setError(null);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId: conversationId.current,
    sendMessage,
    askAboutEntry,
    explainAccount,
    suggestEntry,
    clearChat,
    addSystemMessage
  };
}

export default useERPAccountingChatbot;
