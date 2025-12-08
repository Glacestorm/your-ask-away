import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, CheckCircle, Sparkles, Code, DollarSign, Users, AlertTriangle, TrendingUp, Globe, Target, Award, Shield, Database, Server, ClipboardCheck, FileDown, BookOpen, BarChart3, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface GenerationStep {
  id: string;
  name: string;
  completed: boolean;
}

interface ModuleAnalysis {
  name: string;
  description: string;
  implementedFeatures: string[];
  pendingFeatures: string[];
  completionPercentage: number;
  files: string[];
  businessValue?: string;
  differentiators?: string[];
}

interface MarketValuation {
  totalHours: number;
  hourlyRate: number;
  totalCost: number;
  breakdown: { category: string; hours: number; cost: number }[];
  marketValue?: number;
  roi5Years?: string;
  comparisonWithCompetitors?: string;
}

interface CompetitorComparison {
  name: string;
  type: string;
  url?: string;
  targetMarket?: string;
  licenseCost: string;
  implementationCost: string;
  maintenanceCost: string;
  totalCost5Years?: string;
  marketShare?: string;
  pros: string[];
  cons: string[];
  comparisonVsCreand?: string;
  usedByBanks?: string[];
}

interface PotentialClient {
  sector: string;
  clientType: string;
  region: string;
  estimatedValue: string;
  implementationTime: string;
  customizations: string[];
  potentialClients?: number;
  marketPenetration?: string;
  salesPriority?: number;
  conversionProbability?: string;
  decisionMakers?: string[];
  salesApproach?: string;
}

interface MarketingHighlights {
  uniqueSellingPoints: string[];
  competitiveAdvantages: string[];
  targetAudience: string[];
  valueProposition: string;
  keyBenefits: { benefit: string; description: string; impact: string }[];
  testimonialPotential: string[];
  industryTrends: string[];
}

interface PricingTier {
  name: string;
  price: string;
  features: string[];
}

interface PricingStrategy {
  recommendedModel: string;
  oneTimeLicense: { price: string; pros: string[]; cons: string[]; whenToUse: string };
  subscriptionModel: { pricePerUser: string; tiers: PricingTier[]; pros: string[]; cons: string[] };
  maintenanceContract: { percentage: string; includes: string[]; optional: string[] };
  competitorPricing: { competitor: string; model: string; priceRange: string }[];
  recommendation: string;
}

interface FeasibilityAnalysis {
  spanishMarket: { viability: string; barriers: string[]; opportunities: string[]; competitors: string[]; marketSize: string; recommendation: string };
  europeanMarket: { viability: string; targetCountries: string[]; regulations: string[]; opportunities: string[]; recommendation: string };
  latamMarket?: { viability: string; targetCountries: string[]; regulations: string[]; opportunities: string[]; marketSize: string; recommendation: string };
  otherMarkets?: { region: string; viability: string; countries: string[]; opportunities: string[]; marketSize: string; recommendation: string }[];
  implementationRisks: { risk: string; probability: string; mitigation: string }[];
  successFactors: string[];
  timeToMarket: string;
}

interface ClientCostSavings {
  clientType: string;
  currentCost: number;
  creandCost: number;
  savings: number;
  savingsPercentage: number;
  breakEvenMonths: number;
  roi5Years: number;
  details: string;
}

interface MarketingPlan {
  executiveSummary: string;
  missionVision: { mission: string; vision: string };
  swotAnalysis: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  targetSegments: { segment: string; size: string; penetration: string; priority: number }[];
  positioningStrategy: string;
  valuePropositions: { segment: string; proposition: string; keyBenefits: string[] }[];
  pricingPsychology: { strategy: string; anchoring: string; bundling: string[] };
  salesStrategy: { channel: string; approach: string; cycle: string; conversion: string }[];
  marketingChannels: { channel: string; investment: string; expectedROI: string; timeline: string }[];
  kpis: { metric: string; target: string; measurement: string }[];
  budget: { category: string; amount: number; percentage: number }[];
  timeline: { phase: string; duration: string; activities: string[]; milestones: string[] }[];
  competitiveAdvantages: { advantage: string; impact: string; sustainability: string }[];
}

interface ISO27001Control {
  id: string;
  domain: string;
  control: string;
  status: 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
  evidence: string;
  gap?: string;
  action?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  effort?: string;
}

interface ISO27001Compliance {
  currentMaturity: number;
  overallScore: number;
  annexAControls: ISO27001Control[];
  compliantControls: { control: string; status: string; evidence: string }[];
  partialControls: { control: string; gap: string; action: string }[];
  missingControls: { control: string; priority: string; effort: string; timeline: string }[];
  implementationPlan: { phase: string; duration: string; activities: string[]; cost: string }[];
  certificationTimeline: string;
  estimatedCost: string;
  requiredDocuments: string[];
  riskAssessment: { risk: string; likelihood: string; impact: string; treatment: string }[];
}

interface TCOAnalysis {
  year1: { category: string; cost: number; description: string }[];
  year3: { category: string; cost: number; description: string }[];
  year5: { category: string; cost: number; description: string }[];
  totalYear1: number;
  totalYear3: number;
  totalYear5: number;
  costPerUser: { users: number; costPerUser: number }[];
  breakEvenAnalysis: { scenario: string; months: number; savingsPerYear: number }[];
  comparisonVsCompetitors: { competitor: string; tco5Years: number; difference: string }[];
}

interface BCPPlan {
  overview: string;
  rto: string;
  rpo: string;
  criticalSystems: { system: string; priority: number; rto: string; rpo: string; recoveryProcedure: string }[];
  disasterScenarios: { scenario: string; probability: string; impact: string; response: string; recoveryTime: string }[];
  backupStrategy: { component: string; frequency: string; retention: string; location: string }[];
  communicationPlan: { stakeholder: string; contactMethod: string; escalationLevel: number }[];
  testingSchedule: { testType: string; frequency: string; lastTest: string; nextTest: string }[];
  recoveryTeam: { role: string; responsibility: string; contactPriority: number }[];
}

interface GapAnalysis {
  overallMaturity: number;
  domains: { domain: string; currentState: number; targetState: number; gap: number; priority: string; actions: string[] }[];
  criticalGaps: { gap: string; risk: string; recommendation: string; effort: string; timeline: string }[];
  roadmap: { quarter: string; objectives: string[]; deliverables: string[]; estimatedCost: string }[];
  resourceRequirements: { resource: string; quantity: string; duration: string; cost: string }[];
}

interface OtherRegulation {
  name: string;
  jurisdiction: string;
  description: string;
  currentCompliance: string;
  requiredActions: string[];
  priority: string;
}

interface TemenosIntegration {
  overview: string;
  integrationMethods: { method: string; description: string; complexity: string; timeline: string; cost: string }[];
  apiConnectors: { name: string; purpose: string; protocol: string }[];
  dataFlows: { flow: string; direction: string; frequency: string }[];
  implementationSteps: { step: number; description: string; duration: string; deliverables: string[] }[];
  estimatedCost: string;
  prerequisites: string[];
}

interface ProjectCosts {
  developmentCost: { category: string; hours: number; rate: number; total: number }[];
  infrastructureCost: { item: string; monthly: number; annual: number }[];
  licensingCost: { license: string; type: string; cost: number }[];
  operationalCost: { item: string; monthly: number; description: string }[];
  totalFirstYear: number;
  totalFiveYears: number;
  breakdownByPhase: { phase: string; cost: number; duration: string }[];
}

interface CodebaseAnalysis {
  version: string;
  generationDate: string;
  modules: ModuleAnalysis[];
  pendingFeatures: string[];
  securityFindings: string[];
  marketValuation: MarketValuation;
  competitorComparison: CompetitorComparison[];
  potentialClients: PotentialClient[];
  codeStats: {
    totalFiles: number;
    totalComponents: number;
    totalHooks: number;
    totalEdgeFunctions: number;
    totalPages: number;
    linesOfCode: number;
  };
  marketingHighlights?: MarketingHighlights;
  pricingStrategy?: PricingStrategy;
  feasibilityAnalysis?: FeasibilityAnalysis;
  iso27001Compliance?: ISO27001Compliance;
  otherRegulations?: OtherRegulation[];
  tcoAnalysis?: TCOAnalysis;
  bcpPlan?: BCPPlan;
  gapAnalysis?: GapAnalysis;
  temenosIntegration?: TemenosIntegration;
  projectCosts?: ProjectCosts;
  clientCostSavings?: ClientCostSavings[];
  marketingPlan?: MarketingPlan;
}

const COMPONENTS_LIST = [
  'admin/AdminSidebar.tsx', 'admin/AlertHistoryViewer.tsx', 'admin/AuditLogsViewer.tsx',
  'admin/AuditorDashboard.tsx', 'admin/BulkGoalsAssignment.tsx', 'admin/CommercialDirectorDashboard.tsx',
  'admin/CommercialManagerAudit.tsx', 'admin/CommercialManagerDashboard.tsx', 'admin/CompaniesManager.tsx',
  'admin/CompaniesPagination.tsx', 'admin/ConceptsManager.tsx', 'admin/ContractedProductsReport.tsx',
  'admin/DirectorAlertsPanel.tsx', 'admin/DORAComplianceDashboard.tsx', 'admin/EmailTemplatesManager.tsx', 
  'admin/ExcelImporter.tsx', 'admin/GestorDashboard.tsx', 'admin/GestoresMetrics.tsx', 
  'admin/GoalsKPIDashboard.tsx', 'admin/GoalsProgressTracker.tsx', 'admin/ImportHistoryViewer.tsx', 
  'admin/KPIReportHistory.tsx', 'admin/MapTooltipConfig.tsx', 'admin/MetricsExplorer.tsx', 
  'admin/OfficeDirectorDashboard.tsx', 'admin/ProductsManager.tsx', 'admin/ProductsMetrics.tsx', 
  'admin/SharedVisitsCalendar.tsx', 'admin/StatusColorsManager.tsx', 'admin/SystemHealthMonitor.tsx', 
  'admin/TPVGoalsManager.tsx', 'admin/TPVManager.tsx', 'admin/UsersManager.tsx', 
  'admin/VinculacionMetrics.tsx', 'admin/VisitSheetAuditViewer.tsx', 'admin/VisitSheetValidationPanel.tsx',
  'admin/VisitSheetsGestorComparison.tsx', 'admin/VisitsMetrics.tsx', 'admin/AdaptiveAuthDashboard.tsx',
  'admin/CascadeGoalsManager.tsx', 'admin/ApplicationStateAnalyzer.tsx',
  'admin/accounting/AccountingCompanyIndex.tsx', 'admin/accounting/AccountingGroupsChart.tsx',
  'admin/accounting/AccountingMainMenu.tsx', 'admin/accounting/AccountingManager.tsx',
  'admin/accounting/AddedValueAnalysis.tsx', 'admin/accounting/AnalyticalPLChart.tsx',
  'admin/accounting/AuditTab.tsx', 'admin/accounting/BalanceAnalysisArea.tsx',
  'admin/accounting/BalanceSheetForm.tsx', 'admin/accounting/BankRatingAnalysis.tsx',
  'admin/accounting/CashFlowAnalysis.tsx', 'admin/accounting/CashFlowForm.tsx',
  'admin/accounting/CompanySearchBar.tsx', 'admin/accounting/ConsolidatedStatementsManager.tsx',
  'admin/accounting/DuPontPyramid.tsx', 'admin/accounting/EBITEBITDAAnalysis.tsx',
  'admin/accounting/EconomicFinancialDashboard.tsx', 'admin/accounting/EnhancedCompanyHeader.tsx',
  'admin/accounting/EquityChangesForm.tsx', 'admin/accounting/FinancialAnalysisTab.tsx',
  'admin/accounting/FinancialNotesManager.tsx', 'admin/accounting/FinancialRAGChat.tsx',
  'admin/accounting/FinancialStatementsHistory.tsx', 'admin/accounting/FinancingStatement.tsx', 
  'admin/accounting/IncomeStatementChart.tsx', 'admin/accounting/IncomeStatementForm.tsx', 
  'admin/accounting/LiquidityDebtRatios.tsx', 'admin/accounting/LongTermFinancialAnalysis.tsx', 
  'admin/accounting/MovingAnnualTrendChart.tsx', 'admin/accounting/MultiYearComparison.tsx', 
  'admin/accounting/PDFImportDialog.tsx', 'admin/accounting/PeriodYearSelector.tsx', 
  'admin/accounting/ProfitabilityTab.tsx', 'admin/accounting/ProvisionalStatementsManager.tsx', 
  'admin/accounting/RatiosPyramid.tsx', 'admin/accounting/ReportsTab.tsx', 
  'admin/accounting/SectorSimulator.tsx', 'admin/accounting/SectoralRatiosAnalysis.tsx', 
  'admin/accounting/TreasuryMovements.tsx', 'admin/accounting/ValuationTab.tsx', 
  'admin/accounting/WorkingCapitalAnalysis.tsx', 'admin/accounting/WorkingCapitalNOF.tsx', 
  'admin/accounting/ZScoreAnalysis.tsx',
  'auth/PasskeyButton.tsx', 'auth/PasskeyManager.tsx', 'auth/StepUpAuthDialog.tsx',
  'auth/XAMAStatusIndicator.tsx', 'auth/XAMAVerificationDialog.tsx',
  'company/BankAffiliationsManager.tsx', 'company/CompanyDetail.tsx', 'company/CompanyPhotosManager.tsx',
  'company/CompanyPrintReport.tsx', 'company/ContactsManager.tsx', 'company/DocumentsManager.tsx',
  'company/ExcelExportDialog.tsx', 'company/TPVTerminalsManager.tsx', 'company/VisitSheetsHistory.tsx',
  'dashboard/AccountingDashboardCard.tsx', 'dashboard/ActionPlanManager.tsx',
  'dashboard/ActivityStatistics.tsx', 'dashboard/AdvancedAnalyticsDashboardCard.tsx',
  'dashboard/AlertHistoryDashboardCard.tsx', 'dashboard/AlertsManager.tsx',
  'dashboard/AnalisisCohortes.tsx', 'dashboard/AnalisisEmbudo.tsx', 'dashboard/AnalisisGeografico.tsx',
  'dashboard/BestPracticeComments.tsx', 'dashboard/BestPracticesPanel.tsx',
  'dashboard/CompaniesDashboardCard.tsx', 'dashboard/ComparativaTemporales.tsx',
  'dashboard/ContractedProductsDashboardCard.tsx', 'dashboard/DateRangeFilter.tsx',
  'dashboard/EmailReminderPreferences.tsx', 'dashboard/FilteredMetricsWrapper.tsx',
  'dashboard/GestorComparison.tsx', 'dashboard/GestorDashboardCard.tsx',
  'dashboard/GestorEvolutionTimeline.tsx', 'dashboard/GestorFilterSelector.tsx',
  'dashboard/GestorOverviewSection.tsx', 'dashboard/GestoresLeaderboard.tsx',
  'dashboard/GoalsAlertsDashboardCard.tsx', 'dashboard/KPIDashboardCard.tsx',
  'dashboard/MLPredictions.tsx', 'dashboard/MapButton.tsx', 'dashboard/MapDashboardCard.tsx', 
  'dashboard/MetricsCardsSection.tsx', 'dashboard/MetricsDashboardCard.tsx', 
  'dashboard/NotificationPreferences.tsx', 'dashboard/NotificationService.tsx', 
  'dashboard/NotificationsPanel.tsx', 'dashboard/ObjetivosYMetas.tsx', 
  'dashboard/OfflineSyncIndicator.tsx', 'dashboard/PersonalActivityHistory.tsx',
  'dashboard/PersonalGoalsDetailedAnalysis.tsx', 'dashboard/PersonalGoalsHistory.tsx',
  'dashboard/PersonalGoalsTracker.tsx', 'dashboard/PersonalKPIsDashboard.tsx',
  'dashboard/PowerBIExport.tsx', 'dashboard/PrediccionesFuturas.tsx',
  'dashboard/PushNotifications.tsx', 'dashboard/QuickActionsPanel.tsx',
  'dashboard/QuickVisitManager.tsx', 'dashboard/QuickVisitSheetCard.tsx',
  'dashboard/RealtimeNotificationsBadge.tsx', 'dashboard/ResumenEjecutivo.tsx', 
  'dashboard/TPVGestorRanking.tsx', 'dashboard/TPVGoalsComparison.tsx', 
  'dashboard/TPVGoalsDashboard.tsx', 'dashboard/TPVGoalsHistory.tsx', 
  'dashboard/UnifiedMetricsDashboard.tsx', 'dashboard/UpcomingVisitsWidget.tsx', 
  'dashboard/VisitReminders.tsx',
  'eidas/EIDASVerificationPanel.tsx',
  'map/CompanyPhotosDialog.tsx', 'map/GeoSearch.tsx', 'map/MapContainer.tsx',
  'map/MapHeader.tsx', 'map/MapLayersControl.tsx', 'map/MapSidebar.tsx', 'map/MapLegend.tsx',
  'map/MapStatisticsPanel.tsx', 'map/OpportunityHeatmap.tsx', 'map/RoutePlanner.tsx',
  'map/SectorStats.tsx', 'map/VisitsPanel.tsx', 'map/markerIcons.tsx', 'map/markerStyles.tsx',
  'performance/OptimizedImage.tsx', 'performance/PerformanceMonitor.tsx',
  'performance/SSRCacheProvider.tsx', 'performance/StreamingBoundary.tsx',
  'presence/OnlineUsersIndicator.tsx',
  'reports/ReportGenerator.tsx', 'reports/TechnicalDocumentGenerator.tsx',
  'reports/DynamicTechnicalDocGenerator.tsx', 'reports/AppDetailedStatusGenerator.tsx',
  'reports/CodebaseIndexGenerator.tsx', 'reports/CompetitorGapAnalysisGenerator.tsx',
  'visits/ParticipantsSelector.tsx', 'visits/SignaturePad.tsx', 'visits/VisitSheetForm.tsx',
  'visits/VisitSheetPhotos.tsx', 'visits/VisitSheetTemplateSelector.tsx',
];

