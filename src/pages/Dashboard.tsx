import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
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
  Activity
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
import { LanguageSelector } from '@/components/LanguageSelector';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

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
      {/* Notification Service - runs in background */}
      <NotificationService />
      
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
              <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <NotificationsPanel />
            <Button onClick={exportToExcel} className="w-full md:w-auto">
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

        {/* Dashboard Tabs */}
        <Tabs defaultValue="resumen" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-18 h-auto">
            <TabsTrigger value="resumen" className="flex items-center gap-2 py-3">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.resumen')}</span>
            </TabsTrigger>
            <TabsTrigger value="comparativa" className="flex items-center gap-2 py-3">
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.comparativa')}</span>
            </TabsTrigger>
            <TabsTrigger value="predicciones" className="flex items-center gap-2 py-3">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.predicciones')}</span>
            </TabsTrigger>
            <TabsTrigger value="objetivos" className="flex items-center gap-2 py-3">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.objetivos')}</span>
            </TabsTrigger>
            <TabsTrigger value="tpv-goals" className="flex items-center gap-2 py-3">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">TPV</span>
            </TabsTrigger>
            <TabsTrigger value="visitas" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.visitas')}</span>
            </TabsTrigger>
            <TabsTrigger value="productos" className="flex items-center gap-2 py-3">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.productos')}</span>
            </TabsTrigger>
            <TabsTrigger value="gestores" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.gestores')}</span>
            </TabsTrigger>
            <TabsTrigger value="vinculacion" className="flex items-center gap-2 py-3">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.vinculacion')}</span>
            </TabsTrigger>
            <TabsTrigger value="geografico" className="flex items-center gap-2 py-3">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.geografico')}</span>
            </TabsTrigger>
            <TabsTrigger value="cohortes" className="flex items-center gap-2 py-3">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.cohortes')}</span>
            </TabsTrigger>
            <TabsTrigger value="embudo" className="flex items-center gap-2 py-3">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.embudo')}</span>
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex items-center gap-2 py-3">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.alertas')}</span>
            </TabsTrigger>
            <TabsTrigger value="actividad" className="flex items-center gap-2 py-3">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Mi Actividad</span>
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="comparacion" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Comparación</span>
            </TabsTrigger>
            <TabsTrigger value="evolucion" className="flex items-center gap-2 py-3">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Evolución</span>
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.reportes')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Resumen Ejecutivo */}
          <TabsContent value="resumen" className="space-y-6">
            <PersonalKPIsDashboard />
            <QuickActionsPanel />
            <UpcomingVisitsWidget />
            <ResumenEjecutivo startDate={startDate} endDate={endDate} />
          </TabsContent>

          {/* Análisis Comparativo */}
          <TabsContent value="comparativa" className="space-y-6">
            <ComparativaTemporales startDate={startDate} endDate={endDate} />
          </TabsContent>

          {/* Predicciones Futuras */}
          <TabsContent value="predicciones" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.predictions.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.predictions.subtitle')}
                </p>
              </div>
              <PrediccionesFuturas />
            </div>
          </TabsContent>

          {/* Objetivos y Metas */}
          <TabsContent value="objetivos" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.objectives.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.objectives.subtitle')}
                </p>
              </div>
              <ObjetivosYMetas />
            </div>
          </TabsContent>

          {/* Objetivos de TPV */}
          <TabsContent value="tpv-goals" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Objetivos de TPV</h2>
                <p className="text-muted-foreground">
                  Seguimiento de metas de facturación, vinculación y comisiones
                </p>
              </div>
              <TPVGoalsDashboard />
            </div>
          </TabsContent>

          {/* Análisis de Visitas */}
          <TabsContent value="visitas" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.visits.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.visits.subtitle')}
                </p>
              </div>
              <VisitsMetrics />
            </div>
          </TabsContent>

          {/* Análisis de Productos */}
          <TabsContent value="productos" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.products.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.products.subtitle')}
                </p>
              </div>
              <ProductsMetrics />
            </div>
          </TabsContent>

          {/* Rendimiento de Gestores */}
          <TabsContent value="gestores" className="space-y-6">
            <GestoresLeaderboard />
            
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.managers.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.managers.subtitle')}
                </p>
              </div>
              <GestoresMetrics />
            </div>
          </TabsContent>

          {/* Evolución de Vinculación */}
          <TabsContent value="vinculacion" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.linkage.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.linkage.subtitle')}
                </p>
              </div>
              <VinculacionMetrics />
            </div>
          </TabsContent>

          {/* Análisis Geográfico */}
          <TabsContent value="geografico" className="space-y-6">
            <AnalisisGeografico startDate={startDate} endDate={endDate} />
          </TabsContent>

          {/* Análisis de Cohortes */}
          <TabsContent value="cohortes" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.cohorts.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.cohorts.subtitle')}
                </p>
              </div>
              <AnalisisCohortes />
            </div>
          </TabsContent>

          {/* Análisis de Embudo */}
          <TabsContent value="embudo" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.funnel.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.funnel.subtitle')}
                </p>
              </div>
              <AnalisisEmbudo />
            </div>
          </TabsContent>

          {/* Sistema de Alertas */}
          <TabsContent value="alertas" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.alerts.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.alerts.subtitle')}
                </p>
              </div>
              <AlertsManager />
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.notifications.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.notifications.subtitle')}
                </p>
              </div>
              <NotificationPreferences />
            </div>

            <VisitReminders />
          </TabsContent>

          {/* Mi Actividad Personal */}
          <TabsContent value="actividad" className="space-y-6">
            <PersonalActivityHistory />
          </TabsContent>

          {/* Estadísticas de Actividad */}
          <TabsContent value="estadisticas" className="space-y-6">
            <ActivityStatistics />
          </TabsContent>

          {/* Comparación entre Gestores */}
          <TabsContent value="comparacion" className="space-y-6">
            <GestorComparison />
          </TabsContent>

          {/* Evolución Temporal */}
          <TabsContent value="evolucion" className="space-y-6">
            <GestorEvolutionTimeline />
          </TabsContent>

          {/* Generación de Reportes */}
          <TabsContent value="reportes" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t('section.reports.title')}</h2>
                <p className="text-muted-foreground">
                  {t('section.reports.subtitle')}
                </p>
              </div>
              <ReportGenerator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
