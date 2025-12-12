import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Activity, History, Shield, Rocket, Bot, BarChart3, Users, Palette, FileCode2, Eye, MessageSquare, Bell, MessagesSquare, Database } from 'lucide-react';
import { toast } from 'sonner';
import VisitSheets from '@/pages/VisitSheets';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';
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
import { UnifiedMetricsDashboard } from '@/components/dashboard/UnifiedMetricsDashboard';
import { DynamicTechnicalDocGenerator } from '@/components/reports/DynamicTechnicalDocGenerator';
import { CompetitorGapAnalysisGenerator } from '@/components/reports/CompetitorGapAnalysisGenerator';
import { AppDetailedStatusGenerator } from '@/components/reports/AppDetailedStatusGenerator';
import { GeocodingRecalculator } from '@/components/admin/GeocodingRecalculator';
import { CascadeGoalsManager } from '@/components/admin/CascadeGoalsManager';
import { CodebaseIndexGenerator } from '@/components/reports/CodebaseIndexGenerator';
import { ApplicationStateAnalyzer } from '@/components/admin/ApplicationStateAnalyzer';
import { DORAComplianceDashboard } from '@/components/admin/DORAComplianceDashboard';
import { AdaptiveAuthDashboard } from '@/components/admin/AdaptiveAuthDashboard';
import { ISO27001Dashboard } from '@/components/admin/ISO27001Dashboard';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { InternalAssistantChat } from '@/components/admin/InternalAssistantChat';
import { AIIntegrationConfig } from '@/components/admin/AIIntegrationConfig';
import { NotificationCenterManager } from '@/components/admin/NotificationCenterManager';
import { RFMDashboard } from '@/components/admin/RFMDashboard';
import { CustomerSegmentationPanel } from '@/components/admin/CustomerSegmentationPanel';
import WhiteLabelConfig from '@/components/admin/WhiteLabelConfig';
import APIDocumentation from '@/components/admin/APIDocumentation';
import { Customer360Panel } from '@/components/admin/Customer360Panel';
import { MLExplainabilityPanel } from '@/components/admin/MLExplainabilityPanel';
import { AdvancedMLDashboard } from '@/components/admin/AdvancedMLDashboard';
import { SMSManager } from '@/components/admin/SMSManager';
import { RealtimeChatPanel } from '@/components/chat/RealtimeChatPanel';
import { CoreBankingManager } from '@/components/admin/CoreBankingManager';
import { PredictiveAnalyticsDashboard } from '@/components/admin/PredictiveAnalyticsDashboard';
import { SPMDashboard } from '@/components/admin/spm/SPMDashboard';

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
      case 'accounting': return 'Comptabilitat | Organigrama Comptable Corporate / Empreses';
      case 'administration': return 'Administració';
      case 'role-selector': return 'Selector de Visió';
      case 'geocoding': return 'Recalcular Geolocalització';
      case 'competitor-gap': return 'Anàlisi Competència i Millores';
      case 'app-status': return 'Estat Detallat de l\'Aplicació';
      case 'codebase-index': return 'Índex de Funcionalitats del Codi';
      case 'cascade-goals': return 'Objectius en Cascada';
      case 'pipeline': return 'Pipeline de Oportunidades';
      case 'ai-config': return 'Configuració IA Interna';
      case 'rfm-analysis': return 'Anàlisi RFM';
      case 'customer-segmentation': return 'Segmentació de Clients ML';
      case 'cdp-360': return 'Customer Data Platform 360°';
      case 'ml-explainability': return 'ML Explainability (SHAP/LIME)';
      case 'advanced-ml': return 'ML Avançat (Ensemble + A/B)';
      case 'sms-manager': return 'Gestió SMS';
      case 'realtime-chat': return 'Chat en Temps Real';
      case 'predictive-analytics': return 'Analítica Predictiva i KPIs';
      case 'spm-dashboard': return 'Sales Performance Management';
      default: return '';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'pipeline':
        return <PipelineBoard />;
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
      case 'filtered-metrics':
        return <UnifiedMetricsDashboard />;
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
        return <NotificationCenterManager />;
      case 'notification-preferences':
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
      case 'technical-docs':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <DynamicTechnicalDocGenerator />;
      case 'competitor-gap':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CompetitorGapAnalysisGenerator />;
      case 'app-status':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <ApplicationStateAnalyzer />;
      case 'codebase-index':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CodebaseIndexGenerator />;
      case 'dora-compliance':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <DORAComplianceDashboard />;
      case 'adaptive-auth':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <AdaptiveAuthDashboard />;
      case 'iso27001':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <ISO27001Dashboard />;
      case 'core-banking':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CoreBankingManager />;
      case 'cdp-360':
        return <Customer360Panel />;
      case 'ml-explainability':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <MLExplainabilityPanel />;
      case 'advanced-ml':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <AdvancedMLDashboard />;
      case 'internal-assistant':
        if (isAuditor) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <InternalAssistantChat />;
      case 'sms-manager':
        return <SMSManager />;
      case 'realtime-chat':
        return <RealtimeChatPanel />;
      case 'predictive-analytics':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <PredictiveAnalyticsDashboard />;
      case 'spm-dashboard':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <SPMDashboard />;
      case 'cascade-goals':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CascadeGoalsManager />;
      case 'ai-config':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <AIIntegrationConfig />;
      case 'rfm-analysis':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <RFMDashboard />;
      case 'customer-segmentation':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isOfficeDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CustomerSegmentationPanel />;
      case 'whitelabel':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <WhiteLabelConfig />;
      case 'api-docs':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <APIDocumentation />;
