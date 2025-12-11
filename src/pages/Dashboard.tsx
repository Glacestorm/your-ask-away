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
import { ResumenEjecutivo } from '@/components/dashboard/ResumenEjecutivo';
import { AnalisisGeografico } from '@/components/dashboard/AnalisisGeografico';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { ComparativaTemporales } from '@/components/dashboard/ComparativaTemporales';
import { PrediccionesFuturas } from '@/components/dashboard/PrediccionesFuturas';
import { ObjetivosYMetas } from '@/components/dashboard/ObjetivosYMetas';
import { VisitsMetrics } from '@/components/admin/VisitsMetrics';
import { ProductsMetrics } from '@/components/admin/ProductsMetrics';
import { GestoresMetrics } from '@/components/admin/GestoresMetrics';
import { VinculacionMetrics } from '@/components/admin/VinculacionMetrics';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { AnalisisCohortes } from '@/components/dashboard/AnalisisCohortes';
import { AlertsManager } from '@/components/dashboard/AlertsManager';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { NotificationPreferences } from '@/components/dashboard/NotificationPreferences';
import { AnalisisEmbudo } from '@/components/dashboard/AnalisisEmbudo';
import { supabase } from '@/integrations/supabase/client';
import { VisitReminders } from '@/components/dashboard/VisitReminders';
import { NotificationService } from '@/components/dashboard/NotificationService';
import { UpcomingVisitsWidget } from '@/components/dashboard/UpcomingVisitsWidget';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { PersonalKPIsDashboard } from '@/components/dashboard/PersonalKPIsDashboard';
import { GestoresLeaderboard } from '@/components/dashboard/GestoresLeaderboard';
import { PersonalActivityHistory } from '@/components/dashboard/PersonalActivityHistory';
import { ActivityStatistics } from '@/components/dashboard/ActivityStatistics';
import { GestorComparison } from '@/components/dashboard/GestorComparison';
import { GestorEvolutionTimeline } from '@/components/dashboard/GestorEvolutionTimeline';
import { TPVGoalsDashboard } from '@/components/dashboard/TPVGoalsDashboard';
import { BestPracticesPanel } from '@/components/dashboard/BestPracticesPanel';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';
import { Skeleton } from '@/components/ui/skeleton';
import * as XLSX from 'xlsx';

// Lazy loading para componentes pesados
const LazyAnalisisGeografico = lazy(() => import('@/components/dashboard/AnalisisGeografico').then(m => ({ default: m.AnalisisGeografico })));

const LoadingFallback = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-64 w-full" />
  </div>
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

  // Check if user is a director or admin (can see team tab)
  const isDirector = userRole && ['superadmin', 'director_comercial', 'director_oficina', 'responsable_comercial'].includes(userRole);

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
            {/* KPIs Personales */}
            <PersonalKPIsDashboard />
            
            {/* Acciones Rápidas */}
            <QuickActionsPanel />
            
            {/* Próximas Visitas */}
            <UpcomingVisitsWidget />
            
            {/* Resumen Ejecutivo */}
            <ResumenEjecutivo startDate={startDate} endDate={endDate} />
            
            {/* Mi Actividad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Mi Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PersonalActivityHistory />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SECTION 2: ANÁLISIS (Analytics) ===== */}
          <TabsContent value="analisis" className="space-y-6">
            {/* Sub-navigation for Analysis */}
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
              <Button 
                variant={analysisSubTab === 'predicciones' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setAnalysisSubTab('predicciones')}
                className="flex items-center gap-2"
              >
                <LineChart className="h-4 w-4" />
                Predicciones
              </Button>
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
            </div>

            {/* Analysis Sub-content */}
            {analysisSubTab === 'comparativa' && (
              <ComparativaTemporales startDate={startDate} endDate={endDate} />
            )}
            
            {analysisSubTab === 'predicciones' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.predictions.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.predictions.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <PrediccionesFuturas />
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
                  <VisitsMetrics />
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
                  <ProductsMetrics />
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
                  <VinculacionMetrics />
                </CardContent>
              </Card>
            )}
            
            {analysisSubTab === 'geografico' && (
              <Suspense fallback={<LoadingFallback />}>
                <LazyAnalisisGeografico startDate={startDate} endDate={endDate} />
              </Suspense>
            )}
            
            {analysisSubTab === 'cohortes' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.cohorts.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.cohorts.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <AnalisisCohortes />
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
                  <AnalisisEmbudo />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== SECTION 3: OBJETIVOS (Goals) ===== */}
          <TabsContent value="objetivos" className="space-y-6">
            {/* Sub-navigation for Goals */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
              <Button 
                variant={goalsSubTab === 'objetivos' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setGoalsSubTab('objetivos')}
                className="flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                Mis Objetivos
              </Button>
              <Button 
                variant={goalsSubTab === 'tpv' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setGoalsSubTab('tpv')}
                className="flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                TPV
              </Button>
              <Button 
                variant={goalsSubTab === 'practicas' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setGoalsSubTab('practicas')}
                className="flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                Mejores Prácticas
              </Button>
            </div>

            {/* Goals Sub-content */}
            {goalsSubTab === 'objetivos' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.objectives.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.objectives.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <ObjetivosYMetas />
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
                  <TPVGoalsDashboard />
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
                  <BestPracticesPanel />
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
                  <GestoresLeaderboard />
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('section.managers.title')}</CardTitle>
                      <p className="text-sm text-muted-foreground">{t('section.managers.subtitle')}</p>
                    </CardHeader>
                    <CardContent>
                      <GestoresMetrics />
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
                    <GestorComparison />
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
                    <GestorEvolutionTimeline />
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
                    <ActivityStatistics />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* ===== SECTION 5: HERRAMIENTAS (Tools) ===== */}
          <TabsContent value="herramientas" className="space-y-6">
            {/* Sub-navigation for Tools */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
              <Button 
                variant={toolsSubTab === 'alertas' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setToolsSubTab('alertas')}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Alertas
              </Button>
              <Button 
                variant={toolsSubTab === 'reportes' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setToolsSubTab('reportes')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Informes
              </Button>
            </div>

            {/* Tools Sub-content */}
            {toolsSubTab === 'alertas' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('section.alerts.title')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('section.alerts.subtitle')}</p>
                  </CardHeader>
                  <CardContent>
                    <AlertsManager />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('section.notifications.title')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('section.notifications.subtitle')}</p>
                  </CardHeader>
                  <CardContent>
                    <NotificationPreferences />
                  </CardContent>
                </Card>

                <VisitReminders />
              </div>
            )}
            
            {toolsSubTab === 'reportes' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('section.reports.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('section.reports.subtitle')}</p>
                </CardHeader>
                <CardContent>
                  <ReportGenerator />
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
