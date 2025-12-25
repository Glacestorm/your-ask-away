import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CopilotPrediction {
  id: string;
  user_id: string;
  prediction_type: string;
  prediction_data: {
    type: string;
    title: string;
    description: string;
    confidence: number;
    priority: number;
    action?: {
      type: string;
      target: string;
      params?: Record<string, unknown>;
    };
    reasoning?: string;
    estimatedImpact?: string;
  };
  confidence_score: number | null;
  context_snapshot: Record<string, unknown> | null;
  status: string;
  acted_on_at: string | null;
  user_feedback: Record<string, unknown> | null;
  created_at: string;
}

export interface CopilotConfig {
  id: string;
  user_id: string;
  is_enabled: boolean;
  prediction_frequency: string;
  enabled_features: string[];
  preferences: Record<string, unknown>;
  learning_enabled: boolean;
}

export interface CopilotInsight {
  type: 'trend' | 'anomaly' | 'opportunity';
  title: string;
  description: string;
  relevance: number;
}

export interface CopilotResult {
  predictions: CopilotPrediction['prediction_data'][];
  insights: CopilotInsight[];
  contextualHelp?: {
    currentTask: string;
    tips: string[];
    relatedResources: string[];
  };
}

export interface UserContext {
  currentRoute?: string;
  currentRole?: string;
  recentActions?: string[];
  activeMetrics?: Record<string, number>;
  timeOfDay?: string;
  sessionDuration?: number;
}

export function usePredictiveCopilot() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<CopilotPrediction[]>([]);
  const [config, setConfig] = useState<CopilotConfig | null>(null);
  const [latestResult, setLatestResult] = useState<CopilotResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-copilot', {
        body: { action: 'get_config', userId: user.id }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setConfig(data.data);
      }
    } catch (err) {
      console.error('[usePredictiveCopilot] fetchConfig error:', err);
    }
  }, [user?.id]);

  const fetchSuggestions = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-copilot', {
        body: { action: 'get_suggestions', userId: user.id }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setPredictions(data.data || []);
        setLastRefresh(new Date());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching suggestions';
      setError(message);
      console.error('[usePredictiveCopilot] fetchSuggestions error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const predict = useCallback(async (context: UserContext) => {
    if (!user?.id) return null;

    setIsPredicting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-copilot', {
        body: { action: 'predict', userId: user.id, context }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setLatestResult(data.data);
        await fetchSuggestions();
        return data.data as CopilotResult;
      }
      
      throw new Error(data?.error || 'Prediction failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating predictions';
      setError(message);
      console.error('[usePredictiveCopilot] predict error:', err);
      return null;
    } finally {
      setIsPredicting(false);
    }
  }, [user?.id, fetchSuggestions]);

  const executeSuggestion = useCallback(async (predictionId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-copilot', {
        body: { action: 'execute_suggestion', predictionId }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        toast.success('Sugerencia ejecutada');
        await fetchSuggestions();
        return data.data;
      }
      
      throw new Error(data?.error || 'Execution failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error executing suggestion';
      toast.error(message);
      return null;
    }
  }, [fetchSuggestions]);

  const provideFeedback = useCallback(async (
    predictionId: string, 
    feedback: { rating: number; helpful: boolean; notes?: string }
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-copilot', {
        body: { action: 'provide_feedback', predictionId, feedback }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        toast.success('Feedback registrado');
        await fetchSuggestions();
        return data.data;
      }
    } catch (err) {
      console.error('[usePredictiveCopilot] provideFeedback error:', err);
    }
  }, [fetchSuggestions]);

  const updateConfig = useCallback(async (newConfig: Partial<CopilotConfig>) => {
    if (!user?.id) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predictive-copilot', {
        body: { action: 'update_config', userId: user.id, config: newConfig }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setConfig(data.data);
        toast.success('Configuración actualizada');
        return data.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating config';
      toast.error(message);
      return null;
    }
  }, [user?.id]);

  const learnPattern = useCallback(async (pattern: { type: string; data: Record<string, unknown> }) => {
    if (!user?.id) return;

    try {
      await supabase.functions.invoke('predictive-copilot', {
        body: { action: 'learn_pattern', userId: user.id, pattern }
      });
    } catch (err) {
      console.error('[usePredictiveCopilot] learnPattern error:', err);
    }
  }, [user?.id]);

  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchConfig();
    fetchSuggestions();
    
    autoRefreshInterval.current = setInterval(() => {
      fetchSuggestions();
    }, intervalMs);
  }, [fetchConfig, fetchSuggestions]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    predictions,
    config,
    latestResult,
    isLoading,
    isPredicting,
    error,
    lastRefresh,
    fetchConfig,
    fetchSuggestions,
    predict,
    executeSuggestion,
    provideFeedback,
    updateConfig,
    learnPattern,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default usePredictiveCopilot;
