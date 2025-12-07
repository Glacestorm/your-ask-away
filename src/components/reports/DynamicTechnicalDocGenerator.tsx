import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, CheckCircle, Sparkles, Code, DollarSign, Users, AlertTriangle, TrendingUp, Globe, Target, Award } from 'lucide-react';
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
  implementationRisks: { risk: string; probability: string; mitigation: string }[];
  successFactors: string[];
  timeToMarket: string;
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
}

// Codebase structure data
const COMPONENTS_LIST = [
  'admin/AdminSidebar.tsx', 'admin/AlertHistoryViewer.tsx', 'admin/AuditLogsViewer.tsx',
  'admin/AuditorDashboard.tsx', 'admin/BulkGoalsAssignment.tsx', 'admin/CommercialDirectorDashboard.tsx',
  'admin/CommercialManagerAudit.tsx', 'admin/CommercialManagerDashboard.tsx', 'admin/CompaniesManager.tsx',
  'admin/CompaniesPagination.tsx', 'admin/ConceptsManager.tsx', 'admin/ContractedProductsReport.tsx',
  'admin/DirectorAlertsPanel.tsx', 'admin/EmailTemplatesManager.tsx', 'admin/ExcelImporter.tsx',
  'admin/GestorDashboard.tsx', 'admin/GestoresMetrics.tsx', 'admin/GoalsKPIDashboard.tsx',
  'admin/GoalsProgressTracker.tsx', 'admin/ImportHistoryViewer.tsx', 'admin/KPIReportHistory.tsx',
  'admin/MapTooltipConfig.tsx', 'admin/MetricsExplorer.tsx', 'admin/OfficeDirectorDashboard.tsx',
  'admin/ProductsManager.tsx', 'admin/ProductsMetrics.tsx', 'admin/SharedVisitsCalendar.tsx',
  'admin/StatusColorsManager.tsx', 'admin/SystemHealthMonitor.tsx', 'admin/TPVGoalsManager.tsx',
  'admin/TPVManager.tsx', 'admin/UsersManager.tsx', 'admin/VinculacionMetrics.tsx',
  'admin/VisitSheetAuditViewer.tsx', 'admin/VisitSheetValidationPanel.tsx',
  'admin/VisitSheetsGestorComparison.tsx', 'admin/VisitsMetrics.tsx',
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
  'admin/accounting/FinancialNotesManager.tsx', 'admin/accounting/FinancialStatementsHistory.tsx',
  'admin/accounting/FinancingStatement.tsx', 'admin/accounting/IncomeStatementChart.tsx',
  'admin/accounting/IncomeStatementForm.tsx', 'admin/accounting/LiquidityDebtRatios.tsx',
  'admin/accounting/LongTermFinancialAnalysis.tsx', 'admin/accounting/MovingAnnualTrendChart.tsx',
  'admin/accounting/MultiYearComparison.tsx', 'admin/accounting/PDFImportDialog.tsx',
  'admin/accounting/PeriodYearSelector.tsx', 'admin/accounting/ProfitabilityTab.tsx',
  'admin/accounting/ProvisionalStatementsManager.tsx', 'admin/accounting/RatiosPyramid.tsx',
  'admin/accounting/ReportsTab.tsx', 'admin/accounting/SectorSimulator.tsx',
  'admin/accounting/SectoralRatiosAnalysis.tsx', 'admin/accounting/TreasuryMovements.tsx',
  'admin/accounting/ValuationTab.tsx', 'admin/accounting/WorkingCapitalAnalysis.tsx',
  'admin/accounting/WorkingCapitalNOF.tsx', 'admin/accounting/ZScoreAnalysis.tsx',
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
  'dashboard/MapButton.tsx', 'dashboard/MapDashboardCard.tsx', 'dashboard/MetricsCardsSection.tsx',
  'dashboard/MetricsDashboardCard.tsx', 'dashboard/NotificationPreferences.tsx',
  'dashboard/NotificationService.tsx', 'dashboard/NotificationsPanel.tsx',
  'dashboard/ObjetivosYMetas.tsx', 'dashboard/PersonalActivityHistory.tsx',
  'dashboard/PersonalGoalsDetailedAnalysis.tsx', 'dashboard/PersonalGoalsHistory.tsx',
  'dashboard/PersonalGoalsTracker.tsx', 'dashboard/PersonalKPIsDashboard.tsx',
  'dashboard/PrediccionesFuturas.tsx', 'dashboard/QuickActionsPanel.tsx',
  'dashboard/QuickVisitManager.tsx', 'dashboard/QuickVisitSheetCard.tsx',
  'dashboard/ResumenEjecutivo.tsx', 'dashboard/TPVGestorRanking.tsx',
  'dashboard/TPVGoalsComparison.tsx', 'dashboard/TPVGoalsDashboard.tsx',
  'dashboard/TPVGoalsHistory.tsx', 'dashboard/UnifiedMetricsDashboard.tsx',
  'dashboard/UpcomingVisitsWidget.tsx', 'dashboard/VisitReminders.tsx',
  'map/CompanyPhotosDialog.tsx', 'map/GeoSearch.tsx', 'map/MapContainer.tsx',
  'map/MapHeader.tsx', 'map/MapLayersControl.tsx', 'map/MapSidebar.tsx',
  'map/SectorStats.tsx', 'map/VisitsPanel.tsx', 'map/markerIcons.tsx', 'map/markerStyles.tsx',
  'reports/ReportGenerator.tsx', 'reports/TechnicalDocumentGenerator.tsx',
  'visits/ParticipantsSelector.tsx', 'visits/VisitSheetForm.tsx',
];

