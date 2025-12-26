/**
 * useSupportMetricsDashboard - Enterprise Metrics Dashboard Hook
 * Real-time support metrics with AI-powered insights
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface SupportMetrics {
  // Real-time KPIs
  activeSessions: number;
  totalSessionsToday: number;
  avgSessionDuration: number;
  resolutionRate: number;
  
  // Agent metrics
  activeAgents: number;
  avgAgentLoad: number;
  topPerformingAgents: AgentPerformance[];
  
  // AI metrics
  aiActionsToday: number;
  aiSuccessRate: number;
  avgAIConfidence: number;
  automationRate: number;
  
  // Risk & Compliance
  highRiskActionsToday: number;
  pendingApprovals: number;
  complianceScore: number;
  
  // Trends
  sessionsTrend: TrendData[];
  resolutionTrend: TrendData[];
  
  // Predictions
  predictedLoad: number;
  peakHours: string[];
  recommendedStaffing: number;
}

export interface AgentPerformance {
  id: string;
  name: string;
  sessionsToday: number;
  avgDuration: number;
  resolutionRate: number;
  aiUsageRate: number;
  score: number;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface RealTimeEvent {
  id: string;
  type: 'session_start' | 'session_end' | 'ai_action' | 'high_risk' | 'approval_pending';
  timestamp: string;
  data: Record<string, unknown>;
}

export interface DashboardFilters {
  dateRange: '24h' | '7d' | '30d' | '90d';
  agentId?: string;
  sessionStatus?: 'active' | 'completed' | 'cancelled' | 'all';
}

// === HOOK ===
export function useSupportMetricsDashboard(initialFilters?: Partial<DashboardFilters>) {
  // State
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [realtimeEvents, setRealtimeEvents] = useState<RealTimeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: '24h',
    sessionStatus: 'all',
    ...initialFilters
  });
  
  // Refs
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH METRICS ===
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate date range
      let startDate = startOfToday;
      switch (filters.dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      // Parallel queries
      const [
        sessionsResult,
        actionsResult,
        agentActionsResult,
        profilesResult
      ] = await Promise.all([
        supabase
          .from('remote_support_sessions')
          .select('*')
          .gte('started_at', startDate.toISOString()),
        supabase
          .from('session_actions')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('ai_agent_actions')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('profiles')
          .select('id, full_name, email')
      ]);

      const sessions = sessionsResult.data || [];
      const actions = actionsResult.data || [];
      const aiActions = agentActionsResult.data || [];
      const profiles = profilesResult.data || [];

      // Calculate metrics
      const activeSessions = sessions.filter(s => s.status === 'active').length;
      const todaySessions = sessions.filter(s => 
        new Date(s.started_at) >= startOfToday
      );
      const completedSessions = sessions.filter(s => s.status === 'completed');
      
      const avgDuration = completedSessions.length > 0
        ? completedSessions
            .filter(s => s.duration_ms)
            .reduce((sum, s) => sum + (s.duration_ms || 0), 0) / completedSessions.length
        : 0;

      const resolutionRate = sessions.length > 0
        ? Math.round((completedSessions.length / sessions.length) * 100)
        : 0;

      // AI metrics
      const successfulAIActions = aiActions.filter(a => a.status === 'executed' || a.status === 'completed');
      const aiSuccessRate = aiActions.length > 0
        ? Math.round((successfulAIActions.length / aiActions.length) * 100)
        : 0;

      const avgAIConfidence = aiActions.length > 0
        ? Math.round(
            aiActions
              .filter(a => a.confidence_score)
              .reduce((sum, a) => sum + (a.confidence_score || 0), 0) / aiActions.length * 100
          )
        : 0;

      // Risk metrics
      const highRiskActions = actions.filter(a => 
        a.risk_level === 'high' || a.risk_level === 'critical'
      );
      const pendingApprovals = actions.filter(a => 
        a.requires_approval === true && !a.approved_at
      ).length;

      // Agent performance
      const agentMap = new Map<string, { sessions: any[]; actions: any[] }>();
      sessions.forEach(session => {
        const agentId = session.performed_by;
        if (!agentId) return;
        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, { sessions: [], actions: [] });
        }
        agentMap.get(agentId)!.sessions.push(session);
      });

      const topPerformingAgents: AgentPerformance[] = Array.from(agentMap.entries())
        .map(([agentId, data]) => {
          const profile = profiles.find(p => p.id === agentId);
          const completed = data.sessions.filter(s => s.status === 'completed');
          const durations = completed.filter(s => s.duration_ms).map(s => s.duration_ms);
          
          return {
            id: agentId,
            name: profile?.full_name || 'Unknown',
            sessionsToday: data.sessions.filter(s => new Date(s.started_at) >= startOfToday).length,
            avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
            resolutionRate: data.sessions.length > 0 
              ? Math.round((completed.length / data.sessions.length) * 100) 
              : 0,
            aiUsageRate: 75, // Placeholder - would need to calculate from AI actions
            score: 0 // Will be calculated below
          };
        })
        .map(agent => ({
          ...agent,
          score: Math.round((agent.resolutionRate * 0.4) + (agent.aiUsageRate * 0.3) + Math.min(100, agent.sessionsToday * 10) * 0.3)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Calculate trends
      const sessionsTrend = calculateTrend(sessions, 'started_at', filters.dateRange);
      const resolutionTrend = calculateResolutionTrend(sessions, filters.dateRange);

      // Predictions
      const predictedLoad = predictLoad(sessions);
      const peakHours = findPeakHours(sessions);

      const calculatedMetrics: SupportMetrics = {
        activeSessions,
        totalSessionsToday: todaySessions.length,
        avgSessionDuration: avgDuration,
        resolutionRate,
        activeAgents: agentMap.size,
        avgAgentLoad: agentMap.size > 0 ? Math.round(activeSessions / agentMap.size * 10) / 10 : 0,
        topPerformingAgents,
        aiActionsToday: aiActions.filter(a => new Date(a.created_at) >= startOfToday).length,
        aiSuccessRate,
        avgAIConfidence,
        automationRate: actions.length > 0 
          ? Math.round((aiActions.length / actions.length) * 100) 
          : 0,
        highRiskActionsToday: highRiskActions.filter(a => new Date(a.created_at) >= startOfToday).length,
        pendingApprovals,
        complianceScore: 95, // Placeholder - would calculate from audit logs
        sessionsTrend,
        resolutionTrend,
        predictedLoad,
        peakHours,
        recommendedStaffing: Math.ceil(predictedLoad / 5)
      };

      setMetrics(calculatedMetrics);
      setLastRefresh(new Date());
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching metrics';
      setError(message);
      console.error('[useSupportMetricsDashboard] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // === REALTIME SUBSCRIPTION ===
  const subscribeToRealtime = useCallback(() => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }

    realtimeChannel.current = supabase
      .channel('support-metrics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'remote_support_sessions' },
        (payload) => {
          const eventType = payload.eventType === 'INSERT' 
            ? 'session_start' 
            : payload.eventType === 'UPDATE' && payload.new.status === 'completed'
              ? 'session_end'
              : null;
          
          if (eventType) {
            const event: RealTimeEvent = {
              id: crypto.randomUUID(),
              type: eventType,
              timestamp: new Date().toISOString(),
              data: payload.new as Record<string, unknown>
            };
            setRealtimeEvents(prev => [event, ...prev].slice(0, 50));
            
            // Trigger metrics refresh
            fetchMetrics();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_actions' },
        (payload) => {
          const action = payload.new as Record<string, unknown>;
          
          if (action.risk_level === 'high' || action.risk_level === 'critical') {
            const event: RealTimeEvent = {
              id: crypto.randomUUID(),
              type: 'high_risk',
              timestamp: new Date().toISOString(),
              data: action
            };
            setRealtimeEvents(prev => [event, ...prev].slice(0, 50));
            toast.warning('Acción de alto riesgo detectada');
          }
        }
      )
      .subscribe();
  }, [fetchMetrics]);

  // === AUTO REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    stopAutoRefresh();
    autoRefreshInterval.current = setInterval(fetchMetrics, intervalMs);
  }, [fetchMetrics]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === FILTER UPDATES ===
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // === LIFECYCLE ===
  useEffect(() => {
    fetchMetrics();
    subscribeToRealtime();
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [fetchMetrics, subscribeToRealtime, startAutoRefresh, stopAutoRefresh]);

  // Refetch when filters change
  useEffect(() => {
    fetchMetrics();
  }, [filters, fetchMetrics]);

  // === COMPUTED ===
  const healthScore = useMemo(() => {
    if (!metrics) return 0;
    return Math.round(
      (metrics.resolutionRate * 0.3) +
      (metrics.aiSuccessRate * 0.2) +
      (metrics.complianceScore * 0.3) +
      ((100 - Math.min(100, metrics.pendingApprovals * 5)) * 0.2)
    );
  }, [metrics]);

  const alerts = useMemo(() => {
    if (!metrics) return [];
    const result: { type: 'warning' | 'error' | 'info'; message: string }[] = [];
    
    if (metrics.pendingApprovals > 5) {
      result.push({ type: 'warning', message: `${metrics.pendingApprovals} aprobaciones pendientes` });
    }
    if (metrics.resolutionRate < 70) {
      result.push({ type: 'error', message: 'Tasa de resolución por debajo del objetivo' });
    }
    if (metrics.activeSessions > metrics.activeAgents * 3) {
      result.push({ type: 'warning', message: 'Alta carga por agente detectada' });
    }
    if (metrics.highRiskActionsToday > 10) {
      result.push({ type: 'warning', message: 'Muchas acciones de alto riesgo hoy' });
    }
    
    return result;
  }, [metrics]);

  return {
    // State
    metrics,
    realtimeEvents,
    isLoading,
    error,
    lastRefresh,
    filters,
    
    // Actions
    fetchMetrics,
    updateFilters,
    startAutoRefresh,
    stopAutoRefresh,
    
    // Computed
    healthScore,
    alerts,
  };
}

// === HELPER FUNCTIONS ===
function calculateTrend(data: any[], dateField: string, range: string): TrendData[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  
  // Create empty buckets
  const numBuckets = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 12;
  for (let i = numBuckets - 1; i >= 0; i--) {
    const date = range === '24h'
      ? new Date(now.getTime() - i * 60 * 60 * 1000)
      : new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    const key = range === '24h'
      ? date.toISOString().slice(0, 13)
      : date.toISOString().slice(0, 10);
    
    buckets.set(key, 0);
  }

  // Fill buckets
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const key = range === '24h'
      ? date.toISOString().slice(0, 13)
      : date.toISOString().slice(0, 10);
    
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  });

  return Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    value,
    label: range === '24h' ? date.slice(11) + ':00' : date.slice(5)
  }));
}

function calculateResolutionTrend(sessions: any[], range: string): TrendData[] {
  const buckets = new Map<string, { completed: number; total: number }>();
  const now = new Date();
  
  const numBuckets = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 12;
  for (let i = numBuckets - 1; i >= 0; i--) {
    const date = range === '24h'
      ? new Date(now.getTime() - i * 60 * 60 * 1000)
      : new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    const key = range === '24h'
      ? date.toISOString().slice(0, 13)
      : date.toISOString().slice(0, 10);
    
    buckets.set(key, { completed: 0, total: 0 });
  }

  sessions.forEach(session => {
    const date = new Date(session.started_at);
    const key = range === '24h'
      ? date.toISOString().slice(0, 13)
      : date.toISOString().slice(0, 10);
    
    if (buckets.has(key)) {
      const bucket = buckets.get(key)!;
      bucket.total++;
      if (session.status === 'completed') bucket.completed++;
    }
  });

  return Array.from(buckets.entries()).map(([date, data]) => ({
    date,
    value: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    label: range === '24h' ? date.slice(11) + ':00' : date.slice(5)
  }));
}

function predictLoad(sessions: any[]): number {
  const today = new Date().getDay();
  const sameDaySessions = sessions.filter(s => 
    new Date(s.started_at).getDay() === today
  );
  return Math.round(sameDaySessions.length / 4); // Assuming 4 weeks of data
}

function findPeakHours(sessions: any[]): string[] {
  const hourCounts = new Array(24).fill(0);
  
  sessions.forEach(session => {
    const hour = new Date(session.started_at).getHours();
    hourCounts[hour]++;
  });

  const sorted = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter(h => h.count > 0);

  return sorted.map(h => `${h.hour.toString().padStart(2, '0')}:00`);
}

export default useSupportMetricsDashboard;
