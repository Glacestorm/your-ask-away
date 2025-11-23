import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Database, BarChart3, Package, Users as UsersIcon, TrendingUp, Target, Building2, Settings, Activity, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { CompaniesManager } from '@/components/admin/CompaniesManager';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { UsersManager } from '@/components/admin/UsersManager';
import { StatusColorsManager } from '@/components/admin/StatusColorsManager';
import { ConceptsManager } from '@/components/admin/ConceptsManager';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';
import { EmailTemplatesManager } from '@/components/admin/EmailTemplatesManager';
import { MapTooltipConfig } from '@/components/admin/MapTooltipConfig';
import { VisitsMetrics } from '@/components/admin/VisitsMetrics';
import { ProductsMetrics } from '@/components/admin/ProductsMetrics';
import { GestoresMetrics } from '@/components/admin/GestoresMetrics';
import { VinculacionMetrics } from '@/components/admin/VinculacionMetrics';
import { SystemHealthMonitor } from '@/components/admin/SystemHealthMonitor';
import { TPVManager } from '@/components/admin/TPVManager';
import { TPVGoalsManager } from '@/components/admin/TPVGoalsManager';
import { CommercialDirectorDashboard } from '@/components/admin/CommercialDirectorDashboard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/map');
      toast.error(t('admin.noPermissions'));
    }
  }, [user, isAdmin, authLoading, navigate, t]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
            <p className="text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="director" className="space-y-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max">
              {/* Panel Director Comercial */}
              <TabsTrigger value="director" className="flex items-center gap-2 px-3">
                <TrendingUp className="h-4 w-4" />
                <span>Panel Director</span>
              </TabsTrigger>
              
              <div className="mx-2 h-6 w-px bg-border" />
              {/* Métricas y Análisis */}
              <TabsTrigger value="health" className="flex items-center gap-2 px-3">
                <Activity className="h-4 w-4" />
                <span>Sistema</span>
              </TabsTrigger>
              <TabsTrigger value="visits" className="flex items-center gap-2 px-3">
                <BarChart3 className="h-4 w-4" />
                <span>Visitas</span>
              </TabsTrigger>
              <TabsTrigger value="products-metrics" className="flex items-center gap-2 px-3">
                <Package className="h-4 w-4" />
                <span>Productos</span>
              </TabsTrigger>
              <TabsTrigger value="gestores" className="flex items-center gap-2 px-3">
                <UsersIcon className="h-4 w-4" />
                <span>Gestores</span>
              </TabsTrigger>
              <TabsTrigger value="vinculacion" className="flex items-center gap-2 px-3">
                <Target className="h-4 w-4" />
                <span>Vinculación</span>
              </TabsTrigger>
              <TabsTrigger value="tpv" className="flex items-center gap-2 px-3">
                <CreditCard className="h-4 w-4" />
                <span>TPV</span>
              </TabsTrigger>
              <TabsTrigger value="tpv-goals" className="flex items-center gap-2 px-3">
                <Target className="h-4 w-4" />
                <span>Objetivos TPV</span>
              </TabsTrigger>
              
              <div className="mx-2 h-6 w-px bg-border" />
              
              {/* Gestión de Datos */}
              <TabsTrigger value="companies" className="flex items-center gap-2 px-3">
                <Building2 className="h-4 w-4" />
                <span>Empresas</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2 px-3">
                <Package className="h-4 w-4" />
                <span>Catálogo</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 px-3">
                <UsersIcon className="h-4 w-4" />
                <span>Usuarios</span>
              </TabsTrigger>
              
              <div className="mx-2 h-6 w-px bg-border" />
              
              {/* Configuración */}
              <TabsTrigger value="templates" className="flex items-center gap-2 px-3">
                <Settings className="h-4 w-4" />
                <span>Emails</span>
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2 px-3">
                <Settings className="h-4 w-4" />
                <span>Estados</span>
              </TabsTrigger>
              <TabsTrigger value="concepts" className="flex items-center gap-2 px-3">
                <Settings className="h-4 w-4" />
                <span>Conceptos</span>
              </TabsTrigger>
              <TabsTrigger value="map-config" className="flex items-center gap-2 px-3">
                <Settings className="h-4 w-4" />
                <span>Mapa</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2 px-3">
                <Database className="h-4 w-4" />
                <span>Auditoría</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* PANEL DIRECTOR COMERCIAL */}
          <TabsContent value="director" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Panel Director Comercial</h2>
                <p className="text-sm text-muted-foreground">
                  Temporalmente desactivado para diagnóstico
                </p>
              </div>
              {/* <CommercialDirectorDashboard /> */}
            </div>
          </TabsContent>

          {/* MONITOR DE SALUD DEL SISTEMA */}
          <TabsContent value="health" className="space-y-4">
            <SystemHealthMonitor />
          </TabsContent>

          {/* MÉTRICAS Y ANÁLISIS */}
          <TabsContent value="visits" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Métricas de Visitas</h2>
                <p className="text-sm text-muted-foreground">
                  Análisis detallado de visitas por mes y tendencias
                </p>
              </div>
              <VisitsMetrics />
            </div>
          </TabsContent>

          <TabsContent value="products-metrics" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Métricas de Productos</h2>
                <p className="text-sm text-muted-foreground">
                  Productos más contratados y ofrecidos en visitas
                </p>
              </div>
              <ProductsMetrics />
            </div>
          </TabsContent>

          <TabsContent value="gestores" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Métricas de Gestores</h2>
                <p className="text-sm text-muted-foreground">
                  Rendimiento y tasa de éxito por gestor
                </p>
              </div>
              <GestoresMetrics />
            </div>
          </TabsContent>

          <TabsContent value="vinculacion" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Evolución de Vinculación</h2>
                <p className="text-sm text-muted-foreground">
                  Análisis del porcentaje de vinculación conseguido
                </p>
              </div>
              <VinculacionMetrics />
            </div>
          </TabsContent>

          <TabsContent value="tpv" className="space-y-4">
            <TPVManager />
          </TabsContent>

          <TabsContent value="tpv-goals" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Gestión de Objetivos TPV</h2>
                <p className="text-sm text-muted-foreground">
                  Crear, editar y eliminar metas de facturación, vinculación y comisiones
                </p>
              </div>
              <TPVGoalsManager />
            </div>
          </TabsContent>

          {/* GESTIÓN DE DATOS */}
          <TabsContent value="companies">
            <CompaniesManager />
          </TabsContent>

          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>

          {/* CONFIGURACIÓN */}
          <TabsContent value="templates">
            <EmailTemplatesManager />
          </TabsContent>
          
          <TabsContent value="colors">
            <StatusColorsManager />
          </TabsContent>

          <TabsContent value="concepts">
            <ConceptsManager />
          </TabsContent>

          <TabsContent value="map-config">
            <MapTooltipConfig />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
