import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Database, BarChart3, Package, Users as UsersIcon, TrendingUp, Target, Building2, Settings } from 'lucide-react';
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
        <Tabs defaultValue="visits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-12">
            {/* Métricas */}
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visitas</span>
            </TabsTrigger>
            <TabsTrigger value="products-metrics" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="gestores" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Gestores</span>
            </TabsTrigger>
            <TabsTrigger value="vinculacion" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Vinculación</span>
            </TabsTrigger>
            
            {/* Gestión */}
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            
            {/* Configuración */}
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Estados</span>
            </TabsTrigger>
            <TabsTrigger value="concepts" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Conceptos</span>
            </TabsTrigger>
            <TabsTrigger value="map-config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Auditoría</span>
            </TabsTrigger>
          </TabsList>

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