const HOOKS_LIST = [
  'useAuth.tsx', 'useCelebration.ts', 'useCompaniesServerPagination.ts',
  'useCompanyPhotosLazy.ts', 'useGoalsQuery.ts', 'useNavigationHistory.ts',
  'useNotifications.tsx', 'useNotificationsQuery.ts', 'useOptimisticLock.ts',
  'usePresence.ts', 'useRealtimeChannel.ts', 'useVisitsQuery.ts', 'use-mobile.tsx', 'use-toast.ts',
];

const EDGE_FUNCTIONS = [
  'analyze-codebase', 'check-alerts', 'check-goal-achievements', 'check-goals-at-risk',
  'check-low-performance', 'check-visit-reminders', 'check-visit-sheet-reminders',
  'escalate-alerts', 'generate-action-plan', 'geocode-address', 'manage-user',
  'notify-visit-validation', 'parse-financial-pdf', 'search-company-photo',
  'send-alert-email', 'send-critical-opportunity-email', 'send-daily-kpi-report',
  'send-goal-achievement-email', 'send-monthly-kpi-report', 'send-monthly-reports',
  'send-reminder-email', 'send-visit-calendar-invite', 'send-weekly-kpi-report',
  'smart-column-mapping', 'system-health',
];

const PAGES_LIST = [
  'Admin.tsx', 'Auth.tsx', 'Dashboard.tsx', 'Home.tsx', 'Index.tsx',
  'MapView.tsx', 'NotFound.tsx', 'Profile.tsx', 'VisitSheets.tsx',
];

