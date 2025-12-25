/**
 * AdminSectionLoader - Lazy loading wrapper for Admin sections
 * Provides loading states and suspense boundaries for each section
 */

import React, { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Loading skeleton component
export const AdminSectionSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Cargando sección...</p>
    </div>
  </div>
);

// Lazy loaded components grouped by category
// Dashboards
export const CommercialDirectorDashboard = lazy(() => import('@/components/admin/CommercialDirectorDashboard').then(m => ({ default: m.CommercialDirectorDashboard })));
export const OfficeDirectorDashboard = lazy(() => import('@/components/admin/OfficeDirectorDashboard').then(m => ({ default: m.OfficeDirectorDashboard })));
export const CommercialManagerDashboard = lazy(() => import('@/components/admin/CommercialManagerDashboard').then(m => ({ default: m.CommercialManagerDashboard })));
export const CommercialManagerAudit = lazy(() => import('@/components/admin/CommercialManagerAudit').then(m => ({ default: m.CommercialManagerAudit })));
export const GestorDashboard = lazy(() => import('@/components/admin/GestorDashboard').then(m => ({ default: m.GestorDashboard })));
export const AuditorDashboard = lazy(() => import('@/components/admin/AuditorDashboard').then(m => ({ default: m.AuditorDashboard })));

// Metrics
export const VisitsMetrics = lazy(() => import('@/components/admin/VisitsMetrics').then(m => ({ default: m.VisitsMetrics })));
export const ProductsMetrics = lazy(() => import('@/components/admin/ProductsMetrics').then(m => ({ default: m.ProductsMetrics })));
export const GestoresMetrics = lazy(() => import('@/components/admin/GestoresMetrics').then(m => ({ default: m.GestoresMetrics })));
export const VinculacionMetrics = lazy(() => import('@/components/admin/VinculacionMetrics').then(m => ({ default: m.VinculacionMetrics })));

// Management
export const CompaniesManager = lazy(() => import('@/components/admin/CompaniesManager').then(m => ({ default: m.CompaniesManager })));
export const ProductsManager = lazy(() => import('@/components/admin/ProductsManager').then(m => ({ default: m.ProductsManager })));
export const UsersManager = lazy(() => import('@/components/admin/UsersManager').then(m => ({ default: m.UsersManager })));
export const TPVManager = lazy(() => import('@/components/admin/TPVManager').then(m => ({ default: m.TPVManager })));
export const TPVGoalsManager = lazy(() => import('@/components/admin/TPVGoalsManager').then(m => ({ default: m.TPVGoalsManager })));

// Config
export const StatusColorsManager = lazy(() => import('@/components/admin/StatusColorsManager').then(m => ({ default: m.StatusColorsManager })));
export const ConceptsManager = lazy(() => import('@/components/admin/ConceptsManager').then(m => ({ default: m.ConceptsManager })));
export const EmailTemplatesManager = lazy(() => import('@/components/admin/EmailTemplatesManager').then(m => ({ default: m.EmailTemplatesManager })));
export const MapConfigDashboard = lazy(() => import('@/components/admin/MapConfigDashboard').then(m => ({ default: m.MapConfigDashboard })));

// System
export const SystemHealthMonitor = lazy(() => import('@/components/admin/SystemHealthMonitor').then(m => ({ default: m.SystemHealthMonitor })));
export const AuditLogsViewer = lazy(() => import('@/components/admin/AuditLogsViewer').then(m => ({ default: m.AuditLogsViewer })));
export const ImportHistoryViewer = lazy(() => import('@/components/admin/ImportHistoryViewer').then(m => ({ default: m.ImportHistoryViewer })));

// Alerts & Notifications
export const AlertsManager = lazy(() => import('@/components/dashboard/AlertsManager').then(m => ({ default: m.AlertsManager })));
export const NotificationPreferences = lazy(() => import('@/components/dashboard/NotificationPreferences').then(m => ({ default: m.NotificationPreferences })));
export const DirectorAlertsPanel = lazy(() => import('@/components/admin/DirectorAlertsPanel').then(m => ({ default: m.DirectorAlertsPanel })));
export const AlertHistoryViewer = lazy(() => import('@/components/admin/AlertHistoryViewer').then(m => ({ default: m.AlertHistoryViewer })));
export const NotificationCenterManager = lazy(() => import('@/components/admin/NotificationCenterManager').then(m => ({ default: m.NotificationCenterManager })));

