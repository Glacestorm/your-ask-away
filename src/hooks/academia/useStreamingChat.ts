/**
 * useStreamingChat - Hook para chat con streaming token-by-token
 * Proporciona respuestas del tutor IA en tiempo real
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface StreamingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative';
  sources?: { lessonId?: string; contentType: string; similarity: number }[];
}

export interface EmotionalContext {
  state: string;
  frustrationLevel: number;
  engagementLevel: number;
}

interface UseStreamingChatOptions {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
}

export function useStreamingChat(options: UseStreamingChatOptions) {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const emotionalContextRef = useRef<EmotionalContext | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Set emotional context for adaptive responses
  const setEmotionalContext = useCallback((context: EmotionalContext) => {
    emotionalContextRef.current = context;
  }, []);

  // Send message with streaming response
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    const userMessage: StreamingMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Create placeholder for assistant response
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    // Prepare conversation history
    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/academia-streaming-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
          },
          body: JSON.stringify({
            message: content,
            courseId: options.courseId,
            lessonId: options.lessonId,
            courseTitle: options.courseTitle,
            lessonTitle: options.lessonTitle,
            conversationHistory,
            emotionalContext: emotionalContextRef.current,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('rate_limit');
        }
        if (response.status === 402) {
          throw new Error('payment_required');
        }
        throw new Error(errorData.message || 'Error al conectar con el tutor');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            
            if (deltaContent) {
              assistantContent += deltaContent;
              
              // Update the assistant message with new content
              setMessages(prev => prev.map(msg => 
                msg.id === assistantId 
                  ? { ...msg, content: assistantContent }
                  : msg
              ));
            }
          } catch {
            // Incomplete JSON, put it back and wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
            }
          } catch { /* ignore */ }
        }
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, content: assistantContent, isStreaming: false }
          : msg
      ));

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Request was cancelled
        setMessages(prev => prev.filter(m => m.id !== assistantId));
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      // Remove placeholder message
      setMessages(prev => prev.filter(m => m.id !== assistantId));

      if (errorMessage === 'rate_limit') {
        toast.error('Demasiadas solicitudes. Espera un momento.');
      } else if (errorMessage === 'payment_required') {
        toast.error('Créditos de IA insuficientes.');
      } else {
        toast.error('Error al procesar tu mensaje');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options, messages, isStreaming, SUPABASE_URL, SUPABASE_KEY]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    cancelRequest();
    setMessages([]);
    setError(null);
  }, [cancelRequest]);

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
    isStreaming,
    error,
    sendMessage,
    cancelRequest,
    clearChat,
    provideFeedback,
    setEmotionalContext,
  };
}

export default useStreamingChat;
