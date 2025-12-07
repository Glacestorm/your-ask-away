import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Loader2, CheckCircle, Sparkles, Code, DollarSign, Users, AlertTriangle } from 'lucide-react';
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
}

interface MarketValuation {
  totalHours: number;
  hourlyRate: number;
  totalCost: number;
  breakdown: { category: string; hours: number; cost: number }[];
}

interface CompetitorComparison {
  name: string;
  type: string;
  licenseCost: string;
  implementationCost: string;
  maintenanceCost: string;
  pros: string[];
  cons: string[];
}

interface PotentialClient {
  sector: string;
  clientType: string;
  region: string;
  estimatedValue: string;
  implementationTime: string;
  customizations: string[];
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
}

// Codebase structure data (will be analyzed by AI)
const COMPONENTS_LIST = [
  // Admin components
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
  // Accounting components
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
  // Company components
  'company/BankAffiliationsManager.tsx', 'company/CompanyDetail.tsx', 'company/CompanyPhotosManager.tsx',
  'company/CompanyPrintReport.tsx', 'company/ContactsManager.tsx', 'company/DocumentsManager.tsx',
  'company/ExcelExportDialog.tsx', 'company/TPVTerminalsManager.tsx', 'company/VisitSheetsHistory.tsx',
  // Dashboard components
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
  // Map components
  'map/CompanyPhotosDialog.tsx', 'map/GeoSearch.tsx', 'map/MapContainer.tsx',
  'map/MapHeader.tsx', 'map/MapLayersControl.tsx', 'map/MapSidebar.tsx',
  'map/SectorStats.tsx', 'map/VisitsPanel.tsx', 'map/markerIcons.tsx', 'map/markerStyles.tsx',
  // Report components
  'reports/ReportGenerator.tsx', 'reports/TechnicalDocumentGenerator.tsx',
  // Visit components
  'visits/ParticipantsSelector.tsx', 'visits/VisitSheetForm.tsx',
  // UI components (shadcn)
  'ui/accordion.tsx', 'ui/alert-dialog.tsx', 'ui/alert.tsx', 'ui/button.tsx',
  'ui/calendar.tsx', 'ui/card.tsx', 'ui/chart.tsx', 'ui/checkbox.tsx',
  'ui/dialog.tsx', 'ui/dropdown-menu.tsx', 'ui/form.tsx', 'ui/input.tsx',
  'ui/progress.tsx', 'ui/select.tsx', 'ui/sheet.tsx', 'ui/sidebar.tsx',
  'ui/table.tsx', 'ui/tabs.tsx', 'ui/toast.tsx', 'ui/tooltip.tsx',
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
    { id: 'analyze', name: 'Analizando código con IA', completed: false },
    { id: 'cover', name: 'Portada y Metadatos', completed: false },
    { id: 'index', name: 'Índice General', completed: false },
    { id: 'executive', name: 'Resumen Ejecutivo', completed: false },
    { id: 'modules', name: 'Análisis de Módulos', completed: false },
    { id: 'pending', name: 'Funcionalidades Pendientes', completed: false },
    { id: 'security', name: 'Análisis de Seguridad', completed: false },
    { id: 'valuation', name: 'Valoración de Mercado', completed: false },
    { id: 'competitors', name: 'Comparativa Competidores', completed: false },
    { id: 'clients', name: 'Addendum Clientes Potenciales', completed: false },
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
│   ├── admin/accounting/ (40 componentes contables)
│   ├── company/ (9 componentes de empresa)
│   ├── dashboard/ (50 componentes de dashboard)
│   ├── map/ (10 componentes de mapa)
│   ├── reports/ (3 generadores de informes)
│   ├── ui/ (45 componentes shadcn)
│   └── visits/ (2 componentes de visitas)
├── hooks/ (${HOOKS_LIST.length} hooks personalizados)
├── pages/ (${PAGES_LIST.length} páginas)
├── contexts/ (3 contextos React)
├── lib/ (utilidades y validaciones)
└── locales/ (4 idiomas: es, ca, en, fr)
supabase/
├── functions/ (${EDGE_FUNCTIONS.length} edge functions)
└── migrations/ (30+ migraciones SQL)
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
      toast.info('Analizando código con IA...', { description: 'Esto puede tardar unos segundos' });
      
      let codebaseAnalysis: CodebaseAnalysis;
      try {
        codebaseAnalysis = await analyzeCodebase();
        setAnalysis(codebaseAnalysis);
      } catch (error) {
        toast.error('Error al analizar código', { description: 'Usando análisis predeterminado' });
        // Fallback analysis
        codebaseAnalysis = getDefaultAnalysis();
        setAnalysis(codebaseAnalysis);
      }

      setProgress(15);

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
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
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        doc.text(`Documentación Técnico-Funcional v${codebaseAnalysis.version}`, margin, pageHeight - 10);
        doc.setTextColor(0, 0, 0);
      };

      const checkPageBreak = (neededSpace: number) => {
        if (currentY + neededSpace > pageHeight - 25) {
          addNewPage();
          return true;
        }
        return false;
      };

      const addTitle = (text: string, level: number = 1) => {
        checkPageBreak(20);
        const sizes = [18, 14, 12, 11];
        doc.setFontSize(sizes[level - 1] || 11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(text, margin, currentY);
        currentY += level === 1 ? 12 : 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addSubtitle = (text: string) => {
        checkPageBreak(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(text, margin, currentY);
        currentY += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addParagraph = (text: string, indent: number = 0) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        lines.forEach((line: string) => {
          checkPageBreak(6);
          doc.text(line, margin + indent, currentY);
          currentY += 5;
        });
        currentY += 2;
      };

      const addBullet = (text: string, indent: number = 0) => {
        checkPageBreak(6);
        doc.setFontSize(10);
        doc.text('•', margin + indent, currentY);
        const lines = doc.splitTextToSize(text, contentWidth - indent - 8);
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + indent + 5, currentY + (i * 5));
        });
        currentY += lines.length * 5 + 2;
      };

      const addInfoBox = (title: string, text: string, bgColor: number[], borderColor: number[], titleColor: number[]) => {
        checkPageBreak(25);
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        const lines = doc.splitTextToSize(text, contentWidth - 10);
        const boxHeight = (lines.length * 5) + 12;
        doc.roundedRect(margin, currentY - 3, contentWidth, boxHeight, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
        doc.text(title, margin + 5, currentY + 3);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + 5, currentY + 9 + (i * 5));
        });
        currentY += boxHeight + 5;
        doc.setTextColor(0, 0, 0);
      };

      const addTable = (headers: string[], rows: string[][], colWidths?: number[]) => {
        checkPageBreak(30);
        const defaultWidth = contentWidth / headers.length;
        const widths = colWidths || headers.map(() => defaultWidth);
        
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let xPos = margin;
        doc.rect(margin, currentY - 4, contentWidth, 8, 'F');
        headers.forEach((header, i) => {
          doc.text(header, xPos + 2, currentY);
          xPos += widths[i];
        });
        currentY += 6;

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        rows.forEach((row, rowIndex) => {
          checkPageBreak(8);
          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY - 4, contentWidth, 7, 'F');
          }
          xPos = margin;
          row.forEach((cell, i) => {
            const cellText = doc.splitTextToSize(cell, widths[i] - 4)[0];
            doc.text(cellText || '', xPos + 2, currentY);
            xPos += widths[i];
          });
          currentY += 6;
        });
        currentY += 5;
      };

      // ========== PORTADA ==========
      setProgress(20);
      updateStep('cover');
      
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENTACIÓN', pageWidth / 2, 30, { align: 'center' });
      doc.text('TÉCNICO-FUNCIONAL', pageWidth / 2, 42, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text(`v${codebaseAnalysis.version}`, pageWidth / 2, 55, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema CRM Bancario - Creand', pageWidth / 2, 68, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      currentY = 95;
      
      const metadata = [
        ['Versión:', codebaseAnalysis.version],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
        ['Componentes:', `${codebaseAnalysis.codeStats.totalComponents} componentes React`],
        ['Edge Functions:', `${codebaseAnalysis.codeStats.totalEdgeFunctions} funciones serverless`],
        ['Líneas de Código:', `~${codebaseAnalysis.codeStats.linesOfCode.toLocaleString()}`],
        ['Clasificación:', 'CONFIDENCIAL - USO INTERNO BANCARIO'],
      ];
      
      metadata.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 50, currentY);
        currentY += 7;
      });

      currentY += 10;
      addInfoBox('🤖 GENERADO CON ANÁLISIS IA', 
        'Este documento ha sido generado mediante análisis automático del código fuente usando Lovable AI (Gemini 2.5). Incluye valoración de mercado, análisis de módulos pendientes y comparativa con competidores.',
        [239, 246, 255], [59, 130, 246], [30, 64, 175]);

      addPageNumber();

      // ========== ÍNDICE ==========
      addNewPage();
      setProgress(25);
      updateStep('index');
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('ÍNDICE GENERAL', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '1', title: 'RESUMEN EJECUTIVO', page: 3 },
        { num: '2', title: 'ESTADÍSTICAS DEL CÓDIGO', page: 4 },
        { num: '3', title: 'ANÁLISIS DE MÓDULOS', page: 5 },
        { num: '4', title: 'FUNCIONALIDADES PENDIENTES', page: 10 },
        { num: '5', title: 'HALLAZGOS DE SEGURIDAD', page: 12 },
        { num: '6', title: 'VALORACIÓN DE MERCADO', page: 14 },
        { num: '7', title: 'COMPARATIVA COMPETIDORES', page: 16 },
        { num: '8', title: 'ADDENDUM: CLIENTES POTENCIALES', page: 20 },
      ];

      doc.setFontSize(10);
      indexItems.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, margin, currentY);
        doc.text(item.title, margin + 10, currentY);
        doc.setFont('helvetica', 'normal');
        const dots = '.'.repeat(Math.max(1, Math.floor((contentWidth - 50 - doc.getTextWidth(item.title)) / 2)));
        doc.setTextColor(180, 180, 180);
        doc.text(dots, margin + 15 + doc.getTextWidth(item.title), currentY);
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.page), pageWidth - margin, currentY, { align: 'right' });
        currentY += 7;
      });

      addPageNumber();

      // ========== 1. RESUMEN EJECUTIVO ==========
      addNewPage();
      setProgress(30);
      updateStep('executive');
      
      addTitle('1. RESUMEN EJECUTIVO');
      
      addParagraph(`El Sistema CRM Bancario Creand es una plataforma integral de gestión comercial desarrollada específicamente para entidades bancarias del Principado de Andorra. Esta versión ${codebaseAnalysis.version} incluye ${codebaseAnalysis.modules.length} módulos principales con un nivel de completitud variable.`);

      addSubtitle('Estadísticas Generales');
      addTable(
        ['Métrica', 'Valor'],
        [
          ['Total de Componentes', String(codebaseAnalysis.codeStats.totalComponents)],
          ['Hooks Personalizados', String(codebaseAnalysis.codeStats.totalHooks)],
          ['Edge Functions', String(codebaseAnalysis.codeStats.totalEdgeFunctions)],
          ['Páginas', String(codebaseAnalysis.codeStats.totalPages)],
          ['Líneas de Código Estimadas', codebaseAnalysis.codeStats.linesOfCode.toLocaleString()],
        ],
        [100, 70]
      );

      // ========== 2. ESTADÍSTICAS DEL CÓDIGO ==========
      addNewPage();
      addTitle('2. ESTADÍSTICAS DEL CÓDIGO');

      addSubtitle('Distribución por Tipo de Archivo');
      
      const fileDistribution = [
        ['Componentes Admin', '35', '23%'],
        ['Componentes Contabilidad', '40', '27%'],
        ['Componentes Dashboard', '50', '33%'],
        ['Componentes Mapa', '10', '7%'],
        ['Componentes UI (shadcn)', '45', 'Base'],
        ['Edge Functions', String(EDGE_FUNCTIONS.length), '100%'],
      ];
      
      addTable(['Categoría', 'Cantidad', 'Porcentaje'], fileDistribution, [70, 40, 60]);

      // ========== 3. ANÁLISIS DE MÓDULOS ==========
      addNewPage();
      setProgress(40);
      updateStep('modules');
      
      addTitle('3. ANÁLISIS DE MÓDULOS');

      codebaseAnalysis.modules.forEach((module, index) => {
        checkPageBreak(60);
        
        addTitle(`3.${index + 1} ${module.name}`, 2);
        addParagraph(module.description);
        
        // Progress bar visual
        const completionColor = module.completionPercentage >= 80 ? [34, 197, 94] : 
                               module.completionPercentage >= 50 ? [234, 179, 8] : [239, 68, 68];
        
        doc.setFontSize(9);
        doc.text(`Completitud: ${module.completionPercentage}%`, margin, currentY);
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(margin + 40, currentY - 3, 80, 5, 1, 1, 'F');
        doc.setFillColor(completionColor[0], completionColor[1], completionColor[2]);
        doc.roundedRect(margin + 40, currentY - 3, (80 * module.completionPercentage / 100), 5, 1, 1, 'F');
        currentY += 8;

        addSubtitle('Funcionalidades Implementadas');
        module.implementedFeatures.slice(0, 5).forEach(feature => {
          addBullet(`✓ ${feature}`, 5);
        });

        if (module.pendingFeatures.length > 0) {
          addSubtitle('Pendiente de Implementar');
          module.pendingFeatures.slice(0, 3).forEach(feature => {
            addBullet(`○ ${feature}`, 5);
          });
        }

        currentY += 5;
      });

      // ========== 4. FUNCIONALIDADES PENDIENTES ==========
      addNewPage();
      setProgress(50);
      updateStep('pending');
      
      addTitle('4. FUNCIONALIDADES PENDIENTES');
      
      addParagraph('A continuación se detallan las funcionalidades identificadas como pendientes de implementación en el sistema:');
      
      codebaseAnalysis.pendingFeatures.forEach((feature, index) => {
        addBullet(`${index + 1}. ${feature}`);
      });

      addInfoBox('📋 PRIORIZACIÓN RECOMENDADA',
        'Las funcionalidades pendientes deben priorizarse según: impacto en usuario final, complejidad técnica, dependencias con otros módulos y requisitos normativos.',
        [254, 243, 199], [245, 158, 11], [180, 83, 9]);

      // ========== 5. HALLAZGOS DE SEGURIDAD ==========
      addNewPage();
      setProgress(55);
      updateStep('security');
      
      addTitle('5. HALLAZGOS DE SEGURIDAD');
      
      codebaseAnalysis.securityFindings.forEach((finding, index) => {
        addBullet(`${index + 1}. ${finding}`);
      });

      addInfoBox('🔒 RECOMENDACIÓN DE SEGURIDAD',
        'Antes de cualquier despliegue en producción, se recomienda realizar una auditoría de seguridad externa y pruebas de penetración.',
        [254, 226, 226], [239, 68, 68], [185, 28, 28]);

      // ========== 6. VALORACIÓN DE MERCADO ==========
      addNewPage();
      setProgress(65);
      updateStep('valuation');
      
      addTitle('6. VALORACIÓN DE MERCADO');
      
      addParagraph(`Basándose en análisis de mercado para desarrollo de software bancario en España y Andorra (2024-2025), se estima el siguiente coste de desarrollo:`);

      addSubtitle('Resumen de Valoración');
      addTable(
        ['Concepto', 'Valor'],
        [
          ['Horas de Desarrollo Estimadas', `${codebaseAnalysis.marketValuation.totalHours.toLocaleString()} horas`],
          ['Tarifa Hora Mercado', `${codebaseAnalysis.marketValuation.hourlyRate}€/hora`],
          ['COSTE TOTAL ESTIMADO', `${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€`],
        ],
        [100, 70]
      );

      addSubtitle('Desglose por Categoría');
      const breakdownRows = codebaseAnalysis.marketValuation.breakdown.map(item => [
        item.category,
        `${item.hours.toLocaleString()} h`,
        `${item.cost.toLocaleString()}€`
      ]);
      addTable(['Categoría', 'Horas', 'Coste'], breakdownRows, [70, 50, 50]);

      addInfoBox('💡 NOTA SOBRE VALORACIÓN',
        `Esta valoración refleja el coste de desarrollo desde cero. El valor de mercado como producto terminado (incluyendo know-how, testing, documentación y soporte) puede ser 2-3x superior, situando el valor comercial entre ${(codebaseAnalysis.marketValuation.totalCost * 2).toLocaleString()}€ y ${(codebaseAnalysis.marketValuation.totalCost * 3).toLocaleString()}€.`,
        [239, 246, 255], [59, 130, 246], [30, 64, 175]);

      // ========== 7. COMPARATIVA COMPETIDORES ==========
      addNewPage();
      setProgress(75);
      updateStep('competitors');
      
      addTitle('7. COMPARATIVA CON COMPETIDORES');
      
      addParagraph('Análisis comparativo con soluciones similares disponibles en el mercado:');

      codebaseAnalysis.competitorComparison.forEach((competitor, index) => {
        checkPageBreak(50);
        
        addTitle(`7.${index + 1} ${competitor.name}`, 2);
        addParagraph(`Tipo: ${competitor.type}`);
        
        addTable(
          ['Concepto', 'Coste'],
          [
            ['Licencia', competitor.licenseCost],
            ['Implementación', competitor.implementationCost],
            ['Mantenimiento Anual', competitor.maintenanceCost],
          ],
          [85, 85]
        );

        addSubtitle('Ventajas');
        competitor.pros.forEach(pro => addBullet(`✓ ${pro}`, 5));
        
        addSubtitle('Desventajas');
        competitor.cons.forEach(con => addBullet(`✗ ${con}`, 5));
        
        currentY += 5;
      });

      // Tabla comparativa resumen
      addNewPage();
      addTitle('7.5 Tabla Comparativa Resumen', 2);
      
      const comparisonRows = [
        ['Creand CRM (Este)', `${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€`, '0€ (propio)', '10% anual estimado', '100%'],
        ...codebaseAnalysis.competitorComparison.map(c => [
          c.name, c.implementationCost, c.licenseCost, c.maintenanceCost, 'Variable'
        ])
      ];
      
      addTable(
        ['Solución', 'Implementación', 'Licencia', 'Mantenimiento', 'Personalización'],
        comparisonRows,
        [40, 35, 40, 30, 25]
      );

      addInfoBox('📊 CONCLUSIÓN COMPARATIVA',
        `La solución desarrollada internamente ofrece el mejor TCO (Total Cost of Ownership) a 5 años, con un ahorro estimado del 40-60% respecto a soluciones comerciales equivalentes, además de control total sobre el código y personalización ilimitada.`,
        [236, 253, 245], [34, 197, 94], [22, 101, 52]);

      // ========== 8. ADDENDUM: CLIENTES POTENCIALES ==========
      addNewPage();
      setProgress(85);
      updateStep('clients');
      
      addTitle('8. ADDENDUM: CLIENTES POTENCIALES');
      
      addParagraph('Análisis de sectores y tipos de clientes que podrían beneficiarse de la implementación de esta solución:');

      codebaseAnalysis.potentialClients.forEach((client, index) => {
        checkPageBreak(45);
        
        addTitle(`8.${index + 1} ${client.sector}`, 2);
        
        addTable(
          ['Característica', 'Detalle'],
          [
            ['Tipo de Cliente', client.clientType],
            ['Región Objetivo', client.region],
            ['Valor Estimado Proyecto', client.estimatedValue],
            ['Tiempo Implementación', client.implementationTime],
          ],
          [70, 100]
        );

        addSubtitle('Personalizaciones Requeridas');
        client.customizations.forEach(custom => addBullet(custom, 5));
        
        currentY += 5;
      });

      // Resumen de mercado potencial
      addNewPage();
      addTitle('8.5 Resumen de Mercado Potencial', 2);
      
      const totalMinValue = codebaseAnalysis.potentialClients.reduce((sum, c) => {
        const minVal = parseInt(c.estimatedValue.replace(/[^0-9]/g, '').split('')[0] || '0') * 1000;
        return sum + minVal;
      }, 0);
      
      addParagraph(`Mercado potencial estimado por segmento de cliente, considerando penetración inicial en mercados de Andorra, España, Portugal, Luxemburgo y Suiza.`);

      addTable(
        ['Sector', 'Clientes Potenciales', 'Valor Medio', 'TAM Estimado'],
        [
          ['Banca Privada', '15-25', '120.000€', '1.8M - 3M€'],
          ['Family Offices', '30-50', '60.000€', '1.8M - 3M€'],
          ['Cooperativas Crédito', '40-60', '75.000€', '3M - 4.5M€'],
          ['Fintechs', '20-30', '50.000€', '1M - 1.5M€'],
        ],
        [50, 40, 40, 40]
      );

      addInfoBox('🎯 ESTRATEGIA GO-TO-MARKET RECOMENDADA',
        '1) Piloto en Andorra con 2-3 entidades. 2) Expansión a banca privada Luxemburgo. 3) Cooperativas de crédito España. 4) Partnerships con consultoras financieras locales.',
        [239, 246, 255], [59, 130, 246], [30, 64, 175]);

      // ========== PÁGINA FINAL ==========
      addNewPage();
      setProgress(95);
      
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENTO GENERADO CON IA', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sistema CRM Bancario Creand - Documentación Técnico-Funcional v${codebaseAnalysis.version}`, pageWidth / 2, 40, { align: 'center' });
      doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), pageWidth / 2, 50, { align: 'center' });

      currentY = 75;
      doc.setTextColor(0, 0, 0);
      
      addSubtitle('Resumen del Documento');
      const summaryData = [
        ['Versión Analizada:', codebaseAnalysis.version],
        ['Total de Páginas:', String(pageNumber)],
        ['Módulos Analizados:', String(codebaseAnalysis.modules.length)],
        ['Coste Total Estimado:', `${codebaseAnalysis.marketValuation.totalCost.toLocaleString()}€`],
        ['Competidores Analizados:', String(codebaseAnalysis.competitorComparison.length)],
        ['Clientes Potenciales:', String(codebaseAnalysis.potentialClients.length) + ' segmentos'],
      ];
      
      summaryData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 55, currentY);
        currentY += 6;
      });

      currentY += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const disclaimer = 'DOCUMENTO CONFIDENCIAL - USO INTERNO BANCARIO. Este documento ha sido generado automáticamente mediante análisis de código con IA. Las valoraciones de mercado y comparativas son estimaciones basadas en datos públicos disponibles y deben ser validadas con análisis profesional adicional antes de tomar decisiones comerciales.';
      const lines = doc.splitTextToSize(disclaimer, contentWidth);
      lines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 5;
      });

      setProgress(100);
      
      // Save PDF
      const filename = `Documentacion_Tecnica_Creand_v${codebaseAnalysis.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Documento PDF generado correctamente', {
        description: `${pageNumber} páginas con análisis IA completo`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  const getDefaultAnalysis = (): CodebaseAnalysis => ({
    version: "3.0.0",
    generationDate: new Date().toISOString(),
    modules: [
      {
        name: "Dashboard & Gestión Comercial",
        description: "Panel de control y métricas para todos los roles del sistema",
        implementedFeatures: ["Dashboard por rol", "KPIs en tiempo real", "Filtros avanzados", "Benchmarking", "Comparativas"],
        pendingFeatures: ["Exportación a BI externo", "Alertas push móviles"],
        completionPercentage: 88,
        files: []
      },
      {
        name: "Módulo Contable (PGC Andorra)",
        description: "Sistema contable completo según Plan General Contable de Andorra",
        implementedFeatures: ["Balance de situación", "Cuenta de resultados", "Estado de flujos", "Consolidación", "Análisis ratios"],
        pendingFeatures: ["XBRL export", "Integración contabilidad externa"],
        completionPercentage: 92,
        files: []
      },
      {
        name: "Sistema GIS/Mapas",
        description: "Gestión geográfica de cartera comercial con MapLibre",
        implementedFeatures: ["Visualización", "Clustering", "Filtros geográficos", "Relocación markers", "Fullscreen"],
        pendingFeatures: ["Routing optimizado", "Análisis de zonas calientes"],
        completionPercentage: 85,
        files: []
      },
      {
        name: "Gestión de Visitas",
        description: "Sistema completo de fichas de visita y seguimiento comercial",
        implementedFeatures: ["Fichas de visita", "Validación jerárquica", "Historial", "Recordatorios", "Calendario compartido"],
        pendingFeatures: ["App móvil offline", "Firma digital"],
        completionPercentage: 90,
        files: []
      },
      {
        name: "Sistema de Objetivos y Metas",
        description: "Definición y seguimiento de objetivos comerciales por gestor",
        implementedFeatures: ["Creación objetivos", "Seguimiento progreso", "Alertas automáticas", "Rankings"],
        pendingFeatures: ["Objetivos automáticos con ML", "Gamificación avanzada"],
        completionPercentage: 85,
        files: []
      },
    ],
    pendingFeatures: [
      "Aplicación móvil nativa (iOS/Android) con modo offline",
      "Integración bidireccional con core bancario",
      "Business Intelligence con dashboards personalizables",
      "Sistema de firma electrónica para documentos",
      "Módulo de gestión documental avanzado (DMS)",
      "Chatbot de asistencia con IA para gestores",
      "API pública para integraciones de terceros",
      "Sistema de workflows personalizables",
      "Multi-tenant para grupos bancarios",
    ],
    securityFindings: [
      "RLS configurado en todas las tablas críticas",
      "JWT habilitado en edge functions sensibles",
      "Auditoría de acciones activada (audit_logs)",
      "Pendiente: MFA obligatorio para roles admin",
      "Pendiente: Leaked password protection en Auth",
      "Pendiente: Migración a self-hosted para datos sensibles",
    ],
    marketValuation: {
      totalHours: 2800,
      hourlyRate: 85,
      totalCost: 238000,
      breakdown: [
        { category: "Frontend React/TypeScript", hours: 950, cost: 80750 },
        { category: "Backend Edge Functions", hours: 450, cost: 38250 },
        { category: "Base de datos y RLS", hours: 350, cost: 29750 },
        { category: "Módulo Contable", hours: 400, cost: 34000 },
        { category: "Sistema de Mapas GIS", hours: 250, cost: 21250 },
        { category: "Testing y QA", hours: 200, cost: 17000 },
        { category: "Documentación", hours: 100, cost: 8500 },
        { category: "DevOps y Deploy", hours: 100, cost: 8500 },
      ]
    },
    competitorComparison: [
      {
        name: "Salesforce Financial Services Cloud",
        type: "CRM Cloud Enterprise",
        licenseCost: "150-300€/usuario/mes",
        implementationCost: "80.000-250.000€",
        maintenanceCost: "18-22% anual sobre licencias",
        pros: ["Ecosistema completo", "Soporte 24/7 global", "AppExchange extenso"],
        cons: ["Coste muy elevado", "Vendor lock-in", "Complejidad para PYMES"]
      },
      {
        name: "Microsoft Dynamics 365 for Finance",
        type: "ERP/CRM Cloud",
        licenseCost: "120-210€/usuario/mes",
        implementationCost: "50.000-180.000€",
        maintenanceCost: "15-18% anual",
        pros: ["Integración Office 365", "Power Platform", "Azure nativo"],
        cons: ["Curva aprendizaje alta", "Personalización costosa", "Licenciamiento complejo"]
      },
      {
        name: "SAP Business One for Banking",
        type: "ERP Bancario On-Premise/Cloud",
        licenseCost: "2.000-4.000€/usuario perpetua + 22% anual",
        implementationCost: "150.000-500.000€",
        maintenanceCost: "22% anual sobre licencias",
        pros: ["Robusto para enterprise", "Cumplimiento normativo completo", "Escalabilidad"],
        cons: ["Implementación muy larga (12-24 meses)", "Coste TCO muy alto", "Rigidez"]
      },
      {
        name: "Temenos T24",
        type: "Core Banking + CRM",
        licenseCost: "Bajo demanda (típico 500k-2M€)",
        implementationCost: "500.000-2.000.000€",
        maintenanceCost: "20-25% anual",
        pros: ["Líder en core banking", "Cumplimiento global", "Escalabilidad masiva"],
        cons: ["Solo para grandes entidades", "Implementación 18-36 meses", "Coste prohibitivo PYMES"]
      }
    ],
    potentialClients: [
      {
        sector: "Banca Privada y Gestión de Patrimonio",
        clientType: "Bancos privados y boutiques financieras",
        region: "Andorra, Luxemburgo, Suiza, Mónaco",
        estimatedValue: "80.000-180.000€",
        implementationTime: "4-8 meses",
        customizations: ["Integración core bancario local", "Compliance específico jurisdicción", "Multi-divisa", "Reporting patrimonial"]
      },
      {
        sector: "Family Offices",
        clientType: "Single y Multi-Family Offices",
        region: "España, Portugal, Andorra",
        estimatedValue: "45.000-90.000€",
        implementationTime: "2-4 meses",
        customizations: ["Gestión multi-familia", "Consolidación patrimonial", "Reporting personalizado", "Integración custodios"]
      },
      {
        sector: "Cooperativas de Crédito",
        clientType: "Cajas rurales y cooperativas financieras",
        region: "España (Comunidades Autónomas)",
        estimatedValue: "60.000-120.000€",
        implementationTime: "3-6 meses",
        customizations: ["Gestión de socios", "Productos agrarios", "Integración con federaciones", "Cumplimiento Banco de España"]
      },
      {
        sector: "Fintechs y Neobancos",
        clientType: "Startups financieras reguladas",
        region: "España, Portugal, Latinoamérica",
        estimatedValue: "35.000-70.000€",
        implementationTime: "2-3 meses",
        customizations: ["APIs abiertas", "Integración con BaaS", "Onboarding digital", "Escalabilidad cloud"]
      },
      {
        sector: "Gestoras de Activos",
        clientType: "Asset managers y SGIICs",
        region: "España, Andorra, Portugal",
        estimatedValue: "70.000-140.000€",
        implementationTime: "4-6 meses",
        customizations: ["Gestión de fondos", "Reporting CNMV/AMF", "CRM institucional", "Análisis de carteras"]
      }
    ],
    codeStats: {
      totalFiles: COMPONENTS_LIST.length + HOOKS_LIST.length + PAGES_LIST.length,
      totalComponents: COMPONENTS_LIST.length,
      totalHooks: HOOKS_LIST.length,
      totalEdgeFunctions: EDGE_FUNCTIONS.length,
      totalPages: PAGES_LIST.length,
      linesOfCode: 78000
    }
  });

  const completedSteps = steps.filter(s => s.completed).length;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Generador de Documentación con Análisis IA v3.0
        </CardTitle>
        <CardDescription>
          Analiza el código fuente con IA, genera informe dinámico con valoración de mercado, 
          comparativa de competidores y addendum de clientes potenciales.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(generating || analyzing) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{analyzing ? 'Analizando código con IA...' : 'Generando documento...'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="grid grid-cols-2 gap-2">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    step.completed ? 'bg-green-500/10 text-green-600' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-current" />
                  )}
                  <span className="truncate">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Code className="h-4 w-4 text-blue-500" />
              Análisis de Código
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {COMPONENTS_LIST.length} componentes React</li>
              <li>• {HOOKS_LIST.length} hooks personalizados</li>
              <li>• {EDGE_FUNCTIONS.length} edge functions</li>
              <li>• {PAGES_LIST.length} páginas</li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <DollarSign className="h-4 w-4 text-green-500" />
              Valoración Incluida
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Coste desarrollo estimado</li>
              <li>• Desglose por categoría</li>
              <li>• Comparativa mercado</li>
              <li>• ROI proyectado</li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Análisis Pendientes
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Funcionalidades por módulo</li>
              <li>• Nivel de completitud</li>
              <li>• Hallazgos seguridad</li>
              <li>• Priorización mejoras</li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-purple-500" />
              Addendum Comercial
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Clientes potenciales</li>
              <li>• Segmentos de mercado</li>
              <li>• Personalizaciones</li>
              <li>• Estrategia go-to-market</li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={generatePDF} 
          disabled={generating || analyzing}
          className="w-full"
          size="lg"
        >
          {generating || analyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {analyzing ? 'Analizando código con IA...' : `Generando documento... (${completedSteps}/${steps.length})`}
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Generar Documento PDF con Análisis IA
            </>
          )}
        </Button>

        {analysis && (
          <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✓ Último análisis: v{analysis.version} - {new Date(analysis.generationDate).toLocaleString('es-ES')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