// Goals
export const BulkGoalsAssignment = lazy(() => import('@/components/admin/BulkGoalsAssignment').then(m => ({ default: m.BulkGoalsAssignment })));
export const GoalsProgressTracker = lazy(() => import('@/components/admin/GoalsProgressTracker'));
export const GoalsKPIDashboard = lazy(() => import('@/components/admin/GoalsKPIDashboard'));
export const KPIReportHistory = lazy(() => import('@/components/admin/KPIReportHistory').then(m => ({ default: m.KPIReportHistory })));
export const CascadeGoalsManager = lazy(() => import('@/components/admin/CascadeGoalsManager').then(m => ({ default: m.CascadeGoalsManager })));

// Calendar & Visits
export const SharedVisitsCalendar = lazy(() => import('@/components/admin/SharedVisitsCalendar').then(m => ({ default: m.SharedVisitsCalendar })));
export const VisitSheetsGestorComparison = lazy(() => import('@/components/admin/VisitSheetsGestorComparison').then(m => ({ default: m.VisitSheetsGestorComparison })));
export const VisitSheetValidationPanel = lazy(() => import('@/components/admin/VisitSheetValidationPanel'));
export const ContractedProductsReport = lazy(() => import('@/components/admin/ContractedProductsReport'));

// Maps
export const MapView = lazy(() => import('@/pages/MapView'));
export const GeocodingRecalculator = lazy(() => import('@/components/admin/GeocodingRecalculator').then(m => ({ default: m.GeocodingRecalculator })));

// Accounting
export const AccountingManager = lazy(() => import('@/components/admin/accounting/AccountingManager'));

// Reports
export const UnifiedMetricsDashboard = lazy(() => import('@/components/dashboard/UnifiedMetricsDashboard').then(m => ({ default: m.UnifiedMetricsDashboard })));
export const DynamicTechnicalDocGenerator = lazy(() => import('@/components/reports/DynamicTechnicalDocGenerator').then(m => ({ default: m.DynamicTechnicalDocGenerator })));
export const CompetitorGapAnalysisGenerator = lazy(() => import('@/components/reports/CompetitorGapAnalysisGenerator').then(m => ({ default: m.CompetitorGapAnalysisGenerator })));
export const AppDetailedStatusGenerator = lazy(() => import('@/components/reports/AppDetailedStatusGenerator').then(m => ({ default: m.AppDetailedStatusGenerator })));
export const CodebaseIndexGenerator = lazy(() => import('@/components/reports/CodebaseIndexGenerator').then(m => ({ default: m.CodebaseIndexGenerator })));
export const ApplicationStateAnalyzer = lazy(() => import('@/components/admin/ApplicationStateAnalyzer').then(m => ({ default: m.ApplicationStateAnalyzer })));

// Compliance
export const DORAComplianceDashboard = lazy(() => import('@/components/admin/DORAComplianceDashboard').then(m => ({ default: m.DORAComplianceDashboard })));
export const AdaptiveAuthDashboard = lazy(() => import('@/components/admin/AdaptiveAuthDashboard').then(m => ({ default: m.AdaptiveAuthDashboard })));
export const ISO27001Dashboard = lazy(() => import('@/components/admin/ISO27001Dashboard').then(m => ({ default: m.ISO27001Dashboard })));

// Pipeline & CRM
export const PipelineBoard = lazy(() => import('@/components/pipeline/PipelineBoard').then(m => ({ default: m.PipelineBoard })));
export const Customer360Panel = lazy(() => import('@/components/admin/Customer360Panel').then(m => ({ default: m.Customer360Panel })));

// AI & ML
export const InternalAssistantChat = lazy(() => import('@/components/admin/InternalAssistantChat').then(m => ({ default: m.InternalAssistantChat })));
export const AIIntegrationConfig = lazy(() => import('@/components/admin/AIIntegrationConfig').then(m => ({ default: m.AIIntegrationConfig })));

