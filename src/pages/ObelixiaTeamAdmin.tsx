import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Euro, Package, Receipt, Settings, 
  BarChart3, Users, Shield, Code, Palette, 
  Store, Layers, BookOpen, Activity, Rocket,
  ChevronLeft, ChevronRight, Home, LayoutGrid, Newspaper, HelpCircle,
  GraduationCap, Languages, Briefcase, Gauge
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminPanelSwitcher } from '@/components/admin/AdminPanelSwitcher';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
import NewsNotificationSystem from '@/components/admin/NewsNotificationSystem';
import { FAQAdminDashboard } from '@/components/obelixia-admin/faq';
// Nuevos imports para módulos de producto movidos
import { TranslationsDashboard } from '@/components/admin/translations/TranslationsDashboard';
import { VerticalPacksManager } from '@/components/admin/verticals/VerticalPacksManager';
import { SectorsManager } from '@/components/admin/SectorsManager';
import { CoreWebVitalsDashboard } from '@/components/admin/CoreWebVitalsDashboard';
import AcademiaAdminPage from '@/pages/admin/AcademiaAdminPage';

const ObelixiaTeamAdmin: React.FC = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'quotes';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  // Sync with URL params
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
      webvitals: 'Web Vitals',
      news: 'Noticias',
      faq: 'FAQ',
      security: 'Seguridad',
    };
    return labels[tab] || tab;
  };

  // Solo accesible para admins y superadmins
  if (!isSuperAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const stats = [
    { label: 'Presupuestos Activos', value: '12', icon: FileText, color: 'text-blue-400' },
    { label: 'Facturas Pendientes', value: '5', icon: Receipt, color: 'text-amber-400' },
    { label: 'Módulos Activos', value: '9', icon: Package, color: 'text-emerald-400' },
    { label: 'Ingresos Mes', value: '€45,000', icon: Euro, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-emerald-950/20 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <AdminBreadcrumbs 
            currentSection={activeTab !== 'quotes' ? getTabLabel(activeTab) : undefined}
            className="text-slate-400"
          />
          <AdminPanelSwitcher />
        </motion.div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50"
                title="Atrás"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(1)}
                className="h-9 w-9 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50"
                title="Adelante"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/store')}
                className="h-9 w-9 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50"
                title="Página Principal"
              >
                <Home className="h-5 w-5" />
              </Button>
              <NewsNotificationSystem />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  ObelixIA Team Admin
                </span>
              </h1>
              <p className="text-slate-400 mt-1">
                Gestión interna de presupuestos, facturas, precios, documentación y configuración
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/80 border-slate-700/50 hover:border-emerald-500/50 transition-all backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-10 h-10 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <CardHeader className="pb-0 border-b border-slate-700/50">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full gap-1 bg-slate-800/50 p-1 mb-2">
                <TabsTrigger 
                  value="quotes" 
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Presupuestos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="invoices"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Receipt className="w-4 h-4" />
                  <span className="hidden sm:inline">Facturas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pricing"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Euro className="w-4 h-4" />
                  <span className="hidden sm:inline">Precios</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="content"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Contenidos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="cms"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">CMS</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="docs"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Documentación</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="appstore"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">App Store</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="whitelabel"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">White Label</span>
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full gap-1 bg-slate-800/50 p-1">
                <TabsTrigger 
                  value="api"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Code className="w-4 h-4" />
                  <span className="hidden sm:inline">API</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="academia"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-emerald-700 data-[state=active]:text-white"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Academia</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="translations"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-teal-700 data-[state=active]:text-white"
                >
                  <Languages className="w-4 h-4" />
                  <span className="hidden sm:inline">Traducciones</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="verticals"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-amber-700 data-[state=active]:text-white"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Verticales</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="web-vitals"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
                >
                  <Gauge className="w-4 h-4" />
                  <span className="hidden sm:inline">Web Vitals</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Seguridad</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="news"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <Newspaper className="w-4 h-4" />
                  <span className="hidden sm:inline">Noticias</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="faq"
                  className="flex items-center gap-2 text-xs text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">FAQ</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
                    onClick={() => handleTabChange('technical-docs')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-400">Documentación Técnica</h4>
                        <p className="text-sm text-muted-foreground">Generar documentación completa del sistema</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10"
                    onClick={() => handleTabChange('competitor-gap')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-400">Análisis Competencia</h4>
                        <p className="text-sm text-muted-foreground">Gap analysis vs competidores</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10"
                    onClick={() => handleTabChange('app-status')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-400">Estado Aplicación</h4>
                        <p className="text-sm text-muted-foreground">Estado detallado del sistema</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10"
                    onClick={() => handleTabChange('codebase-index')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                        <Code className="h-6 w-6 text-teal-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-teal-400">Índice Codebase</h4>
                        <p className="text-sm text-muted-foreground">Índice de funcionalidades del código</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10"
                    onClick={() => handleTabChange('analyzer')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Rocket className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-400">Analizador de Aplicación</h4>
                        <p className="text-sm text-muted-foreground">Análisis completo del estado, mejoras y cumplimiento</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"
                    onClick={() => handleTabChange('audit-improvements')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-cyan-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-cyan-400">Mejoras Auto-Diagnóstico</h4>
                        <p className="text-sm text-muted-foreground">Seguimiento de mejoras detectadas con % cumplimiento</p>
                      </div>
                    </CardContent>
                  </Card>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"
                    onClick={() => handleTabChange('appstore-manager')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Store className="h-6 w-6 text-cyan-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-cyan-400">Gestión App Store</h4>
                        <p className="text-sm text-muted-foreground">Administrar módulos disponibles</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
                    onClick={() => handleTabChange('cnae-dashboard')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Layers className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-400">Multi-CNAE Dashboard</h4>
                        <p className="text-sm text-muted-foreground">Gestión multi-sector y pricing dinámico</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10 md:col-span-2"
                    onClick={() => handleTabChange('cnae-admin')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Euro className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-400">Administración Pricing CNAE</h4>
                        <p className="text-sm text-muted-foreground">Configurar precios por sector y bundles</p>
                      </div>
                    </CardContent>
                  </Card>
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

              {/* Nuevas pestañas de producto */}
              <TabsContent value="academia" className="m-0">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <AcademiaAdminPage embedded />
                </div>
              </TabsContent>

              <TabsContent value="translations" className="m-0">
                <TranslationsDashboard />
              </TabsContent>

              <TabsContent value="verticals" className="m-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"
                    onClick={() => handleTabChange('vertical-packs-manager')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Package className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-400">Packs Verticales</h4>
                        <p className="text-sm text-muted-foreground">Gestión de soluciones por sector</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10"
                    onClick={() => handleTabChange('sectors-manager')}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-teal-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-teal-400">Gestión de Sectores</h4>
                        <p className="text-sm text-muted-foreground">Administrar sectores y CNAE</p>
                      </div>
                    </CardContent>
                  </Card>
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
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ObelixiaTeamAdmin;
