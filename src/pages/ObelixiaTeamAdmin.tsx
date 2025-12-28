import React, { useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, Euro, Package, Receipt, 
  BarChart3, Code, 
  Store, Layers, BookOpen, Activity, Rocket,
  GraduationCap, Languages, Briefcase, Gauge, ClipboardList,
  Leaf, Globe, Bot, Building2, HeartPulse, Headphones,
  Bell, MonitorCheck, Zap, Users, TrendingUp, ShieldCheck,
  AlertTriangle, LineChart, Key, Workflow, Target, Brain, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { ContentManager } from '@/components/obelixia-admin/ContentManager';
import { ModulePricingManager } from '@/components/obelixia-admin/ModulePricingManager';
import { InvoiceManager } from '@/components/obelixia-admin/InvoiceManager';
import QuoteManager from '@/components/admin/quotes/QuoteManager';
import { DynamicTechnicalDocGenerator } from '@/components/reports/DynamicTechnicalDocGenerator';
import { CompetitorGapAnalysisGenerator } from '@/components/reports/CompetitorGapAnalysisGenerator';
import { AppDetailedStatusGenerator } from '@/components/reports/AppDetailedStatusGenerator';
import { CodebaseIndexGenerator } from '@/components/reports/CodebaseIndexGenerator';
import { ApplicationStateAnalyzer } from '@/components/admin/ApplicationStateAnalyzer';
import { AuditImprovementsTracker } from '@/components/admin/AuditImprovementsTracker';
import { AppStoreManager } from '@/components/admin/appstore/AppStoreManager';
import { CNAEPricingAdmin } from '@/components/cnae/CNAEPricingAdmin';
import { CNAEDashboard } from '@/components/cnae/CNAEDashboard';
import WhiteLabelConfig from '@/components/admin/WhiteLabelConfig';
import APIDocumentation from '@/components/admin/APIDocumentation';
import { CMSDashboard } from '@/components/cms-admin';
import SecurityOnboardingGuide from '@/components/obelixia-admin/SecurityOnboardingGuide';
import { NewsAdminDashboard } from '@/components/obelixia-admin/news';
import { FAQAdminDashboard } from '@/components/obelixia-admin/faq';
import { TranslationsDashboard } from '@/components/admin/translations/TranslationsDashboard';
import { VerticalPacksManager } from '@/components/admin/verticals/VerticalPacksManager';
import { SectorsManager } from '@/components/admin/SectorsManager';
import { CoreWebVitalsDashboard } from '@/components/admin/CoreWebVitalsDashboard';
import AcademiaAdminPage from '@/pages/admin/AcademiaAdminPage';
import DemoRequestsPage from '@/pages/admin/DemoRequestsPage';
import { 
  ModuleDashboardPanel, 
  ModuleNotificationsPanel, 
  ModuleMonitoringPanel, 
  ModulePerformancePanel 
} from '@/components/admin/module-studio';

// Lazy loaded components for new tabs
import { lazy, Suspense } from 'react';
const RFMDashboard = lazy(() => import('@/components/admin/RFMDashboard').then(m => ({ default: m.RFMDashboard })));
const PredictiveAnalyticsDashboard = lazy(() => import('@/components/admin/PredictiveAnalyticsDashboard').then(m => ({ default: m.PredictiveAnalyticsDashboard })));
const ISO27001Dashboard = lazy(() => import('@/components/admin/ISO27001Dashboard').then(m => ({ default: m.ISO27001Dashboard })));
const DORAComplianceDashboard = lazy(() => import('@/components/admin/DORAComplianceDashboard').then(m => ({ default: m.DORAComplianceDashboard })));
const AdaptiveAuthDashboard = lazy(() => import('@/components/admin/AdaptiveAuthDashboard').then(m => ({ default: m.AdaptiveAuthDashboard })));
const AdvancedMLDashboard = lazy(() => import('@/components/admin/AdvancedMLDashboard').then(m => ({ default: m.AdvancedMLDashboard })));
const SystemHealthMonitor = lazy(() => import('@/components/admin/SystemHealthMonitor').then(m => ({ default: m.SystemHealthMonitor })));
const MetricsExplorer = lazy(() => import('@/components/admin/MetricsExplorer').then(m => ({ default: m.MetricsExplorer })));
const SystemHelpPanel = lazy(() => import('@/components/obelixia-admin/SystemHelpPanel').then(m => ({ default: m.SystemHelpPanel })));

// Premium components
import { ObelixiaAdminSidebar } from '@/components/obelixia-admin/ObelixiaAdminSidebar';
import { ObelixiaAdminHeader } from '@/components/obelixia-admin/ObelixiaAdminHeader';
import { ObelixiaStatsBar } from '@/components/obelixia-admin/ObelixiaStatsBar';
import { ObelixiaContentArea } from '@/components/obelixia-admin/ObelixiaContentArea';
import { ObelixiaAdminCard3D } from '@/components/obelixia-admin/ObelixiaAdminCard3D';
import { ObelixiaViewToggle } from '@/components/obelixia-admin/ObelixiaViewToggle';
import { useObelixiaAdminPreferences } from '@/hooks/useObelixiaAdminPreferences';
import { cn } from '@/lib/utils';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const ObelixiaTeamAdmin: React.FC = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'quotes';
  
  // Use preferences hook for persistent settings
  const {
    theme,
    viewMode,
    sidebarCollapsed,
    toggleTheme,
    toggleViewMode,
    setSidebarCollapsed
  } = useObelixiaAdminPreferences();
  
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const isDark = theme === 'dark';
  const isCompact = viewMode === 'compact';

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    // Module Studio y AI Local tienen sus propias páginas dedicadas
    if (tab === 'module-studio') {
      navigate('/obelixia-admin/module-studio');
      return;
    }
    if (tab === 'ai-local') {
      navigate('/obelixia-admin/ai-local');
      return;
    }
    if (tab === 'automation-engine') {
      navigate('/obelixia-admin/automation-engine');
      return;
    }
    if (tab === 'service-quotes') {
      navigate('/admin/service-quotes');
      return;
    }
    if (tab === 'crm-migration') {
      navigate('/admin/crm-migration');
      return;
    }
    if (tab === 'marketplace') {
      navigate('/admin/marketplace');
      return;
    }
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getTabLabel = (tab: string): string => {
    const labels: Record<string, string> = {
      quotes: 'Presupuestos',
      invoices: 'Facturas',
      pricing: 'Precios',
      'demo-requests': 'Solicitudes Demo',
      'service-quotes': 'Cotizaciones Servicio',
      'crm-migration': 'CRM Migration',
      content: 'Contenidos',
      cms: 'CMS',
      docs: 'Documentación',
      appstore: 'App Store',
      'module-studio': 'Module Studio',
      whitelabel: 'White Label',
      marketplace: 'Marketplace',
      api: 'API',
      academia: 'Academia',
      translations: 'Traducciones',
      verticals: 'Verticales',
      'web-vitals': 'Web Vitals',
      reports: 'Reportes',
      news: 'Noticias',
      faq: 'FAQ',
      security: 'Seguridad',
      'system-health': 'System Health',
      'error-dashboard': 'Errors Dashboard',
      // Nuevos módulos Estrategia & Datos
      'esg': 'ESG & Sostenibilidad',
      'market-intelligence': 'Market Intelligence',
      'ai-agents-specific': 'Agentes IA',
      'enterprise-dashboard': 'Enterprise Dashboard',
      'cs-metrics': 'CS Metrics Hub',
      'remote-support': 'Soporte Remoto',
      'rfm-dashboard': 'RFM Analysis',
      'predictive-analytics': 'Predictive Analytics',
      // Compliance & ML
      'iso27001': 'ISO 27001',
      'dora-compliance': 'DORA Compliance',
      'adaptive-auth': 'Adaptive Auth',
      'advanced-ml': 'Advanced ML',
      // Nuevos módulos Operaciones
      'module-dashboard': 'Dashboard Módulos',
      'module-notifications': 'Notificaciones',
      'module-monitoring': 'Monitoreo',
      'module-performance': 'Performance',
      'metrics-explorer': 'Metrics Explorer',
      'automation-engine': 'Automation Engine',
    };
    return labels[tab] || tab;
  };

  if (!isSuperAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const stats = [
    { id: 'quotes', label: 'Presupuestos Activos', value: 12, icon: FileText, color: 'blue' as const, trend: { value: 8, isPositive: true } },
    { id: 'invoices', label: 'Facturas Pendientes', value: 5, icon: Receipt, color: 'amber' as const, trend: { value: 2, isPositive: false } },
    { id: 'modules', label: 'Módulos Activos', value: 9, icon: Package, color: 'emerald' as const, trend: { value: 12, isPositive: true } },
    { id: 'revenue', label: 'Ingresos Mes', value: 45000, icon: Euro, color: 'purple' as const, prefix: '€', trend: { value: 15, isPositive: true } },
  ];


  const appstoreCards = [
    { id: 'appstore-manager', title: 'Gestión App Store', description: 'Administrar módulos disponibles', icon: Store, color: 'cyan' as const },
    { id: 'cnae-dashboard', title: 'Multi-CNAE Dashboard', description: 'Gestión multi-sector y pricing dinámico', icon: Layers, color: 'emerald' as const },
    { id: 'cnae-admin', title: 'Pricing CNAE', description: 'Configurar precios por sector y bundles', icon: Euro, color: 'amber' as const },
  ];

  const verticalCards = [
    { id: 'vertical-packs-manager', title: 'Packs Verticales', description: 'Gestión de soluciones por sector', icon: Package, color: 'emerald' as const },
    { id: 'sectors-manager', title: 'Gestión Sectores', description: 'Administrar sectores y CNAE', icon: Briefcase, color: 'teal' as const },
  ];

  const reportCards = [
    { id: 'technical-docs', title: 'Documentación Técnica', description: 'Generar documentación completa', icon: FileText, color: 'emerald' as const },
    { id: 'competitor-gap', title: 'Análisis Competencia', description: 'Gap analysis vs competidores', icon: BarChart3, color: 'purple' as const },
    { id: 'app-status', title: 'Estado Aplicación', description: 'Estado detallado del sistema', icon: Activity, color: 'blue' as const },
    { id: 'codebase-index', title: 'Índice Codebase', description: 'Índice de funcionalidades', icon: Code, color: 'teal' as const },
    { id: 'analyzer', title: 'Analizador App', description: 'Análisis completo', icon: Rocket, color: 'amber' as const },
    { id: 'audit-improvements', title: 'Mejoras Diagnóstico', description: 'Seguimiento de mejoras', icon: BarChart3, color: 'cyan' as const },
    { id: 'web-vitals', title: 'Core Web Vitals', description: 'Métricas de rendimiento', icon: Gauge, color: 'rose' as const },
    { id: 'api', title: 'Documentación API', description: 'Endpoints y ejemplos', icon: Code, color: 'slate' as const },
  ];

  return (
    <div className={cn(
      'min-h-screen flex transition-colors duration-500',
      isDark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    )}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-emerald-950/20" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-emerald-50/50" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* Sidebar */}
      <ObelixiaAdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        theme={theme}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <div className={cn(
          'relative space-y-6',
          isCompact ? 'p-4' : 'p-6'
        )}>
          {/* Header with view toggle */}
          <div className="flex items-start justify-between gap-4">
            <ObelixiaAdminHeader
              activeTab={activeTab}
              getTabLabel={getTabLabel}
              theme={theme}
            />
            <ObelixiaViewToggle
              viewMode={viewMode}
              theme={theme}
              onViewModeChange={toggleViewMode}
              onThemeChange={toggleTheme}
            />
          </div>

          {/* Stats Bar - Solo visible en sección Comercial */}
          {['quotes', 'invoices', 'pricing', 'demo-requests'].includes(activeTab) && (
            <ObelixiaStatsBar stats={stats} theme={theme} viewMode={viewMode} />
          )}

          {/* Content Area */}
          <ObelixiaContentArea activeTab={activeTab} theme={theme} viewMode={viewMode}>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsContent value="quotes" className="m-0">
                <QuoteManager />
              </TabsContent>

              <TabsContent value="invoices" className="m-0">
                <InvoiceManager />
              </TabsContent>

              <TabsContent value="pricing" className="m-0">
                <ModulePricingManager />
              </TabsContent>

              <TabsContent value="demo-requests" className="m-0">
                <DemoRequestsPage />
              </TabsContent>

              <TabsContent value="content" className="m-0">
                <ContentManager />
              </TabsContent>

              <TabsContent value="cms" className="m-0">
                <CMSDashboard />
              </TabsContent>


              <TabsContent value="technical-docs" className="m-0">
                <DynamicTechnicalDocGenerator />
              </TabsContent>

              <TabsContent value="competitor-gap" className="m-0">
                <CompetitorGapAnalysisGenerator />
              </TabsContent>

              <TabsContent value="app-status" className="m-0">
                <AppDetailedStatusGenerator />
              </TabsContent>

              <TabsContent value="codebase-index" className="m-0">
                <CodebaseIndexGenerator />
              </TabsContent>

              <TabsContent value="analyzer" className="m-0">
                <ApplicationStateAnalyzer />
              </TabsContent>

              <TabsContent value="audit-improvements" className="m-0">
                <AuditImprovementsTracker />
              </TabsContent>

              <TabsContent value="appstore" className="m-0 space-y-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">App Store & CNAE</h3>
                  <p className="text-slate-400 text-sm">Gestión de módulos, sectores y pricing dinámico.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {appstoreCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ObelixiaAdminCard3D
                        title={card.title}
                        description={card.description}
                        icon={card.icon}
                        color={card.color}
                        onClick={() => handleTabChange(card.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="appstore-manager" className="m-0">
                <AppStoreManager />
              </TabsContent>

              <TabsContent value="cnae-dashboard" className="m-0">
                <CNAEDashboard />
              </TabsContent>

              <TabsContent value="cnae-admin" className="m-0">
                <CNAEPricingAdmin />
              </TabsContent>

              <TabsContent value="whitelabel" className="m-0">
                <WhiteLabelConfig />
              </TabsContent>

              <TabsContent value="api" className="m-0">
                <APIDocumentation />
              </TabsContent>

              <TabsContent value="security" className="m-0">
                <SecurityOnboardingGuide />
              </TabsContent>

              <TabsContent value="news" className="m-0">
                <NewsAdminDashboard />
              </TabsContent>

              <TabsContent value="faq" className="m-0">
                <FAQAdminDashboard />
              </TabsContent>

              <TabsContent value="academia" className="m-0">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <AcademiaAdminPage embedded />
                </div>
              </TabsContent>

              <TabsContent value="translations" className="m-0">
                <TranslationsDashboard />
              </TabsContent>

              <TabsContent value="verticals" className="m-0 space-y-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Verticales & Sectores</h3>
                  <p className="text-slate-400 text-sm">Gestión de soluciones verticales por sector.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {verticalCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ObelixiaAdminCard3D
                        title={card.title}
                        description={card.description}
                        icon={card.icon}
                        color={card.color}
                        onClick={() => handleTabChange(card.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="vertical-packs-manager" className="m-0">
                <VerticalPacksManager />
              </TabsContent>

              <TabsContent value="sectors-manager" className="m-0">
                <SectorsManager />
              </TabsContent>

              <TabsContent value="web-vitals" className="m-0">
                <CoreWebVitalsDashboard />
              </TabsContent>

              <TabsContent value="reports" className="m-0 space-y-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Centro de Reportes</h3>
                  <p className="text-slate-400 text-sm">Acceso rápido a todos los generadores de documentación, análisis y reportes del sistema.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ObelixiaAdminCard3D
                        title={card.title}
                        description={card.description}
                        icon={card.icon}
                        color={card.color}
                        onClick={() => handleTabChange(card.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Estrategia & Datos - Nuevos módulos con redirección */}
              <TabsContent value="esg" className="m-0">
                <div className="text-center py-12">
                  <Leaf className="h-16 w-16 mx-auto mb-4 text-emerald-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">ESG & Sostenibilidad</h3>
                  <p className="text-slate-400 mb-6">Gestión de métricas ESG, huella de carbono y reportes de sostenibilidad.</p>
                  <a href="/admin/esg" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors">
                    Ir al módulo completo →
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="market-intelligence" className="m-0">
                <div className="text-center py-12">
                  <Globe className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">Market Intelligence</h3>
                  <p className="text-slate-400 mb-6">Análisis de mercado, competencia, tendencias y oportunidades.</p>
                  <a href="/admin/market-intelligence" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors">
                    Ir al módulo completo →
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="ai-agents-specific" className="m-0">
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">Agentes IA Específicos</h3>
                  <p className="text-slate-400 mb-6">Agentes autónomos, copilot predictivo e interfaz de voz.</p>
                  <a href="/admin/ai-agents" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors">
                    Ir al módulo completo →
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="enterprise-dashboard" className="m-0">
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-amber-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">Enterprise Dashboard</h3>
                  <p className="text-slate-400 mb-6">Visión ejecutiva con todos los paneles enterprise.</p>
                  <a href="/admin/enterprise-dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors">
                    Ir al módulo completo →
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="cs-metrics" className="m-0">
                <div className="text-center py-12">
                  <HeartPulse className="h-16 w-16 mx-auto mb-4 text-rose-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">CS Metrics Hub</h3>
                  <p className="text-slate-400 mb-6">Centro de métricas de Customer Success.</p>
                  <a href="/admin/cs-metrics" className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors">
                    Ir al módulo completo →
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="remote-support" className="m-0">
                <div className="text-center py-12">
                  <Headphones className="h-16 w-16 mx-auto mb-4 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">Soporte Remoto</h3>
                  <p className="text-slate-400 mb-6">Sistema de soporte remoto asistido por IA.</p>
                  <a href="/admin/remote-support" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors">
                    Ir al módulo completo →
                  </a>
                </div>
              </TabsContent>

              {/* Operaciones - Nuevos módulos */}
              <TabsContent value="module-dashboard" className="m-0">
                <ModuleDashboardPanel />
              </TabsContent>

              <TabsContent value="module-notifications" className="m-0">
                <ModuleNotificationsPanel />
              </TabsContent>

              <TabsContent value="module-monitoring" className="m-0">
                <ModuleMonitoringPanel />
              </TabsContent>

              <TabsContent value="module-performance" className="m-0">
                <ModulePerformancePanel />
              </TabsContent>

              {/* Nuevos módulos añadidos */}
              <TabsContent value="metrics-explorer" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <MetricsExplorer />
                </Suspense>
              </TabsContent>

              <TabsContent value="system-health" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <SystemHealthMonitor />
                </Suspense>
              </TabsContent>

              <TabsContent value="error-dashboard" className="m-0">
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">Error Dashboard</h3>
                  <p className="text-slate-400 mb-6">Monitorización y gestión de errores del sistema.</p>
                  <a href="/admin?section=errors" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                    Ir al módulo completo →
                  </a>
                </div>
              </TabsContent>

              <TabsContent value="rfm-dashboard" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <RFMDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="predictive-analytics" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <PredictiveAnalyticsDashboard />
                </Suspense>
              </TabsContent>

              {/* Compliance & ML */}
              <TabsContent value="iso27001" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <ISO27001Dashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="dora-compliance" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <DORAComplianceDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="adaptive-auth" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <AdaptiveAuthDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="advanced-ml" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <AdvancedMLDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="system-help" className="m-0">
                <Suspense fallback={<LoadingFallback />}>
                  <SystemHelpPanel />
                </Suspense>
              </TabsContent>
            </Tabs>
          </ObelixiaContentArea>
        </div>
      </div>
    </div>
  );
};

export default ObelixiaTeamAdmin;
