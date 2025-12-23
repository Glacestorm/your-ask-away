import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format, startOfWeek, startOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// === INTERFACES ===
export interface SupportAnalyticsError {
  code: string;
  message: string;
  details?: string;
}

export interface DailySessionStats {
  date: string;
  sessions: number;
  avgDuration: number;
  completedRate: number;
}

export interface ActionTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface TechnicianStats {
  id: string;
  name: string;
  email: string;
  totalSessions: number;
  avgDuration: number;
  completionRate: number;
  highRiskActions: number;
  efficiencyScore: number;
}

export interface RiskDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface SupportAnalytics {
  // Overview
  totalSessions: number;
  totalActions: number;
  avgSessionDuration: number;
  overallCompletionRate: number;
  
  // Trends
  dailyStats: DailySessionStats[];
  weeklyComparison: { current: number; previous: number; change: number };
  
  // Distributions
  actionTypeDistribution: ActionTypeDistribution[];
  riskDistribution: RiskDistribution[];
  
  // Technician leaderboard
  technicianStats: TechnicianStats[];
  
  // Predictions
  predictedLoadToday: number;
  peakHours: string[];
  
  // Time-based
  hourlyDistribution: { hour: number; sessions: number }[];
}

// === HOOK ===
export function useSupportAnalytics(daysRange: number = 30) {
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SupportAnalyticsError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = subDays(new Date(), daysRange);
      const endDate = new Date();

      // Fetch sessions in parallel
      const [sessionsResult, actionsResult, profilesResult] = await Promise.all([
        supabase
          .from('remote_support_sessions')
          .select('*')
          .gte('started_at', startDate.toISOString())
          .order('started_at', { ascending: false }),
        supabase
          .from('session_actions')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (actionsResult.error) throw actionsResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const sessions = sessionsResult.data || [];
      const actions = actionsResult.data || [];
      const profiles = profilesResult.data || [];

      // Calculate overview stats
      const totalSessions = sessions.length;
      const totalActions = actions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const overallCompletionRate = totalSessions > 0 
        ? Math.round((completedSessions.length / totalSessions) * 100) 
        : 0;

      // Calculate average session duration
      const durationsMs = completedSessions
        .filter(s => s.duration_ms)
        .map(s => s.duration_ms as number);
      const avgSessionDuration = durationsMs.length > 0
        ? durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length
        : 0;

      // Daily stats
      const dailyStats = calculateDailyStats(sessions, startDate, endDate);

      // Weekly comparison
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const previousWeekStart = subDays(currentWeekStart, 7);
      const currentWeekSessions = sessions.filter(s => 
        new Date(s.started_at) >= currentWeekStart
      ).length;
      const previousWeekSessions = sessions.filter(s => 
        new Date(s.started_at) >= previousWeekStart && 
        new Date(s.started_at) < currentWeekStart
      ).length;
      const weeklyChange = previousWeekSessions > 0 
        ? Math.round(((currentWeekSessions - previousWeekSessions) / previousWeekSessions) * 100)
        : 0;

      // Action type distribution
      const actionTypeDistribution = calculateActionTypeDistribution(actions);

      // Risk distribution
      const riskDistribution = calculateRiskDistribution(actions);

      // Technician stats
      const technicianStats = calculateTechnicianStats(sessions, actions, profiles);

      // Hourly distribution for predictions
      const hourlyDistribution = calculateHourlyDistribution(sessions);

      // Predict today's load based on day of week patterns
      const predictedLoadToday = predictTodayLoad(sessions);

      // Find peak hours
      const peakHours = findPeakHours(hourlyDistribution);

      setAnalytics({
        totalSessions,
        totalActions,
        avgSessionDuration,
        overallCompletionRate,
        dailyStats,
        weeklyComparison: {
          current: currentWeekSessions,
          previous: previousWeekSessions,
          change: weeklyChange
        },
        actionTypeDistribution,
        riskDistribution,
        technicianStats,
        predictedLoadToday,
        peakHours,
        hourlyDistribution
      });

      setLastRefresh(new Date());

    } catch (err) {
      console.error('Error fetching analytics:', err);
      const message = err instanceof Error ? err.message : 'Error fetching analytics';
      setError({ code: 'FETCH_ERROR', message });
    } finally {
      setLoading(false);
    }
  }, [daysRange]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 120000) => {
    stopAutoRefresh();
    fetchAnalytics();
    autoRefreshInterval.current = setInterval(() => {
      fetchAnalytics();
    }, intervalMs);
  }, [fetchAnalytics]);

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

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { 
    analytics, 
    loading, 
    error, 
    lastRefresh,
    refetch: fetchAnalytics,
    startAutoRefresh,
    stopAutoRefresh
  };
}

