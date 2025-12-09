/**
 * Embedded Source Code - Contains actual source code from the project
 * This file is auto-generated with real code from the codebase
 * Version: 8.0.0
 */

// Core Application Files
export const APP_TSX = `import { Suspense, lazy, useTransition, startTransition } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageStreamingSkeleton, StreamingBoundary } from "@/components/performance/StreamingBoundary";

// Lazy load pages with React 19 preload hints for better streaming SSR
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Preload critical routes on hover/focus for faster navigation
const preloadRoute = (importFn: () => Promise<unknown>) => {
  startTransition(() => {
    importFn();
  });
};

// Route preloaders for progressive enhancement
export const routePreloaders = {
  home: () => preloadRoute(() => import("./pages/Home")),
  dashboard: () => preloadRoute(() => import("./pages/Dashboard")),
  admin: () => preloadRoute(() => import("./pages/Admin")),
  profile: () => preloadRoute(() => import("./pages/Profile")),
};

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <PresenceProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {/* React 19 Streaming SSR with progressive Suspense boundaries */}
                <StreamingBoundary priority="high" fallback={<PageStreamingSkeleton />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/auth" element={
                      <StreamingBoundary priority="high">
                        <Auth />
                      </StreamingBoundary>
                    } />
                    <Route path="/home" element={
                      <StreamingBoundary priority="high">
                        <Home />
                      </StreamingBoundary>
                    } />
                    <Route path="/map" element={<Navigate to="/admin?section=map" replace />} />
                    <Route path="/dashboard" element={
                      <StreamingBoundary priority="medium" delay={50}>
                        <Dashboard />
                      </StreamingBoundary>
                    } />
                    <Route path="/admin" element={
                      <StreamingBoundary priority="medium" delay={50}>
                        <Admin />
                      </StreamingBoundary>
                    } />
                    <Route path="/profile" element={
                      <StreamingBoundary priority="low" delay={100}>
                        <Profile />
                      </StreamingBoundary>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </StreamingBoundary>
              </TooltipProvider>
            </PresenceProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;`;

export const MAIN_TSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App.tsx";
import "./index.css";

// Register service worker for offline support and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('SW registration failed:', error);
    });
  });
}

// Performance monitoring for Core Web Vitals
if (typeof window !== 'undefined') {
  // Report Web Vitals in development
  if (import.meta.env.DEV) {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const reportVital = (metric: { name: string; value: number; rating: string }) => {
        console.log(\`[Web Vital] \${metric.name}: \${metric.value.toFixed(2)} (\${metric.rating})\`);
      };
      onCLS(reportVital);
      onFCP(reportVital);
      onLCP(reportVital);
      onTTFB(reportVital);
      onINP(reportVital);
    }).catch(() => {});
  }

  // Long Task monitoring for INP optimization
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.debug(\`[Long Task] Duration: \${entry.duration.toFixed(2)}ms\`);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task observer not supported
    }
  }

  // Resource timing for slow resources
  if ('PerformanceObserver' in window && import.meta.env.DEV) {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          if (entry.duration > 1000) {
            console.warn(\`[Slow Resource] \${entry.name}: \${entry.duration.toFixed(0)}ms\`);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Resource observer not supported
    }
  }
}

// Preload critical data after initial render
const preloadCriticalData = () => {
  // Schedule non-critical work during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload common fonts
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = 'https://fonts.gstatic.com';
      document.head.appendChild(link);
    }, { timeout: 2000 });
  }
};

// Execute after first paint
requestAnimationFrame(() => {
  requestAnimationFrame(preloadCriticalData);
});

// Use concurrent features from React 19
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);`;

export const USE_AUTH_TSX = `import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, UserRole } from '@/types/database';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCommercialDirector: boolean;
  isOfficeDirector: boolean;
  isCommercialManager: boolean;
  isAuditor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  // Priority order for roles (highest privilege first)
  const getRolePriority = (role: string): number => {
    const priorities: Record<string, number> = {
      'superadmin': 100,
      'director_comercial': 90,
      'responsable_comercial': 80,
      'director_oficina': 70,
      'admin': 60,
      'auditor': 50,
      'gestor': 40,
      'user': 10,
    };
    return priorities[role] || 0;
  };

  const fetchUserRole = async (userId: string) => {
    try {
      setRoleLoading(true);
      console.log('Fetching role for user:', userId);
      
      // Fetch all roles for the user (they may have multiple)
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      console.log('Role query result:', { data, error });
      
      if (error) throw error;
      
      // If user has multiple roles, select the highest privilege one
      let role: AppRole = 'user';
      if (data && data.length > 0) {
        const sortedRoles = data.sort((a, b) => 
          getRolePriority(b.role) - getRolePriority(a.role)
        );
        role = sortedRoles[0].role as AppRole;
      }
      
      console.log('Setting user role to:', role);
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user'); // Default fallback
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    console.log('Auth hook initializing...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, 'User:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch role but don't block the auth state change
        if (session?.user) {
          console.log('User logged in, fetching role...');
          fetchUserRole(session.user.id);
        } else {
          console.log('User logged out, clearing role');
          setUserRole(null);
          setRoleLoading(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setRoleLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error('Error al iniciar sesión: ' + error.message);
        return { error };
      }
      
      toast.success('¡Sesión iniciada correctamente!');
      return { error: null };
    } catch (error: any) {
      toast.error('Error inesperado al iniciar sesión');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = \`\${window.location.origin}/\`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) {
        toast.error('Error al registrarse: ' + error.message);
        return { error };
      }
      
      toast.success('¡Cuenta creada! Puedes iniciar sesión ahora.');
      return { error: null };
    } catch (error: any) {
      toast.error('Error inesperado al registrarse');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      toast.success('Sesión cerrada correctamente');
    } catch (error: any) {
      toast.error('Error al cerrar sesión');
      console.error('Sign out error:', error);
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'responsable_comercial';
  const isSuperAdmin = userRole === 'superadmin';
  const isCommercialDirector = userRole === 'director_comercial' || userRole === 'superadmin' || userRole === 'responsable_comercial';
  const isOfficeDirector = userRole === 'director_oficina' || userRole === 'superadmin' || userRole === 'responsable_comercial';
  const isCommercialManager = userRole === 'responsable_comercial' || userRole === 'superadmin';
  const isAuditor = userRole === 'auditor';
  
  // Overall loading state includes both auth and role loading
  const overallLoading = loading || roleLoading;
  
  console.log('Current auth state:', { 
    userEmail: user?.email, 
    userRole, 
    isAdmin, 
    isSuperAdmin,
    isCommercialDirector,
    isOfficeDirector,
    isCommercialManager,
    isAuditor,
    loading: overallLoading,
    authLoading: loading,
    roleLoading
  });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading: overallLoading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isSuperAdmin,
      isCommercialDirector,
      isOfficeDirector,
      isCommercialManager,
      isAuditor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}`;

// All embedded source files
export const EMBEDDED_SOURCE_FILES: Record<string, { code: string; lines: number; category: string }> = {
  'src/App.tsx': { code: APP_TSX, lines: 88, category: 'Core' },
  'src/main.tsx': { code: MAIN_TSX, lines: 92, category: 'Core' },
  'src/hooks/useAuth.tsx': { code: USE_AUTH_TSX, lines: 235, category: 'Hooks' },
};

// Get total embedded lines
export const getTotalEmbeddedLines = (): number => {
  return Object.values(EMBEDDED_SOURCE_FILES).reduce((sum, file) => sum + file.lines, 0);
};
