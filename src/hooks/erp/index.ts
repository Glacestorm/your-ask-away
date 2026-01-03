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
export { useERPCurrencyExposure } from './useERPCurrencyExposure';
export { useERPTradePartners } from './useERPTradePartners';
