import { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback } from 'react';
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

// Role priority cache (static - never changes)
const ROLE_PRIORITIES: Record<string, number> = {
  'superadmin': 100,
  'director_comercial': 90,
  'responsable_comercial': 80,
  'director_oficina': 70,
  'admin': 60,
  'auditor': 50,
  'gestor': 40,
  'user': 10,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Prevent duplicate role fetches
  const fetchingRoleRef = useRef<string | null>(null);
  const roleCache = useRef<Map<string, AppRole>>(new Map());

  const fetchUserRole = useCallback(async (userId: string) => {
    // Prevent duplicate fetches for same user
    if (fetchingRoleRef.current === userId) return;
    
    // Check cache first
    const cachedRole = roleCache.current.get(userId);
    if (cachedRole) {
      setUserRole(cachedRole);
      return;
    }
    
    fetchingRoleRef.current = userId;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      let role: AppRole = 'user';
      if (data && data.length > 0) {
        // Find highest priority role
        role = data.reduce((highest, current) => {
          return (ROLE_PRIORITIES[current.role] || 0) > (ROLE_PRIORITIES[highest] || 0)
            ? current.role as AppRole
            : highest;
        }, 'user' as AppRole);
      }
      
      roleCache.current.set(userId, role);
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    } finally {
      fetchingRoleRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialSessionChecked = false;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Skip if this is the initial session (we handle it below)
        if (event === 'INITIAL_SESSION') {
          initialSessionChecked = true;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session only if not already handled
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || initialSessionChecked) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

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
      const redirectUrl = `${window.location.origin}/`;
      
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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
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
}
