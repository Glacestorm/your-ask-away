import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
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
      console.log('🔍 Fetching role for user:', userId);
      
      // Fetch all roles for the user (they may have multiple)
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      console.log('📦 Role query result:', { data, error });
      
      if (error) throw error;
      
      // If user has multiple roles, select the highest privilege one
      let role: AppRole = 'user';
      if (data && data.length > 0) {
        const sortedRoles = data.sort((a, b) => 
          getRolePriority(b.role) - getRolePriority(a.role)
        );
        role = sortedRoles[0].role as AppRole;
      }
      
      console.log('✅ Setting user role to:', role);
      setUserRole(role);
    } catch (error) {
      console.error('❌ Error fetching user role:', error);
      setUserRole('user'); // Default fallback
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Auth hook initializing...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, 'User:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch role but don't block the auth state change
        if (session?.user) {
          console.log('👤 User logged in, fetching role...');
          // Don't use async/await in the callback
          fetchUserRole(session.user.id);
        } else {
          console.log('👋 User logged out, clearing role');
          setUserRole(null);
          setRoleLoading(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session?.user?.email);
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
  
  // Overall loading state includes both auth and role loading
  const overallLoading = loading || roleLoading;
  
  console.log('🔑 Current auth state:', { 
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
}
