import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Activity } from 'lucide-react';
import { toast } from 'sonner';
import VisitSheets from '@/pages/VisitSheets';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';
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
import { ImportHistoryViewer } from '@/components/admin/ImportHistoryViewer';
import { GestorDashboard } from '@/components/admin/GestorDashboard';
import { AuditorDashboard } from '@/components/admin/AuditorDashboard';
import { AlertsManager } from '@/components/dashboard/AlertsManager';
import { NotificationPreferences } from '@/components/dashboard/NotificationPreferences';
import { SharedVisitsCalendar } from '@/components/admin/SharedVisitsCalendar';
import { BulkGoalsAssignment } from '@/components/admin/BulkGoalsAssignment';
import GoalsProgressTracker from '@/components/admin/GoalsProgressTracker';
import { DirectorAlertsPanel } from '@/components/admin/DirectorAlertsPanel';
import GoalsKPIDashboard from '@/components/admin/GoalsKPIDashboard';
import { KPIReportHistory } from '@/components/admin/KPIReportHistory';
import { AlertHistoryViewer } from '@/components/admin/AlertHistoryViewer';
import { VisitSheetsGestorComparison } from '@/components/admin/VisitSheetsGestorComparison';
import VisitSheetValidationPanel from '@/components/admin/VisitSheetValidationPanel';
import ContractedProductsReport from '@/components/admin/ContractedProductsReport';
import MapView from './MapView';
import AccountingManager from '@/components/admin/accounting/AccountingManager';

const Admin = () => {
  const { user, isAdmin, isSuperAdmin, isCommercialDirector, isOfficeDirector, isCommercialManager, isAuditor, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get('section') || 'director';
  const [activeSection, setActiveSection] = useState(initialSection);
  
  // Navigation history
  const { canGoBack, canGoForward, goBack, goForward, push } = useNavigationHistory(initialSection);

  // Sync URL with active section - always prioritize URL
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section');
    if (sectionFromUrl && sectionFromUrl !== activeSection) {
      setActiveSection(sectionFromUrl);
      push(sectionFromUrl);
    }
  }, [searchParams]);

  // Update URL when section changes
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    setSearchParams({ section });
    push(section);
  }, [setSearchParams, push]);

  // Navigation history handlers
  const handleGoBack = useCallback(() => {
    const previousSection = goBack();
    if (previousSection) {
      setActiveSection(previousSection);
      setSearchParams({ section: previousSection });
    }
  }, [goBack, setSearchParams]);

  const handleGoForward = useCallback(() => {
    const nextSection = goForward();
    if (nextSection) {
      setActiveSection(nextSection);
      setSearchParams({ section: nextSection });
    }
  }, [goForward, setSearchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      toast.error(t('admin.noPermissions'));
    }
  }, [user, authLoading, navigate, t]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'director': return 'Director de Negoci';
      case 'office-director': return "Director d'Oficina";
      case 'commercial-manager': return 'Responsable Comercial';
      case 'commercial-manager-audit': return 'Auditoria Comercial';
      case 'gestor-dashboard': return 'Gestor Empresa / Retail';
      case 'audit': return 'Auditor';
      case 'map': return 'Mapa';
      case 'visit-sheets': return 'Fitxes de Visita';
      case 'visit-validation': return 'Validació de Fitxes';
      case 'shared-calendar': return 'Calendari de Visites';
      case 'health': return 'Estat del Sistema';
      case 'visits': return 'Mètriques de Visites';
      case 'products-metrics': return 'Mètriques de Productes';
      case 'gestores': return 'Mètriques de Gestors';
      case 'vinculacion': return 'Mètriques de Vinculació';
      case 'tpv': return 'Gestió TPV';
      case 'tpv-goals': return 'Objectius TPV';
      case 'companies': return 'Gestió d\'Empreses';
      case 'products': return 'Gestió de Productes';
      case 'users': return 'Gestió d\'Usuaris';
      case 'templates': return 'Plantilles de Correu';
      case 'colors': return 'Colors d\'Estat';
      case 'concepts': return 'Conceptes';
      case 'map-config': return 'Configuració del Mapa';
      case 'import-history': return 'Historial d\'Importacions';
      case 'alerts': return 'Gestió d\'Alertes';
      case 'notifications': return 'Preferències de Notificacions';
      case 'bulk-goals': return 'Assignació Massiva d\'Objectius';
      case 'goals-progress': return 'Seguiment d\'Objectius';
      case 'director-alerts': return 'Alertes d\'Objectius en Risc';
      case 'goals-kpi': return 'Dashboard KPI d\'Objectius';
      case 'kpi-report-history': return 'Historial d\'Informes KPI';
      case 'alert-history': return 'Historial d\'Alertes';
      case 'gestor-comparison': return 'Comparativa de Gestores';
      case 'accounting': return 'Comptabilitat';
      default: return '';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'director':
        if (!isCommercialDirector && !isSuperAdmin && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
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
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
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
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
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
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CommercialManagerAudit />;
      case 'gestor-dashboard':
        return <GestorDashboard 
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
        />;
      case 'audit':
        return <AuditorDashboard />;
      case 'map':
        return (
          <MapView 
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
          />
        );
      case 'visit-sheets':
        return <VisitSheets />;
      case 'visit-validation':
        if (!isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <VisitSheetValidationPanel />;
      case 'contracted-products':
        return (
          <div className="rounded-lg border bg-card p-6">
            <ContractedProductsReport />
          </div>
        );
      case 'shared-calendar':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Calendario de Visitas</h2>
              <p className="text-sm text-muted-foreground">
                Visualiza todas tus visitas individuales y conjuntas en un calendario compartido
              </p>
            </div>
            <SharedVisitsCalendar />
          </div>
        );
      case 'health':
        return <SystemHealthMonitor />;
      case 'visits':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{t('section.visits.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('section.visits.subtitle')}
              </p>
            </div>
            <VisitsMetrics />
          </div>
        );
      case 'products-metrics':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{t('section.products.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('section.products.subtitle')}
              </p>
            </div>
            <ProductsMetrics />
          </div>
        );
      case 'gestores':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{t('section.managers.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('section.managers.subtitle')}
              </p>
            </div>
            <GestoresMetrics />
          </div>
        );
      case 'vinculacion':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{t('section.linkage.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('section.linkage.subtitle')}
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
              <h2 className="text-2xl font-bold">{t('tpv.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('tpv.subtitle')}
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
      case 'import-history':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Historial de Importaciones</h2>
              <p className="text-sm text-muted-foreground">
                Consulta y exporta el historial completo de importaciones de empresas
              </p>
            </div>
            <ImportHistoryViewer />
          </div>
        );
      case 'alerts':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Gestió d'Alertes</h2>
              <p className="text-sm text-muted-foreground">
                Configura alertes automàtiques per mètriques clau del negoci
              </p>
            </div>
            <AlertsManager />
          </div>
        );
      case 'notifications':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Preferències de Notificacions</h2>
              <p className="text-sm text-muted-foreground">
                Personalitza com i quan reps notificacions d'alertes
              </p>
            </div>
            <NotificationPreferences />
          </div>
        );
      case 'bulk-goals':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Assignació Massiva d'Objectius</h2>
              <p className="text-sm text-muted-foreground">
                Assigna objectius a múltiples gestors simultàniament
              </p>
            </div>
            <BulkGoalsAssignment />
          </div>
        );
      case 'goals-progress':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Seguiment d'Objectius</h2>
              <p className="text-sm text-muted-foreground">
                Visualitza el progrés en temps real de tots els gestors
              </p>
            </div>
            <GoalsProgressTracker />
          </div>
        );
      case 'director-alerts':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <DirectorAlertsPanel />;
      case 'goals-kpi':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Dashboard KPI d'Objectius</h2>
              <p className="text-sm text-muted-foreground">
                Resum visual dels indicadors clau de rendiment de tots els objectius actius
              </p>
            </div>
            <GoalsKPIDashboard />
          </div>
        );
      case 'kpi-report-history':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <KPIReportHistory />;
      case 'alert-history':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <AlertHistoryViewer />;
      case 'gestor-comparison':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <VisitSheetsGestorComparison />;
      case 'accounting':
        if (isAuditor) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <AccountingManager />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          isCommercialDirector={isCommercialDirector}
          isOfficeDirector={isOfficeDirector}
          isCommercialManager={isCommercialManager}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          isAuditor={isAuditor}
        />
        
        <main className={`flex-1 ${activeSection === 'map' ? 'flex flex-col overflow-hidden' : 'overflow-auto'} bg-background`}>
          {activeSection === 'map' ? (
            <div className="flex-1 flex flex-col h-full">
              {renderContent()}
            </div>
          ) : (
          <div className="p-6 space-y-6 w-full">
              {activeSection !== 'gestor-dashboard' && (
                <GlobalNavHeader 
                  title={getSectionTitle()}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                  onGoBack={handleGoBack}
                  onGoForward={handleGoForward}
                />
              )}
              {renderContent()}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
