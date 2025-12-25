import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, Euro, Package, Receipt, 
  BarChart3, Code, 
  Store, Layers, BookOpen, Activity, Rocket,
  GraduationCap, Languages, Briefcase, Gauge, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useSearchParams } from 'react-router-dom';
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

// New premium components
import { ObelixiaAdminSidebar } from '@/components/obelixia-admin/ObelixiaAdminSidebar';
import { ObelixiaAdminHeader } from '@/components/obelixia-admin/ObelixiaAdminHeader';
import { ObelixiaStatsBar } from '@/components/obelixia-admin/ObelixiaStatsBar';
import { ObelixiaContentArea } from '@/components/obelixia-admin/ObelixiaContentArea';
import { ObelixiaAdminCard3D } from '@/components/obelixia-admin/ObelixiaAdminCard3D';

const ObelixiaTeamAdmin: React.FC = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'quotes';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getTabLabel = (tab: string): string => {
    const labels: Record<string, string> = {
      quotes: 'Presupuestos',
      invoices: 'Facturas',
      pricing: 'Precios',
      content: 'Contenidos',
      cms: 'CMS',
      docs: 'Documentación',
      appstore: 'App Store',
      whitelabel: 'White Label',
      api: 'API',
      academia: 'Academia',
      translations: 'Traducciones',
      verticals: 'Verticales',
      'web-vitals': 'Web Vitals',
      reports: 'Reportes',
      news: 'Noticias',
      faq: 'FAQ',
      security: 'Seguridad',
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

  // Doc cards for quick access
  const docCards = [
    { id: 'technical-docs', title: 'Documentación Técnica', description: 'Generar documentación completa del sistema', icon: FileText, color: 'emerald' as const },
    { id: 'competitor-gap', title: 'Análisis Competencia', description: 'Gap analysis vs competidores', icon: BarChart3, color: 'purple' as const },
    { id: 'app-status', title: 'Estado Aplicación', description: 'Estado detallado del sistema', icon: Activity, color: 'blue' as const },
    { id: 'codebase-index', title: 'Índice Codebase', description: 'Índice de funcionalidades del código', icon: Code, color: 'teal' as const },
    { id: 'analyzer', title: 'Analizador App', description: 'Análisis completo del estado y cumplimiento', icon: Rocket, color: 'amber' as const },
    { id: 'audit-improvements', title: 'Mejoras Diagnóstico', description: 'Seguimiento de mejoras con % cumplimiento', icon: BarChart3, color: 'cyan' as const },
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
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-emerald-950/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <ObelixiaAdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <div className="relative p-6 space-y-6">
          {/* Header */}
          <ObelixiaAdminHeader
            activeTab={activeTab}
            getTabLabel={getTabLabel}
          />

          {/* Stats Bar */}
          <ObelixiaStatsBar stats={stats} />

          {/* Content Area */}
          <ObelixiaContentArea activeTab={activeTab}>
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

              <TabsContent value="content" className="m-0">
                <ContentManager />
              </TabsContent>

              <TabsContent value="cms" className="m-0">
                <CMSDashboard />
              </TabsContent>

              <TabsContent value="docs" className="m-0 space-y-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Centro de Documentación</h3>
                  <p className="text-slate-400 text-sm">Acceso rápido a generadores de documentación y análisis.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docCards.map((card, index) => (
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
            </Tabs>
          </ObelixiaContentArea>
        </div>
      </div>
    </div>
  );
};

export default ObelixiaTeamAdmin;
