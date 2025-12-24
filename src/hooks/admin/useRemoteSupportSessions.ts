/**
 * Hook for managing remote support sessions
 * Handles session creation, updates, and history
 * 
 * KB 2.0 Pattern
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, parseError, collectTelemetry } from '@/hooks/core/useKBBase';

// Re-export for backwards compat
export type SessionError = KBError;

// === TYPES ===
export interface RemoteSupportSession {
  id: string;
  session_code: string;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  support_type: string;
  client_name?: string;
  client_email?: string;
  installation_id?: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  resolution?: string;
  resolution_notes?: string;
  actions_count: number;
  high_risk_actions_count: number;
  performed_by?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionParams {
  sessionCode: string;
  clientName?: string;
  clientEmail?: string;
  installationId?: string;
  supportType?: string;
}

export interface EndSessionParams {
  resolution: 'completed' | 'cancelled' | 'transferred';
  resolutionNotes?: string;
  actionsCount?: number;
  highRiskActionsCount?: number;
}

export function useRemoteSupportSessions() {
  const [sessions, setSessions] = useState<RemoteSupportSession[]>([]);
  const [activeSession, setActiveSession] = useState<RemoteSupportSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Auto-refresh refs (realtime replaces this but kept for consistency)
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { user } = useAuth();

  // Fetch all sessions for the current user
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatus('loading');
    const startTime = Date.now();
    
    try {
      const { data, error: fetchError } = await supabase
        .from('remote_support_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      setSessions(data as RemoteSupportSession[]);
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useRemoteSupportSessions', 'fetchSessions', 'success', Date.now() - startTime);
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('FETCH_ERROR', parsedErr.message, { originalError: err });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useRemoteSupportSessions', 'fetchSessions', 'error', Date.now() - startTime, kbError);
      console.error('Error fetching sessions:', err);
      toast.error('Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchSessions();
    autoRefreshInterval.current = setInterval(() => {
      fetchSessions();
    }, intervalMs);
  }, [fetchSessions]);

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

  // Fetch today's sessions statistics
  const getTodayStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(s => 
      new Date(s.started_at) >= today
    );
    
    const completedToday = todaySessions.filter(s => s.status === 'completed');
    const totalDuration = completedToday.reduce((sum, s) => sum + (s.duration_ms || 0), 0);
    const avgDuration = completedToday.length > 0 ? totalDuration / completedToday.length : 0;
    
    return {
      sessionsToday: todaySessions.length,
      completedToday: completedToday.length,
      avgDurationMs: avgDuration,
      avgDurationFormatted: formatDuration(avgDuration),
      resolutionRate: todaySessions.length > 0 
        ? Math.round((completedToday.length / todaySessions.length) * 100) 
        : 0,
    };
  }, [sessions]);

  // Create a new session
  const createSession = useCallback(async (params: CreateSessionParams): Promise<RemoteSupportSession | null> => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para crear una sesión');
      return null;
    }

    setIsCreating(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      const insertData = {
        session_code: params.sessionCode,
        client_name: params.clientName || null,
        client_email: params.clientEmail || null,
        installation_id: params.installationId || null,
        support_type: params.supportType || 'remote',
        status: 'active',
        performed_by: user.id,
        metadata: {},
      };

      const { data, error: insertError } = await supabase
        .from('remote_support_sessions')
        .insert([insertData] as any)
        .select()
        .single();

      if (insertError) throw insertError;

      const newSession = data as RemoteSupportSession;
      setActiveSession(newSession);
      setSessions(prev => [newSession, ...prev]);
      
      collectTelemetry('useRemoteSupportSessions', 'createSession', 'success', Date.now() - startTime);
      toast.success('Sesión de soporte iniciada');
      return newSession;
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('CREATE_ERROR', parsedErr.message, { originalError: err });
      setError(kbError);
      collectTelemetry('useRemoteSupportSessions', 'createSession', 'error', Date.now() - startTime, kbError);
      console.error('Error creating session:', err);
      toast.error('Error al crear sesión');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user?.id]);

  // End an active session
  const endSession = useCallback(async (
    sessionId: string, 
    params: EndSessionParams
  ): Promise<boolean> => {
    setError(null);
    const startTime = Date.now();
    
    try {
      const startedAt = activeSession?.started_at || sessions.find(s => s.id === sessionId)?.started_at;
      const durationMs = startedAt ? Date.now() - new Date(startedAt).getTime() : 0;

      const updateData = {
        status: params.resolution === 'cancelled' ? 'cancelled' : 'completed',
        ended_at: new Date().toISOString(),
        duration_ms: durationMs,
        resolution: params.resolution,
        resolution_notes: params.resolutionNotes || null,
        actions_count: params.actionsCount || 0,
        high_risk_actions_count: params.highRiskActionsCount || 0,
      };

      const { error: updateError } = await supabase
        .from('remote_support_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setActiveSession(null);
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, ...updateData } as RemoteSupportSession
          : s
      ));

      collectTelemetry('useRemoteSupportSessions', 'endSession', 'success', Date.now() - startTime);
      toast.success('Sesión finalizada correctamente');
      return true;
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('END_SESSION_ERROR', parsedErr.message, { details: { sessionId } });
      setError(kbError);
      collectTelemetry('useRemoteSupportSessions', 'endSession', 'error', Date.now() - startTime, kbError);
      console.error('Error ending session:', err);
      toast.error('Error al finalizar sesión');
      return false;
    }
  }, [activeSession, sessions]);

  // Pause a session
  const pauseSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('remote_support_sessions')
        .update({ status: 'paused' })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'paused' as const } : s
      ));
      
      if (activeSession?.id === sessionId) {
        setActiveSession(prev => prev ? { ...prev, status: 'paused' } : null);
      }

      toast.info('Sesión pausada');
      return true;
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('PAUSE_ERROR', parsedErr.message, { details: { sessionId } });
      setError(kbError);
      console.error('Error pausing session:', err);
      toast.error('Error al pausar sesión');
      return false;
    }
  }, [activeSession]);

  // Resume a paused session
  const resumeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('remote_support_sessions')
        .update({ status: 'active' })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        const updatedSession = { ...session, status: 'active' as const };
        setActiveSession(updatedSession);
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? updatedSession : s
        ));
      }

      toast.success('Sesión reanudada');
      return true;
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('RESUME_ERROR', parsedErr.message, { details: { sessionId } });
      setError(kbError);
      console.error('Error resuming session:', err);
      toast.error('Error al reanudar sesión');
      return false;
    }
  }, [sessions]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('remote-support-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'remote_support_sessions'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as RemoteSupportSession;
            setSessions(prev => {
              if (prev.some(s => s.id === newSession.id)) return prev;
              return [newSession, ...prev];
            });
            setLastRefresh(new Date());
          } else if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as RemoteSupportSession;
            setSessions(prev => prev.map(s => 
              s.id === updatedSession.id ? updatedSession : s
            ));
            if (activeSession?.id === updatedSession.id) {
              setActiveSession(updatedSession);
            }
            setLastRefresh(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession]);

  return {
    // State
    sessions,
    activeSession,
    loading,
    isCreating,
    error,
    lastRefresh,
    // Actions
    fetchSessions,
    createSession,
    endSession,
    pauseSession,
    resumeSession,
    getTodayStats,
    clearError,
    startAutoRefresh,
    stopAutoRefresh,
    // === KB 2.0 STATE ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    lastSuccess,
    retryCount,
    reset,
  };
}

// Helper function to format duration
function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return '--';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
