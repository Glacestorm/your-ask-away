import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    metricsMentioned?: string[];
    calculationsPerformed?: Array<{
      metricId: string;
      value: number;
      interpretation: string;
    }>;
  };
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  category: 'explain' | 'calculate' | 'compare' | 'recommend' | 'benchmark';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: '1', label: '¿Qué es el NPS?', prompt: 'Explícame qué es el NPS y cómo se calcula', category: 'explain' },
  { id: '2', label: 'NRR vs GRR', prompt: 'Cuál es la diferencia entre NRR y GRR?', category: 'compare' },
  { id: '3', label: 'Benchmark NRR SaaS', prompt: 'Cuál es un buen NRR para empresas SaaS B2B?', category: 'benchmark' },
  { id: '4', label: 'Reducir Churn', prompt: 'Qué estrategias puedo implementar para reducir mi tasa de churn?', category: 'recommend' },
  { id: '5', label: 'Calcular CLV', prompt: 'Cómo calculo el Customer Lifetime Value si tengo un ingreso mensual de 500€ y una duración media de 24 meses?', category: 'calculate' },
  { id: '6', label: 'Health Score', prompt: 'Cómo se construye un Health Score compuesto?', category: 'explain' },
  { id: '7', label: 'Quick Ratio', prompt: 'Qué es el Quick Ratio y qué valor debo buscar?', category: 'explain' },
  { id: '8', label: 'NPS bajo', prompt: 'Mi NPS es 15, qué acciones debo tomar?', category: 'recommend' }
];

export function useCSMetricsAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const { data, error: fnError } = await supabase.functions.invoke('cs-metrics-assistant', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          currentMessage: content.trim()
        }
      });

      if (fnError) throw fnError;

      if (data?.response) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: data.metadata
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response from assistant');
      }
    } catch (err) {
      console.error('[useCSMetricsAssistant] Error:', err);
      
      // Check if it's a rate limit error
      if (err instanceof Error && err.message.includes('429')) {
        setError('Límite de solicitudes alcanzado. Por favor, espera un momento.');
      } else if (err instanceof Error && err.message.includes('402')) {
        setError('Créditos de IA insuficientes. Por favor, añade fondos.');
      } else {
        setError('Error al procesar tu mensaje. Por favor, intenta de nuevo.');
      }

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const useQuickAction = useCallback((action: QuickAction) => {
    sendMessage(action.prompt);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    quickActions: QUICK_ACTIONS,
    sendMessage,
    cancelRequest,
    clearHistory,
    useQuickAction
  };
}

export default useCSMetricsAssistant;
