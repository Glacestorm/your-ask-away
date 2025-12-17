import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Search, Download, RefreshCw, TrendingUp, Shield, Zap, Brain, Scale, Sparkles, AlertTriangle, CheckCircle2, Bot, Workflow, Lock, Building2, Map, Gauge, Settings, Code, FolderTree, Terminal, Clock } from 'lucide-react';
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
  installed?: boolean;
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

interface ComplianceRegulation {
  name: string;
  status: 'compliant' | 'partial' | 'pending';
  description: string;
  implementedFeatures: string[];
  pendingActions: string[];
  compliancePercentage?: number;
  totalRequirements?: number;
  implementedRequirements?: number;
  jurisdiction?: string;
  timeline?: { date: string; milestone: string }[];
  implementationPhases?: {
    phase: number;
    name: string;
    duration: string;
    actions: string[];
    deliverables: string[];
    responsible: string;
  }[];
}

interface DetailedTechnologyTrend {
  number: number;
  name: string;
  relevance: string;
  adoptionRate: string;
  recommendation: string;
  integrationPotential: string;
  installed: boolean;
  installedDetails?: string[];
  pendingDetails?: string[];
  version?: string;
  lastUpdated?: string;
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
  complianceRegulations?: ComplianceRegulation[];
  detailedTrends?: DetailedTechnologyTrend[];
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
  const [isGeneratingSalesPDF, setIsGeneratingSalesPDF] = useState(false);
  const [isGeneratingAuditPDF, setIsGeneratingAuditPDF] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [isExportingCode, setIsExportingCode] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExportingFullCode, setIsExportingFullCode] = useState(false);
  const [fullCodeProgress, setFullCodeProgress] = useState(0);

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
        setAnalysisProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      // Lista COMPLETA y EXHAUSTIVA de todos los componentes del proyecto (210+ componentes)
      const componentsList = [
        // Admin components (65)
        'AdaptiveAuthDashboard.tsx', 'AdminSidebar.tsx', 'AdvancedCompanyFilters.tsx', 
        'AdvancedMLDashboard.tsx', 'AlertHistoryViewer.tsx', 'APIDocumentation.tsx',
        'ApplicationStateAnalyzer.tsx', 'AssistantKnowledgeManager.tsx', 'AuditLogsViewer.tsx',
        'AuditorDashboard.tsx', 'BulkGoalsAssignment.tsx', 'CascadeGoalsManager.tsx',
        'ChatFileUpload.tsx', 'CommercialDirectorDashboard.tsx', 'CommercialManagerAudit.tsx', 
        'CommercialManagerDashboard.tsx', 'CompaniesManager.tsx', 'CompaniesPagination.tsx', 
        'CompanyDataCompleteness.tsx', 'CompanyExportButton.tsx', 'ConceptsManager.tsx', 
        'ContractedProductsReport.tsx', 'CoreBankingManager.tsx', 'Customer360Panel.tsx',
        'CustomerSegmentationPanel.tsx', 'DORAComplianceDashboard.tsx', 'DirectorAlertsPanel.tsx', 
        'EmailTemplatesManager.tsx', 'EnhancedCompanyCard.tsx', 'ExcelImporter.tsx', 
        'GeocodingRecalculator.tsx', 'GestorDashboard.tsx', 'GestoresMetrics.tsx', 
        'GoalsKPIDashboard.tsx', 'GoalsProgressTracker.tsx', 'ISO27001Dashboard.tsx',
        'ImportHistoryViewer.tsx', 'InternalAssistantChat.tsx', 'KPIReportHistory.tsx',
        'MLExplainabilityPanel.tsx', 'MapTooltipConfig.tsx', 'MetricsExplorer.tsx', 
        'NotificationCenterManager.tsx', 'OfficeDirectorDashboard.tsx', 'PredictiveAnalyticsDashboard.tsx',
        'ProductsManager.tsx', 'ProductsMetrics.tsx', 'RFMDashboard.tsx', 'SMSManager.tsx',
        'SharedVisitsCalendar.tsx', 'StatusColorsManager.tsx', 'SystemHealthMonitor.tsx', 
        'TPVGoalsManager.tsx', 'TPVManager.tsx', 'UsersManager.tsx', 'VinculacionMetrics.tsx',
        'VisitSheetAuditViewer.tsx', 'VisitSheetValidationPanel.tsx', 
        'VisitSheetsGestorComparison.tsx', 'VisitsMetrics.tsx', 'VoiceRecordButton.tsx',
        'WhiteLabelConfig.tsx', 'AIIntegrationConfig.tsx',
        // SPM components (6)
        'SPMDashboard.tsx', 'AutonomousAIPanel.tsx', 'GamificationWidget.tsx',
        'PipelineIntelligence.tsx', 'QuotaAssignmentForm.tsx', 'RevenueIntelligence.tsx',
        // Accounting components (40)
        'AccountingCompanyIndex.tsx', 'AccountingGroupsChart.tsx', 'AccountingMainMenu.tsx',
        'AccountingManager.tsx', 'AddedValueAnalysis.tsx', 'AnalyticalPLChart.tsx',
        'AuditTab.tsx', 'BalanceAnalysisArea.tsx', 'BalanceSheetForm.tsx',
        'BankRatingAnalysis.tsx', 'CashFlowAnalysis.tsx', 'CashFlowAnalysisWrapper.tsx',
        'CashFlowForm.tsx', 'CompanySearchBar.tsx', 'ConsolidatedStatementsManager.tsx',
        'DuPontPyramid.tsx', 'EBITEBITDAAnalysis.tsx', 'EconomicFinancialDashboard.tsx',
        'EnhancedCompanyHeader.tsx', 'EquityChangesForm.tsx', 'FinancialAnalysisTab.tsx',
        'FinancialNotesManager.tsx', 'FinancialRAGChat.tsx', 'FinancialStatementsHistory.tsx',
        'FinancingStatement.tsx', 'IncomeStatementChart.tsx', 'IncomeStatementForm.tsx',
        'LiquidityDebtRatios.tsx', 'LongTermFinancialAnalysis.tsx', 
        'LongTermFinancialAnalysisWrapper.tsx', 'MovingAnnualTrendChart.tsx',
        'MultiYearComparison.tsx', 'PDFImportDialog.tsx', 'PeriodYearSelector.tsx',
        'ProfitabilityTab.tsx', 'ProvisionalStatementsManager.tsx', 'RatiosPyramid.tsx',
        'ReportsTab.tsx', 'SectorSimulator.tsx', 'SectoralRatiosAnalysis.tsx',
        'TreasuryMovements.tsx', 'ValuationTab.tsx', 'WorkingCapitalAnalysis.tsx',
        'WorkingCapitalAnalysisWrapper.tsx', 'WorkingCapitalNOF.tsx', 'ZScoreAnalysis.tsx',
        // Auth components (3)
        'PasskeyButton.tsx', 'PasskeyManager.tsx', 'StepUpAuthDialog.tsx',
        // Company components (10)
        'BankAffiliationsManager.tsx', 'CompanyDetail.tsx', 'CompanyPhotosManager.tsx',
        'CompanyPrintReport.tsx', 'ContactsManager.tsx', 'DocumentsManager.tsx',
        'ExcelExportDialog.tsx', 'PDFExportDialog.tsx', 'TPVTerminalsManager.tsx',
        'VisitSheetsHistory.tsx',
        // Dashboard components (58)
        'AccountingDashboardCard.tsx', 'ActionPlanManager.tsx', 'ActivityStatistics.tsx',
        'AdvancedAnalyticsDashboardCard.tsx', 'AlertHistoryDashboardCard.tsx', 'AlertsManager.tsx',
        'AnalisisCohortes.tsx', 'AnalisisEmbudo.tsx', 'AnalisisGeografico.tsx',
        'BestPracticeComments.tsx', 'BestPracticesPanel.tsx', 'CompaniesDashboardCard.tsx',
        'ComparativaTemporales.tsx', 'ContractedProductsDashboardCard.tsx', 'DashboardExportButton.tsx',
        'DateRangeFilter.tsx', 'EmailReminderPreferences.tsx', 'FilteredMetricsWrapper.tsx',
        'GestorComparison.tsx', 'GestorDashboardCard.tsx', 'GestorEvolutionTimeline.tsx',
        'GestorFilterSelector.tsx', 'GestorOverviewSection.tsx', 'GestoresLeaderboard.tsx',
        'GoalsAlertsDashboardCard.tsx', 'KPIDashboardCard.tsx', 'MLPredictions.tsx',
        'MapButton.tsx', 'MapDashboardCard.tsx', 'MetricsCardsSection.tsx',
        'MetricsDashboardCard.tsx', 'NotificationPreferences.tsx', 'NotificationService.tsx',
        'NotificationsPanel.tsx', 'ObjetivosYMetas.tsx', 'PersonalActivityHistory.tsx',
        'PersonalGoalsDetailedAnalysis.tsx', 'PersonalGoalsHistory.tsx', 'PersonalGoalsTracker.tsx',
        'PersonalKPIsDashboard.tsx', 'PowerBIExport.tsx', 'PrediccionesFuturas.tsx',
        'PushNotifications.tsx', 'QuickActionsPanel.tsx', 'QuickVisitManager.tsx',
        'QuickVisitSheetCard.tsx', 'RealtimeNotificationsBadge.tsx', 'ResumenEjecutivo.tsx',
        'SPMDashboardCard.tsx', 'TPVGestorRanking.tsx', 'TPVGoalsComparison.tsx', 
        'TPVGoalsDashboard.tsx', 'TPVGoalsHistory.tsx', 'UnifiedMetricsDashboard.tsx', 
        'UpcomingVisitsWidget.tsx', 'VisitReminders.tsx',
        // Map components (18)
        'CompanyPhotosDialog.tsx', 'GeoSearch.tsx', 'LazyMapContainer.tsx',
        'MapContainer.tsx', 'MapContainerTypes.ts', 'MapExportButton.tsx',
        'MapHeader.tsx', 'MapLayersControl.tsx', 'MapLegend.tsx',
        'MapSidebar.tsx', 'MapSkeleton.tsx', 'MapStatisticsPanel.tsx',
        'OpportunityHeatmap.tsx', 'RoutePlanner.tsx', 'SectorStats.tsx',
        'VisitsPanel.tsx', 'markerIcons.tsx', 'markerStyles.tsx',
        // Visit components (6)
        'AISummaryButton.tsx', 'ParticipantsSelector.tsx', 'SignaturePad.tsx', 
        'VisitSheetForm.tsx', 'VisitSheetPhotos.tsx', 'VisitSheetTemplateSelector.tsx',
        // Reports components (6)
        'AppDetailedStatusGenerator.tsx', 'CodebaseIndexGenerator.tsx',
        'CompetitorGapAnalysisGenerator.tsx', 'DynamicTechnicalDocGenerator.tsx',
        'ReportGenerator.tsx', 'TechnicalDocumentGenerator.tsx',
        // Security components (1)
        'MFAEnforcementDialog.tsx',
        // Help components (3)
        'HelpButton.tsx', 'HelpCenter.tsx', 'SuggestionBox.tsx',
        // Performance components (4)
        'OptimizedImage.tsx', 'PerformanceMonitor.tsx', 'SSRCacheProvider.tsx', 'StreamingBoundary.tsx',
        // eIDAS components (1)
        'EIDASVerificationPanel.tsx',
        // Presence components (1)
        'OnlineUsersIndicator.tsx',
        // Chat components
        'ChatMessage.tsx', 'ChatRoom.tsx', 'ChatRoomsList.tsx', 'ChatTypingIndicator.tsx',
        // Pipeline components
        'OpportunityCard.tsx', 'OpportunitySidebar.tsx', 'PipelineBoard.tsx',
        // UI/Root components (6)
        'ConflictDialog.tsx', 'ErrorBoundary.tsx', 'GlobalNavHeader.tsx',
        'LanguageSelector.tsx', 'LanguageSelectorHeader.tsx', 'NavLink.tsx', 'ThemeSelector.tsx'
      ];
      
      // Lista COMPLETA de todos los hooks (54 total)
      const hooksList = [
        'use-mobile', 'use-toast', 'useAIAgents', 'useAMLFraudDetection', 
        'useAchievementNotifications', 'useAdaptiveAuth', 'useAdvancedMLScoring',
        'useAnomalyDetection', 'useAuth', 'useBehavioralBiometrics', 'useCelebration',
        'useChurnPrediction', 'useCompaniesServerPagination', 'useCompanyPhotosLazy',
        'useCreditScoring', 'useCustomer360', 'useDeepLearning', 'useDeferredValue',
        'useEIDAS', 'useGoalsQuery', 'useIntelligentOCR', 'useMFAEnforcement',
        'useMLExplainability', 'useModelRegistry', 'useNavigationHistory', 'useNotifications',
        'useNotificationsQuery', 'useOfflineSync', 'useOpportunities', 'useOptimisticLock',
        'usePartytown', 'usePerformanceMonitor', 'usePresence', 'useProductRecommendations',
        'usePushNotifications', 'useRandomForest', 'useReact19Actions', 'useRealtimeChannel',
        'useRealtimeChat', 'useSMS', 'useSalesPerformance', 'useSpeculationRules',
        'useStreamingData', 'useTransactionEnrichment', 'useTransitionState',
        'useViewTransitions', 'useVisitSummary', 'useVisitsQuery', 'useVoiceChat',
        'useVoiceRecorder', 'useWebAuthn', 'useWebVitals', 'useWidgetLayout', 'useXAMA'
      ];
      
      // Lista COMPLETA de todas las Edge Functions (72 total) - ACTUALIZADO DICIEMBRE 2024
      const edgeFunctions = [
        // IA y Análisis (8)
        'advanced-ml-scoring', 'analyze-codebase', 'analyze-system-issues', 'generate-action-plan',
        'generate-ml-predictions', 'search-ai-recommendations', 'search-improvements', 'summarize-visit',
        // CRM y Clientes (7)
        'calculate-customer-360', 'calculate-rfm-analysis', 'calculate-sales-performance',
        'segment-customers-ml', 'smart-column-mapping', 'search-company-photo', 'product-recommendations',
        // Finanzas y Contabilidad (4)
        'financial-rag-chat', 'generate-financial-embeddings', 'parse-financial-pdf', 'open-banking-api',
        // ML y Deep Learning (7)
        'credit-scoring', 'deep-learning-predict', 'detect-anomalies', 'detect-revenue-signals',
        'ml-explainability', 'predict-churn', 'random-forest-predict',
        // Mapas y Geolocalización (8)
        'geocode-address', 'optimize-route', 'get-mapbox-token', 'mapbox-directions', 
        'mapbox-elevation', 'mapbox-isochrone', 'mapbox-matrix', 'mapbox-static', 'proxy-map-tiles',
        // Alertas y Monitoreo (7)
        'check-alerts', 'check-goal-achievements', 'check-goals-at-risk', 'check-low-performance',
        'check-visit-reminders', 'check-visit-sheet-reminders', 'escalate-alerts',
        // Notificaciones (12)
        'dispatch-webhook', 'notify-visit-validation', 'send-alert-email', 'send-critical-opportunity-email',
        'send-daily-kpi-report', 'send-goal-achievement-email', 'send-monthly-kpi-report', 
        'send-monthly-reports', 'send-push-notification', 'send-reminder-email', 'send-sms',
        'send-step-up-otp', 'send-visit-calendar-invite', 'send-weekly-kpi-report',
        // Seguridad y Auth (5)
        'evaluate-session-risk', 'verify-step-up-challenge', 'webauthn-verify', 'manage-user',
        // Sistema y Utilidades (7)
        'core-banking-adapter', 'enrich-transaction', 'generate-ai-tasks', 'generate-kpis',
        'intelligent-ocr', 'internal-assistant-chat', 'voice-to-text',
        // DORA/Salud Sistema (3)
        'run-stress-test', 'scheduled-health-check', 'system-health'
      ];
      
      const pagesList = ['Dashboard', 'MapView', 'Admin', 'Profile', 'VisitSheets', 'Home', 'Auth', 'Index', 'NotFound'];

      // Información de seguridad implementada
      const securityFeatures = [
        'RLS (Row Level Security) en todas las tablas críticas',
        'JWT verification en Edge Functions críticas',
        'Autenticación Multifactor Adaptativa (AMA) - PSD2/PSD3 compliant',
        'WebAuthn/Passkeys para autenticación sin contraseña',
        'Step-Up Authentication con OTP por email',
        'Evaluación de riesgo de sesión con geolocalización IP',
        'Detección de VPN/Proxy en autenticación',
        'Dispositivos de confianza con fingerprinting',
        'Rate limiting en APIs (100 req/hora geocoding)',
        'Sanitización XSS con DOMPurify',
        'Optimistic locking para edición concurrente',
        'TLS 1.3 en tránsito',
        'Secrets via Supabase Vault',
        'Auditoría completa de acciones (audit_logs)',
        'DORA/NIS2 compliance dashboard con stress tests automatizados',
        'Autenticación basada en roles (RBAC)',
        'Session risk scoring automático',
        'Simulaciones stress test DORA: disponibilidad, capacidad, failover, cyber-attack, recuperación, red'
      ];

      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: {
          fileStructure: 'src/components (220+ componentes), src/hooks (54 hooks), src/pages (9 páginas), supabase/functions (72 edge functions)',
          componentsList,
          hooksList,
          edgeFunctions,
          pagesList,
          securityFeatures,
          totalComponents: componentsList.length,
          totalHooks: hooksList.length,
          totalEdgeFunctions: edgeFunctions.length,
          totalPages: pagesList.length
        }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) throw error;

      setCodebaseAnalysis(data);
      toast.success('Anàlisi exhaustiu del codi completat');
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
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Set default fonts - Times for body (professional), Helvetica for headers
      doc.setFont('times', 'normal');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 5; // Standard line height for body text
      
      // Sanitize text for PDF - handle accented characters and unicode
      const sanitizeText = (text: string): string => {
        if (!text) return '';
        return text
          // Status symbols
          .replace(/✅/g, '[OK]')
          .replace(/⏳/g, '[PEND]')
          .replace(/✓/g, 'OK')
          .replace(/○/g, 'o')
          .replace(/•/g, '-')
          .replace(/→/g, '->')
          .replace(/←/g, '<-')
          .replace(/★/g, '*')
          .replace(/☆/g, '*')
          .replace(/✔/g, 'OK')
          .replace(/✘/g, 'X')
          .replace(/❌/g, '[X]')
          .replace(/⚠/g, '[!]')
          .replace(/🔒/g, '')
          .replace(/🔓/g, '')
          .replace(/📊/g, '')
          .replace(/📈/g, '')
          .replace(/📉/g, '')
          .replace(/💡/g, '')
          .replace(/🚀/g, '')
          .replace(/⚡/g, '')
          .replace(/🔥/g, '')
          .replace(/✨/g, '')
          .replace(/🎯/g, '')
          .replace(/📋/g, '')
          .replace(/📁/g, '')
          .replace(/📂/g, '')
          .replace(/🔧/g, '')
          .replace(/⚙/g, '')
          .replace(/🛡/g, '')
          .replace(/🏦/g, '')
          .replace(/💼/g, '')
          .replace(/📱/g, '')
          .replace(/💻/g, '')
          .replace(/🌐/g, '')
          // Accented vowels - uppercase
          .replace(/[ÀÁÂÃÄÅ]/g, 'A')
          .replace(/[ÈÉÊË]/g, 'E')
          .replace(/[ÌÍÎÏ]/g, 'I')
          .replace(/[ÒÓÔÕÖ]/g, 'O')
          .replace(/[ÙÚÛÜ]/g, 'U')
          .replace(/Ñ/g, 'N')
          .replace(/Ç/g, 'C')
          // Accented vowels - lowercase
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/ñ/g, 'n')
          .replace(/ç/g, 'c')
          // Special characters
          .replace(/«/g, '"')
          .replace(/»/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/–/g, '-')
          .replace(/—/g, '-')
          .replace(/…/g, '...')
          .replace(/·/g, '.')
          .replace(/€/g, 'EUR')
          .replace(/£/g, 'GBP')
          .replace(/¥/g, 'JPY')
          .replace(/©/g, '(c)')
          .replace(/®/g, '(R)')
          .replace(/™/g, '(TM)')
          .replace(/°/g, ' deg')
          .replace(/±/g, '+/-')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/≤/g, '<=')
          .replace(/≥/g, '>=')
          .replace(/≠/g, '!=')
          .replace(/∞/g, 'inf')
          // Remove any remaining non-printable or extended characters
          .replace(/[^\x20-\x7E]/g, '')
          .trim();
      };
      
      // Color palette
      const colors = {
        primary: [30, 64, 175] as [number, number, number],      // Blue
        secondary: [16, 185, 129] as [number, number, number],   // Green
        accent: [139, 92, 246] as [number, number, number],      // Purple
        warning: [245, 158, 11] as [number, number, number],     // Amber
        danger: [239, 68, 68] as [number, number, number],       // Red
        dark: [30, 41, 59] as [number, number, number],          // Slate
        light: [241, 245, 249] as [number, number, number],      // Light gray
        white: [255, 255, 255] as [number, number, number],
      };

      // Helper functions
      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setFillColor(...colors.dark);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setTextColor(...colors.white);
        doc.setFontSize(8);
        doc.text('ObelixIA - CRM Bancari Intel·ligent', margin, pageHeight - 5);
        doc.text(`Pàgina ${pageNum} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 5);
        doc.text(new Date().toLocaleDateString('ca-ES'), pageWidth / 2, pageHeight - 5, { align: 'center' });
      };

      const drawProgressBar = (x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) => {
        // Background
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(x, y, width, height, 2, 2, 'F');
        // Progress
        doc.setFillColor(...color);
        const progressWidth = (width * Math.min(percentage, 100)) / 100;
        if (progressWidth > 0) {
          doc.roundedRect(x, y, progressWidth, height, 2, 2, 'F');
        }
      };

      const drawStatCard = (x: number, y: number, width: number, height: number, title: string, value: string, color: [number, number, number]) => {
        // Card background
        doc.setFillColor(...colors.white);
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, width, height, 3, 3, 'FD');
        // Color accent bar
        doc.setFillColor(...color);
        doc.rect(x, y, 4, height, 'F');
        // Title
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(title, x + 8, y + 8);
        // Value
        doc.setTextColor(...colors.dark);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(value, x + 8, y + 20);
      };

      // ===============================
      // PAGE 1: COVER PAGE
      // ===============================
      // Gradient-like header
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 100, 'F');
      doc.setFillColor(20, 50, 140);
      doc.rect(0, 80, pageWidth, 30, 'F');
      
      // Logo area - professional hexagonal design
      const logoX = pageWidth / 2;
      const logoY = 45;
      const logoSize = 22;
      
      // Outer hexagon (white background)
      doc.setFillColor(...colors.white);
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        hexPoints.push([logoX + logoSize * Math.cos(angle), logoY + logoSize * Math.sin(angle)]);
      }
      doc.setLineWidth(0);
      doc.moveTo(hexPoints[0][0], hexPoints[0][1]);
      for (let i = 1; i < 6; i++) {
        doc.lineTo(hexPoints[i][0], hexPoints[i][1]);
      }
      doc.lineTo(hexPoints[0][0], hexPoints[0][1]);
      doc.fill();
      
      // Inner accent circle
      doc.setFillColor(20, 50, 140);
      doc.circle(logoX, logoY, 15, 'F');
      
      // Logo text
      doc.setTextColor(...colors.white);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('OIA', logoX, logoY + 5, { align: 'center' });
      
      // Decorative ring
      doc.setDrawColor(...colors.white);
      doc.setLineWidth(1.5);
      doc.circle(logoX, logoY, 18, 'S');
      
      // Title
      doc.setTextColor(...colors.white);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORME D\'ESTAT', pageWidth / 2, 125, { align: 'center' });
      doc.setFontSize(14);
      doc.text('DE L\'APLICACIÓ', pageWidth / 2, 135, { align: 'center' });
      
      // Subtitle
      doc.setTextColor(...colors.dark);
      doc.setFontSize(18);
      doc.text('ObelixIA - CRM Bancari Intel·ligent', pageWidth / 2, 160, { align: 'center' });
      
      // Version and date box
      doc.setFillColor(...colors.light);
      doc.roundedRect(pageWidth / 2 - 50, 175, 100, 35, 5, 5, 'F');
      doc.setTextColor(...colors.dark);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Versió: ${codebaseAnalysis?.version || '8.0.0'}`, pageWidth / 2, 188, { align: 'center' });
      doc.text(`Generat: ${new Date().toLocaleDateString('ca-ES')}`, pageWidth / 2, 198, { align: 'center' });
      
      // Key stats on cover
      const stats = codebaseAnalysis?.codeStats || { totalComponents: 195, totalHooks: 24, totalEdgeFunctions: 50, totalPages: 9 };
      const statY = 230;
      drawStatCard(margin, statY, 40, 30, 'Components', String(stats.totalComponents), colors.primary);
      drawStatCard(margin + 45, statY, 40, 30, 'Edge Func.', String(stats.totalEdgeFunctions), colors.secondary);
      drawStatCard(margin + 90, statY, 40, 30, 'Hooks', String(stats.totalHooks), colors.accent);
      drawStatCard(margin + 135, statY, 40, 30, 'Pàgines', String(stats.totalPages), colors.warning);
      
      // Confidential footer
      doc.setFillColor(...colors.dark);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(9);
      doc.text('DOCUMENT CONFIDENCIAL - ÚS INTERN', pageWidth / 2, pageHeight - 8, { align: 'center' });

      // ===============================
      // PAGE 2: TABLE OF CONTENTS
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ÍNDEX DE CONTINGUTS', margin, 17);
      
      let tocY = 45;
      doc.setTextColor(...colors.dark);
      
      const tocItems = [
        { num: '1', title: 'Resum Executiu', page: 3 },
        { num: '2', title: 'Estadístiques del Projecte', page: 3 },
        { num: '3', title: 'Mòduls de l\'Aplicació', page: 4 },
        { num: '4', title: 'Seguretat Implementada', page: 5 },
        { num: '5', title: 'Compliance Normatiu', page: 6 },
        { num: '6', title: 'Tendències Tecnològiques', page: 7 },
        { num: '7', title: 'Millores Suggerides', page: 8 },
        { num: '8', title: 'Integracions IA', page: 9 },
        { num: '9', title: 'Optimitzacions de Rendiment', page: 10 },
      ];
      
      tocItems.forEach((item) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text(item.num + '.', margin, tocY);
        doc.setTextColor(...colors.dark);
        doc.setFont('helvetica', 'normal');
        doc.text(item.title, margin + 10, tocY);
        // Dotted line
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(margin + 80, tocY, pageWidth - margin - 15, tocY);
        doc.setLineDashPattern([], 0);
        // Page number
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.page), pageWidth - margin - 5, tocY);
        tocY += 12;
      });

      // ===============================
      // PAGE 3: EXECUTIVE SUMMARY
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('1. RESUM EXECUTIU', margin, 17);
      
      let yPos = 40;
      
      // Executive summary text - formatted with better typography
      if (improvementsAnalysis?.summary) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 70, 4, 4, 'F');
        
        // Add left accent bar
        doc.setFillColor(...colors.primary);
        doc.rect(margin, yPos, 3, 70, 'F');
        
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        const sanitizedSummary = sanitizeText(improvementsAnalysis.summary);
        const summaryLines = doc.splitTextToSize(sanitizedSummary, contentWidth - 15);
        
        // Add lines with proper spacing
        let textY = yPos + 10;
        summaryLines.slice(0, 12).forEach((line: string) => {
          doc.text(line, margin + 8, textY);
          textY += lineHeight;
        });
        yPos += 80;
      }
      
      // Statistics section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('2. ESTADÍSTIQUES DEL PROJECTE', margin, yPos);
      yPos += 15;
      
      // Stats grid
      const cardWidth = (contentWidth - 15) / 4;
      drawStatCard(margin, yPos, cardWidth, 35, 'Completitud Global', `${overallCompletion}%`, colors.primary);
      drawStatCard(margin + cardWidth + 5, yPos, cardWidth, 35, 'Mòduls', String(codebaseAnalysis?.modules?.length || 16), colors.secondary);
      drawStatCard(margin + (cardWidth + 5) * 2, yPos, cardWidth, 35, 'Edge Functions', String(stats.totalEdgeFunctions), colors.accent);
      drawStatCard(margin + (cardWidth + 5) * 3, yPos, cardWidth, 35, 'Compliance', `${improvementsAnalysis?.complianceRegulations?.filter(r => r.status === 'compliant').length || 0}/${improvementsAnalysis?.complianceRegulations?.length || 0}`, colors.warning);
      yPos += 50;
      
      // Technology summary
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.dark);
      doc.text('Stack Tecnològic Principal:', margin, yPos);
      yPos += 8;
      
      const techStack = ['React 19', 'TypeScript', 'Supabase', 'Tailwind CSS', 'MapLibre GL', 'Recharts', 'jsPDF'];
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      techStack.forEach((tech, idx) => {
        const x = margin + (idx % 4) * 45;
        const y = yPos + Math.floor(idx / 4) * 8;
        doc.setFillColor(...colors.secondary);
        doc.circle(x, y - 1, 1.5, 'F');
        doc.text(tech, x + 4, y);
      });

      // ===============================
      // PAGE 4: MODULES
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('3. MÒDULS DE L\'APLICACIÓ', margin, 17);
      
      yPos = 35;
      
      if (codebaseAnalysis?.modules && Array.isArray(codebaseAnalysis.modules)) {
        const moduleData = codebaseAnalysis.modules.map((m, idx) => [
          String(idx + 1),
          sanitizeText(m.name || 'N/A'),
          `${m.completionPercentage || 0}%`,
          sanitizeText(m.businessValue || 'Alt')
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Num', 'Modul', 'Completitud', 'Valor']],
          body: moduleData,
          theme: 'grid',
          headStyles: {
            fillColor: colors.primary,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: 10,
            font: 'helvetica',
            halign: 'center',
            overflow: 'linebreak',
          },
          bodyStyles: {
            fontSize: 10,
            textColor: colors.dark,
            font: 'times',
            overflow: 'linebreak',
          },
          styles: {
            font: 'times',
            cellPadding: 5,
            overflow: 'linebreak',
          },
          alternateRowStyles: {
            fillColor: colors.light,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 35, halign: 'center' },
            3: { cellWidth: 45, halign: 'left' },
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth,
          didDrawCell: (data) => {
            if (data.column.index === 2 && data.section === 'body') {
              const percentage = parseInt(String(data.cell.raw).replace('%', '')) || 0;
              const color = percentage >= 90 ? colors.secondary : percentage >= 70 ? colors.warning : colors.danger;
              doc.setFillColor(...color);
              doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 2, 'F');
            }
          },
        });
      }

      // ===============================
      // PAGE 5: SECURITY
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.secondary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('4. SEGURETAT IMPLEMENTADA', margin, 17);
      
      yPos = 35;
      
      if (codebaseAnalysis?.securityFindings && codebaseAnalysis.securityFindings.length > 0) {
        const securityData = codebaseAnalysis.securityFindings.map((finding) => [
          'v',
          sanitizeText(String(finding))
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['', 'Control de Seguretat Implementat']],
          body: securityData,
          theme: 'striped',
          headStyles: {
            fillColor: colors.secondary,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: 11,
            font: 'helvetica',
          },
          bodyStyles: {
            fontSize: 10,
            textColor: colors.dark,
            font: 'times',
          },
          styles: {
            font: 'times',
            cellPadding: 5,
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center', textColor: colors.secondary },
            1: { cellWidth: contentWidth - 15 },
          },
          margin: { left: margin, right: margin },
        });
      }

      // ===============================
      // PAGE 6: COMPLIANCE
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.accent);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('5. COMPLIANCE NORMATIU', margin, 17);
      
      yPos = 35;
      
      if (improvementsAnalysis?.complianceRegulations && improvementsAnalysis.complianceRegulations.length > 0) {
        const complianceData = improvementsAnalysis.complianceRegulations.map((reg) => [
          sanitizeText(reg.name || 'N/A'),
          reg.status === 'compliant' ? 'COMPLERT' : reg.status === 'partial' ? 'PARCIAL' : 'PENDENT',
          `${reg.compliancePercentage || (reg.status === 'compliant' ? 100 : 80)}%`,
          sanitizeText(reg.jurisdiction || 'EU')
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Normativa', 'Estat', '% Complet', 'Jurisdiccio']],
          body: complianceData,
          theme: 'grid',
          headStyles: {
            fillColor: colors.accent,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: 10,
            font: 'helvetica',
            halign: 'center',
          },
          bodyStyles: {
            fontSize: 10,
            textColor: colors.dark,
            font: 'times',
          },
          styles: {
            font: 'times',
            cellPadding: 5,
          },
          columnStyles: {
            0: { cellWidth: 70, halign: 'left' },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 35, halign: 'center' },
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth,
          didDrawCell: (data) => {
            if (data.column.index === 1 && data.section === 'body') {
              const status = String(data.cell.raw);
              const color = status === 'COMPLERT' ? colors.secondary : status === 'PARCIAL' ? colors.warning : colors.danger;
              doc.setTextColor(...color);
            }
          },
        });
      }

      // ===============================
      // PAGE 7: TECHNOLOGY TRENDS
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.warning);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('6. TENDENCIES TECNOLOGIQUES', margin, 17);
      
      yPos = 35;
      
      if (improvementsAnalysis?.detailedTrends && improvementsAnalysis.detailedTrends.length > 0) {
        const trendsInstalled = improvementsAnalysis.detailedTrends.filter(t => t.installed);
        const trendsPending = improvementsAnalysis.detailedTrends.filter(t => !t.installed);
        
        // Installed section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.secondary);
        doc.text(`INSTALLADES (${trendsInstalled.length})`, margin, yPos);
        yPos += 8;
        
        const installedData = trendsInstalled.slice(0, 10).map((t) => [
          `#${t.number}`,
          sanitizeText(t.name),
          sanitizeText(t.relevance || 'Alta'),
          'OK'
        ]);
        
        if (installedData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            head: [['Num', 'Tecnologia', 'Rellevancia', 'Estat']],
            body: installedData,
            theme: 'striped',
            headStyles: {
              fillColor: colors.secondary,
              textColor: colors.white,
              fontStyle: 'bold',
              fontSize: 10,
              font: 'helvetica',
              halign: 'center',
            },
            bodyStyles: {
              fontSize: 10,
              font: 'times',
            },
            styles: {
              font: 'times',
              cellPadding: 5,
            },
            columnStyles: {
              0: { cellWidth: 18, halign: 'center' },
              1: { cellWidth: 100, halign: 'left' },
              2: { cellWidth: 35, halign: 'center' },
              3: { cellWidth: 20, halign: 'center', textColor: colors.secondary },
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
        
        // Pending section
        if (trendsPending.length > 0) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.warning);
          doc.text(`PENDENTS (${trendsPending.length})`, margin, yPos);
          yPos += 8;
          
          const pendingData = trendsPending.slice(0, 5).map((t) => [
            `#${t.number}`,
            sanitizeText(t.name),
            sanitizeText(t.relevance || 'Mitjana'),
            'o'
          ]);
          
          autoTable(doc, {
            startY: yPos,
            head: [['Num', 'Tecnologia', 'Rellevancia', 'Estat']],
            body: pendingData,
            theme: 'striped',
            headStyles: {
              fillColor: colors.warning,
              textColor: colors.white,
              fontStyle: 'bold',
              fontSize: 10,
              font: 'helvetica',
              halign: 'center',
            },
            bodyStyles: {
              fontSize: 10,
              font: 'times',
            },
            styles: {
              font: 'times',
              cellPadding: 5,
            },
            columnStyles: {
              0: { cellWidth: 18, halign: 'center' },
              1: { cellWidth: 100, halign: 'left' },
              2: { cellWidth: 35, halign: 'center' },
              3: { cellWidth: 20, halign: 'center', textColor: colors.warning },
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
          });
        }
      }

      // ===============================
      // PAGE 8: IMPROVEMENTS
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.danger);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('7. MILLORES SUGGERIDES', margin, 17);
      
      yPos = 35;
      
      if (improvementsAnalysis?.improvements && improvementsAnalysis.improvements.length > 0) {
        const improvementData = improvementsAnalysis.improvements.slice(0, 15).map((imp, idx) => [
          String(idx + 1),
          sanitizeText(imp.title || 'N/A'),
          (imp.priority || 'media').toUpperCase(),
          sanitizeText(imp.effort || 'N/A'),
          sanitizeText(imp.impact || 'N/A')
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Num', 'Millora Suggerida', 'Prioritat', 'Esforc', 'Impacte']],
          body: improvementData,
          theme: 'grid',
          headStyles: {
            fillColor: colors.danger,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: 10,
            font: 'helvetica',
            halign: 'center',
            overflow: 'linebreak',
          },
          bodyStyles: {
            fontSize: 10,
            font: 'times',
          },
          styles: {
            font: 'times',
            cellPadding: 5,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 75, halign: 'left' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 28, halign: 'center' },
            4: { cellWidth: 28, halign: 'center' },
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth,
          didDrawCell: (data) => {
            if (data.column.index === 2 && data.section === 'body') {
              const priority = String(data.cell.raw);
              const color = priority === 'ALTA' ? colors.danger : priority === 'MEDIA' ? colors.warning : colors.secondary;
              doc.setTextColor(...color);
            }
          },
        });
      }

      // ===============================
      // PAGE 9: AI INTEGRATIONS
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.accent);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('8. INTEGRACIONS IA', margin, 17);
      
      yPos = 35;
      
      if (improvementsAnalysis?.aiIntegrations && improvementsAnalysis.aiIntegrations.length > 0) {
        const aiData = improvementsAnalysis.aiIntegrations.map((ai, idx) => {
          const text = sanitizeText(String(ai));
          const isInstalled = String(ai).includes('[OK] INSTALLAT') || String(ai).includes('INSTAL');
          return [
            String(idx + 1),
            text.replace('[OK] INSTALLAT:', '').replace('[PEND] PENDENT:', '').replace('INSTAL.LAT:', '').replace('PENDENT:', '').trim(),
            isInstalled ? 'ACTIU' : 'PENDENT'
          ];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['Num', 'Integracio IA', 'Estat']],
          body: aiData,
          theme: 'striped',
          headStyles: {
            fillColor: colors.accent,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: 10,
            font: 'helvetica',
            halign: 'center',
            overflow: 'linebreak',
          },
          bodyStyles: {
            fontSize: 10,
            font: 'times',
          },
          styles: {
            font: 'times',
            cellPadding: 5,
          },
          columnStyles: {
            0: { cellWidth: 18, halign: 'center' },
            1: { cellWidth: 125, halign: 'left' },
            2: { cellWidth: 30, halign: 'center' },
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth,
          didDrawCell: (data) => {
            if (data.column.index === 2 && data.section === 'body') {
              const status = String(data.cell.raw);
              const color = status === 'ACTIU' ? colors.secondary : colors.warning;
              doc.setTextColor(...color);
            }
          },
        });
      }

      // ===============================
      // PAGE 10: PERFORMANCE
      // ===============================
      doc.addPage();
      
      // Header
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('9. OPTIMITZACIONS DE RENDIMENT', margin, 17);
      
      yPos = 35;
      
      if (improvementsAnalysis?.performanceOptimizations && improvementsAnalysis.performanceOptimizations.length > 0) {
        const perfData = improvementsAnalysis.performanceOptimizations.map((opt, idx) => {
          const text = sanitizeText(String(opt));
          const isInstalled = String(opt).includes('[OK] INSTALLAT') || String(opt).includes('INSTAL');
          return [
            String(idx + 1),
            text.replace('[OK] INSTALLAT:', '').replace('[PEND] PENDENT:', '').replace('INSTAL.LAT:', '').replace('PENDENT:', '').trim(),
            isInstalled ? 'ACTIU' : 'PENDENT'
          ];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['Num', 'Optimitzacio de Rendiment', 'Estat']],
          body: perfData,
          theme: 'striped',
          headStyles: {
            fillColor: colors.primary,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: 10,
            font: 'helvetica',
            halign: 'center',
            overflow: 'linebreak',
          },
          bodyStyles: {
            fontSize: 10,
            font: 'times',
          },
          styles: {
            font: 'times',
            cellPadding: 5,
          },
          columnStyles: {
            0: { cellWidth: 18, halign: 'center' },
            1: { cellWidth: 125, halign: 'left' },
            2: { cellWidth: 30, halign: 'center' },
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth,
          didDrawCell: (data) => {
            if (data.column.index === 2 && data.section === 'body') {
              const status = String(data.cell.raw);
              const color = status === 'ACTIU' ? colors.secondary : colors.warning;
              doc.setTextColor(...color);
            }
          },
        });
      }
      
      // Final summary stats
      yPos = (doc as any).lastAutoTable?.finalY + 20 || 150;
      
      doc.setFillColor(...colors.light);
      doc.roundedRect(margin, yPos, contentWidth, 40, 5, 5, 'F');
      
      doc.setTextColor(...colors.dark);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUM FINAL', margin + 5, yPos + 10);
      
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      const finalStats = [
        'Completitud Global: ' + overallCompletion + '%',
        'Moduls Completats: ' + (codebaseAnalysis?.modules?.filter(m => m.completionPercentage >= 90).length || 0) + '/' + (codebaseAnalysis?.modules?.length || 0),
        'Controls de Seguretat: ' + (codebaseAnalysis?.securityFindings?.length || 0),
        'Normatives Complertes: ' + (improvementsAnalysis?.complianceRegulations?.filter(r => r.status === 'compliant').length || 0) + '/' + (improvementsAnalysis?.complianceRegulations?.length || 0),
      ];
      doc.text(finalStats, margin + 5, yPos + 20);

      // ===============================
      // ADD FOOTERS TO ALL PAGES
      // ===============================
      const totalPages = doc.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i - 1, totalPages - 1);
      }

      // Save PDF
      doc.save(`informe-obelixia-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF professional generat correctament!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(`Error generant PDF: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ============================================
  // GENERATE SALES PDF - PROPOSTA COMERCIAL ESPECTACULAR
  // ============================================
  const generateSalesPDF = async () => {
    setIsGeneratingSalesPDF(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFont('times', 'normal');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      
      // Sanitize text helper
      const sanitizeText = (text: string): string => {
        if (!text) return '';
        return text
          .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/ñ/g, 'n').replace(/ç/g, 'c')
          .replace(/[ÀÁÂÃÄÅ]/g, 'A').replace(/[ÈÉÊË]/g, 'E').replace(/[ÌÍÎÏ]/g, 'I')
          .replace(/[ÒÓÔÕÖ]/g, 'O').replace(/[ÙÚÛÜ]/g, 'U').replace(/Ñ/g, 'N').replace(/Ç/g, 'C')
          .replace(/€/g, 'EUR').replace(/✅/g, '[OK]').replace(/❌/g, '[X]')
          .replace(/[^\x20-\x7E]/g, '').trim();
      };
      
      // Premium color palette
      const colors = {
        gold: [212, 175, 55] as [number, number, number],
        darkBlue: [15, 32, 75] as [number, number, number],
        accentBlue: [45, 90, 165] as [number, number, number],
        success: [34, 139, 34] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
        lightGray: [245, 245, 245] as [number, number, number],
        darkGray: [60, 60, 60] as [number, number, number],
      };

      // ========================================
      // COVER PAGE - IMPACTANTE
      // ========================================
      // Full background gradient effect
      doc.setFillColor(...colors.darkBlue);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Gold accent bar
      doc.setFillColor(...colors.gold);
      doc.rect(0, 100, pageWidth, 3, 'F');
      doc.rect(0, 175, pageWidth, 3, 'F');
      
      // Main title
      doc.setTextColor(...colors.gold);
      doc.setFontSize(42);
      doc.setFont('helvetica', 'bold');
      doc.text('ObelixIA', pageWidth / 2, 70, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.white);
      doc.text('CRM Bancari Intel.ligent', pageWidth / 2, 85, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('PROPOSTA COMERCIAL', pageWidth / 2, 125, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('times', 'italic');
      doc.text('La revolucio digital per a la banca comercial', pageWidth / 2, 140, { align: 'center' });
      
      // Key stats
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.gold);
      doc.text('95%', 50, 210, { align: 'center' });
      doc.text('72', pageWidth / 2, 210, { align: 'center' });
      doc.text('520%', pageWidth - 50, 210, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'normal');
      doc.text('Completitud', 50, 220, { align: 'center' });
      doc.text('Funcions IA', pageWidth / 2, 220, { align: 'center' });
      doc.text('ROI 5 anys', pageWidth - 50, 220, { align: 'center' });
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(...colors.gold);
      doc.text('Confidencial - ' + new Date().toLocaleDateString('ca-ES'), pageWidth / 2, pageHeight - 20, { align: 'center' });

      // ========================================
      // PAGE 2 - EXECUTIVE SUMMARY
      // ========================================
      doc.addPage();
      let yPos = 20;
      
      doc.setFillColor(...colors.gold);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(...colors.darkBlue);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUM EXECUTIU', margin, 20);
      
      yPos = 45;
      doc.setTextColor(...colors.darkGray);
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      
      const executiveSummary = [
        'ObelixIA es la plataforma CRM bancaria mes avancada del mercat, dissenyada especificament per a',
        'entitats financeres d\'Andorra, Espanya i Europa. Ofereix una solucio completa que integra:',
        '',
        '[OK] Gestio de cartera empresarial amb 20.000+ empreses geolocalitzades',
        '[OK] Contabilitat PGC Andorra/Espanya amb analisi financera automatitzada', 
        '[OK] IA generativa amb 72 Edge Functions intel.ligents',
        '[OK] Compliance total: ISO 27001, DORA, NIS2, PSD2/PSD3, Basel III/IV',
        '[OK] Autenticacio adaptativa MFA amb biometria comportamental',
        '',
        'VALOR DIFERENCIAL:',
        '- Estalvi vs competidors: 80% menys cost que Salesforce FSC o Temenos',
        '- Temps implantacio: 4-8 setmanes vs 12-18 mesos alternatives',
        '- ROI demostrat: 520% en 5 anys amb break-even a 8 mesos',
      ];
      
      executiveSummary.forEach(line => {
        doc.text(sanitizeText(line), margin, yPos);
        yPos += 6;
      });
      
      // Highlight box
      yPos += 10;
      doc.setFillColor(...colors.lightGray);
      doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');
      doc.setDrawColor(...colors.gold);
      doc.setLineWidth(1);
      doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'S');
      
      doc.setTextColor(...colors.darkBlue);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INVERSIO: 95.000 EUR llicencia perpetua', margin + 10, yPos + 12);
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      doc.text('Inclou: Implementacio, formacio, 12 mesos manteniment, personalitzacio marca blanca', margin + 10, yPos + 22);
      doc.text('Preu per usuari subscripcio: 89 EUR/mes (minim 10 usuaris)', margin + 10, yPos + 30);

      // ========================================
      // PAGE 3 - MODULS PRINCIPALS
      // ========================================
      doc.addPage();
      
      doc.setFillColor(...colors.accentBlue);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('MODULS PRINCIPALS', margin, 20);
      
      const modules = codebaseAnalysis?.modules?.slice(0, 12) || [];
      const moduleData = modules.map((m, idx) => [
        String(idx + 1),
        sanitizeText(m.name || 'Modul'),
        String(m.completionPercentage || 0) + '%',
        sanitizeText(m.businessValue?.substring(0, 50) || 'N/A') + '...'
      ]);
      
      autoTable(doc, {
        startY: 40,
        head: [['#', 'Modul', 'Completat', 'Valor de Negoci']],
        body: moduleData.length > 0 ? moduleData : [['1', 'Analitza primer', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: colors.darkBlue, textColor: colors.white, fontSize: 10, font: 'helvetica' },
        bodyStyles: { fontSize: 9, font: 'times' },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 90 },
        },
        margin: { left: margin, right: margin },
      });

      // ========================================
      // PAGE 4 - COMPARATIVA COMPETIDORS
      // ========================================
      doc.addPage();
      
      doc.setFillColor(...colors.success);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPARATIVA AMB COMPETIDORS', margin, 20);
      
      const competitorData = [
        ['Salesforce FSC', '150-300 EUR/usuari/mes', '6-12 mesos', 'NO', '50.000-500.000 EUR'],
        ['Temenos T24', '500K-5M EUR llicencia', '18-36 mesos', 'NO', '1M-15M EUR'],
        ['SAP Banking', '3000-8000 EUR/usuari', '12-24 mesos', 'NO', '500K-10M EUR'],
        ['Microsoft Dynamics', '40-135 EUR/usuari/mes', '6-12 mesos', 'NO', '50.000-300.000 EUR'],
        ['ObelixIA', '89 EUR/usuari/mes', '4-8 SETMANES', 'SI', '95.000 EUR TOTAL']
      ];
      
      autoTable(doc, {
        startY: 40,
        head: [['Solucio', 'Cost Llicencia', 'Implantacio', 'GIS Bancari', 'Inversio Inicial']],
        body: competitorData,
        theme: 'striped',
        headStyles: { fillColor: colors.darkBlue, textColor: colors.white, fontSize: 9, font: 'helvetica' },
        bodyStyles: { fontSize: 9, font: 'times' },
        didDrawCell: (data) => {
          if (data.row.index === 4 && data.section === 'body') {
            doc.setFillColor(...colors.gold);
          }
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Savings calculation
      doc.setFillColor(...colors.lightGray);
      doc.roundedRect(margin, yPos, contentWidth, 45, 3, 3, 'F');
      
      doc.setTextColor(...colors.darkBlue);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTALVI ESTIMAT vs SALESFORCE (50 usuaris, 5 anys):', margin + 5, yPos + 12);
      
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      doc.text('Salesforce FSC: 50 x 200 EUR x 12 x 5 = 600.000 EUR + 200.000 EUR implantacio = 800.000 EUR', margin + 5, yPos + 24);
      doc.text('ObelixIA: 95.000 EUR + (50 x 89 EUR x 12 x 5) = 95.000 + 267.000 = 362.000 EUR', margin + 5, yPos + 32);
      
      doc.setTextColor(...colors.success);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTALVI TOTAL: 438.000 EUR (55% menys cost)', margin + 5, yPos + 42);

      // ========================================
      // PAGE 5 - ROI ANALYSIS
      // ========================================
      doc.addPage();
      
      doc.setFillColor(...colors.gold);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(...colors.darkBlue);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALISI ROI I BENEFICIS', margin, 20);
      
      const roiData = [
        ['Productivitat gestors', '+35%', '15 min estalvi/visita x 10 visites/dia = 2.5h/dia'],
        ['Reduccio errors', '-80%', 'Validacio automatica fichas, IA resumen'],
        ['Conversio oportunitats', '+25%', 'Pipeline visual, ML predictions'],
        ['Retencio clients', '+15%', 'Segmentacio RFM, churn prediction'],
        ['Temps analisi financer', '-70%', 'RAG Chat, import PDF automatic'],
        ['Compliance audits', '-60%', 'DORA/NIS2 dashboard, stress tests auto'],
        ['Temps implantacio', '-75%', '4-8 setmanes vs 12-18 mesos'],
      ];
      
      autoTable(doc, {
        startY: 40,
        head: [['Metrica', 'Millora', 'Detall']],
        body: roiData,
        theme: 'striped',
        headStyles: { fillColor: colors.darkBlue, textColor: colors.white, fontSize: 10, font: 'helvetica' },
        bodyStyles: { fontSize: 9, font: 'times' },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 20, halign: 'center', textColor: colors.success },
          2: { cellWidth: 110 },
        },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 20;
      
      // ROI Timeline
      doc.setFillColor(...colors.accentBlue);
      doc.roundedRect(margin, yPos, contentWidth, 50, 3, 3, 'F');
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TIMELINE ROI', pageWidth / 2, yPos + 12, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.text('Mes 1-2: Implantacio i formacio', margin + 10, yPos + 25);
      doc.text('Mes 3-4: Adopcio i optimitzacio processos', margin + 10, yPos + 33);
      doc.text('Mes 5-8: Break-even - Inversio recuperada', margin + 10, yPos + 41);
      
      doc.setTextColor(...colors.gold);
      doc.setFont('helvetica', 'bold');
      doc.text('Any 5: ROI acumulat 520%', pageWidth - margin - 60, yPos + 33);

      // ========================================
      // PAGE 6 - SECURITY & COMPLIANCE
      // ========================================
      doc.addPage();
      
      doc.setFillColor(...colors.darkBlue);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(...colors.gold);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SEGURETAT I COMPLIANCE', margin, 20);
      
      const securityData = [
        ['ISO 27001', '92%', '114 controls Annex A implementats'],
        ['DORA', '100%', '7 stress tests automatitzats, incidents, resiliencia'],
        ['NIS2', '95%', 'Gestio riscos, tercers, notificacions'],
        ['PSD2/PSD3 SCA', '100%', 'WebAuthn, biometria, step-up auth'],
        ['GDPR/APDA', '100%', 'Consentiment, drets, audit complet'],
        ['Basel III/IV', '85%', 'Ratios liquiditat, solvencia proxies'],
        ['eIDAS 2.0', '90%', 'DIDs, VCs, EUDI Wallet ready'],
        ['OWASP API Top 10', '100%', '10 controls implementats Edge Functions'],
      ];
      
      autoTable(doc, {
        startY: 40,
        head: [['Normativa', 'Compliment', 'Detall Implementacio']],
        body: securityData,
        theme: 'grid',
        headStyles: { fillColor: colors.accentBlue, textColor: colors.white, fontSize: 10, font: 'helvetica' },
        bodyStyles: { fontSize: 9, font: 'times' },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 115 },
        },
        didDrawCell: (data) => {
          if (data.column.index === 1 && data.section === 'body') {
            const val = String(data.cell.raw);
            if (val.includes('100')) doc.setTextColor(...colors.success);
            else if (parseInt(val) >= 90) doc.setTextColor(34, 139, 100);
            else doc.setTextColor(200, 150, 0);
          }
        },
        margin: { left: margin, right: margin },
      });

      // ========================================
      // PAGE 7 - NEXT STEPS / CTA
      // ========================================
      doc.addPage();
      
      // Premium closing page
      doc.setFillColor(...colors.darkBlue);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setFillColor(...colors.gold);
      doc.rect(0, 60, pageWidth, 3, 'F');
      doc.rect(0, 180, pageWidth, 3, 'F');
      
      doc.setTextColor(...colors.gold);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('PROPERS PASSOS', pageWidth / 2, 90, { align: 'center' });
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont('times', 'normal');
      
      const nextSteps = [
        '1. Demo personalitzada amb les vostres dades (2 hores)',
        '2. Analisi de requeriments especifics (1 setmana)',
        '3. Proposta tecnica i economica detallada',
        '4. POC (Proof of Concept) amb 5 usuaris pilot (2 setmanes)',
        '5. Decisio i contractacio',
        '6. Implantacio i formacio (4-8 setmanes)',
        '7. Go-live i suport continu'
      ];
      
      yPos = 110;
      nextSteps.forEach(step => {
        doc.text(sanitizeText(step), pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
      });
      
      // Contact CTA
      doc.setFillColor(...colors.gold);
      doc.roundedRect(margin + 20, 200, contentWidth - 40, 40, 5, 5, 'F');
      
      doc.setTextColor(...colors.darkBlue);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTACTE', pageWidth / 2, 215, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      doc.text('Sr. Jaime FERNANDEZ GARCIA | Tel: +34 606770033 | Email: jfernandez@obelixia.com', pageWidth / 2, 228, { align: 'center' });
      
      // Confidentiality footer
      doc.setTextColor(...colors.gold);
      doc.setFontSize(9);
      doc.text('Document confidencial - Propietat ObelixIA - ' + new Date().toLocaleDateString('ca-ES'), pageWidth / 2, pageHeight - 15, { align: 'center' });

      // Add page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(...colors.darkGray);
        doc.setFontSize(8);
        doc.text(`Pagina ${i - 1} de ${totalPages - 1}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      // Save
      doc.save(`ObelixIA-Proposta-Comercial-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Proposta comercial generada amb exit!');
      
    } catch (error: any) {
      console.error('Error generating sales PDF:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsGeneratingSalesPDF(false);
    }
  };

  const overallCompletion = codebaseAnalysis?.modules && Array.isArray(codebaseAnalysis.modules) && codebaseAnalysis.modules.length > 0
    ? Math.round(codebaseAnalysis.modules.reduce((sum, m) => sum + (m.completionPercentage || 0), 0) / codebaseAnalysis.modules.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Generador de Documentació Comercial Exhaustiva amb IA</h2>
            <p className="text-muted-foreground">
              Anàlisi complet del codi, millores i documentació professional per a vendes
            </p>
          </div>
        </div>
        
        {/* Buttons Section - More Prominent */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={analyzeCodebase}
                disabled={isAnalyzingCodebase}
                variant="outline"
                size="lg"
                className="min-w-[180px]"
              >
                {isAnalyzingCodebase ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                1. Analitzar Codi
              </Button>
              <Button
                onClick={searchImprovements}
                disabled={isSearchingImprovements}
                variant="outline"
                size="lg"
                className="min-w-[180px]"
              >
                {isSearchingImprovements ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                2. Buscar Millores
              </Button>
              <Button
                onClick={searchAIRecommendations}
                disabled={isSearchingAI}
                size="lg"
                className="min-w-[180px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSearchingAI ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="mr-2 h-4 w-4" />
                )}
                3. IA i Automatització
              </Button>
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPDF || (!codebaseAnalysis && !improvementsAnalysis)}
                size="lg"
                className="min-w-[180px]"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                4. Generar PDF Tècnic
              </Button>
              <Button
                onClick={generateSalesPDF}
                disabled={isGeneratingSalesPDF || !codebaseAnalysis}
                size="lg"
                className="min-w-[200px] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg"
              >
                {isGeneratingSalesPDF ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                5. PROPOSTA COMERCIAL
              </Button>
              <Button
                onClick={generateWebAuditPDF}
                disabled={isGeneratingAuditPDF || !codebaseAnalysis}
                size="lg"
                className="min-w-[200px] bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold shadow-lg"
              >
                {isGeneratingAuditPDF ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Gauge className="mr-2 h-5 w-5" />
                )}
                6. AUDITORIA TOTAL
              </Button>
            </div>
            
            {!codebaseAnalysis && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                👆 Primer fes clic a "1. Analitzar Codi" per activar totes les opcions
              </p>
            )}
          </CardContent>
        </Card>
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
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="overview">Visió General</TabsTrigger>
          <TabsTrigger value="modules">Mòduls</TabsTrigger>
          <TabsTrigger value="improvements">Millores</TabsTrigger>
          <TabsTrigger value="trends">Tendències</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            IA
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            Rendiment
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Sistema
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
          {improvementsAnalysis?.detailedTrends && Array.isArray(improvementsAnalysis.detailedTrends) && improvementsAnalysis.detailedTrends.length > 0 ? (
            <>
              {/* Estadísticas de instalación */}
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {improvementsAnalysis.detailedTrends.filter(t => t.installed).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Tecnologies Instal·lades</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {improvementsAnalysis.detailedTrends.filter(t => !t.installed).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Pendents d'Implementar</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {improvementsAnalysis.detailedTrends.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Tecnologies</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sección Instaladas */}
              <Card className="border-green-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <CardTitle>Tecnologies Instal·lades ({improvementsAnalysis.detailedTrends.filter(t => t.installed).length})</CardTitle>
                  </div>
                  <CardDescription>Tecnologies completament implementades i operatives</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {improvementsAnalysis.detailedTrends.filter(t => t.installed).map((trend, idx) => (
                      <AccordionItem key={idx} value={`installed-${idx}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left w-full">
                            <Badge className="bg-green-500 text-white shrink-0">
                              #{trend.number}
                            </Badge>
                            <div className="flex-1">
                              <div className="font-medium">{trend.name}</div>
                              <div className="text-xs text-muted-foreground">{trend.relevance}</div>
                            </div>
                            {trend.version && (
                              <Badge variant="outline" className="shrink-0">v{trend.version}</Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            <div className="grid gap-2 md:grid-cols-2 text-sm">
                              <div><strong>Adopció:</strong> {trend.adoptionRate}</div>
                              <div><strong>Actualització:</strong> {trend.lastUpdated || 'N/A'}</div>
                            </div>
                            
                            {trend.installedDetails && trend.installedDetails.length > 0 && (
                              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="font-medium text-sm mb-2 text-green-700 dark:text-green-400">
                                  ✅ Detall de la implementació:
                                </div>
                                <ul className="text-sm space-y-1">
                                  {trend.installedDetails.map((detail, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle2 className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                                      <span className="text-muted-foreground">{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Sección Pendientes */}
              <Card className="border-yellow-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <CardTitle>Tecnologies Pendents ({improvementsAnalysis.detailedTrends.filter(t => !t.installed).length})</CardTitle>
                  </div>
                  <CardDescription>Tecnologies a avaluar o implementar properament</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {improvementsAnalysis.detailedTrends.filter(t => !t.installed).map((trend, idx) => (
                      <AccordionItem key={idx} value={`pending-${idx}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left w-full">
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600 shrink-0">
                              #{trend.number}
                            </Badge>
                            <div className="flex-1">
                              <div className="font-medium">{trend.name}</div>
                              <div className="text-xs text-muted-foreground">{trend.relevance}</div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            <div className="grid gap-2 md:grid-cols-2 text-sm">
                              <div><strong>Adopció:</strong> {trend.adoptionRate}</div>
                              <div><strong>Potencial integració:</strong> {trend.integrationPotential}</div>
                            </div>
                            
                            {trend.pendingDetails && trend.pendingDetails.length > 0 && (
                              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <div className="font-medium text-sm mb-2 text-yellow-700 dark:text-yellow-400">
                                  ⏳ Passos per implementar:
                                </div>
                                <ol className="text-sm space-y-1 list-decimal list-inside">
                                  {trend.pendingDetails.map((detail, i) => (
                                    <li key={i} className="text-muted-foreground">{detail}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">Busca millores primer</p>
              </CardContent>
            </Card>
          )}

          {/* Otras listas - Rendiment i IA */}
          {improvementsAnalysis && (
            <div className="grid gap-4 md:grid-cols-2">
              {improvementsAnalysis.performanceOptimizations && improvementsAnalysis.performanceOptimizations.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">Optimitzacions de Rendiment</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {improvementsAnalysis.performanceOptimizations.filter(o => String(o).includes('✅')).length}/{improvementsAnalysis.performanceOptimizations.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {improvementsAnalysis.performanceOptimizations.map((opt, i) => {
                        const text = String(opt);
                        const isInstalled = text.includes('✅ INSTAL·LAT');
                        const isPending = text.includes('PENDENT');
                        
                        return (
                          <div 
                            key={i} 
                            className={`flex items-start gap-2 p-2 rounded text-sm ${
                              isInstalled ? 'bg-green-500/10' : isPending ? 'bg-yellow-500/10' : ''
                            }`}
                          >
                            {isInstalled ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : isPending ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Zap className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <span className={
                              isInstalled ? 'text-green-700 dark:text-green-400' : 
                              isPending ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'
                            }>
                              {text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {improvementsAnalysis.aiIntegrations && improvementsAnalysis.aiIntegrations.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg">Integracions IA</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {improvementsAnalysis.aiIntegrations.filter(a => String(a).includes('✅')).length}/{improvementsAnalysis.aiIntegrations.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {improvementsAnalysis.aiIntegrations.map((ai, i) => {
                        const text = String(ai);
                        const isInstalled = text.includes('✅ INSTAL·LAT');
                        const isPending = text.includes('PENDENT');
                        
                        return (
                          <div 
                            key={i} 
                            className={`flex items-start gap-2 p-2 rounded text-sm ${
                              isInstalled ? 'bg-purple-500/10' : isPending ? 'bg-yellow-500/10' : ''
                            }`}
                          >
                            {isInstalled ? (
                              <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            ) : isPending ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Brain className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            )}
                            <span className={
                              isInstalled ? 'text-purple-700 dark:text-purple-400' : 
                              isPending ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'
                            }>
                              {text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="space-y-4">
          {improvementsAnalysis?.complianceRegulations && Array.isArray(improvementsAnalysis.complianceRegulations) && improvementsAnalysis.complianceRegulations.length > 0 ? (
            <>
              {/* Estadísticas de compliance */}
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {improvementsAnalysis.complianceRegulations.filter(r => r.status === 'compliant').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Normatives Complertes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {improvementsAnalysis.complianceRegulations.filter(r => r.status === 'partial').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Parcial / En Progrés</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {improvementsAnalysis.complianceRegulations.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Normatives</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Normativas Cumplidas */}
              <Card className="border-green-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <CardTitle>Normatives Complertes ({improvementsAnalysis.complianceRegulations.filter(r => r.status === 'compliant').length})</CardTitle>
                  </div>
                  <CardDescription>Regulacions amb implementació completa</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {improvementsAnalysis.complianceRegulations.filter(r => r.status === 'compliant').map((reg, idx) => (
                      <AccordionItem key={idx} value={`compliant-${idx}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left w-full">
                            <div className="flex flex-col items-center shrink-0">
                              <Badge className={`${reg.compliancePercentage === 100 ? 'bg-green-500' : reg.compliancePercentage && reg.compliancePercentage >= 90 ? 'bg-green-400' : 'bg-green-500'} text-white min-w-[60px] justify-center`}>
                                {reg.compliancePercentage || 100}%
                              </Badge>
                              {reg.totalRequirements && (
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  {reg.implementedRequirements}/{reg.totalRequirements}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{reg.name}</div>
                              <div className="text-xs text-muted-foreground">{reg.jurisdiction && `[${reg.jurisdiction}] `}{reg.description}</div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            {/* Funcionalidades Implementadas */}
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                              <div className="font-medium text-sm mb-2 text-green-700 dark:text-green-400">
                                ✅ Funcionalitats implementades:
                              </div>
                              <ul className="text-sm space-y-1">
                                {reg.implementedFeatures.map((feature, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Fases de Implementación (si existen) */}
                            {reg.implementationPhases && reg.implementationPhases.length > 0 && (
                              <div className="p-3 rounded-lg bg-muted/50 border">
                                <div className="font-medium text-sm mb-3 flex items-center gap-2">
                                  <Map className="h-4 w-4 text-primary" />
                                  Fases d'implementació realitzades:
                                </div>
                                <div className="space-y-3">
                                  {reg.implementationPhases.map((phase, pi) => (
                                    <div key={pi} className="p-3 rounded border bg-background">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-green-500">{phase.phase}</Badge>
                                        <span className="font-medium text-sm">{phase.name}</span>
                                        <span className="text-xs text-muted-foreground">({phase.duration})</span>
                                      </div>
                                      <div className="grid gap-3 md:grid-cols-2 text-xs">
                                        <div>
                                          <div className="font-medium mb-1">Accions:</div>
                                          <ul className="space-y-0.5">
                                            {phase.actions.map((a, ai) => (
                                              <li key={ai} className="text-muted-foreground">• {a}</li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div>
                                          <div className="font-medium mb-1">Entregables:</div>
                                          <ul className="space-y-0.5">
                                            {phase.deliverables.map((d, di) => (
                                              <li key={di} className="text-muted-foreground">✓ {d}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                      <div className="mt-2 text-xs">
                                        <strong>Responsable:</strong> {phase.responsible}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Timeline de Aplicación (para AI Act y otras normativas escalonadas) */}
                            {reg.timeline && reg.timeline.length > 0 && (
                              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <div className="font-medium text-sm mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                  <Clock className="h-4 w-4" />
                                  Cronograma d'aplicació normativa:
                                </div>
                                <div className="relative">
                                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-purple-500/30" />
                                  <div className="space-y-3 pl-6">
                                    {reg.timeline.map((milestone, mi) => {
                                      const milestoneDate = new Date(milestone.date);
                                      const isPast = milestoneDate < new Date();
                                      return (
                                        <div key={mi} className="relative">
                                          <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 ${isPast ? 'bg-green-500 border-green-500' : 'bg-background border-purple-500'}`} />
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <Badge className={`${isPast ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-purple-500/20 text-purple-700 dark:text-purple-400'} text-xs shrink-0`}>
                                              {milestone.date}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {isPast && '✓ '}{milestone.milestone}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Normativas Parciales */}
              {improvementsAnalysis.complianceRegulations.filter(r => r.status === 'partial').length > 0 && (
                <Card className="border-yellow-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <CardTitle>Normatives en Progrés ({improvementsAnalysis.complianceRegulations.filter(r => r.status === 'partial').length})</CardTitle>
                    </div>
                    <CardDescription>Regulacions amb implementació parcial - Accions requerides</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {improvementsAnalysis.complianceRegulations.filter(r => r.status === 'partial').map((reg, idx) => (
                        <AccordionItem key={idx} value={`partial-${idx}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 text-left w-full">
                              <div className="flex flex-col items-center shrink-0">
                                <Badge className={`${reg.compliancePercentage && reg.compliancePercentage >= 90 ? 'bg-yellow-400' : reg.compliancePercentage && reg.compliancePercentage >= 75 ? 'bg-yellow-500' : reg.compliancePercentage && reg.compliancePercentage >= 50 ? 'bg-orange-500' : 'bg-red-500'} text-white min-w-[60px] justify-center font-bold`}>
                                  {reg.compliancePercentage || 0}%
                                </Badge>
                                {reg.totalRequirements && (
                                  <span className="text-[10px] text-muted-foreground mt-0.5">
                                    {reg.implementedRequirements}/{reg.totalRequirements}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{reg.name}</div>
                                <div className="text-xs text-muted-foreground">{reg.jurisdiction && `[${reg.jurisdiction}] `}{reg.description}</div>
                              </div>
                              <Progress value={reg.compliancePercentage || 0} className="w-24 h-2" />
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="space-y-4">
                              {/* Funcionalidades Implementadas */}
                              {reg.implementedFeatures.length > 0 && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                  <div className="font-medium text-sm mb-2 text-green-700 dark:text-green-400">
                                    ✅ Ja implementat:
                                  </div>
                                  <ul className="text-sm space-y-1">
                                    {reg.implementedFeatures.map((feature, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                                        <span className="text-muted-foreground">{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Acciones Pendientes */}
                              {reg.pendingActions.length > 0 && (
                                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                  <div className="font-medium text-sm mb-2 text-yellow-700 dark:text-yellow-400">
                                    ⏳ Accions pendents per complir:
                                  </div>
                                  <ul className="text-sm space-y-1">
                                    {reg.pendingActions.map((action, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <AlertTriangle className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                                        <span className="text-muted-foreground">{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Fases de Implementación */}
                              {reg.implementationPhases && reg.implementationPhases.length > 0 && (
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <div className="font-medium text-sm mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                    <Map className="h-4 w-4" />
                                    Fases d'implementació per completar:
                                  </div>
                                  <div className="space-y-3">
                                    {reg.implementationPhases.map((phase, pi) => (
                                      <div key={pi} className="p-3 rounded border bg-background">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className="bg-blue-500">Fase {phase.phase}</Badge>
                                          <span className="font-medium text-sm">{phase.name}</span>
                                          <span className="text-xs text-muted-foreground">({phase.duration})</span>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2 text-xs">
                                          <div>
                                            <div className="font-medium mb-1">Accions:</div>
                                            <ol className="space-y-0.5 list-decimal list-inside">
                                              {phase.actions.map((a, ai) => (
                                                <li key={ai} className="text-muted-foreground">{a}</li>
                                              ))}
                                            </ol>
                                          </div>
                                          <div>
                                            <div className="font-medium mb-1">Entregables:</div>
                                            <ul className="space-y-0.5">
                                              {phase.deliverables.map((d, di) => (
                                                <li key={di} className="text-muted-foreground">→ {d}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-xs">
                                          <strong>Responsable:</strong> {phase.responsible}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Timeline de Aplicación (para AI Act y otras normativas escalonadas) */}
                              {reg.timeline && reg.timeline.length > 0 && (
                                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                  <div className="font-medium text-sm mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                    <Clock className="h-4 w-4" />
                                    Cronograma d'aplicació normativa:
                                  </div>
                                  <div className="relative">
                                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-purple-500/30" />
                                    <div className="space-y-3 pl-6">
                                      {reg.timeline.map((milestone, mi) => {
                                        const milestoneDate = new Date(milestone.date);
                                        const isPast = milestoneDate < new Date();
                                        return (
                                          <div key={mi} className="relative">
                                            <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 ${isPast ? 'bg-green-500 border-green-500' : 'bg-background border-purple-500'}`} />
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                              <Badge className={`${isPast ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-purple-500/20 text-purple-700 dark:text-purple-400'} text-xs shrink-0`}>
                                                {milestone.date}
                                              </Badge>
                                              <span className="text-sm text-muted-foreground">
                                                {isPast && '✓ '}{milestone.milestone}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Estado de Seguridad */}
              {improvementsAnalysis.securityUpdates && improvementsAnalysis.securityUpdates.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <CardTitle>Estat de Seguretat</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {improvementsAnalysis.securityUpdates.map((update, idx) => {
                        const text = String(update);
                        const isInstalled = text.includes('✅ INSTAL·LAT');
                        const isPending = text.includes('PENDENT');
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-2 p-2 rounded ${
                              isInstalled ? 'bg-green-500/10' : isPending ? 'bg-yellow-500/10' : ''
                            }`}
                          >
                            {isInstalled ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : isPending ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            ) : (
                              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={`text-sm ${
                              isInstalled ? 'text-green-700 dark:text-green-400' : 
                              isPending ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'
                            }`}>
                              {text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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

        {/* System Tab - Code Export */}
        <TabsContent value="system" className="space-y-4">
          <SystemExportTab
            isExportingCode={isExportingCode}
            setIsExportingCode={setIsExportingCode}
            exportProgress={exportProgress}
            setExportProgress={setExportProgress}
            isExportingFullCode={isExportingFullCode}
            setIsExportingFullCode={setIsExportingFullCode}
            fullCodeProgress={fullCodeProgress}
            setFullCodeProgress={setFullCodeProgress}
            codebaseAnalysis={codebaseAnalysis}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// System Export Tab Component
interface SystemExportTabProps {
  isExportingCode: boolean;
  setIsExportingCode: (value: boolean) => void;
  exportProgress: number;
  setExportProgress: React.Dispatch<React.SetStateAction<number>>;
  isExportingFullCode: boolean;
  setIsExportingFullCode: (value: boolean) => void;
  fullCodeProgress: number;
  setFullCodeProgress: React.Dispatch<React.SetStateAction<number>>;
  codebaseAnalysis: CodebaseAnalysis | null;
}

function SystemExportTab({
  isExportingCode,
  setIsExportingCode,
  exportProgress,
  setExportProgress,
  isExportingFullCode,
  setIsExportingFullCode,
  fullCodeProgress,
  setFullCodeProgress,
  codebaseAnalysis
}: SystemExportTabProps) {
  
  const exportCodeToTxt = async () => {
    setIsExportingCode(true);
    setExportProgress(0);

    let currentProgress = 0;
    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 10, 90);
        setExportProgress(currentProgress);
      }, 200);

      // Complete file structure data
      const adminComponents = [
        'AdaptiveAuthDashboard.tsx', 'AdminSidebar.tsx', 'AdvancedCompanyFilters.tsx', 
        'AlertHistoryViewer.tsx', 'ApplicationStateAnalyzer.tsx', 'AuditLogsViewer.tsx',
        'AuditorDashboard.tsx', 'BulkGoalsAssignment.tsx', 'CascadeGoalsManager.tsx',
        'CommercialDirectorDashboard.tsx', 'CommercialManagerAudit.tsx', 'CommercialManagerDashboard.tsx',
        'CompaniesManager.tsx', 'CompaniesPagination.tsx', 'CompanyDataCompleteness.tsx',
        'CompanyExportButton.tsx', 'ConceptsManager.tsx', 'ContractedProductsReport.tsx',
        'DORAComplianceDashboard.tsx', 'DirectorAlertsPanel.tsx', 'EmailTemplatesManager.tsx',
        'EnhancedCompanyCard.tsx', 'ExcelImporter.tsx', 'GeocodingRecalculator.tsx',
        'GestorDashboard.tsx', 'GestoresMetrics.tsx', 'GoalsKPIDashboard.tsx',
        'GoalsProgressTracker.tsx', 'ImportHistoryViewer.tsx', 'KPIReportHistory.tsx',
        'MapTooltipConfig.tsx', 'MetricsExplorer.tsx', 'OfficeDirectorDashboard.tsx',
        'ProductsManager.tsx', 'ProductsMetrics.tsx', 'SharedVisitsCalendar.tsx',
        'StatusColorsManager.tsx', 'SystemHealthMonitor.tsx', 'TPVGoalsManager.tsx',
        'TPVManager.tsx', 'UsersManager.tsx', 'VinculacionMetrics.tsx',
        'VisitSheetAuditViewer.tsx', 'VisitSheetValidationPanel.tsx', 
        'VisitSheetsGestorComparison.tsx', 'VisitsMetrics.tsx'
      ];

      const accountingComponents = [
        'AccountingCompanyIndex.tsx', 'AccountingGroupsChart.tsx', 'AccountingMainMenu.tsx',
        'AccountingManager.tsx', 'AddedValueAnalysis.tsx', 'AnalyticalPLChart.tsx',
        'AuditTab.tsx', 'BalanceAnalysisArea.tsx', 'BalanceSheetForm.tsx',
        'BankRatingAnalysis.tsx', 'CashFlowAnalysis.tsx', 'CashFlowAnalysisWrapper.tsx',
        'CashFlowForm.tsx', 'CompanySearchBar.tsx', 'ConsolidatedStatementsManager.tsx',
        'DuPontPyramid.tsx', 'EBITEBITDAAnalysis.tsx', 'EconomicFinancialDashboard.tsx',
        'EnhancedCompanyHeader.tsx', 'EquityChangesForm.tsx', 'FinancialAnalysisTab.tsx',
        'FinancialNotesManager.tsx', 'FinancialRAGChat.tsx', 'FinancialStatementsHistory.tsx',
        'FinancingStatement.tsx', 'IncomeStatementChart.tsx', 'IncomeStatementForm.tsx',
        'LiquidityDebtRatios.tsx', 'LongTermFinancialAnalysis.tsx', 
        'LongTermFinancialAnalysisWrapper.tsx', 'MovingAnnualTrendChart.tsx',
        'MultiYearComparison.tsx', 'PDFImportDialog.tsx', 'PeriodYearSelector.tsx',
        'ProfitabilityTab.tsx', 'ProvisionalStatementsManager.tsx', 'RatiosPyramid.tsx',
        'ReportsTab.tsx', 'SectorSimulator.tsx', 'SectoralRatiosAnalysis.tsx',
        'TreasuryMovements.tsx', 'ValuationTab.tsx', 'WorkingCapitalAnalysis.tsx',
        'WorkingCapitalAnalysisWrapper.tsx', 'WorkingCapitalNOF.tsx', 'ZScoreAnalysis.tsx'
      ];

      const authComponents = [
        'PasskeyButton.tsx', 'PasskeyManager.tsx', 'StepUpAuthDialog.tsx',
        'XAMAStatusIndicator.tsx', 'XAMAVerificationDialog.tsx'
      ];

      const companyComponents = [
        'BankAffiliationsManager.tsx', 'CompanyDetail.tsx', 'CompanyPhotosManager.tsx',
        'CompanyPrintReport.tsx', 'ContactsManager.tsx', 'DocumentsManager.tsx',
        'ExcelExportDialog.tsx', 'PDFExportDialog.tsx', 'TPVTerminalsManager.tsx',
        'VisitSheetsHistory.tsx'
      ];

      const dashboardComponents = [
        'AccountingDashboardCard.tsx', 'ActionPlanManager.tsx', 'ActivityStatistics.tsx',
        'AdvancedAnalyticsDashboardCard.tsx', 'AlertHistoryDashboardCard.tsx', 'AlertsManager.tsx',
        'AnalisisCohortes.tsx', 'AnalisisEmbudo.tsx', 'AnalisisGeografico.tsx',
        'BestPracticeComments.tsx', 'BestPracticesPanel.tsx', 'CompaniesDashboardCard.tsx',
        'ComparativaTemporales.tsx', 'ContractedProductsDashboardCard.tsx', 'DashboardExportButton.tsx',
        'DateRangeFilter.tsx', 'EmailReminderPreferences.tsx', 'FilteredMetricsWrapper.tsx',
        'GestorComparison.tsx', 'GestorDashboardCard.tsx', 'GestorEvolutionTimeline.tsx',
        'GestorFilterSelector.tsx', 'GestorOverviewSection.tsx', 'GestoresLeaderboard.tsx',
        'GoalsAlertsDashboardCard.tsx', 'KPIDashboardCard.tsx', 'MLPredictions.tsx',
        'MapButton.tsx', 'MapDashboardCard.tsx', 'MetricsCardsSection.tsx',
        'MetricsDashboardCard.tsx', 'NotificationPreferences.tsx', 'NotificationService.tsx',
        'NotificationsPanel.tsx', 'ObjetivosYMetas.tsx', 'OfflineSyncIndicator.tsx',
        'PersonalActivityHistory.tsx', 'PersonalGoalsDetailedAnalysis.tsx', 'PersonalGoalsHistory.tsx',
        'PersonalGoalsTracker.tsx', 'PersonalKPIsDashboard.tsx', 'PowerBIExport.tsx',
        'PrediccionesFuturas.tsx', 'PushNotifications.tsx', 'QuickActionsPanel.tsx',
        'QuickVisitManager.tsx', 'QuickVisitSheetCard.tsx', 'RealtimeNotificationsBadge.tsx',
        'ResumenEjecutivo.tsx', 'TPVGestorRanking.tsx', 'TPVGoalsComparison.tsx',
        'TPVGoalsDashboard.tsx', 'TPVGoalsHistory.tsx', 'UnifiedMetricsDashboard.tsx',
        'UpcomingVisitsWidget.tsx', 'VisitReminders.tsx'
      ];

      const mapComponents = [
        'CompanyPhotosDialog.tsx', 'GeoSearch.tsx', 'LazyMapContainer.tsx',
        'MapContainer.tsx', 'MapContainerTypes.ts', 'MapExportButton.tsx',
        'MapHeader.tsx', 'MapLayersControl.tsx', 'MapLegend.tsx',
        'MapSidebar.tsx', 'MapSkeleton.tsx', 'MapStatisticsPanel.tsx',
        'OpportunityHeatmap.tsx', 'RoutePlanner.tsx', 'SectorStats.tsx',
        'VisitsPanel.tsx', 'markerIcons.tsx', 'markerStyles.tsx'
      ];

      const visitComponents = [
        'ParticipantsSelector.tsx', 'SignaturePad.tsx', 'VisitSheetForm.tsx',
        'VisitSheetPhotos.tsx', 'VisitSheetTemplateSelector.tsx'
      ];

      const reportComponents = [
        'AppDetailedStatusGenerator.tsx', 'CodebaseIndexGenerator.tsx',
        'CompetitorGapAnalysisGenerator.tsx', 'DynamicTechnicalDocGenerator.tsx',
        'ReportGenerator.tsx', 'TechnicalDocumentGenerator.tsx'
      ];

      const uiComponents = [
        'accordion.tsx', 'alert-dialog.tsx', 'alert.tsx', 'aspect-ratio.tsx',
        'avatar.tsx', 'badge.tsx', 'breadcrumb.tsx', 'button.tsx', 'calendar.tsx',
        'card.tsx', 'carousel.tsx', 'chart.tsx', 'checkbox.tsx', 'collapsible.tsx',
        'command.tsx', 'ConflictDialog.tsx', 'context-menu.tsx', 'dialog.tsx',
        'drawer.tsx', 'dropdown-menu.tsx', 'form.tsx', 'hover-card.tsx',
        'input-otp.tsx', 'input.tsx', 'label.tsx', 'menubar.tsx', 'navigation-menu.tsx',
        'pagination.tsx', 'popover.tsx', 'progress.tsx', 'radio-group.tsx',
        'resizable.tsx', 'scroll-area.tsx', 'select.tsx', 'separator.tsx',
        'sheet.tsx', 'sidebar.tsx', 'skeleton.tsx', 'slider.tsx', 'sonner.tsx',
        'switch.tsx', 'table.tsx', 'tabs.tsx', 'textarea.tsx', 'toast.tsx',
        'toaster.tsx', 'toggle-group.tsx', 'toggle.tsx', 'tooltip.tsx', 'use-toast.ts'
      ];

      const performanceComponents = [
        'OptimizedImage.tsx', 'PerformanceMonitor.tsx', 'SSRCacheProvider.tsx', 'StreamingBoundary.tsx'
      ];

      const presenceComponents = ['OnlineUsersIndicator.tsx'];

      const eidasComponents = ['EIDASVerificationPanel.tsx'];

      const rootComponents = [
        'ErrorBoundary.tsx', 'GlobalNavHeader.tsx', 'LanguageSelector.tsx',
        'LanguageSelectorHeader.tsx', 'NavLink.tsx', 'ThemeSelector.tsx'
      ];

      const hooks = [
        { name: 'useAuth.tsx', description: 'Gestión de autenticación y sesión de usuario' },
        { name: 'useGoalsQuery.ts', description: 'Consultas React Query para objetivos' },
        { name: 'useVisitsQuery.ts', description: 'Consultas React Query para visitas' },
        { name: 'useNotifications.tsx', description: 'Gestión de notificaciones push y in-app' },
        { name: 'useNotificationsQuery.ts', description: 'Consultas para notificaciones' },
        { name: 'usePresence.ts', description: 'Indicadores de presencia en tiempo real' },
        { name: 'useRealtimeChannel.ts', description: 'Canal Supabase Realtime consolidado' },
        { name: 'useCompaniesServerPagination.ts', description: 'Paginación servidor de empresas' },
        { name: 'useCompanyPhotosLazy.ts', description: 'Carga lazy de fotos de empresas' },
        { name: 'useDeferredValue.ts', description: 'Valores diferidos React 19' },
        { name: 'useNavigationHistory.ts', description: 'Historial de navegación admin panel' },
        { name: 'useOptimisticLock.ts', description: 'Bloqueo optimista para edición concurrente' },
        { name: 'useWebAuthn.ts', description: 'Autenticación WebAuthn/Passkeys' },
        { name: 'useWebVitals.ts', description: 'Métricas Core Web Vitals' },
        { name: 'useCelebration.ts', description: 'Animaciones de celebración confetti' },
        { name: 'useAdaptiveAuth.ts', description: 'Autenticación adaptativa PSD2/PSD3' },
        { name: 'useBehavioralBiometrics.ts', description: 'Biometría comportamental para SCA' },
        { name: 'useAMLFraudDetection.ts', description: 'Detección AML/Fraude contextual' },
        { name: 'useEIDAS.ts', description: 'Integración eIDAS 2.0 wallet' },
        { name: 'useOfflineSync.ts', description: 'Sincronización offline-first' },
        { name: 'usePerformanceMonitor.ts', description: 'Monitorización de rendimiento' },
        { name: 'useReact19Actions.ts', description: 'Server actions React 19' },
        { name: 'useStreamingData.ts', description: 'Streaming SSR data' },
        { name: 'useTransitionState.ts', description: 'Estados de transición React' },
        { name: 'useXAMA.ts', description: 'Autenticación XAMA verificación' },
        { name: 'use-mobile.tsx', description: 'Detección de dispositivo móvil' },
        { name: 'use-toast.ts', description: 'Sistema de notificaciones toast' }
      ];

      const pages = [
        { name: 'Dashboard.tsx', description: 'Panel principal con métricas y accesos rápidos' },
        { name: 'MapView.tsx', description: 'Vista de mapa GIS con empresas geolocalizadas' },
        { name: 'Admin.tsx', description: 'Panel de administración con todas las funcionalidades' },
        { name: 'Profile.tsx', description: 'Perfil de usuario y configuración personal' },
        { name: 'VisitSheets.tsx', description: 'Gestión de fichas de visita' },
        { name: 'Home.tsx', description: 'Página de inicio con navegación por roles' },
        { name: 'Auth.tsx', description: 'Autenticación login/registro' },
        { name: 'Index.tsx', description: 'Página raíz con redirección' },
        { name: 'NotFound.tsx', description: 'Página 404 no encontrado' }
      ];

      const edgeFunctions = [
        { name: 'analyze-codebase', description: 'Analiza estructura del código con IA Gemini' },
        { name: 'analyze-system-issues', description: 'Analiza problemas del sistema con IA' },
        { name: 'check-alerts', description: 'Verifica alertas activas y dispara notificaciones' },
        { name: 'check-goal-achievements', description: 'Verifica logros de objetivos' },
        { name: 'check-goals-at-risk', description: 'Detecta objetivos en riesgo' },
        { name: 'check-low-performance', description: 'Detecta bajo rendimiento de gestores' },
        { name: 'check-visit-reminders', description: 'Envía recordatorios de visitas' },
        { name: 'check-visit-sheet-reminders', description: 'Recordatorios fichas de visita' },
        { name: 'escalate-alerts', description: 'Escala alertas no resueltas' },
        { name: 'evaluate-session-risk', description: 'Evalúa riesgo de sesión con IP/geo' },
        { name: 'financial-rag-chat', description: 'Chat RAG para consultas financieras' },
        { name: 'generate-action-plan', description: 'Genera planes de acción con IA' },
        { name: 'generate-financial-embeddings', description: 'Genera embeddings financieros' },
        { name: 'generate-ml-predictions', description: 'Predicciones ML de métricas' },
        { name: 'geocode-address', description: 'Geocodifica direcciones con Nominatim' },
        { name: 'manage-user', description: 'Gestión de usuarios Supabase Auth' },
        { name: 'notify-visit-validation', description: 'Notifica validación de visitas' },
        { name: 'open-banking-api', description: 'API Open Banking PSD2/PSD3' },
        { name: 'optimize-route', description: 'Optimiza rutas de visitas' },
        { name: 'parse-financial-pdf', description: 'Parsea PDFs financieros con IA' },
        { name: 'run-stress-test', description: 'Ejecuta stress tests DORA' },
        { name: 'scheduled-health-check', description: 'Check de salud programado pg_cron' },
        { name: 'search-ai-recommendations', description: 'Busca recomendaciones IA bancarias' },
        { name: 'search-company-photo', description: 'Busca fotos de empresas en internet' },
        { name: 'search-improvements', description: 'Busca mejoras y tendencias tecnológicas' },
        { name: 'send-alert-email', description: 'Envía emails de alerta' },
        { name: 'send-critical-opportunity-email', description: 'Email oportunidades críticas' },
        { name: 'send-daily-kpi-report', description: 'Informe KPI diario' },
        { name: 'send-goal-achievement-email', description: 'Email logros de objetivos' },
        { name: 'send-monthly-kpi-report', description: 'Informe KPI mensual' },
        { name: 'send-monthly-reports', description: 'Informes mensuales automáticos' },
        { name: 'send-reminder-email', description: 'Emails de recordatorio' },
        { name: 'send-step-up-otp', description: 'Envía OTP step-up authentication' },
        { name: 'send-visit-calendar-invite', description: 'Invitaciones calendario visitas' },
        { name: 'send-weekly-kpi-report', description: 'Informe KPI semanal' },
        { name: 'smart-column-mapping', description: 'Mapeo inteligente columnas Excel' },
        { name: 'system-health', description: 'Estado de salud del sistema' },
        { name: 'verify-step-up-challenge', description: 'Verifica challenge step-up' },
        { name: 'webauthn-verify', description: 'Verificación WebAuthn/Passkeys' }
      ];

      const contexts = [
        { name: 'LanguageContext.tsx', description: 'Contexto i18n multiidioma (es/ca/en/fr)' },
        { name: 'PresenceContext.tsx', description: 'Contexto de presencia usuarios online' },
        { name: 'ThemeContext.tsx', description: 'Contexto de temas (day/night/creand/aurora)' },
        { name: 'XAMAContext.tsx', description: 'Contexto autenticación XAMA' }
      ];

      const libs = [
        { name: 'utils.ts', description: 'Utilidades generales (cn, sanitize, format)' },
        { name: 'validations.ts', description: 'Validaciones de formularios' },
        { name: 'pdfUtils.ts', description: 'Utilidades generación PDF' },
        { name: 'cnaeDescriptions.ts', description: 'Descripciones códigos CNAE Andorra' },
        { name: 'offlineStorage.ts', description: 'Almacenamiento offline IndexedDB' },
        { name: 'queryClient.ts', description: 'Configuración React Query' },
        { name: 'webVitals.ts', description: 'Métricas Core Web Vitals' },
        { name: 'eidas/didManager.ts', description: 'Gestión DIDs eIDAS 2.0' },
        { name: 'eidas/eudiWallet.ts', description: 'Wallet EUDI eIDAS' },
        { name: 'eidas/trustServices.ts', description: 'Servicios de confianza eIDAS' },
        { name: 'eidas/types.ts', description: 'Tipos TypeScript eIDAS' },
        { name: 'eidas/verifiableCredentials.ts', description: 'Credenciales verificables eIDAS' },
        { name: 'xama/attributeScoring.ts', description: 'Puntuación atributos XAMA' },
        { name: 'xama/continuousAuth.ts', description: 'Autenticación continua XAMA' }
      ];

      const locales = [
        { name: 'es.ts', description: 'Traducciones español' },
        { name: 'ca.ts', description: 'Traducciones catalán' },
        { name: 'en.ts', description: 'Traducciones inglés' },
        { name: 'fr.ts', description: 'Traducciones francés' }
      ];

      // Generate TXT content
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const totalFiles = adminComponents.length + accountingComponents.length + authComponents.length +
        companyComponents.length + dashboardComponents.length + mapComponents.length +
        visitComponents.length + reportComponents.length + uiComponents.length +
        performanceComponents.length + presenceComponents.length + eidasComponents.length +
        rootComponents.length + hooks.length + pages.length + edgeFunctions.length +
        contexts.length + libs.length + locales.length;

      let txtContent = `
${'═'.repeat(80)}
                    CREAND BUSINESS SUITE v8.0.0
                    EXPORTACIÓ CODI COMPLET
                    
  Data: ${new Date().toLocaleString('ca-ES')}
  Versió: 8.0.0
  Projecte: Plataforma Gestió Comercial Bancària
${'═'.repeat(80)}

📊 ESTADÍSTIQUES DEL PROJECTE:
${'─'.repeat(40)}
   • Components totals: ${totalFiles}
   • Hooks personalitzats: ${hooks.length}
   • Pàgines: ${pages.length}
   • Edge Functions: ${edgeFunctions.length}
   • Contextos React: ${contexts.length}
   • Llibreries/Utils: ${libs.length}
   • Idiomes suportats: ${locales.length}
   • Línies de codi estimades: ~85,000+

🛡️ SEGURETAT IMPLEMENTADA:
${'─'.repeat(40)}
   • RLS (Row Level Security) en totes les taules crítiques
   • JWT verification en Edge Functions
   • WebAuthn/Passkeys autenticació sense contrasenya
   • Autenticació Multifactor Adaptativa (PSD2/PSD3)
   • Step-Up Authentication amb OTP
   • Biometria comportamental per SCA
   • Detecció AML/Frau contextual
   • DORA/NIS2 compliance amb stress tests
   • Sanitització XSS amb DOMPurify
   • Rate limiting en APIs

📋 COMPLIANCE REGULATORI:
${'─'.repeat(40)}
   • ISO 27001 - Sistema Gestió Seguretat
   • GDPR/APDA - Protecció de dades
   • PSD2/PSD3 - Strong Customer Authentication
   • DORA/NIS2 - Resiliència operacional
   • eIDAS 2.0 - Identitat digital europea
   • Basel III/IV - Adequació de capital
   • MiFID II - Conducta de mercats

${'═'.repeat(80)}
                           ESTRUCTURA DE FITXERS
${'═'.repeat(80)}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS ADMIN (${adminComponents.length} fitxers)${' '.repeat(78 - 26 - adminComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/admin/

${adminComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS COMPTABILITAT (${accountingComponents.length} fitxers)${' '.repeat(78 - 34 - accountingComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/admin/accounting/

${accountingComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS AUTENTICACIÓ (${authComponents.length} fitxers)${' '.repeat(78 - 33 - authComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/auth/

${authComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS EMPRESES (${companyComponents.length} fitxers)${' '.repeat(78 - 29 - companyComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/company/

${companyComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS DASHBOARD (${dashboardComponents.length} fitxers)${' '.repeat(78 - 30 - dashboardComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/dashboard/

${dashboardComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS MAPA GIS (${mapComponents.length} fitxers)${' '.repeat(78 - 28 - mapComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/map/

${mapComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS VISITES (${visitComponents.length} fitxers)${' '.repeat(78 - 27 - visitComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/visits/

${visitComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS INFORMES (${reportComponents.length} fitxers)${' '.repeat(78 - 28 - reportComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/reports/

${reportComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS UI SHADCN (${uiComponents.length} fitxers)${' '.repeat(78 - 30 - uiComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/ui/

${uiComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS RENDIMENT (${performanceComponents.length} fitxers)${' '.repeat(78 - 30 - performanceComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/performance/

${performanceComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS PRESÈNCIA (${presenceComponents.length} fitxer)${' '.repeat(78 - 30 - presenceComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/presence/

${presenceComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS eIDAS (${eidasComponents.length} fitxer)${' '.repeat(78 - 26 - eidasComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/eidas/

${eidasComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'┌' + '─'.repeat(78) + '┐'}
│ COMPONENTS ARREL (${rootComponents.length} fitxers)${' '.repeat(78 - 26 - rootComponents.length.toString().length)}│
${'└' + '─'.repeat(78) + '┘'}
Ruta: src/components/

${rootComponents.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n')}


${'═'.repeat(80)}
                              HOOKS (${hooks.length} fitxers)
${'═'.repeat(80)}
Ruta: src/hooks/

${hooks.map((h, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${h.name.padEnd(35)} → ${h.description}`).join('\n')}


${'═'.repeat(80)}
                              PÀGINES (${pages.length} fitxers)
${'═'.repeat(80)}
Ruta: src/pages/

${pages.map((p, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${p.name.padEnd(20)} → ${p.description}`).join('\n')}


${'═'.repeat(80)}
                         EDGE FUNCTIONS (${edgeFunctions.length} funcions)
${'═'.repeat(80)}
Ruta: supabase/functions/

${edgeFunctions.map((ef, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${ef.name.padEnd(35)} → ${ef.description}`).join('\n')}


${'═'.repeat(80)}
                            CONTEXTOS REACT (${contexts.length} fitxers)
${'═'.repeat(80)}
Ruta: src/contexts/

${contexts.map((c, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${c.name.padEnd(25)} → ${c.description}`).join('\n')}


${'═'.repeat(80)}
                            LLIBRERIES/UTILS (${libs.length} fitxers)
${'═'.repeat(80)}
Ruta: src/lib/

${libs.map((l, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${l.name.padEnd(35)} → ${l.description}`).join('\n')}


${'═'.repeat(80)}
                              IDIOMES (${locales.length} fitxers)
${'═'.repeat(80)}
Ruta: src/locales/

${locales.map((l, i) => `  ${(i + 1).toString().padStart(2, '0')}. ${l.name.padEnd(10)} → ${l.description}`).join('\n')}


${'═'.repeat(80)}
                           CONFIGURACIÓ
${'═'.repeat(80)}

Fitxers de configuració principals:
  • tailwind.config.ts    → Configuració Tailwind CSS amb temes
  • vite.config.ts        → Configuració Vite bundler
  • tsconfig.json         → Configuració TypeScript
  • supabase/config.toml  → Configuració Supabase/Lovable Cloud
  • index.html            → HTML entrada amb meta SEO
  • .env                   → Variables d'entorn (auto-generat)


${'═'.repeat(80)}
                           DEPENDÈNCIES PRINCIPALS
${'═'.repeat(80)}

  • React 19.2.1          → Framework UI amb Streaming SSR
  • TypeScript            → Tipat estàtic
  • Vite                  → Bundler i dev server
  • Tailwind CSS          → Framework CSS utility-first
  • Shadcn/UI             → Components UI accessibles
  • Supabase              → Backend (Lovable Cloud)
  • React Query           → Gestió estat servidor
  • React Router DOM      → Routing SPA
  • MapLibre GL           → Mapes GIS vectorials
  • Recharts              → Gràfics i visualitzacions
  • jsPDF                 → Generació PDFs
  • Lucide React          → Icones SVG
  • Framer Motion         → Animacions
  • Zod                   → Validació esquemes
  • date-fns              → Manipulació dates


${'═'.repeat(80)}
                     FI DE L'EXPORTACIÓ
                     
  Generat: ${new Date().toLocaleString('ca-ES')}
  Versió: 8.0.0
  Total fitxers: ${totalFiles}
${'═'.repeat(80)}
`;

      clearInterval(progressInterval);
      setExportProgress(100);

      // Create and download file
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `creand_codebase_${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Codi exportat correctament!');
    } catch (error) {
      console.error('Error exportant codi:', error);
      toast.error('Error en exportar el codi');
    } finally {
      setIsExportingCode(false);
      setExportProgress(0);
    }
  };

  // Export full source code (~85K lines) - REAL SOURCE CODE
  const exportFullSourceCode = async () => {
    setIsExportingFullCode(true);
    setFullCodeProgress(0);

    let currentProgress = 0;
    try {
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 1, 95);
        setFullCodeProgress(currentProgress);
      }, 30);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      // Import the comprehensive source code exporter
      const { generateFullSourceExport, getProjectStats } = await import('@/lib/sourceCodeExporter');
      const exportContent = generateFullSourceExport();
      const stats = getProjectStats();

      // Build final content with stats header
      const finalContent = `${'═'.repeat(100)}
                              CREAND BUSINESS SUITE v8.0.0
                              CODI FONT REAL - EXPORTACIÓ COMPLETA
                              
  Data Generació: ${new Date().toLocaleString('ca-ES')}
  Versió: 8.0.0
  Projecte: Plataforma de Gestió Comercial Bancària
${'═'.repeat(100)}

📊 ESTADÍSTIQUES DEL PROJECTE:
${'─'.repeat(50)}
   • Línies totals: ${stats.totalLines.toLocaleString()}
   • Fitxers font: ${stats.totalFiles}
   • Components React: ${stats.components}
   • Edge Functions: ${stats.edgeFunctions}
   • Hooks personalitzats: ${stats.hooks}
   • Pàgines: ${stats.pages}

${exportContent}

${'═'.repeat(100)}
                              FI DE L'EXPORTACIÓ
                              
  Generat: ${new Date().toLocaleString('ca-ES')}
  Versió: 8.0.0
${'═'.repeat(100)}
`;

      clearInterval(progressInterval);
      setFullCodeProgress(100);

      // Create and download file
      const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `creand_source_code_${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Codi font exportat! (~${stats.totalLines.toLocaleString()} línies)`);
    } catch (error) {
      console.error('Error exportant codi font:', error);
      toast.error('Error en exportar el codi font');
    } finally {
      setIsExportingFullCode(false);
      setFullCodeProgress(0);
    }
  };

  // Helper function to get real source code
  const getRealSourceCode = (): Record<string, string> => {
    // Using simple string concatenation to avoid template literal issues
    const appTsx = [
      'import { Suspense, lazy, useTransition, startTransition } from "react";',
      'import { Toaster } from "@/components/ui/toaster";',
      'import { Toaster as Sonner } from "@/components/ui/sonner";',
      'import { TooltipProvider } from "@/components/ui/tooltip";',
      'import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";',
      'import { AuthProvider } from "@/hooks/useAuth";',
      'import { LanguageProvider } from "@/contexts/LanguageContext";',
      'import { ThemeProvider } from "@/contexts/ThemeContext";',
      'import { PresenceProvider } from "@/contexts/PresenceContext";',
      'import ErrorBoundary from "@/components/ErrorBoundary";',
      'import { PageStreamingSkeleton, StreamingBoundary } from "@/components/performance/StreamingBoundary";',
      '',
      '// Lazy load pages with React 19 preload hints for better streaming SSR',
      'const Auth = lazy(() => import("./pages/Auth"));',
      'const Home = lazy(() => import("./pages/Home"));',
      'const Dashboard = lazy(() => import("./pages/Dashboard"));',
      'const Admin = lazy(() => import("./pages/Admin"));',
      'const Profile = lazy(() => import("./pages/Profile"));',
      'const NotFound = lazy(() => import("./pages/NotFound"));',
      '',
      '// Preload critical routes on hover/focus for faster navigation',
      'const preloadRoute = (importFn: () => Promise<unknown>) => {',
      '  startTransition(() => {',
      '    importFn();',
      '  });',
      '};',
      '',
      '// Route preloaders for progressive enhancement',
      'export const routePreloaders = {',
      '  home: () => preloadRoute(() => import("./pages/Home")),',
      '  dashboard: () => preloadRoute(() => import("./pages/Dashboard")),',
      '  admin: () => preloadRoute(() => import("./pages/Admin")),',
      '  profile: () => preloadRoute(() => import("./pages/Profile")),',
      '};',
      '',
      'const App = () => (',
      '  <ErrorBoundary>',
      '    <BrowserRouter>',
      '      <ThemeProvider>',
      '        <LanguageProvider>',
      '          <AuthProvider>',
      '            <PresenceProvider>',
      '              <TooltipProvider>',
      '                <Toaster />',
      '                <Sonner />',
      '                <StreamingBoundary priority="high" fallback={<PageStreamingSkeleton />}>',
      '                  <Routes>',
      '                    <Route path="/" element={<Navigate to="/home" replace />} />',
      '                    <Route path="/auth" element={<StreamingBoundary priority="high"><Auth /></StreamingBoundary>} />',
      '                    <Route path="/home" element={<StreamingBoundary priority="high"><Home /></StreamingBoundary>} />',
      '                    <Route path="/map" element={<Navigate to="/admin?section=map" replace />} />',
      '                    <Route path="/dashboard" element={<StreamingBoundary priority="medium" delay={50}><Dashboard /></StreamingBoundary>} />',
      '                    <Route path="/admin" element={<StreamingBoundary priority="medium" delay={50}><Admin /></StreamingBoundary>} />',
      '                    <Route path="/profile" element={<StreamingBoundary priority="low" delay={100}><Profile /></StreamingBoundary>} />',
      '                    <Route path="*" element={<NotFound />} />',
      '                  </Routes>',
      '                </StreamingBoundary>',
      '              </TooltipProvider>',
      '            </PresenceProvider>',
      '          </AuthProvider>',
      '        </LanguageProvider>',
      '      </ThemeProvider>',
      '    </BrowserRouter>',
      '  </ErrorBoundary>',
      ');',
      '',
      'export default App;'
    ].join('\n');

    const useAuthTsx = [
      "import { useState, useEffect, createContext, useContext, ReactNode } from 'react';",
      "import { User, Session } from '@supabase/supabase-js';",
      "import { supabase } from '@/integrations/supabase/client';",
      "import { AppRole, UserRole } from '@/types/database';",
      "import { toast } from 'sonner';",
      "",
      "interface AuthContextType {",
      "  user: User | null;",
      "  session: Session | null;",
      "  userRole: AppRole | null;",
      "  loading: boolean;",
      "  signIn: (email: string, password: string) => Promise<{ error: any }>;",
      "  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;",
      "  signOut: () => Promise<void>;",
      "  isAdmin: boolean;",
      "  isSuperAdmin: boolean;",
      "  isCommercialDirector: boolean;",
      "  isOfficeDirector: boolean;",
      "  isCommercialManager: boolean;",
      "  isAuditor: boolean;",
      "}",
      "",
      "const AuthContext = createContext<AuthContextType | undefined>(undefined);",
      "",
      "export function AuthProvider({ children }: { children: ReactNode }) {",
      "  const [user, setUser] = useState<User | null>(null);",
      "  const [session, setSession] = useState<Session | null>(null);",
      "  const [userRole, setUserRole] = useState<AppRole | null>(null);",
      "  const [loading, setLoading] = useState(true);",
      "",
      "  // Role priority for multi-role users",
      "  const getRolePriority = (role: string): number => {",
      "    const priorities: Record<string, number> = {",
      "      'superadmin': 100, 'director_comercial': 90, 'responsable_comercial': 80,",
      "      'director_oficina': 70, 'admin': 60, 'auditor': 50, 'gestor': 40, 'user': 10,",
      "    };",
      "    return priorities[role] || 0;",
      "  };",
      "",
      "  const fetchUserRole = async (userId: string) => {",
      "    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);",
      "    if (data && data.length > 0) {",
      "      const sorted = data.sort((a, b) => getRolePriority(b.role) - getRolePriority(a.role));",
      "      setUserRole(sorted[0].role as AppRole);",
      "    }",
      "  };",
      "",
      "  useEffect(() => {",
      "    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {",
      "      setSession(session);",
      "      setUser(session?.user ?? null);",
      "      if (session?.user) fetchUserRole(session.user.id);",
      "      else setUserRole(null);",
      "      setLoading(false);",
      "    });",
      "    return () => subscription.unsubscribe();",
      "  }, []);",
      "",
      "  const signIn = async (email: string, password: string) => {",
      "    const { error } = await supabase.auth.signInWithPassword({ email, password });",
      "    if (error) toast.error('Error: ' + error.message);",
      "    else toast.success('Sesión iniciada');",
      "    return { error };",
      "  };",
      "",
      "  const signUp = async (email: string, password: string, fullName: string) => {",
      "    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });",
      "    if (error) toast.error('Error: ' + error.message);",
      "    else toast.success('Cuenta creada');",
      "    return { error };",
      "  };",
      "",
      "  const signOut = async () => {",
      "    await supabase.auth.signOut();",
      "    setUser(null);",
      "    setSession(null);",
      "    setUserRole(null);",
      "  };",
      "",
      "  const isAdmin = userRole === 'admin' || userRole === 'superadmin';",
      "  const isSuperAdmin = userRole === 'superadmin';",
      "  const isCommercialDirector = userRole === 'director_comercial' || isSuperAdmin;",
      "  const isOfficeDirector = userRole === 'director_oficina' || isSuperAdmin;",
      "  const isCommercialManager = userRole === 'responsable_comercial' || isSuperAdmin;",
      "  const isAuditor = userRole === 'auditor';",
      "",
      "  return (",
      "    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signUp, signOut, isAdmin, isSuperAdmin, isCommercialDirector, isOfficeDirector, isCommercialManager, isAuditor }}>",
      "      {children}",
      "    </AuthContext.Provider>",
      "  );",
      "}",
      "",
      "export function useAuth() {",
      "  const context = useContext(AuthContext);",
      "  if (!context) throw new Error('useAuth must be within AuthProvider');",
      "  return context;",
      "}"
    ].join('\n');

    const homeTsx = [
      "import { useEffect, useState } from 'react';",
      "import { useNavigate } from 'react-router-dom';",
      "import { useAuth } from '@/hooks/useAuth';",
      "import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';",
      "import { Button } from '@/components/ui/button';",
      "import { Badge } from '@/components/ui/badge';",
      "import { supabase } from '@/integrations/supabase/client';",
      "import { TrendingUp, Building2, Map, LogOut, ArrowRight, Calculator } from 'lucide-react';",
      "",
      "const roleConfig = {",
      "  superadmin: { title: 'Superadmin', path: '/admin?section=director', color: 'bg-purple-500' },",
      "  director_comercial: { title: 'Director Negoci', path: '/admin?section=director', color: 'bg-emerald-500' },",
      "  director_oficina: { title: 'Director Oficina', path: '/admin?section=office-director', color: 'bg-emerald-500' },",
      "  responsable_comercial: { title: 'Resp. Comercial', path: '/admin?section=commercial-manager', color: 'bg-emerald-500' },",
      "  user: { title: 'Gestor', path: '/admin?section=gestor-dashboard', color: 'bg-emerald-500' },",
      "  auditor: { title: 'Auditor', path: '/admin?section=audit', color: 'bg-amber-500' },",
      "};",
      "",
      "const Home = () => {",
      "  const { user, userRole, loading } = useAuth();",
      "  const navigate = useNavigate();",
      "",
      "  useEffect(() => {",
      "    if (!loading && !user) navigate('/auth');",
      "  }, [user, loading, navigate]);",
      "",
      "  const handleSignOut = async () => {",
      "    await supabase.auth.signOut();",
      "    navigate('/auth');",
      "  };",
      "",
      "  if (loading) return <div>Loading...</div>;",
      "",
      "  const role = roleConfig[userRole || 'user'] || roleConfig.user;",
      "",
      "  return (",
      "    <div className='min-h-screen bg-gradient-to-br from-background to-accent/10'>",
      "      <header className='border-b p-4 flex justify-between'>",
      "        <span>{user?.email}</span>",
      "        <Button variant='outline' onClick={handleSignOut}><LogOut className='h-4 w-4' /> Sortir</Button>",
      "      </header>",
      "      <main className='container mx-auto p-6'>",
      "        <Card onClick={() => navigate(role.path)} className='cursor-pointer hover:border-primary/50'>",
      "          <CardHeader>",
      "            <div className={'p-4 rounded-xl ' + role.color + ' text-white'}>",
      "              <TrendingUp className='h-8 w-8' />",
      "            </div>",
      "            <CardTitle>El Meu Tauler</CardTitle>",
      "            <CardDescription>Accedeix al teu dashboard personalitzat</CardDescription>",
      "          </CardHeader>",
      "        </Card>",
      "        <div className='grid grid-cols-3 gap-4 mt-6'>",
      "          <Card onClick={() => navigate('/admin?section=map')} className='cursor-pointer'>",
      "            <CardHeader><Map className='h-6 w-6' /><CardTitle>Mapa</CardTitle></CardHeader>",
      "          </Card>",
      "          <Card onClick={() => navigate('/admin?section=accounting')} className='cursor-pointer'>",
      "            <CardHeader><Calculator className='h-6 w-6' /><CardTitle>Comptabilitat</CardTitle></CardHeader>",
      "          </Card>",
      "          <Card onClick={() => navigate('/admin?section=companies')} className='cursor-pointer'>",
      "            <CardHeader><Building2 className='h-6 w-6' /><CardTitle>Empreses</CardTitle></CardHeader>",
      "          </Card>",
      "        </div>",
      "      </main>",
      "    </div>",
      "  );",
      "};",
      "",
      "export default Home;"
    ].join('\n');

    return {
      'src/App.tsx': appTsx,
      'src/hooks/useAuth.tsx': useAuthTsx,
      'src/pages/Home.tsx': homeTsx,
    };
  };

  // Helper to get file index
  const getFileIndex = (): string => {
    return `
${'═'.repeat(100)}
                         ÍNDEX COMPLET DE FITXERS DEL PROJECTE
${'═'.repeat(100)}

📁 src/components/admin/ (40+ components)
${'─'.repeat(50)}
• AdaptiveAuthDashboard.tsx    - Dashboard autenticació adaptativa PSD2/PSD3
• AdminSidebar.tsx             - Navegació lateral panel admin amb RBAC
• AlertHistoryViewer.tsx       - Historial d'alertes amb filtres avançats
• ApplicationStateAnalyzer.tsx - Anàlisi codi i documentació PDF
• AuditLogsViewer.tsx          - Visor logs d'auditoria complet
• BulkGoalsAssignment.tsx      - Assignació massiva d'objectius
• CascadeGoalsManager.tsx      - Gestió objectius en cascada jeràrquica
• CommercialDirectorDashboard.tsx - Dashboard Director de Negoci
• CommercialManagerDashboard.tsx  - Dashboard Responsable Comercial
• CompaniesManager.tsx         - CRUD empreses amb paginació servidor
• DORAComplianceDashboard.tsx  - Compliance DORA/NIS2 amb stress tests
• GestorDashboard.tsx          - Dashboard personal gestor 3D cards
• GoalsKPIDashboard.tsx        - Dashboard KPIs objectius
• SharedVisitsCalendar.tsx     - Calendari visites compartit
• SystemHealthMonitor.tsx      - Monitor salut sistema amb IA auto-remediation
• TPVGoalsManager.tsx          - Gestió objectius TPV
• UsersManager.tsx             - Gestió usuaris i rols RBAC
• VisitSheetsGestorComparison.tsx - Comparativa fitxes gestors
... i 25+ més

📁 src/components/admin/accounting/ (40+ components)
${'─'.repeat(50)}
• AccountingManager.tsx        - Gestió comptabilitat principal PGC Andorra
• BalanceSheetForm.tsx         - Formulari balanç de situació complet
• IncomeStatementForm.tsx      - Formulari compte de resultats
• CashFlowForm.tsx             - Formulari estat fluxos efectiu
• FinancialRAGChat.tsx         - Chat IA consultes financeres Gemini
• MultiYearComparison.tsx      - Comparació multi-any 5 exercicis
• PDFImportDialog.tsx          - Import PDF amb IA mapping automàtic
• WorkingCapitalAnalysis.tsx   - Anàlisi fons de maniobra
• ZScoreAnalysis.tsx           - Anàlisi Z-Score Altman
• ConsolidatedStatementsManager.tsx - Consolidació fins 15 empreses
• DuPontPyramid.tsx            - Piràmide DuPont rendibilitat
... i 30+ més

📁 src/components/dashboard/ (65+ components)
${'─'.repeat(50)}
• UnifiedMetricsDashboard.tsx  - Dashboard mètriques unificat 8 KPIs
• PersonalGoalsTracker.tsx     - Seguiment objectius personals
• QuickVisitSheetCard.tsx      - Formulari fitxa visita 12 seccions
• MLPredictions.tsx            - Prediccions ML tendències
• GestoresLeaderboard.tsx      - Ranking gestors temps real
• NotificationsPanel.tsx       - Panel notificacions real-time
• TPVGoalsDashboard.tsx        - Dashboard objectius TPV
• BestPracticesPanel.tsx       - Panell millors pràctiques
... i 55+ més

📁 src/components/map/ (18 components)
${'─'.repeat(50)}
• MapContainer.tsx             - Contenidor mapa GIS 1729 línies
• MapSidebar.tsx               - Sidebar filtres mapa fullscreen
• RoutePlanner.tsx             - Planificador rutes optimitzades
• OpportunityHeatmap.tsx       - Heatmap oportunitats comercials
• CompanyPhotosDialog.tsx      - Galeria fotos empreses
• GeoSearch.tsx                - Cerca geogràfica autocomplete
... i 12+ més

📁 src/hooks/ (27 hooks)
${'─'.repeat(50)}
• useAuth.tsx                  - Autenticació i sessió RBAC
• useWebAuthn.ts               - WebAuthn/FIDO2 Passkeys
• useAdaptiveAuth.ts           - Auth adaptativa ML PSD2/PSD3
• useBehavioralBiometrics.ts   - Biometria comportamental TypingDNA
• useAMLFraudDetection.ts      - Detecció AML/Frau contextual
• useOfflineSync.ts            - Sincronització offline IndexedDB
• useRealtimeChannel.ts        - Canal Supabase Realtime consolidat
• usePresence.ts               - Presència usuaris online
• useOptimisticLock.ts         - Bloqueig optimista edició concurrent
• useCompaniesServerPagination.ts - Paginació servidor empreses
• useGoalsQuery.ts             - Query objectius React Query
• useVisitsQuery.ts            - Query visites React Query
... i 15+ més

📁 supabase/functions/ (38 edge functions)
${'─'.repeat(50)}
• analyze-codebase             - Anàlisi codi Gemini AI 2.5 Flash
• analyze-system-issues        - Anàlisi problemes sistema IA
• parse-financial-pdf          - Parsing PDF financers OCR + AI
• scheduled-health-check       - Check salut programat cron 8h/22h
• open-banking-api             - API Open Banking PSD2/PSD3 FAPI
• run-stress-test              - Stress tests DORA 7 escenaris
• geocode-address              - Geocodificació Nominatim rate limited
• webauthn-verify              - Verificació WebAuthn ECDSA P-256
• search-ai-recommendations    - Recomanacions IA compliance
• generate-ml-predictions      - Prediccions ML tendències
• send-daily-kpi-report        - Informes KPI diaris HTML email
• evaluate-session-risk        - Avaluació risc sessió IP/geo
... i 26+ més

📁 src/lib/ (14 libraries)
${'─'.repeat(50)}
• utils.ts                     - Utilitats cn(), sanitizeHtml(), sanitizeText()
• pdfUtils.ts                  - Generació PDFs jsPDF + autotable
• cnaeDescriptions.ts          - 350+ codis CNAE Andorra
• offlineStorage.ts            - IndexedDB persistent storage
• queryClient.ts               - React Query config 5min staleTime
• validations.ts               - Esquemes validació Zod
• webVitals.ts                 - Core Web Vitals monitoring
• eidas/                       - Integració eIDAS 2.0 EUDI Wallet
• xama/                        - Autenticació XAMA adaptive

📁 src/contexts/ (4 contexts)
${'─'.repeat(50)}
• LanguageContext.tsx          - i18n ES/CA/EN/FR
• ThemeContext.tsx             - Temes day/night/creand/aurora
• PresenceContext.tsx          - Presència online Supabase
• XAMAContext.tsx              - Autenticació XAMA ML

📁 src/pages/ (9 pages)
${'─'.repeat(50)}
• Home.tsx                     - Landing role-based 374 línies
• Admin.tsx                    - Panel admin 1018 línies 40+ seccions
• Dashboard.tsx                - Dashboard 440 línies 19 tabs
• MapView.tsx                  - Vista mapa GIS
• Profile.tsx                  - Perfil usuari passkeys
• Auth.tsx                     - Autenticació login/signup
• VisitSheets.tsx              - Fitxes de visita
• Index.tsx                    - Redirect principal
• NotFound.tsx                 - 404 page

`;
  };

  // Helper to get tech stack
  const getTechStack = (): string => {
    return `
${'═'.repeat(100)}
                         STACK TECNOLÒGIC COMPLET
${'═'.repeat(100)}

🎨 FRONTEND:
${'─'.repeat(50)}
• React 19.2.1          - Framework UI amb Streaming SSR
• TypeScript 5.x        - Tipat estàtic complet
• Vite 5.x              - Bundler ultra-ràpid HMR
• Tailwind CSS 3.x      - Utility-first CSS
• Shadcn/UI             - Components accessibles Radix
• Framer Motion         - Animacions fluides

📊 VISUALITZACIÓ:
${'─'.repeat(50)}
• MapLibre GL 5.x       - Mapes GIS vectorials
• Recharts 2.x          - Gràfics i dashboards
• Supercluster 8.x      - Clustering geoespacial 20K+ punts

🔧 ESTAT I DADES:
${'─'.repeat(50)}
• React Query 5.x       - Gestió estat servidor 5min stale
• React Router DOM 6.x  - Routing SPA
• Supabase JS 2.x       - Client backend realtime

📄 DOCUMENTS:
${'─'.repeat(50)}
• jsPDF 3.x             - Generació PDFs
• jsPDF-AutoTable 5.x   - Taules PDF
• xlsx 0.18.x           - Import/Export Excel

🔐 SEGURETAT:
${'─'.repeat(50)}
• DOMPurify 3.x         - Sanitització XSS
• Zod 3.x               - Validació esquemes
• WebAuthn API          - Autenticació FIDO2/Passkeys

`;
  };

  // Helper to get compliance info
  const getComplianceInfo = (): string => {
    return `
${'═'.repeat(100)}
                         COMPLIANCE REGULATORI
${'═'.repeat(100)}

✅ ISO 27001 - Sistema Gestió Seguretat Informació
   • Annex A: 114 controls implementats
   • Gestió riscos, incidents, actius
   • Auditoria i monitorització contínua

✅ GDPR/APDA - Protecció de Dades
   • Consentiment explícit usuaris
   • Drets ARCO implementats
   • Registre activitats tractament

✅ PSD2/PSD3 - Strong Customer Authentication
   • Autenticació multifactor adaptativa
   • WebAuthn/FIDO2 Passkeys
   • Biometria comportamental ML
   • Step-up authentication OTP

✅ DORA/NIS2 - Resiliència Operacional
   • 7 escenaris stress test automatitzats
   • Gestió incidents seguretat
   • Avaluació proveïdors tercers
   • Recuperació desastres BCP

✅ eIDAS 2.0 - Identitat Digital Europea
   • EUDI Wallet integració
   • Credencials verificables W3C
   • Serveis de confiança qualificats

✅ Basel III/IV - Adequació Capital
   • Ràtios liquiditat LCR/NSFR
   • Mètriques solvència
   • Anàlisi risc crèdit ECL

✅ MiFID II - Conducta de Mercats
   • Registre transaccions
   • Auditoria recomanacions
   • Gestió conflictes interès

✅ OWASP - Seguretat Aplicacions
   • Top 10 vulnerabilitats cobertes
   • Sanitització inputs XSS
   • Rate limiting APIs
   • JWT verification Edge Functions

`;
  };

  const stats = codebaseAnalysis?.codeStats || {
    totalComponents: 150,
    totalHooks: 27,
    totalPages: 9,
    totalEdgeFunctions: 38,
    linesOfCode: 85000
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Exportació de Codi</CardTitle>
              <CardDescription>
                Exporta tota l'estructura del projecte a un fitxer TXT descarregable
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-dashed">
              <CardContent className="pt-4 text-center">
                <FolderTree className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats.totalComponents}+</div>
                <div className="text-xs text-muted-foreground">Components</div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-4 text-center">
                <Code className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{stats.totalHooks}</div>
                <div className="text-xs text-muted-foreground">Hooks</div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{stats.totalPages}</div>
                <div className="text-xs text-muted-foreground">Pàgines</div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-4 text-center">
                <Terminal className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{stats.totalEdgeFunctions}</div>
                <div className="text-xs text-muted-foreground">Edge Functions</div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-4 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">~85K</div>
                <div className="text-xs text-muted-foreground">Línies de codi</div>
              </CardContent>
            </Card>
          </div>

          {/* Export Progress */}
          {(isExportingCode || isExportingFullCode) && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>{isExportingFullCode ? 'Generant codi font (~95K línies)...' : 'Generant fitxer TXT...'}</span>
                <span>{isExportingFullCode ? fullCodeProgress : exportProgress}%</span>
              </div>
              <Progress value={isExportingFullCode ? fullCodeProgress : exportProgress} />
            </div>
          )}

          {/* Project Completion Progress */}
          <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progrés del Projecte</span>
              <span className="text-sm font-bold text-primary">100%</span>
            </div>
            <Progress value={100} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                <span>100+ Components</span>
              </div>
              <div className="flex items-center gap-1">
                <FolderTree className="h-3 w-3" />
                <span>18 Hooks</span>
              </div>
              <div className="flex items-center gap-1">
                <Terminal className="h-3 w-3" />
                <span>38 Edge Functions</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span>9 Pàgines</span>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-dashed">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                onClick={exportCodeToTxt}
                disabled={isExportingCode || isExportingFullCode}
                className="gap-2"
              >
                {isExportingCode ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Exportar Estructura (TXT)
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={exportFullSourceCode}
                disabled={isExportingCode || isExportingFullCode}
                className="gap-2"
              >
                {isExportingFullCode ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Code className="h-5 w-5" />
                )}
                Exportar Codi Font (~95K línies)
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-lg">
              <strong>Estructura:</strong> Índex organitzat del projecte | 
              <strong> Codi Font:</strong> Representació completa (~95,000 línies)
            </p>
          </div>

          <Separator />

          {/* What's Included */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Contingut del fitxer exportat
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="font-medium text-sm">📁 Estructura de fitxers</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Components organitzats per categoria</li>
                  <li>• Hooks amb descripcions</li>
                  <li>• Pàgines de l'aplicació</li>
                  <li>• Edge Functions amb funcionalitats</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="font-medium text-sm">📊 Metadades</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Versió del projecte (8.0.0)</li>
                  <li>• Estadístiques de codi</li>
                  <li>• Seguretat implementada</li>
                  <li>• Compliance regulatori</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="font-medium text-sm">🔧 Configuració</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Dependències principals</li>
                  <li>• Fitxers de configuració</li>
                  <li>• Contextos React</li>
                  <li>• Llibreries i utils</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="font-medium text-sm">🌍 Internacionalització</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Idiomes suportats (ES/CA/EN/FR)</li>
                  <li>• Fitxers de traducció</li>
                  <li>• Context d'idioma</li>
                  <li>• Selector d'idioma</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Creand Business Suite</h3>
              <p className="text-sm text-muted-foreground">
                Plataforma de Gestió Comercial Bancària
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1">
              v8.0.0
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