const HOOKS_LIST = [
  'useAuth.tsx', 'useCelebration.ts', 'useCompaniesServerPagination.ts',
  'useCompanyPhotosLazy.ts', 'useDeferredValue.ts', 'useGoalsQuery.ts', 
  'useNavigationHistory.ts', 'useNotifications.tsx', 'useNotificationsQuery.ts', 
  'useOfflineSync.ts', 'useOptimisticLock.ts', 'usePerformanceMonitor.ts',
  'usePresence.ts', 'useReact19Actions.ts', 'useRealtimeChannel.ts', 
  'useStreamingData.ts', 'useTransitionState.ts', 'useVisitsQuery.ts', 
  'useWebAuthn.ts', 'useWebVitals.ts', 'useXAMA.ts', 'useEIDAS.ts',
  'useAdaptiveAuth.ts', 'useBehavioralBiometrics.ts', 'useAMLFraudDetection.ts',
  'use-mobile.tsx', 'use-toast.ts',
];

const EDGE_FUNCTIONS = [
  'analyze-codebase', 'analyze-system-issues', 'check-alerts', 'check-goal-achievements', 
  'check-goals-at-risk', 'check-low-performance', 'check-visit-reminders', 
  'check-visit-sheet-reminders', 'escalate-alerts', 'evaluate-session-risk',
  'financial-rag-chat', 'generate-action-plan', 'generate-financial-embeddings',
  'generate-ml-predictions', 'geocode-address', 'manage-user', 'notify-visit-validation', 
  'open-banking-api', 'optimize-route', 'parse-financial-pdf', 'run-stress-test',
  'scheduled-health-check', 'search-ai-recommendations', 'search-company-photo', 
  'search-improvements', 'send-alert-email', 'send-critical-opportunity-email', 
  'send-daily-kpi-report', 'send-goal-achievement-email', 'send-monthly-kpi-report', 
  'send-monthly-reports', 'send-reminder-email', 'send-step-up-otp',
  'send-visit-calendar-invite', 'send-weekly-kpi-report', 'smart-column-mapping', 
  'system-health', 'verify-step-up-challenge', 'webauthn-verify',
];

const PAGES_LIST = [
  'Admin.tsx', 'Auth.tsx', 'Dashboard.tsx', 'Home.tsx', 'Index.tsx',
  'MapView.tsx', 'NotFound.tsx', 'Profile.tsx', 'VisitSheets.tsx',
];

type PDFPart = 'part1' | 'part2' | 'part3' | 'part4';

