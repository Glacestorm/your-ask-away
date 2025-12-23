import { useEffect, useState, useCallback, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Activity, History, Shield, Rocket, Bot, BarChart3, Users, Palette, FileCode2, Eye, MessageSquare, Bell, MessagesSquare, Database, Trophy, Store, ClipboardCheck, Building2, Layers, Zap, ShoppingCart, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';

// Lazy loaded components for better performance
import {
  AdminSectionSkeleton,
  LazyAdminSection,
  CommercialDirectorDashboard,
  OfficeDirectorDashboard,
  CommercialManagerDashboard,
  CommercialManagerAudit,
  GestorDashboard,
  AuditorDashboard,
  VisitsMetrics,
  ProductsMetrics,
  GestoresMetrics,
  VinculacionMetrics,
  CompaniesManager,
  ProductsManager,
  UsersManager,
  TPVManager,
  TPVGoalsManager,
  StatusColorsManager,
  ConceptsManager,
  EmailTemplatesManager,
  MapConfigDashboard,
  SystemHealthMonitor,
  AuditLogsViewer,
  ImportHistoryViewer,
  AlertsManager,
  NotificationPreferences,
  DirectorAlertsPanel,
  AlertHistoryViewer,
  NotificationCenterManager,
  BulkGoalsAssignment,
  GoalsProgressTracker,
  GoalsKPIDashboard,
  KPIReportHistory,
  CascadeGoalsManager,
  SharedVisitsCalendar,
  VisitSheetsGestorComparison,
  VisitSheetValidationPanel,
  ContractedProductsReport,
  MapView,
  GeocodingRecalculator,
  AccountingManager,
  UnifiedMetricsDashboard,
  DynamicTechnicalDocGenerator,
  CompetitorGapAnalysisGenerator,
  AppDetailedStatusGenerator,
  CodebaseIndexGenerator,
  ApplicationStateAnalyzer,
  DORAComplianceDashboard,
  AdaptiveAuthDashboard,
  ISO27001Dashboard,
  PipelineBoard,
  Customer360Panel,
  InternalAssistantChat,
  AIIntegrationConfig,
  RFMDashboard,
  CustomerSegmentationPanel,
  CDPFullDashboard,
  MLExplainabilityPanel,
  AdvancedMLDashboard,
  PredictiveAnalyticsDashboard,
  RoleCopilotPanel,
  NBADashboard,
  ContinuousControlsDashboard,
  SMSManager,
  RealtimeChatPanel,
  CoreBankingManager,
  SPMDashboard,
  AppStoreManager,
  AuditReportingDashboard,
  CNAEPricingCalculator,
  HoldingDashboard,
  CNAEPricingAdmin,
  CNAEDashboard,
  BPMNDesigner,
  ProcessMiningDashboard,
  VerticalPacksManager,
  SectorsManager,
  CoreWebVitalsDashboard,
  TranslationsDashboard,
  WhiteLabelConfig,
  APIDocumentation,
  VisitSheets,
} from '@/components/admin/AdminSectionLoader';

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
      case 'director': return t('admin.sectionTitle.director');
      case 'office-director': return t('admin.sectionTitle.officeDirector');
      case 'commercial-manager': return t('admin.sectionTitle.commercialManager');
      case 'commercial-manager-audit': return t('admin.sectionTitle.commercialManagerAudit');
      case 'gestor-dashboard': return t('admin.sectionTitle.gestorDashboard');
      case 'audit': return t('admin.sectionTitle.audit');
      case 'map': return t('admin.sectionTitle.map');
      case 'visit-sheets': return t('admin.sectionTitle.visitSheets');
      case 'visit-validation': return t('admin.sectionTitle.visitValidation');
      case 'shared-calendar': return t('admin.sectionTitle.sharedCalendar');
      case 'health': return t('admin.sectionTitle.health');
      case 'visits': return t('admin.sectionTitle.visits');
      case 'products-metrics': return t('admin.sectionTitle.productsMetrics');
      case 'gestores': return t('admin.sectionTitle.gestores');
      case 'vinculacion': return t('admin.sectionTitle.vinculacion');
      case 'tpv': return t('admin.sectionTitle.tpv');
      case 'tpv-goals': return t('admin.sectionTitle.tpvGoals');
      case 'companies': return t('admin.sectionTitle.companies');
      case 'products': return t('admin.sectionTitle.products');
      case 'users': return t('admin.sectionTitle.users');
      case 'templates': return t('admin.sectionTitle.templates');
      case 'colors': return t('admin.sectionTitle.colors');
      case 'concepts': return t('admin.sectionTitle.concepts');
      case 'map-config': return t('admin.sectionTitle.mapConfig');
      case 'import-history': return t('admin.sectionTitle.importHistory');
      case 'alerts': return t('admin.sectionTitle.alerts');
      case 'notifications': return t('admin.sectionTitle.notifications');
      case 'bulk-goals': return t('admin.sectionTitle.bulkGoals');
      case 'goals-progress': return t('admin.sectionTitle.goalsProgress');
      case 'director-alerts': return t('admin.sectionTitle.directorAlerts');
      case 'goals-kpi': return t('admin.sectionTitle.goalsKpi');
      case 'kpi-report-history': return t('admin.sectionTitle.kpiReportHistory');
      case 'alert-history': return t('admin.sectionTitle.alertHistory');
      case 'gestor-comparison': return t('admin.sectionTitle.gestorComparison');
      case 'accounting': return t('admin.sectionTitle.accounting');
      case 'administration': return t('admin.title');
      case 'role-selector': return t('admin.sectionTitle.roleSelector');
      case 'geocoding': return t('admin.sectionTitle.geocoding');
      case 'competitor-gap': return t('admin.sectionTitle.competitorGap');
      case 'app-status': return t('admin.sectionTitle.appStatus');
      case 'codebase-index': return t('admin.sectionTitle.codebaseIndex');
      case 'cascade-goals': return t('admin.sectionTitle.cascadeGoals');
      case 'pipeline': return t('admin.sectionTitle.pipeline');
      case 'ai-config': return t('admin.sectionTitle.aiConfig');
      case 'rfm-analysis': return t('admin.sectionTitle.rfmAnalysis');
      case 'customer-segmentation': return t('admin.sectionTitle.customerSegmentation');
      case 'cdp-360': return t('admin.sectionTitle.cdp360');
      case 'ml-explainability': return t('admin.sectionTitle.mlExplainability');
      case 'advanced-ml': return t('admin.sectionTitle.advancedMl');
      case 'sms-manager': return t('admin.sectionTitle.smsManager');
      case 'realtime-chat': return t('admin.sectionTitle.realtimeChat');
      case 'predictive-analytics': return t('admin.sectionTitle.predictiveAnalytics');
      case 'spm-dashboard': return t('admin.sectionTitle.spmDashboard');
      case 'app-store': return t('admin.sectionTitle.appStore');
      case 'cnae-pricing': return t('admin.sectionTitle.cnaePricing');
      case 'cnae-manager': return t('admin.sectionTitle.cnaeManager');
      case 'holding-dashboard': return t('admin.sectionTitle.holdingDashboard');
      case 'cnae-bundles': return t('admin.sectionTitle.cnaeBundles');
      case 'cnae-admin': return t('admin.sectionTitle.cnaeAdmin');
      case 'analyzer': return t('admin.sectionTitle.analyzer');
      case 'translations': return t('admin.sectionTitle.translations');
      case 'bpmn-designer': return t('admin.sectionTitle.bpmnDesigner');
      case 'process-mining': return t('admin.sectionTitle.processMining');
      case 'ai-copilot': return t('admin.sectionTitle.aiCopilot');
      case 'ai-nba': return t('admin.sectionTitle.aiNba');
      case 'ai-controls': return t('admin.sectionTitle.aiControls');
      case 'vertical-packs': return t('admin.sectionTitle.verticalPacks');
      case 'sectors-manager': return t('admin.sectionTitle.sectorsManager');
      case 'web-vitals': return t('admin.sectionTitle.webVitals');
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
      case 'translations':
        if (!isSuperAdmin) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <TranslationsDashboard />;
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
        return <CDPFullDashboard />;
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
      case 'vertical-packs':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <VerticalPacksManager />;
      case 'sectors-manager':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <SectorsManager />;
      case 'web-vitals':
        if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          return (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t('admin.noPermissions')}</p>
              </CardContent>
            </Card>
          );
        }
        return <CoreWebVitalsDashboard />;
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
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10"
                  onClick={() => handleSectionChange('translations')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-teal-700 dark:text-teal-400">{t('admin.card.translations')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.translations.desc')}</p>
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
                <Layers className="h-5 w-5" /> {t('admin.section.processMining')}
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
                      <h4 className="font-medium text-sm text-sky-700 dark:text-sky-400">{t('admin.card.bpmnDesigner')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.bpmnDesigner.desc')}</p>
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
                      <h4 className="font-medium text-sm text-cyan-700 dark:text-cyan-400">{t('admin.card.processMining')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.processMining.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ: IA que Vende - FASE 6 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gradient bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
                <Zap className="h-5 w-5 text-fuchsia-500" /> {t('admin.section.aiSells')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-violet-500/10"
                  onClick={() => handleSectionChange('ai-copilot')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-violet-700 dark:text-violet-400">{t('admin.card.aiCopilot')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.aiCopilot.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-500/10"
                  onClick={() => handleSectionChange('ai-nba')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-fuchsia-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-fuchsia-700 dark:text-fuchsia-400">{t('admin.card.aiNba')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.aiNba.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-pink-500/10"
                  onClick={() => handleSectionChange('ai-controls')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-pink-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-pink-700 dark:text-pink-400">{t('admin.card.aiControls')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.aiControls.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECCIÓ: Verticales CNAE - FASE 7 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gradient bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-500" /> {t('admin.section.verticals')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
                  onClick={() => handleSectionChange('vertical-packs')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-emerald-700 dark:text-emerald-400">{t('admin.card.verticalPacks')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.verticalPacks.desc')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10"
                  onClick={() => handleSectionChange('sectors-manager')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-teal-700 dark:text-teal-400">{t('admin.card.sectorsManager')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.sectorsManager.desc')}</p>
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
                {isSuperAdmin && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10"
                  onClick={() => handleSectionChange('translations')}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-purple-700 dark:text-purple-400">{t('admin.card.translations')}</h4>
                      <p className="text-xs text-muted-foreground">{t('admin.card.translations.desc')}</p>
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
      case 'ai-copilot':
        return <RoleCopilotPanel />;
      case 'ai-nba':
        return <NBADashboard />;
      case 'ai-controls':
        return <ContinuousControlsDashboard />;
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
            <Suspense fallback={<AdminSectionSkeleton />}>
              {renderContent()}
            </Suspense>
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
            <Suspense fallback={<AdminSectionSkeleton />}>
              {renderContent()}
            </Suspense>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
