/**
 * ERP Modular - Tipos TypeScript
 * Multi-tenant, RBAC, Auditoría, Ejercicios/Series
 */

import { Json } from '@/integrations/supabase/types';

// ============ EMPRESAS Y GRUPOS ============

export interface ERPCompanyGroup {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ERPCompany {
  id: string;
  group_id?: string | null;
  name: string;
  legal_name?: string | null;
  tax_id?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country: string;
  currency: string;
  timezone: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  settings: Json;
  created_at: string;
  updated_at: string;
  // Relación
  group?: ERPCompanyGroup;
}

export interface ERPUserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role_id?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  company?: ERPCompany;
  role?: ERPRole;
}

// ============ PERMISOS Y ROLES ============

export interface ERPPermission {
  id: string;
  key: string;
  module: string;
  action: string;
  description?: string;
  created_at: string;
}

export interface ERPRole {
  id: string;
  company_id?: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  permissions?: ERPPermission[];
}

export interface ERPRolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

// ============ AUDITORÍA ============

export interface ERPAuditEvent {
  id: string;
  company_id?: string | null;
  actor_user_id?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  before_json?: Json;
  after_json?: Json;
  metadata: Json;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  // Relaciones para display
  actor_name?: string;
}

// ============ EJERCICIOS Y PERIODOS ============

export interface ERPFiscalYear {
  id: string;
  company_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  periods?: ERPPeriod[];
}

export interface ERPPeriod {
  id: string;
  fiscal_year_id: string;
  company_id: string;
  month: number;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
  updated_at: string;
}

// ============ SERIES DOCUMENTALES ============

export interface ERPSeries {
  id: string;
  company_id: string;
  module: string;
  document_type: string;
  code: string;
  name: string;
  prefix: string;
  suffix: string;
  next_number: number;
  padding: number;
  reset_annually: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ MÓDULOS ERP ============

export type ERPModuleKey = 
  | 'dashboard'
  | 'masters'
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'accounting'
  | 'treasury'
  | 'tax'
  | 'audit'
  | 'config';

export interface ERPModuleConfig {
  key: ERPModuleKey;
  name: string;
  icon: string;
  path: string;
  requiredPermission?: string;
}

// ============ FORMULARIOS ============

export interface CreateCompanyForm {
  name: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  website?: string;
  group_id?: string;
}

export interface CreateFiscalYearForm {
  name: string;
  start_date: string;
  end_date: string;
}

export interface CreateSeriesForm {
  module: string;
  document_type: string;
  code: string;
  name: string;
  prefix?: string;
  suffix?: string;
  padding?: number;
  reset_annually?: boolean;
  is_default?: boolean;
}

export interface CreateRoleForm {
  name: string;
  description?: string;
  permission_ids: string[];
}

// ============ FINANCIACIÓN E INVERSIONES ============

export type FinancingOperationType = 'loan' | 'credit_line' | 'leasing' | 'renting' | 'factoring' | 'confirming' | 'mortgage';
export type FinancingOperationStatus = 'active' | 'pending' | 'cancelled' | 'completed' | 'defaulted';
export type InterestRateType = 'fixed' | 'variable' | 'mixed';

export interface ERPFinancingOperation {
  id: string;
  company_id: string;
  operation_type: FinancingOperationType;
  contract_number?: string | null;
  entity_name: string;
  entity_code?: string | null;
  amount: number;
  outstanding_balance: number;
  currency: string;
  interest_rate: number;
  interest_rate_type: InterestRateType;
  reference_index?: string | null;
  spread?: number | null;
  start_date: string;
  end_date?: string | null;
  next_payment_date?: string | null;
  payment_frequency?: string | null;
  status: FinancingOperationStatus;
  guarantees?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ERPFinancingPayment {
  id: string;
  operation_id: string;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  fees_amount: number;
  total_amount: number;
  payment_number?: number | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_reference?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type InvestmentType = 'deposit' | 'bond' | 'stock' | 'fund' | 'real_estate' | 'other';
export type InvestmentStatus = 'active' | 'matured' | 'sold' | 'cancelled';

export interface ERPInvestment {
  id: string;
  company_id: string;
  investment_type: InvestmentType;
  investment_code?: string | null;
  description: string;
  entity_name?: string | null;
  nominal_amount: number;
  current_value: number;
  currency: string;
  interest_rate?: number | null;
  purchase_date: string;
  maturity_date?: string | null;
  status: InvestmentStatus;
  isin_code?: string | null;
  custody_account?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ERPInvestmentTransaction {
  id: string;
  investment_id: string;
  transaction_type: 'purchase' | 'sale' | 'dividend' | 'interest' | 'fee' | 'revaluation';
  transaction_date: string;
  units?: number | null;
  unit_price?: number | null;
  amount: number;
  fees?: number | null;
  net_amount: number;
  notes?: string | null;
  created_at: string;
}

export interface ERPMarketInterestRate {
  id: string;
  rate_name: string;
  rate_code: string;
  current_value: number;
  previous_value?: number | null;
  effective_date: string;
  source?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ERPMarketStockWatchlist {
  id: string;
  company_id: string;
  symbol: string;
  name: string;
  last_price?: number | null;
  change_percent?: number | null;
  currency: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ============ FILTROS ============

export interface ERPAuditFilters {
  entity_type?: string;
  action?: string;
  actor_user_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface ERPFinancingFilters {
  operation_type?: FinancingOperationType;
  status?: FinancingOperationStatus;
  entity_name?: string;
  date_from?: string;
  date_to?: string;
}

export interface ERPInvestmentFilters {
  investment_type?: InvestmentType;
  status?: InvestmentStatus;
  date_from?: string;
  date_to?: string;
}
