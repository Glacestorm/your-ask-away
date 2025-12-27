import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationContext {
  current_page?: string;
  selected_entity?: {
    type: string;
    id: string;
    name: string;
  };
  recent_actions?: string[];
  user_preferences?: Record<string, unknown>;
  session_data?: Record<string, unknown>;
}

export interface DetectedIntent {
  primary_intent: string;
  secondary_intents: string[];
  confidence: number;
  intent_breakdown: Record<string, number>;
  required_permissions: string[];
  complexity: string;
  clarification_needed: boolean;
}

export interface SuggestedAction {
  action_type: string;
  action_name: string;
  parameters: Record<string, unknown>;
  confirmation_required: boolean;
}

export interface AIResponse {
  response: string;
  intent: string;
  confidence: number;
  suggested_actions: SuggestedAction[];
  entities_extracted: {
    companies: string[];
    dates: string[];
    metrics: string[];
    users: string[];
  };
  follow_up_questions: string[];
  context_update: Record<string, unknown>;
}

export interface CommandExecution {
  command_parsed: {
    action: string;
    target: string;
    parameters: Record<string, unknown>;
    modifiers: string[];
  };
  execution_plan: Array<{
    step: number;
    action: string;
    description: string;
    estimated_time: string;
  }>;
  confirmation_message: string;
  rollback_available: boolean;
}

export interface AISuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  relevance_score: number;
  reason: string;
  quick_action?: {
    label: string;
    command: string;
  };
}

export interface VoiceCommandResult {
  transcription: {
    raw: string;
    corrected: string;
    confidence: number;
  };
  detected_commands: Array<{
    command: string;
    confidence: number;
    parameters: Record<string, unknown>;
  }>;
  confirmation_phrase: string;
}

export interface ConversationSummary {
  summary: {
    brief: string;
    detailed: string;
    key_points: string[];
    decisions_made: string[];
    action_items: string[];
  };
  topics_discussed: string[];
  sentiment_analysis: {
    overall: string;
    progression: string[];
  };
}

export interface DialogueState {
  current_topic: string;
  topic_stack: string[];
  unresolved_queries: string[];
  pending_confirmations: string[];
}

// === HOOK ===
export function useConversationalAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [context, setContext] = useState<ConversationContext>({});
  const [dialogueState, setDialogueState] = useState<DialogueState | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [conversationId, setConversationId] = useState<string>(`conv_${Date.now()}`);
  
  const contextRef = useRef(context);
  contextRef.current = context;

  // === SEND MESSAGE ===
  const sendMessage = useCallback(async (message: string): Promise<AIResponse | null> => {
    setIsProcessing(true);

    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'process_message',
          message,
          context: contextRef.current,
          conversation_id: conversationId,
          history: conversation.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const aiResponse = data.data as AIResponse;

        const assistantMessage: ConversationMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: aiResponse.response,
          timestamp: new Date().toISOString(),
          metadata: {
            intent: aiResponse.intent,
            confidence: aiResponse.confidence,
            suggested_actions: aiResponse.suggested_actions
          }
        };

        setConversation(prev => [...prev, assistantMessage]);

        if (aiResponse.context_update && Object.keys(aiResponse.context_update).length > 0) {
          setContext(prev => ({ ...prev, ...aiResponse.context_update }));
        }

        return aiResponse;
      }

      return null;
    } catch (err) {
      console.error('[useConversationalAI] sendMessage error:', err);
      toast.error('Error al procesar mensaje');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [conversationId, conversation]);

  // === ANALYZE INTENT ===
  const analyzeIntent = useCallback(async (message: string): Promise<DetectedIntent | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'analyze_intent',
          message
        }
      });

      if (error) throw error;
      return data?.success ? data.data : null;
    } catch (err) {
      console.error('[useConversationalAI] analyzeIntent error:', err);
      return null;
    }
  }, []);

  // === EXECUTE COMMAND ===
  const executeCommand = useCallback(async (command: string): Promise<CommandExecution | null> => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'execute_command',
          message: command,
          context: contextRef.current
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Comando procesado');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useConversationalAI] executeCommand error:', err);
      toast.error('Error al ejecutar comando');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === GET SUGGESTIONS ===
  const fetchSuggestions = useCallback(async (userId?: string): Promise<AISuggestion[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'get_suggestions',
          context: contextRef.current,
          user_id: userId
        }
      });

      if (error) throw error;

      if (data?.success && data?.data?.suggestions) {
        setSuggestions(data.data.suggestions);
        return data.data.suggestions;
      }

      return [];
    } catch (err) {
      console.error('[useConversationalAI] fetchSuggestions error:', err);
      return [];
    }
  }, []);

  // === MULTI-TURN DIALOGUE ===
  const continueDialogue = useCallback(async (message: string): Promise<{
    response: string;
    dialogueState: DialogueState;
  } | null> => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'multi_turn_dialogue',
          message,
          context: contextRef.current,
          history: conversation.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const result = data.data;
        
        if (result.dialogue_state) {
          setDialogueState(result.dialogue_state);
        }

        const assistantMessage: ConversationMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString()
        };

        setConversation(prev => [...prev, assistantMessage]);

        return {
          response: result.response,
          dialogueState: result.dialogue_state
        };
      }

      return null;
    } catch (err) {
      console.error('[useConversationalAI] continueDialogue error:', err);
      toast.error('Error en diálogo');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [conversation]);

  // === VOICE TO ACTION ===
  const processVoiceCommand = useCallback(async (voiceInput: string): Promise<VoiceCommandResult | null> => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'voice_to_action',
          voice_input: voiceInput
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.data.confirmation_phrase || 'Comando de voz procesado');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useConversationalAI] processVoiceCommand error:', err);
      toast.error('Error al procesar comando de voz');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === SUMMARIZE CONVERSATION ===
  const summarizeConversation = useCallback(async (): Promise<ConversationSummary | null> => {
    if (conversation.length === 0) {
      toast.info('No hay conversación para resumir');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'summarize_conversation',
          conversation_id: conversationId,
          history: conversation.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;
      return data?.success ? data.data : null;
    } catch (err) {
      console.error('[useConversationalAI] summarizeConversation error:', err);
      return null;
    }
  }, [conversationId, conversation]);

  // === UPDATE CONTEXT ===
  const updateContext = useCallback((updates: Partial<ConversationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  // === CLEAR CONVERSATION ===
  const clearConversation = useCallback(async () => {
    try {
      await supabase.functions.invoke('conversational-ai-hub', {
        body: {
          action: 'clear_context',
          conversation_id: conversationId
        }
      });

      setConversation([]);
      setContext({});
      setDialogueState(null);
      setConversationId(`conv_${Date.now()}`);
      toast.success('Conversación limpiada');
    } catch (err) {
      console.error('[useConversationalAI] clearConversation error:', err);
    }
  }, [conversationId]);

  // === START NEW CONVERSATION ===
  const startNewConversation = useCallback(() => {
    setConversation([]);
    setContext({});
    setDialogueState(null);
    setConversationId(`conv_${Date.now()}`);
  }, []);

  // === QUICK COMMANDS ===
  const quickCommands = {
    help: () => sendMessage('¿Qué puedo hacer aquí?'),
    status: () => sendMessage('Dame un resumen del estado actual'),
    tasks: () => sendMessage('¿Cuáles son mis tareas pendientes?'),
    alerts: () => sendMessage('¿Hay alertas importantes?'),
    report: () => sendMessage('Genera un reporte rápido'),
  };

  return {
    // Estado
    isProcessing,
    conversation,
    context,
    dialogueState,
    suggestions,
    conversationId,
    // Acciones principales
    sendMessage,
    analyzeIntent,
    executeCommand,
    fetchSuggestions,
    continueDialogue,
    processVoiceCommand,
    summarizeConversation,
    // Gestión de contexto
    updateContext,
    clearConversation,
    startNewConversation,
    // Comandos rápidos
    quickCommands,
  };
}

export default useConversationalAI;
