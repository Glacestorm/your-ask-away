/**
 * useRealTimeInsights
 * Insights en tiempo real con streaming y alertas
 * Fase 12 - Advanced AI & Automation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface RealTimeInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'milestone' | 'alert';
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: {
    type: 'revenue' | 'cost' | 'efficiency' | 'customer' | 'compliance';
    estimatedValue?: number;
    unit?: string;
  };
  source: {
    table: string;
    recordId?: string;
    trigger: string;
  };
  actions?: InsightAction[];
  expiresAt?: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface InsightAction {
  id: string;
  label: string;
  type: 'navigate' | 'execute' | 'notify' | 'escalate';
  payload: Record<string, unknown>;
  isPrimary?: boolean;
}

export interface InsightStream {
  id: string;
  name: string;
  description: string;
  filters: InsightFilter[];
  isActive: boolean;
  subscriberCount: number;
  lastInsightAt?: string;
}

export interface InsightFilter {
  field: 'type' | 'category' | 'severity' | 'impact.type';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: string | string[];
}

export interface InsightStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  unacknowledged: number;
  avgConfidence: number;
  impactSummary: {
    totalRevenue: number;
    totalCost: number;
    opportunitiesCount: number;
    risksCount: number;
  };
}

export interface InsightsContext {
  organizationId?: string;
  userId?: string;
  subscribedStreams?: string[];
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    minSeverity: 'low' | 'medium' | 'high' | 'critical';
  };
}

// === HOOK ===
export function useRealTimeInsights() {
  // Estado
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<RealTimeInsight[]>([]);
  const [streams, setStreams] = useState<InsightStream[]>([]);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<InsightsContext | null>(null);

  // Refs
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // === CONECTAR A STREAM EN TIEMPO REAL ===
  const connect = useCallback(async (insightsContext: InsightsContext) => {
    setIsLoading(true);
    setContext(insightsContext);
    setError(null);

    try {
      // Cargar insights iniciales
      const { data, error: fnError } = await supabase.functions.invoke('realtime-insights', {
        body: {
          action: 'initialize',
          context: insightsContext
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setInsights(data.insights || []);
        setStreams(data.streams || []);
        setStats(data.stats || null);
      }

      // Suscribirse a canal de tiempo real
      channelRef.current = supabase
        .channel('realtime-insights')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'realtime_insights'
          },
          (payload) => {
            const newInsight = payload.new as RealTimeInsight;
            handleNewInsight(newInsight);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'realtime_insights'
          },
          (payload) => {
            const updatedInsight = payload.new as RealTimeInsight;
            setInsights(prev => prev.map(i => 
              i.id === updatedInsight.id ? updatedInsight : i
            ));
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            scheduleReconnect(insightsContext);
          }
        });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useRealTimeInsights] connect error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === MANEJAR NUEVO INSIGHT ===
  const handleNewInsight = useCallback((insight: RealTimeInsight) => {
    setInsights(prev => [insight, ...prev].slice(0, 100)); // Mantener últimos 100

    // Actualizar stats
    setStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        total: prev.total + 1,
        byType: {
          ...prev.byType,
          [insight.type]: (prev.byType[insight.type] || 0) + 1
        },
        bySeverity: {
          ...prev.bySeverity,
          [insight.severity]: (prev.bySeverity[insight.severity] || 0) + 1
        },
        unacknowledged: prev.unacknowledged + 1
      };
    });

    // Mostrar notificación según severidad
    if (insight.severity === 'critical') {
      toast.error(insight.title, { description: insight.description });
    } else if (insight.severity === 'high') {
      toast.warning(insight.title, { description: insight.description });
    }
  }, []);

  // === RECONEXIÓN AUTOMÁTICA ===
  const scheduleReconnect = useCallback((ctx: InsightsContext) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[useRealTimeInsights] Attempting reconnection...');
      connect(ctx);
    }, 5000);
  }, [connect]);

  // === DESCONECTAR ===
  const disconnect = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // === RECONOCER INSIGHT ===
  const acknowledgeInsight = useCallback(async (insightId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('realtime-insights', {
        body: {
          action: 'acknowledge',
          insightId,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setInsights(prev => prev.map(i => 
          i.id === insightId 
            ? { ...i, acknowledged: true, acknowledgedAt: new Date().toISOString() }
            : i
        ));

        setStats(prev => prev ? { ...prev, unacknowledged: Math.max(0, prev.unacknowledged - 1) } : prev);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRealTimeInsights] acknowledgeInsight error:', err);
      return false;
    }
  }, [context]);

  // === EJECUTAR ACCIÓN DE INSIGHT ===
  const executeAction = useCallback(async (insightId: string, actionId: string): Promise<boolean> => {
    const insight = insights.find(i => i.id === insightId);
    const action = insight?.actions?.find(a => a.id === actionId);
    
    if (!action) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('realtime-insights', {
        body: {
          action: 'execute_action',
          insightId,
          actionId,
          actionPayload: action.payload,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Acción ejecutada');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRealTimeInsights] executeAction error:', err);
      toast.error('Error al ejecutar acción');
      return false;
    }
  }, [insights, context]);

  // === SUSCRIBIRSE A STREAM ===
  const subscribeToStream = useCallback(async (streamId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('realtime-insights', {
        body: {
          action: 'subscribe_stream',
          streamId,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setStreams(prev => prev.map(s => 
          s.id === streamId 
            ? { ...s, subscriberCount: s.subscriberCount + 1 }
            : s
        ));
        
        setContext(prev => prev 
          ? { ...prev, subscribedStreams: [...(prev.subscribedStreams || []), streamId] }
          : prev
        );
        
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRealTimeInsights] subscribeToStream error:', err);
      return false;
    }
  }, [context]);

  // === DESUSCRIBIRSE DE STREAM ===
  const unsubscribeFromStream = useCallback(async (streamId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('realtime-insights', {
        body: {
          action: 'unsubscribe_stream',
          streamId,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setStreams(prev => prev.map(s => 
          s.id === streamId 
            ? { ...s, subscriberCount: Math.max(0, s.subscriberCount - 1) }
            : s
        ));
        
        setContext(prev => prev 
          ? { ...prev, subscribedStreams: prev.subscribedStreams?.filter(id => id !== streamId) }
          : prev
        );
        
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useRealTimeInsights] unsubscribeFromStream error:', err);
      return false;
    }
  }, [context]);

  // === LIMPIAR INSIGHTS ===
  const clearInsights = useCallback((type?: RealTimeInsight['type']) => {
    if (type) {
      setInsights(prev => prev.filter(i => i.type !== type));
    } else {
      setInsights([]);
    }
  }, []);

  // === FILTRAR INSIGHTS ===
  const getFilteredInsights = useCallback((filters: Partial<Pick<RealTimeInsight, 'type' | 'severity' | 'acknowledged'>>) => {
    return insights.filter(insight => {
      if (filters.type && insight.type !== filters.type) return false;
      if (filters.severity && insight.severity !== filters.severity) return false;
      if (filters.acknowledged !== undefined && insight.acknowledged !== filters.acknowledged) return false;
      return true;
    });
  }, [insights]);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // === RETURN ===
  return {
    // Estado
    isConnected,
    isLoading,
    insights,
    streams,
    stats,
    error,
    context,
    // Acciones
    connect,
    disconnect,
    acknowledgeInsight,
    executeAction,
    subscribeToStream,
    unsubscribeFromStream,
    clearInsights,
    getFilteredInsights
  };
}

export default useRealTimeInsights;
