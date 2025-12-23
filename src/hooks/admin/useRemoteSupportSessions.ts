/**
 * Hook for managing remote support sessions
 * Handles session creation, updates, and history
 * 
 * KB Pattern: lastRefresh, typed errors (realtime replaces auto-refresh)
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

// KB Pattern: Typed error interface
export interface SessionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function useRemoteSupportSessions() {
  const [sessions, setSessions] = useState<RemoteSupportSession[]>([]);
  const [activeSession, setActiveSession] = useState<RemoteSupportSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // KB Pattern: lastRefresh state
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // KB Pattern: Typed error state
  const [error, setError] = useState<SessionError | null>(null);
  
  const { user } = useAuth();

  // Fetch all sessions for the current user
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('remote_support_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      setSessions(data as RemoteSupportSession[]);
      setLastRefresh(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error fetching sessions:', err);
      setError({ code: 'FETCH_ERROR', message });
      toast.error('Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, []);

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
      
      toast.success('Sesión de soporte iniciada');
      return newSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error creating session:', err);
      setError({ code: 'CREATE_ERROR', message });
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

      toast.success('Sesión finalizada correctamente');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error ending session:', err);
      setError({ code: 'END_SESSION_ERROR', message, details: { sessionId } });
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
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error pausing session:', err);
      setError({ code: 'PAUSE_ERROR', message, details: { sessionId } });
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
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error resuming session:', err);
      setError({ code: 'RESUME_ERROR', message, details: { sessionId } });
      toast.error('Error al reanudar sesión');
      return false;
    }
  }, [sessions]);

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Subscribe to realtime updates (KB: realtime replaces auto-refresh for this hook)
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
