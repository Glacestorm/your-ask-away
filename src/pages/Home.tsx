import { useEffect, useState, useRef, useMemo } from 'react';
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

// Feature menu options (excluding role-based dashboards) - translation keys
const featureMenuOptionsKeys = [
  {
    titleKey: 'menu.administration',
    descKey: 'menu.administration.desc',
    icon: Settings,
    path: '/admin?section=administration',
    roles: ['superadmin', 'director_comercial', 'responsable_comercial']
  },
  {
    titleKey: 'menu.map',
    descKey: 'menu.map.desc',
    icon: Map,
    path: '/admin?section=map',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    titleKey: 'menu.accounting',
    descKey: 'menu.accounting.desc',
    icon: Calculator,
    path: '/admin?section=accounting&view=menu',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    titleKey: 'menu.calendar',
    descKey: 'menu.calendar.desc',
    icon: CalendarDays,
    path: '/admin?section=shared-calendar',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    titleKey: 'menu.metrics',
    descKey: 'menu.metrics.desc',
    icon: BarChart3,
    path: '/admin?section=visits',
    roles: ['superadmin', 'admin', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    titleKey: 'menu.dataManagement',
    descKey: 'menu.dataManagement.desc',
    icon: Package,
    path: '/admin?section=companies',
    roles: ['superadmin', 'admin', 'responsable_comercial']
  },
  {
    titleKey: 'menu.configuration',
    descKey: 'menu.configuration.desc',
    icon: Activity,
    path: '/admin?section=colors',
    roles: ['superadmin', 'admin', 'responsable_comercial']
  },
];

// Role configurations with their dashboard paths - translation keys
const roleConfigKeys: Record<string, { titleKey: string; icon: React.ElementType; path: string; color: string }> = {
  superadmin: {
    titleKey: 'role.superadmin',
    icon: Settings,
    path: '/admin?section=director',
    color: 'bg-purple-500'
  },
  director_comercial: {
    titleKey: 'role.director_comercial',
    icon: TrendingUp,
    path: '/admin?section=director',
    color: 'bg-emerald-500'
  },
  director_oficina: {
    titleKey: 'role.director_oficina',
    icon: Building2,
    path: '/admin?section=office-director',
    color: 'bg-emerald-500'
  },
  responsable_comercial: {
    titleKey: 'role.responsable_comercial',
    icon: Briefcase,
    path: '/admin?section=commercial-manager',
    color: 'bg-emerald-500'
  },
  admin: {
    titleKey: 'role.admin',
    icon: Settings,
    path: '/admin?section=director',
    color: 'bg-blue-500'
  },
  user: {
    titleKey: 'role.user',
    icon: Users,
    path: '/admin?section=gestor-dashboard',
    color: 'bg-emerald-500'
  },
  auditor: {
    titleKey: 'role.auditor',
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
  const rolesLoadedRef = useRef(false);

  // Redirect if not authenticated - do this early
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch all roles only once per user
  useEffect(() => {
    if (!user || rolesLoadedRef.current) return;
    
    rolesLoadedRef.current = true;
    
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setAllUserRoles(data.map(r => r.role));
        }
      });
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al tancar la sessió');
    } else {
      navigate('/auth');
    }
  };

  // Memoize computed values to avoid recalculations on every render
  const availableFeatures = useMemo(() => {
    const effectiveRole = userRole || 'user';
    return featureMenuOptionsKeys.filter(option => 
      option.roles.includes(effectiveRole)
    );
  }, [userRole]);

  const currentRoleConfig = useMemo(() => {
    const effectiveRole = userRole || 'user';
    return roleConfigKeys[effectiveRole] || roleConfigKeys.user;
  }, [userRole]);

  // Show loading state
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

  const RoleIcon = currentRoleConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">O</span>
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                  ObelixIA
                </h2>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="text-center hidden md:block">
              <h1 className="text-xl font-bold text-foreground">
                Panel de Control
              </h1>
              <p className="text-xs text-muted-foreground">
                Selecciona una opción para acceder
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSelector />
              <LanguageSelector />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
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
            onClick={() => navigate(currentRoleConfig.path)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${currentRoleConfig.color} text-white shadow-lg`}>
                    <RoleIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {t('home.myPanel')}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {t('home.accessPanel')}
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
                      {t(option.titleKey)}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t(option.descKey)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-16 pt-8 border-t">
            <h3 className="text-xl font-semibold mb-6">{t('home.quickActions')}</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {t('home.generalPanel')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                {t('home.myProfile')}
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
              <span className="text-sm text-muted-foreground font-medium">{t('home.myRoles')}:</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {allUserRoles.map((role) => {
                  const config = roleConfigKeys[role] || roleConfigKeys.user;
                  const Icon = config.icon;
                  return (
                    <div key={role} className="flex items-center gap-2 bg-card/80 px-3 py-2 rounded-lg border shadow-sm">
                      <div className={`p-1.5 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-sm font-medium">
                        {t(config.titleKey)}
                      </Badge>
                    </div>
                  );
                })}
                {allUserRoles.length === 0 && (
                  <Badge variant="outline" className="text-sm">
                    {t('home.loadingRoles')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">ObelixIA</span>
              <span>{t('home.copyright')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
