/**
 * useNotificationIntelligence Hook
 * Fase 6 - Notification Intelligence System
 * Sistema de inteligencia para priorización y gestión de notificaciones
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

export interface NotificationInput {
  id: string;
  type: string;
  title: string;
  message: string;
  severity?: string;
  source?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface PrioritizedNotification {
  id: string;
  originalPriority: string;
  newPriority: 'critical' | 'high' | 'medium' | 'low' | 'deferred';
  priorityScore: number;
  reasoning: string;
  optimalDeliveryTime: 'now' | '1h' | '4h' | 'tomorrow' | 'weekly_digest';
  suggestedChannel: 'push' | 'email' | 'in_app' | 'sms';
  fatigueRisk: 'low' | 'medium' | 'high';
}

export interface PrioritizationResult {
  prioritizedNotifications: PrioritizedNotification[];
  summary: {
    criticalCount: number;
    deferredCount: number;
    avgPriorityChange: number;
    fatigueWarning: boolean;
    recommendations: string[];
  };
}

export interface NoiseReductionResult {
  filteredNotifications: Array<{
    id: string;
    action: 'keep' | 'suppress' | 'group' | 'delay';
    reason: string;
    groupId?: string;
  }>;
  noiseMetrics: {
    originalCount: number;
    finalCount: number;
    reductionPercentage: number;
    suppressedTypes: Record<string, number>;
  };
  qualityScore: number;
}

export interface ActionSuggestion {
  notificationId: string;
  suggestedActions: Array<{
    action: string;
    description: string;
    confidence: number;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    automated: boolean;
    prerequisites?: string[];
  }>;
  contextInsights: string[];
}

export interface GroupedNotifications {
  groups: Array<{
    groupId: string;
    groupName: string;
    groupType: 'similar' | 'related' | 'sequential' | 'causal';
    notifications: string[];
    summary: string;
    priority: string;
    suggestedAction: string;
  }>;
  ungrouped: string[];
  relationshipMap: Record<string, string[]>;
}

export interface PredictedAlert {
  alertId: string;
  predictedType: string;
  probability: number;
  expectedTime: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  basedOn: string[];
  preventiveActions: string[];
  confidence: number;
}

export interface AlertPredictionResult {
  predictedAlerts: PredictedAlert[];
  riskLevel: 'high' | 'medium' | 'low';
  patterns: Array<{
    pattern: string;
    frequency: number;
    lastOccurrence: string;
  }>;
  recommendations: string[];
}

export interface AutoActionResult {
  executed: boolean;
  actionTaken: string;
  result: {
    success: boolean;
    message: string;
    impact: string;
  };
  reversible: boolean;
  auditLog: Array<{
    timestamp: string;
    action: string;
    result: string;
  }>;
}

export interface IntelligenceStats {
  period: string;
  totalNotifications: number;
  priorityDistribution: Record<string, number>;
  noiseReductionRate: number;
  autoActionsExecuted: number;
  avgResponseTime: string;
  topSources: Array<{ source: string; count: number }>;
  fatigueIndex: number;
  effectivenessScore: number;
}

export interface IntelligenceConfig {
  noiseTolerance: 'low' | 'medium' | 'high';
  autoActionEnabled: boolean;
  priorityWeights: Record<string, number>;
  groupingWindow: number;
}

export interface NotificationContext {
  userId?: string;
  moduleKey?: string;
  timeWindow?: string;
  historicalData?: Record<string, unknown>;
}

type ActionType = 
  | 'smart_prioritize'
  | 'reduce_noise'
  | 'suggest_action'
  | 'group_related'
  | 'predict_alerts'
  | 'execute_auto_action'
  | 'get_intelligence_stats'
  | 'configure_intelligence';

// === HOOK ===

export function useNotificationIntelligence() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Cache
  const [prioritizationResult, setPrioritizationResult] = useState<PrioritizationResult | null>(null);
  const [noiseResult, setNoiseResult] = useState<NoiseReductionResult | null>(null);
  const [groupedResult, setGroupedResult] = useState<GroupedNotifications | null>(null);
  const [predictions, setPredictions] = useState<AlertPredictionResult | null>(null);
  const [stats, setStats] = useState<IntelligenceStats | null>(null);
  const [config, setConfig] = useState<IntelligenceConfig | null>(null);

  // Auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GENERIC INVOKE ===
  const invokeAction = useCallback(async <T>(
    action: ActionType,
    notifications?: NotificationInput[],
    context?: NotificationContext,
    actionParams?: Record<string, unknown>,
    configParams?: Partial<IntelligenceConfig>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('notification-intelligence', {
        body: { 
          action, 
          notifications,
          context,
          actionParams,
          config: configParams
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setLastRefresh(new Date());
        return data.data as T;
      }

      throw new Error(data?.error || 'Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useNotificationIntelligence] ${action} error:`, err);
      toast.error(`Error: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SMART PRIORITIZE ===
  const smartPrioritize = useCallback(async (
    notifications: NotificationInput[],
    context?: NotificationContext
  ) => {
    const result = await invokeAction<PrioritizationResult>('smart_prioritize', notifications, context);
    if (result) {
      setPrioritizationResult(result);
      if (result.summary.criticalCount > 0) {
        toast.warning(`${result.summary.criticalCount} notificaciones críticas`);
      }
    }
    return result;
  }, [invokeAction]);

  // === REDUCE NOISE ===
  const reduceNoise = useCallback(async (
    notifications: NotificationInput[],
    context?: NotificationContext,
    configParams?: Partial<IntelligenceConfig>
  ) => {
    const result = await invokeAction<NoiseReductionResult>('reduce_noise', notifications, context, undefined, configParams);
    if (result) {
      setNoiseResult(result);
      toast.success(`Ruido reducido en ${result.noiseMetrics.reductionPercentage}%`);
    }
    return result;
  }, [invokeAction]);

  // === SUGGEST ACTION ===
  const suggestAction = useCallback(async (
    notifications: NotificationInput[],
    context?: NotificationContext
  ) => {
    const result = await invokeAction<{ suggestions: ActionSuggestion[] }>('suggest_action', notifications, context);
    return result?.suggestions || null;
  }, [invokeAction]);

  // === GROUP RELATED ===
  const groupRelated = useCallback(async (
    notifications: NotificationInput[],
    context?: NotificationContext
  ) => {
    const result = await invokeAction<GroupedNotifications>('group_related', notifications, context);
    if (result) {
      setGroupedResult(result);
      toast.success(`${result.groups.length} grupos creados`);
    }
    return result;
  }, [invokeAction]);

  // === PREDICT ALERTS ===
  const predictAlerts = useCallback(async (
    context?: NotificationContext
  ) => {
    const result = await invokeAction<AlertPredictionResult>('predict_alerts', undefined, context);
    if (result) {
      setPredictions(result);
      if (result.riskLevel === 'high') {
        toast.warning(`${result.predictedAlerts.length} alertas predichas con riesgo alto`);
      }
    }
    return result;
  }, [invokeAction]);

  // === EXECUTE AUTO ACTION ===
  const executeAutoAction = useCallback(async (
    notificationId: string,
    actionType: string,
    autoExecute: boolean = false
  ) => {
    const result = await invokeAction<AutoActionResult>(
      'execute_auto_action', 
      undefined, 
      undefined, 
      { notificationId, actionType, autoExecute }
    );
    if (result?.executed) {
      toast.success(`Acción ejecutada: ${result.actionTaken}`);
    }
    return result;
  }, [invokeAction]);

  // === GET INTELLIGENCE STATS ===
  const getIntelligenceStats = useCallback(async (
    context?: NotificationContext
  ) => {
    const result = await invokeAction<IntelligenceStats>('get_intelligence_stats', undefined, context);
    if (result) {
      setStats(result);
    }
    return result;
  }, [invokeAction]);

  // === CONFIGURE INTELLIGENCE ===
  const configureIntelligence = useCallback(async (
    newConfig: Partial<IntelligenceConfig>
  ) => {
    const result = await invokeAction<{ config: IntelligenceConfig; saved: boolean }>(
      'configure_intelligence', 
      undefined, 
      undefined, 
      undefined,
      newConfig
    );
    if (result?.saved) {
      setConfig(result.config);
      toast.success('Configuración guardada');
    }
    return result;
  }, [invokeAction]);

  // === FULL ANALYSIS ===
  const runFullAnalysis = useCallback(async (
    notifications: NotificationInput[],
    context?: NotificationContext
  ) => {
    setIsLoading(true);
    try {
      const [prioritized, noise, grouped, alertPredictions] = await Promise.all([
        invokeAction<PrioritizationResult>('smart_prioritize', notifications, context),
        invokeAction<NoiseReductionResult>('reduce_noise', notifications, context),
        invokeAction<GroupedNotifications>('group_related', notifications, context),
        invokeAction<AlertPredictionResult>('predict_alerts', undefined, context)
      ]);

      if (prioritized) setPrioritizationResult(prioritized);
      if (noise) setNoiseResult(noise);
      if (grouped) setGroupedResult(grouped);
      if (alertPredictions) setPredictions(alertPredictions);

      toast.success('Análisis de inteligencia completado');
      return { prioritized, noise, grouped, alertPredictions };
    } catch (err) {
      console.error('[useNotificationIntelligence] Full analysis error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [invokeAction]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((
    notifications: NotificationInput[],
    context: NotificationContext,
    intervalMs = 60000
  ) => {
    stopAutoRefresh();
    runFullAnalysis(notifications, context);
    autoRefreshInterval.current = setInterval(() => {
      runFullAnalysis(notifications, context);
    }, intervalMs);
  }, [runFullAnalysis]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === CLEAR CACHE ===
  const clearCache = useCallback(() => {
    setPrioritizationResult(null);
    setNoiseResult(null);
    setGroupedResult(null);
    setPredictions(null);
    setStats(null);
    setLastRefresh(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    lastRefresh,
    
    // Cached Results
    prioritizationResult,
    noiseResult,
    groupedResult,
    predictions,
    stats,
    config,
    
    // Actions
    smartPrioritize,
    reduceNoise,
    suggestAction,
    groupRelated,
    predictAlerts,
    executeAutoAction,
    getIntelligenceStats,
    configureIntelligence,
    
    // Comprehensive
    runFullAnalysis,
    
    // Control
    startAutoRefresh,
    stopAutoRefresh,
    clearCache,
  };
}

export default useNotificationIntelligence;
