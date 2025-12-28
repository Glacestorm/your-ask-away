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
