import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Calculator
} from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeSelector } from '@/components/ThemeSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MenuOption {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
}

const menuOptions: MenuOption[] = [
  {
    title: 'Director de Negoci',
    description: 'Dashboard y métricas del director comercial',
    icon: TrendingUp,
    path: '/admin?section=director',
    roles: ['superadmin', 'director_comercial', 'responsable_comercial']
  },
  {
    title: 'Director d\'Oficina',
    description: 'Dashboard y gestión de oficina',
    icon: Building2,
    path: '/admin?section=office-director',
    roles: ['superadmin', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Responsable Comercial',
    description: 'Dashboard y auditoría comercial',
    icon: Briefcase,
    path: '/admin?section=commercial-manager',
    roles: ['superadmin', 'responsable_comercial']
  },
  {
    title: 'Gestor Empresa / Retail',
    description: 'Dashboard personal del gestor',
    icon: Users,
    path: '/admin?section=gestor-dashboard',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Auditor',
    description: 'Panel de auditoría del sistema',
    icon: UserCog,
    path: '/admin?section=audit',
    roles: ['superadmin', 'auditor', 'responsable_comercial']
  },
  {
    title: 'Mapa',
    description: 'Visualización geográfica de empresas',
    icon: Map,
    path: '/admin?section=map',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial', 'auditor']
  },
  {
    title: 'Comptabilitat',
    description: 'Gestió comptable i estats financers',
    icon: Calculator,
    path: '/admin?section=accounting&view=menu',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Calendario de Visitas',
    description: 'Calendario compartido de visitas',
    icon: CalendarDays,
    path: '/admin?section=shared-calendar',
    roles: ['superadmin', 'admin', 'user', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Métricas y Análisis',
    description: 'Análisis detallado de métricas',
    icon: BarChart3,
    path: '/admin?section=visits',
    roles: ['superadmin', 'admin', 'director_comercial', 'director_oficina', 'responsable_comercial']
  },
  {
    title: 'Gestión de Datos',
    description: 'Administración de empresas y productos',
    icon: Package,
    path: '/admin?section=companies',
    roles: ['superadmin', 'admin', 'responsable_comercial']
  },
  {
    title: 'Configuración',
    description: 'Configuración del sistema',
    icon: Activity,
    path: '/admin?section=colors',
    roles: ['superadmin', 'admin', 'responsable_comercial']
  },
];

const Home = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      navigate('/auth');
    }
  };

  const getAvailableOptions = () => {
    // If no role assigned, treat as regular gestor (user role)
    const effectiveRole = userRole || 'user';
    
    return menuOptions.filter(option => 
      option.roles.includes(effectiveRole)
    );
  };

  const getRoleTitle = () => {
    if (!userRole) return 'Usuario';
    
    if (userRole === 'superadmin') return 'Superadministrador';
    if (userRole === 'director_comercial') return 'Director de Negoci';
    if (userRole === 'director_oficina') return 'Director d\'Oficina';
    if (userRole === 'responsable_comercial') return 'Responsable Comercial';
    if (userRole === 'auditor') return 'Auditor';
    if (userRole === 'admin') return 'Administrador';
    return 'Gestor';
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

  const availableOptions = getAvailableOptions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Benvingut/da
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.email} • {getRoleTitle()}
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
                Tancar sessió
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold tracking-tight">
              Panell de Control
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Selecciona una de les opcions disponibles per accedir a les diferents funcionalitats del sistema
            </p>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableOptions.map((option, index) => {
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

      {/* Footer */}
      <footer className="mt-20 border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Sistema de Gestió Comercial. Tots els drets reservats.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
