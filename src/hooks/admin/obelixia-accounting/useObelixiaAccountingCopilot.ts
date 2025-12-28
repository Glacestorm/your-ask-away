/**
 * useObelixiaAccountingCopilot
 * Hook para el copilot de contabilidad con IA
 * Fase 1: AI Accounting Copilot
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    latency_ms?: number;
    tokens?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  references?: Array<{
    type: 'account' | 'entry' | 'partner' | 'declaration';
    id: string;
    label: string;
  }>;
  feedback?: 'positive' | 'negative' | 'neutral';
}

export interface CopilotConversation {
  id: string;
  title: string;
  contextType: string;
  contextId?: string;
  messagesCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
}

export interface QuickAction {
  id: string;
  actionKey: string;
  title: string;
  description: string;
  icon: string;
  promptTemplate: string;
  category: string;
}

export interface CopilotSuggestion {
  id: string;
  type: 'entry' | 'reconciliation' | 'anomaly' | 'optimization' | 'compliance';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction?: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

export interface CopilotContext {
  fiscalConfigId?: string;
  accountId?: string;
  entryId?: string;
  partnerId?: string;
  periodStart?: string;
  periodEnd?: string;
}

// === HOOK ===
export function useObelixiaAccountingCopilot() {
  // Estado
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<CopilotContext>({});

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // === FETCH QUICK ACTIONS ===
  const fetchQuickActions = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-copilot',
        {
          body: { action: 'get_quick_actions' }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setQuickActions(data.data.map((qa: any) => ({
          id: qa.id,
          actionKey: qa.action_key,
          title: qa.title,
          description: qa.description,
          icon: qa.icon,
          promptTemplate: qa.prompt_template,
          category: qa.category
        })));
      }
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] fetchQuickActions error:', err);
    }
  }, []);

  // === FETCH CONVERSATIONS ===
  const fetchConversations = useCallback(async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('obelixia_copilot_conversations')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (dbError) throw dbError;

      setConversations((data || []).map((conv: any) => ({
        id: conv.id,
        title: conv.title || 'Sin título',
        contextType: conv.context_type,
        contextId: conv.context_id,
        messagesCount: conv.messages_count,
        lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : null,
        createdAt: new Date(conv.created_at)
      })));
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] fetchConversations error:', err);
    }
  }, []);

  // === FETCH SUGGESTIONS ===
  const fetchSuggestions = useCallback(async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('obelixia_copilot_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbError) throw dbError;

      setSuggestions((data || []).map((s: any) => ({
        id: s.id,
        type: s.suggestion_type,
        title: s.title,
        description: s.description,
        priority: s.priority,
        suggestedAction: s.suggested_action,
        status: s.status,
        createdAt: new Date(s.created_at)
      })));
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] fetchSuggestions error:', err);
    }
  }, []);

  // === LOAD CONVERSATION MESSAGES ===
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setActiveConversationId(conversationId);

      const { data, error: dbError } = await supabase
        .from('obelixia_copilot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (dbError) throw dbError;

      setMessages((data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata,
        references: msg.references_data,
        feedback: msg.feedback
      })));
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] loadConversation error:', err);
      toast.error('Error al cargar la conversación');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SEND MESSAGE (NON-STREAMING) ===
  const sendMessage = useCallback(async (
    message: string,
    actionType: 'chat' | 'analyze_accounts' | 'explain_transaction' | 'suggest_entries' | 'detect_anomalies' = 'chat'
  ): Promise<string | null> => {
    if (!message.trim()) return null;

    setIsLoading(true);
    setError(null);

    // Añadir mensaje del usuario
    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-copilot',
        {
          body: {
            action: actionType,
            conversationId: activeConversationId,
            message,
            context,
            stream: false
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const assistantMessage: CopilotMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
          metadata: data.data.metadata
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Actualizar conversation ID si es nueva
        if (data.data.conversationId && !activeConversationId) {
          setActiveConversationId(data.data.conversationId);
          fetchConversations();
        }

        return data.data.message;
      }

      throw new Error('Respuesta inválida del copilot');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al enviar mensaje');
      
      // Eliminar mensaje del usuario si hay error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, context, fetchConversations]);

  // === SEND MESSAGE (STREAMING) ===
  const sendMessageStreaming = useCallback(async (
    message: string,
    actionType: 'chat' | 'analyze_accounts' | 'explain_transaction' | 'suggest_entries' | 'detect_anomalies' = 'chat'
  ) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    // Añadir mensaje del usuario
    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Abort controller para cancelación
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/obelixia-accounting-copilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            action: actionType,
            conversationId: activeConversationId,
            message,
            context,
            stream: true
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(`Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setStreamingContent(assistantContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Añadir mensaje completo del asistente
      const assistantMessage: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[useObelixiaAccountingCopilot] Request cancelled');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error en streaming');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [activeConversationId, context]);

  // === CANCEL STREAMING ===
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  // === EXECUTE QUICK ACTION ===
  const executeQuickAction = useCallback(async (quickAction: QuickAction) => {
    return sendMessage(quickAction.promptTemplate, 'chat');
  }, [sendMessage]);

  // === GENERATE SUGGESTIONS ===
  const generateSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-accounting-copilot',
        {
          body: {
            action: 'generate_suggestions',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        await fetchSuggestions();
        toast.success('Sugerencias generadas');
      }
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] generateSuggestions error:', err);
      toast.error('Error al generar sugerencias');
    } finally {
      setIsLoading(false);
    }
  }, [context, fetchSuggestions]);

  // === ACCEPT SUGGESTION ===
  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    try {
      const { error: dbError } = await supabase
        .from('obelixia_copilot_suggestions')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (dbError) throw dbError;

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast.success('Sugerencia aceptada');
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] acceptSuggestion error:', err);
      toast.error('Error al aceptar sugerencia');
    }
  }, []);

  // === REJECT SUGGESTION ===
  const rejectSuggestion = useCallback(async (suggestionId: string, reason?: string) => {
    try {
      const { error: dbError } = await supabase
        .from('obelixia_copilot_suggestions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', suggestionId);

      if (dbError) throw dbError;

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast.success('Sugerencia rechazada');
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] rejectSuggestion error:', err);
      toast.error('Error al rechazar sugerencia');
    }
  }, []);

  // === PROVIDE FEEDBACK ===
  const provideFeedback = useCallback(async (
    messageId: string, 
    feedback: 'positive' | 'negative' | 'neutral'
  ) => {
    try {
      // Buscar el mensaje real en BD
      const { error: dbError } = await supabase
        .from('obelixia_copilot_messages')
        .update({ feedback })
        .eq('id', messageId);

      if (dbError) throw dbError;

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, feedback } : m
      ));

      toast.success('Gracias por tu feedback');
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] provideFeedback error:', err);
    }
  }, []);

  // === NEW CONVERSATION ===
  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  // === DELETE CONVERSATION ===
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error: dbError } = await supabase
        .from('obelixia_copilot_conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      if (dbError) throw dbError;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (activeConversationId === conversationId) {
        startNewConversation();
      }

      toast.success('Conversación eliminada');
    } catch (err) {
      console.error('[useObelixiaAccountingCopilot] deleteConversation error:', err);
      toast.error('Error al eliminar conversación');
    }
  }, [activeConversationId, startNewConversation]);

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
    messages,
    conversations,
    activeConversationId,
    quickActions,
    suggestions,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    context,
    
    // Setters
    setContext,
    
    // Acciones
    fetchQuickActions,
    fetchConversations,
    fetchSuggestions,
    loadConversation,
    sendMessage,
    sendMessageStreaming,
    cancelStreaming,
    executeQuickAction,
    generateSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    provideFeedback,
    startNewConversation,
    deleteConversation
  };
}

export default useObelixiaAccountingCopilot;