function calculateDailyStats(sessions: any[], startDate: Date, endDate: Date): DailySessionStats[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const daySessions = sessions.filter(s => 
      format(parseISO(s.started_at), 'yyyy-MM-dd') === dayStr
    );
    
    const completedCount = daySessions.filter(s => s.status === 'completed').length;
    const durations = daySessions
      .filter(s => s.duration_ms)
      .map(s => s.duration_ms as number);
    
    return {
      date: dayStr,
      sessions: daySessions.length,
      avgDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      completedRate: daySessions.length > 0 
        ? Math.round((completedCount / daySessions.length) * 100) 
        : 0
    };
  });
}

function calculateActionTypeDistribution(actions: any[]): ActionTypeDistribution[] {
  const typeCounts: Record<string, number> = {};
  
  actions.forEach(action => {
    const type = action.action_type || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  const total = actions.length;
  
  return Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

function calculateRiskDistribution(actions: any[]): RiskDistribution[] {
  const riskCounts: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  
  actions.forEach(action => {
    const level = action.risk_level || 'low';
    riskCounts[level] = (riskCounts[level] || 0) + 1;
  });
  
  const total = actions.length;
  
  return Object.entries(riskCounts)
    .map(([level, count]) => ({
      level,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
}

function calculateTechnicianStats(
  sessions: any[], 
  actions: any[], 
  profiles: any[]
): TechnicianStats[] {
  const techMap = new Map<string, {
    sessions: any[];
    actions: any[];
  }>();
  
  // Group sessions by technician
  sessions.forEach(session => {
    const techId = session.technician_id;
    if (!techId) return;
    
    if (!techMap.has(techId)) {
      techMap.set(techId, { sessions: [], actions: [] });
    }
    techMap.get(techId)!.sessions.push(session);
  });
  
  // Group actions by session's technician
  actions.forEach(action => {
    const session = sessions.find(s => s.id === action.session_id);
    if (!session?.technician_id) return;
    
    techMap.get(session.technician_id)?.actions.push(action);
  });
  
  // Calculate stats for each technician
  return Array.from(techMap.entries()).map(([techId, data]) => {
    const profile = profiles.find(p => p.id === techId);
    const completedSessions = data.sessions.filter(s => s.status === 'completed');
    const durations = completedSessions
      .filter(s => s.duration_ms)
      .map(s => s.duration_ms as number);
    
    const highRiskActions = data.actions.filter(
      a => a.risk_level === 'high' || a.risk_level === 'critical'
    ).length;
    
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    
    const completionRate = data.sessions.length > 0
      ? Math.round((completedSessions.length / data.sessions.length) * 100)
      : 0;
    
    // Efficiency score: higher completion rate + lower avg duration + fewer high risk = better
    const efficiencyScore = Math.round(
      (completionRate * 0.4) +
      (avgDuration > 0 ? Math.max(0, 100 - (avgDuration / 60000)) * 0.3 : 50) +
      (data.actions.length > 0 
        ? (1 - (highRiskActions / data.actions.length)) * 100 * 0.3 
        : 50)
    );
    
    return {
      id: techId,
      name: profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sin nombre'
        : 'Desconocido',
      email: profile?.email || '',
      totalSessions: data.sessions.length,
      avgDuration,
      completionRate,
      highRiskActions,
      efficiencyScore: Math.min(100, Math.max(0, efficiencyScore))
    };
  }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
}

function calculateHourlyDistribution(sessions: any[]): { hour: number; sessions: number }[] {
  const hourCounts: number[] = new Array(24).fill(0);
  
  sessions.forEach(session => {
    const hour = new Date(session.started_at).getHours();
    hourCounts[hour]++;
  });
  
  return hourCounts.map((sessions, hour) => ({ hour, sessions }));
}

function predictTodayLoad(sessions: any[]): number {
  const today = new Date().getDay(); // 0 = Sunday
  
  // Get sessions from same day of week in last 4 weeks
  const sameDaySessions = sessions.filter(s => {
    const sessionDay = new Date(s.started_at).getDay();
    return sessionDay === today;
  });
  
  // Average of same-day sessions
  const weeksCount = 4;
  return Math.round(sameDaySessions.length / weeksCount);
}

function findPeakHours(hourlyDistribution: { hour: number; sessions: number }[]): string[] {
  const sorted = [...hourlyDistribution].sort((a, b) => b.sessions - a.sessions);
  const topHours = sorted.slice(0, 3).filter(h => h.sessions > 0);
  
  return topHours.map(h => `${h.hour.toString().padStart(2, '0')}:00`);
}

// Utility function to format duration
export function formatDurationMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}
