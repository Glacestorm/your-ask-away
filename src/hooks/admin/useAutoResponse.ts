import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface AutoResponseSuggestion {
  id: string;
  response_text: string;
  tone: 'formal' | 'friendly' | 'professional' | 'empathetic';
  confidence: number;
  template_used?: string;
  personalization_applied: boolean;
  key_points_addressed: string[];
}

export interface AutoResponseConfig {
  enabled: boolean;
  auto_send_threshold: number;
  tone_preference: string;
  excluded_categories: string[];
  working_hours_only: boolean;
  signature_template?: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  template_text: string;
  variables: string[];
  usage_count: number;
  success_rate: number;
}

export interface ResponseMetrics {
  total_generated: number;
  auto_sent: number;
  edited_before_send: number;
  avg_confidence: number;
  avg_response_time_ms: number;
}

// === HOOK ===
export function useAutoResponse() {
  const [suggestions, setSuggestions] = useState<AutoResponseSuggestion[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [config, setConfig] = useState<AutoResponseConfig | null>(null);
  const [metrics, setMetrics] = useState<ResponseMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === GENERATE RESPONSE ===
  const generateResponse = useCallback(async (
    messageContent: string,
    context: {
      sender?: string;
      category?: string;
      previousMessages?: Array<{ role: string; content: string }>;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AutoResponseSuggestion[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-response', {
        body: {
          action: 'generate',
          message: messageContent,
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
      const message = err instanceof Error ? err.message : 'Error generating response';
      setError(message);
      console.error('[useAutoResponse] generateResponse error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SEND RESPONSE ===
  const sendResponse = useCallback(async (
    suggestionId: string,
    editedText?: string,
    recipientId?: string
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-response', {
        body: {
          action: 'send',
          suggestionId,
          editedText,
          recipientId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        toast.success('Respuesta enviada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAutoResponse] sendResponse error:', err);
      toast.error('Error al enviar respuesta');
      return false;
    }
  }, []);

  // === GET CONFIG ===
  const fetchConfig = useCallback(async (): Promise<AutoResponseConfig | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-response', {
        body: { action: 'get_config' }
      });

      if (fnError) throw fnError;

      if (data?.config) {
        setConfig(data.config);
        return data.config;
      }

      return null;
    } catch (err) {
      console.error('[useAutoResponse] fetchConfig error:', err);
      return null;
    }
  }, []);

  // === UPDATE CONFIG ===
  const updateConfig = useCallback(async (updates: Partial<AutoResponseConfig>): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-response', {
        body: { action: 'update_config', updates }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setConfig(prev => prev ? { ...prev, ...updates } : null);
        toast.success('Configuración actualizada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAutoResponse] updateConfig error:', err);
      return false;
    }
  }, []);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async (): Promise<ResponseTemplate[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-response', {
        body: { action: 'list_templates' }
      });

      if (fnError) throw fnError;

      if (data?.templates) {
        setTemplates(data.templates);
        return data.templates;
      }

      return [];
    } catch (err) {
      console.error('[useAutoResponse] fetchTemplates error:', err);
      return [];
    }
  }, []);

  // === FETCH METRICS ===
  const fetchMetrics = useCallback(async (days: number = 30): Promise<ResponseMetrics | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-response', {
        body: { action: 'get_metrics', days }
      });

      if (fnError) throw fnError;

      if (data?.metrics) {
        setMetrics(data.metrics);
        return data.metrics;
      }

      return null;
    } catch (err) {
      console.error('[useAutoResponse] fetchMetrics error:', err);
      return null;
    }
  }, []);

  // === IMPROVE TEMPLATE ===
  const improveTemplate = useCallback(async (templateId: string): Promise<string | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-response', {
        body: { action: 'improve_template', templateId }
      });

      if (fnError) throw fnError;

      return data?.improved_text || null;
    } catch (err) {
      console.error('[useAutoResponse] improveTemplate error:', err);
      return null;
    }
  }, []);

  return {
    suggestions,
    templates,
    config,
    metrics,
    isLoading,
    error,
    generateResponse,
    sendResponse,
    fetchConfig,
    updateConfig,
    fetchTemplates,
    fetchMetrics,
    improveTemplate,
  };
}

export default useAutoResponse;
