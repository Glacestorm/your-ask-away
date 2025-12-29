/**
 * ObelixIA Accounting Page
 * Página principal del módulo de contabilidad interna
 * Fase 2-10: Contabilidad Completa con IA Avanzada
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/layouts';
import {
  ObelixiaAccountingDashboard,
  ChartOfAccountsManager,
  JournalEntryEditor,
  PartnerManager,
  BankReconciliation,
  FinancialReports,
  TaxDeclarations,
  ObelixiaAccountingHelpButton,
  // Phases 3-10: Advanced AI Modules
  AutonomousAgentPanel,
  FinancialForecastingPanel,
  ComplianceAuditPanel,
  MultiCurrencyPanel,
  SmartReconciliationPanel,
  TreasuryPanel,
  TaxPlanningPanel,
  FinancialAnalyticsPanel
} from '@/components/admin/obelixia-accounting';
import { 
  LayoutDashboard, 
  FolderTree, 
  FileText, 
  Users, 
  Building2,
  PieChart,
  Receipt,
  Bot,
  TrendingUp,
  Shield,
  Globe,
  GitMerge,
  Landmark,
  Calculator,
  BarChart3
} from 'lucide-react';


export default function ObelixiaAccountingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <DashboardLayout title="ObelixIA Accounting">
      <div className="container mx-auto py-6 px-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Header - Two rows for better organization */}
          <div className="space-y-2">
            {/* Row 1: Core Accounting + Copilot */}
            <div className="flex items-center gap-2">
              <TabsList className="flex-1 h-auto p-1 gap-1 flex flex-wrap justify-start">
                <TabsTrigger value="dashboard" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="chart" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                  <FolderTree className="h-3.5 w-3.5" />
                  <span>Plan</span>
                </TabsTrigger>
                <TabsTrigger value="entries" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Asientos</span>
                </TabsTrigger>
                <TabsTrigger value="partners" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>Socios</span>
                </TabsTrigger>
                <TabsTrigger value="banking" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Bancos</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                  <PieChart className="h-3.5 w-3.5" />
                  <span>Reportes</span>
                </TabsTrigger>
                <TabsTrigger value="fiscal" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Fiscal</span>
                </TabsTrigger>
              </TabsList>
              <ObelixiaAccountingHelpButton />
            </div>

            {/* Row 2: AI Advanced Modules (Phases 3-10) */}
            <TabsList className="h-auto p-1 gap-1 flex flex-wrap justify-start bg-primary/5 border border-primary/10">
              <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary/70">
                <Bot className="h-3 w-3" />
                IA:
              </span>
              <TabsTrigger value="ai-agent" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <Bot className="h-3.5 w-3.5" />
                <span>Agente</span>
              </TabsTrigger>
              <TabsTrigger value="forecasting" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Previsión</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Compliance</span>
              </TabsTrigger>
              <TabsTrigger value="multicurrency" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" />
                <span>Divisas</span>
              </TabsTrigger>
              <TabsTrigger value="reconciliation" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <GitMerge className="h-3.5 w-3.5" />
                <span>Conciliación</span>
              </TabsTrigger>
              <TabsTrigger value="treasury" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <Landmark className="h-3.5 w-3.5" />
                <span>Tesorería</span>
              </TabsTrigger>
              <TabsTrigger value="tax-planning" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <Calculator className="h-3.5 w-3.5" />
                <span>Fiscal IA</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Core Accounting Tabs */}
          <TabsContent value="dashboard">
            <ObelixiaAccountingDashboard />
          </TabsContent>

          <TabsContent value="chart">
            <ChartOfAccountsManager />
          </TabsContent>

          <TabsContent value="entries">
            <JournalEntryEditor />
          </TabsContent>

          <TabsContent value="partners">
            <PartnerManager />
          </TabsContent>

          <TabsContent value="banking">
            <BankReconciliation />
          </TabsContent>

          <TabsContent value="reports">
            <FinancialReports />
          </TabsContent>

          <TabsContent value="fiscal">
            <TaxDeclarations />
          </TabsContent>

          {/* AI Advanced Modules (Phases 3-10) */}
          <TabsContent value="ai-agent">
            <AutonomousAgentPanel />
          </TabsContent>

          <TabsContent value="forecasting">
            <FinancialForecastingPanel />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceAuditPanel />
          </TabsContent>

          <TabsContent value="multicurrency">
            <MultiCurrencyPanel />
          </TabsContent>

          <TabsContent value="reconciliation">
            <SmartReconciliationPanel />
          </TabsContent>

          <TabsContent value="treasury">
            <TreasuryPanel />
          </TabsContent>

          <TabsContent value="tax-planning">
            <TaxPlanningPanel />
          </TabsContent>

          <TabsContent value="analytics">
            <FinancialAnalyticsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
