import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in_app' | 'webhook';
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  channel_type: 'email' | 'push' | 'sms' | 'slack' | 'teams' | 'webhook';
  config: Record<string, unknown>;
  is_active: boolean;
  rate_limit?: number;
  retry_config?: {
    max_retries: number;
    retry_delay_ms: number;
  };
}

export interface NotificationLog {
  id: string;
  template_id: string;
  channel_id: string;
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreference {
  user_id: string;
  channel_type: string;
  notification_type: string;
  is_enabled: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly';
}

export interface NotificationContext {
  userId?: string;
  channelType?: string;
}

// === SMART NOTIFICATION INTERFACES ===
export interface SmartNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
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

export interface NoiseReductionResult {
  filteredNotifications: Array<{
    id: string;
    action: 'keep' | 'suppress' | 'consolidate' | 'delay';
    reason: string;
    confidenceScore: number;
  }>;
  consolidatedGroups: Array<{
    groupId: string;
    representativeId: string;
    memberIds: string[];
    consolidatedMessage: string;
    totalCount: number;
  }>;
  noiseMetrics: {
    originalCount: number;
    reducedCount: number;
    reductionPercentage: number;
    falsePositiveRisk: 'low' | 'medium' | 'high';
    suppressedCategories: string[];
  };
}

export interface ActionSuggestion {
  notificationId: string;
  suggestedActions: Array<{
    actionId: string;
    actionType: 'immediate' | 'investigate' | 'communicate' | 'prevent' | 'escalate';
    title: string;
    description: string;
    command?: string;
    autoExecutable: boolean;
    riskLevel: 'none' | 'low' | 'medium' | 'high';
    estimatedImpact: string;
    requiredPermissions: string[];
    rollbackAvailable: boolean;
  }>;
  recommendedAction: string;
  urgency: 'immediate' | 'soon' | 'scheduled';
}

export interface NotificationGroup {
  groupId: string;
  groupName: string;
  rootCause: {
    notificationId: string;
    description: string;
    confidence: number;
  };
  members: Array<{
    notificationId: string;
    relationship: 'root' | 'effect' | 'related' | 'symptom';
    order: number;
  }>;
  affectedModules: string[];
  timeline: {
    start: string;
    end: string;
    durationMinutes: number;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolving' | 'resolved';
}

export interface PredictedAlert {
  predictionId: string;
  predictedAlert: {
    type: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  };
  probability: number;
  timeframe: {
    earliest: string;
    mostLikely: string;
    latest: string;
  };
  triggerIndicators: Array<{
    indicator: string;
    currentValue: string;
    thresholdValue: string;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
  preventiveActions: Array<{
    action: string;
    effectiveness: number;
    effort: 'low' | 'medium' | 'high';
  }>;
  affectedModules: string[];
  confidence: number;
}

export interface IntelligenceConfig {
  noiseTolerance: 'low' | 'medium' | 'high';
  autoActionEnabled: boolean;
  priorityWeights: Record<string, number>;
  groupingWindow: number;
}

export interface IntelligenceStats {
  period: string;
  totalProcessed: number;
  priorityDistribution: Record<string, number>;
  noiseReduction: {
    suppressed: number;
    consolidated: number;
    reductionRate: number;
  };
  autoActions: {
    executed: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  predictions: {
    made: number;
    accurate: number;
    accuracyRate: number;
  };
}

// === HOOK ===
export function useNotificationSystem() {
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Smart notification state
  const [prioritizedNotifications, setPrioritizedNotifications] = useState<PrioritizedNotification[]>([]);
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([]);
  const [predictedAlerts, setPredictedAlerts] = useState<PredictedAlert[]>([]);
  const [actionSuggestions, setActionSuggestions] = useState<ActionSuggestion[]>([]);
  const [intelligenceStats, setIntelligenceStats] = useState<IntelligenceStats | null>(null);
  const [intelligenceConfig, setIntelligenceConfig] = useState<IntelligenceConfig>({
    noiseTolerance: 'medium',
    autoActionEnabled: false,
    priorityWeights: {},
    groupingWindow: 30
  });
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isReducingNoise, setIsReducingNoise] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'list_templates'
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.templates) {
        setTemplates(fnData.templates);
        setLastRefresh(new Date());
        return fnData.templates;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useNotificationSystem] fetchTemplates error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH CHANNELS ===
  const fetchChannels = useCallback(async () => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'list_channels'
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.channels) {
        setChannels(fnData.channels);
        return fnData.channels;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] fetchChannels error:', err);
      return null;
    }
  }, []);

  // === SEND NOTIFICATION ===
  const sendNotification = useCallback(async (
    templateId: string,
    recipients: string[],
    variables: Record<string, string>,
    channelIds?: string[]
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'send_notification',
            templateId,
            recipients,
            variables,
            channels: channelIds
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success(`Notificación enviada a ${recipients.length} destinatarios`);
        return fnData.results;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] sendNotification error:', err);
      toast.error('Error al enviar notificación');
      return null;
    }
  }, []);

  // === CREATE TEMPLATE ===
  const createTemplate = useCallback(async (template: Partial<NotificationTemplate>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'create_template',
            template
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Plantilla creada');
        return fnData.template;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] createTemplate error:', err);
      toast.error('Error al crear plantilla');
      return null;
    }
  }, []);

  // === GET LOGS ===
  const fetchLogs = useCallback(async (filters?: { 
    status?: string; 
    channelType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'get_logs',
            filters
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.logs) {
        setLogs(fnData.logs);
        return fnData.logs;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] fetchLogs error:', err);
      return null;
    }
  }, []);

  // === GET STATS ===
  const getStats = useCallback(async (period: 'day' | 'week' | 'month' = 'week') => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-system',
        {
          body: {
            action: 'get_stats',
            period
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        return fnData.stats;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] getStats error:', err);
      return null;
    }
  }, []);

  // === SMART PRIORITIZE ===
  const prioritizeWithAI = useCallback(async (
    notifications: SmartNotification[],
    context?: { userId?: string; moduleKey?: string }
  ) => {
    setIsPrioritizing(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'smart_prioritize',
            notifications,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.prioritizedNotifications) {
        setPrioritizedNotifications(fnData.prioritizedNotifications);
        return {
          notifications: fnData.prioritizedNotifications,
          summary: fnData.summary
        };
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] prioritizeWithAI error:', err);
      toast.error('Error al priorizar notificaciones');
      return null;
    } finally {
      setIsPrioritizing(false);
    }
  }, []);

  // === REDUCE NOISE ===
  const reduceNoise = useCallback(async (
    notifications: SmartNotification[],
    config?: Partial<IntelligenceConfig>
  ): Promise<NoiseReductionResult | null> => {
    setIsReducingNoise(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'reduce_noise',
            notifications,
            config: config || intelligenceConfig
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        return {
          filteredNotifications: fnData.filteredNotifications || [],
          consolidatedGroups: fnData.consolidatedGroups || [],
          noiseMetrics: fnData.noiseMetrics || {
            originalCount: notifications.length,
            reducedCount: 0,
            reductionPercentage: 0,
            falsePositiveRisk: 'low',
            suppressedCategories: []
          }
        };
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] reduceNoise error:', err);
      toast.error('Error al reducir ruido');
      return null;
    } finally {
      setIsReducingNoise(false);
    }
  }, [intelligenceConfig]);

  // === SUGGEST ACTIONS ===
  const suggestActions = useCallback(async (
    notifications: SmartNotification[],
    context?: { userId?: string; moduleKey?: string }
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'suggest_action',
            notifications,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.actionSuggestions) {
        setActionSuggestions(fnData.actionSuggestions);
        return {
          suggestions: fnData.actionSuggestions,
          batchActions: fnData.batchActions || []
        };
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] suggestActions error:', err);
      toast.error('Error al sugerir acciones');
      return null;
    }
  }, []);

  // === GROUP RELATED ===
  const groupRelatedAlerts = useCallback(async (
    notifications: SmartNotification[],
    context?: { timeWindow?: string }
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'group_related',
            notifications,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.groups) {
        setNotificationGroups(fnData.groups);
        return {
          groups: fnData.groups,
          ungrouped: fnData.ungrouped || [],
          crossGroupRelations: fnData.crossGroupRelations || []
        };
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] groupRelatedAlerts error:', err);
      toast.error('Error al agrupar alertas');
      return null;
    }
  }, []);

  // === PREDICT ALERTS ===
  const getPredictiveAlerts = useCallback(async (
    notifications: SmartNotification[],
    context?: { historicalData?: Record<string, unknown> }
  ) => {
    setIsPredicting(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'predict_alerts',
            notifications,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.predictions) {
        setPredictedAlerts(fnData.predictions);
        return {
          predictions: fnData.predictions,
          overallRiskLevel: fnData.overallRiskLevel,
          trendAnalysis: fnData.trendAnalysis
        };
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] getPredictiveAlerts error:', err);
      toast.error('Error al predecir alertas');
      return null;
    } finally {
      setIsPredicting(false);
    }
  }, []);

  // === EXECUTE AUTO ACTION ===
  const executeAutoAction = useCallback(async (
    actionType: string,
    notificationId: string,
    autoExecute = false
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'execute_auto_action',
            actionParams: {
              actionType,
              notificationId,
              autoExecute
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        if (fnData.execution?.approved) {
          toast.success('Acción ejecutada automáticamente');
        } else {
          toast.info('Acción requiere aprobación manual');
        }
        return fnData;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] executeAutoAction error:', err);
      toast.error('Error al ejecutar acción');
      return null;
    }
  }, []);

  // === GET INTELLIGENCE STATS ===
  const fetchIntelligenceStats = useCallback(async () => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'get_intelligence_stats',
            context: {}
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.stats) {
        setIntelligenceStats(fnData.stats);
        return fnData.stats;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] fetchIntelligenceStats error:', err);
      return null;
    }
  }, []);

  // === CONFIGURE INTELLIGENCE ===
  const configureIntelligence = useCallback(async (config: Partial<IntelligenceConfig>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'notification-intelligence',
        {
          body: {
            action: 'configure_intelligence',
            config
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.configuration) {
        setIntelligenceConfig(prev => ({
          ...prev,
          ...fnData.configuration.appliedSettings
        }));
        toast.success('Configuración de inteligencia actualizada');
        return fnData.configuration;
      }

      return null;
    } catch (err) {
      console.error('[useNotificationSystem] configureIntelligence error:', err);
      toast.error('Error al configurar inteligencia');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    fetchTemplates();
    fetchChannels();
    autoRefreshInterval.current = setInterval(() => {
      fetchTemplates();
      fetchChannels();
    }, intervalMs);
  }, [fetchTemplates, fetchChannels]);

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
    // Estado básico
    isLoading,
    templates,
    channels,
    logs,
    error,
    lastRefresh,
    
    // Funciones básicas
    fetchTemplates,
    fetchChannels,
    sendNotification,
    createTemplate,
    fetchLogs,
    getStats,
    startAutoRefresh,
    stopAutoRefresh,
    
    // Estado inteligente
    prioritizedNotifications,
    notificationGroups,
    predictedAlerts,
    actionSuggestions,
    intelligenceStats,
    intelligenceConfig,
    isPrioritizing,
    isReducingNoise,
    isPredicting,
    
    // Funciones inteligentes
    prioritizeWithAI,
    reduceNoise,
    suggestActions,
    groupRelatedAlerts,
    getPredictiveAlerts,
    executeAutoAction,
    fetchIntelligenceStats,
    configureIntelligence,
  };
}

export default useNotificationSystem;
