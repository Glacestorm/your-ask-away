/**
 * AccountingDashboard - Dashboard principal del módulo de contabilidad
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  CreditCard,
  FileText,
  AlertTriangle,
  Calendar,
  BookOpen,
  Calculator,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Loader2,
  Plus,
  Bot,
  Search,
  LineChart,
  Leaf,
  GitMerge,
  DollarSign
} from 'lucide-react';
import { HelpTooltip, HelpLabel } from './HelpTooltip';
import { DynamicHelpPanel } from './DynamicHelpPanel';
import { ChartOfAccountsTree } from './ChartOfAccountsTree';
import { JournalsList } from './JournalsList';
import { JournalEntryEditor } from './JournalEntryEditor';
import { FinancialReportsPanel } from './FinancialReportsPanel';
import { PeriodClosingPanel } from './PeriodClosingPanel';
import { AIJournalEntriesPanel } from './AIJournalEntriesPanel';
import { AnomalyDetectionPanel } from './AnomalyDetectionPanel';
import { PredictiveAnalyticsPanel } from './PredictiveAnalyticsPanel';
import { ESGCarbonPanel } from './ESGCarbonPanel';
import { AutoReconciliationPanel } from './AutoReconciliationPanel';
// Nuevos paneles integrados
import { AccountLedgerPanel } from './AccountLedgerPanel';
import { TrialBalancePanel } from './TrialBalancePanel';
import { IncomeStatementPanel } from './IncomeStatementPanel';
import { BalanceSheetPanel } from './BalanceSheetPanel';
import { AgingPanel } from './AgingPanel';
import { SEPARemittancesPanel } from './SEPARemittancesPanel';
import { BankReconciliationPanel } from './BankReconciliationPanel';
import { FiscalClosingWizard } from './FiscalClosingWizard';
import { TreasuryModule } from './TreasuryModule';
import { PDFStatementImporter } from './PDFStatementImporter';
import { FinancialRatiosPanel } from './FinancialRatiosPanel';
import { CashFlowPanel } from './CashFlowPanel';
import { BudgetManagementPanel } from './BudgetManagementPanel';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccountingDashboardProps {
  className?: string;
}

export function AccountingDashboard({ className }: AccountingDashboardProps) {
  const { currentCompany } = useERPContext();
  const {
    isLoading,
    dashboard,
    regulations,
    lastRefresh,
    fetchDashboard,
    startAutoRefresh,
    stopAutoRefresh,
  } = useERPAccounting();

  const [activeTab, setActiveTab] = useState('overview');
  const [showNewEntryEditor, setShowNewEntryEditor] = useState(false);

  // Auto-refresh al montar
  useEffect(() => {
    if (currentCompany?.id) {
      startAutoRefresh(120000);
    }
    return () => stopAutoRefresh();
  }, [currentCompany?.id, startAutoRefresh, stopAutoRefresh]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!currentCompany) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calculator className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Seleccione una empresa para ver la contabilidad</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Contabilidad
              <HelpTooltip
                type="info"
                title="Módulo de Contabilidad"
                content={
                  <div className="space-y-2">
                    <p>Gestión integral de la contabilidad empresarial según normativa vigente.</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      <li>Plan de cuentas configurable</li>
                      <li>Asientos contables con partida doble</li>
                      <li>Libros oficiales (Diario, Mayor)</li>
                      <li>Estados financieros</li>
                      <li>Cumplimiento fiscal automático</li>
                    </ul>
                  </div>
                }
              />
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentCompany.name} • {currentCompany.country}
              {lastRefresh && (
                <span className="ml-2">
                  • Actualizado {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Actualizar
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowNewEntryEditor(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Asiento
          </Button>
        </div>

        {/* Editor de nuevo asiento */}
        <JournalEntryEditor
          open={showNewEntryEditor}
          onOpenChange={setShowNewEntryEditor}
          onSave={() => {
            setShowNewEntryEditor(false);
            fetchDashboard();
          }}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Ingresos
              <HelpTooltip
                type="definition"
                title="Ingresos Totales"
                content="Suma de todos los ingresos registrados en el período contable actual (grupo 7 del PGC)."
                regulationRef="PGC Grupo 7"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboard?.totalIncome || 0)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  Período actual
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-rose-500/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Gastos
              <HelpTooltip
                type="definition"
                title="Gastos Totales"
                content="Suma de todos los gastos registrados en el período contable actual (grupo 6 del PGC)."
                regulationRef="PGC Grupo 6"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboard?.totalExpenses || 0)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  Período actual
                </p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Resultado Neto
              <HelpTooltip
                type="regulation"
                title="Resultado del Ejercicio"
                content={
                  <div className="space-y-1">
                    <p>Diferencia entre ingresos y gastos del período.</p>
                    <p className="text-xs">Fórmula: Ingresos (Grupo 7) - Gastos (Grupo 6)</p>
                  </div>
                }
                regulationRef="PGC Cuenta 129"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  (dashboard?.netResult || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(dashboard?.netResult || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(dashboard?.netResult || 0) >= 0 ? 'Beneficio' : 'Pérdida'}
                </p>
              </div>
              <div className={cn(
                "p-2 rounded-lg",
                (dashboard?.netResult || 0) >= 0 
                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              )}>
                <Calculator className={cn(
                  "h-5 w-5",
                  (dashboard?.netResult || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tesorería */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Tesorería
              <HelpTooltip
                type="tip"
                title="Saldo en Bancos"
                content="Saldo total disponible en cuentas bancarias y caja. Cuenta 572 del PGC."
                regulationRef="PGC Cuenta 572"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboard?.cashBalance || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Disponible
                </p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <PiggyBank className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales - menú compacto */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto gap-1 p-1 flex-wrap">
            {/* Principal */}
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="entries" className="gap-1.5 text-xs">
              <Receipt className="h-3.5 w-3.5" />
              Asientos
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Plan Contable
            </TabsTrigger>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Libros */}
            <TabsTrigger value="ledger" className="gap-1.5 text-xs">
              Libro Mayor
            </TabsTrigger>
            <TabsTrigger value="trial-balance" className="gap-1.5 text-xs">
              Sumas/Saldos
            </TabsTrigger>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Estados Financieros */}
            <TabsTrigger value="balance-sheet" className="gap-1.5 text-xs">
              Balance
            </TabsTrigger>
            <TabsTrigger value="income-statement" className="gap-1.5 text-xs">
              PyG
            </TabsTrigger>
            <TabsTrigger value="cash-flow" className="gap-1.5 text-xs">
              Flujo Caja
            </TabsTrigger>
            <TabsTrigger value="ratios" className="gap-1.5 text-xs">
              Ratios
            </TabsTrigger>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Tesorería */}
            <TabsTrigger value="treasury" className="gap-1.5 text-xs">
              <PiggyBank className="h-3.5 w-3.5" />
              Tesorería
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="gap-1.5 text-xs">
              Conciliación
            </TabsTrigger>
            <TabsTrigger value="sepa" className="gap-1.5 text-xs">
              SEPA
            </TabsTrigger>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Gestión */}
            <TabsTrigger value="closing" className="gap-1.5 text-xs">
              Cierres
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-1.5 text-xs">
              Presupuestos
            </TabsTrigger>
            <TabsTrigger value="aging" className="gap-1.5 text-xs">
              Vencimientos
            </TabsTrigger>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* IA */}
            <TabsTrigger value="ai-entries" className="gap-1.5 text-xs">
              <Bot className="h-3.5 w-3.5" />
              IA
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="gap-1.5 text-xs">
              Anomalías
            </TabsTrigger>
            <TabsTrigger value="predictive" className="gap-1.5 text-xs">
              Predicciones
            </TabsTrigger>
            <TabsTrigger value="esg" className="gap-1.5 text-xs">
              ESG
            </TabsTrigger>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Utilidades */}
            <TabsTrigger value="import-statements" className="gap-1.5 text-xs">
              Importar
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 text-xs">
              Informes
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-1.5 text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              Ayuda
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alertas y notificaciones */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alertas y Recordatorios
                  <HelpTooltip
                    type="warning"
                    title="Alertas Contables"
                    content="Avisos sobre vencimientos fiscales, obligaciones pendientes y situaciones que requieren atención."
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.alerts && dashboard.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border flex items-start gap-3",
                          alert.type === 'error' && 'bg-red-50 dark:bg-red-950/30 border-red-200',
                          alert.type === 'warning' && 'bg-amber-50 dark:bg-amber-950/30 border-amber-200',
                          alert.type === 'info' && 'bg-blue-50 dark:bg-blue-950/30 border-blue-200'
                        )}
                      >
                        <AlertTriangle className={cn(
                          "h-5 w-5 mt-0.5 flex-shrink-0",
                          alert.type === 'error' && 'text-red-500',
                          alert.type === 'warning' && 'text-amber-500',
                          alert.type === 'info' && 'text-blue-500'
                        )} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          {alert.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Vence: {format(new Date(alert.dueDate), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No hay alertas pendientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Período actual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Período Fiscal
                  <HelpTooltip
                    type="regulation"
                    title="Período Contable"
                    content="Período fiscal activo para el registro de operaciones. Los períodos cerrados no permiten nuevos asientos."
                    regulationRef="Art. 25 Código de Comercio"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboard?.currentPeriod ? (
                  <>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-semibold">{dashboard.currentPeriod.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(dashboard.currentPeriod.start_date), 'dd/MM/yyyy')} - {format(new Date(dashboard.currentPeriod.end_date), 'dd/MM/yyyy')}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {dashboard.currentPeriod.status === 'open' ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {dashboard?.recentEntries?.length || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Asientos</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {regulations.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Normativas</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No hay período activo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Últimos asientos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Últimos Asientos
                <HelpTooltip
                  type="definition"
                  title="Asientos Contables"
                  content="Registro de las operaciones económicas según el principio de partida doble: todo cargo tiene un abono de igual importe."
                  regulationRef="PGC - Principios Contables"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recentEntries && dashboard.recentEntries.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.recentEntries.slice(0, 5).map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          entry.status === 'posted' ? 'bg-green-500' : 'bg-amber-500'
                        )} />
                        <div>
                          <p className="font-medium text-sm">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.entry_number} • {format(new Date(entry.entry_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(entry.total_debit)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {entry.status === 'posted' ? 'Contabilizado' : 'Borrador'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No hay asientos recientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Asientos */}
        <TabsContent value="entries">
          <JournalsList />
        </TabsContent>

        {/* Tab: Cuentas */}
        <TabsContent value="accounts">
          <ChartOfAccountsTree />
        </TabsContent>

        {/* Tab: Informes Financieros */}
        <TabsContent value="reports">
          <FinancialReportsPanel />
        </TabsContent>

        {/* Tab: Cierres (período y fiscal) */}
        <TabsContent value="closing" className="space-y-6">
          <PeriodClosingPanel />
          <FiscalClosingWizard />
        </TabsContent>

        {/* Tab: IA Asientos Contables */}
        <TabsContent value="ai-entries">
          <AIJournalEntriesPanel />
        </TabsContent>

        {/* Tab: Detección de Anomalías */}
        <TabsContent value="anomalies">
          <AnomalyDetectionPanel />
        </TabsContent>

        {/* Tab: Análisis Predictivo */}
        <TabsContent value="predictive">
          <PredictiveAnalyticsPanel />
        </TabsContent>

        {/* Tab: ESG y Huella de Carbono */}
        <TabsContent value="esg">
          <ESGCarbonPanel />
        </TabsContent>

        {/* Tab: Conciliación (incluye bancaria) */}
        <TabsContent value="reconciliation" className="space-y-6">
          <AutoReconciliationPanel />
          <BankReconciliationPanel />
        </TabsContent>

        {/* Tab: Mayor Contable */}
        <TabsContent value="ledger">
          <AccountLedgerPanel />
        </TabsContent>

        {/* Tab: Balance de Sumas y Saldos */}
        <TabsContent value="trial-balance">
          <TrialBalancePanel />
        </TabsContent>

        {/* Tab: Cuenta de Pérdidas y Ganancias */}
        <TabsContent value="income-statement">
          <IncomeStatementPanel />
        </TabsContent>

        {/* Tab: Balance de Situación */}
        <TabsContent value="balance-sheet">
          <BalanceSheetPanel />
        </TabsContent>

        {/* Tab: Vencimientos (Aging) */}
        <TabsContent value="aging">
          <AgingPanel />
        </TabsContent>

        {/* Tab: Remesas SEPA */}
        <TabsContent value="sepa">
          <SEPARemittancesPanel />
        </TabsContent>
        {/* Tab: Tesorería */}
        <TabsContent value="treasury">
          <TreasuryModule />
        </TabsContent>

        {/* Tab: Importar Estados Financieros */}
        <TabsContent value="import-statements">
          <PDFStatementImporter />
        </TabsContent>

        {/* Tab: Ratios Financieros */}
        <TabsContent value="ratios">
          <FinancialRatiosPanel />
        </TabsContent>

        {/* Tab: Cash Flow */}
        <TabsContent value="cash-flow">
          <CashFlowPanel />
        </TabsContent>

        {/* Tab: Presupuestos */}
        <TabsContent value="budget">
          <BudgetManagementPanel />
        </TabsContent>

        {/* Tab: Ayuda y Normativas */}
        <TabsContent value="help" className="space-y-4">
          <DynamicHelpPanel
            installedModules={['accounting', 'sales', 'purchases', 'inventory', 'masters']}
            country={currentCompany?.country || 'España'}
            companyName={currentCompany?.name}
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AccountingDashboard;
