import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Euro, Package, Receipt, Settings, 
  BarChart3, Users, Shield, Code, Palette, 
  Store, Layers, BookOpen, Activity, Rocket,
  ChevronLeft, ChevronRight, Home, LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
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

const ObelixiaTeamAdmin: React.FC = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('quotes');
  const navigate = useNavigate();

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-0 border-b border-slate-700/50">
              <TabsList className="grid grid-cols-5 lg:grid-cols-9 w-full gap-1">
                <TabsTrigger 
                  value="quotes" 
                  className="flex items-center gap-2 text-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Presupuestos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="invoices"
                  className="flex items-center gap-2 text-xs"
                >
                  <Receipt className="w-4 h-4" />
                  <span className="hidden sm:inline">Facturas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pricing"
                  className="flex items-center gap-2 text-xs"
                >
                  <Euro className="w-4 h-4" />
                  <span className="hidden sm:inline">Precios</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="content"
                  className="flex items-center gap-2 text-xs"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Contenidos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="cms"
                  className="flex items-center gap-2 text-xs"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">CMS</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="docs"
                  className="flex items-center gap-2 text-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Documentación</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="appstore"
                  className="flex items-center gap-2 text-xs"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">App Store</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="whitelabel"
                  className="flex items-center gap-2 text-xs"
                >
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">White Label</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="api"
                  className="flex items-center gap-2 text-xs"
                >
                  <Code className="w-4 h-4" />
                  <span className="hidden sm:inline">API</span>
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
                    onClick={() => setActiveTab('technical-docs')}
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
                    onClick={() => setActiveTab('competitor-gap')}
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
                    onClick={() => setActiveTab('app-status')}
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
                    onClick={() => setActiveTab('codebase-index')}
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
                    onClick={() => setActiveTab('analyzer')}
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
                    onClick={() => setActiveTab('audit-improvements')}
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
                    onClick={() => setActiveTab('appstore-manager')}
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
                    onClick={() => setActiveTab('cnae-dashboard')}
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
                    onClick={() => setActiveTab('cnae-admin')}
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
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ObelixiaTeamAdmin;
