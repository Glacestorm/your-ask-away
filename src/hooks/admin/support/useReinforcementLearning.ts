import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

// === INTERFACES ===
export interface AgentFeedback {
  id: string;
  orchestration_session_id: string | null;
  agent_task_id: string | null;
  action_execution_id: string | null;
  agent_key: string;
  feedback_type: 'explicit_rating' | 'implicit_signal' | 'outcome_based' | 'correction' | 'escalation_trigger';
  outcome_score: number;
  user_rating: number | null;
  feedback_source: 'user' | 'system' | 'supervisor' | 'automated' | null;
  feedback_text: string | null;
  context_snapshot: Record<string, unknown> | null;
  action_taken: string | null;
  expected_outcome: string | null;
  actual_outcome: string | null;
  improvement_suggestion: string | null;
  learned_pattern: Record<string, unknown> | null;
  applied_to_training: boolean;
  applied_at: string | null;
  given_by: string | null;
  created_at: string;
}

export interface LearnedPattern {
  id: string;
  agent_key: string;
  pattern_type: 'success_pattern' | 'failure_pattern' | 'escalation_pattern' | 'optimization' | 'context_rule';
  pattern_name: string;
  pattern_description: string | null;
  trigger_conditions: Record<string, unknown>;
  recommended_actions: Record<string, unknown> | null;
  confidence_boost: number;
  success_count: number;
  failure_count: number;
  last_applied_at: string | null;
  is_active: boolean;
}

export interface AgentMetrics {
  id: string;
  agent_key: string;
  metric_date: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  escalated_tasks: number;
  auto_resolved_count: number;
  avg_confidence_score: number | null;
  avg_execution_time_ms: number | null;
  total_tokens_used: number;
  user_satisfaction_avg: number | null;
  feedback_count: number;
  patterns_applied: number;
}

export interface FeedbackInput {
  agentKey: string;
  feedbackType: AgentFeedback['feedback_type'];
  outcomeScore: number;
  userRating?: number;
  feedbackText?: string;
  actionTaken?: string;
  expectedOutcome?: string;
  actualOutcome?: string;
  improvementSuggestion?: string;
  sessionId?: string;
  taskId?: string;
  executionId?: string;
  contextSnapshot?: Record<string, unknown>;
}

