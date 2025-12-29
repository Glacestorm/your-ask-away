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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function ObelixiaAccountingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <DashboardLayout title="ObelixIA Accounting">
      <div className="container mx-auto py-6 px-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Header with Copilot Button aligned right */}
          <div className="flex items-center justify-between gap-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-auto p-1 gap-1">
                {/* Core Accounting */}
                <TabsTrigger value="dashboard" className="flex items-center gap-2 px-3 py-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="chart" className="flex items-center gap-2 px-3 py-2">
                  <FolderTree className="h-4 w-4" />
                  <span className="hidden sm:inline">Plan</span>
                </TabsTrigger>
                <TabsTrigger value="entries" className="flex items-center gap-2 px-3 py-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Asientos</span>
                </TabsTrigger>
                <TabsTrigger value="partners" className="flex items-center gap-2 px-3 py-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Socios</span>
                </TabsTrigger>
                <TabsTrigger value="banking" className="flex items-center gap-2 px-3 py-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Bancos</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2 px-3 py-2">
                  <PieChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Reportes</span>
                </TabsTrigger>
                <TabsTrigger value="fiscal" className="flex items-center gap-2 px-3 py-2">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Fiscal</span>
                </TabsTrigger>

                {/* Separator */}
                <div className="w-px h-6 bg-border mx-1" />

                {/* AI Advanced Modules (Phases 3-10) */}
                <TabsTrigger value="ai-agent" className="flex items-center gap-2 px-3 py-2">
                  <Bot className="h-4 w-4" />
                  <span className="hidden lg:inline">Agente IA</span>
                </TabsTrigger>
                <TabsTrigger value="forecasting" className="flex items-center gap-2 px-3 py-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden lg:inline">Previsión</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex items-center gap-2 px-3 py-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden lg:inline">Compliance</span>
                </TabsTrigger>
                <TabsTrigger value="multicurrency" className="flex items-center gap-2 px-3 py-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden lg:inline">Divisas</span>
                </TabsTrigger>
                <TabsTrigger value="reconciliation" className="flex items-center gap-2 px-3 py-2">
                  <GitMerge className="h-4 w-4" />
                  <span className="hidden lg:inline">Conciliación</span>
                </TabsTrigger>
                <TabsTrigger value="treasury" className="flex items-center gap-2 px-3 py-2">
                  <Landmark className="h-4 w-4" />
                  <span className="hidden lg:inline">Tesorería</span>
                </TabsTrigger>
                <TabsTrigger value="tax-planning" className="flex items-center gap-2 px-3 py-2">
                  <Calculator className="h-4 w-4" />
                  <span className="hidden lg:inline">Fiscal IA</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 px-3 py-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden lg:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Copilot Button - Always visible, aligned with Fiscal tab */}
            <ObelixiaAccountingHelpButton />
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
