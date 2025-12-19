import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CopilotConfig {
  id: string;
  role: string;
  copilot_name: string;
  copilot_description: string | null;
  system_prompt: string;
  available_tools: string[];
  priority_metrics: string[];
  quick_actions: QuickAction[];
  context_sources: string[];
  is_active: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

export interface CopilotSuggestion {
  id: string;
  type: 'action' | 'insight' | 'alert' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionType?: string;
  entityType?: string;
  entityId?: string;
  estimatedValue?: number;
  confidence: number;
  reasoning?: string;
  actions?: SuggestionAction[];
}

export interface SuggestionAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'dismiss';
  actionCode?: string;
}

export interface CopilotSession {
  id: string;
  user_id: string;
  role: string;
  context_data: Record<string, unknown>;
  active_suggestions: CopilotSuggestion[];
  metrics_snapshot: Record<string, number>;
  last_interaction: string;
}

export interface CopilotMetrics {
  actionsCompleted: number;
  actionsDismissed: number;
  totalMrrImpact: number;
  averageConfidence: number;
  suggestionsAccepted: number;
  suggestionsTotal: number;
}

export function useRoleCopilot() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<CopilotSuggestion[]>([]);

  // Get copilot config for current role
  const { data: copilotConfig, isLoading: configLoading } = useQuery({
    queryKey: ['copilot-config', userRole],
    queryFn: async () => {
      if (!userRole) return null;
      
      // Map user roles to copilot roles
      const copilotRole = mapUserRoleToCopilotRole(userRole);
      
      const { data, error } = await supabase
        .from('copilot_role_configs')
        .select('*')
        .eq('role', copilotRole)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        return {
          ...data,
          available_tools: (data.available_tools || []) as unknown as string[],
          quick_actions: (data.quick_actions || []) as unknown as QuickAction[],
        } as CopilotConfig;
      }
      return null;
    },
    enabled: !!userRole,
  });

  // Get or create session
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['copilot-session', user?.id],
    queryFn: async () => {
      if (!user?.id || !userRole) return null;
      
      const copilotRole = mapUserRoleToCopilotRole(userRole);
      
      // Try to get existing session
      const { data: existingSession, error } = await supabase
        .from('copilot_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', copilotRole)
        .order('last_interaction', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (existingSession) {
        return {
          ...existingSession,
          active_suggestions: (existingSession.active_suggestions || []) as unknown as CopilotSuggestion[],
          context_data: (existingSession.context_data || {}) as unknown as Record<string, unknown>,
          metrics_snapshot: (existingSession.metrics_snapshot || {}) as unknown as Record<string, number>,
        } as CopilotSession;
      }
      
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('copilot_sessions')
        .insert({
          user_id: user.id,
          role: copilotRole,
          context_data: {},
          active_suggestions: [],
          metrics_snapshot: {},
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      return {
        ...newSession,
        active_suggestions: [] as CopilotSuggestion[],
        context_data: {} as Record<string, unknown>,
        metrics_snapshot: {} as Record<string, number>,
      } as CopilotSession;
    },
    enabled: !!user?.id && !!userRole,
  });

  // Get copilot metrics
  const { data: metrics } = useQuery({
    queryKey: ['copilot-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('copilot_action_log')
        .select('outcome, outcome_value')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const completed = data.filter(a => a.outcome === 'completed').length;
      const dismissed = data.filter(a => a.outcome === 'dismissed').length;
      const totalMrr = data.reduce((sum, a) => sum + (a.outcome_value || 0), 0);
      
      return {
        actionsCompleted: completed,
        actionsDismissed: dismissed,
        totalMrrImpact: totalMrr,
        averageConfidence: 0.75, // Calculate from suggestions
        suggestionsAccepted: completed,
        suggestionsTotal: completed + dismissed,
      } as CopilotMetrics;
    },
    enabled: !!user?.id,
  });

  // Generate suggestions from AI
  const generateSuggestions = useCallback(async (context?: Record<string, unknown>) => {
    if (!user?.id || !copilotConfig) return [];
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('copilot-assistant', {
        body: {
          action: 'generate_suggestions',
          userId: user.id,
          role: copilotConfig.role,
          context: context || {},
        },
      });
      
      if (error) throw error;
      
      const suggestions = data.suggestions as CopilotSuggestion[];
      setCurrentSuggestions(suggestions);
      
      // Update session with new suggestions
      if (session?.id) {
        await supabase
          .from('copilot_sessions')
          .update({
            active_suggestions: suggestions as unknown[],
            last_interaction: new Date().toISOString(),
          })
          .eq('id', session.id);
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Error al generar sugerencias');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, copilotConfig, session?.id]);

  // Execute action
  const executeAction = useMutation({
    mutationFn: async ({
      suggestion,
      actionId,
    }: {
      suggestion: CopilotSuggestion;
      actionId: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('copilot-assistant', {
        body: {
          action: 'execute_action',
          userId: user.id,
          suggestion,
          actionId,
        },
      });
      
      if (error) throw error;
      
      // Log the action
      await supabase.from('copilot_action_log').insert([{
        user_id: user.id,
        session_id: session?.id,
        action_type: suggestion.actionType || 'copilot_action',
        action_source: 'copilot',
        entity_type: suggestion.entityType,
        entity_id: suggestion.entityId,
        action_data: { suggestion, actionId } as unknown,
        ai_reasoning: suggestion.reasoning,
        outcome: 'completed',
        outcome_value: suggestion.estimatedValue || 0,
      }]);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Acción ejecutada correctamente');
      queryClient.invalidateQueries({ queryKey: ['copilot-metrics'] });
      // Remove the executed suggestion
      setCurrentSuggestions(prev => prev.filter(s => s.id !== arguments[0]?.suggestion?.id));
    },
    onError: (error) => {
      console.error('Error executing action:', error);
      toast.error('Error al ejecutar la acción');
    },
  });

  // Dismiss suggestion
  const dismissSuggestion = useMutation({
    mutationFn: async ({
      suggestion,
      reason,
    }: {
      suggestion: CopilotSuggestion;
      reason?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      await supabase.from('copilot_action_log').insert([{
        user_id: user.id,
        session_id: session?.id,
        action_type: suggestion.actionType || 'dismiss',
        action_source: 'copilot',
        entity_type: suggestion.entityType,
        entity_id: suggestion.entityId,
        action_data: { suggestion, dismissReason: reason } as unknown,
        outcome: 'dismissed',
        outcome_value: 0,
      }]);
    },
    onSuccess: (_, variables) => {
      setCurrentSuggestions(prev => prev.filter(s => s.id !== variables.suggestion.id));
      queryClient.invalidateQueries({ queryKey: ['copilot-metrics'] });
    },
  });

  // Execute quick action
  const executeQuickAction = useCallback(async (actionId: string) => {
    if (!user?.id || !copilotConfig) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('copilot-assistant', {
        body: {
          action: 'quick_action',
          userId: user.id,
          role: copilotConfig.role,
          quickActionId: actionId,
        },
      });
      
      if (error) throw error;
      
      // If quick action returns suggestions, update them
      if (data.suggestions) {
        setCurrentSuggestions(data.suggestions);
      }
      
      return data;
    } catch (error) {
      console.error('Error executing quick action:', error);
      toast.error('Error al ejecutar acción rápida');
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, copilotConfig]);

  // Load suggestions on mount
  useEffect(() => {
    if (session?.active_suggestions?.length) {
      setCurrentSuggestions(session.active_suggestions);
    }
  }, [session]);

  return {
    copilotConfig,
    session,
    suggestions: currentSuggestions,
    metrics,
    isLoading: configLoading,
    isProcessing,
    generateSuggestions,
    executeAction: executeAction.mutate,
    dismissSuggestion: dismissSuggestion.mutate,
    executeQuickAction,
    refetchSession,
  };
}

function mapUserRoleToCopilotRole(userRole: string): string {
  const roleMap: Record<string, string> = {
    superadmin: 'admin',
    admin: 'admin',
    director_comercial: 'director_comercial',
    responsable_comercial: 'director_comercial',
    director_oficina: 'director_oficina',
    gestor: 'gestor',
    gestor_junior: 'gestor',
    auditor: 'admin',
  };
  return roleMap[userRole] || 'gestor';
}
