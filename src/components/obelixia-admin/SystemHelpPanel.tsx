import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, Search, Book, FileQuestion, Lightbulb, 
  ChevronRight, ChevronDown, RefreshCw, FileDown, 
  Home, Users, MapPin, Calendar, BarChart3, Calculator,
  Shield, Bell, Settings, Database, Sparkles, Check,
  Building2, Target, TrendingUp, FileText, Bot, Info,
  Cpu, HardDrive, Server, Globe, Lock, Eye, Layers,
  FileCheck, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

// ObelixIA System Information
const obelixiaSystemInfo = {
  overview: {
    title: 'ObelixIA - CRM Bancario Inteligente',
    tagline: 'Sistema integral de gestión de cartera bancaria con inteligencia artificial',
    version: '8.0.0',
    description: `ObelixIA es una plataforma empresarial de gestión de relaciones con clientes (CRM) específicamente diseñada para el sector bancario. Combina la gestión tradicional de cartera con capacidades avanzadas de inteligencia artificial, cumplimiento normativo europeo y análisis financiero en tiempo real.

El sistema permite a los gestores bancarios administrar su cartera de empresas, planificar visitas comerciales, analizar estados financieros, gestionar oportunidades de venta y cumplir con todas las normativas regulatorias aplicables (ISO 27001, GDPR, DORA, NIS2, PSD2/PSD3, MiFID II, etc.).`,
    targetUsers: [
      'Gestores Bancarios (Relationship Managers)',
      'Directores de Oficina',
      'Directores Comerciales',
      'Responsables Comerciales',
      'Auditores Internos',
      'Equipos de Compliance'
    ],
    keyBenefits: [
      'Reducción del 60% en tiempo de gestión administrativa',
      'Incremento del 40% en productividad comercial',
      'Cumplimiento normativo automatizado al 95%+',
      'Análisis predictivo de riesgo y oportunidades',
      'Trazabilidad completa de todas las interacciones',
      'Integración con sistemas bancarios core (Temenos, etc.)'
    ]
  },
  software: {
    title: 'Arquitectura de Software',
    stack: [
      { name: 'Frontend', tech: 'React 19 + TypeScript + Vite', description: 'Interfaz de usuario moderna, responsive y accesible' },
      { name: 'Estilos', tech: 'Tailwind CSS + Shadcn/UI', description: 'Sistema de diseño consistente con temas personalizables' },
      { name: 'Estado', tech: 'React Query + Context API', description: 'Gestión de estado optimizada con caché inteligente' },
      { name: 'Backend', tech: 'Supabase (PostgreSQL)', description: 'Base de datos relacional con Row Level Security' },
      { name: 'API', tech: 'Edge Functions (Deno)', description: 'Funciones serverless para lógica de negocio' },
      { name: 'Autenticación', tech: 'Supabase Auth + WebAuthn', description: 'MFA, passkeys y autenticación biométrica' },
      { name: 'IA', tech: 'Lovable AI Gateway (Gemini 2.5)', description: 'Procesamiento de lenguaje natural y análisis predictivo' },
      { name: 'Mapas', tech: 'MapLibre GL', description: 'Visualización geográfica con clustering' },
      { name: 'PDFs', tech: 'jsPDF + jspdf-autotable', description: 'Generación de documentos profesionales' },
      { name: 'Gráficos', tech: 'Recharts', description: 'Visualización de datos interactiva' }
    ],
    security: [
      'Encriptación AES-256-GCM para datos sensibles',
      'Row Level Security (RLS) en todas las tablas',
      'JWT tokens con rotación automática',
      'HTTPS/TLS obligatorio',
      'Sanitización XSS con DOMPurify',
      'Validación de entrada en cliente y servidor',
      'Audit logging completo',
      'Rate limiting en Edge Functions'
    ]
  },
  modules: [
    { id: 'dashboard', name: 'Dashboard Principal', compliance: 95, regulations: ['GDPR', 'ISO 27001'], menuPath: '/admin → Dashboard' },
    { id: 'companies', name: 'Gestión de Empresas', compliance: 92, regulations: ['GDPR', 'KYC', 'AML'], menuPath: '/admin → Empresas' },
    { id: 'visits', name: 'Gestión de Visitas', compliance: 94, regulations: ['GDPR', 'MiFID II'], menuPath: '/admin → Visitas' },
    { id: 'map', name: 'Mapa Geográfico', compliance: 90, regulations: ['GDPR'], menuPath: '/admin → Mapa' },
    { id: 'accounting', name: 'Contabilidad', compliance: 96, regulations: ['IFRS 9', 'Basel III/IV'], menuPath: '/admin → Comptabilitat' },
    { id: 'pipeline', name: 'Pipeline Oportunidades', compliance: 88, regulations: ['GDPR', 'MiFID II'], menuPath: '/admin → Pipeline' },
    { id: 'goals', name: 'Objetivos y Metas', compliance: 91, regulations: ['ISO 27001'], menuPath: '/admin → Objetivos' },
    { id: 'dora-nis2', name: 'DORA/NIS2', compliance: 98, regulations: ['DORA', 'NIS2'], menuPath: '/admin → DORA/NIS2' },
    { id: 'iso27001', name: 'ISO 27001', compliance: 97, regulations: ['ISO 27001'], menuPath: '/admin → ISO 27001' },
  ],
  regulations: [
    { id: 'iso27001', name: 'ISO 27001', compliance: 97, description: 'Sistema de Gestión de Seguridad de la Información', status: 'Complert' },
    { id: 'gdpr', name: 'GDPR', compliance: 95, description: 'Reglamento General de Protección de Datos', status: 'Complert' },
    { id: 'dora', name: 'DORA', compliance: 98, description: 'Resiliencia Operativa Digital', status: 'Complert' },
    { id: 'nis2', name: 'NIS2', compliance: 96, description: 'Seguridad de Redes y Sistemas de Información', status: 'Complert' },
    { id: 'psd2', name: 'PSD2/PSD3', compliance: 94, description: 'Directiva de Servicios de Pago', status: 'En Progrés' },
    { id: 'mifid2', name: 'MiFID II', compliance: 92, description: 'Mercados de Instrumentos Financieros', status: 'En Progrés' },
    { id: 'basel', name: 'Basel III/IV', compliance: 90, description: 'Requisitos de Capital Bancario', status: 'En Progrés' },
    { id: 'ifrs9', name: 'IFRS 9', compliance: 93, description: 'Instrumentos Financieros (Contabilidad)', status: 'Complert' },
  ]
};

