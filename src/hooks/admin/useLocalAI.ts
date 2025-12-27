/**
 * Hook para gestión de IA Local (Ollama) con fallback a Lovable AI
 * 
 * Características:
 * - Conexión configurable a servidor Ollama local/remoto
 * - Streaming de respuestas
 * - Fallback automático a Lovable AI
 * - Estado de conexión en tiempo real
 * - Caché de respuestas frecuentes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface LocalAIConfig {
  ollamaUrl: string;
  defaultModel: string;
  enableFallback: boolean;
  timeout: number;
  maxTokens: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  source?: 'local' | 'fallback';
  model?: string;
}

export interface AIModel {
  name: string;
  size?: string | number;
  source?: 'local' | 'lovable';
  modified_at?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  source: 'local' | 'fallback' | 'none';
  lastChecked: Date | null;
  models: AIModel[];
  error?: string;
}

export interface LocalAIContext {
  entityType?: string;
  entityId?: string;
  entityData?: Record<string, unknown>;
  currentPage?: string;
  userRole?: string;
  recentActions?: Array<{ action: string; timestamp: string }>;
}

const DEFAULT_CONFIG: LocalAIConfig = {
  ollamaUrl: 'http://localhost:11434',
  defaultModel: 'llama3.2',
  enableFallback: true,
  timeout: 60000,
  maxTokens: 2000,
};

const STORAGE_KEY = 'crm_local_ai_config';

// === HOOK ===
export function useLocalAI() {
  const [config, setConfig] = useState<LocalAIConfig>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        } catch {
          return DEFAULT_CONFIG;
        }
      }
    }
    return DEFAULT_CONFIG;
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    source: 'none',
    lastChecked: null,
    models: [],
  });

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // === SAVE CONFIG ===
  const saveConfig = useCallback((newConfig: Partial<LocalAIConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // === TEST CONNECTION ===
  const testConnection = useCallback(async (): Promise<ConnectionStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('crm-ai-local-bridge', {
        body: {
          action: 'test_connection',
          ollamaUrl: config.ollamaUrl,
        },
      });

      if (error) throw error;

      const status: ConnectionStatus = {
        connected: data?.connected || false,
        source: data?.connected ? 'local' : (data?.fallbackAvailable ? 'fallback' : 'none'),
        lastChecked: new Date(),
        models: data?.models || [],
        error: data?.error,
      };

      setConnectionStatus(status);
      return status;
    } catch (err) {
      const status: ConnectionStatus = {
        connected: false,
        source: 'none',
        lastChecked: new Date(),
        models: [],
        error: err instanceof Error ? err.message : 'Connection test failed',
      };
      setConnectionStatus(status);
      return status;
    }
  }, [config.ollamaUrl]);

  // === LIST MODELS ===
  const listModels = useCallback(async (): Promise<AIModel[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('crm-ai-local-bridge', {
        body: {
          action: 'list_models',
          ollamaUrl: config.ollamaUrl,
        },
      });

      if (error) throw error;

      const models = data?.models || [];
      setConnectionStatus(prev => ({ ...prev, models }));
      return models;
    } catch (err) {
      console.error('[useLocalAI] listModels error:', err);
      return [];
    }
  }, [config.ollamaUrl]);

  // === SEND MESSAGE ===
  const sendMessage = useCallback(async (
    content: string,
    context?: LocalAIContext
  ): Promise<AIMessage | null> => {
    if (!content.trim()) return null;

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      abortControllerRef.current = new AbortController();

      const { data, error } = await supabase.functions.invoke('crm-ai-local-bridge', {
        body: {
          action: 'chat',
          model: config.defaultModel,
          prompt: content,
          context,
          ollamaUrl: config.ollamaUrl,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'AI request failed');
      }

      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        source: data.source,
        model: data.model,
      };

      setMessages(prev => [...prev, assistantMessage]);
      return assistantMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useLocalAI] sendMessage error:', errorMessage);
      
      if (errorMessage.includes('Rate limit')) {
        toast.error('Límite de solicitudes excedido. Intenta más tarde.');
      } else if (errorMessage.includes('Payment')) {
        toast.error('Créditos insuficientes. Añade fondos para continuar.');
      } else {
        toast.error('Error al procesar la solicitud');
      }
      
      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [config, messages]);

  // === CANCEL REQUEST ===
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  // === CLEAR MESSAGES ===
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // === QUICK ACTIONS ===
  const quickActions = [
    { id: 'analyze_client', label: 'Analizar Cliente', prompt: 'Analiza el perfil y comportamiento de este cliente' },
    { id: 'generate_email', label: 'Generar Email', prompt: 'Genera un email profesional para este contacto' },
    { id: 'predict_churn', label: 'Predecir Churn', prompt: 'Evalúa el riesgo de abandono de este cliente' },
    { id: 'recommend_products', label: 'Recomendar Productos', prompt: 'Sugiere productos o servicios relevantes' },
    { id: 'summarize_activity', label: 'Resumen de Actividad', prompt: 'Resume la actividad reciente de este cliente' },
    { id: 'next_best_action', label: 'Siguiente Acción', prompt: '¿Cuál debería ser la siguiente acción con este cliente?' },
  ];

  // === AUTO CHECK CONNECTION ===
  useEffect(() => {
    // Initial check
    testConnection();

    // Periodic check every 30 seconds
    checkIntervalRef.current = setInterval(() => {
      testConnection();
    }, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [testConnection]);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      cancelRequest();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [cancelRequest]);

  return {
    // Config
    config,
    saveConfig,
    
    // Connection
    connectionStatus,
    testConnection,
    listModels,
    
    // Messages
    messages,
    sendMessage,
    clearMessages,
    
    // State
    isLoading,
    isStreaming,
    cancelRequest,
    
    // Quick Actions
    quickActions,
  };
}

export default useLocalAI;
