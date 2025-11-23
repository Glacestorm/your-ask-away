import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
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
import { OfficeDirectorDashboard } from '@/components/admin/OfficeDirectorDashboard';
import { CommercialManagerDashboard } from '@/components/admin/CommercialManagerDashboard';
import { CommercialManagerAudit } from '@/components/admin/CommercialManagerAudit';
const Admin = () => {
  const { user, isAdmin, isSuperAdmin, isCommercialDirector, isOfficeDirector, isCommercialManager, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('director');

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

  const renderContent = () => {
    switch (activeSection) {
      case 'director':
        if (!isCommercialDirector && !isSuperAdmin && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
              </CardContent>
            </Card>
          );
        }
        return <CommercialDirectorDashboard />;
      case 'office-director':
        if (!isOfficeDirector && !isSuperAdmin && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
              </CardContent>
            </Card>
          );
        }
        return <OfficeDirectorDashboard />;
      case 'commercial-manager':
        if (!isCommercialManager && !isSuperAdmin) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
              </CardContent>
            </Card>
          );
        }
        return <CommercialManagerDashboard />;
      case 'commercial-manager-audit':
        if (!isCommercialManager && !isSuperAdmin) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
              </CardContent>
            </Card>
          );
        }
        return <CommercialManagerAudit />;
      case 'health':
        return <SystemHealthMonitor />;
      case 'visits':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Métricas de Visitas</h2>
              <p className="text-sm text-muted-foreground">
                Análisis detallado de visitas por mes y tendencias
              </p>
            </div>
            <VisitsMetrics />
          </div>
        );
      case 'products-metrics':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Métricas de Productos</h2>
              <p className="text-sm text-muted-foreground">
                Productos más contratados y ofrecidos en visitas
              </p>
            </div>
            <ProductsMetrics />
          </div>
        );
      case 'gestores':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Métricas de Gestores</h2>
              <p className="text-sm text-muted-foreground">
                Rendimiento y tasa de éxito por gestor
              </p>
            </div>
            <GestoresMetrics />
          </div>
        );
      case 'vinculacion':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Evolución de Vinculación</h2>
              <p className="text-sm text-muted-foreground">
                Análisis del porcentaje de vinculación conseguido
              </p>
            </div>
            <VinculacionMetrics />
          </div>
        );
      case 'tpv':
        return <TPVManager />;
      case 'tpv-goals':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Gestión de Objetivos TPV</h2>
              <p className="text-sm text-muted-foreground">
                Crear, editar y eliminar metas de facturación, vinculación y comisiones
              </p>
            </div>
            <TPVGoalsManager />
          </div>
        );
      case 'companies':
        return <CompaniesManager />;
      case 'products':
        return <ProductsManager />;
      case 'users':
        return <UsersManager />;
      case 'templates':
        return <EmailTemplatesManager />;
      case 'colors':
        return <StatusColorsManager />;
      case 'concepts':
        return <ConceptsManager />;
      case 'map-config':
        return <MapTooltipConfig />;
      case 'audit':
        return <AuditLogsViewer />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isCommercialDirector={isCommercialDirector}
          isOfficeDirector={isOfficeDirector}
          isCommercialManager={isCommercialManager}
          isSuperAdmin={isSuperAdmin}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
                <p className="text-muted-foreground">{t('admin.subtitle')}</p>
              </div>
            </div>

            {/* Content */}
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
