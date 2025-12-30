/**
 * ObelixIA Accounting Hooks - Barrel Export
 * Fase 11 - Enterprise SaaS 2025-2026
 */

export { useObelixiaAccounting } from './useObelixiaAccounting';
export type { 
  FiscalConfig, 
  ChartAccount, 
  JournalEntry, 
  JournalEntryLine,
  FiscalPeriod,
  DashboardData,
  TrialBalanceRow
} from './useObelixiaAccounting';

export { useObelixiaPartners } from './useObelixiaPartners';
export type { 
  Partner, 
  PartnerTransaction,
  TransactionType 
} from './useObelixiaPartners';

export { useObelixiaBanking } from './useObelixiaBanking';
export type { 
  BankAccount, 
  BankTransaction, 
  ReconciliationRule 
} from './useObelixiaBanking';

export { useObelixiaReports } from './useObelixiaReports';
export type {
  BalanceSheet,
  BalanceSheetRow,
  IncomeStatement,
  IncomeStatementRow,
  CashFlowStatement,
  CashFlowRow,
  ReportExportOptions
} from './useObelixiaReports';

export { useObelixiaFiscal } from './useObelixiaFiscal';
export type {
  TaxDeclaration,
  VATSummary,
  TaxCalendar,
  FiscalPeriodClose
} from './useObelixiaFiscal';

export { useObelixiaInvoicing } from './useObelixiaInvoicing';
export type {
  Invoice,
  InvoiceLine,
  InvoiceWorkflow,
  CreateInvoiceParams
} from './useObelixiaInvoicing';

export { useObelixiaIntegrations } from './useObelixiaIntegrations';
export type {
  BankImport,
  AccountingExport
} from './useObelixiaIntegrations';

// Fase 1: AI Accounting Copilot
export { useObelixiaAccountingCopilot } from './useObelixiaAccountingCopilot';
export type {
  CopilotMessage,
  CopilotConversation,
  QuickAction,
  CopilotSuggestion,
  CopilotContext
} from './useObelixiaAccountingCopilot';

// Fase 3: Autonomous Bookkeeping Engine
export { useObelixiaAccountingAgent } from './useObelixiaAccountingAgent';

// Fase 4: Predictive Analytics & Financial Forecasting
export { useObelixiaFinancialForecasting } from './useObelixiaFinancialForecasting';

// Fase 5: Compliance & Audit AI
export { useObelixiaComplianceAudit } from './useObelixiaComplianceAudit';

// Fase 6: Multi-Currency & International Operations
export { useObelixiaMultiCurrency } from './useObelixiaMultiCurrency';
export type {
  Currency,
  ExchangeRate,
  CurrencyConversion,
  CurrencyExposure,
  MultiCurrencyReport,
  MultiCurrencyContext
} from './useObelixiaMultiCurrency';

// Fase 7: Automated Reconciliation & Smart Matching
export { useObelixiaSmartReconciliation } from './useObelixiaSmartReconciliation';
export type {
  ReconciliationMatch,
  ReconciliationRule as SmartReconciliationRule,
  ReconciliationSession,
  ReconciliationStats,
  SmartReconciliationContext
} from './useObelixiaSmartReconciliation';

// Fase 8: Intelligent Cash Flow Management & Treasury
export { useObelixiaTreasury } from './useObelixiaTreasury';
export type {
  CashFlowForecast,
  LiquidityPosition,
  PaymentOptimization,
  CashFlowAlert,
  WorkingCapitalMetrics,
  TreasuryContext
} from './useObelixiaTreasury';

// Fase 9: Intelligent Tax Planning & Optimization
export { useObelixiaTaxPlanning } from './useObelixiaTaxPlanning';
export type {
  TaxOptimization,
  TaxScenario,
  TaxCalendarEvent,
  DeductionOpportunity,
  TaxSummary,
  TaxPlanningContext
} from './useObelixiaTaxPlanning';

// Fase 10: Advanced Financial Analytics & Executive Dashboard
export { useObelixiaFinancialAnalytics } from './useObelixiaFinancialAnalytics';
export type {
  ExecutiveKPI,
  BenchmarkAnalysis,
  StrategicInsight,
  FinancialHealth,
  PredictiveMetric,
  ExecutiveReport,
  FinancialAnalyticsContext
} from './useObelixiaFinancialAnalytics';

// Fase 11: Enterprise Integration Modules
export { useObelixiaIntegrationsHub } from './useObelixiaIntegrationsHub';
export type { Integration, SyncLog } from './useObelixiaIntegrationsHub';
export { useObelixiaWorkflow } from './useObelixiaWorkflow';
export { useObelixiaDocuments } from './useObelixiaDocuments';
export { useObelixiaIntercompany } from './useObelixiaIntercompany';

// Fase 15: Financial Guardian & Automation
export { useObelixiaFinancialGuardian } from './useObelixiaFinancialGuardian';
export type {
  GuardianAlert,
  GuardianInsight,
  GuardianRecommendation,
  GuardianWatchItem,
  GuardianStats,
  FinancialGuardianContext
} from './useObelixiaFinancialGuardian';

export { useObelixiaClosingAutomation } from './useObelixiaClosingAutomation';
export type {
  ClosingPeriod,
  ClosingTask,
  ClosingValidation,
  ClosingAdjustment,
  ClosingChecklist,
  ClosingStats
} from './useObelixiaClosingAutomation';

export { useObelixiaFixedAssets } from './useObelixiaFixedAssets';
export type {
  FixedAsset,
  AssetCategory,
  AssetDepreciationSchedule,
  AssetDisposal,
  AssetStats
} from './useObelixiaFixedAssets';

// Fase 15 Extended: Strategic Financial Agent
export { useObelixiaGrantsIntelligence } from './useObelixiaGrantsIntelligence';
export type { Grant, GrantApplication, GrantsContext } from './useObelixiaGrantsIntelligence';

export { useObelixiaBusinessPlan } from './useObelixiaBusinessPlan';
export type { BusinessPlan, BusinessPlanContext } from './useObelixiaBusinessPlan';

export { useObelixiaViabilityStudy } from './useObelixiaViabilityStudy';
export type { ViabilityStudy, ViabilityContext } from './useObelixiaViabilityStudy';

export { useObelixiaCompetitiveAnalysis } from './useObelixiaCompetitiveAnalysis';
export type { CompetitorAnalysis, CompetitiveContext } from './useObelixiaCompetitiveAnalysis';

export { useObelixiaInvestorDocs } from './useObelixiaInvestorDocs';
export type { InvestorDocument, InvestorDocContext } from './useObelixiaInvestorDocs';

// Fase 16: Billing Integration
export { useObelixiaBillingIntegration } from './useObelixiaBillingIntegration';
export type {
  BillingInvoice,
  BillingPayment,
  BillingIntegrationConfig,
  InvoiceSummary,
  AccountingIntegrationResult
} from './useObelixiaBillingIntegration';
