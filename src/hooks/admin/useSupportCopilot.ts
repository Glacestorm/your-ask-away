import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from '@/hooks/core';

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

// KB 2.0: Re-export for backwards compat
export type SupportCopilotError = KBError;

export function useSupportCopilot() {
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [nextBestActions, setNextBestActions] = useState<string[]>([]);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // === KB 2.0 COMPUTED ===
  const isLoading = status === 'loading';
  const isIdle = status === 'idle';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const getSuggestions = useCallback(async (sessionContext: SessionContext): Promise<SuggestionsResponse | null> => {
    setStatus('loading');
    setError(null);
    const startTime = Date.now();

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
        setLastSuccess(new Date());
        setStatus('success');
        setRetryCount(0);
        collectTelemetry('useSupportCopilot', 'getSuggestions', 'success', Date.now() - startTime);
        return response;
      }

      throw new Error('Invalid response from copilot');
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('GET_SUGGESTIONS_ERROR', parsedErr.message, { retryable: true, details: { originalError: String(err) } });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useSupportCopilot', 'getSuggestions', 'error', Date.now() - startTime, kbError);
      console.error('[useSupportCopilot] getSuggestions error:', err);
      return null;
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
    setStatus('loading');
    const startTime = Date.now();

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
        setStatus('success');
        collectTelemetry('useSupportCopilot', 'generateSummary', 'success', Date.now() - startTime);
        return data.data as SessionSummary;
      }

      return null;
    } catch (err) {
      const parsedErr = parseError(err);
      toast.error(parsedErr.message);
      setStatus('error');
      collectTelemetry('useSupportCopilot', 'generateSummary', 'error', Date.now() - startTime);
      return null;
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
    setStatus('idle');
  }, []);

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  // === KB 2.0 RESET ===
  const reset = useCallback(() => {
    setSuggestions([]);
    setRiskAssessment(null);
    setNextBestActions([]);
    setError(null);
    setStatus('idle');
    setLastRefresh(null);
    setLastSuccess(null);
    setRetryCount(0);
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
    // === KB 2.0 ===
    status,
    isIdle,
    isSuccess,
    isError,
    lastSuccess,
    retryCount,
    
    // Actions
    getSuggestions,
    analyzeAction,
    generateSummary,
    predictIssues,
    startAutoRefresh,
    stopAutoRefresh,
    dismissSuggestion,
    clearAll,
    clearError,
    reset
  };
}

export default useSupportCopilot;