export const SystemHelpPanel: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const saved = localStorage.getItem('system_help_last_update');
    if (saved) setLastUpdate(saved);
  }, []);

  const analyzeSystem = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: { type: 'help-update' }
      });

      if (error) throw error;

      const now = new Date().toISOString();
      localStorage.setItem('system_help_last_update', now);
      setLastUpdate(now);
      
      toast.success('Sistema analizado', {
        description: 'La documentación de ayuda ha sido actualizada con las últimas funcionalidades del sistema.'
      });
    } catch (error) {
      console.error('Error analyzing system:', error);
      toast.error('Error al analizar', {
        description: 'No se pudo actualizar la documentación. Inténtalo de nuevo.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF();
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ObelixIA - Documentación del Sistema', margin, 25);
      
      pdf.setFontSize(12);
      pdf.text(obelixiaSystemInfo.overview.tagline, margin, 35);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Versión ${obelixiaSystemInfo.overview.version} | Generado: ${new Date().toLocaleDateString('es-ES')}`, margin, 45);

      y = 65;
      pdf.setTextColor(0, 0, 0);

      // Overview
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. Visión General', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(obelixiaSystemInfo.overview.description, contentWidth);
      descLines.forEach((line: string) => {
        if (y > 270) { pdf.addPage(); y = margin; }
        pdf.text(line, margin, y);
        y += 5;
      });

      // Stack
      y += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. Stack Tecnológico', margin, y);
      y += 8;

      pdf.setFontSize(10);
      obelixiaSystemInfo.software.stack.forEach((item) => {
        if (y > 260) { pdf.addPage(); y = margin; }
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.name}:`, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${item.tech} - ${item.description}`, margin + 30, y);
        y += 6;
      });

      // Compliance
      pdf.addPage();
      y = margin;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. Cumplimiento Normativo', margin, y);
      y += 10;

      pdf.setFontSize(10);
      obelixiaSystemInfo.regulations.forEach((reg) => {
        if (y > 260) { pdf.addPage(); y = margin; }
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${reg.name}: ${reg.compliance}% (${reg.status})`, margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.text(reg.description, margin + 5, y);
        y += 8;
      });

      pdf.save(`ObelixIA_Sistema_Documentacion_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado', { description: 'La documentación se ha descargado correctamente.' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const averageCompliance = Math.round(
    obelixiaSystemInfo.regulations.reduce((acc, r) => acc + r.compliance, 0) / obelixiaSystemInfo.regulations.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <HelpCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Centro de Ayuda del Sistema</h1>
            <p className="text-slate-400">Documentación y análisis de ObelixIA</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={analyzeSystem}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analizando Sistema...' : 'Actualizar Ayuda'}
            </Button>
            
            <Button
              variant="outline"
              onClick={generatePdf}
              disabled={isGeneratingPdf}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {isGeneratingPdf ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
            </Button>

            {lastUpdate && (
              <p className="text-sm text-slate-500 ml-auto">
                Última actualización: {new Date(lastUpdate).toLocaleString('es-ES')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Buscar en la documentación..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            <Info className="h-4 w-4 mr-2" />
            Visión General
          </TabsTrigger>
          <TabsTrigger value="tech" className="data-[state=active]:bg-slate-700">
            <Cpu className="h-4 w-4 mr-2" />
            Tecnología
          </TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:bg-slate-700">
            <Layers className="h-4 w-4 mr-2" />
            Módulos
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-slate-700">
            <Shield className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Globe className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">{obelixiaSystemInfo.overview.title}</CardTitle>
                  <CardDescription>{obelixiaSystemInfo.overview.tagline}</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">v{obelixiaSystemInfo.overview.version}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-300 whitespace-pre-line text-sm">
                {obelixiaSystemInfo.overview.description}
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    Usuarios Objetivo
                  </h4>
                  <ul className="space-y-2">
                    {obelixiaSystemInfo.overview.targetUsers.map((user, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <Check className="h-3 w-3 text-green-400" />
                        {user}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Beneficios Clave
                  </h4>
                  <ul className="space-y-2">
                    {obelixiaSystemInfo.overview.keyBenefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-1 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technology Tab */}
        <TabsContent value="tech" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-purple-400" />
                Stack Tecnológico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {obelixiaSystemInfo.software.stack.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
                    <div className="w-24 text-sm font-medium text-blue-400">{item.name}</div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{item.tech}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-400" />
                Seguridad Implementada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {obelixiaSystemInfo.software.security.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <Shield className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-3">
            {obelixiaSystemInfo.modules.map((module) => (
              <Card key={module.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{module.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="text-slate-400">Ruta:</span> {module.menuPath}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {module.regulations.map((reg, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {reg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`text-lg font-bold ${
                        module.compliance >= 95 ? 'text-green-400' : 
                        module.compliance >= 90 ? 'text-yellow-400' : 'text-orange-400'
                      }`}>
                        {module.compliance}%
                      </span>
                      <Progress value={module.compliance} className="h-1.5 w-20 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-purple-400" />
                  Cumplimiento Normativo
                </CardTitle>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-400">{averageCompliance}%</span>
                  <p className="text-xs text-slate-500">Promedio Global</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {obelixiaSystemInfo.regulations.map((reg) => (
                  <div key={reg.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{reg.name}</span>
                        <Badge 
                          variant={reg.status === 'Complert' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {reg.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{reg.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${
                        reg.compliance >= 95 ? 'text-green-400' : 
                        reg.compliance >= 90 ? 'text-yellow-400' : 'text-orange-400'
                      }`}>
                        {reg.compliance}%
                      </span>
                      <Progress value={reg.compliance} className="h-1 w-20 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHelpPanel;