case 'administration':
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
          <div className="rounded-lg border bg-card p-6 space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Administració</h2>
              <p className="text-sm text-muted-foreground">
                Gestió d'usuaris, productes, objectius i configuració del sistema
              </p>
            </div>

            {/* SECCIÓ 1: Visió i Comercial */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Rocket className="h-5 w-5" /> Comercial i Oportunitats
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
                  onClick={() => handleSectionChange('role-selector')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Selector de Visió</h4>
                      <p className="text-xs text-muted-foreground">Escull rol</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10"
                  onClick={() => handleSectionChange('pipeline')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Pipeline Oportunitats</h4>
                      <p className="text-xs text-muted-foreground">CRM comercial</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('bulk-goals')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Objectius</h4>
                      <p className="text-xs text-muted-foreground">Assignar i seguiment</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('tpv')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">TPV</h4>
                      <p className="text-xs text-muted-foreground">Terminals i objectius</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-violet-500/10"
                  onClick={() => handleSectionChange('rfm-analysis')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Anàlisi RFM</h4>
                      <p className="text-xs text-muted-foreground">Recency, Frequency, Monetary</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-pink-500/10"
                  onClick={() => handleSectionChange('customer-segmentation')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <Users className="h-4 w-4 text-pink-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Segmentació ML</h4>
                      <p className="text-xs text-muted-foreground">SVM + CART</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 2: Configuració del Sistema */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Activity className="h-5 w-5" /> Configuració del Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('users')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Usuaris</h4>
                      <p className="text-xs text-muted-foreground">Gestió d'usuaris</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('products')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Productes</h4>
                      <p className="text-xs text-muted-foreground">Catàleg bancari</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('map-config')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Mapa</h4>
                      <p className="text-xs text-muted-foreground">Capes i tooltips</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('concepts')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Conceptes</h4>
                      <p className="text-xs text-muted-foreground">Definicions sistema</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('templates')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Plantilles Email</h4>
                      <p className="text-xs text-muted-foreground">Templates correu</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('colors')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Colors d'Estat</h4>
                      <p className="text-xs text-muted-foreground">Configurar colors</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('alerts')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Alertes</h4>
                      <p className="text-xs text-muted-foreground">Automàtiques</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('notifications')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Notificacions</h4>
                      <p className="text-xs text-muted-foreground">Preferències</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10"
                  onClick={() => handleSectionChange('ai-config')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-purple-700 dark:text-purple-400">IA Interna</h4>
                      <p className="text-xs text-muted-foreground">Integració model IA banc</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"
                  onClick={() => handleSectionChange('whitelabel')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-cyan-700 dark:text-cyan-400">White-Label</h4>
                      <p className="text-xs text-muted-foreground">Personalització marca</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
                  onClick={() => handleSectionChange('api-docs')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <FileCode2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-emerald-700 dark:text-emerald-400">API REST</h4>
                      <p className="text-xs text-muted-foreground">Documentació OpenAPI</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 3: Seguretat i Compliance */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <Shield className="h-5 w-5" /> Seguretat i Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10"
                  onClick={() => handleSectionChange('dora-compliance')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-red-700 dark:text-red-400">DORA / NIS2</h4>
                      <p className="text-xs text-muted-foreground">Resiliència digital</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10"
                  onClick={() => handleSectionChange('iso27001')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-indigo-700 dark:text-indigo-400">ISO 27001</h4>
                      <p className="text-xs text-muted-foreground">Annex A controls</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"
                  onClick={() => handleSectionChange('adaptive-auth')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-cyan-700 dark:text-cyan-400">AMA / MFA</h4>
                      <p className="text-xs text-muted-foreground">Autenticació adaptativa</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
                  onClick={() => handleSectionChange('core-banking')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Database className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-emerald-700 dark:text-emerald-400">Core Banking</h4>
                      <p className="text-xs text-muted-foreground">Integració PSD3/VRP</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('health')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Salut Sistema</h4>
                      <p className="text-xs text-muted-foreground">Monitoratge AI</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10"
                  onClick={() => handleSectionChange('cdp-360')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <Eye className="h-4 w-4 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-teal-700 dark:text-teal-400">CDP 360°</h4>
                      <p className="text-xs text-muted-foreground">Customer Data Platform</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10"
                  onClick={() => handleSectionChange('ml-explainability')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-purple-700 dark:text-purple-400">ML / IA</h4>
                      <p className="text-xs text-muted-foreground">SHAP/LIME Explainability</p>
                    </div>
                  </CardContent>
                </Card>
                {/* ML Avançat - FASE 2 */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-500/10"
                  onClick={() => handleSectionChange('advanced-ml')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-fuchsia-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-fuchsia-700 dark:text-fuchsia-400">ML Avançat</h4>
                      <p className="text-xs text-muted-foreground">Ensemble + A/B Testing</p>
                    </div>
                  </CardContent>
                </Card>
                {/* Predictive Analytics - FASE 5 */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10"
                  onClick={() => handleSectionChange('predictive-analytics')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-amber-700 dark:text-amber-400">KPIs Predictius</h4>
                      <p className="text-xs text-muted-foreground">50+ indicadors + forecast</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 4: Documentació i Anàlisi */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Activity className="h-5 w-5" /> Documentació i Anàlisi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
                  onClick={() => handleSectionChange('technical-docs')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-emerald-700 dark:text-emerald-400">Doc. Tècnica</h4>
                      <p className="text-xs text-muted-foreground">PDF complet</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10"
                  onClick={() => handleSectionChange('competitor-gap')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-purple-700 dark:text-purple-400">Competència</h4>
                      <p className="text-xs text-muted-foreground">Gap analysis</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10"
                  onClick={() => handleSectionChange('app-status')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-blue-700 dark:text-blue-400">Estat App</h4>
                      <p className="text-xs text-muted-foreground">Mòduls i progrés</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10"
                  onClick={() => handleSectionChange('codebase-index')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-teal-700 dark:text-teal-400">Índex Codi</h4>
                      <p className="text-xs text-muted-foreground">Funcionalitats</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 5: Comunicació Omnicanal - FASE 3 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-2">
                <MessagesSquare className="h-5 w-5" /> Comunicació Omnicanal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-pink-500/10"
                  onClick={() => handleSectionChange('sms-manager')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-pink-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-pink-700 dark:text-pink-400">SMS Gateway</h4>
                      <p className="text-xs text-muted-foreground">Plantilles i enviaments</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-violet-500/10"
                  onClick={() => handleSectionChange('realtime-chat')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <MessagesSquare className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-violet-700 dark:text-violet-400">Chat Temps Real</h4>
                      <p className="text-xs text-muted-foreground">Sales i missatges</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-500/10"
                  onClick={() => handleSectionChange('notifications')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-orange-700 dark:text-orange-400">Push Notifications</h4>
                      <p className="text-xs text-muted-foreground">Web i mòbil</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 6: Eines i Historial */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <History className="h-5 w-5" /> Eines i Historial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10"
                  onClick={() => handleSectionChange('geocoding')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-amber-700 dark:text-amber-400">Geolocalització</h4>
                      <p className="text-xs text-muted-foreground">Recalcular coords</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('import-history')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <History className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Importacions</h4>
                      <p className="text-xs text-muted-foreground">Historial empreses</p>
                    </div>
                  </CardContent>
                </Card>
                {!isAuditor && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10"
                  onClick={() => handleSectionChange('internal-assistant')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-green-700 dark:text-green-400">Asistente IA</h4>
                      <p className="text-xs text-muted-foreground">Chat intern intel·ligent</p>
                    </div>
                  </CardContent>
                </Card>
                )}
              </div>
            </div>
          </div>
        );
      case 'role-selector':
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
              <h2 className="text-2xl font-bold">Selector de Visió</h2>
              <p className="text-sm text-muted-foreground">
                Escull el rol per visualitzar el seu dashboard corresponent
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => handleSectionChange('director')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Director de Negoci</h3>
                    <p className="text-sm text-muted-foreground">Visió global del negoci</p>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => handleSectionChange('office-director')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Director d'Oficina</h3>
                    <p className="text-sm text-muted-foreground">Gestió de l'oficina</p>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => handleSectionChange('commercial-manager')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Responsable Comercial</h3>
                    <p className="text-sm text-muted-foreground">Gestió comercial</p>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => handleSectionChange('gestor-dashboard')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Gestor</h3>
                    <p className="text-sm text-muted-foreground">Dashboard personal</p>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => handleSectionChange('audit')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Auditor</h3>
                    <p className="text-sm text-muted-foreground">Auditoria i registres</p>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-red-500/50 border-2 border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10"
                onClick={() => handleSectionChange('dora-compliance')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-red-700 dark:text-red-400">DORA / NIS2</h3>
                    <p className="text-sm text-muted-foreground">Compliment normatiu bancari</p>
                  </div>
                </CardContent>
              </Card>
              {/* AMA - Autenticación Multifactor Adaptativa */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all hover:border-cyan-500/50 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"
                onClick={() => handleSectionChange('adaptive-auth')}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-cyan-700 dark:text-cyan-400">AMA</h3>
                    <p className="text-sm text-muted-foreground">Autenticació Multifactor Adaptativa</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'geocoding':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <GeocodingRecalculator />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <main className={`flex-1 ${activeSection === 'map' ? 'flex flex-col overflow-hidden' : 'overflow-auto'}`}>
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
  );
};

export default Admin;
