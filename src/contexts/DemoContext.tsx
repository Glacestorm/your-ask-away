import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DemoRole = 'director_comercial' | 'gestor' | 'superadmin';

interface DemoDataStats {
  companies: number;
  contacts: number;
  visits: number;
  visitSheets: number;
  goals: number;
  notifications: number;
  financialStatements: number;
  opportunities: number;
}

interface DemoContextType {
  isDemoMode: boolean;
  isLoading: boolean;
  demoSessionId: string | null;
  demoUserId: string | null;
  demoRole: DemoRole | null;
  demoEmail: string | null;
  tourStep: number;
  tourActive: boolean;
  startedAt: Date | null;
  dataStats: DemoDataStats | null;
  startDemo: (role: DemoRole) => Promise<boolean>;
  endDemo: () => Promise<void>;
  setTourStep: (step: number) => void;
  skipTour: () => void;
  startTour: () => void;
  markSectionVisited: (section: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_SESSION_KEY = 'obelixia_demo_session';

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoSessionId, setDemoSessionId] = useState<string | null>(null);
  const [demoUserId, setDemoUserId] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);
  const [demoEmail, setDemoEmail] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [dataStats, setDataStats] = useState<DemoDataStats | null>(null);

  // Check for existing demo session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(DEMO_SESSION_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Check if session is less than 2 hours old
        const sessionAge = Date.now() - new Date(session.startedAt).getTime();
        const twoHours = 2 * 60 * 60 * 1000;
        
        if (sessionAge < twoHours) {
          setIsDemoMode(true);
          setDemoSessionId(session.sessionId);
          setDemoUserId(session.userId);
          setDemoRole(session.role);
          setDemoEmail(session.email);
          setStartedAt(new Date(session.startedAt));
          setDataStats(session.stats);
        } else {
          // Session expired, clean up
          localStorage.removeItem(DEMO_SESSION_KEY);
        }
      } catch (e) {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    }
  }, []);

  const startDemo = useCallback(async (role: DemoRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Create demo session record
      const { data: session, error: sessionError } = await supabase
        .from('demo_sessions')
        .insert({
          selected_role: role,
          ip_address: 'unknown',
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const sessionId = session.id;

      // Call Edge Function to generate demo data
      const { data, error } = await supabase.functions.invoke('generate-demo-data', {
        body: { role, sessionId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate demo data');

      const sessionData = {
        sessionId,
        userId: data.demoUserId,
        email: data.demoEmail,
        role,
        startedAt: new Date().toISOString(),
        stats: data.stats
      };

      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(sessionData));

      setDemoSessionId(sessionId);
      setDemoUserId(data.demoUserId);
      setDemoEmail(data.demoEmail);
      setDemoRole(role);
      setStartedAt(new Date());
      setDataStats(data.stats);
      setIsDemoMode(true);
      setTourActive(true);
      setTourStep(0);

      // Sign in with demo user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.demoEmail,
        password: `Demo${sessionId.slice(0, 8)}!`
      });

      if (signInError) {
        console.error('Demo sign in error:', signInError);
      }

      return true;
    } catch (error) {
      console.error('Failed to start demo:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endDemo = useCallback(async () => {
    setIsLoading(true);
    try {
      // Sign out first
      await supabase.auth.signOut();

      // Call cleanup Edge Function
      if (demoSessionId) {
        await supabase.functions.invoke('cleanup-demo-data', {
          body: { sessionId: demoSessionId }
        });
      }

      // Clear local state
      localStorage.removeItem(DEMO_SESSION_KEY);
      setIsDemoMode(false);
      setDemoSessionId(null);
      setDemoUserId(null);
      setDemoRole(null);
      setDemoEmail(null);
      setTourStep(0);
      setTourActive(false);
      setStartedAt(null);
      setDataStats(null);
    } catch (error) {
      console.error('Failed to end demo:', error);
    } finally {
      setIsLoading(false);
    }
  }, [demoSessionId]);

  const skipTour = useCallback(() => {
    setTourActive(false);
    setTourStep(0);
  }, []);

  const startTour = useCallback(() => {
    setTourActive(true);
    setTourStep(0);
  }, []);

  const markSectionVisited = useCallback(async (section: string) => {
    if (!demoSessionId) return;
    
    try {
      const { data: session } = await supabase
        .from('demo_sessions')
        .select('sections_visited')
        .eq('id', demoSessionId)
        .single();

      const visited = session?.sections_visited || [];
      if (!visited.includes(section)) {
        await supabase
          .from('demo_sessions')
          .update({ sections_visited: [...visited, section] })
          .eq('id', demoSessionId);
      }
    } catch (error) {
      console.error('Failed to mark section visited:', error);
    }
  }, [demoSessionId]);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        isLoading,
        demoSessionId,
        demoUserId,
        demoRole,
        demoEmail,
        tourStep,
        tourActive,
        startedAt,
        dataStats,
        startDemo,
        endDemo,
        setTourStep,
        skipTour,
        startTour,
        markSectionVisited
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemoContext = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};
