import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { 
  TrendingUp, 
  Building2, 
  Briefcase, 
  Users, 
  UserCog, 
  Map, 
  CalendarDays,
  BarChart3,
  Package,
  Activity,
  LogOut,
  ArrowRight,
  Calculator,
  Settings
} from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeSelector } from '@/components/ThemeSelector';
import { toast } from 'sonner';

interface MenuOption {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
}

// Feature menu options (excluding role-based dashboards)
const featureMenuOptions: MenuOption[] = [
  {
    title: 'Mapa',
    description: 'Visualització geogràfica d\'empreses',
    icon: Map,
    path: '/admin?section=map',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Comptabilitat',
    description: 'Gestió comptable i estats financers',
    icon: Calculator,
    path: '/admin?section=accounting&view=menu',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Calendari de Visites',
    description: 'Calendari compartit de visites',
    icon: CalendarDays,
    path: '/admin?section=shared-calendar',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Mètriques i Anàlisi',
    description: 'Anàlisi detallat de mètriques',
    icon: BarChart3,
    path: '/admin?section=visits',
    roles: ['superadmin', 'admin', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Gestió de Dades',
    description: 'Administració d\'empreses i productes',
    icon: Package,
    path: '/admin?section=companies',
    roles: ['superadmin', 'admin', 'responsable_comercial']
  },
  {
    title: 'Configuració',
    description: 'Configuració del sistema',
    icon: Activity,
    path: '/admin?section=colors',
    roles: ['superadmin', 'admin', 'responsable_comercial']
  },
];

// Role configurations with their dashboard paths
const roleConfig: Record<string, { title: string; icon: React.ElementType; path: string; color: string }> = {
  superadmin: {
    title: 'Superadministrador',
    icon: Settings,
    path: '/admin?section=director',
    color: 'bg-purple-500'
  },
  director_comercial: {
    title: 'Director de Negoci',
    icon: TrendingUp,
    path: '/admin?section=director',
    color: 'bg-emerald-500'
  },
  director_oficina: {
    title: 'Director d\'Oficina',
    icon: Building2,
    path: '/admin?section=office-director',
    color: 'bg-emerald-500'
  },
  responsable_comercial: {
    title: 'Responsable Comercial',
    icon: Briefcase,
    path: '/admin?section=commercial-manager',
    color: 'bg-emerald-500'
  },
  admin: {
    title: 'Administrador',
    icon: Settings,
    path: '/admin?section=director',
    color: 'bg-blue-500'
  },
  user: {
    title: 'Gestor',
    icon: Users,
    path: '/admin?section=gestor-dashboard',
    color: 'bg-emerald-500'
  },
  auditor: {
    title: 'Auditor',
    icon: UserCog,
    path: '/admin?section=audit',
    color: 'bg-amber-500'
  }
};

// Roles that can access Admin panel
const adminAccessRoles = ['superadmin', 'director_comercial', 'responsable_comercial'];

type AppRole = Database['public']['Enums']['app_role'];

const Home = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [allUserRoles, setAllUserRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch all roles for the current user
  useEffect(() => {
    const fetchAllRoles = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setAllUserRoles(data.map(r => r.role));
      }
    };
    
    fetchAllRoles();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al tancar la sessió');
    } else {
      navigate('/auth');
    }
  };

  const getAvailableFeatures = () => {
    const effectiveRole = userRole || 'user';
    return featureMenuOptions.filter(option => 
      option.roles.includes(effectiveRole)
    );
  };

  const getCurrentRoleConfig = () => {
    const effectiveRole = userRole || 'user';
    return roleConfig[effectiveRole] || roleConfig.user;
  };

  const canAccessAdmin = () => {
    const effectiveRole = userRole || 'user';
    return adminAccessRoles.includes(effectiveRole);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const availableFeatures = getAvailableFeatures();
  const currentRole = getCurrentRoleConfig();
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Benvingut/da - Panell de Control
              </h1>
              <p className="text-xs text-muted-foreground">
                Selecciona una opció per accedir a les funcionalitats
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canAccessAdmin() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              )}
              <ThemeSelector />
              <LanguageSelector />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Tancar sessió
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 flex-1">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Role Dashboard Card - Direct access to role-specific dashboard */}
          <Card
            className="group relative overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card via-card to-primary/5"
            onClick={() => navigate(currentRole.path)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${currentRole.color} text-white shadow-lg`}>
                    <RoleIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      El Meu Tauler
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Accedeix al teu tauler personalitzat
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableFeatures.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => navigate(option.path)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="mt-4 text-xl group-hover:text-primary transition-colors">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-16 pt-8 border-t">
            <h3 className="text-xl font-semibold mb-6">Accions Ràpides</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Tauler General
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                El Meu Perfil
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with All Role Badges - Centered */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium">Els meus rols:</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {allUserRoles.map((role) => {
                  const config = roleConfig[role] || roleConfig.user;
                  const Icon = config.icon;
                  return (
                    <div key={role} className="flex items-center gap-2 bg-card/80 px-3 py-2 rounded-lg border shadow-sm">
                      <div className={`p-1.5 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-sm font-medium">
                        {config.title}
                      </Badge>
                    </div>
                  );
                })}
                {allUserRoles.length === 0 && (
                  <Badge variant="outline" className="text-sm">
                    Carregant rols...
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 Sistema de Gestió Comercial. Tots els drets reservats.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