// === HOOK ===
export function useReinforcementLearning() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<AgentFeedback[]>([]);
  const [patterns, setPatterns] = useState<LearnedPattern[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === SUBMIT FEEDBACK ===
  const submitFeedback = useCallback(async (input: FeedbackInput): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('support_agent_feedback')
        .insert([{
          agent_key: input.agentKey,
          feedback_type: input.feedbackType,
          outcome_score: input.outcomeScore,
          user_rating: input.userRating || null,
          feedback_source: 'user',
          feedback_text: input.feedbackText || null,
          action_taken: input.actionTaken || null,
          expected_outcome: input.expectedOutcome || null,
          actual_outcome: input.actualOutcome || null,
          improvement_suggestion: input.improvementSuggestion || null,
          orchestration_session_id: input.sessionId || null,
          agent_task_id: input.taskId || null,
          action_execution_id: input.executionId || null,
          context_snapshot: (input.contextSnapshot || null) as Json,
          given_by: user?.id || null
        }]);

      if (insertError) throw insertError;

      toast.success('Feedback registrado');
      await fetchFeedback(input.agentKey);
      return true;
    } catch (err) {
      console.error('[useReinforcementLearning] submitFeedback error:', err);
      toast.error('Error registrando feedback');
      return false;
    }
  }, [user]);

  // === RECORD IMPLICIT SIGNAL ===
  const recordImplicitSignal = useCallback(async (
    agentKey: string,
    outcomeScore: number,
    context: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('support_agent_feedback')
        .insert([{
          agent_key: agentKey,
          feedback_type: 'implicit_signal',
          outcome_score: outcomeScore,
          feedback_source: 'automated',
          context_snapshot: context as Json
        }]);

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error('[useReinforcementLearning] recordImplicitSignal error:', err);
      return false;
    }
  }, []);

  // === RECORD OUTCOME ===
  const recordOutcome = useCallback(async (
    agentKey: string,
    sessionId: string,
    resolved: boolean,
    details: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('support_agent_feedback')
        .insert([{
          agent_key: agentKey,
          feedback_type: 'outcome_based',
          outcome_score: resolved ? 1 : -0.5,
          feedback_source: 'system',
          orchestration_session_id: sessionId,
          actual_outcome: resolved ? 'resolved' : 'unresolved',
          context_snapshot: details as Json
        }]);

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error('[useReinforcementLearning] recordOutcome error:', err);
      return false;
    }
  }, []);

  // === FETCH FEEDBACK ===
  const fetchFeedback = useCallback(async (agentKey?: string, limit = 100) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('support_agent_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (agentKey) {
        query = query.eq('agent_key', agentKey);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setFeedback((data || []) as AgentFeedback[]);
      return data as AgentFeedback[];
    } catch (err) {
      console.error('[useReinforcementLearning] fetchFeedback error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH PATTERNS ===
  const fetchPatterns = useCallback(async (agentKey?: string) => {
    try {
      let query = supabase
        .from('support_learned_patterns')
        .select('*')
        .eq('is_active', true)
        .order('success_count', { ascending: false });

      if (agentKey) {
        query = query.eq('agent_key', agentKey);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPatterns((data || []) as LearnedPattern[]);
      return data as LearnedPattern[];
    } catch (err) {
      console.error('[useReinforcementLearning] fetchPatterns error:', err);
      return [];
    }
  }, []);

  // === FETCH METRICS ===
  const fetchMetrics = useCallback(async (agentKey?: string, days = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('support_agent_metrics')
        .select('*')
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (agentKey) {
        query = query.eq('agent_key', agentKey);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setMetrics((data || []) as AgentMetrics[]);
      return data as AgentMetrics[];
    } catch (err) {
      console.error('[useReinforcementLearning] fetchMetrics error:', err);
      return [];
    }
  }, []);

  // === CREATE PATTERN FROM FEEDBACK ===
  const createPatternFromFeedback = useCallback(async (
    agentKey: string,
    patternName: string,
    patternType: LearnedPattern['pattern_type'],
    triggerConditions: Record<string, unknown>,
    recommendedActions: Record<string, unknown>,
    feedbackIds: string[]
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('support_learned_patterns')
        .insert([{
          agent_key: agentKey,
          pattern_type: patternType,
          pattern_name: patternName,
          trigger_conditions: triggerConditions as Json,
          recommended_actions: recommendedActions as Json,
          derived_from_feedbacks: feedbackIds
        }]);

      if (insertError) throw insertError;

      // Mark feedback as applied to training
      await supabase
        .from('support_agent_feedback')
        .update({ applied_to_training: true, applied_at: new Date().toISOString() })
        .in('id', feedbackIds);

      toast.success('Patrón creado');
      await fetchPatterns(agentKey);
      return true;
    } catch (err) {
      console.error('[useReinforcementLearning] createPatternFromFeedback error:', err);
      toast.error('Error creando patrón');
      return false;
    }
  }, [fetchPatterns]);

  // === APPLY PATTERN ===
  const applyPattern = useCallback(async (patternId: string, success: boolean): Promise<boolean> => {
    try {
      const updateData = success 
        ? { success_count: patterns.find(p => p.id === patternId)?.success_count || 0 + 1 }
        : { failure_count: patterns.find(p => p.id === patternId)?.failure_count || 0 + 1 };

      const { error: updateError } = await supabase
        .from('support_learned_patterns')
        .update({
          ...updateData,
          last_applied_at: new Date().toISOString()
        })
        .eq('id', patternId);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      console.error('[useReinforcementLearning] applyPattern error:', err);
      return false;
    }
  }, [patterns]);

  // === GET AGENT PERFORMANCE ===
  const getAgentPerformance = useCallback((agentKey: string) => {
    const agentFeedback = feedback.filter(f => f.agent_key === agentKey);
    const agentMetrics = metrics.filter(m => m.agent_key === agentKey);

    const avgScore = agentFeedback.length > 0
      ? agentFeedback.reduce((sum, f) => sum + f.outcome_score, 0) / agentFeedback.length
      : 0;

    const avgRating = agentFeedback.filter(f => f.user_rating).length > 0
      ? agentFeedback.filter(f => f.user_rating).reduce((sum, f) => sum + (f.user_rating || 0), 0) / agentFeedback.filter(f => f.user_rating).length
      : 0;

    const totalTasks = agentMetrics.reduce((sum, m) => sum + m.total_tasks, 0);
    const successfulTasks = agentMetrics.reduce((sum, m) => sum + m.successful_tasks, 0);
    const successRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0;

    return {
      avgOutcomeScore: avgScore,
      avgUserRating: avgRating,
      totalFeedback: agentFeedback.length,
      totalTasks,
      successRate,
      patternsCount: patterns.filter(p => p.agent_key === agentKey).length
    };
  }, [feedback, metrics, patterns]);

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchPatterns();
    fetchMetrics();
  }, [fetchPatterns, fetchMetrics]);

  return {
    // State
    feedback,
    patterns,
    metrics,
    isLoading,
    error,
    // Actions
    submitFeedback,
    recordImplicitSignal,
    recordOutcome,
    fetchFeedback,
    fetchPatterns,
    fetchMetrics,
    createPatternFromFeedback,
    applyPattern,
    // Helpers
    getAgentPerformance,
  };
}

export default useReinforcementLearning;
