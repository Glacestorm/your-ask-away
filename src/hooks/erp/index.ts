/**
 * ERP Hooks - Barrel Export
 */

export { ERPProvider, useERPContext } from './useERPContext';
export { useERPCompanies } from './useERPCompanies';
export { useERPFiscalYears } from './useERPFiscalYears';
export { useERPSeries } from './useERPSeries';
export { useERPAudit } from './useERPAudit';
export { useERPRoles } from './useERPRoles';
export { useERPPurchases } from './useERPPurchases';
export { useERPInventory } from './useERPInventory';
export { useERPStockManager } from './useERPStockManager';
export { useERPAccounting } from './useERPAccounting';
export { useERPJournalEntries } from './useERPJournalEntries';
export { useERPFinancialReports } from './useERPFinancialReports';
export { useERPForecasting } from './useERPForecasting';
export { useERPESGCarbon } from './useERPESGCarbon';
export { useERPAutoReconciliation } from './useERPAutoReconciliation';
export { useERPAccountingChatbot } from './useERPAccountingChatbot';
export { useERPDynamicHelp } from './useERPDynamicHelp';
export * from './useMaestros';
export { useERPFinancialRatios } from './useERPFinancialRatios';
export { useERPCashFlow } from './useERPCashFlow';
export { useERPBudget } from './useERPBudget';
export { useERPAdvancedRatios } from './useERPAdvancedRatios';

// Treasury hooks
export { useERPTreasury } from './useERPTreasury';
export { useERPPayables } from './useERPPayables';
export { useERPReceivables } from './useERPReceivables';
export { useERPBankReconciliation } from './useERPBankReconciliation';
export { useERPSEPARemittances } from './useERPSEPARemittances';

// Phase 1-2: NIIF Compliance & Voice Intelligence
export { useNIIFCompliance } from './useNIIFCompliance';
export { useAccountingVoiceAgent } from './useAccountingVoiceAgent';

// Trade Finance
export { useERPTradeFinance } from './useERPTradeFinance';
export { useERPDiscountOperations } from './useERPDiscountOperations';
export { useERPDocumentaryCredits } from './useERPDocumentaryCredits';
export { useERPBankGuarantees } from './useERPBankGuarantees';
export { useERPFactoring } from './useERPFactoring';
export { useERPCurrencyExposure } from './useERPCurrencyExposure';
export { useERPTradePartners } from './useERPTradePartners';

// Financing & Investments
export { useERPFinancingOperations } from './useERPFinancingOperations';
export { useERPInvestments } from './useERPInvestments';
export { useERPMarketRates } from './useERPMarketRates';
export { useERPStockQuotes } from './useERPStockQuotes';
export { useERPAutoAccounting } from './useERPAutoAccounting';

// Import/Export Universal
export { useERPImportExport } from './useERPImportExport';
export type { ERPModule, ExportFormat, ImportExportOptions, OCRResult, ImportResult, ExportResult } from './useERPImportExport';

// Banking Hub
export { useERPBankingHub } from './useERPBankingHub';
export type { BankingProvider, BankAccount, BankConnection, BankTransaction, BankPosition, SyncLog } from './useERPBankingHub';

// AI Agent Orchestrator - Multi-agent supervision system
export { useERPAgentOrchestrator } from './useERPAgentOrchestrator';
export type { ERPAgentType, ERPAgent, AgentAlert, AgentAction, AgentAnalysisRequest, AgentAnalysisResult } from './useERPAgentOrchestrator';

// Accounting Supervisor Agent (legacy, now part of orchestrator)
export { useAccountingSupervisorAgent } from './useAccountingSupervisorAgent';
