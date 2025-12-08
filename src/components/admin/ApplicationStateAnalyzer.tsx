import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Search, Download, RefreshCw, TrendingUp, Shield, Zap, Brain, Scale, Sparkles, AlertTriangle, CheckCircle2, Bot, Workflow, Lock, Building2, Map, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';

interface ModuleAnalysis {
  name: string;
  description: string;
  implementedFeatures: string[];
  pendingFeatures: string[];
  completionPercentage: number;
  businessValue: string;
  differentiators: string[];
}

interface ImprovementSuggestion {
  category: string;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  effort: string;
  impact: string;
  source: string;
  relatedTechnologies: string[];
  implementationSteps: string[];
}

interface TechnologyTrend {
  name: string;
  relevance: string;
  adoptionRate: string;
  recommendation: string;
  integrationPotential: string;
}

interface CodebaseAnalysis {
  version: string;
  generationDate: string;
  modules: ModuleAnalysis[];
  pendingFeatures: string[];
  securityFindings: string[];
  codeStats: {
    totalFiles: number;
    totalComponents: number;
    totalHooks: number;
    totalEdgeFunctions: number;
    totalPages: number;
    linesOfCode: number;
  };
}

interface ImprovementsAnalysis {
  generationDate: string;
  improvements: ImprovementSuggestion[];
  technologyTrends: TechnologyTrend[];
  securityUpdates: string[];
  performanceOptimizations: string[];
  uxEnhancements: string[];
  aiIntegrations: string[];
  complianceUpdates: string[];
  summary: string;
}

interface AIRecommendation {
  category: string;
  title: string;
  description: string;
  complianceNotes: string;
  securityConsiderations: string[];
  regulatoryFramework: string[];
  implementationApproach: string;
  estimatedEffort: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
  benefits: string[];
  tools: string[];
  bestPractices: string[];
  bankingExamples: string[];
}

interface AIAnalysis {
  generationDate: string;
  executiveSummary: string;
  aiRecommendations: AIRecommendation[];
  automationPlatforms: {
    platform: string;
    description: string;
    useCases: string[];
    securityNotes: string;
    integrationComplexity: string;
    complianceConsiderations: string[];
    bankingApplications: string[];
    implementationGuide?: {
      prerequisites: string[];
      steps: {
        stepNumber: number;
        title: string;
        description: string;
        commands?: string[];
        configuration?: string;
        tips: string[];
      }[];
      estimatedTime: string;
      difficulty: string;
    };
  }[];
  securityGuidelines: string[];
  regulatoryCompliance: {
    regulation: string;
    aiImplications: string;
    requiredMeasures: string[];
  }[];
  competitorAnalysis: {
    competitor: string;
    aiFeatures: string[];
    differentiationOpportunity: string;
    implementationPhases?: {
      phase: number;
      name: string;
      duration: string;
      objectives: string[];
      deliverables: string[];
      resources: string[];
      risks: string[];
      successMetrics: string[];
    }[];
    technicalRequirements?: string[];
    estimatedInvestment?: string;
  }[];
  bankingTrends: {
    trend: string;
    description: string;
    adoptionStatus: string;
    recommendation: string;
  }[];
  implementationRoadmap: {
    phase: string;
    duration: string;
    objectives: string[];
    deliverables: string[];
    detailedSteps?: {
      step: number;
      action: string;
      responsible: string;
      tools: string[];
      documentation: string;
    }[];
    budget?: string;
    kpis?: string[];
  }[];
  automationManuals?: {
    platform: string;
    setupGuide: {
      title: string;
      steps: string[];
    }[];
    workflowExamples: {
      name: string;
      description: string;
      triggers: string[];
      actions: string[];
      integrations: string[];
    }[];
    securityConfiguration: string[];
    maintenanceGuide: string[];
  }[];
}

const CATEGORY_ICONS: Record<string, any> = {
  security: Shield,
  performance: Zap,
  ai: Brain,
  compliance: Scale,
  ux: Sparkles,
  integrations: TrendingUp,
  devops: RefreshCw,
  analytics: TrendingUp,
  automation: Workflow,
  nlp: Bot,
  documents: FileText,
  predictions: TrendingUp,
  risk: AlertTriangle,
  personalization: Sparkles,
  fraud: Shield,
  'customer-service': Bot,
  optimization: Zap,
  vision: FileText,
};

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baja: 'bg-green-500',
};

const RISK_COLORS: Record<string, string> = {
  bajo: 'bg-green-500',
  medio: 'bg-yellow-500',
  alto: 'bg-red-500',
};

const STORAGE_KEYS = {
  codebase: 'app_analyzer_codebase',
  improvements: 'app_analyzer_improvements',
  ai: 'app_analyzer_ai'
};

