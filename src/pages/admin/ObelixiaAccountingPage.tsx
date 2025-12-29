/**
 * ObelixIA Accounting Page
 * Página principal del módulo de contabilidad interna
 * Fase 2-10: Contabilidad Completa con IA Avanzada
 */

import { useState } from 'react';
import { DashboardLayout } from '@/layouts';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  ObelixiaAccountingDashboard,
  ChartOfAccountsManager,
  JournalEntryEditor,
  PartnerManager,
  BankReconciliation,
  FinancialReports,
  TaxDeclarations,
  ObelixiaAccountingSidebar,
  // Phases 3-10: Advanced AI Modules
  AutonomousAgentPanel,
  FinancialForecastingPanel,
  ComplianceAuditPanel,
  MultiCurrencyPanel,
  SmartReconciliationPanel,
  TreasuryPanel,
  TaxPlanningPanel,
  FinancialAnalyticsPanel,
  // Phase 11: Enterprise Modules
  IntegrationsHubPanel,
  WorkflowPanel,
  DocumentsPanel,
  IntercompanyPanel,
  // Phase 13: Regulatory & Advanced Reporting
  RegulatoryReportingPanel,
  BudgetingPanel,
  RiskManagementPanel,
  ESGReportingPanel
} from '@/components/admin/obelixia-accounting';

// Phase 12: Advanced AI & Automation
import {
  AdvancedCopilotPanel,
  AIOrchestorPanel,
  SmartAnalyticsPanel,
  RealTimeInsightsPanel
} from '@/components/admin/advanced-ai';

export default function ObelixiaAccountingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ObelixiaAccountingDashboard />;
      case 'chart':
        return <ChartOfAccountsManager />;
      case 'entries':
        return <JournalEntryEditor />;
      case 'partners':
        return <PartnerManager />;
      case 'banking':
        return <BankReconciliation />;
      case 'reports':
        return <FinancialReports />;
      case 'fiscal':
        return <TaxDeclarations />;
      case 'ai-agent':
        return <AutonomousAgentPanel />;
      case 'forecasting':
        return <FinancialForecastingPanel />;
      case 'compliance':
        return <ComplianceAuditPanel />;
      case 'multicurrency':
        return <MultiCurrencyPanel />;
      case 'reconciliation':
        return <SmartReconciliationPanel />;
      case 'treasury':
        return <TreasuryPanel />;
      case 'tax-planning':
        return <TaxPlanningPanel />;
      case 'analytics':
        return <FinancialAnalyticsPanel />;
      // Phase 11: Enterprise Modules
      case 'integrations-hub':
        return <IntegrationsHubPanel />;
      case 'workflow':
        return <WorkflowPanel />;
      case 'documents':
        return <DocumentsPanel />;
      case 'intercompany':
        return <IntercompanyPanel />;
      // Phase 12: Advanced AI & Automation
      case 'advanced-copilot':
        return <AdvancedCopilotPanel context={{ entityId: 'obelixia-accounting', entityName: 'ObelixIA Contabilidad' }} />;
      case 'ai-orchestrator':
        return <AIOrchestorPanel />;
      case 'smart-analytics':
        return <SmartAnalyticsPanel context={{ entityId: 'obelixia-accounting', entityType: 'accounting' }} />;
      case 'realtime-insights':
        return <RealTimeInsightsPanel context={{ entityId: 'obelixia-accounting', entityType: 'accounting' }} />;
      // Phase 13: Regulatory & Advanced Reporting
      case 'regulatory-reporting':
        return <RegulatoryReportingPanel />;
      case 'budgeting':
        return <BudgetingPanel />;
      case 'risk-management':
        return <RiskManagementPanel />;
      case 'esg-reporting':
        return <ESGReportingPanel />;
      default:
        return <ObelixiaAccountingDashboard />;
    }
  };

  return (
    <DashboardLayout title="ObelixIA Accounting" contentPadding="none">
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-64px)] w-full">
          <ObelixiaAccountingSidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </SidebarProvider>
    </DashboardLayout>
  );
}
