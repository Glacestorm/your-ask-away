import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CopilotSuggestion {
  id: string;
  type: 'action' | 'warning' | 'tip' | 'checklist';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  icon: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendation: string;
}

export interface SuggestionsResponse {
  suggestions: CopilotSuggestion[];
  riskAssessment: RiskAssessment;
  nextBestActions: string[];
}

export interface ActionAnalysis {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  complianceFlags: string[];
  recommendations: string[];
  betterDescription: string;
}

export interface SessionSummary {
  executiveSummary: string;
  keyActions: string[];
  risksIdentified: string[];
  recommendations: string[];
  followUpRequired: boolean;
  followUpNotes: string;
  qualityScore: number;
}

export interface IssuePrediction {
  issue: string;
  probability: number;
  preventiveAction: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PredictionsResponse {
  predictions: IssuePrediction[];
  sessionHealthScore: number;
  alerts: string[];
}

export interface SessionContext {
  sessionId: string;
  sessionCode: string;
  clientName?: string;
  startedAt: string;
  actionsCount: number;
  highRiskCount: number;
  currentDuration: number;
  recentActions?: Array<{
    action_type: string;
    description: string;
    risk_level: string;
    created_at: string;
  }>;
}

// KB Pattern: Typed error interface
export interface SupportCopilotError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function useSupportCopilot() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [nextBestActions, setNextBestActions] = useState<string[]>([]);
  // KB Pattern: Typed error state
  const [error, setError] = useState<SupportCopilotError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const getSuggestions = useCallback(async (sessionContext: SessionContext): Promise<SuggestionsResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-copilot', {
        body: {
          action: 'get_suggestions',
          sessionContext
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const response = data.data as SuggestionsResponse;
        setSuggestions(response.suggestions || []);
        setRiskAssessment(response.riskAssessment || null);
        setNextBestActions(response.nextBestActions || []);
        setLastRefresh(new Date());
        return response;
      }

      throw new Error('Invalid response from copilot');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener sugerencias';
      setError({ code: 'GET_SUGGESTIONS_ERROR', message, details: { originalError: String(err) } });
      console.error('[useSupportCopilot] getSuggestions error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeAction = useCallback(async (
    actionType: string,
    description: string
  ): Promise<ActionAnalysis | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-copilot', {
        body: {
          action: 'analyze_action',
          actionContext: { actionType, description }
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        return data.data as ActionAnalysis;
      }

      return null;
    } catch (err) {
      console.error('[useSupportCopilot] analyzeAction error:', err);
      return null;
    }
  }, []);

  const generateSummary = useCallback(async (
    sessionContext: SessionContext
  ): Promise<SessionSummary | null> => {
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-copilot', {
        body: {
          action: 'generate_summary',
          sessionContext
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        toast.success('Resumen generado por IA');
        return data.data as SessionSummary;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar resumen';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const predictIssues = useCallback(async (
    sessionContext: SessionContext
  ): Promise<PredictionsResponse | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('support-copilot', {
        body: {
          action: 'predict_issues',
          sessionContext
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        return data.data as PredictionsResponse;
      }

      return null;
    } catch (err) {
      console.error('[useSupportCopilot] predictIssues error:', err);
      return null;
    }
  }, []);

  const startAutoRefresh = useCallback((sessionContext: SessionContext, intervalMs: number = 60000) => {
    stopAutoRefresh();
    
    // Initial fetch
    getSuggestions(sessionContext);
    
    // Set up interval
    autoRefreshInterval.current = setInterval(() => {
      getSuggestions(sessionContext);
    }, intervalMs);
  }, [getSuggestions]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const clearAll = useCallback(() => {
    setSuggestions([]);
    setRiskAssessment(null);
    setNextBestActions([]);
    setError(null);
    setLastRefresh(null);
  }, []);

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  return {
    // State
    isLoading,
    suggestions,
    riskAssessment,
    nextBestActions,
    error,
    lastRefresh,
    
    // Actions
    getSuggestions,
    analyzeAction,
    generateSummary,
    predictIssues,
    startAutoRefresh,
    stopAutoRefresh,
    dismissSuggestion,
    clearAll,
    clearError
  };
}

export default useSupportCopilot;