// AI Agents - Fase 1
export const AutonomousAgentsPanel = lazy(() => import('@/components/admin/ai-agents').then(m => ({ default: m.AutonomousAgentsPanel })));
export const PredictiveCopilotPanel = lazy(() => import('@/components/admin/ai-agents').then(m => ({ default: m.PredictiveCopilotPanel })));
export const VoiceInterfacePanel = lazy(() => import('@/components/admin/ai-agents').then(m => ({ default: m.VoiceInterfacePanel })));
export const RFMDashboard = lazy(() => import('@/components/admin/RFMDashboard').then(m => ({ default: m.RFMDashboard })));
export const CustomerSegmentationPanel = lazy(() => import('@/components/admin/CustomerSegmentationPanel').then(m => ({ default: m.CustomerSegmentationPanel })));
export const CDPFullDashboard = lazy(() => import('@/components/admin/CDPFullDashboard').then(m => ({ default: m.CDPFullDashboard })));
export const MLExplainabilityPanel = lazy(() => import('@/components/admin/MLExplainabilityPanel').then(m => ({ default: m.MLExplainabilityPanel })));
export const AdvancedMLDashboard = lazy(() => import('@/components/admin/AdvancedMLDashboard').then(m => ({ default: m.AdvancedMLDashboard })));
export const PredictiveAnalyticsDashboard = lazy(() => import('@/components/admin/PredictiveAnalyticsDashboard').then(m => ({ default: m.PredictiveAnalyticsDashboard })));
export const RoleCopilotPanel = lazy(() => import('@/components/ai-control').then(m => ({ default: m.RoleCopilotPanel })));
export const NBADashboard = lazy(() => import('@/components/ai-control').then(m => ({ default: m.NBADashboard })));
export const ContinuousControlsDashboard = lazy(() => import('@/components/ai-control').then(m => ({ default: m.ContinuousControlsDashboard })));

// Communication
export const SMSManager = lazy(() => import('@/components/admin/SMSManager').then(m => ({ default: m.SMSManager })));
export const RealtimeChatPanel = lazy(() => import('@/components/chat/RealtimeChatPanel').then(m => ({ default: m.RealtimeChatPanel })));

// Banking & Finance
export const CoreBankingManager = lazy(() => import('@/components/admin/CoreBankingManager').then(m => ({ default: m.CoreBankingManager })));

// SPM & Store
export const SPMDashboard = lazy(() => import('@/components/admin/spm/SPMDashboard').then(m => ({ default: m.SPMDashboard })));
export const AppStoreManager = lazy(() => import('@/components/admin/appstore/AppStoreManager').then(m => ({ default: m.AppStoreManager })));

// Audit Reporting
export const AuditReportingDashboard = lazy(() => import('@/components/admin/auditor-reporting').then(m => ({ default: m.AuditReportingDashboard })));

// CNAE
export const CNAEPricingCalculator = lazy(() => import('@/components/cnae/CNAEPricingCalculator').then(m => ({ default: m.CNAEPricingCalculator })));
export const HoldingDashboard = lazy(() => import('@/components/cnae/HoldingDashboard').then(m => ({ default: m.HoldingDashboard })));
export const CNAEPricingAdmin = lazy(() => import('@/components/cnae/CNAEPricingAdmin').then(m => ({ default: m.CNAEPricingAdmin })));
export const CNAEDashboard = lazy(() => import('@/components/cnae/CNAEDashboard').then(m => ({ default: m.CNAEDashboard })));

// BPMN
export const BPMNDesigner = lazy(() => import('@/components/bpmn/BPMNDesigner'));
export const ProcessMiningDashboard = lazy(() => import('@/components/bpmn/ProcessMiningDashboard').then(m => ({ default: m.ProcessMiningDashboard })));

// Verticals & Sectors
export const VerticalPacksManager = lazy(() => import('@/components/admin/verticals').then(m => ({ default: m.VerticalPacksManager })));
export const SectorsManager = lazy(() => import('@/components/admin/SectorsManager').then(m => ({ default: m.SectorsManager })));

// Performance & Translations
export const CoreWebVitalsDashboard = lazy(() => import('@/components/admin/CoreWebVitalsDashboard').then(m => ({ default: m.CoreWebVitalsDashboard })));
export const TranslationsDashboard = lazy(() => import('@/components/admin/translations').then(m => ({ default: m.TranslationsDashboard })));

// Config & Docs
export const WhiteLabelConfig = lazy(() => import('@/components/admin/WhiteLabelConfig'));
export const APIDocumentation = lazy(() => import('@/components/admin/APIDocumentation'));

// Visit Sheets page (not lazy - used directly)
export { default as VisitSheets } from '@/pages/VisitSheets';

// Service Quotes & Remote Support
export const ServiceQuoteBuilder = lazy(() => import('@/components/admin/service-quotes').then(m => ({ default: m.ServiceQuoteBuilder })));
export const ServiceQuotesList = lazy(() => import('@/components/admin/service-quotes').then(m => ({ default: m.ServiceQuotesList })));
export const SessionActionsTimeline = lazy(() => import('@/components/admin/service-quotes').then(m => ({ default: m.SessionActionsTimeline })));

// Wrapper component for lazy loaded sections
interface LazyAdminSectionProps {
  children: React.ReactNode;
}

export const LazyAdminSection: React.FC<LazyAdminSectionProps> = ({ children }) => (
  <Suspense fallback={<AdminSectionSkeleton />}>
    {children}
  </Suspense>
);
