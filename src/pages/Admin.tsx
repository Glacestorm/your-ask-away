import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Activity, History, Shield, Rocket, Bot, BarChart3, Users, Palette, FileCode2, Eye, MessageSquare, Bell, MessagesSquare, Database, Trophy, Store, ClipboardCheck, Building2, Layers } from 'lucide-react';
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
import { MapConfigDashboard } from '@/components/admin/MapConfigDashboard';
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
import { AppStoreManager } from '@/components/admin/appstore/AppStoreManager';
import { AuditReportingDashboard } from '@/components/admin/auditor-reporting';
import { CNAEPricingCalculator } from '@/components/cnae/CNAEPricingCalculator';
import { HoldingDashboard } from '@/components/cnae/HoldingDashboard';
import { CNAEPricingAdmin } from '@/components/cnae/CNAEPricingAdmin';
import { CNAEDashboard } from '@/components/cnae/CNAEDashboard';
import BPMNDesigner from '@/components/bpmn/BPMNDesigner';
import { ProcessMiningDashboard } from '@/components/bpmn/ProcessMiningDashboard';

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
      case 'app-store': return 'App Store';
      case 'cnae-pricing': return 'Calculadora de Pricing CNAE';
      case 'cnae-manager': return 'Gestió CNAEs per Empresa';
      case 'holding-dashboard': return 'Holding Dashboard 360°';
      case 'cnae-bundles': return 'Packs Sectorials CNAE';
      case 'cnae-admin': return 'Administració Pricing CNAE';
      case 'analyzer': return 'Analitzador de Codi';
      case 'bpmn-designer': return 'Dissenyador de Processos BPMN';
      case 'process-mining': return 'Process Mining Dashboard';
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
              <h2 className="text-2xl font-bold">{t('admin.section.calendar.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.section.calendar.subtitle')}
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
        return <MapConfigDashboard />;
      case 'import-history':
        return (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{t('admin.section.importHistory.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.section.importHistory.subtitle')}
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
              <h2 className="text-2xl font-bold">{t('admin.section.alerts.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.section.alerts.subtitle')}
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
              <h2 className="text-2xl font-bold">{t('admin.section.notificationPrefs.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.section.notificationPrefs.subtitle')}
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
              <h2 className="text-2xl font-bold">{t('admin.section.bulkGoals.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.section.bulkGoals.subtitle')}
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
              <h2 className="text-2xl font-bold">{t('admin.section.goalsProgress.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.section.goalsProgress.subtitle')}
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
              <h2 className="text-2xl font-bold">{t('admin.section.goalsKPI.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.section.goalsKPI.subtitle')}
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
      case 'analyzer':
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
      case 'app-store':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <AppStoreManager />;
      case 'cnae-pricing':
      case 'cnae-manager':
      case 'cnae-bundles':
        return <CNAEDashboard />;
      case 'holding-dashboard':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <HoldingDashboard />;
      case 'cnae-admin':
        if (!isSuperAdmin && !isCommercialDirector) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CNAEPricingAdmin />;
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
      case 'auditor-reporting':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager && !isAuditor) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <AuditReportingDashboard />;
      case 'bpmn-designer':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <BPMNDesigner entityType="opportunity" />;
      case 'process-mining':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <ProcessMiningDashboard entityType="opportunity" />;
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
              <h2 className="text-2xl font-bold">{t('admin.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.subtitle')}
              </p>
            </div>

            {/* SECCIÓ 1: Visió i Comercial */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Rocket className="h-5 w-5" /> {t('admin.section.commercial')}
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
                      <h4 className="font-medium text-sm">{t('admin.card.roleSelector')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.roleSelector.desc')}</p>
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
                      <h4 className="font-medium text-sm">{t('admin.card.pipeline')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.pipeline.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('bulk-goals')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.goals')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.goals.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('tpv')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.tpv')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.tpv.desc')}</p>
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
                      <h4 className="font-medium text-sm">{t('admin.card.rfm')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.rfm.desc')}</p>
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
                      <h4 className="font-medium text-sm">{t('admin.card.segmentation')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.segmentation.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10"
                  onClick={() => handleSectionChange('spm-dashboard')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.spm')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.spm.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 2: Configuració del Sistema */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Activity className="h-5 w-5" /> {t('admin.section.systemConfig')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('users')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.users')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.users.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('products')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.products')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.products.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('map-config')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.map')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.map.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('concepts')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.concepts')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.concepts.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('templates')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.templates')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.templates.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('colors')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.colors')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.colors.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('alerts')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.alerts')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.alerts.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('notifications')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.notifications')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.notifications.desc')}</p>
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
                      <h4 className="font-medium text-sm text-purple-700 dark:text-purple-400">{t('admin.card.internalAI')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.internalAI.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 3: Seguretat i Compliance */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <Shield className="h-5 w-5" /> {t('admin.section.security')}
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
                      <h4 className="font-medium text-sm text-red-700 dark:text-red-400">{t('admin.card.dora')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.dora.desc')}</p>
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
                      <h4 className="font-medium text-sm text-indigo-700 dark:text-indigo-400">{t('admin.card.iso27001')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.iso27001.desc')}</p>
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
                      <h4 className="font-medium text-sm text-cyan-700 dark:text-cyan-400">{t('admin.card.ama')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.ama.desc')}</p>
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
                      <h4 className="font-medium text-sm text-emerald-700 dark:text-emerald-400">{t('admin.card.coreBanking')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.coreBanking.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('health')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.systemHealth')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.systemHealth.desc')}</p>
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
                      <h4 className="font-medium text-sm text-teal-700 dark:text-teal-400">{t('admin.card.cdp360')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.cdp360.desc')}</p>
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
                      <h4 className="font-medium text-sm text-purple-700 dark:text-purple-400">{t('admin.card.mlIA')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.mlIA.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-500/10"
                  onClick={() => handleSectionChange('advanced-ml')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-fuchsia-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-fuchsia-700 dark:text-fuchsia-400">{t('admin.card.advancedML')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.advancedML.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10"
                  onClick={() => handleSectionChange('predictive-analytics')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-amber-700 dark:text-amber-400">{t('admin.card.predictiveKPIs')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.predictiveKPIs.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-500/10"
                  onClick={() => handleSectionChange('auditor-reporting')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <ClipboardCheck className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-orange-700 dark:text-orange-400">{t('admin.card.auditorReporting')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.auditorReporting.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>


            {/* SECCIÓ 5: Comunicació Omnicanal - FASE 3 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-2">
                <MessagesSquare className="h-5 w-5" /> {t('admin.section.omnichannel')}
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
                      <h4 className="font-medium text-sm text-pink-700 dark:text-pink-400">{t('admin.card.sms')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.sms.desc')}</p>
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
                      <h4 className="font-medium text-sm text-violet-700 dark:text-violet-400">{t('admin.card.realtimeChat')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.realtimeChat.desc')}</p>
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
                      <h4 className="font-medium text-sm text-orange-700 dark:text-orange-400">{t('admin.card.pushNotifications')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.pushNotifications.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ: Process Mining & BPMN */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-2">
                <Layers className="h-5 w-5" /> Process Mining & BPMN
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-sky-500/10"
                  onClick={() => handleSectionChange('bpmn-designer')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-sky-500/20 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-sky-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-sky-700 dark:text-sky-400">Dissenyador BPMN</h4>
                      <p className="text-xs text-muted-foreground">Crea i edita processos de negoci</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"
                  onClick={() => handleSectionChange('process-mining')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-cyan-700 dark:text-cyan-400">Process Mining</h4>
                      <p className="text-xs text-muted-foreground">Analitza i optimitza processos</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ 6: Eines i Historial */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <History className="h-5 w-5" /> {t('admin.section.tools')}
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
                      <h4 className="font-medium text-sm text-amber-700 dark:text-amber-400">{t('admin.card.geocoding')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.geocoding.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSectionChange('import-history')}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <History className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t('admin.card.imports')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.imports.desc')}</p>
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
                      <h4 className="font-medium text-sm text-green-700 dark:text-green-400">{t('admin.card.internalAssistant')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.internalAssistant.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                )}
                {(isSuperAdmin || isCommercialDirector || isCommercialManager) && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10"
                  onClick={() => handleSectionChange('analyzer')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-blue-700 dark:text-blue-400">{t('admin.card.analyzer')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.analyzer.desc')}</p>
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
              <h2 className="text-2xl font-bold">{t('admin.roleSelector.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('admin.roleSelector.subtitle')}
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
                    <h3 className="font-semibold text-lg">{t('admin.roleSelector.director')}</h3>
                    <p className="text-sm text-muted-foreground">{t('admin.roleSelector.director.desc')}</p>
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
                    <h3 className="font-semibold text-lg">{t('admin.roleSelector.officeDirector')}</h3>
                    <p className="text-sm text-muted-foreground">{t('admin.roleSelector.officeDirector.desc')}</p>
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
                    <h3 className="font-semibold text-lg">{t('admin.roleSelector.commercialManager')}</h3>
                    <p className="text-sm text-muted-foreground">{t('admin.roleSelector.commercialManager.desc')}</p>
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
                    <h3 className="font-semibold text-lg">{t('admin.roleSelector.gestor')}</h3>
                    <p className="text-sm text-muted-foreground">{t('admin.roleSelector.gestor.desc')}</p>
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
                    <h3 className="font-semibold text-lg">{t('admin.roleSelector.auditor')}</h3>
                    <p className="text-sm text-muted-foreground">{t('admin.roleSelector.auditor.desc')}</p>
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
                    <h3 className="font-semibold text-lg text-red-700 dark:text-red-400">{t('admin.roleSelector.dora')}</h3>
                    <p className="text-sm text-muted-foreground">{t('admin.roleSelector.dora.desc')}</p>
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
                    <h3 className="font-semibold text-lg text-cyan-700 dark:text-cyan-400">{t('admin.card.ama')}</h3>
                    <p className="text-sm text-muted-foreground">{t('admin.card.ama.desc')}</p>
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
