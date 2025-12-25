/**
 * useCourseChatbot - Hook para el chatbot especializado por curso
 * Usa Lovable AI con RAG para respuestas contextuales
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
  sources?: { lessonId?: string; contentType: string; similarity: number }[];
}

export interface CourseChatContext {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
}

export function useCourseChatbot(context: CourseChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history from database
  const loadHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('training_chat_history')
        .select('*')
        .eq('course_id', context.courseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (fetchError) {
        console.error('[useCourseChatbot] Error loading history:', fetchError);
        return;
      }

      if (data && data.length > 0) {
        const historyMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          sources: msg.sources,
        }));
        setMessages(historyMessages);
      }
    } catch (err) {
      console.error('[useCourseChatbot] Error loading history:', err);
    }
  }, [context.courseId]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare conversation history for context
    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortControllerRef.current = new AbortController();

      const { data, error: fnError } = await supabase.functions.invoke('training-course-chat', {
        body: {
          message: content,
          courseId: context.courseId,
          lessonId: context.lessonId,
          courseTitle: context.courseTitle,
          lessonTitle: context.lessonTitle,
          conversationHistory,
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.message) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          sources: data.sources,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data?.error) {
        throw new Error(data.message || data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje';
      setError(errorMessage);
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      if (errorMessage.includes('Rate limit')) {
        toast.error('Demasiadas solicitudes. Espera un momento.');
      } else if (errorMessage.includes('Payment')) {
        toast.error('Créditos de IA insuficientes.');
      } else {
        toast.error('Error al procesar tu mensaje');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [context, messages, isLoading]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Provide feedback
  const provideFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
    toast.success(feedback === 'positive' ? '¡Gracias por tu feedback!' : 'Mejoraremos esta respuesta');
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelRequest,
    clearChat,
    provideFeedback,
    loadHistory,
  };
}

export default useCourseChatbot;
