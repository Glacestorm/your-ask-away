import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  BarChart3, 
  Package, 
  Users, 
  Target, 
  MapPin, 
  FileText,
  Download,
  GitCompare,
  LineChart,
  Award,
  UserCheck,
  Bell,
  Filter,
  Activity,
  Briefcase,
  Settings,
  LayoutDashboard,
  PieChart
} from 'lucide-react';
import { toast } from 'sonner';
import { subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import * as XLSX from 'xlsx';

// Componentes ligeros que se cargan siempre
import { GlobalNavHeader } from '@/components/GlobalNavHeader';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { NotificationService } from '@/components/dashboard/NotificationService';

// Lazy loading para todos los componentes pesados del Dashboard
const ResumenEjecutivo = lazy(() => import('@/components/dashboard/ResumenEjecutivo').then(m => ({ default: m.ResumenEjecutivo })));
const ComparativaTemporales = lazy(() => import('@/components/dashboard/ComparativaTemporales').then(m => ({ default: m.ComparativaTemporales })));
const PrediccionesFuturas = lazy(() => import('@/components/dashboard/PrediccionesFuturas').then(m => ({ default: m.PrediccionesFuturas })));
const ObjetivosYMetas = lazy(() => import('@/components/dashboard/ObjetivosYMetas').then(m => ({ default: m.ObjetivosYMetas })));
const AnalisisGeografico = lazy(() => import('@/components/dashboard/AnalisisGeografico').then(m => ({ default: m.AnalisisGeografico })));
const AnalisisCohortes = lazy(() => import('@/components/dashboard/AnalisisCohortes').then(m => ({ default: m.AnalisisCohortes })));
const AnalisisEmbudo = lazy(() => import('@/components/dashboard/AnalisisEmbudo').then(m => ({ default: m.AnalisisEmbudo })));

// Admin metrics components
const VisitsMetrics = lazy(() => import('@/components/admin/VisitsMetrics').then(m => ({ default: m.VisitsMetrics })));
const ProductsMetrics = lazy(() => import('@/components/admin/ProductsMetrics').then(m => ({ default: m.ProductsMetrics })));
const GestoresMetrics = lazy(() => import('@/components/admin/GestoresMetrics').then(m => ({ default: m.GestoresMetrics })));
const VinculacionMetrics = lazy(() => import('@/components/admin/VinculacionMetrics').then(m => ({ default: m.VinculacionMetrics })));

// Dashboard specific components
const PersonalKPIsDashboard = lazy(() => import('@/components/dashboard/PersonalKPIsDashboard').then(m => ({ default: m.PersonalKPIsDashboard })));
const QuickActionsPanel = lazy(() => import('@/components/dashboard/QuickActionsPanel').then(m => ({ default: m.QuickActionsPanel })));
const UpcomingVisitsWidget = lazy(() => import('@/components/dashboard/UpcomingVisitsWidget').then(m => ({ default: m.UpcomingVisitsWidget })));
const PersonalActivityHistory = lazy(() => import('@/components/dashboard/PersonalActivityHistory').then(m => ({ default: m.PersonalActivityHistory })));
const GestoresLeaderboard = lazy(() => import('@/components/dashboard/GestoresLeaderboard').then(m => ({ default: m.GestoresLeaderboard })));
const GestorComparison = lazy(() => import('@/components/dashboard/GestorComparison').then(m => ({ default: m.GestorComparison })));
const GestorEvolutionTimeline = lazy(() => import('@/components/dashboard/GestorEvolutionTimeline').then(m => ({ default: m.GestorEvolutionTimeline })));
const ActivityStatistics = lazy(() => import('@/components/dashboard/ActivityStatistics').then(m => ({ default: m.ActivityStatistics })));
const TPVGoalsDashboard = lazy(() => import('@/components/dashboard/TPVGoalsDashboard').then(m => ({ default: m.TPVGoalsDashboard })));
const BestPracticesPanel = lazy(() => import('@/components/dashboard/BestPracticesPanel').then(m => ({ default: m.BestPracticesPanel })));

// Tools components
const AlertsManager = lazy(() => import('@/components/dashboard/AlertsManager').then(m => ({ default: m.AlertsManager })));
const NotificationPreferences = lazy(() => import('@/components/dashboard/NotificationPreferences').then(m => ({ default: m.NotificationPreferences })));
const VisitReminders = lazy(() => import('@/components/dashboard/VisitReminders').then(m => ({ default: m.VisitReminders })));
const ReportGenerator = lazy(() => import('@/components/reports/ReportGenerator').then(m => ({ default: m.ReportGenerator })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const CardLoadingFallback = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, loading: authLoading, userRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  // Sub-tabs state for each main section
  const [analysisSubTab, setAnalysisSubTab] = useState('comparativa');
  const [goalsSubTab, setGoalsSubTab] = useState('objetivos');
  const [teamSubTab, setTeamSubTab] = useState('gestores');
  const [toolsSubTab, setToolsSubTab] = useState('alertas');

  // Role-based visibility configuration
  const isDirector = userRole && ['superadmin', 'director_comercial', 'director_oficina', 'responsable_comercial'].includes(userRole);
  const isAuditor = userRole === 'auditor';
  const isRegularUser = userRole === 'user';
  const canManageAlerts = userRole && ['superadmin', 'director_comercial', 'responsable_comercial', 'director_oficina'].includes(userRole);
  const canSeeAdvancedAnalytics = userRole && ['superadmin', 'director_comercial', 'responsable_comercial', 'director_oficina', 'auditor'].includes(userRole);
  const canSeeTPV = userRole && ['superadmin', 'director_comercial', 'responsable_comercial', 'user'].includes(userRole);
  const canSeeBestPractices = !isAuditor; // Everyone except auditors
  const canSeeReports = userRole && ['superadmin', 'director_comercial', 'responsable_comercial', 'director_oficina', 'auditor'].includes(userRole);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      toast.error(t('auth.loginError'));
    }
  }, [user, authLoading, navigate, t]);

  const exportToExcel = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('*, status_colors(status_name), profiles(full_name, email)');

      if (!companies) {
        toast.error(t('dashboard.noData'));
        return;
      }

      const exportData = companies.map((c: any) => ({
        Nombre: c.name,
        Dirección: c.address,
        Parroquia: c.parroquia,
        Oficina: c.oficina || '',
        CNAE: c.cnae || '',
        Estado: c.status_colors?.status_name || '',
        Gestor: c.profiles?.full_name || c.profiles?.email || '',
        'Última Visita': c.fecha_ultima_visita || '',
        Empleados: c.employees || '',
        Facturación: c.turnover || '',
        Teléfono: c.phone || '',
        Email: c.email || '',
        Web: c.website || '',
        Observaciones: c.observaciones || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
      XLSX.writeFile(wb, `empresas_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success(t('dashboard.exportSuccess'));
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast.error(t('dashboard.exportError'));
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t('dashboard.loading')}</p>
      </div>
    );
  }

  const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined;
  const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <NotificationService />
      
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4">
          <GlobalNavHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
          
          <div className="flex items-center gap-3 justify-end">
            <NotificationsPanel />
            <Button onClick={exportToExcel} className="shadow-md hover:shadow-lg transition-shadow">
              <Download className="mr-2 h-4 w-4" />
              {t('dashboard.exportData')}
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange}
        />

        {/* Main Dashboard Tabs - 5 Sections */}
        <Tabs defaultValue="mi-panel" className="space-y-6">
          <TabsList className={`grid w-full ${isDirector ? 'grid-cols-5' : 'grid-cols-4'} h-auto gap-1`}>
            <TabsTrigger value="mi-panel" className="flex items-center gap-2 py-3 px-4">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Mi Panel</span>
            </TabsTrigger>
            <TabsTrigger value="analisis" className="flex items-center gap-2 py-3 px-4">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Análisis</span>
            </TabsTrigger>
            <TabsTrigger value="objetivos" className="flex items-center gap-2 py-3 px-4">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Objetivos</span>
            </TabsTrigger>
            {isDirector && (
              <TabsTrigger value="equipo" className="flex items-center gap-2 py-3 px-4">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Equipo</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="herramientas" className="flex items-center gap-2 py-3 px-4">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Herramientas</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== SECTION 1: MI PANEL (Personal Dashboard) ===== */}
          <TabsContent value="mi-panel" className="space-y-6">
            {/* KPIs Personales - Visible para todos excepto auditors */}
            {!isAuditor && (
              <Suspense fallback={<CardLoadingFallback />}>
                <PersonalKPIsDashboard />
              </Suspense>
            )}
            
            {/* Acciones Rápidas - Solo para usuarios que pueden hacer acciones */}
            {!isAuditor && (
              <Suspense fallback={<LoadingFallback />}>
                <QuickActionsPanel />
              </Suspense>
            )}
            
            {/* Próximas Visitas - Visible para todos excepto auditors */}
            {!isAuditor && (
              <Suspense fallback={<CardLoadingFallback />}>
                <UpcomingVisitsWidget />
              </Suspense>
            )}
            
            {/* Resumen Ejecutivo - Visible para todos */}
            <Suspense fallback={<CardLoadingFallback />}>
              <ResumenEjecutivo startDate={startDate} endDate={endDate} />
            </Suspense>
            
            {/* Mi Actividad - Solo para usuarios no auditores */}
            {!isAuditor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Mi Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <PersonalActivityHistory />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {/* Vista especial para auditors */}
            {isAuditor && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Activity className="h-5 w-5" />
                    Vista de Auditoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Como auditor, tiene acceso de solo lectura a las métricas y análisis agregados del sistema.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== SECTION 2: ANÁLISIS (Analytics) ===== */}
          <TabsContent value="analisis" className="space-y-6">
            {/* Sub-navigation for Analysis - Role based visibility */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
              <Button 
                variant={analysisSubTab === 'comparativa' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setAnalysisSubTab('comparativa')}
                className="flex items-center gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Comparativa
              </Button>
              {canSeeAdvancedAnalytics && (
                <Button 
                  variant={analysisSubTab === 'predicciones' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setAnalysisSubTab('predicciones')}
                  className="flex items-center gap-2"
                >
                  <LineChart className="h-4 w-4" />
                  Predicciones
                </Button>
              )}
              <Button 
                variant={analysisSubTab === 'visitas' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setAnalysisSubTab('visitas')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Visitas
              </Button>
              <Button 
                variant={analysisSubTab === 'productos' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setAnalysisSubTab('productos')}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Productos
              </Button>
              <Button 
                variant={analysisSubTab === 'vinculacion' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setAnalysisSubTab('vinculacion')}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Vinculación
              </Button>
              <Button 
                variant={analysisSubTab === 'geografico' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setAnalysisSubTab('geografico')}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Geográfico
              </Button>
              {canSeeAdvancedAnalytics && (
                <>
                  <Button 
                    variant={analysisSubTab === 'cohortes' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setAnalysisSubTab('cohortes')}
                    className="flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Cohortes
                  </Button>
                  <Button 
                    variant={analysisSubTab === 'embudo' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setAnalysisSubTab('embudo')}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Embudo
                  </Button>
                </>
              )}
            </div>

            {/* Analysis Sub-content */}
            {analysisSubTab === 'comparativa' && (
              <Suspense fallback={<CardLoadingFallback />}>
                <ComparativaTemporales startDate={startDate} endDate={endDate} />
              </Suspense>
            )}
            
            {analysisSubTab === 'predicciones' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.predictions.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.predictions.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <PrediccionesFuturas />
                  </Suspense>
                </CardContent>
              </Card>
            )}
            
            {analysisSubTab === 'visitas' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.visits.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.visits.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <VisitsMetrics />
                  </Suspense>
                </CardContent>
              </Card>
            )}
            
            {analysisSubTab === 'productos' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.products.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.products.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <ProductsMetrics />
                  </Suspense>
                </CardContent>
              </Card>
            )}
            
            {analysisSubTab === 'vinculacion' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.linkage.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.linkage.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <VinculacionMetrics />
                  </Suspense>
                </CardContent>
              </Card>
            )}
            
            {analysisSubTab === 'geografico' && (
              <Suspense fallback={<CardLoadingFallback />}>
                <AnalisisGeografico startDate={startDate} endDate={endDate} />
              </Suspense>
            )}
            
            {analysisSubTab === 'cohortes' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.cohorts.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.cohorts.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <AnalisisCohortes />
                  </Suspense>
                </CardContent>
              </Card>
            )}
            
            {analysisSubTab === 'embudo' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.funnel.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.funnel.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <AnalisisEmbudo />
                  </Suspense>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== SECTION 3: OBJETIVOS (Goals) ===== */}
          <TabsContent value="objetivos" className="space-y-6">
            {/* Sub-navigation for Goals - Role based visibility */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
              {!isAuditor && (
                <Button 
                  variant={goalsSubTab === 'objetivos' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setGoalsSubTab('objetivos')}
                  className="flex items-center gap-2"
                >
                  <Award className="h-4 w-4" />
                  Mis Objetivos
                </Button>
              )}
              {canSeeTPV && (
                <Button 
                  variant={goalsSubTab === 'tpv' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setGoalsSubTab('tpv')}
                  className="flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  TPV
                </Button>
              )}
              {canSeeBestPractices && (
                <Button 
                  variant={goalsSubTab === 'practicas' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setGoalsSubTab('practicas')}
                  className="flex items-center gap-2"
                >
                  <Award className="h-4 w-4" />
                  Mejores Prácticas
                </Button>
              )}
              {isAuditor && (
                <p className="text-sm text-muted-foreground flex items-center px-3">
                  Vista de solo lectura - Sin acceso a objetivos individuales
                </p>
              )}
            </div>

            {/* Goals Sub-content */}
            {goalsSubTab === 'objetivos' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.objectives.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.objectives.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <ObjetivosYMetas />
                  </Suspense>
                </CardContent>
              </Card>
            )}
            
            {goalsSubTab === 'tpv' && (
              <Card>
                <CardHeader>
                  <CardTitle>Objetivos de TPV</CardTitle>
                  <p className="text-sm text-muted-foreground">Seguimiento de metas de facturación, vinculación y comisiones</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <TPVGoalsDashboard />
                  </Suspense>
                </CardContent>
              </Card>
            )}
            
            {goalsSubTab === 'practicas' && (
              <Card>
                <CardHeader>
                  <CardTitle>Mejores Prácticas</CardTitle>
                  <p className="text-sm text-muted-foreground">Comparte y aprende de las mejores prácticas del equipo</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <BestPracticesPanel />
                  </Suspense>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== SECTION 4: EQUIPO (Team - Only for Directors) ===== */}
          {isDirector && (
            <TabsContent value="equipo" className="space-y-6">
              {/* Sub-navigation for Team */}
              <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                <Button 
                  variant={teamSubTab === 'gestores' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setTeamSubTab('gestores')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Rendimiento
                </Button>
                <Button 
                  variant={teamSubTab === 'comparacion' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setTeamSubTab('comparacion')}
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  Comparación
                </Button>
                <Button 
                  variant={teamSubTab === 'evolucion' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setTeamSubTab('evolucion')}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Evolución
                </Button>
                <Button 
                  variant={teamSubTab === 'estadisticas' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setTeamSubTab('estadisticas')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Estadísticas
                </Button>
              </div>

              {/* Team Sub-content */}
              {teamSubTab === 'gestores' && (
                <div className="space-y-6">
                  <Suspense fallback={<CardLoadingFallback />}>
                    <GestoresLeaderboard />
                  </Suspense>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('section.managers.title')}</CardTitle>
                      <p className="text-sm text-muted-foreground">{t('section.managers.subtitle')}</p>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<LoadingFallback />}>
                        <GestoresMetrics />
                      </Suspense>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {teamSubTab === 'comparacion' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparación entre Gestores</CardTitle>
                    <p className="text-sm text-muted-foreground">Análisis comparativo del rendimiento del equipo</p>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<LoadingFallback />}>
                      <GestorComparison />
                    </Suspense>
                  </CardContent>
                </Card>
              )}
              
              {teamSubTab === 'evolucion' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución Temporal</CardTitle>
                    <p className="text-sm text-muted-foreground">Progresión del rendimiento a lo largo del tiempo</p>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<LoadingFallback />}>
                      <GestorEvolutionTimeline />
                    </Suspense>
                  </CardContent>
                </Card>
              )}
              
              {teamSubTab === 'estadisticas' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas de Actividad</CardTitle>
                    <p className="text-sm text-muted-foreground">Métricas detalladas de actividad del equipo</p>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<LoadingFallback />}>
                      <ActivityStatistics />
                    </Suspense>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* ===== SECTION 5: HERRAMIENTAS (Tools) ===== */}
          <TabsContent value="herramientas" className="space-y-6">
            {/* Sub-navigation for Tools - Role based visibility */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
              {canManageAlerts && (
                <Button 
                  variant={toolsSubTab === 'alertas' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setToolsSubTab('alertas')}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Alertas
                </Button>
              )}
              {canSeeReports && (
                <Button 
                  variant={toolsSubTab === 'reportes' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setToolsSubTab('reportes')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Informes
                </Button>
              )}
              {!isAuditor && (
                <Button 
                  variant={toolsSubTab === 'recordatorios' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setToolsSubTab('recordatorios')}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Recordatorios
                </Button>
              )}
              {isRegularUser && !canManageAlerts && !canSeeReports && (
                <p className="text-sm text-muted-foreground flex items-center px-3">
                  Herramientas básicas disponibles
                </p>
              )}
            </div>

            {/* Tools Sub-content */}
            {toolsSubTab === 'alertas' && canManageAlerts && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('section.alerts.title')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('section.alerts.subtitle')}</p>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<LoadingFallback />}>
                      <AlertsManager />
                    </Suspense>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('section.notifications.title')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('section.notifications.subtitle')}</p>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<LoadingFallback />}>
                      <NotificationPreferences />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {toolsSubTab === 'reportes' && canSeeReports && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.reports.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.reports.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <ReportGenerator />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {toolsSubTab === 'recordatorios' && !isAuditor && (
              <Suspense fallback={<CardLoadingFallback />}>
                <VisitReminders />
              </Suspense>
            )}

            {/* Default view for users without specific permissions */}
            {isRegularUser && !canManageAlerts && toolsSubTab === 'alertas' && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-blue-700 dark:text-blue-400">Notificaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingFallback />}>
                    <NotificationPreferences />
                  </Suspense>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