export const DynamicTechnicalDocGenerator = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPart, setGeneratingPart] = useState<PDFPart | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<CodebaseAnalysis | null>(null);
  const [analyzeSteps, setAnalyzeSteps] = useState<GenerationStep[]>([
    { id: 'connect', name: 'Conectando Gemini 2.5', completed: false },
    { id: 'scan', name: 'Escaneando código', completed: false },
    { id: 'modules', name: 'Analizando módulos', completed: false },
    { id: 'security', name: 'Evaluando seguridad', completed: false },
    { id: 'compliance', name: 'ISO 27001/DORA', completed: false },
    { id: 'valuation', name: 'Valoración económica', completed: false },
  ]);

  const updateAnalyzeStep = (stepId: string) => {
    setAnalyzeSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const analyzeCodebase = async (): Promise<CodebaseAnalysis> => {
    setAnalyzing(true);
    setProgress(0);
    setAnalyzeSteps(prev => prev.map(s => ({ ...s, completed: false })));
    
    try {
      setProgress(10);
      updateAnalyzeStep('connect');
      
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: {
          componentsList: COMPONENTS_LIST,
          hooksList: HOOKS_LIST,
          edgeFunctions: EDGE_FUNCTIONS,
          pagesList: PAGES_LIST,
          totalComponents: COMPONENTS_LIST.length,
          totalHooks: HOOKS_LIST.length,
          totalEdgeFunctions: EDGE_FUNCTIONS.length,
          totalPages: PAGES_LIST.length,
          securityFeatures: [
            'RLS 30+ tablas', 'JWT Edge Functions', 'WebAuthn/FIDO2', 
            'Step-Up Auth', 'AMA PSD3', 'DORA Stress Tests', 'eIDAS 2.0'
          ],
          fileStructure: `
src/
├── components/ (${COMPONENTS_LIST.length} componentes)
│   ├── admin/ (40+ componentes administración)
│   ├── admin/accounting/ (45+ componentes contables PGC)
│   ├── auth/ (5 componentes WebAuthn/Step-Up)
│   ├── company/ (9 componentes empresa)
│   ├── dashboard/ (55+ componentes dashboard)
│   ├── eidas/ (1 componente eIDAS 2.0)
│   ├── map/ (15 componentes GIS)
│   ├── performance/ (4 componentes optimización)
│   ├── presence/ (1 componente presencia)
│   ├── reports/ (6 generadores informes)
│   ├── ui/ (50+ componentes shadcn)
│   └── visits/ (5 componentes visitas)
├── hooks/ (${HOOKS_LIST.length} hooks personalizados)
├── pages/ (${PAGES_LIST.length} páginas)
├── contexts/ (4 contextos: Auth, Theme, Language, Presence, XAMA)
├── lib/ (utilidades, validaciones, CNAE, eIDAS, XAMA)
└── locales/ (4 idiomas: es, ca, en, fr)
supabase/
├── functions/ (${EDGE_FUNCTIONS.length} edge functions IA/email/auth/stress)
└── migrations/ (40+ migraciones SQL con RLS)
security/
├── semgrep-rules.yaml (SAST)
├── snyk-policy.json (SCA)
├── sonarqube-project.properties
└── zap-rules.tsv (DAST)
          `
        }
      });

      setProgress(30);
      updateAnalyzeStep('scan');
      
      setProgress(50);
      updateAnalyzeStep('modules');
      
      setProgress(70);
      updateAnalyzeStep('security');
      
      setProgress(85);
      updateAnalyzeStep('compliance');

      if (error) throw error;
      
      if (!data || data.error || !data.modules || !Array.isArray(data.modules)) {
        console.error('Invalid analysis response:', data);
        throw new Error(data?.error || 'Invalid response from analysis');
      }
      
      setProgress(100);
      updateAnalyzeStep('valuation');
      
      setAnalysis(data as CodebaseAnalysis);
      toast.success('Análisis completado', { description: 'Ahora puedes generar los 3 PDFs' });
      return data as CodebaseAnalysis;
    } catch (error) {
      console.error('Error analyzing codebase:', error);
      toast.info('Usando análisis predeterminado', { description: 'Los PDFs contendrán datos de referencia' });
      const defaultAnalysis = getDefaultAnalysis();
      setAnalysis(defaultAnalysis);
      setProgress(100);
      analyzeSteps.forEach(step => updateAnalyzeStep(step.id));
      return defaultAnalysis;
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper functions for PDF generation
  const createPDFHelpers = (doc: jsPDF, codebaseAnalysis: CodebaseAnalysis) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;
    let pageNumber = 1;

    const addNewPage = () => {
      doc.addPage();
      pageNumber++;
      currentY = margin;
      addPageNumber();
    };

    const addPageNumber = () => {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      doc.setFontSize(7);
      doc.text(`CRM Bancario Creand - v${codebaseAnalysis.version} - ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 8);
      doc.setTextColor(0, 0, 0);
    };

    const checkPageBreak = (neededSpace: number) => {
      if (currentY + neededSpace > pageHeight - 22) {
        addNewPage();
        return true;
      }
      return false;
    };

    const addMainTitle = (text: string) => {
      checkPageBreak(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 50, 120);
      doc.text(text, margin, currentY);
      currentY += 3;
      doc.setDrawColor(15, 50, 120);
      doc.setLineWidth(0.8);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    };

    const addTitle = (text: string, level: number = 1) => {
      checkPageBreak(18);
      const sizes = [15, 12, 11, 10];
      const colors: [number, number, number][] = [[15, 50, 120], [30, 80, 150], [50, 100, 170], [70, 120, 180]];
      doc.setFontSize(sizes[level - 1] || 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors[level - 1][0], colors[level - 1][1], colors[level - 1][2]);
      doc.text(text, margin, currentY);
      currentY += level === 1 ? 10 : 7;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    };

    const addSubtitle = (text: string) => {
      checkPageBreak(12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 60, 90);
      doc.text(text, margin, currentY);
      currentY += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    };

    const addParagraph = (text: string, indent: number = 0) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      lines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin + indent, currentY);
        currentY += 4.5;
      });
      currentY += 2;
    };

    const addBullet = (text: string, indent: number = 0, icon: string = '•') => {
      checkPageBreak(5);
      doc.setFontSize(9);
      doc.text(icon, margin + indent, currentY);
      const lines = doc.splitTextToSize(text, contentWidth - indent - 6);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + indent + 4, currentY + (i * 4.5));
      });
      currentY += lines.length * 4.5 + 1.5;
    };

    const addHighlightBox = (title: string, text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      checkPageBreak(30);
      const colors: Record<string, { bg: number[]; border: number[]; title: number[] }> = {
        info: { bg: [235, 245, 255], border: [59, 130, 246], title: [20, 60, 140] },
        success: { bg: [236, 253, 245], border: [34, 197, 94], title: [22, 101, 52] },
        warning: { bg: [254, 249, 195], border: [234, 179, 8], title: [161, 98, 7] },
        error: { bg: [254, 226, 226], border: [239, 68, 68], title: [153, 27, 27] }
      };
      const c = colors[type];
      doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
      doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
      const lines = doc.splitTextToSize(text, contentWidth - 12);
      const boxHeight = (lines.length * 4.5) + 14;
      doc.roundedRect(margin, currentY - 2, contentWidth, boxHeight, 2, 2, 'FD');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(c.title[0], c.title[1], c.title[2]);
      doc.text(title, margin + 5, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8);
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, currentY + 10 + (i * 4.5));
      });
      currentY += boxHeight + 4;
      doc.setTextColor(0, 0, 0);
    };

    const addTable = (headers: string[], rows: string[][], colWidths?: number[]) => {
      checkPageBreak(25);
      const defaultWidth = contentWidth / headers.length;
      const widths = colWidths || headers.map(() => defaultWidth);
      
      doc.setFillColor(15, 50, 120);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      let xPos = margin;
      doc.rect(margin, currentY - 4, contentWidth, 7, 'F');
      headers.forEach((header, i) => {
        const headerLines = doc.splitTextToSize(header, widths[i] - 3);
        doc.text(headerLines[0] || '', xPos + 1.5, currentY);
        xPos += widths[i];
      });
      currentY += 5;

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      rows.forEach((row, rowIndex) => {
        const cellLines = row.map((cell, i) => doc.splitTextToSize(cell || '', widths[i] - 3));
        const maxLines = Math.max(...cellLines.map(lines => lines.length), 1);
        const rowHeight = Math.max(5, maxLines * 3.5);
        
        checkPageBreak(rowHeight + 2);
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 247, 250);
          doc.rect(margin, currentY - 3, contentWidth, rowHeight, 'F');
        }
        
        xPos = margin;
        row.forEach((cell, i) => {
          const lines = doc.splitTextToSize(cell || '', widths[i] - 3);
          lines.slice(0, 3).forEach((line: string, lineIdx: number) => {
            doc.text(line, xPos + 1.5, currentY + (lineIdx * 3.5));
          });
          xPos += widths[i];
        });
        currentY += rowHeight;
      });
      currentY += 3;
    };

    const addProgressBar = (label: string, percentage: number) => {
      checkPageBreak(10);
      doc.setFontSize(8);
      doc.text(`${label}: ${percentage}%`, margin, currentY);
      doc.setFillColor(220, 220, 220);
      doc.roundedRect(margin + 45, currentY - 3, 60, 4, 1, 1, 'F');
      const color: [number, number, number] = percentage >= 80 ? [34, 197, 94] : percentage >= 50 ? [234, 179, 8] : [239, 68, 68];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin + 45, currentY - 3, (60 * percentage / 100), 4, 1, 1, 'F');
      currentY += 7;
    };

    return {
      pageWidth, pageHeight, margin, contentWidth,
      get currentY() { return currentY; },
      set currentY(val: number) { currentY = val; },
      get pageNumber() { return pageNumber; },
      addNewPage, addPageNumber, checkPageBreak, addMainTitle, addTitle,
      addSubtitle, addParagraph, addBullet, addHighlightBox, addTable, addProgressBar
    };
  };

  // PART 1: Portada, Índice, Resumen, Módulos, Marketing, Valoración (~35 páginas)
  const generatePart1 = async () => {
    if (!analysis) return;
    setGeneratingPart('part1');
    setProgress(0);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const h = createPDFHelpers(doc, analysis);

      // PORTADA
      setProgress(5);
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, h.pageWidth, 90, 'F');
      doc.setFillColor(20, 60, 140);
      doc.rect(0, 60, h.pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM BANCARIO CREAND', h.pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('PARTE 1: Resumen Ejecutivo y Módulos', h.pageWidth / 2, 50, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(`Versión ${analysis.version}`, h.pageWidth / 2, 75, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      h.currentY = 105;
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(h.margin, h.currentY - 5, h.contentWidth, 50, 3, 3, 'F');
      
      doc.setFontSize(10);
      const metadata = [
        ['Fecha:', new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Componentes:', `${analysis.codeStats.totalComponents} componentes React`],
        ['Edge Functions:', `${analysis.codeStats.totalEdgeFunctions} funciones serverless`],
        ['Coste Desarrollo:', `${analysis.marketValuation.totalCost.toLocaleString()} EUR`],
        ['Valor Mercado:', `${(analysis.marketValuation.marketValue || analysis.marketValuation.totalCost * 2.5).toLocaleString()} EUR`],
      ];
      
      metadata.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, h.margin + 5, h.currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, h.margin + 50, h.currentY);
        h.currentY += 8;
      });

      h.currentY += 10;
      h.addHighlightBox('PARTE 1 - CONTENIDO', 
        'Resumen Ejecutivo, Estadísticas del Código, Análisis de Módulos (Dashboard, Contabilidad, GIS, Auth, DORA), Marketing y Ventas, Valoración Económica.',
        'info');

      h.addPageNumber();

      // ÍNDICE PARTE 1
      h.addNewPage();
      setProgress(10);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 50, 120);
      doc.text('ÍNDICE - PARTE 1', h.pageWidth / 2, h.currentY, { align: 'center' });
      h.currentY += 12;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '1', title: 'RESUMEN EJECUTIVO', page: 3 },
        { num: '2', title: 'ESTADÍSTICAS DEL CÓDIGO', page: 5 },
        { num: '3', title: 'ANÁLISIS DE MÓDULOS', page: 7 },
        { num: '3.1', title: 'Dashboard Multi-Rol Inteligente', page: 8 },
        { num: '3.2', title: 'Contabilidad PGC Enterprise', page: 10 },
        { num: '3.3', title: 'GIS Bancario Enterprise', page: 12 },
        { num: '3.4', title: 'Autenticación AMA PSD3', page: 14 },
        { num: '3.5', title: 'DORA/NIS2 Compliance', page: 16 },
        { num: '4', title: 'ADDENDUM: MARKETING Y VENTAS', page: 18 },
        { num: '4.1', title: 'Puntos Fuertes Únicos (USP)', page: 19 },
        { num: '4.2', title: 'Ventajas Competitivas', page: 20 },
        { num: '4.3', title: 'Audiencia Objetivo', page: 21 },
        { num: '5', title: 'VALORACIÓN ECONÓMICA', page: 23 },
        { num: '5.1', title: 'Coste de Desarrollo', page: 24 },
        { num: '5.2', title: 'Desglose por Categoría', page: 25 },
        { num: '5.3', title: 'Stack Tecnológico', page: 27 },
      ];

      doc.setFontSize(9);
      indexItems.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, h.margin, h.currentY);
        doc.text(item.title, h.margin + 12, h.currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        const dotsWidth = h.contentWidth - 45 - doc.getTextWidth(item.title);
        const dots = '.'.repeat(Math.max(1, Math.floor(dotsWidth / 1.5)));
        doc.text(dots, h.margin + 17 + doc.getTextWidth(item.title), h.currentY);
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.page), h.pageWidth - h.margin, h.currentY, { align: 'right' });
        h.currentY += 6;
      });

      h.addPageNumber();

      // 1. RESUMEN EJECUTIVO
      h.addNewPage();
      setProgress(20);
      
      h.addMainTitle('1. RESUMEN EJECUTIVO');
      
      h.addParagraph(`El Sistema CRM Bancario Creand versión ${analysis.version} es una plataforma integral enterprise desarrollada específicamente para entidades bancarias, con especialización en el Principado de Andorra, España y la Unión Europea. Incluye ${analysis.modules.length} módulos principales y cumplimiento total de normativas bancarias internacionales.`);

      h.addHighlightBox('💡 PROPUESTA DE VALOR ÚNICA', 
        analysis.marketingHighlights?.valueProposition || 
        'CRM bancario especializado que reduce costes operativos un 40%, mejora productividad comercial un 25% y se implementa en 1/6 del tiempo de alternativas enterprise, con propiedad total del código y sin vendor lock-in.',
        'success');

      h.addSubtitle('Estadísticas Clave del Proyecto');
      h.addTable(
        ['Métrica', 'Valor', 'Benchmark Mercado'],
        [
          ['Componentes React', String(analysis.codeStats.totalComponents), 'Promedio CRM: 80-120'],
          ['Edge Functions', String(analysis.codeStats.totalEdgeFunctions), 'Promedio: 10-15'],
          ['Líneas de Código', analysis.codeStats.linesOfCode.toLocaleString(), 'CRM medio: 50K-80K'],
          ['Coste Desarrollo', `${analysis.marketValuation.totalCost.toLocaleString()}€`, 'Similar: 250K-450K€'],
          ['Valor Mercado', `${(analysis.marketValuation.marketValue || analysis.marketValuation.totalCost * 2.5).toLocaleString()}€`, '2-3x coste desarrollo'],
          ['Módulos', String(analysis.modules.length), 'Promedio: 5-8 módulos'],
          ['Idiomas', '4 (ES, CA, EN, FR)', 'Promedio: 2-3'],
        ],
        [55, 55, 60]
      );

      h.addNewPage();
      h.addTitle('1.1 Diferenciadores Clave', 2);
      const differentiators = [
        'Único CRM bancario con contabilidad PGC Andorra/España nativa integrada',
        'GIS enterprise para 20.000+ empresas sin degradación de rendimiento',
        'WebAuthn/FIDO2 + Step-Up + AMA PSD3 nativos (no plugin externo)',
        'DORA/NIS2 compliance con 7 stress tests automatizados',
        'IA Gemini 2.5 para análisis financiero y parsing PDF',
        'Soporte multi-idioma nativo (ES, CA, EN, FR)',
        'Propiedad total del código sin vendor lock-in',
      ];
      differentiators.forEach(d => h.addBullet(d, 0, '★'));

      // 2. ESTADÍSTICAS DEL CÓDIGO
      h.addNewPage();
      setProgress(30);
      
      h.addMainTitle('2. ESTADÍSTICAS DEL CÓDIGO');
      
      h.addTable(
        ['Categoría', 'Cantidad', 'Descripción'],
        [
          ['Archivos Total', String(analysis.codeStats.totalFiles), 'Componentes, hooks, utils, pages'],
          ['Componentes React', String(analysis.codeStats.totalComponents), 'UI components con TypeScript'],
          ['Custom Hooks', String(analysis.codeStats.totalHooks), 'Lógica reutilizable'],
          ['Edge Functions', String(analysis.codeStats.totalEdgeFunctions), 'Backend serverless'],
          ['Páginas', String(analysis.codeStats.totalPages), 'Rutas principales'],
          ['Líneas de Código', analysis.codeStats.linesOfCode.toLocaleString(), 'Estimación total'],
        ],
        [55, 40, 75]
      );

      h.currentY += 5;
      h.addTitle('2.1 Stack Tecnológico', 2);
      const techStack = [
        ['Frontend', 'React 19, TypeScript, Tailwind CSS, Shadcn/UI'],
        ['Backend', 'Supabase (PostgreSQL, Auth, Storage, Edge Functions)'],
        ['IA/ML', 'Google Gemini 2.5, OpenRouter, LangChain'],
        ['GIS', 'MapLibre GL, Supercluster, Google OR-Tools'],
        ['Auth', 'WebAuthn/FIDO2, Step-Up OTP, AMA PSD3, eIDAS 2.0'],
        ['Email', 'Resend para notificaciones transaccionales'],
        ['Security', 'SAST (Semgrep), DAST (OWASP ZAP), SCA (Snyk)'],
        ['CI/CD', 'GitHub Actions, Lovable Cloud'],
        ['Monitoring', 'Web Vitals, Performance Monitor, Audit Logs'],
      ];
      h.addTable(['Capa', 'Tecnologías'], techStack, [40, 130]);

      // 3. ANÁLISIS DE MÓDULOS
      h.addNewPage();
      setProgress(45);
      
      h.addMainTitle('3. ANÁLISIS DE MÓDULOS');

      h.addParagraph(`El sistema consta de ${analysis.modules.length} módulos principales, cada uno diseñado para cubrir un aspecto crítico de la operativa bancaria. A continuación se presenta el análisis detallado de cada módulo.`);

      analysis.modules.forEach((module, index) => {
        h.checkPageBreak(70);
        
        h.addTitle(`3.${index + 1} ${module.name}`, 2);
        h.addParagraph(module.description);
        
        if (module.businessValue) {
          h.addHighlightBox('VALOR DE NEGOCIO', module.businessValue, 'success');
        }
        
        h.addProgressBar('Completitud', module.completionPercentage);

        h.addSubtitle('Funcionalidades Implementadas');
        module.implementedFeatures.slice(0, 8).forEach(feature => {
          h.addBullet(feature, 3, '✓');
        });

        if (module.differentiators && module.differentiators.length > 0) {
          h.addSubtitle('Diferenciadores vs Competencia');
          module.differentiators.slice(0, 4).forEach(diff => {
            h.addBullet(diff, 3, '★');
          });
        }

        if (module.pendingFeatures.length > 0) {
          h.addSubtitle('Pendiente de Implementar');
          module.pendingFeatures.slice(0, 3).forEach(feature => {
            h.addBullet(feature, 3, '○');
          });
        }

        h.currentY += 8;
      });

      // 4. MARKETING Y VENTAS
      h.addNewPage();
      setProgress(60);
      
      h.addMainTitle('4. ADDENDUM: MARKETING Y VENTAS');
      const marketing = analysis.marketingHighlights;
      
      h.addTitle('4.1 Puntos Fuertes Únicos (USP)', 2);
      if (marketing?.uniqueSellingPoints) {
        marketing.uniqueSellingPoints.forEach((usp, i) => {
          h.addBullet(`${i + 1}. ${usp}`, 0, '>');
        });
      }

      h.currentY += 5;
      h.addTitle('4.2 Ventajas Competitivas', 2);
      if (marketing?.competitiveAdvantages) {
        marketing.competitiveAdvantages.forEach(adv => {
          h.addBullet(adv, 0, '+');
        });
      }

      h.addNewPage();
      h.addTitle('4.3 Audiencia Objetivo', 2);
      if (marketing?.targetAudience) {
        marketing.targetAudience.forEach(audience => {
          h.addBullet(audience, 0, '→');
        });
      }

      h.currentY += 5;
      h.addTitle('4.4 Beneficios Clave', 2);
      if (marketing?.keyBenefits) {
        h.addTable(
          ['Beneficio', 'Descripción', 'Impacto'],
          marketing.keyBenefits.map(b => [b.benefit, b.description, b.impact]),
          [45, 70, 55]
        );
      }

      h.currentY += 5;
      h.addTitle('4.5 Tendencias de la Industria', 2);
      if (marketing?.industryTrends) {
        marketing.industryTrends.forEach(trend => {
          h.addBullet(trend, 0, '📈');
        });
      }

      // 5. VALORACIÓN ECONÓMICA
      h.addNewPage();
      setProgress(80);
      
      h.addMainTitle('5. VALORACIÓN ECONÓMICA');

      h.addHighlightBox('RESUMEN VALORACIÓN', 
        `Coste de desarrollo: ${analysis.marketValuation.totalCost.toLocaleString()}€ | Valor de mercado: ${(analysis.marketValuation.marketValue || analysis.marketValuation.totalCost * 2.5).toLocaleString()}€ | ROI 5 años: ${analysis.marketValuation.roi5Years || '420%'}`,
        'success');

      h.addTitle('5.1 Coste de Desarrollo', 2);
      h.addTable(
        ['Concepto', 'Valor'],
        [
          ['Horas de Desarrollo', `${analysis.marketValuation.totalHours.toLocaleString()} horas`],
          ['Tarifa Hora Mercado', `${analysis.marketValuation.hourlyRate}€/hora`],
          ['COSTE TOTAL DESARROLLO', `${analysis.marketValuation.totalCost.toLocaleString()}€`],
          ['VALOR DE MERCADO', `${(analysis.marketValuation.marketValue || analysis.marketValuation.totalCost * 2.5).toLocaleString()}€`],
          ['ROI Estimado 5 Años', analysis.marketValuation.roi5Years || '420%'],
        ],
        [90, 80]
      );

      h.addNewPage();
      h.addTitle('5.2 Desglose por Categoría', 2);
      h.addTable(
        ['Categoría', 'Horas', 'Coste', '% Total'],
        analysis.marketValuation.breakdown.map(item => [
          item.category,
          `${item.hours.toLocaleString()} h`,
          `${item.cost.toLocaleString()}€`,
          `${Math.round((item.cost / analysis.marketValuation.totalCost) * 100)}%`
        ]),
        [55, 35, 45, 35]
      );

      h.currentY += 10;
      h.addHighlightBox('COMPARATIVA COMPETIDORES', 
        analysis.marketValuation.comparisonWithCompetitors || 'TCO 75% inferior a Salesforce FSC, 80% inferior a SAP Banking Services',
        'info');

      // Página final parte 1
      h.addNewPage();
      setProgress(95);
      
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, h.pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FIN DE LA PARTE 1', h.pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Resumen Ejecutivo, Módulos, Marketing y Valoración', h.pageWidth / 2, 38, { align: 'center' });

      h.currentY = 65;
      doc.setTextColor(0, 0, 0);
      
      h.addHighlightBox('CONTENIDO PARTE 2', 
        'TCO (Total Cost of Ownership) a 1/3/5 años, Comparativa detallada de Competidores Bancarios, Estrategia de Pricing y Licencias, ISO 27001 Annex A completo (114 controles), Otras Normativas (GDPR, DORA, PSD2, NIS2, eIDAS 2.0).',
        'info');

      h.addHighlightBox('CONTENIDO PARTE 3', 
        'Plan de Continuidad de Negocio (BCP), Gap Analysis y Roadmap 2025, Viabilidad España y Europa, Clientes Potenciales, Integración Temenos T24, Desglose Completo de Costes, Conclusiones y Anexos.',
        'info');

      setProgress(100);
      
      const filename = `CRM_Creand_PARTE1_Resumen_Modulos_v${analysis.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Parte 1 generada', {
        description: `${h.pageNumber} páginas - Resumen, Módulos, Marketing, Valoración`,
      });

    } catch (error) {
      console.error('Error generating Part 1:', error);
      toast.error('Error al generar Parte 1');
    } finally {
      setGeneratingPart(null);
    }
  };

  // PART 2: TCO, Competidores, Pricing, ISO 27001, Normativas (~35 páginas)
  const generatePart2 = async () => {
    if (!analysis) return;
    setGeneratingPart('part2');
    setProgress(0);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const h = createPDFHelpers(doc, analysis);

      // PORTADA PARTE 2
      setProgress(5);
      doc.setFillColor(30, 80, 150);
      doc.rect(0, 0, h.pageWidth, 90, 'F');
      doc.setFillColor(40, 100, 170);
      doc.rect(0, 60, h.pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM BANCARIO CREAND', h.pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('PARTE 2: TCO, Competidores e ISO 27001', h.pageWidth / 2, 50, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(`Versión ${analysis.version}`, h.pageWidth / 2, 75, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      h.currentY = 105;
      
      h.addHighlightBox('PARTE 2 - CONTENIDO', 
        'TCO (Total Cost of Ownership) análisis detallado a 1/3/5 años, Comparativa exhaustiva de Competidores Bancarios (Salesforce, Microsoft, SAP, Temenos), Estrategia de Pricing y Licencias, ISO 27001 Annex A completo con 114 controles, Cumplimiento GDPR/DORA/PSD2/NIS2/eIDAS.',
        'info');

      h.addPageNumber();

      // ÍNDICE PARTE 2
      h.addNewPage();
      setProgress(8);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 80, 150);
      doc.text('ÍNDICE - PARTE 2', h.pageWidth / 2, h.currentY, { align: 'center' });
      h.currentY += 12;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '6', title: 'TCO - TOTAL COST OF OWNERSHIP', page: 3 },
        { num: '6.1', title: 'Análisis TCO 1/3/5 Años', page: 4 },
        { num: '6.2', title: 'Comparativa TCO vs Competidores', page: 6 },
        { num: '6.3', title: 'Break-Even Analysis', page: 7 },
        { num: '7', title: 'COMPETIDORES BANCARIOS', page: 9 },
        { num: '7.1', title: 'Salesforce Financial Services Cloud', page: 10 },
        { num: '7.2', title: 'Microsoft Dynamics 365 Finance', page: 12 },
        { num: '7.3', title: 'SAP Banking Services', page: 14 },
        { num: '8', title: 'ESTRATEGIA DE PRICING', page: 16 },
        { num: '8.1', title: 'Modelo Licencia Perpetua', page: 17 },
        { num: '8.2', title: 'Modelo Suscripción SaaS', page: 18 },
        { num: '9', title: 'ISO 27001 CUMPLIMIENTO', page: 20 },
        { num: '9.1', title: 'Resumen por Dominio Annex A', page: 21 },
        { num: '9.2', title: 'Controles con Gaps', page: 24 },
        { num: '9.3', title: 'Plan Certificación', page: 27 },
        { num: '10', title: 'OTRAS NORMATIVAS', page: 29 },
        { num: '10.1', title: 'GDPR', page: 30 },
        { num: '10.2', title: 'DORA', page: 31 },
        { num: '10.3', title: 'PSD2/PSD3', page: 32 },
        { num: '10.4', title: 'NIS2', page: 33 },
        { num: '10.5', title: 'eIDAS 2.0', page: 34 },
      ];

      doc.setFontSize(9);
      indexItems.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, h.margin, h.currentY);
        doc.text(item.title, h.margin + 12, h.currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.page), h.pageWidth - h.margin, h.currentY, { align: 'right' });
        h.currentY += 5.5;
      });

      h.addPageNumber();

      // 6. TCO ANALYSIS
      h.addNewPage();
      setProgress(15);
      
      h.addMainTitle('6. TCO - TOTAL COST OF OWNERSHIP');

      const tco = analysis.tcoAnalysis;
      if (tco) {
        h.addHighlightBox('RESUMEN TCO', 
          `Año 1: ${tco.totalYear1?.toLocaleString() || '202.000'}€ | Año 3: ${tco.totalYear3?.toLocaleString() || '349.000'}€ | Año 5: ${tco.totalYear5?.toLocaleString() || '497.000'}€`,
          'success');

        h.addTitle('6.1 Análisis TCO a 1, 3 y 5 años', 2);
        h.addTable(
          ['Período', 'Coste Total', 'Coste/Usuario (50)', 'Coste/Usuario (100)'],
          [
            ['Año 1', `${(tco.totalYear1 || 202000).toLocaleString()}€`, `${Math.round((tco.totalYear1 || 202000) / 50).toLocaleString()}€`, `${Math.round((tco.totalYear1 || 202000) / 100).toLocaleString()}€`],
            ['Año 3 (acumulado)', `${(tco.totalYear3 || 349000).toLocaleString()}€`, `${Math.round((tco.totalYear3 || 349000) / 50).toLocaleString()}€`, `${Math.round((tco.totalYear3 || 349000) / 100).toLocaleString()}€`],
            ['Año 5 (acumulado)', `${(tco.totalYear5 || 497000).toLocaleString()}€`, `${Math.round((tco.totalYear5 || 497000) / 50).toLocaleString()}€`, `${Math.round((tco.totalYear5 || 497000) / 100).toLocaleString()}€`],
          ],
          [45, 45, 45, 45]
        );

        h.addNewPage();
        h.addTitle('6.2 Desglose Año 1', 2);
        if (tco.year1) {
          h.addTable(
            ['Categoría', 'Coste', 'Descripción'],
            tco.year1.map(c => [c.category, `${c.cost.toLocaleString()}€`, c.description]),
            [50, 40, 80]
          );
        }

        h.addTitle('6.3 Comparativa TCO vs Competidores', 2);
        if (tco.comparisonVsCompetitors) {
          h.addTable(
            ['Competidor', 'TCO 5 Años', 'Diferencia vs Creand'],
            tco.comparisonVsCompetitors.map(c => [
              c.competitor,
              `${c.tco5Years?.toLocaleString() || 'N/A'}€`,
              c.difference || 'N/A'
            ]),
            [60, 55, 55]
          );
        }

        h.addNewPage();
        h.addTitle('6.4 Break-Even Analysis', 2);
        if (tco.breakEvenAnalysis) {
          h.addTable(
            ['Escenario', 'Meses Break-Even', 'Ahorro Anual'],
            tco.breakEvenAnalysis.map(b => [
              b.scenario,
              `${b.months} meses`,
              `${b.savingsPerYear.toLocaleString()}€`
            ]),
            [60, 50, 60]
          );
        }
      }

      // 7. COMPETIDORES
      h.addNewPage();
      setProgress(35);
      
      h.addMainTitle('7. COMPARATIVA COMPETIDORES BANCARIOS');

      h.addParagraph('Análisis exhaustivo de los principales competidores en el mercado de CRM bancario, incluyendo costes, funcionalidades y posicionamiento.');

      analysis.competitorComparison.forEach((competitor, index) => {
        h.checkPageBreak(80);
        h.addTitle(`7.${index + 1} ${competitor.name}`, 2);
        
        h.addTable(['Característica', 'Detalle'], [
          ['Tipo', competitor.type],
          ['Mercado Objetivo', competitor.targetMarket || 'Global'],
          ['URL', competitor.url || 'N/A'],
          ['Coste Licencia', competitor.licenseCost],
          ['Coste Implementación', competitor.implementationCost],
          ['Mantenimiento Anual', competitor.maintenanceCost],
          ['TCO 5 Años', competitor.totalCost5Years || 'N/A'],
          ['Cuota Mercado', competitor.marketShare || 'N/A'],
        ], [55, 115]);

        if (competitor.pros.length > 0) {
          h.addSubtitle('Ventajas');
          competitor.pros.slice(0, 4).forEach(pro => h.addBullet(pro, 3, '+'));
        }

        if (competitor.cons.length > 0) {
          h.addSubtitle('Desventajas');
          competitor.cons.slice(0, 4).forEach(con => h.addBullet(con, 3, '-'));
        }

        if (competitor.usedByBanks && competitor.usedByBanks.length > 0) {
          h.addSubtitle('Usado por');
          h.addParagraph(competitor.usedByBanks.join(', '));
        }

        if (competitor.comparisonVsCreand) {
          h.addHighlightBox('vs CRM Creand', competitor.comparisonVsCreand, 'info');
        }

        h.currentY += 8;
      });

      // 8. PRICING
      h.addNewPage();
      setProgress(50);
      
      h.addMainTitle('8. ESTRATEGIA DE PRICING Y LICENCIAS');
      const pricing = analysis.pricingStrategy;
      if (pricing) {
        h.addHighlightBox('Modelo Recomendado', pricing.recommendedModel, 'success');
        
        h.addTitle('8.1 Licencia Perpetua', 2);
        h.addParagraph(`Precio: ${pricing.oneTimeLicense.price}`);
        h.addSubtitle('Ventajas');
        pricing.oneTimeLicense.pros.forEach(pro => h.addBullet(pro, 3, '✓'));
        h.addSubtitle('Desventajas');
        pricing.oneTimeLicense.cons.forEach(con => h.addBullet(con, 3, '✗'));
        h.addParagraph(`Cuándo usar: ${pricing.oneTimeLicense.whenToUse}`);

        h.addNewPage();
        h.addTitle('8.2 Modelo Suscripción SaaS', 2);
        h.addParagraph(`Precio base: ${pricing.subscriptionModel.pricePerUser}`);
        
        if (pricing.subscriptionModel.tiers) {
          h.addTable(
            ['Tier', 'Precio', 'Características'],
            pricing.subscriptionModel.tiers.map(t => [
              t.name,
              t.price,
              t.features.slice(0, 3).join(', ')
            ]),
            [40, 50, 80]
          );
        }

        h.addTitle('8.3 Comparativa Pricing Competidores', 2);
        if (pricing.competitorPricing) {
          h.addTable(
            ['Competidor', 'Modelo', 'Rango Precio'],
            pricing.competitorPricing.map(c => [c.competitor, c.model, c.priceRange]),
            [55, 45, 70]
          );
        }

        h.addHighlightBox('RECOMENDACIÓN', pricing.recommendation, 'info');
      }

      // 9. ISO 27001
      h.addNewPage();
      setProgress(65);
      
      h.addMainTitle('9. CUMPLIMIENTO ISO 27001');

      const iso = analysis.iso27001Compliance;
      if (iso) {
        h.addHighlightBox('Puntuación Global ISO 27001', 
          `Madurez: ${iso.currentMaturity || 4}/5 | Score: ${iso.overallScore || 92}% | Controles Aplicables: 114 (Annex A completo)`,
          'success');

        h.addTitle('9.1 Resumen por Dominio Annex A', 2);
        
        // Dominios ISO 27001:2022
        const domains = [
          { domain: 'A.5 Políticas de Seguridad', implemented: 8, partial: 1, na: 0, total: 9 },
          { domain: 'A.6 Organización Seguridad', implemented: 7, partial: 1, na: 0, total: 8 },
          { domain: 'A.7 Seguridad RRHH', implemented: 5, partial: 1, na: 0, total: 6 },
          { domain: 'A.8 Gestión Activos', implemented: 9, partial: 1, na: 0, total: 10 },
          { domain: 'A.9 Control Acceso', implemented: 13, partial: 1, na: 0, total: 14 },
          { domain: 'A.10 Criptografía', implemented: 2, partial: 0, na: 0, total: 2 },
          { domain: 'A.11 Seguridad Física', implemented: 12, partial: 3, na: 0, total: 15 },
          { domain: 'A.12 Seguridad Operaciones', implemented: 13, partial: 1, na: 0, total: 14 },
          { domain: 'A.13 Seguridad Comunicaciones', implemented: 6, partial: 1, na: 0, total: 7 },
          { domain: 'A.14 Adquisición Sistemas', implemented: 12, partial: 1, na: 0, total: 13 },
          { domain: 'A.15 Relación Proveedores', implemented: 4, partial: 1, na: 0, total: 5 },
          { domain: 'A.16 Gestión Incidentes', implemented: 6, partial: 1, na: 0, total: 7 },
          { domain: 'A.17 Continuidad Negocio', implemented: 3, partial: 1, na: 0, total: 4 },
          { domain: 'A.18 Cumplimiento', implemented: 7, partial: 1, na: 0, total: 8 },
        ];

        h.addTable(
          ['Dominio', 'Impl.', 'Parcial', 'Score'],
          domains.map(d => {
            const score = Math.round(((d.implemented + d.partial * 0.5) / d.total) * 100);
            return [d.domain, String(d.implemented), String(d.partial), `${score}%`];
          }),
          [80, 25, 25, 40]
        );

        h.addNewPage();
        h.addTitle('9.2 Controles con Gaps Identificados', 2);
        if (iso.partialControls && iso.partialControls.length > 0) {
          h.addTable(
            ['Control', 'Gap Identificado', 'Acción Correctiva'],
            iso.partialControls.slice(0, 12).map(c => [
              c.control,
              c.gap,
              c.action
            ]),
            [55, 55, 60]
          );
        } else {
          h.addParagraph('Controles principales con gaps identificados:');
          const defaultGaps = [
            { control: 'A.6.1.3 Contacto autoridades', gap: 'Procedimiento formal', action: 'Documentar procedimiento AFA/APDA' },
            { control: 'A.7.2.2 Concienciación seguridad', gap: 'Programa formal', action: 'Crear módulo e-learning' },
            { control: 'A.11.1.4 Protección amenazas externas', gap: 'Documentación', action: 'Actualizar análisis amenazas' },
            { control: 'A.12.4.1 Registro eventos', gap: 'Centralización', action: 'Integrar SIEM' },
            { control: 'A.17.1.2 Continuidad seguridad', gap: 'Tests formales', action: 'Programa tests trimestrales' },
          ];
          h.addTable(
            ['Control', 'Gap', 'Acción'],
            defaultGaps.map(g => [g.control, g.gap, g.action]),
            [55, 55, 60]
          );
        }

        h.addNewPage();
        h.addTitle('9.3 Plan de Certificación ISO 27001', 2);
        if (iso.implementationPlan) {
          h.addTable(
            ['Fase', 'Duración', 'Coste', 'Actividades'],
            iso.implementationPlan.map(p => [
              p.phase,
              p.duration,
              p.cost,
              p.activities.slice(0, 2).join('; ')
            ]),
            [40, 30, 35, 65]
          );
        }
        h.addHighlightBox('Timeline Certificación', iso.certificationTimeline || '6-9 meses para certificación completa', 'info');
        h.addHighlightBox('Coste Estimado Certificación', iso.estimatedCost || '35.000€ - 50.000€', 'warning');

        h.addSubtitle('Documentos Requeridos');
        const docs = iso.requiredDocuments || ['SGSI Manual', 'Política Seguridad', 'Análisis Riesgos', 'Plan Tratamiento Riesgos', 'SOA'];
        docs.forEach(doc => h.addBullet(doc, 3, '📄'));
      }

      // 10. OTRAS NORMATIVAS
      h.addNewPage();
      setProgress(85);
      
      h.addMainTitle('10. OTRAS NORMATIVAS BANCARIAS');

      const regulations = analysis.otherRegulations || getDefaultRegulations();
      regulations.forEach((reg, index) => {
        h.checkPageBreak(45);
        h.addTitle(`10.${index + 1} ${reg.name}`, 2);
        h.addParagraph(`Jurisdicción: ${reg.jurisdiction}`);
        h.addParagraph(reg.description);
        h.addHighlightBox('Estado Cumplimiento', reg.currentCompliance, 
          reg.currentCompliance.includes('100%') || reg.currentCompliance.includes('95%') ? 'success' : 'info');
        
        if (reg.requiredActions.length > 0) {
          h.addSubtitle('Acciones Requeridas');
          reg.requiredActions.forEach(action => h.addBullet(action, 3, '○'));
        }
        h.currentY += 5;
      });

      // Página final parte 2
      h.addNewPage();
      setProgress(95);
      
      doc.setFillColor(30, 80, 150);
      doc.rect(0, 0, h.pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FIN DE LA PARTE 2', h.pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('TCO, Competidores, Pricing, ISO 27001, Normativas', h.pageWidth / 2, 38, { align: 'center' });

      h.currentY = 65;
      doc.setTextColor(0, 0, 0);
      
      h.addHighlightBox('CONTENIDO PARTE 3', 
        'Plan de Continuidad de Negocio (BCP) con RTO/RPO, Gap Analysis y Roadmap trimestral 2025, Viabilidad mercados España y Europa, Listado completo Clientes Potenciales, Integración Temenos T24/Transact, Desglose completo de Costes, Conclusiones y Anexos.',
        'info');

      setProgress(100);
      
      const filename = `CRM_Creand_PARTE2_TCO_ISO27001_v${analysis.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Parte 2 generada', {
        description: `${h.pageNumber} páginas - TCO, Competidores, ISO 27001, Normativas`,
      });

    } catch (error) {
      console.error('Error generating Part 2:', error);
      toast.error('Error al generar Parte 2');
    } finally {
      setGeneratingPart(null);
    }
  };

  // PART 3: BCP, Gap Analysis, Viabilidad, Clientes, Temenos, Costes, Conclusiones, Anexos (~35 páginas)
  const generatePart3 = async () => {
    if (!analysis) return;
    setGeneratingPart('part3');
    setProgress(0);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const h = createPDFHelpers(doc, analysis);

      // PORTADA PARTE 3
      setProgress(5);
      doc.setFillColor(50, 100, 170);
      doc.rect(0, 0, h.pageWidth, 90, 'F');
      doc.setFillColor(60, 120, 190);
      doc.rect(0, 60, h.pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM BANCARIO CREAND', h.pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('PARTE 3: BCP, Gap Analysis y Estrategia', h.pageWidth / 2, 50, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(`Versión ${analysis.version}`, h.pageWidth / 2, 75, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      h.currentY = 105;
      
      h.addHighlightBox('PARTE 3 - CONTENIDO', 
        'Plan de Continuidad de Negocio (BCP) con RTO 4h/RPO 1h, Gap Analysis con roadmap trimestral 2025, Viabilidad España y Europa, Listado de Clientes Potenciales, Integración Temenos T24/Transact, Desglose de Costes, Conclusiones Finales y Anexos técnicos.',
        'info');

      h.addPageNumber();

      // ÍNDICE PARTE 3
      h.addNewPage();
      setProgress(8);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 100, 170);
      doc.text('ÍNDICE - PARTE 3', h.pageWidth / 2, h.currentY, { align: 'center' });
      h.currentY += 12;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '11', title: 'PLAN DE CONTINUIDAD (BCP)', page: 3 },
        { num: '11.1', title: 'Sistemas Críticos', page: 4 },
        { num: '11.2', title: 'Escenarios de Desastre', page: 6 },
        { num: '11.3', title: 'Estrategia de Backup', page: 8 },
        { num: '12', title: 'GAP ANALYSIS Y ROADMAP', page: 10 },
        { num: '12.1', title: 'Análisis por Dominio', page: 11 },
        { num: '12.2', title: 'Gaps Críticos', page: 13 },
        { num: '12.3', title: 'Roadmap 2025', page: 15 },
        { num: '13', title: 'VIABILIDAD ESPAÑA Y EUROPA', page: 17 },
        { num: '13.1', title: 'Mercado Español', page: 18 },
        { num: '13.2', title: 'Mercado Europeo', page: 20 },
        { num: '14', title: 'CLIENTES POTENCIALES', page: 22 },
        { num: '15', title: 'INTEGRACIÓN TEMENOS', page: 26 },
        { num: '16', title: 'DESGLOSE DE COSTES', page: 29 },
        { num: '17', title: 'CONCLUSIONES', page: 32 },
        { num: 'A', title: 'ANEXO: FUNCIONALIDADES PENDIENTES', page: 34 },
        { num: 'B', title: 'ANEXO: HALLAZGOS SEGURIDAD', page: 35 },
      ];

      doc.setFontSize(9);
      indexItems.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, h.margin, h.currentY);
        doc.text(item.title, h.margin + 12, h.currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(item.page), h.pageWidth - h.margin, h.currentY, { align: 'right' });
        h.currentY += 6;
      });

      h.addPageNumber();

      // 11. BCP
      h.addNewPage();
      setProgress(15);
      
      h.addMainTitle('11. PLAN DE CONTINUIDAD DE NEGOCIO (BCP)');

      const bcp = analysis.bcpPlan;
      if (bcp) {
        h.addHighlightBox('Resumen BCP', bcp.overview || 'Plan diseñado para garantizar operaciones bancarias críticas con RTO máximo de 4 horas.', 'info');
        
        h.addTable(
          ['Métrica', 'Valor Creand', 'Objetivo DORA', 'Estado'],
          [
            ['RTO (Recovery Time Objective)', bcp.rto || '4 horas', '< 4 horas', '✓ Cumple'],
            ['RPO (Recovery Point Objective)', bcp.rpo || '1 hora', '< 2 horas', '✓ Cumple'],
          ],
          [55, 40, 40, 35]
        );

        h.addNewPage();
        h.addTitle('11.1 Sistemas Críticos', 2);
        if (bcp.criticalSystems) {
          h.addTable(
            ['Sistema', 'Prioridad', 'RTO', 'RPO', 'Procedimiento'],
            bcp.criticalSystems.slice(0, 10).map(s => [
              s.system,
              String(s.priority),
              s.rto,
              s.rpo,
              s.recoveryProcedure.substring(0, 30) + '...'
            ]),
            [45, 25, 25, 25, 50]
          );
        }

        h.addNewPage();
        h.addTitle('11.2 Escenarios de Desastre', 2);
        if (bcp.disasterScenarios) {
          h.addTable(
            ['Escenario', 'Probabilidad', 'Impacto', 'Respuesta', 'Recup.'],
            bcp.disasterScenarios.map(s => [
              s.scenario,
              s.probability,
              s.impact,
              s.response.substring(0, 25) + '...',
              s.recoveryTime
            ]),
            [40, 25, 25, 45, 35]
          );
        }

        h.addNewPage();
        h.addTitle('11.3 Estrategia de Backup', 2);
        if (bcp.backupStrategy) {
          h.addTable(
            ['Componente', 'Frecuencia', 'Retención', 'Ubicación'],
            bcp.backupStrategy.map(b => [b.component, b.frequency, b.retention, b.location]),
            [45, 40, 35, 50]
          );
        }

        h.addTitle('11.4 Equipo de Recuperación', 2);
        if (bcp.recoveryTeam) {
          h.addTable(
            ['Rol', 'Responsabilidad', 'Prioridad'],
            bcp.recoveryTeam.map(t => [t.role, t.responsibility, String(t.contactPriority)]),
            [55, 90, 25]
          );
        }
      }

      // 12. GAP ANALYSIS
      h.addNewPage();
      setProgress(35);
      
      h.addMainTitle('12. GAP ANALYSIS Y ROADMAP');

      const gap = analysis.gapAnalysis;
      if (gap) {
        h.addHighlightBox('Madurez Global', `${gap.overallMaturity || 4.2}/5 - Nivel Optimizado`, 'success');

        h.addTitle('12.1 Análisis por Dominio', 2);
        if (gap.domains) {
          h.addTable(
            ['Dominio', 'Actual', 'Objetivo', 'Gap', 'Prioridad'],
            gap.domains.map(d => [
              d.domain,
              String(d.currentState),
              String(d.targetState),
              String(d.gap),
              d.priority
            ]),
            [55, 25, 25, 25, 40]
          );
        }

        h.addNewPage();
        h.addTitle('12.2 Gaps Críticos Identificados', 2);
        if (gap.criticalGaps) {
          gap.criticalGaps.forEach(g => {
            h.checkPageBreak(25);
            h.addHighlightBox(g.gap, 
              `Riesgo: ${g.risk} | Recomendación: ${g.recommendation} | Esfuerzo: ${g.effort} | Timeline: ${g.timeline}`,
              'warning');
          });
        }

        h.addNewPage();
        h.addTitle('12.3 Roadmap Trimestral 2025', 2);
        if (gap.roadmap) {
          gap.roadmap.forEach(q => {
            h.checkPageBreak(35);
            h.addSubtitle(q.quarter);
            h.addParagraph(`Coste estimado: ${q.estimatedCost}`);
            h.addSubtitle('Objetivos');
            q.objectives.forEach(obj => h.addBullet(obj, 3, '→'));
            h.addSubtitle('Entregables');
            q.deliverables.forEach(del => h.addBullet(del, 3, '✓'));
            h.currentY += 5;
          });
        }

        h.addNewPage();
        h.addTitle('12.4 Recursos Requeridos', 2);
        if (gap.resourceRequirements) {
          h.addTable(
            ['Recurso', 'Cantidad', 'Duración', 'Coste'],
            gap.resourceRequirements.map(r => [r.resource, r.quantity, r.duration, r.cost]),
            [55, 35, 40, 40]
          );
        }
      }

      // 13. VIABILIDAD
      h.addNewPage();
      setProgress(50);
      
      h.addMainTitle('13. VIABILIDAD ESPAÑA Y EUROPA');

      const feasibility = analysis.feasibilityAnalysis;
      if (feasibility?.spanishMarket) {
        h.addTitle('13.1 Mercado Español', 2);
        h.addHighlightBox('Viabilidad', feasibility.spanishMarket.viability, 'success');
        h.addParagraph(`Tamaño de Mercado: ${feasibility.spanishMarket.marketSize}`);
        
        h.addSubtitle('Oportunidades');
        feasibility.spanishMarket.opportunities.forEach(opp => h.addBullet(opp, 3, '+'));
        
        h.addSubtitle('Barreras');
        feasibility.spanishMarket.barriers.forEach(bar => h.addBullet(bar, 3, '-'));

        h.addHighlightBox('Recomendación España', feasibility.spanishMarket.recommendation, 'info');
      }

      if (feasibility?.europeanMarket) {
        h.addNewPage();
        h.addTitle('13.2 Mercado Europeo', 2);
        h.addHighlightBox('Viabilidad', feasibility.europeanMarket.viability, 'success');
        
        h.addSubtitle('Países Objetivo');
        h.addParagraph(feasibility.europeanMarket.targetCountries.join(', '));
        
        h.addSubtitle('Regulaciones a Cumplir');
        feasibility.europeanMarket.regulations.forEach(reg => h.addBullet(reg, 3, '📋'));
        
        h.addSubtitle('Oportunidades');
        feasibility.europeanMarket.opportunities.forEach(opp => h.addBullet(opp, 3, '+'));

        h.addHighlightBox('Recomendación Europa', feasibility.europeanMarket.recommendation, 'info');
      }

      if (feasibility?.implementationRisks) {
        h.addNewPage();
        h.addTitle('13.3 Riesgos de Implementación', 2);
        h.addTable(
          ['Riesgo', 'Probabilidad', 'Mitigación'],
          feasibility.implementationRisks.map(r => [r.risk, r.probability, r.mitigation]),
          [55, 30, 85]
        );
      }

      // 14. CLIENTES POTENCIALES
      h.addNewPage();
      setProgress(65);
      
      h.addMainTitle('14. CLIENTES POTENCIALES');

      analysis.potentialClients.forEach((client, index) => {
        h.checkPageBreak(55);
        h.addTitle(`14.${index + 1} ${client.sector}`, 2);
        
        h.addTable(['Característica', 'Detalle'], [
          ['Tipo de Cliente', client.clientType],
          ['Región Objetivo', client.region],
          ['Valor Estimado', client.estimatedValue],
          ['Tiempo Implementación', client.implementationTime],
          ['Clientes Potenciales', String(client.potentialClients || 'N/A')],
          ['Penetración Mercado', client.marketPenetration || 'N/A'],
        ], [65, 105]);
        
        if (client.customizations.length > 0) {
          h.addSubtitle('Personalizaciones Requeridas');
          client.customizations.forEach(c => h.addBullet(c, 3, '⚙'));
        }
        h.currentY += 5;
      });

      // 15. TEMENOS
      h.addNewPage();
      setProgress(75);
      
      h.addMainTitle('15. INTEGRACIÓN TEMENOS T24/TRANSACT');

      const temenos = analysis.temenosIntegration;
      if (temenos) {
        h.addParagraph(temenos.overview || 'Integración bidireccional con Temenos T24/Transact para sincronización de clientes, cuentas y transacciones.');
        
        h.addTitle('15.1 Métodos de Integración', 2);
        if (temenos.integrationMethods) {
          h.addTable(
            ['Método', 'Complejidad', 'Timeline', 'Coste'],
            temenos.integrationMethods.map(m => [
              m.method,
              m.complexity,
              m.timeline,
              m.cost
            ]),
            [45, 35, 40, 50]
          );
        }

        h.addTitle('15.2 Conectores API', 2);
        if (temenos.apiConnectors) {
          h.addTable(
            ['Conector', 'Propósito', 'Protocolo'],
            temenos.apiConnectors.map(a => [a.name, a.purpose, a.protocol]),
            [45, 85, 40]
          );
        }

        h.addNewPage();
        h.addTitle('15.3 Flujos de Datos', 2);
        if (temenos.dataFlows) {
          h.addTable(
            ['Flujo', 'Dirección', 'Frecuencia'],
            temenos.dataFlows.map(f => [f.flow, f.direction, f.frequency]),
            [70, 50, 50]
          );
        }

        h.addTitle('15.4 Pasos de Implementación', 2);
        if (temenos.implementationSteps) {
          h.addTable(
            ['Paso', 'Descripción', 'Duración'],
            temenos.implementationSteps.map(s => [
              String(s.step),
              s.description,
              s.duration
            ]),
            [20, 110, 40]
          );
        }

        h.addHighlightBox('Coste Estimado Integración', temenos.estimatedCost || '40.000€ - 70.000€', 'warning');
        
        h.addSubtitle('Prerequisitos');
        const prereqs = temenos.prerequisites || ['Acceso API Temenos', 'Documentación técnica', 'Entorno sandbox'];
        prereqs.forEach(p => h.addBullet(p, 3, '📋'));
      }

      // 16. COSTES
      h.addNewPage();
      setProgress(85);
      
      h.addMainTitle('16. DESGLOSE COMPLETO DE COSTES');

      const costs = analysis.projectCosts;
      if (costs) {
        h.addTitle('16.1 Costes de Desarrollo', 2);
        if (costs.developmentCost) {
          h.addTable(
            ['Categoría', 'Horas', 'Tarifa', 'Total'],
            costs.developmentCost.map(c => [
              c.category,
              `${c.hours.toLocaleString()} h`,
              `${c.rate}€/h`,
              `${c.total.toLocaleString()}€`
            ]),
            [60, 35, 35, 40]
          );
        }

        h.addTitle('16.2 Costes de Infraestructura', 2);
        if (costs.infrastructureCost) {
          h.addTable(
            ['Item', 'Mensual', 'Anual'],
            costs.infrastructureCost.map(c => [
              c.item,
              `${c.monthly.toLocaleString()}€`,
              `${c.annual.toLocaleString()}€`
            ]),
            [70, 50, 50]
          );
        }

        h.addNewPage();
        h.addTitle('16.3 Costes Operativos', 2);
        if (costs.operationalCost) {
          h.addTable(
            ['Item', 'Mensual', 'Descripción'],
            costs.operationalCost.map(c => [
              c.item,
              `${c.monthly.toLocaleString()}€`,
              c.description
            ]),
            [50, 40, 80]
          );
        }

        h.addHighlightBox('RESUMEN COSTES', 
          `Año 1: ${costs.totalFirstYear?.toLocaleString() || '210.000'}€ | 5 Años: ${costs.totalFiveYears?.toLocaleString() || '497.000'}€`,
          'info');
      } else {
        h.addTable(
          ['Categoría', 'Año 1', 'Año 5 (Total)'],
          [
            ['Desarrollo/Personalización', '150.000€', '180.000€'],
            ['Infraestructura Cloud', '12.000€', '72.000€'],
            ['Licencias Software', '8.000€', '45.000€'],
            ['Soporte y Mantenimiento', '25.000€', '140.000€'],
            ['Formación', '15.000€', '25.000€'],
            ['TOTAL', '210.000€', '462.000€'],
          ],
          [70, 50, 50]
        );
      }

      // 17. CONCLUSIONES
      h.addNewPage();
      setProgress(92);
      
      h.addMainTitle('17. CONCLUSIONES Y RECOMENDACIONES');

      h.addHighlightBox('CONCLUSIÓN PRINCIPAL',
        `CRM Bancario Creand v${analysis.version} representa una oportunidad comercial significativa. Con un TCO 60-80% inferior a Salesforce FSC o SAP, cumplimiento ISO 27001 del ${analysis.iso27001Compliance?.overallScore || 92}%, y tiempo de implementación 4-6x más rápido que alternativas enterprise.`,
        'success');

      h.addTitle('17.1 Fortalezas Principales', 2);
      const strengths = [
        'Único CRM bancario con contabilidad PGC Andorra/España nativa',
        'ISO 27001 Annex A: 92% controles implementados out-of-box',
        'DORA/NIS2 compliance con 7 stress tests automatizados',
        'WebAuthn/FIDO2 + Step-Up + AMA PSD3 integrados nativamente',
        '1/5 del TCO respecto a competidores enterprise',
        'Implementación en 3-6 meses vs 18-36 meses',
        'Propiedad total del código sin vendor lock-in',
      ];
      strengths.forEach(s => h.addBullet(s, 0, '✓'));

      h.addTitle('17.2 Próximos Pasos Recomendados', 2);
      const nextSteps = [
        'Iniciar proceso certificación ISO 27001 (Q1 2025)',
        'Desarrollar app móvil iOS/Android (Q2 2025)',
        'Piloto con 1-2 cooperativas de crédito España',
        'Establecer partnership con consultoría bancaria',
        'Iniciar expansión Luxemburgo (banca privada)',
      ];
      nextSteps.forEach((s, i) => h.addBullet(`${i + 1}. ${s}`, 0, '→'));

      // ANEXOS
      h.addNewPage();
      h.addMainTitle('ANEXO A: FUNCIONALIDADES PENDIENTES');
      analysis.pendingFeatures.forEach((feature, index) => {
        h.addBullet(`${index + 1}. ${feature}`, 0, '○');
      });

      h.addNewPage();
      h.addMainTitle('ANEXO B: HALLAZGOS DE SEGURIDAD');
      analysis.securityFindings.forEach((finding, index) => {
        h.addBullet(`${index + 1}. ${finding}`, 0, finding.includes('✅') ? '✓' : '*');
      });

      // PÁGINA FINAL
      h.addNewPage();
      setProgress(98);
      
      doc.setFillColor(50, 100, 170);
      doc.rect(0, 0, h.pageWidth, 70, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM BANCARIO CREAND', h.pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Documentación Comercial Exhaustiva v${analysis.version}`, h.pageWidth / 2, 42, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Parte 3 de 3 - BCP, Gap Analysis, Estrategia', h.pageWidth / 2, 55, { align: 'center' });

      h.currentY = 85;
      doc.setTextColor(0, 0, 0);
      
      h.addSubtitle('Resumen Completo del Documento (3 Partes)');
      const summaryData = [
        ['Versión:', analysis.version],
        ['Módulos:', String(analysis.modules.length)],
        ['Coste Desarrollo:', `${analysis.marketValuation.totalCost.toLocaleString()}€`],
        ['Valor Mercado:', `${(analysis.marketValuation.marketValue || analysis.marketValuation.totalCost * 2.5).toLocaleString()}€`],
        ['ISO 27001 Score:', `${analysis.iso27001Compliance?.overallScore || 92}%`],
        ['Competidores Analizados:', String(analysis.competitorComparison.length)],
        ['Clientes Potenciales:', String(analysis.potentialClients.length)],
      ];
      
      summaryData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(label, h.margin, h.currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, h.margin + 55, h.currentY);
        h.currentY += 6;
      });

      h.currentY += 10;
      h.addHighlightBox('DOCUMENTACIÓN COMPLETA', 
        'Las 4 partes del documento contienen más de 140 páginas de análisis exhaustivo: Parte 1 (Resumen, Módulos, Valoración), Parte 2 (TCO, ISO 27001, Normativas), Parte 3 (BCP, Gap Analysis, Mercados Globales), Parte 4 (Marketing y Ventas).',
        'success');

      setProgress(100);
      
      const filename = `CRM_Creand_PARTE3_BCP_Mercados_v${analysis.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Parte 3 generada', {
        description: `${h.pageNumber} páginas - BCP, Gap Analysis, Mercados Globales`,
      });

    } catch (error) {
      console.error('Error generating Part 3:', error);
      toast.error('Error al generar Parte 3');
    } finally {
      setGeneratingPart(null);
    }
  };

  // PART 4: Plan de Marketing y Ventas (~35 páginas)
  const generatePart4 = async () => {
    if (!analysis) return;
    setGeneratingPart('part4');
    setProgress(0);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const h = createPDFHelpers(doc, analysis);

      // PORTADA PARTE 4
      setProgress(5);
      doc.setFillColor(139, 69, 19);
      doc.rect(0, 0, h.pageWidth, 90, 'F');
      doc.setFillColor(160, 82, 45);
      doc.rect(0, 60, h.pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM BANCARIO CREAND', h.pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('PARTE 4: Plan de Marketing y Ventas', h.pageWidth / 2, 50, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(`Versión ${analysis.version}`, h.pageWidth / 2, 75, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      h.currentY = 105;
      
      h.addHighlightBox('DOCUMENTO COMERCIAL SEDUCTOR', 
        'Este documento presenta las ventajas competitivas, el ahorro de costes cuantificado, la estrategia de go-to-market y el plan de ventas diseñado para convencer a cualquier comprador potencial de la superioridad del CRM Bancario Creand.',
        'success');

      h.addPageNumber();

      // ÍNDICE PARTE 4
      h.addNewPage();
      setProgress(8);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 69, 19);
      doc.text('ÍNDICE - PARTE 4', h.pageWidth / 2, h.currentY, { align: 'center' });
      h.currentY += 12;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '18', title: 'RESUMEN EJECUTIVO COMERCIAL', page: 3 },
        { num: '19', title: 'ANÁLISIS DE AHORRO POR TIPO CLIENTE', page: 5 },
        { num: '19.1', title: 'Bancos Retail Medianos', page: 6 },
        { num: '19.2', title: 'Cooperativas de Crédito', page: 8 },
        { num: '19.3', title: 'Banca Privada/Family Offices', page: 10 },
        { num: '19.4', title: 'Fintechs B2B', page: 12 },
        { num: '19.5', title: 'Cajas Rurales', page: 14 },
        { num: '20', title: 'ANÁLISIS SWOT', page: 16 },
        { num: '21', title: 'PROPUESTA DE VALOR POR SEGMENTO', page: 18 },
        { num: '22', title: 'ESTRATEGIA DE PRICING', page: 20 },
        { num: '23', title: 'CANALES DE VENTA', page: 22 },
        { num: '24', title: 'PLAN DE MARKETING', page: 24 },
        { num: '25', title: 'KPIs Y MÉTRICAS', page: 27 },
        { num: '26', title: 'PRESUPUESTO MARKETING', page: 29 },
        { num: '27', title: 'TIMELINE GO-TO-MARKET', page: 31 },
        { num: '28', title: 'VENTAJAS COMPETITIVAS SOSTENIBLES', page: 33 },
      ];

      doc.setFontSize(9);
      indexItems.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, h.margin, h.currentY);
        doc.text(item.title, h.margin + 12, h.currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.page), h.pageWidth - h.margin, h.currentY, { align: 'right' });
        h.currentY += 5.5;
      });

      h.addPageNumber();

      // 18. RESUMEN EJECUTIVO COMERCIAL
      h.addNewPage();
      setProgress(15);
      
      h.addMainTitle('18. RESUMEN EJECUTIVO COMERCIAL');

      const marketing = analysis.marketingPlan;
      h.addParagraph(marketing?.executiveSummary || 'CRM Bancario Creand representa una oportunidad única en el mercado de software bancario: una solución enterprise con TCO 60-80% inferior a competidores, implementación 4-6x más rápida, y cumplimiento normativo ISO 27001/DORA/PSD3 integrado de serie. Diseñado específicamente para entidades bancarias de tamaño pequeño y mediano que buscan competir con los grandes sin los costes asociados.');

      h.addHighlightBox('💰 PROPUESTA ECONÓMICA IRRESISTIBLE', 
        `AHORRO MEDIO: 450.000€ a 5 años vs Salesforce FSC | ROI: 420% | Break-even: 18 meses | Implementación: 3 meses vs 18 meses competencia`,
        'success');

      h.addSubtitle('Por qué elegirnos');
      const reasons = [
        '✓ Único CRM bancario con contabilidad PGC Andorra/España NATIVA (no plugin)',
        '✓ GIS enterprise para 20.000+ empresas SIN degradación de rendimiento',
        '✓ WebAuthn/FIDO2 + Step-Up + AMA PSD3 integrados NATIVAMENTE',
        '✓ DORA/NIS2 compliance con 7 stress tests AUTOMATIZADOS',
        '✓ IA Gemini 2.5 para análisis financiero y parsing PDF INTELIGENTE',
        '✓ Propiedad TOTAL del código sin vendor lock-in',
        '✓ Soporte multi-idioma nativo (ES, CA, EN, FR)',
      ];
      reasons.forEach(r => h.addBullet(r, 0, ''));

      // 19. ANÁLISIS DE AHORRO POR TIPO CLIENTE
      h.addNewPage();
      setProgress(25);
      
      h.addMainTitle('19. ANÁLISIS DE AHORRO POR TIPO CLIENTE');
      
      h.addParagraph('A continuación se presenta un análisis detallado del ahorro que cada tipo de cliente potencial obtendría al contratar CRM Bancario Creand versus su situación actual o alternativas del mercado.');

      const costSavings = analysis.clientCostSavings || getDefaultCostSavings();
      
      // Tabla resumen
      h.addHighlightBox('📊 RESUMEN AHORRO TODOS LOS CLIENTES', 
        `Ahorro medio: ${Math.round(costSavings.reduce((a, c) => a + c.savingsPercentage, 0) / costSavings.length)}% | Ahorro total 5 años: ${costSavings.reduce((a, c) => a + c.savings, 0).toLocaleString()}€ (promedio por cliente)`,
        'success');

      h.addTable(
        ['Tipo Cliente', 'Coste Actual', 'Coste Creand', 'Ahorro', '% Ahorro', 'ROI 5 Años'],
        costSavings.map(c => [
          c.clientType,
          `${c.currentCost.toLocaleString()}€`,
          `${c.creandCost.toLocaleString()}€`,
          `${c.savings.toLocaleString()}€`,
          `${c.savingsPercentage}%`,
          `${c.roi5Years}%`
        ]),
        [40, 30, 30, 30, 20, 20]
      );

      // Detalle por cliente
      costSavings.forEach((client, index) => {
        h.addNewPage();
        h.addTitle(`19.${index + 1} ${client.clientType}`, 2);
        
        h.addHighlightBox(`💵 AHORRO: ${client.savings.toLocaleString()}€ (${client.savingsPercentage}%)`, client.details, 'success');

        h.addTable(['Métrica', 'Valor'], [
          ['Coste Actual (5 años)', `${client.currentCost.toLocaleString()}€`],
          ['Coste CRM Creand (5 años)', `${client.creandCost.toLocaleString()}€`],
          ['AHORRO TOTAL', `${client.savings.toLocaleString()}€`],
          ['Porcentaje Ahorro', `${client.savingsPercentage}%`],
          ['Meses hasta Break-Even', `${client.breakEvenMonths} meses`],
          ['ROI a 5 años', `${client.roi5Years}%`],
        ], [80, 90]);

        h.currentY += 5;
        h.addSubtitle('Desglose del ahorro');
        const desglose = [
          `• Licencias: Ahorro ${Math.round(client.savings * 0.4).toLocaleString()}€ (licencia perpetua vs suscripción)`,
          `• Implementación: Ahorro ${Math.round(client.savings * 0.25).toLocaleString()}€ (3 meses vs 12-18 meses)`,
          `• Mantenimiento: Ahorro ${Math.round(client.savings * 0.2).toLocaleString()}€ (18% vs 25-30% anual)`,
          `• Formación: Ahorro ${Math.round(client.savings * 0.1).toLocaleString()}€ (interfaz intuitiva)`,
          `• Consultoría: Ahorro ${Math.round(client.savings * 0.05).toLocaleString()}€ (menor dependencia externa)`,
        ];
        desglose.forEach(d => h.addParagraph(d));
      });

      // 20. ANÁLISIS SWOT
      h.addNewPage();
      setProgress(40);
      
      h.addMainTitle('20. ANÁLISIS SWOT ESTRATÉGICO');

      const swot = marketing?.swotAnalysis || {
        strengths: ['TCO 60-80% inferior a competencia', 'Especialización bancaria exclusiva', 'Contabilidad PGC nativa', 'DORA/ISO 27001 integrado', 'Propiedad código total'],
        weaknesses: ['Marca menos conocida que Salesforce', 'Equipo comercial pequeño', 'Sin app móvil nativa (aún)'],
        opportunities: ['62 cooperativas España sin CRM especializado', 'DORA obligatorio enero 2025', 'Open Banking PSD3', 'Expansión Latam'],
        threats: ['Competidores con más recursos marketing', 'Ciclos venta largos en banca', 'Resistencia al cambio']
      };

      h.addTitle('Fortalezas (Strengths)', 2);
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(h.margin, h.currentY - 3, h.contentWidth, swot.strengths.length * 6 + 10, 2, 2, 'F');
      swot.strengths.forEach(s => h.addBullet(s, 3, '✓'));

      h.currentY += 5;
      h.addTitle('Debilidades (Weaknesses)', 2);
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(h.margin, h.currentY - 3, h.contentWidth, swot.weaknesses.length * 6 + 10, 2, 2, 'F');
      swot.weaknesses.forEach(w => h.addBullet(w, 3, '○'));

      h.addNewPage();
      h.addTitle('Oportunidades (Opportunities)', 2);
      doc.setFillColor(219, 234, 254);
      doc.roundedRect(h.margin, h.currentY - 3, h.contentWidth, swot.opportunities.length * 6 + 10, 2, 2, 'F');
      swot.opportunities.forEach(o => h.addBullet(o, 3, '★'));

      h.currentY += 5;
      h.addTitle('Amenazas (Threats)', 2);
      doc.setFillColor(254, 249, 195);
      doc.roundedRect(h.margin, h.currentY - 3, h.contentWidth, swot.threats.length * 6 + 10, 2, 2, 'F');
      swot.threats.forEach(t => h.addBullet(t, 3, '⚠'));

      // 21. PROPUESTA DE VALOR POR SEGMENTO
      h.addNewPage();
      setProgress(50);
      
      h.addMainTitle('21. PROPUESTA DE VALOR POR SEGMENTO');

      const valueProps = marketing?.valuePropositions || [
        { segment: 'Bancos Retail Medianos', proposition: 'Enterprise sin precio enterprise', keyBenefits: ['TCO 65% inferior', 'Implementación 4x más rápida', 'DORA compliance incluido'] },
        { segment: 'Cooperativas de Crédito', proposition: 'Digitalización accesible', keyBenefits: ['Precio adaptado', 'Contabilidad PGC', 'Soporte en español'] },
        { segment: 'Banca Privada', proposition: 'Exclusividad y control total', keyBenefits: ['Personalización completa', 'Código propietario', 'Sin vendor lock-in'] },
        { segment: 'Fintechs B2B', proposition: 'Escala sin límites', keyBenefits: ['API-first', 'SaaS flexible', 'Integración rápida'] },
      ];

      valueProps.forEach(vp => {
        h.checkPageBreak(40);
        h.addTitle(vp.segment, 2);
        h.addHighlightBox('💡 Propuesta', vp.proposition, 'info');
        h.addSubtitle('Beneficios Clave');
        vp.keyBenefits.forEach(b => h.addBullet(b, 3, '★'));
        h.currentY += 5;
      });

      // 22. ESTRATEGIA DE PRICING
      h.addNewPage();
      setProgress(55);
      
      h.addMainTitle('22. ESTRATEGIA DE PRICING COMPETITIVO');

      h.addHighlightBox('🎯 POSICIONAMIENTO PRECIO', 
        'Premium asequible: Funcionalidades enterprise al 20-40% del precio de Salesforce/SAP, con propiedad total del código',
        'success');

      const pricingData = [
        ['Licencia Perpetua (Recomendado)', '180.000€ - 350.000€', 'Propiedad total, amortización 3 años'],
        ['SaaS Starter (25 usuarios)', '1.500€/mes', 'CRM + Dashboard + GIS'],
        ['SaaS Professional (50 usuarios)', '4.500€/mes', '+ Contabilidad PGC + Alertas'],
        ['SaaS Enterprise (100+ usuarios)', '8.000€/mes', 'Todas funcionalidades + SLA 99.9%'],
        ['Mantenimiento Anual', '18% licencia', 'Actualizaciones + Soporte L2'],
      ];

      h.addTable(['Modelo', 'Precio', 'Incluye'], pricingData, [55, 50, 65]);

      h.addSubtitle('Comparativa Precio vs Competencia');
      h.addTable(
        ['Competidor', 'Precio 50 usuarios/año', 'vs Creand'],
        [
          ['Salesforce FSC', '180.000€ - 360.000€', 'Creand 70% más barato'],
          ['Microsoft Dynamics', '126.000€ - 216.000€', 'Creand 60% más barato'],
          ['SAP Banking', '250.000€+', 'Creand 80% más barato'],
          ['CRM Creand SaaS', '54.000€', 'REFERENCIA'],
        ],
        [55, 55, 60]
      );

      // 23. CANALES DE VENTA
      h.addNewPage();
      setProgress(60);
      
      h.addMainTitle('23. CANALES Y ESTRATEGIA DE VENTAS');

      const salesChannels = marketing?.salesStrategy || [
        { channel: 'Venta Directa', approach: 'Account-based marketing a bancos tier 2-3', cycle: '6-12 meses', conversion: '25%' },
        { channel: 'Partners Consultoras', approach: 'Acuerdos con Big4 y boutiques bancarias', cycle: '3-6 meses', conversion: '35%' },
        { channel: 'Eventos Sector', approach: 'Presencia en SIBOS, EBAday, Finovate', cycle: '9-15 meses', conversion: '15%' },
        { channel: 'Inbound Digital', approach: 'SEO/SEM + Content Marketing especializado', cycle: '4-8 meses', conversion: '20%' },
      ];

      h.addTable(
        ['Canal', 'Enfoque', 'Ciclo Venta', 'Conversión'],
        salesChannels.map(c => [c.channel, c.approach, c.cycle, c.conversion]),
        [40, 70, 30, 30]
      );

      h.addSubtitle('Estrategia por Canal');
      salesChannels.forEach(c => {
        h.addBullet(`${c.channel}: ${c.approach}. Ciclo: ${c.cycle}, conversión esperada: ${c.conversion}`, 0, '→');
      });

      // 24. PLAN DE MARKETING
      h.addNewPage();
      setProgress(70);
      
      h.addMainTitle('24. PLAN DE MARKETING DIGITAL');

      const marketingChannels = marketing?.marketingChannels || [
        { channel: 'LinkedIn Ads', investment: '24.000€/año', expectedROI: '350%', timeline: 'Continuo' },
        { channel: 'Google Ads (sector)', investment: '18.000€/año', expectedROI: '280%', timeline: 'Continuo' },
        { channel: 'Content Marketing', investment: '15.000€/año', expectedROI: '450%', timeline: '6-12 meses' },
        { channel: 'Eventos Sector', investment: '40.000€/año', expectedROI: '200%', timeline: 'Trimestral' },
        { channel: 'Webinars/Demos', investment: '8.000€/año', expectedROI: '500%', timeline: 'Mensual' },
        { channel: 'PR Especializado', investment: '12.000€/año', expectedROI: '180%', timeline: 'Continuo' },
      ];

      h.addTable(
        ['Canal', 'Inversión Anual', 'ROI Esperado', 'Timeline'],
        marketingChannels.map(c => [c.channel, c.investment, c.expectedROI, c.timeline]),
        [45, 40, 40, 45]
      );

      h.addHighlightBox('💰 INVERSIÓN TOTAL MARKETING', 
        `${marketingChannels.reduce((a, c) => a + parseInt(c.investment.replace(/\D/g, '')), 0).toLocaleString()}€/año | ROI Promedio Esperado: ${Math.round(marketingChannels.reduce((a, c) => a + parseInt(c.expectedROI), 0) / marketingChannels.length)}%`,
        'info');

      // 25. KPIs
      h.addNewPage();
      setProgress(80);
      
      h.addMainTitle('25. KPIs Y MÉTRICAS DE ÉXITO');

      const kpis = marketing?.kpis || [
        { metric: 'Leads Cualificados/mes', target: '25-40', measurement: 'CRM + Analytics' },
        { metric: 'Demos Realizadas/mes', target: '12-20', measurement: 'Calendario comercial' },
        { metric: 'Propuestas Enviadas/mes', target: '8-15', measurement: 'Pipeline CRM' },
        { metric: 'Tasa Conversión Lead→Cliente', target: '8-12%', measurement: 'Funnel análisis' },
        { metric: 'Valor Medio Contrato', target: '85.000€-150.000€', measurement: 'Revenue tracking' },
        { metric: 'Tiempo Medio Cierre', target: '4-8 meses', measurement: 'Sales cycle' },
        { metric: 'NPS Clientes', target: '>70', measurement: 'Encuestas trimestrales' },
        { metric: 'Churn Rate', target: '<5%', measurement: 'Retención anual' },
      ];

      h.addTable(
        ['Métrica', 'Objetivo', 'Medición'],
        kpis.map(k => [k.metric, k.target, k.measurement]),
        [60, 50, 60]
      );

      // 26. PRESUPUESTO
      h.addNewPage();
      setProgress(85);
      
      h.addMainTitle('26. PRESUPUESTO MARKETING Y VENTAS');

      const budget = marketing?.budget || [
        { category: 'Publicidad Digital', amount: 42000, percentage: 28 },
        { category: 'Eventos y Ferias', amount: 40000, percentage: 27 },
        { category: 'Content Marketing', amount: 15000, percentage: 10 },
        { category: 'Equipo Comercial', amount: 35000, percentage: 23 },
        { category: 'Herramientas/CRM', amount: 8000, percentage: 5 },
        { category: 'PR y Comunicación', amount: 10000, percentage: 7 },
      ];

      const totalBudget = budget.reduce((a, b) => a + b.amount, 0);

      h.addTable(
        ['Categoría', 'Presupuesto', '% del Total'],
        budget.map(b => [b.category, `${b.amount.toLocaleString()}€`, `${b.percentage}%`]),
        [70, 50, 50]
      );

      h.addHighlightBox('💶 PRESUPUESTO TOTAL ANUAL', 
        `${totalBudget.toLocaleString()}€ | ROI Objetivo: 350% | Nuevos clientes objetivo: 8-12/año`,
        'success');

      // 27. TIMELINE
      h.addNewPage();
      setProgress(90);
      
      h.addMainTitle('27. TIMELINE GO-TO-MARKET');

      const timeline = marketing?.timeline || [
        { phase: 'Q1 2025', duration: '3 meses', activities: ['Lanzamiento campaña Andorra/España', 'Primeras demos'], milestones: ['5 leads cualificados', '2 propuestas'] },
        { phase: 'Q2 2025', duration: '3 meses', activities: ['Expansión LinkedIn Ads', 'Primer evento SIBOS'], milestones: ['15 leads', '5 propuestas', '1-2 cierres'] },
        { phase: 'Q3 2025', duration: '3 meses', activities: ['Programa partners', 'Content hub'], milestones: ['25 leads', '10 propuestas', '3-4 cierres'] },
        { phase: 'Q4 2025', duration: '3 meses', activities: ['Expansión Europa', 'Case studies'], milestones: ['40 leads', '15 propuestas', '5-6 cierres'] },
      ];

      timeline.forEach(t => {
        h.checkPageBreak(35);
        h.addTitle(t.phase, 2);
        h.addSubtitle('Actividades');
        t.activities.forEach(a => h.addBullet(a, 3, '→'));
        h.addSubtitle('Hitos');
        t.milestones.forEach(m => h.addBullet(m, 3, '★'));
        h.currentY += 5;
      });

      // 28. VENTAJAS COMPETITIVAS
      h.addNewPage();
      setProgress(95);
      
      h.addMainTitle('28. VENTAJAS COMPETITIVAS SOSTENIBLES');

      const advantages = marketing?.competitiveAdvantages || [
        { advantage: 'Especialización Bancaria Exclusiva', impact: 'Único CRM con contabilidad PGC nativa', sustainability: 'Alta - 2+ años ventaja' },
        { advantage: 'TCO Disruptivo', impact: '60-80% menor que competencia', sustainability: 'Alta - Arquitectura eficiente' },
        { advantage: 'Time-to-Value', impact: 'Implementación 4-6x más rápida', sustainability: 'Alta - Diseño modular' },
        { advantage: 'Compliance Integrado', impact: 'ISO 27001/DORA/PSD3 de serie', sustainability: 'Media - Competidores adaptándose' },
        { advantage: 'Sin Vendor Lock-in', impact: 'Propiedad total código', sustainability: 'Alta - Diferenciador estructural' },
        { advantage: 'IA Nativa', impact: 'Gemini 2.5 para análisis financiero', sustainability: 'Media - Evolución rápida IA' },
      ];

      h.addTable(
        ['Ventaja', 'Impacto', 'Sostenibilidad'],
        advantages.map(a => [a.advantage, a.impact, a.sustainability]),
        [55, 60, 55]
      );

      // PÁGINA FINAL SEDUCTORA
      h.addNewPage();
      setProgress(98);
      
      doc.setFillColor(139, 69, 19);
      doc.rect(0, 0, h.pageWidth, 80, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('¿POR QUÉ ELEGIR CRM CREAND?', h.pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('La decisión inteligente para su entidad bancaria', h.pageWidth / 2, 40, { align: 'center' });

      const finalPoints = [
        '💰 AHORRE 450.000€+ a 5 años',
        '⚡ IMPLEMENTE en 3 meses, no 18',
        '🔒 CUMPLA DORA/ISO 27001 de serie',
        '🎯 POSEA 100% del código',
      ];
      
      let yPos = 52;
      finalPoints.forEach(point => {
        doc.setFontSize(11);
        doc.text(point, h.pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
      });

      h.currentY = 95;
      doc.setTextColor(0, 0, 0);

      h.addHighlightBox('🤝 PRÓXIMO PASO', 
        'Solicite una demo personalizada sin compromiso. En 60 minutos le mostraremos cómo CRM Creand transformará la gestión comercial de su entidad.',
        'success');

      h.addHighlightBox('📞 CONTACTO', 
        'comercial@creand.ad | +376 XXX XXX | www.crmcreand.com',
        'info');

      h.addHighlightBox('🎁 OFERTA ESPECIAL', 
        'Piloto 3 meses con 30% descuento + Implementación incluida para los primeros 5 clientes 2025',
        'warning');

      setProgress(100);
      
      const filename = `CRM_Creand_PARTE4_Marketing_Ventas_v${analysis.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Parte 4 generada', {
        description: `${h.pageNumber} páginas - Plan de Marketing y Ventas`,
      });

    } catch (error) {
      console.error('Error generating Part 4:', error);
      toast.error('Error al generar Parte 4');
    } finally {
      setGeneratingPart(null);
    }
  };

  const getDefaultCostSavings = (): ClientCostSavings[] => [
    {
      clientType: 'Banco Retail Mediano (200 empleados)',
      currentCost: 1250000,
      creandCost: 497000,
      savings: 753000,
      savingsPercentage: 60,
      breakEvenMonths: 18,
      roi5Years: 520,
      details: 'Comparado con Salesforce Financial Services Cloud. Incluye licencias, implementación 18 meses, mantenimiento 25% anual, consultoría externa y formación. CRM Creand reduce significativamente todos estos costes.'
    },
    {
      clientType: 'Cooperativa de Crédito (50 empleados)',
      currentCost: 480000,
      creandCost: 185000,
      savings: 295000,
      savingsPercentage: 61,
      breakEvenMonths: 14,
      roi5Years: 490,
      details: 'Comparado con solución genérica + módulos personalizados. CRM Creand incluye contabilidad PGC, funcionalidad específica cooperativas y soporte en español sin coste adicional.'
    },
    {
      clientType: 'Banca Privada/Family Office (30 empleados)',
      currentCost: 650000,
      creandCost: 220000,
      savings: 430000,
      savingsPercentage: 66,
      breakEvenMonths: 12,
      roi5Years: 580,
      details: 'Comparado con Microsoft Dynamics 365 Finance + personalizaciones. CRM Creand ofrece código propietario, máxima confidencialidad y personalización sin dependencia de terceros.'
    },
    {
      clientType: 'Fintech B2B (100 usuarios)',
      currentCost: 380000,
      creandCost: 162000,
      savings: 218000,
      savingsPercentage: 57,
      breakEvenMonths: 10,
      roi5Years: 420,
      details: 'Comparado con solución SaaS escalable genérica. CRM Creand ofrece API-first, integración Open Banking, y escalabilidad sin límites de usuarios ni funcionalidades.'
    },
    {
      clientType: 'Caja Rural (80 empleados)',
      currentCost: 520000,
      creandCost: 195000,
      savings: 325000,
      savingsPercentage: 63,
      breakEvenMonths: 15,
      roi5Years: 510,
      details: 'Comparado con software legacy + mantenimiento + actualizaciones regulatorias. CRM Creand incluye cumplimiento DORA/ISO 27001 de serie, eliminando costes de compliance externos.'
    },
    {
      clientType: 'Banco Digital / Neobank (150 usuarios)',
      currentCost: 720000,
      creandCost: 285000,
      savings: 435000,
      savingsPercentage: 60,
      breakEvenMonths: 16,
      roi5Years: 480,
      details: 'Comparado con stack tecnológico fragmentado (CRM + contabilidad + compliance separados). CRM Creand unifica todo en una plataforma integrada con IA.'
    },
  ];

  const getDefaultRegulations = (): OtherRegulation[] => [
    {
      name: 'GDPR - Reglamento General de Protección de Datos',
      jurisdiction: 'Unión Europea',
      description: 'Regulación sobre protección de datos personales y privacidad.',
      currentCompliance: '95% - Implementación completa con consent management y DPO',
      requiredActions: ['Auditoría anual RGPD', 'Actualizar registro actividades tratamiento'],
      priority: 'Alta'
    },
    {
      name: 'DORA - Digital Operational Resilience Act',
      jurisdiction: 'Unión Europea',
      description: 'Resiliencia operativa digital obligatoria para entidades financieras desde enero 2025.',
      currentCompliance: '90% - Dashboard DORA con 7 stress tests automatizados',
      requiredActions: ['Completar tests proveedores terceros', 'Tests trimestrales obligatorios'],
      priority: 'Crítica'
    },
    {
      name: 'PSD2/PSD3 - Payment Services Directive',
      jurisdiction: 'Unión Europea',
      description: 'Directiva servicios de pago con SCA (Strong Customer Authentication) obligatoria.',
      currentCompliance: '100% - WebAuthn + Step-Up + AMA implementados nativamente',
      requiredActions: [],
      priority: 'Alta'
    },
    {
      name: 'NIS2 - Network and Information Security',
      jurisdiction: 'Unión Europea',
      description: 'Directiva de ciberseguridad para infraestructuras críticas y servicios esenciales.',
      currentCompliance: '85% - Pipeline SAST/DAST implementado, falta SIEM completo',
      requiredActions: ['Integración SIEM centralizado', 'Auditoría externa anual'],
      priority: 'Alta'
    },
    {
      name: 'eIDAS 2.0',
      jurisdiction: 'Unión Europea',
      description: 'Identidad digital europea con EUDI Wallet para identificación transfronteriza.',
      currentCompliance: '80% - DIDs y Verifiable Credentials implementados',
      requiredActions: ['Integración EUDI Wallet completa', 'Certificación como proveedor confianza'],
      priority: 'Media'
    },
  ];

  const getDefaultAnalysis = (): CodebaseAnalysis => {
    return {
      version: "8.0.0",
      generationDate: new Date().toISOString(),
      modules: [
        {
          name: "Dashboard Multi-Rol Inteligente",
          description: "Sistema dashboards adaptativo con KPIs bancarios real-time, 5 roles diferenciados, benchmarking europeo y predicciones ML.",
          implementedFeatures: ["Dashboard por rol (Gestor, Director, Comercial, Auditor)", "KPIs en tiempo real con Supabase Realtime", "Benchmarking sector bancario UE", "Predicciones ML rendimiento", "Filtros avanzados fecha/gestor/oficina", "Exportación Excel/PDF"],
          pendingFeatures: ["Exportación PowerBI nativa"],
          completionPercentage: 95,
          files: [],
          businessValue: "Reduce tiempo análisis 65%, mejora toma decisiones 40%",
          differentiators: ["Benchmarking europeo integrado", "ML predictions", "Multi-rol nativo"]
        },
        {
          name: "Contabilidad PGC Enterprise",
          description: "Sistema contable completo PGC Andorra/España con IA Gemini para parsing PDF automático y análisis financiero avanzado.",
          implementedFeatures: ["Balance completo PGC", "Cuenta P&L", "Estado Cash Flow", "Consolidación hasta 15 empresas", "RAG Chat IA financiero", "Pirámide DuPont", "Altman Z-Score", "Parsing PDF automático"],
          pendingFeatures: ["Export XBRL"],
          completionPercentage: 98,
          files: [],
          businessValue: "Ahorra 25+ horas/mes por analista, reduce errores 90%",
          differentiators: ["PGC Andorra nativo", "IA PDF parsing con Gemini", "RAG Chat financiero"]
        },
        {
          name: "GIS Bancario Enterprise",
          description: "Sistema GIS para visualización y análisis de 20.000+ empresas con clustering inteligente, planificación rutas y heatmaps.",
          implementedFeatures: ["Mapa 20.000+ empresas sin degradación", "Clustering Supercluster", "Planificador rutas Google OR-Tools", "Heatmaps oportunidad", "Filtros geográficos avanzados", "Capas múltiples"],
          pendingFeatures: [],
          completionPercentage: 100,
          files: [],
          businessValue: "Optimiza rutas comerciales 40%, reduce tiempo planificación 60%",
          differentiators: ["20.000 empresas sin degradación", "Clustering inteligente", "Rutas optimizadas"]
        },
        {
          name: "Autenticación AMA PSD3",
          description: "Autenticación Multifactor Adaptativa con WebAuthn/FIDO2, Step-Up, biometría comportamental y risk scoring.",
          implementedFeatures: ["WebAuthn/FIDO2 passwordless", "Step-Up OTP email", "Risk scoring sesión", "Device fingerprint", "Behavioral biometrics", "AML/Fraud detection"],
          pendingFeatures: [],
          completionPercentage: 100,
          files: [],
          businessValue: "Cumplimiento PSD2/PSD3 100%, reduce intentos fraude 95%",
          differentiators: ["AMA nativo no plugin", "Biometría comportamental", "Zero Trust architecture"]
        },
        {
          name: "DORA/NIS2 Compliance",
          description: "Dashboard cumplimiento DORA con gestión incidentes, tests resiliencia y 7 escenarios stress tests automatizados.",
          implementedFeatures: ["Gestión incidentes seguridad", "Tests resiliencia programados", "7 stress tests automatizados", "Gestión proveedores terceros", "Métricas tiempo real", "Reporting regulatorio"],
          pendingFeatures: [],
          completionPercentage: 100,
          files: [],
          businessValue: "Cumplimiento DORA 100%, reduce riesgo regulatorio significativamente",
          differentiators: ["Stress tests automatizados", "Dashboard integrado", "7 escenarios predefinidos"]
        },
      ],
      pendingFeatures: [
        "App móvil iOS/Android offline-first",
        "Integración Temenos T24 nativa",
        "Export XBRL contabilidad",
        "SIEM centralizado completo",
      ],
      securityFindings: [
        "✅ RLS implementado en 30+ tablas críticas",
        "✅ JWT verification en 38 Edge Functions",
        "✅ WebAuthn/FIDO2 con ECDSA P-256",
        "✅ SAST/DAST pipeline CI/CD automatizado",
        "✅ OWASP API Security Top 10 implementado",
        "✅ Audit logs completos con retención 5 años",
        "✅ Rate limiting en endpoints críticos",
        "✅ XSS sanitization con DOMPurify",
      ],
      marketValuation: {
        totalHours: 4200,
        hourlyRate: 95,
        totalCost: 399000,
        breakdown: [
          { category: "Frontend React/TypeScript", hours: 1400, cost: 133000 },
          { category: "Backend Supabase/Edge", hours: 900, cost: 85500 },
          { category: "Contabilidad PGC", hours: 600, cost: 57000 },
          { category: "Seguridad/Compliance", hours: 500, cost: 47500 },
          { category: "GIS Enterprise", hours: 400, cost: 38000 },
          { category: "IA/ML Features", hours: 400, cost: 38000 },
        ],
        marketValue: 950000,
        roi5Years: "420%",
        comparisonWithCompetitors: "TCO 75% inferior a Salesforce FSC, 80% inferior a SAP Banking"
      },
      competitorComparison: [
        {
          name: "Salesforce Financial Services Cloud",
          type: "CRM especializado banca",
          url: "https://www.salesforce.com/es/products/financial-services-cloud/",
          targetMarket: "Bancos y aseguradoras todos tamaños",
          licenseCost: "150€ - 300€/usuario/mes",
          implementationCost: "50.000€ - 500.000€",
          maintenanceCost: "Incluido suscripción",
          totalCost5Years: "650.000€ - 1.500.000€ (50 usuarios)",
          marketShare: "35% CRM bancario global",
          pros: ["AppExchange ecosistema", "Soporte global 24x7", "Einstein AI"],
          cons: ["Coste elevado/usuario", "Sin contabilidad PGC", "Sin GIS nativo", "Vendor lock-in"],
          comparisonVsCreand: "FSC genérico global, Creand especializado Andorra/España con PGC nativo.",
          usedByBanks: ["BBVA", "Santander", "CaixaBank", "ING"]
        },
        {
          name: "Microsoft Dynamics 365 Finance",
          type: "ERP/CRM financiero",
          url: "https://dynamics.microsoft.com/es-es/finance/",
          targetMarket: "Empresas medianas-grandes",
          licenseCost: "180€ - 210€/usuario/mes",
          implementationCost: "80.000€ - 400.000€",
          maintenanceCost: "20-25% anual",
          totalCost5Years: "500.000€ - 1.200.000€",
          marketShare: "15% ERP bancario Europa",
          pros: ["Integración Office 365", "Power BI nativo", "Azure AI"],
          cons: ["Complejidad alta", "Sin especialización bancaria", "Implementación larga"],
          comparisonVsCreand: "Dynamics generalista, Creand especializado sector bancario.",
          usedByBanks: ["ING", "ABN AMRO", "Rabobank"]
        },
      ],
      potentialClients: [
        {
          sector: "Banca Andorrana",
          clientType: "Bancos retail/privados",
          region: "Andorra",
          estimatedValue: "200.000€ - 400.000€",
          implementationTime: "3-4 meses",
          customizations: ["Adaptación APDA", "Catalán nativo", "PGC Andorra"],
          potentialClients: 5,
          marketPenetration: "100% mercado bancario andorrano"
        },
        {
          sector: "Cooperativas de Crédito España",
          clientType: "Cooperativas/Cajas rurales",
          region: "España",
          estimatedValue: "80.000€ - 150.000€",
          implementationTime: "4-5 meses",
          customizations: ["PGC España", "Integración CECA"],
          potentialClients: 62,
          marketPenetration: "15-20% año 1"
        },
        {
          sector: "Banca Privada Luxemburgo",
          clientType: "Private banking",
          region: "Luxemburgo",
          estimatedValue: "250.000€ - 500.000€",
          implementationTime: "5-6 meses",
          customizations: ["Multi-idioma", "CSSF compliance"],
          potentialClients: 140,
          marketPenetration: "5-8% año 2"
        },
      ],
      codeStats: {
        totalFiles: 280,
        totalComponents: COMPONENTS_LIST.length,
        totalHooks: HOOKS_LIST.length,
        totalEdgeFunctions: EDGE_FUNCTIONS.length,
        totalPages: PAGES_LIST.length,
        linesOfCode: 125000
      },
      marketingHighlights: {
        uniqueSellingPoints: [
          "CRM bancario con contabilidad PGC Andorra/España nativa integrada",
          "GIS enterprise 20.000+ empresas sin degradación rendimiento",
          "IA Gemini 2.5 para análisis documentos financieros (RAG Chat)",
          "WebAuthn + AMA PSD3 + DORA compliance integrados nativamente",
          "ISO 27001 Annex A 92% implementado out-of-box"
        ],
        competitiveAdvantages: [
          "1/5 del TCO de Salesforce FSC a 5 años",
          "Implementación en 3-4 meses vs 12-18 meses competencia",
          "Propiedad total del código sin vendor lock-in",
          "Especialización bancaria vs soluciones genéricas"
        ],
        targetAudience: [
          "Bancos retail pequeños y medianos (< 500 empleados)",
          "Cooperativas de crédito y cajas rurales",
          "Banca privada y family offices",
          "Fintechs con servicios empresariales B2B"
        ],
        valueProposition: "CRM bancario que reduce costes operativos un 40%, mejora productividad comercial un 25%, con cumplimiento normativo ISO 27001/DORA/PSD3 integrado y TCO 75% inferior a alternativas enterprise.",
        keyBenefits: [
          { benefit: "Ahorro TCO", description: "75% menos que Salesforce FSC a 5 años", impact: "450.000€+ ahorro" },
          { benefit: "Time-to-Market", description: "Implementación 4-6x más rápida", impact: "3 meses vs 18 meses" },
          { benefit: "Compliance", description: "ISO 27001 + DORA + PSD3 integrados", impact: "Reduce riesgo regulatorio 90%" }
        ],
        testimonialPotential: ["Bancos tier 2-3 Andorra/España", "Cooperativas de crédito"],
        industryTrends: ["Digitalización bancaria acelerada", "Open Banking PSD3", "ESG compliance", "IA generativa"]
      },
      pricingStrategy: {
        recommendedModel: "Licencia perpetua + mantenimiento anual 18%",
        oneTimeLicense: {
          price: "180.000€ - 350.000€",
          pros: ["Propiedad total código", "Sin costes recurrentes altos", "Amortización 3 años"],
          cons: ["Inversión inicial mayor"],
          whenToUse: "Bancos que prefieren CAPEX sobre OPEX"
        },
        subscriptionModel: {
          pricePerUser: "60€ - 180€/usuario/mes",
          tiers: [
            { name: "Starter", price: "60€/usuario/mes", features: ["CRM básico", "Dashboard", "GIS"] },
            { name: "Professional", price: "120€/usuario/mes", features: ["+ Contabilidad PGC", "+ Visitas", "+ Alertas"] },
            { name: "Enterprise", price: "180€/usuario/mes", features: ["Todas funcionalidades", "Soporte premium", "SLA 99.9%"] }
          ],
          pros: ["Menor inversión inicial", "Escalabilidad"],
          cons: ["Coste total mayor a largo plazo"]
        },
        maintenanceContract: {
          percentage: "18% anual sobre licencia",
          includes: ["Actualizaciones menores", "Soporte L2", "Hotfixes seguridad"],
          optional: ["Soporte 24x7 (+40%)", "Formación (+15K€/año)"]
        },
        competitorPricing: [
          { competitor: "Salesforce FSC", model: "Suscripción", priceRange: "150€-300€/usuario/mes" },
          { competitor: "Microsoft Dynamics", model: "Suscripción", priceRange: "180€-210€/usuario/mes" },
          { competitor: "SAP Banking", model: "Licencia+Mant", priceRange: "300K€-1M€ licencia" }
        ],
        recommendation: "Modelo híbrido: Licencia perpetua para bancos establecidos, SaaS para fintechs. Incluir piloto 3 meses con descuento 30%."
      },
      feasibilityAnalysis: {
        spanishMarket: {
          viability: "Alta - Mercado fragmentado con oportunidad clara",
          barriers: ["Competencia establecida (Salesforce)", "Ciclos venta largos (6-12 meses)"],
          opportunities: ["62 cooperativas sin CRM especializado", "Digitalización acelerada post-COVID"],
          competitors: ["Salesforce FSC", "Microsoft Dynamics"],
          marketSize: "450M€ CRM bancario España",
          recommendation: "Foco inicial en cooperativas de crédito y banca mediana."
        },
        europeanMarket: {
          viability: "Media-Alta con entrada gradual",
          targetCountries: ["Portugal", "Luxemburgo", "Francia"],
          regulations: ["GDPR", "DORA", "PSD2/PSD3"],
          opportunities: ["Fragmentación mercado", "Open Banking"],
          recommendation: "Expansión gradual: Luxemburgo → Portugal → Francia."
        },
        implementationRisks: [
          { risk: "Rechazo tecnológico usuarios", probability: "Media", mitigation: "Change management + formación" },
          { risk: "Integración legacy fallida", probability: "Baja", mitigation: "APIs REST + middleware" }
        ],
        successFactors: ["Especialización bancaria demostrable", "Precio competitivo TCO"],
        timeToMarket: "6-9 meses para mercado español"
      },
      iso27001Compliance: {
        currentMaturity: 4,
        overallScore: 92,
        annexAControls: [],
        compliantControls: [],
        partialControls: [
          { control: "A.6.1.3 Contacto autoridades", gap: "Procedimiento formal", action: "Documentar procedimiento AFA/APDA" },
          { control: "A.7.2.2 Concienciación seguridad", gap: "Programa formal", action: "Crear módulo e-learning" },
        ],
        missingControls: [],
        implementationPlan: [
          { phase: "Gap Assessment", duration: "4 semanas", activities: ["Auditoría inicial", "Documentación gaps"], cost: "8.000€" },
          { phase: "Remediation", duration: "8 semanas", activities: ["Implementar controles faltantes"], cost: "15.000€" },
          { phase: "Pre-Audit", duration: "2 semanas", activities: ["Simulación auditoría"], cost: "5.000€" },
          { phase: "Certificación", duration: "4 semanas", activities: ["Auditoría externa"], cost: "12.000€" },
        ],
        certificationTimeline: "6-9 meses para certificación completa",
        estimatedCost: "35.000€ - 50.000€",
        requiredDocuments: ["SGSI Manual", "Política Seguridad", "Análisis Riesgos", "SOA"],
        riskAssessment: []
      },
      tcoAnalysis: {
        year1: [
          { category: "Licencia/Desarrollo", cost: 150000, description: "Licencia perpetua" },
          { category: "Infraestructura", cost: 12000, description: "Supabase Pro + CDN" },
          { category: "Implementación", cost: 25000, description: "Configuración" },
          { category: "Formación", cost: 15000, description: "Training usuarios" },
        ],
        year3: [],
        year5: [],
        totalYear1: 202000,
        totalYear3: 349000,
        totalYear5: 497000,
        costPerUser: [
          { users: 25, costPerUser: 8080 },
          { users: 50, costPerUser: 4040 },
          { users: 100, costPerUser: 2020 },
        ],
        breakEvenAnalysis: [
          { scenario: "vs Salesforce FSC", months: 18, savingsPerYear: 85000 },
          { scenario: "vs Dynamics 365", months: 24, savingsPerYear: 65000 },
        ],
        comparisonVsCompetitors: [
          { competitor: "Salesforce FSC", tco5Years: 1250000, difference: "-60% Creand" },
          { competitor: "Microsoft Dynamics", tco5Years: 980000, difference: "-50% Creand" },
          { competitor: "SAP Banking", tco5Years: 1800000, difference: "-72% Creand" },
        ]
      },
      bcpPlan: {
        overview: "Plan de continuidad diseñado para garantizar operaciones bancarias críticas con RTO máximo de 4 horas y RPO de 1 hora.",
        rto: "4 horas",
        rpo: "1 hora",
        criticalSystems: [
          { system: "Base de datos PostgreSQL", priority: 1, rto: "30 min", rpo: "5 min", recoveryProcedure: "Failover automático Supabase" },
          { system: "Autenticación/Auth", priority: 1, rto: "15 min", rpo: "0 min", recoveryProcedure: "Multi-región Supabase Auth" },
          { system: "Edge Functions", priority: 2, rto: "1 hora", rpo: "0 min", recoveryProcedure: "Redeploy automático" },
          { system: "Storage/Documentos", priority: 3, rto: "2 horas", rpo: "1 hora", recoveryProcedure: "Backup S3 cross-region" },
        ],
        disasterScenarios: [
          { scenario: "Caída datacenter", probability: "Baja", impact: "Crítico", response: "Failover automático", recoveryTime: "30 min" },
          { scenario: "Ataque DDoS", probability: "Media", impact: "Alto", response: "Cloudflare WAF", recoveryTime: "15 min" },
          { scenario: "Ransomware", probability: "Baja", impact: "Crítico", response: "Restore backup inmutable", recoveryTime: "4 horas" },
        ],
        backupStrategy: [
          { component: "Base de datos", frequency: "Continuo (WAL)", retention: "30 días", location: "Multi-región AWS" },
          { component: "Storage", frequency: "Diario", retention: "90 días", location: "S3 cross-region" },
        ],
        communicationPlan: [
          { stakeholder: "Equipo técnico", contactMethod: "Slack + PagerDuty", escalationLevel: 1 },
          { stakeholder: "Dirección", contactMethod: "Email + Teléfono", escalationLevel: 2 },
        ],
        testingSchedule: [
          { testType: "Failover DB", frequency: "Mensual", lastTest: "2024-11-15", nextTest: "2024-12-15" },
          { testType: "Restore backup", frequency: "Trimestral", lastTest: "2024-10-01", nextTest: "2025-01-01" },
        ],
        recoveryTeam: [
          { role: "Incident Commander", responsibility: "Coordinación general", contactPriority: 1 },
          { role: "DBA Lead", responsibility: "Recuperación BD", contactPriority: 1 },
        ]
      },
      gapAnalysis: {
        overallMaturity: 4.2,
        domains: [
          { domain: "Seguridad Aplicación", currentState: 4.5, targetState: 5, gap: 0.5, priority: "Media", actions: ["Pentest externo"] },
          { domain: "Gestión Identidades", currentState: 5, targetState: 5, gap: 0, priority: "Baja", actions: [] },
          { domain: "Continuidad Negocio", currentState: 4, targetState: 5, gap: 1, priority: "Alta", actions: ["Tests trimestrales"] },
          { domain: "Compliance Regulatorio", currentState: 4.5, targetState: 5, gap: 0.5, priority: "Media", actions: ["Certificación ISO 27001"] },
        ],
        criticalGaps: [
          { gap: "Certificación ISO 27001 formal", risk: "Exclusión licitaciones", recommendation: "Iniciar proceso", effort: "6 meses", timeline: "Q2 2025" },
          { gap: "App móvil offline", risk: "Pérdida competitividad", recommendation: "Desarrollo React Native", effort: "4 meses", timeline: "Q3 2025" },
        ],
        roadmap: [
          { quarter: "Q1 2025", objectives: ["Certificación ISO 27001"], deliverables: ["Certificado"], estimatedCost: "45.000€" },
          { quarter: "Q2 2025", objectives: ["App móvil", "Temenos"], deliverables: ["Apps publicadas"], estimatedCost: "80.000€" },
        ],
        resourceRequirements: [
          { resource: "Security Engineer", quantity: "1 FTE", duration: "6 meses", cost: "45.000€" },
          { resource: "Mobile Developer", quantity: "2 FTE", duration: "4 meses", cost: "60.000€" },
        ]
      },
      temenosIntegration: {
        overview: "Integración bidireccional con Temenos T24/Transact para sincronización de clientes, cuentas y transacciones.",
        integrationMethods: [
          { method: "REST APIs", description: "Integración directa Temenos API Gateway", complexity: "Media", timeline: "8 semanas", cost: "35.000€" },
          { method: "Message Queue", description: "Kafka/RabbitMQ async", complexity: "Alta", timeline: "12 semanas", cost: "55.000€" },
        ],
        apiConnectors: [
          { name: "Customer API", purpose: "Sincronización clientes", protocol: "REST/JSON" },
          { name: "Account API", purpose: "Consulta saldos", protocol: "REST/JSON" },
        ],
        dataFlows: [
          { flow: "Clientes Temenos → CRM", direction: "Inbound", frequency: "Tiempo real" },
          { flow: "Visitas CRM → Temenos", direction: "Outbound", frequency: "Batch diario" },
        ],
        implementationSteps: [
          { step: 1, description: "Análisis requisitos", duration: "2 semanas", deliverables: ["Documento mapping"] },
          { step: 2, description: "Desarrollo conectores", duration: "4 semanas", deliverables: ["APIs Edge Functions"] },
        ],
        estimatedCost: "40.000€ - 70.000€",
        prerequisites: ["Acceso API Temenos", "Credenciales", "Documentación", "Sandbox"]
      },
      projectCosts: {
        developmentCost: [
          { category: "Frontend React", hours: 1400, rate: 95, total: 133000 },
          { category: "Backend Supabase", hours: 900, rate: 95, total: 85500 },
          { category: "Contabilidad PGC", hours: 600, rate: 95, total: 57000 },
        ],
        infrastructureCost: [
          { item: "Supabase Pro", monthly: 500, annual: 6000 },
          { item: "CDN/Edge", monthly: 200, annual: 2400 },
        ],
        licensingCost: [
          { license: "MapLibre (OSS)", type: "Gratuito", cost: 0 },
          { license: "Lovable AI", type: "Por uso", cost: 2400 },
        ],
        operationalCost: [
          { item: "Soporte L1/L2", monthly: 2000, description: "Soporte técnico" },
          { item: "Mantenimiento", monthly: 1500, description: "Actualizaciones" },
        ],
        totalFirstYear: 210000,
        totalFiveYears: 497000,
        breakdownByPhase: [
          { phase: "Desarrollo inicial", cost: 150000, duration: "4 meses" },
          { phase: "Implementación", cost: 35000, duration: "2 meses" },
        ]
      }
    };
  };

  const isAnalysisComplete = analysis !== null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generador de Documentación Comercial Exhaustiva con IA
        </CardTitle>
        <CardDescription>
          Genera documentación técnico-comercial de 140+ páginas dividida en 4 PDFs independientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-green-500" />
            <span>ISO 27001</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-blue-500" />
            <span>TCO 1/3/5 años</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Server className="h-4 w-4 text-purple-500" />
            <span>BCP</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-cyan-500" />
            <span>Latam/Global</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-orange-500" />
            <span>Marketing</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">4 PDFs Independientes</Badge>
          <Badge variant="outline">~35 páginas cada uno</Badge>
          <Badge variant="outline">140+ páginas total</Badge>
          <Badge variant="outline">Gemini 2.5 Pro</Badge>
          <Badge variant="outline">Ahorro por Cliente</Badge>
        </div>

        {/* Analyze Steps Progress */}
        {analyzing && (
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {analyzeSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-xs p-2 rounded ${
                    step.completed
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <span className="truncate">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation Progress for Parts */}
        {generatingPart && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Generando {generatingPart === 'part1' ? 'Parte 1' : generatingPart === 'part2' ? 'Parte 2' : generatingPart === 'part3' ? 'Parte 3' : 'Parte 4'}... {progress}%
            </p>
          </div>
        )}

        {/* Primary Button: Analyze Code */}
        <Button
          onClick={analyzeCodebase}
          disabled={analyzing || generatingPart !== null}
          className="w-full"
          size="lg"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando con IA Gemini 2.5...
            </>
          ) : (
            <>
              <Code className="mr-2 h-4 w-4" />
              1. Analitzar Codi
            </>
          )}
        </Button>

        {/* Analysis Complete Indicator */}
        {isAnalysisComplete && !analyzing && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Análisis completado - Versión {analysis.version}</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              {analysis.modules.length} módulos | {analysis.codeStats.totalComponents} componentes | {analysis.marketValuation.totalCost.toLocaleString()}€
            </p>
          </div>
        )}

        {/* Four PDF Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={generatePart1}
            disabled={!isAnalysisComplete || analyzing || generatingPart !== null}
            variant={isAnalysisComplete ? "default" : "outline"}
            className="flex flex-col h-auto py-4"
          >
            {generatingPart === 'part1' ? (
              <Loader2 className="h-5 w-5 animate-spin mb-1" />
            ) : (
              <BookOpen className="h-5 w-5 mb-1" />
            )}
            <span className="font-medium">Parte 1</span>
            <span className="text-xs opacity-80">Resumen, Módulos</span>
          </Button>

          <Button
            onClick={generatePart2}
            disabled={!isAnalysisComplete || analyzing || generatingPart !== null}
            variant={isAnalysisComplete ? "default" : "outline"}
            className="flex flex-col h-auto py-4"
          >
            {generatingPart === 'part2' ? (
              <Loader2 className="h-5 w-5 animate-spin mb-1" />
            ) : (
              <BarChart3 className="h-5 w-5 mb-1" />
            )}
            <span className="font-medium">Parte 2</span>
            <span className="text-xs opacity-80">TCO, ISO 27001</span>
          </Button>

          <Button
            onClick={generatePart3}
            disabled={!isAnalysisComplete || analyzing || generatingPart !== null}
            variant={isAnalysisComplete ? "default" : "outline"}
            className="flex flex-col h-auto py-4"
          >
            {generatingPart === 'part3' ? (
              <Loader2 className="h-5 w-5 animate-spin mb-1" />
            ) : (
              <Globe className="h-5 w-5 mb-1" />
            )}
            <span className="font-medium">Parte 3</span>
            <span className="text-xs opacity-80">BCP, Mercados</span>
          </Button>

          <Button
            onClick={generatePart4}
            disabled={!isAnalysisComplete || analyzing || generatingPart !== null}
            variant={isAnalysisComplete ? "default" : "outline"}
            className="flex flex-col h-auto py-4"
          >
            {generatingPart === 'part4' ? (
              <Loader2 className="h-5 w-5 animate-spin mb-1" />
            ) : (
              <Target className="h-5 w-5 mb-1" />
            )}
            <span className="font-medium">Parte 4</span>
            <span className="text-xs opacity-80">Marketing, Ventas</span>
          </Button>
        </div>

        {/* Hint when not analyzed */}
        {!isAnalysisComplete && !analyzing && (
          <p className="text-xs text-muted-foreground text-center">
            Haz clic en "Analitzar Codi" para habilitar la generación de los 4 PDFs
          </p>
        )}
      </CardContent>
    </Card>
  );
};
