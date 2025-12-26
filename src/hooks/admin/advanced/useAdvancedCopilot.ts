/**
 * useAdvancedCopilot
 * Copiloto AI multimodal avanzado con capacidades 2025-2026
 * Fase 12 - Advanced AI & Automation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    confidence?: number;
  };
  attachments?: CopilotAttachment[];
  timestamp: string;
}

export interface CopilotAttachment {
  type: 'image' | 'document' | 'audio' | 'data';
  url?: string;
  content?: string;
  name: string;
  size?: number;
}

export interface CopilotCapability {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'generation' | 'automation' | 'prediction' | 'interaction';
  isEnabled: boolean;
  usageCount: number;
}

export interface CopilotContext {
  sessionId: string;
  userId?: string;
  currentPage?: string;
  selectedEntity?: {
    type: string;
    id: string;
    name?: string;
  };
  recentActions?: string[];
  preferences?: Record<string, unknown>;
}

export interface CopilotSuggestion {
  id: string;
  type: 'action' | 'insight' | 'warning' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  actionData?: Record<string, unknown>;
}

// === HOOK ===
export function useAdvancedCopilot() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [capabilities, setCapabilities] = useState<CopilotCapability[]>([]);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<CopilotContext | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // === INICIALIZAR SESIÓN ===
  const initializeSession = useCallback(async (initialContext?: Partial<CopilotContext>) => {
    const newContext: CopilotContext = {
      sessionId: sessionIdRef.current,
      ...initialContext
    };
    setContext(newContext);
    
    // Cargar capacidades disponibles
    await fetchCapabilities();
    
    return newContext;
  }, []);

  // === FETCH CAPACIDADES ===
  const fetchCapabilities = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-copilot', {
        body: {
          action: 'get_capabilities',
          sessionId: sessionIdRef.current
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.capabilities) {
        setCapabilities(data.capabilities);
      }
    } catch (err) {
      console.error('[useAdvancedCopilot] fetchCapabilities error:', err);
    }
  }, []);

  // === ENVIAR MENSAJE ===
  const sendMessage = useCallback(async (
    content: string,
    attachments?: CopilotAttachment[]
  ): Promise<CopilotMessage | null> => {
    setIsLoading(true);
    setError(null);

    const userMessage: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      attachments,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const { data, error: fnError } = await supabase.functions.invoke('advanced-copilot', {
        body: {
          action: 'chat',
          sessionId: sessionIdRef.current,
          message: content,
          attachments,
          context,
          conversationHistory: messages.slice(-10)
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.response) {
        const assistantMessage: CopilotMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response.content,
          metadata: {
            model: data.response.model,
            tokens: data.response.tokens,
            processingTime: data.response.processingTime,
            confidence: data.response.confidence
          },
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Actualizar sugerencias si hay
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }

        return assistantMessage;
      }

      throw new Error('Invalid response from copilot');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAdvancedCopilot] sendMessage error:', err);
      toast.error('Error al enviar mensaje');
      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [context, messages]);

  // === GENERAR SUGERENCIAS PROACTIVAS ===
  const generateSuggestions = useCallback(async (): Promise<CopilotSuggestion[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-copilot', {
        body: {
          action: 'generate_suggestions',
          sessionId: sessionIdRef.current,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.suggestions) {
        setSuggestions(data.suggestions);
        return data.suggestions;
      }

      return [];
    } catch (err) {
      console.error('[useAdvancedCopilot] generateSuggestions error:', err);
      return [];
    }
  }, [context]);

  // === EJECUTAR ACCIÓN SUGERIDA ===
  const executeSuggestion = useCallback(async (suggestionId: string): Promise<boolean> => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion || !suggestion.actionable) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-copilot', {
        body: {
          action: 'execute_suggestion',
          sessionId: sessionIdRef.current,
          suggestionId,
          actionData: suggestion.actionData
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Acción ejecutada correctamente');
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAdvancedCopilot] executeSuggestion error:', err);
      toast.error('Error al ejecutar acción');
      return false;
    }
  }, [suggestions]);

  // === ANÁLISIS MULTIMODAL ===
  const analyzeMultimodal = useCallback(async (
    inputs: {
      text?: string;
      imageUrl?: string;
      documentUrl?: string;
      dataJson?: Record<string, unknown>;
    }
  ) => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-copilot', {
        body: {
          action: 'multimodal_analysis',
          sessionId: sessionIdRef.current,
          inputs,
          context
        }
      });

      if (fnError) throw fnError;

      return data?.analysis || null;
    } catch (err) {
      console.error('[useAdvancedCopilot] analyzeMultimodal error:', err);
      toast.error('Error en análisis multimodal');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // === CANCELAR OPERACIÓN ===
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  // === LIMPIAR CONVERSACIÓN ===
  const clearConversation = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
    sessionIdRef.current = crypto.randomUUID();
    if (context) {
      setContext({ ...context, sessionId: sessionIdRef.current });
    }
  }, [context]);

  // === ACTUALIZAR CONTEXTO ===
  const updateContext = useCallback((updates: Partial<CopilotContext>) => {
    setContext(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    isStreaming,
    messages,
    capabilities,
    suggestions,
    error,
    context,
    // Acciones
    initializeSession,
    sendMessage,
    generateSuggestions,
    executeSuggestion,
    analyzeMultimodal,
    cancelOperation,
    clearConversation,
    updateContext,
    fetchCapabilities
  };
}

export default useAdvancedCopilot;