export function ApplicationStateAnalyzer() {
  const [codebaseAnalysis, setCodebaseAnalysis] = useState<CodebaseAnalysis | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.codebase);
    return saved ? JSON.parse(saved) : null;
  });
  const [improvementsAnalysis, setImprovementsAnalysis] = useState<ImprovementsAnalysis | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.improvements);
    return saved ? JSON.parse(saved) : null;
  });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ai);
    return saved ? JSON.parse(saved) : null;
  });
  const [isAnalyzingCodebase, setIsAnalyzingCodebase] = useState(false);
  const [isSearchingImprovements, setIsSearchingImprovements] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Persist data to localStorage when it changes
  useEffect(() => {
    if (codebaseAnalysis) {
      localStorage.setItem(STORAGE_KEYS.codebase, JSON.stringify(codebaseAnalysis));
    }
  }, [codebaseAnalysis]);

  useEffect(() => {
    if (improvementsAnalysis) {
      localStorage.setItem(STORAGE_KEYS.improvements, JSON.stringify(improvementsAnalysis));
    }
  }, [improvementsAnalysis]);

  useEffect(() => {
    if (aiAnalysis) {
      localStorage.setItem(STORAGE_KEYS.ai, JSON.stringify(aiAnalysis));
    }
  }, [aiAnalysis]);

  const analyzeCodebase = async () => {
    setIsAnalyzingCodebase(true);
    setAnalysisProgress(0);
    
    try {
      // Simular progreso mientras se procesa
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Obtener estructura del código
      const componentsList = [
        'Dashboard.tsx', 'MapView.tsx', 'CompaniesManager.tsx', 'VisitSheetForm.tsx',
        'AccountingManager.tsx', 'GoalsProgressTracker.tsx', 'SystemHealthMonitor.tsx',
        'UnifiedMetricsDashboard.tsx', 'CommercialDirectorDashboard.tsx', 'OfficeDirectorDashboard.tsx',
        'GestorDashboard.tsx', 'AuditorDashboard.tsx', 'BalanceSheetForm.tsx', 'IncomeStatementForm.tsx',
        'CashFlowForm.tsx', 'EquityChangesForm.tsx', 'WorkingCapitalAnalysis.tsx', 'DuPontPyramid.tsx',
        'ZScoreAnalysis.tsx', 'RoutePlanner.tsx', 'MapContainer.tsx', 'MapSidebar.tsx'
      ];
      
      const hooksList = [
        'useAuth', 'useGoalsQuery', 'useVisitsQuery', 'useNotifications', 
        'usePresence', 'useRealtimeChannel', 'useCompaniesServerPagination'
      ];
      
      const edgeFunctions = [
        'system-health', 'scheduled-health-check', 'analyze-system-issues', 'analyze-codebase',
        'search-improvements', 'geocode-address', 'generate-action-plan', 'parse-financial-pdf',
        'send-alert-email', 'send-daily-kpi-report', 'optimize-route'
      ];
      
      const pagesList = ['Dashboard', 'MapView', 'Admin', 'Profile', 'VisitSheets', 'Home', 'Auth'];

      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: {
          fileStructure: 'src/components, src/hooks, src/pages, supabase/functions',
          componentsList,
          hooksList,
          edgeFunctions,
          pagesList
        }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) throw error;

      setCodebaseAnalysis(data);
      toast.success('Análisis del código completado');
    } catch (error: any) {
      console.error('Error analyzing codebase:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsAnalyzingCodebase(false);
    }
  };

  const searchImprovements = async () => {
    setIsSearchingImprovements(true);
    
    try {
      const currentModules = codebaseAnalysis?.modules.map(m => m.name) || [
        'Dashboard Multi-Rol', 'Contabilidad PGC', 'GIS Bancario', 'Gestión Visitas', 'Objetivos y Metas'
      ];

      const { data, error } = await supabase.functions.invoke('search-improvements', {
        body: {
          currentModules,
          currentTechnologies: ['React 18', 'TypeScript', 'Supabase', 'Tailwind CSS', 'MapLibre GL', 'Recharts'],
          industryFocus: 'Banca comercial andorrana y española, gestión de cartera empresarial'
        }
      });

      if (error) throw error;

      setImprovementsAnalysis(data);
      toast.success('Búsqueda de mejoras completada');
    } catch (error: any) {
      console.error('Error searching improvements:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSearchingImprovements(false);
    }
  };

  const searchAIRecommendations = async () => {
    setIsSearchingAI(true);
    
    try {
      const currentModules = codebaseAnalysis?.modules.map(m => m.name) || [
        'Dashboard Multi-Rol', 'Contabilidad PGC', 'GIS Bancario', 'Gestión Visitas', 'Objetivos y Metas'
      ];

      const { data, error } = await supabase.functions.invoke('search-ai-recommendations', {
        body: {
          currentModules,
          currentTechnologies: ['React 18', 'TypeScript', 'Supabase', 'Tailwind CSS', 'MapLibre GL', 'Recharts'],
          industryFocus: 'Banca comercial andorrana y española, gestión de cartera empresarial',
          complianceRequirements: ['GDPR', 'LOPD-GDD', 'PSD2', 'MiFID II', 'DORA', 'AI Act EU', 'Basel III/IV']
        }
      });

      if (error) throw error;

      setAiAnalysis(data);
      toast.success('Análisis de IA y automatización completado');
    } catch (error: any) {
      console.error('Error searching AI recommendations:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSearchingAI(false);
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // Título
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Informe de Estado de la Aplicación', margin, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, yPos);
      yPos += 15;

      // Resumen ejecutivo
      if (improvementsAnalysis?.summary) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen Ejecutivo', margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(improvementsAnalysis.summary, contentWidth);
        doc.text(summaryLines, margin, yPos);
        yPos += summaryLines.length * 5 + 10;
      }

      // Módulos analizados
      if (codebaseAnalysis?.modules && Array.isArray(codebaseAnalysis.modules) && codebaseAnalysis.modules.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Módulos de la Aplicación', margin, yPos);
        yPos += 10;

        codebaseAnalysis.modules.forEach((module, idx) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${module.name || 'Sin nombre'} (${module.completionPercentage || 0}%)`, margin, yPos);
          yPos += 6;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(module.description || 'Sin descripción', contentWidth - 10);
          doc.text(descLines, margin + 5, yPos);
          yPos += descLines.length * 4 + 8;
        });
      }

      // Mejoras sugeridas
      if (improvementsAnalysis?.improvements && Array.isArray(improvementsAnalysis.improvements) && improvementsAnalysis.improvements.length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Mejoras Sugeridas', margin, yPos);
        yPos += 10;

        improvementsAnalysis.improvements.slice(0, 10).forEach((imp, idx) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${imp.title || 'Sin título'} [${(imp.priority || 'media').toUpperCase()}]`, margin, yPos);
          yPos += 6;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const impLines = doc.splitTextToSize(imp.description || 'Sin descripción', contentWidth - 10);
          doc.text(impLines, margin + 5, yPos);
          yPos += impLines.length * 4;
          
          doc.text(`Esfuerzo: ${imp.effort || 'N/A'} | Impacto: ${imp.impact || 'N/A'}`, margin + 5, yPos);
          yPos += 8;
        });
      }

      // Tendencias tecnológicas
      if (improvementsAnalysis?.technologyTrends && Array.isArray(improvementsAnalysis.technologyTrends) && improvementsAnalysis.technologyTrends.length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Tendencias Tecnológicas', margin, yPos);
        yPos += 10;

        improvementsAnalysis.technologyTrends.forEach((trend, idx) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${trend.name || 'Sin nombre'}`, margin, yPos);
          yPos += 6;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Relevancia: ${trend.relevance || 'N/A'}`, margin + 5, yPos);
          yPos += 4;
          doc.text(`Recomendación: ${trend.recommendation || 'N/A'}`, margin + 5, yPos);
          yPos += 8;
        });
      }

      // Actualizaciones de compliance
      if (improvementsAnalysis?.complianceUpdates && Array.isArray(improvementsAnalysis.complianceUpdates) && improvementsAnalysis.complianceUpdates.length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Actualizaciones de Cumplimiento Normativo', margin, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        improvementsAnalysis.complianceUpdates.forEach((update, idx) => {
          const lines = doc.splitTextToSize(`${idx + 1}. ${update || ''}`, contentWidth);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 4 + 2;
        });
      }

      // Guardar PDF
      doc.save(`informe-aplicacion-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado correctamente');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(`Error generando PDF: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const overallCompletion = codebaseAnalysis?.modules && Array.isArray(codebaseAnalysis.modules) && codebaseAnalysis.modules.length > 0
    ? Math.round(codebaseAnalysis.modules.reduce((sum, m) => sum + (m.completionPercentage || 0), 0) / codebaseAnalysis.modules.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estat de l'Aplicació</h2>
          <p className="text-muted-foreground">
            Anàlisi complet del codi i suggeriments de millora
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={analyzeCodebase}
            disabled={isAnalyzingCodebase}
            variant="outline"
          >
            {isAnalyzingCodebase ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Analitzar Codi
          </Button>
          <Button
            onClick={searchImprovements}
            disabled={isSearchingImprovements}
            variant="outline"
          >
            {isSearchingImprovements ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar Millores
          </Button>
          <Button
            onClick={searchAIRecommendations}
            disabled={isSearchingAI}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isSearchingAI ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            IA i Automatització
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGeneratingPDF || (!codebaseAnalysis && !improvementsAnalysis)}
          >
            {isGeneratingPDF ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Generar PDF
          </Button>
        </div>
      </div>

      {/* Progress bar durante análisis */}
      {isAnalyzingCodebase && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analitzant codi...</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Visió General</TabsTrigger>
          <TabsTrigger value="modules">Mòduls</TabsTrigger>
          <TabsTrigger value="improvements">Millores</TabsTrigger>
          <TabsTrigger value="trends">Tendències</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            IA
          </TabsTrigger>
        </TabsList>

        {/* Visión General */}
        <TabsContent value="overview" className="space-y-4">
          {codebaseAnalysis ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completitud Global</CardDescription>
                    <CardTitle className="text-3xl">{overallCompletion}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={overallCompletion} className="h-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Mòduls</CardDescription>
                    <CardTitle className="text-3xl">{Array.isArray(codebaseAnalysis.modules) ? codebaseAnalysis.modules.length : 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Edge Functions</CardDescription>
                    <CardTitle className="text-3xl">{codebaseAnalysis.codeStats?.totalEdgeFunctions || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Funcionalitats Pendents</CardDescription>
                    <CardTitle className="text-3xl">{codebaseAnalysis.pendingFeatures?.length || 0}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {improvementsAnalysis?.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resum Executiu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {improvementsAnalysis.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Hallazgos de seguridad */}
              {codebaseAnalysis.securityFindings && codebaseAnalysis.securityFindings.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <CardTitle>Seguretat Implementada</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-2">
                      {codebaseAnalysis.securityFindings.map((finding, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Fes clic a "Analitzar Codi" per obtenir l'estat complet de l'aplicació
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Módulos */}
        <TabsContent value="modules" className="space-y-4">
          {codebaseAnalysis?.modules && Array.isArray(codebaseAnalysis.modules) && codebaseAnalysis.modules.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {codebaseAnalysis.modules.map((module, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <Badge className={module.completionPercentage >= 90 ? 'bg-green-500' : module.completionPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}>
                        {module.completionPercentage}%
                      </Badge>
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={module.completionPercentage} className="h-2 mb-4" />
                    
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="implemented">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Funcionalitats ({module.implementedFeatures?.length || 0})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="text-sm space-y-1">
                            {module.implementedFeatures?.map((f, i) => (
                              <li key={i} className="text-muted-foreground">• {f}</li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      {module.pendingFeatures && module.pendingFeatures.length > 0 && (
                        <AccordionItem value="pending">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Pendents ({module.pendingFeatures?.length || 0})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="text-sm space-y-1">
                              {module.pendingFeatures.map((f, i) => (
                                <li key={i} className="text-muted-foreground">• {f}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>

                    {module.businessValue && (
                      <p className="text-xs text-muted-foreground mt-4 border-t pt-2">
                        <strong>Valor:</strong> {module.businessValue}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">Analitza el codi primer</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Mejoras */}
        <TabsContent value="improvements" className="space-y-4">
          {improvementsAnalysis?.improvements && Array.isArray(improvementsAnalysis.improvements) && improvementsAnalysis.improvements.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {improvementsAnalysis.improvements.map((imp, idx) => {
                  const Icon = CATEGORY_ICONS[imp.category] || TrendingUp;
                  return (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{imp.title}</CardTitle>
                          </div>
                          <Badge className={PRIORITY_COLORS[imp.priority]}>
                            {imp.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription>{imp.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 text-sm mb-4">
                          <div>
                            <span className="font-medium">Esforç:</span> {imp.effort}
                          </div>
                          <div>
                            <span className="font-medium">Impacte:</span> {imp.impact}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium">Font:</span> {imp.source}
                          </div>
                        </div>

                        {imp.relatedTechnologies && imp.relatedTechnologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {imp.relatedTechnologies.map((tech, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {imp.implementationSteps && imp.implementationSteps.length > 0 && (
                          <Accordion type="single" collapsible>
                            <AccordionItem value="steps">
                              <AccordionTrigger className="text-sm">
                                Passos d'implementació
                              </AccordionTrigger>
                              <AccordionContent>
                                <ol className="text-sm space-y-1 list-decimal list-inside">
                                  {imp.implementationSteps.map((step, i) => (
                                    <li key={i} className="text-muted-foreground">{step}</li>
                                  ))}
                                </ol>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Fes clic a "Buscar Millores" per obtenir suggeriments actualitzats
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tendencias */}
        <TabsContent value="trends" className="space-y-4">
          {improvementsAnalysis?.technologyTrends && Array.isArray(improvementsAnalysis.technologyTrends) && improvementsAnalysis.technologyTrends.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {improvementsAnalysis.technologyTrends.map((trend, idx) => {
                // Handle both expected structure and alternative field names from AI
                const trendObj = trend as unknown as Record<string, unknown>;
                const name = trendObj.name || trendObj.technology || trendObj.title || 'Tecnologia';
                const relevance = trendObj.relevance || trendObj.relevancia || trendObj.description || trendObj.descripcion || '-';
                const adoption = trendObj.adoptionRate || trendObj.adoption || trendObj.adopcion || trendObj.adoption_rate || '-';
                const recommendation = trendObj.recommendation || trendObj.recomendacion || trendObj.recommended || trendObj.accion || '-';
                const integration = trendObj.integrationPotential || trendObj.integration || trendObj.integracion || trendObj.potential || trendObj.potencial || '-';
                
                return (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-lg">{String(name)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Rellevància:</span> {String(relevance)}
                      </div>
                      <div>
                        <span className="font-medium">Adopció:</span> {String(adoption)}
                      </div>
                      <div>
                        <span className="font-medium">Recomanació:</span> {String(recommendation)}
                      </div>
                      <div>
                        <span className="font-medium">Potencial d'integració:</span> {String(integration)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">Busca millores primer</p>
              </CardContent>
            </Card>
          )}

          {/* Otras listas */}
          {improvementsAnalysis && (
            <div className="grid gap-4 md:grid-cols-2">
              {improvementsAnalysis.performanceOptimizations && improvementsAnalysis.performanceOptimizations.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">Optimitzacions de Rendiment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {improvementsAnalysis.performanceOptimizations.map((opt, i) => {
                        const item = opt as unknown as string | Record<string, unknown>;
                        const text = typeof item === 'string' ? item : (item?.title || item?.description || item?.name || JSON.stringify(item));
                        return <li key={i} className="text-muted-foreground">• {String(text)}</li>;
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {improvementsAnalysis.aiIntegrations && improvementsAnalysis.aiIntegrations.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-lg">Integracions IA</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {improvementsAnalysis.aiIntegrations.map((ai, i) => {
                        const aiItem = ai as unknown as string | { integration?: string; description?: string };
                        const displayText = typeof aiItem === 'string' 
                          ? aiItem 
                          : (aiItem?.integration || aiItem?.description || JSON.stringify(aiItem));
                        return (
                          <li key={i} className="text-muted-foreground">• {displayText}</li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="space-y-4">
          {improvementsAnalysis?.complianceUpdates && Array.isArray(improvementsAnalysis.complianceUpdates) && improvementsAnalysis.complianceUpdates.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-blue-500" />
                    <CardTitle>Actualitzacions Normatives</CardTitle>
                  </div>
                  <CardDescription>
                    Normatives i regulacions a tenir en compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {improvementsAnalysis.complianceUpdates.map((update, idx) => {
                      const item = update as unknown as string | Record<string, unknown>;
                      const text = typeof item === 'string' ? item : (item?.title || item?.description || item?.regulation || JSON.stringify(item));
                      return (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{String(text)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {improvementsAnalysis.securityUpdates && improvementsAnalysis.securityUpdates.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <CardTitle>Actualitzacions de Seguretat</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {improvementsAnalysis.securityUpdates.map((update, idx) => {
                        const item = update as unknown as string | Record<string, unknown>;
                        const text = typeof item === 'string' ? item : (item?.element || item?.title || item?.description || item?.recommendation || JSON.stringify(item));
                        return (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {String(text)}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">Busca millores primer</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* IA i Automatització */}
        <TabsContent value="ai" className="space-y-4">
          {aiAnalysis ? (
            <ScrollArea className="h-[700px]">
              <div className="space-y-6 pr-4">
                {/* Resumen Ejecutivo */}
                <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <CardTitle>Resum Executiu - IA en Banca</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{aiAnalysis.executiveSummary}</p>
                  </CardContent>
                </Card>

                {/* Recomendaciones IA */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-500" />
                      <CardTitle>Recomanacions d'Implementació IA</CardTitle>
                    </div>
                    <CardDescription>Casos d'ús prioritzats per compliment normatiu i seguretat</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!aiAnalysis.aiRecommendations || aiAnalysis.aiRecommendations.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No s'han trobat recomanacions d'IA.</p>
                        <p className="text-sm mt-1">Prova a executar "Recomanacions IA" de nou.</p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {aiAnalysis.aiRecommendations.slice(0, 8).map((rec, idx) => {
                          const Icon = CATEGORY_ICONS[rec?.category] || Brain;
                          return (
                            <AccordionItem key={idx} value={`ai-${idx}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3 text-left">
                                  <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="font-medium">{rec?.title || 'Sense títol'}</div>
                                    <div className="text-xs text-muted-foreground">{rec?.category || 'general'}</div>
                                  </div>
                                  <Badge className={RISK_COLORS[rec?.riskLevel] || 'bg-gray-500'}>
                                    Risc: {rec?.riskLevel || 'desconegut'}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4 pt-4">
                                <p className="text-sm">{rec?.description || 'Sense descripció'}</p>
                                
                                {rec?.complianceNotes && (
                                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400 mb-2">
                                      <Lock className="h-4 w-4" />
                                      Notes de Compliment
                                    </div>
                                    <p className="text-sm text-muted-foreground">{rec.complianceNotes}</p>
                                  </div>
                                )}

                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <div className="font-medium text-sm mb-2 flex items-center gap-1">
                                      <Shield className="h-3 w-3" /> Seguretat
                                    </div>
                                    <ul className="text-xs space-y-1">
                                      {(rec?.securityConsiderations || []).map((s, i) => (
                                        <li key={i} className="text-muted-foreground">• {typeof s === 'string' ? s : JSON.stringify(s)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm mb-2 flex items-center gap-1">
                                      <Scale className="h-3 w-3" /> Normatives
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {(rec?.regulatoryFramework || []).map((r, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">{typeof r === 'string' ? r : JSON.stringify(r)}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {rec?.estimatedEffort && (
                                  <div className="text-sm">
                                    <span className="font-medium">Esforç estimat:</span> {rec.estimatedEffort}
                                  </div>
                                )}

                                {rec?.tools && rec.tools.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {rec.tools.map((t, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{typeof t === 'string' ? t : JSON.stringify(t)}</Badge>
                                    ))}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>

                {/* Plataformas de Automatización con Guías de Implementación */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Workflow className="h-5 w-5 text-orange-500" />
                      <CardTitle>Plataformes d'Automatització - Guies Detallades</CardTitle>
                    </div>
                    <CardDescription>n8n, Make, Power Automate - Manuals d'implementació pas a pas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!aiAnalysis.automationPlatforms || aiAnalysis.automationPlatforms.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Workflow className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No s'han trobat plataformes d'automatització.</p>
                        <p className="text-sm mt-1">Prova a executar "Recomanacions IA" de nou.</p>
                      </div>
                    ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {aiAnalysis.automationPlatforms.map((platform, idx) => (
                        <AccordionItem key={idx} value={`platform-${idx}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                              <Workflow className="h-5 w-5 text-orange-500 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium">{platform.platform}</div>
                                <div className="text-xs text-muted-foreground">{platform.integrationComplexity}</div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-4">
                            <p className="text-sm">{platform.description}</p>
                            
                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                              <div className="flex items-center gap-2 font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                                <Shield className="h-4 w-4" />
                                Notes de Seguretat
                              </div>
                              <p className="text-sm text-muted-foreground">{platform.securityNotes}</p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <div className="font-medium text-sm mb-2">Casos d'Ús Bancaris</div>
                                <ul className="text-xs space-y-1">
                                  {platform.bankingApplications?.map((app, i) => (
                                    <li key={i} className="text-muted-foreground">• {app}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <div className="font-medium text-sm mb-2">Consideracions Compliance</div>
                                <ul className="text-xs space-y-1">
                                  {platform.complianceConsiderations?.map((c, i) => (
                                    <li key={i} className="text-muted-foreground">• {c}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {platform.implementationGuide && (
                              <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                                <div className="font-medium text-sm mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  Guia d'Implementació
                                </div>
                                <div className="grid gap-2 md:grid-cols-2 mb-4 text-xs">
                                  <div><strong>Temps estimat:</strong> {platform.implementationGuide.estimatedTime}</div>
                                  <div><strong>Dificultat:</strong> {platform.implementationGuide.difficulty}</div>
                                </div>
                                
                                {platform.implementationGuide.prerequisites && platform.implementationGuide.prerequisites.length > 0 && (
                                  <div className="mb-4">
                                    <div className="text-xs font-medium mb-2">Prerequisits:</div>
                                    <ul className="text-xs space-y-1">
                                      {platform.implementationGuide.prerequisites.map((p, i) => (
                                        <li key={i} className="text-muted-foreground">✓ {p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {platform.implementationGuide.steps && platform.implementationGuide.steps.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium mb-2">Passos d'Implementació:</div>
                                    <div className="space-y-3">
                                      {platform.implementationGuide.steps.map((step, i) => (
                                        <div key={i} className="p-3 rounded border bg-background">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs">{step.stepNumber}</Badge>
                                            <span className="font-medium text-sm">{step.title}</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                                          {step.commands && step.commands.length > 0 && (
                                            <div className="bg-muted p-2 rounded font-mono text-xs mb-2">
                                              {step.commands.map((cmd, ci) => (
                                                <div key={ci}>{cmd}</div>
                                              ))}
                                            </div>
                                          )}
                                          {step.tips?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {step.tips.map((tip, ti) => (
                                                <Badge key={ti} variant="secondary" className="text-xs">💡 {tip}</Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    )}
                  </CardContent>
                </Card>

                {/* Análisis Competencia con Fases de Implementación */}
                {aiAnalysis.competitorAnalysis && aiAnalysis.competitorAnalysis.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        <CardTitle>Anàlisi de Competència - Fases d'Implementació</CardTitle>
                      </div>
                      <CardDescription>Què fan els competidors i com replicar-ho pas a pas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {aiAnalysis.competitorAnalysis.map((comp, idx) => (
                          <AccordionItem key={idx} value={`comp-${idx}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 text-left">
                                <Building2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">{comp.competitor}</div>
                                  <div className="text-xs text-muted-foreground">{comp.aiFeatures?.length || 0} funcionalitats IA</div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <div className="font-medium text-sm mb-2">Funcionalitats IA</div>
                                  <ul className="text-xs space-y-1">
                                    {comp.aiFeatures?.map((f, i) => (
                                      <li key={i} className="text-muted-foreground">• {f}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-sm mb-2">Oportunitat de Diferenciació</div>
                                  <p className="text-xs text-primary">{comp.differentiationOpportunity}</p>
                                  {comp.technicalRequirements && (
                                    <div className="mt-3">
                                      <div className="text-xs font-medium mb-1">Requisits Tècnics:</div>
                                      <ul className="text-xs space-y-1">
                                        {comp.technicalRequirements.map((r, i) => (
                                          <li key={i} className="text-muted-foreground">• {r}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {comp.estimatedInvestment && (
                                    <div className="mt-2 text-xs">
                                      <strong>Inversió estimada:</strong> {comp.estimatedInvestment}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {comp.implementationPhases && Array.isArray(comp.implementationPhases) && comp.implementationPhases.length > 0 && (
                                <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                                  <div className="font-medium text-sm mb-3 flex items-center gap-2">
                                    <Map className="h-4 w-4 text-green-500" />
                                    Fases d'Implementació per Replicar
                                  </div>
                                  <div className="space-y-4">
                                    {comp.implementationPhases.map((phase, pi) => (
                                      <div key={pi} className="p-3 rounded border bg-background">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className="bg-blue-500">{phase.phase}</Badge>
                                          <span className="font-medium text-sm">{phase.name}</span>
                                          <span className="text-xs text-muted-foreground">({phase.duration})</span>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2 text-xs">
                                          <div>
                                            <div className="font-medium mb-1">Objectius:</div>
                                            <ul className="space-y-0.5">
                                              {phase.objectives?.map((o, oi) => (
                                                <li key={oi} className="text-muted-foreground">• {o}</li>
                                              ))}
                                            </ul>
                                          </div>
                                          <div>
                                            <div className="font-medium mb-1">Entregables:</div>
                                            <ul className="space-y-0.5">
                                              {phase.deliverables?.map((d, di) => (
                                                <li key={di} className="text-muted-foreground">✓ {d}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                        {phase.resources && Array.isArray(phase.resources) && phase.resources.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {phase.resources.map((r, ri) => (
                                              <Badge key={ri} variant="outline" className="text-xs">{r}</Badge>
                                            ))}
                                          </div>
                                        )}
                                        {phase.successMetrics && Array.isArray(phase.successMetrics) && phase.successMetrics.length > 0 && (
                                          <div className="mt-2 text-xs">
                                            <strong>KPIs:</strong> {phase.successMetrics.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}

                {/* Roadmap Detallado */}
                {aiAnalysis.implementationRoadmap && Array.isArray(aiAnalysis.implementationRoadmap) && aiAnalysis.implementationRoadmap.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Map className="h-5 w-5 text-green-500" />
                        <CardTitle>Roadmap Detallat d'Implementació IA</CardTitle>
                      </div>
                      <CardDescription>Fases amb passos detallats, pressupost i KPIs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {aiAnalysis.implementationRoadmap.map((phase, idx) => (
                          <AccordionItem key={idx} value={`roadmap-${idx}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 text-left w-full">
                                <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{phase.phase}</div>
                                  <div className="text-xs text-muted-foreground">{phase.duration}</div>
                                </div>
                                {phase.budget && (
                                  <Badge variant="outline" className="text-xs">{phase.budget}</Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <div className="font-medium text-sm mb-2">Objectius</div>
                                  <ul className="text-xs space-y-1">
                                    {phase.objectives?.map((o, i) => (
                                      <li key={i} className="text-muted-foreground">• {o}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-sm mb-2">Entregables</div>
                                  <ul className="text-xs space-y-1">
                                    {phase.deliverables?.map((d, i) => (
                                      <li key={i} className="text-muted-foreground">✓ {d}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {phase.kpis && Array.isArray(phase.kpis) && phase.kpis.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-xs font-medium mr-2">KPIs:</span>
                                  {phase.kpis.map((kpi, i) => (
                                    <Badge key={i} className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">{kpi}</Badge>
                                  ))}
                                </div>
                              )}

                              {phase.detailedSteps && Array.isArray(phase.detailedSteps) && phase.detailedSteps.length > 0 && (
                                <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                                  <div className="font-medium text-sm mb-3">Passos Detallats</div>
                                  <div className="space-y-3">
                                    {phase.detailedSteps.map((step, si) => (
                                      <div key={si} className="flex gap-3 p-3 rounded border bg-background">
                                        <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                          {step.step}
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{step.action}</div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            <strong>Responsable:</strong> {step.responsible}
                                          </div>
                                          {step.tools && step.tools.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {step.tools.map((t, ti) => (
                                                <Badge key={ti} variant="outline" className="text-xs">{t}</Badge>
                                              ))}
                                            </div>
                                          )}
                                          {step.documentation && (
                                            <div className="text-xs text-primary mt-1">📄 {step.documentation}</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}

                {/* Manuales de Automatización */}
                {aiAnalysis.automationManuals && Array.isArray(aiAnalysis.automationManuals) && aiAnalysis.automationManuals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        <CardTitle>Manuals d'Automatització</CardTitle>
                      </div>
                      <CardDescription>Guies completes per configurar cada plataforma</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {aiAnalysis.automationManuals.map((manual, idx) => (
                          <AccordionItem key={idx} value={`manual-${idx}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 text-left">
                                <FileText className="h-5 w-5 text-purple-500 flex-shrink-0" />
                                <div className="font-medium">{manual.platform}</div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                              {manual.setupGuide && Array.isArray(manual.setupGuide) && manual.setupGuide.length > 0 && (
                                <div>
                                  <div className="font-medium text-sm mb-2">Guia de Configuració</div>
                                  {manual.setupGuide.map((guide, gi) => (
                                    <div key={gi} className="mb-3 p-3 rounded border">
                                      <div className="font-medium text-sm mb-2">{guide.title}</div>
                                      <ol className="text-xs space-y-1 list-decimal list-inside">
                                        {guide.steps?.map((s, si) => (
                                          <li key={si} className="text-muted-foreground">{s}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {manual.workflowExamples && Array.isArray(manual.workflowExamples) && manual.workflowExamples.length > 0 && (
                                <div>
                                  <div className="font-medium text-sm mb-2">Exemples de Workflows</div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {manual.workflowExamples.map((wf, wi) => (
                                      <div key={wi} className="p-3 rounded border bg-muted/30">
                                        <div className="font-medium text-sm mb-1">{wf.name}</div>
                                        <p className="text-xs text-muted-foreground mb-2">{wf.description}</p>
                                        <div className="text-xs">
                                          <strong>Triggers:</strong> {wf.triggers?.join(', ')}
                                        </div>
                                        <div className="text-xs mt-1">
                                          <strong>Accions:</strong> {wf.actions?.join(', ')}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {manual.securityConfiguration && Array.isArray(manual.securityConfiguration) && manual.securityConfiguration.length > 0 && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                  <div className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-500" />
                                    Configuració de Seguretat
                                  </div>
                                  <ul className="text-xs space-y-1">
                                    {manual.securityConfiguration.map((sc, sci) => (
                                      <li key={sci} className="text-muted-foreground">• {sc}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {manual.maintenanceGuide && Array.isArray(manual.maintenanceGuide) && manual.maintenanceGuide.length > 0 && (
                                <div>
                                  <div className="font-medium text-sm mb-2">Guia de Manteniment</div>
                                  <ul className="text-xs space-y-1">
                                    {manual.maintenanceGuide.map((mg, mgi) => (
                                      <li key={mgi} className="text-muted-foreground">• {mg}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}

                {/* Directrices de Seguridad */}
                {aiAnalysis.securityGuidelines && Array.isArray(aiAnalysis.securityGuidelines) && aiAnalysis.securityGuidelines.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-red-500" />
                        <CardTitle>Directrius de Seguretat per IA Bancària</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-2">
                        {aiAnalysis.securityGuidelines.map((guideline, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{guideline}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          ) : (
            <Card className="border-dashed border-purple-500/30">
              <CardContent className="py-16 text-center">
                <Brain className="h-16 w-16 mx-auto text-purple-500/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">IA i Automatització Bancària</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Obté recomanacions intel·ligents sobre com implementar IA a l'aplicació complint amb totes les normatives bancàries (GDPR, AI Act, DORA, MiFID II).
                </p>
                <Button
                  onClick={searchAIRecommendations}
                  disabled={isSearchingAI}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {isSearchingAI ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="mr-2 h-4 w-4" />
                  )}
                  Generar Recomanacions IA
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