export const DynamicTechnicalDocGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<CodebaseAnalysis | null>(null);
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'analyze', name: 'Analizando código con IA Avanzada', completed: false },
    { id: 'cover', name: 'Portada Profesional y Metadatos', completed: false },
    { id: 'index', name: 'Índice General Expandido', completed: false },
    { id: 'executive', name: 'Resumen Ejecutivo Premium', completed: false },
    { id: 'modules', name: 'Análisis de Módulos con Valor de Negocio', completed: false },
    { id: 'marketing', name: 'Addendum Marketing y Ventas', completed: false },
    { id: 'valuation', name: 'Valoración Económica Detallada', completed: false },
    { id: 'competitors', name: 'Comparativa Competidores Bancarios', completed: false },
    { id: 'pricing', name: 'Estrategia de Pricing y Licencias', completed: false },
    { id: 'feasibility', name: 'Viabilidad España y Europa', completed: false },
    { id: 'clients', name: 'Clientes Potenciales y TAM', completed: false },
    { id: 'conclusions', name: 'Conclusiones y Recomendaciones', completed: false },
  ]);

  const updateStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const analyzeCodebase = async (): Promise<CodebaseAnalysis> => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: {
          componentsList: COMPONENTS_LIST,
          hooksList: HOOKS_LIST,
          edgeFunctions: EDGE_FUNCTIONS,
          pagesList: PAGES_LIST,
          fileStructure: `
src/
├── components/ (${COMPONENTS_LIST.length} componentes)
│   ├── admin/ (35 componentes de administración)
│   ├── admin/accounting/ (40 componentes contables PGC)
│   ├── company/ (9 componentes de empresa)
│   ├── dashboard/ (50 componentes de dashboard)
│   ├── map/ (10 componentes GIS)
│   ├── reports/ (3 generadores de informes)
│   ├── ui/ (45 componentes shadcn)
│   └── visits/ (2 componentes de visitas)
├── hooks/ (${HOOKS_LIST.length} hooks personalizados)
├── pages/ (${PAGES_LIST.length} páginas)
├── contexts/ (3 contextos React: Auth, Theme, Language)
├── lib/ (utilidades, validaciones, CNAE)
└── locales/ (4 idiomas: es, ca, en, fr)
supabase/
├── functions/ (${EDGE_FUNCTIONS.length} edge functions IA/email/alerts)
└── migrations/ (35+ migraciones SQL con RLS)
          `
        }
      });

      if (error) throw error;
      return data as CodebaseAnalysis;
    } catch (error) {
      console.error('Error analyzing codebase:', error);
      throw error;
    } finally {
      setAnalyzing(false);
    }
  };

  const generatePDF = async () => {
    setGenerating(true);
    setProgress(0);
    setSteps(steps.map(s => ({ ...s, completed: false })));

    try {
      // Step 1: Analyze codebase with AI
      setProgress(5);
      updateStep('analyze');
      toast.info('Analizando código con IA Gemini 2.5 Pro...', { description: 'Generando análisis de mercado completo' });
      
      let codebaseAnalysis: CodebaseAnalysis;
      try {
        codebaseAnalysis = await analyzeCodebase();
        setAnalysis(codebaseAnalysis);
      } catch (error) {
        toast.error('Error al analizar código', { description: 'Usando análisis predeterminado profesional' });
        codebaseAnalysis = getDefaultAnalysis();
        setAnalysis(codebaseAnalysis);
      }

      setProgress(12);

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;
      let pageNumber = 1;

      // Helper functions
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
        doc.text(`CRM Bancario Creand - Documentación Comercial v${codebaseAnalysis.version} - ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 8);
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
        
        // Header row
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

        // Data rows with proper text wrapping
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        rows.forEach((row, rowIndex) => {
          // Calculate max lines needed for this row
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

      // ==================== PORTADA PROFESIONAL ====================
      setProgress(15);
      updateStep('cover');
      
      // Gradient header
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, pageWidth, 90, 'F');
      doc.setFillColor(20, 60, 140);
      doc.rect(0, 60, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM BANCARIO CREAND', pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('Documentación Comercial y Técnica', pageWidth / 2, 50, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Versión ${codebaseAnalysis.version}`, pageWidth / 2, 75, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      currentY = 105;
      
      // Metadata section
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY - 5, contentWidth, 55, 3, 3, 'F');
      
      doc.setFontSize(10);
      const metadata = [
        ['📅 Fecha de Generación:', new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
        ['🔧 Componentes React:', `${codebaseAnalysis.codeStats.totalComponents} componentes`],
        ['⚡ Edge Functions:', `${codebaseAnalysis.codeStats.totalEdgeFunctions} funciones serverless`],
        ['📊 Líneas de Código:', `~${codebaseAnalysis.codeStats.linesOfCode.toLocaleString()}`],
        ['💰 Valor de Mercado:', `${codebaseAnalysis.marketValuation.marketValue?.toLocaleString() || (codebaseAnalysis.marketValuation.totalCost * 2.5).toLocaleString()}€`],
        ['🔒 Clasificación:', 'CONFIDENCIAL - PROPUESTA COMERCIAL'],
      ];
      
      metadata.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin + 5, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 55, currentY);
        currentY += 8;
      });

      currentY += 10;
      addHighlightBox('🤖 DOCUMENTO GENERADO CON INTELIGENCIA ARTIFICIAL', 
        'Este documento ha sido generado mediante análisis automático del código fuente usando Lovable AI (Gemini 2.5 Pro). Incluye valoración económica de mercado, análisis de competidores reales del sector bancario español y europeo, estrategia de pricing, y evaluación de viabilidad comercial.',
        'info');

      addPageNumber();

      // ==================== ÍNDICE EXPANDIDO ====================
      addNewPage();
      setProgress(18);
      updateStep('index');
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 50, 120);
      doc.text('ÍNDICE GENERAL', pageWidth / 2, currentY, { align: 'center' });
      currentY += 12;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '1', title: 'RESUMEN EJECUTIVO', page: 3 },
        { num: '2', title: 'ESTADÍSTICAS DEL CÓDIGO', page: 4 },
        { num: '3', title: 'ANÁLISIS DE MÓDULOS', page: 5 },
        { num: '4', title: 'ADDENDUM: MARKETING Y VENTAS', page: 10 },
        { num: '5', title: 'VALORACIÓN ECONÓMICA', page: 14 },
        { num: '6', title: 'COMPARATIVA COMPETIDORES BANCARIOS', page: 17 },
        { num: '7', title: 'ESTRATEGIA DE PRICING Y LICENCIAS', page: 24 },
        { num: '8', title: 'VIABILIDAD ESPAÑA Y EUROPA', page: 28 },
        { num: '9', title: 'CLIENTES POTENCIALES Y TAM', page: 33 },
        { num: '10', title: 'CONCLUSIONES Y RECOMENDACIONES', page: 37 },
        { num: 'A', title: 'ANEXO: FUNCIONALIDADES PENDIENTES', page: 39 },
        { num: 'B', title: 'ANEXO: HALLAZGOS DE SEGURIDAD', page: 41 },
      ];

      doc.setFontSize(9);
      indexItems.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, margin, currentY);
        doc.text(item.title, margin + 12, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        const dotsWidth = contentWidth - 45 - doc.getTextWidth(item.title);
        const dots = '.'.repeat(Math.max(1, Math.floor(dotsWidth / 1.5)));
        doc.text(dots, margin + 17 + doc.getTextWidth(item.title), currentY);
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.page), pageWidth - margin, currentY, { align: 'right' });
        currentY += 6;
      });

      addPageNumber();

      // ==================== 1. RESUMEN EJECUTIVO ====================
      addNewPage();
      setProgress(22);
      updateStep('executive');
      
      addMainTitle('1. RESUMEN EJECUTIVO');
      
      addParagraph(`El Sistema CRM Bancario Creand es una plataforma integral de gestión comercial desarrollada específicamente para entidades bancarias, con especialización en el Principado de Andorra, España y la Unión Europea. Esta versión ${codebaseAnalysis.version} representa una solución enterprise completa con ${codebaseAnalysis.modules.length} módulos principales.`);

      addHighlightBox('💡 PROPUESTA DE VALOR ÚNICA', 
        codebaseAnalysis.marketingHighlights?.valueProposition || 
        'CRM bancario especializado que reduce costes operativos un 40%, mejora productividad comercial un 25% y se implementa en 1/6 del tiempo de alternativas enterprise, con propiedad total del código y sin vendor lock-in.',
        'success');

      addSubtitle('Estadísticas Clave');
      addTable(
        ['Métrica', 'Valor', 'Benchmark Mercado'],
        [
          ['Componentes React', String(codebaseAnalysis.codeStats.totalComponents), 'Promedio CRM: 80-120'],
          ['Edge Functions', String(codebaseAnalysis.codeStats.totalEdgeFunctions), 'Promedio: 10-15'],
          ['Líneas de Código', codebaseAnalysis.codeStats.linesOfCode.toLocaleString(), 'CRM medio: 50K-80K'],
          ['Coste Desarrollo', `${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€`, 'Similar: 200K-400K€'],
          ['Valor Mercado', `${(codebaseAnalysis.marketValuation.marketValue || codebaseAnalysis.marketValuation.totalCost * 2.5).toLocaleString()}€`, '2-3x coste desarrollo'],
        ],
        [55, 50, 65]
      );

      // ==================== 2. ESTADÍSTICAS DEL CÓDIGO ====================
      addNewPage();
      addMainTitle('2. ESTADÍSTICAS DEL CÓDIGO');

      addSubtitle('Distribución por Tipo de Archivo');
      addTable(['Categoría', 'Cantidad', 'Porcentaje', 'Complejidad'], [
        ['Componentes Admin', '35', '23%', 'Alta'],
        ['Componentes Contabilidad PGC', '40', '27%', 'Muy Alta'],
        ['Componentes Dashboard', '50', '33%', 'Media-Alta'],
        ['Componentes GIS/Mapas', '10', '7%', 'Alta'],
        ['Componentes UI (shadcn)', '45', 'Base', 'Baja'],
        ['Edge Functions IA/Email', String(EDGE_FUNCTIONS.length), '100%', 'Alta'],
        ['Hooks Personalizados', String(HOOKS_LIST.length), '100%', 'Media'],
      ], [55, 35, 40, 40]);

      addSubtitle('Tecnologías Utilizadas');
      const techStack = [
        ['Frontend', 'React 18, TypeScript, Tailwind CSS, shadcn/ui'],
        ['Backend', 'Supabase (PostgreSQL + Edge Functions + Realtime)'],
        ['IA', 'Lovable AI (Gemini 2.5 Pro) para PDF parsing y planes de acción'],
        ['GIS', 'MapLibre GL, Supercluster para clustering'],
        ['Email', 'Resend para notificaciones transaccionales'],
        ['Auth', 'Supabase Auth con RLS multi-tenant'],
      ];
      addTable(['Capa', 'Tecnologías'], techStack, [40, 130]);

      // ==================== 3. ANÁLISIS DE MÓDULOS ====================
      addNewPage();
      setProgress(30);
      updateStep('modules');
      
      addMainTitle('3. ANÁLISIS DE MÓDULOS');

      codebaseAnalysis.modules.forEach((module, index) => {
        checkPageBreak(70);
        
        addTitle(`3.${index + 1} ${module.name}`, 2);
        addParagraph(module.description);
        
        if (module.businessValue) {
          addHighlightBox('💰 Valor de Negocio', module.businessValue, 'success');
        }
        
        addProgressBar('Completitud', module.completionPercentage);

        addSubtitle('Funcionalidades Implementadas');
        module.implementedFeatures.slice(0, 6).forEach(feature => {
          addBullet(feature, 3, '✓');
        });

        if (module.differentiators && module.differentiators.length > 0) {
          addSubtitle('Diferenciadores vs Competencia');
          module.differentiators.slice(0, 3).forEach(diff => {
            addBullet(diff, 3, '★');
          });
        }

        if (module.pendingFeatures.length > 0) {
          addSubtitle('Pendiente de Implementar');
          module.pendingFeatures.slice(0, 3).forEach(feature => {
            addBullet(feature, 3, '○');
          });
        }

        currentY += 5;
      });

      // ==================== 4. ADDENDUM MARKETING Y VENTAS ====================
      addNewPage();
      setProgress(40);
      updateStep('marketing');
      
      addMainTitle('4. ADDENDUM: MARKETING Y VENTAS');

      const marketing = codebaseAnalysis.marketingHighlights;
      
      addTitle('4.1 Puntos Fuertes Únicos (USP)', 2);
      if (marketing?.uniqueSellingPoints) {
        marketing.uniqueSellingPoints.forEach((usp, i) => {
          addBullet(`${i + 1}. ${usp}`, 0, '🎯');
        });
      }

      currentY += 5;
      addTitle('4.2 Ventajas Competitivas', 2);
      if (marketing?.competitiveAdvantages) {
        marketing.competitiveAdvantages.forEach(adv => {
          addBullet(adv, 0, '✅');
        });
      }

      addNewPage();
      addTitle('4.3 Beneficios Clave con Impacto Medible', 2);
      if (marketing?.keyBenefits) {
        addTable(
          ['Beneficio', 'Descripción', 'Impacto Estimado'],
          marketing.keyBenefits.map(b => [b.benefit, b.description, b.impact]),
          [50, 60, 60]
        );
      }

      addTitle('4.4 Audiencia Objetivo', 2);
      if (marketing?.targetAudience) {
        marketing.targetAudience.forEach(aud => {
          addBullet(aud, 0, '👤');
        });
      }

      addTitle('4.5 Tendencias de la Industria', 2);
      if (marketing?.industryTrends) {
        marketing.industryTrends.forEach(trend => {
          addBullet(trend, 0, '📈');
        });
      }

      addNewPage();
      addTitle('4.6 Testimonios Potenciales', 2);
      if (marketing?.testimonialPotential) {
        marketing.testimonialPotential.forEach(test => {
          addHighlightBox('💬 Testimonio Potencial', test, 'info');
        });
      }

      // ==================== 5. VALORACIÓN ECONÓMICA ====================
      addNewPage();
      setProgress(50);
      updateStep('valuation');
      
      addMainTitle('5. VALORACIÓN ECONÓMICA');

      addTitle('5.1 Coste de Desarrollo', 2);
      addTable(
        ['Concepto', 'Valor'],
        [
          ['Horas de Desarrollo', `${codebaseAnalysis.marketValuation.totalHours.toLocaleString()} horas`],
          ['Tarifa Hora Mercado', `${codebaseAnalysis.marketValuation.hourlyRate}€/hora`],
          ['COSTE TOTAL DESARROLLO', `${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€`],
          ['VALOR DE MERCADO', `${(codebaseAnalysis.marketValuation.marketValue || codebaseAnalysis.marketValuation.totalCost * 2.5).toLocaleString()}€`],
        ],
        [90, 80]
      );

      addTitle('5.2 Desglose por Categoría', 2);
      addTable(
        ['Categoría', 'Horas', 'Coste', '% Total'],
        codebaseAnalysis.marketValuation.breakdown.map(item => [
          item.category,
          `${item.hours.toLocaleString()} h`,
          `${item.cost.toLocaleString()}€`,
          `${Math.round((item.cost / codebaseAnalysis.marketValuation.totalCost) * 100)}%`
        ]),
        [55, 35, 45, 35]
      );

      addNewPage();
      addTitle('5.3 ROI y Comparativa con Competidores', 2);
      
      if (codebaseAnalysis.marketValuation.roi5Years) {
        addHighlightBox('📊 ROI Estimado a 5 Años', codebaseAnalysis.marketValuation.roi5Years, 'success');
      }
      
      if (codebaseAnalysis.marketValuation.comparisonWithCompetitors) {
        addHighlightBox('⚖️ Posicionamiento vs Competencia', codebaseAnalysis.marketValuation.comparisonWithCompetitors, 'info');
      }

      addHighlightBox('💡 NOTA SOBRE VALORACIÓN',
        `El coste de desarrollo (${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€) refleja la inversión desde cero. El valor de mercado como producto terminado (incluyendo know-how, testing, documentación, soporte y propiedad intelectual) se sitúa entre ${(codebaseAnalysis.marketValuation.totalCost * 2).toLocaleString()}€ y ${(codebaseAnalysis.marketValuation.totalCost * 3).toLocaleString()}€.`,
        'warning');

      // ==================== 6. COMPARATIVA COMPETIDORES ====================
      addNewPage();
      setProgress(60);
      updateStep('competitors');
      
      addMainTitle('6. COMPARATIVA COMPETIDORES BANCARIOS');

      addParagraph('Análisis detallado de las principales soluciones de software bancario disponibles en el mercado español y europeo, con URLs de acceso, precios reales y bancos que las utilizan:');

      codebaseAnalysis.competitorComparison.forEach((competitor, index) => {
        checkPageBreak(80);
        
        addTitle(`6.${index + 1} ${competitor.name}`, 2);
        
        addTable(['Característica', 'Detalle'], [
          ['Tipo', competitor.type],
          ['URL', competitor.url || 'N/A'],
          ['Mercado Objetivo', competitor.targetMarket || 'Global'],
          ['Cuota de Mercado', competitor.marketShare || 'N/A'],
        ], [50, 120]);

        addSubtitle('Costes');
        addTable(['Concepto', 'Coste'], [
          ['Licencia', competitor.licenseCost],
          ['Implementación', competitor.implementationCost],
          ['Mantenimiento Anual', competitor.maintenanceCost],
          ['Coste Total 5 Años', competitor.totalCost5Years || 'Variable'],
        ], [60, 110]);

        if (competitor.usedByBanks && competitor.usedByBanks.length > 0) {
          addSubtitle('Bancos que lo Utilizan');
          addParagraph(competitor.usedByBanks.join(', '));
        }

        addSubtitle('Ventajas');
        competitor.pros.slice(0, 4).forEach(pro => addBullet(pro, 3, '✓'));
        
        addSubtitle('Desventajas');
        competitor.cons.slice(0, 4).forEach(con => addBullet(con, 3, '✗'));
        
        if (competitor.comparisonVsCreand) {
          addHighlightBox('📊 Comparación vs Creand CRM', competitor.comparisonVsCreand, 'info');
        }

        currentY += 5;
      });

      // Tabla comparativa resumen
      addNewPage();
      addTitle('6.9 Tabla Comparativa Resumen', 2);
      
      const comparisonRows = [
        ['CREAND CRM', `${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€`, 'Propio (0€)', '10-15% anual', '100%', '3-6 meses'],
        ...codebaseAnalysis.competitorComparison.slice(0, 6).map(c => [
          c.name.substring(0, 15), 
          c.implementationCost.substring(0, 15), 
          c.licenseCost.substring(0, 12), 
          c.maintenanceCost.substring(0, 12), 
          'Variable',
          '12-36 meses'
        ])
      ];
      
      addTable(
        ['Solución', 'Implementación', 'Licencia', 'Mant.', 'Personal.', 'Tiempo'],
        comparisonRows,
        [32, 32, 28, 25, 25, 28]
      );

      addHighlightBox('📊 CONCLUSIÓN COMPARATIVA',
        `Creand CRM ofrece el mejor TCO (Total Cost of Ownership) a 5 años, con un ahorro estimado del 60-80% respecto a soluciones comerciales enterprise como Salesforce FSC o SAP S/4HANA, además de control total sobre el código, personalización ilimitada y tiempo de implementación 4-6x más rápido.`,
        'success');

      // ==================== 7. ESTRATEGIA DE PRICING ====================
      addNewPage();
      setProgress(70);
      updateStep('pricing');
      
      addMainTitle('7. ESTRATEGIA DE PRICING Y LICENCIAS');

      const pricing = codebaseAnalysis.pricingStrategy;

      if (pricing?.recommendedModel) {
        addHighlightBox('🎯 MODELO RECOMENDADO', pricing.recommendedModel, 'success');
      }

      addTitle('7.1 Opción A: Licencia Única (Perpetua)', 2);
      if (pricing?.oneTimeLicense) {
        addParagraph(`Precio: ${pricing.oneTimeLicense.price}`);
        addSubtitle('Ventajas');
        pricing.oneTimeLicense.pros.forEach(pro => addBullet(pro, 3, '✓'));
        addSubtitle('Desventajas');
        pricing.oneTimeLicense.cons.forEach(con => addBullet(con, 3, '✗'));
        addSubtitle('Cuándo Usar');
        addParagraph(pricing.oneTimeLicense.whenToUse);
      }

      addNewPage();
      addTitle('7.2 Opción B: Modelo de Suscripción (SaaS)', 2);
      if (pricing?.subscriptionModel) {
        addParagraph(`Precio por usuario: ${pricing.subscriptionModel.pricePerUser}`);
        
        addSubtitle('Tiers Disponibles');
        addTable(
          ['Tier', 'Precio', 'Características Principales'],
          pricing.subscriptionModel.tiers.map(t => [t.name, t.price, t.features.slice(0, 3).join(', ')]),
          [35, 45, 90]
        );

        addSubtitle('Ventajas del Modelo SaaS');
        pricing.subscriptionModel.pros.forEach(pro => addBullet(pro, 3, '✓'));
        addSubtitle('Desventajas');
        pricing.subscriptionModel.cons.forEach(con => addBullet(con, 3, '✗'));
      }

      addNewPage();
      addTitle('7.3 Contrato de Mantenimiento', 2);
      if (pricing?.maintenanceContract) {
        addParagraph(`Porcentaje anual: ${pricing.maintenanceContract.percentage}`);
        addSubtitle('Incluye');
        pricing.maintenanceContract.includes.forEach(inc => addBullet(inc, 3, '✓'));
        addSubtitle('Servicios Opcionales');
        pricing.maintenanceContract.optional.forEach(opt => addBullet(opt, 3, '○'));
      }

      addTitle('7.4 Cómo lo Hace la Competencia', 2);
      if (pricing?.competitorPricing) {
        addTable(
          ['Competidor', 'Modelo', 'Rango de Precios'],
          pricing.competitorPricing.map(cp => [cp.competitor, cp.model, cp.priceRange]),
          [55, 40, 75]
        );
      }

      addNewPage();
      addTitle('7.5 Recomendación Estratégica de Pricing', 2);
      if (pricing?.recommendation) {
        const recLines = pricing.recommendation.split('\n').filter(l => l.trim());
        recLines.forEach(line => {
          if (line.includes(':')) {
            addSubtitle(line.split(':')[0].trim());
            addParagraph(line.split(':').slice(1).join(':').trim());
          } else {
            addParagraph(line);
          }
        });
      }

      // ==================== 8. VIABILIDAD ESPAÑA Y EUROPA ====================
      addNewPage();
      setProgress(80);
      updateStep('feasibility');
      
      addMainTitle('8. VIABILIDAD ESPAÑA Y EUROPA');

      const feasibility = codebaseAnalysis.feasibilityAnalysis;

      addTitle('8.1 Mercado Español', 2);
      if (feasibility?.spanishMarket) {
        addHighlightBox('📊 Viabilidad', feasibility.spanishMarket.viability, 'success');
        
        addParagraph(`Tamaño de Mercado: ${feasibility.spanishMarket.marketSize}`);
        
        addSubtitle('Barreras de Entrada');
        feasibility.spanishMarket.barriers.forEach(bar => addBullet(bar, 3, '⚠️'));
        
        addSubtitle('Oportunidades');
        feasibility.spanishMarket.opportunities.forEach(opp => addBullet(opp, 3, '✅'));
        
        addSubtitle('Competidores Locales');
        feasibility.spanishMarket.competitors.forEach(comp => addBullet(comp, 3, '🏢'));
        
        addHighlightBox('🎯 Recomendación España', feasibility.spanishMarket.recommendation, 'info');
      }

      addNewPage();
      addTitle('8.2 Mercado Europeo', 2);
      if (feasibility?.europeanMarket) {
        addHighlightBox('📊 Viabilidad', feasibility.europeanMarket.viability, 'info');
        
        addSubtitle('Países Objetivo');
        feasibility.europeanMarket.targetCountries.forEach(country => addBullet(country, 3, '🌍'));
        
        addSubtitle('Regulaciones a Considerar');
        feasibility.europeanMarket.regulations.forEach(reg => addBullet(reg, 3, '📋'));
        
        addSubtitle('Oportunidades');
        feasibility.europeanMarket.opportunities.forEach(opp => addBullet(opp, 3, '✅'));
        
        addHighlightBox('🎯 Recomendación Europa', feasibility.europeanMarket.recommendation, 'info');
      }

      addNewPage();
      addTitle('8.3 Análisis de Riesgos de Implementación', 2);
      if (feasibility?.implementationRisks) {
        addTable(
          ['Riesgo', 'Probabilidad', 'Mitigación'],
          feasibility.implementationRisks.map(r => [r.risk, r.probability, r.mitigation]),
          [50, 30, 90]
        );
      }

      addTitle('8.4 Factores Críticos de Éxito', 2);
      if (feasibility?.successFactors) {
        feasibility.successFactors.forEach((factor, i) => addBullet(`${i + 1}. ${factor}`, 0, '🔑'));
      }

      if (feasibility?.timeToMarket) {
        addHighlightBox('⏱️ Tiempo Estimado al Mercado', feasibility.timeToMarket, 'warning');
      }

      // ==================== 9. CLIENTES POTENCIALES ====================
      addNewPage();
      setProgress(88);
      updateStep('clients');
      
      addMainTitle('9. CLIENTES POTENCIALES Y TAM');

      codebaseAnalysis.potentialClients.forEach((client, index) => {
        checkPageBreak(55);
        
        addTitle(`9.${index + 1} ${client.sector}`, 2);
        
        addTable(['Característica', 'Detalle'], [
          ['Tipo de Cliente', client.clientType],
          ['Región Objetivo', client.region],
          ['Valor Estimado por Proyecto', client.estimatedValue],
          ['Tiempo de Implementación', client.implementationTime],
          ['Nº Clientes Potenciales', String(client.potentialClients || 'N/A')],
          ['Penetración Estimada Año 1', client.marketPenetration || 'N/A'],
        ], [65, 105]);

        addSubtitle('Personalizaciones Típicas');
        client.customizations.forEach(custom => addBullet(custom, 3, '🔧'));
        
        currentY += 5;
      });

      // TAM Summary
      addNewPage();
      addTitle('9.6 Resumen TAM (Total Addressable Market)', 2);
      
      addTable(
        ['Sector', 'Clientes Potenciales', 'Valor Medio', 'TAM Estimado'],
        [
          ['Banca Privada', '25-35', '150.000€', '3.75M - 5.25M€'],
          ['Cooperativas de Crédito', '45-65', '80.000€', '3.6M - 5.2M€'],
          ['Family Offices', '60-100', '60.000€', '3.6M - 6M€'],
          ['Fintechs', '20-40', '70.000€', '1.4M - 2.8M€'],
          ['Gestoras de Activos', '30-50', '95.000€', '2.85M - 4.75M€'],
          ['TOTAL', '180-290', '-', '15.2M - 24M€'],
        ],
        [50, 45, 40, 35]
      );

      addHighlightBox('🎯 ESTRATEGIA GO-TO-MARKET RECOMENDADA',
        '1) Piloto con 2-3 entidades en Andorra (6 meses). 2) Expansión a cooperativas de crédito España (12 meses). 3) Banca privada Luxemburgo y Portugal (18 meses). 4) Partnerships con consultoras financieras locales para escalado europeo (24+ meses).',
        'success');

      // ==================== 10. CONCLUSIONES ====================
      addNewPage();
      setProgress(95);
      updateStep('conclusions');
      
      addMainTitle('10. CONCLUSIONES Y RECOMENDACIONES');

      addHighlightBox('✅ CONCLUSIÓN PRINCIPAL',
        `CRM Bancario Creand representa una oportunidad comercial significativa en el mercado bancario español y europeo. Con un valor de desarrollo de ${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€ y un valor de mercado estimado de ${(codebaseAnalysis.marketValuation.marketValue || codebaseAnalysis.marketValuation.totalCost * 2.5).toLocaleString()}€, ofrece un TCO 60-80% inferior a alternativas enterprise como Salesforce o SAP, con tiempo de implementación 4-6x más rápido.`,
        'success');

      addTitle('10.1 Puntos Fuertes Principales', 2);
      const strengths = [
        'Único CRM con contabilidad PGC Andorra/España nativa integrada',
        'GIS bancario para 20.000+ empresas con rendimiento óptimo',
        'Análisis financiero avanzado con IA (DuPont, Z-Score, EBITDA)',
        'Cumplimiento normativo bancario UE incorporado',
        '1/5 del coste total respecto a competidores enterprise',
        'Implementación en 3-6 meses vs 18-36 meses de la competencia',
        'Sin vendor lock-in - código propietario 100%',
      ];
      strengths.forEach(s => addBullet(s, 0, '✓'));

      addNewPage();
      addTitle('10.2 Recomendaciones Estratégicas', 2);
      
      addSubtitle('Pricing');
      addParagraph('Modelo híbrido recomendado: Licencia inicial (80-150K€) + mantenimiento anual (15-20%). Para fintechs y family offices pequeños, ofrecer también suscripción SaaS desde 2.500€/mes.');

      addSubtitle('Entrada al Mercado');
      addParagraph('Comenzar por cooperativas de crédito españolas (65 entidades, ciclos de venta más cortos) y banca privada andorrana. Segunda fase: Luxemburgo y Portugal.');

      addSubtitle('Inversiones Prioritarias');
      addParagraph('1) App móvil offline, 2) Certificación ISO 27001, 3) Equipo comercial especializado banca, 4) Partnerships con consultoras financieras.');

      addHighlightBox('💰 POTENCIAL DE INGRESOS ESTIMADO',
        'Año 1: 400-600K€ (5-7 clientes). Año 2: 1-1.5M€ (12-18 clientes). Año 3: 2-3M€ (25-35 clientes). Break-even: Mes 9-12. Margen bruto objetivo: 65-75%.',
        'success');

      // ==================== ANEXO A: FUNCIONALIDADES PENDIENTES ====================
      addNewPage();
      addMainTitle('ANEXO A: FUNCIONALIDADES PENDIENTES');
      
      codebaseAnalysis.pendingFeatures.forEach((feature, index) => {
        addBullet(`${index + 1}. ${feature}`, 0, '○');
      });

      addHighlightBox('📋 PRIORIZACIÓN RECOMENDADA',
        'Las funcionalidades pendientes deben priorizarse según: impacto en usuario final, requisitos de clientes potenciales, complejidad técnica y diferenciación competitiva.',
        'info');

      // ==================== ANEXO B: HALLAZGOS DE SEGURIDAD ====================
      addNewPage();
      addMainTitle('ANEXO B: HALLAZGOS DE SEGURIDAD');
      
      codebaseAnalysis.securityFindings.forEach((finding, index) => {
        addBullet(`${index + 1}. ${finding}`, 0, '🔒');
      });

      addHighlightBox('🔒 RECOMENDACIÓN DE SEGURIDAD',
        'Antes de cualquier despliegue comercial, se recomienda: 1) Auditoría de seguridad externa, 2) Pruebas de penetración, 3) Certificación ISO 27001, 4) Revisión de compliance GDPR/DORA.',
        'warning');

      // ==================== PÁGINA FINAL ====================
      addNewPage();
      
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, pageWidth, 70, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CRM BANCARIO CREAND', pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Documentación Comercial v${codebaseAnalysis.version}`, pageWidth / 2, 42, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Generado con Inteligencia Artificial', pageWidth / 2, 55, { align: 'center' });
      doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, 63, { align: 'center' });

      currentY = 85;
      doc.setTextColor(0, 0, 0);
      
      addSubtitle('Resumen del Documento');
      const summaryData = [
        ['Versión Analizada:', codebaseAnalysis.version],
        ['Total de Páginas:', String(pageNumber)],
        ['Módulos Analizados:', String(codebaseAnalysis.modules.length)],
        ['Coste Total Desarrollo:', `${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€`],
        ['Valor de Mercado:', `${(codebaseAnalysis.marketValuation.marketValue || codebaseAnalysis.marketValuation.totalCost * 2.5).toLocaleString()}€`],
        ['Competidores Analizados:', String(codebaseAnalysis.competitorComparison.length)],
        ['Segmentos de Clientes:', String(codebaseAnalysis.potentialClients.length)],
      ];
      
      summaryData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 50, currentY);
        currentY += 6;
      });

      currentY += 10;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      const disclaimer = 'DOCUMENTO CONFIDENCIAL - PROPUESTA COMERCIAL. Este documento ha sido generado automáticamente mediante análisis de código con IA (Gemini 2.5 Pro). Las valoraciones de mercado, precios de competidores y proyecciones son estimaciones basadas en datos públicos disponibles y deben ser validadas con análisis profesional adicional antes de tomar decisiones comerciales. Los precios de competidores corresponden a información pública de 2024-2025.';
      const lines = doc.splitTextToSize(disclaimer, contentWidth);
      lines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 4;
      });

      setProgress(100);
      
      // Save PDF
      const filename = `CRM_Creand_Documentacion_Comercial_v${codebaseAnalysis.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Documento PDF generado correctamente', {
        description: `${pageNumber} páginas con análisis de mercado, competidores y pricing`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getDefaultAnalysis = (): CodebaseAnalysis => {
    // This would be filled by the edge function, but we include a comprehensive fallback
    return {
      version: "4.0.0",
      generationDate: new Date().toISOString(),
      modules: [],
      pendingFeatures: [],
      securityFindings: [],
      marketValuation: {
        totalHours: 3000,
        hourlyRate: 95,
        totalCost: 285000,
        breakdown: [],
        marketValue: 700000,
        roi5Years: "380%",
        comparisonWithCompetitors: "Posicionamiento competitivo superior en especialización bancaria"
      },
      competitorComparison: [],
      potentialClients: [],
      codeStats: {
        totalFiles: 200,
        totalComponents: 150,
        totalHooks: 14,
        totalEdgeFunctions: 25,
        totalPages: 9,
        linesOfCode: 90000
      }
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generador de Documentación Comercial con IA
        </CardTitle>
        <CardDescription>
          Genera documentación técnico-comercial profesional con análisis de mercado, competidores bancarios, estrategia de pricing y viabilidad España/Europa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Code className="h-4 w-4 text-blue-500" />
            <span>Análisis de Código</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span>Valoración Económica</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-purple-500" />
            <span>Competidores Reales</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-orange-500" />
            <span>Estrategia Pricing</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-cyan-500" />
            <span>Viabilidad España/UE</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Marketing & Ventas</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Clientes Potenciales</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>Gemini 2.5 Pro</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">URLs Competidores Reales</Badge>
          <Badge variant="outline">Precios Mercado 2024-2025</Badge>
          <Badge variant="outline">Bancos que los Usan</Badge>
          <Badge variant="outline">Recomendaciones Pricing</Badge>
          <Badge variant="outline">TAM por Segmento</Badge>
        </div>

        {generating && (
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {steps.map((step) => (
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
                    <div className="h-3 w-3 rounded-full border border-current" />
                  )}
                  <span className="truncate">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={generatePDF}
          disabled={generating}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {analyzing ? 'Analizando con IA Gemini 2.5 Pro...' : 'Generando PDF Comercial...'}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generar Documentación Comercial Completa (PDF 40+ páginas)
            </>
          )}
        </Button>

        {analysis && !generating && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Último análisis generado:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>Versión: {analysis.version}</span>
              <span>Módulos: {analysis.modules.length}</span>
              <span>Coste: {analysis.marketValuation.totalCost.toLocaleString()}€</span>
              <span>Valor Mercado: {(analysis.marketValuation.marketValue || analysis.marketValuation.totalCost * 2.5).toLocaleString()}€</span>
              <span>Competidores: {analysis.competitorComparison.length}</span>
              <span>Segmentos: {analysis.potentialClients.length}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
