-- =============================================
-- FASE 1: INFRAESTRUCTURA LOCALIZACIÓN CONTABLE
-- =============================================

-- Países y configuraciones contables
CREATE TABLE public.erp_accounting_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  accounting_standard VARCHAR(50) NOT NULL, -- IFRS, GAAP, PGC, PCG, SKR, etc.
  fiscal_year_start_month INTEGER DEFAULT 1,
  vat_rates JSONB DEFAULT '[]'::jsonb,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  decimal_separator VARCHAR(1) DEFAULT ',',
  thousands_separator VARCHAR(1) DEFAULT '.',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  tax_id_format VARCHAR(50),
  tax_id_label VARCHAR(50) DEFAULT 'NIF',
  locale_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plantillas de planes de cuentas por país
CREATE TABLE public.erp_chart_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL REFERENCES erp_accounting_countries(country_code),
  template_name VARCHAR(100) NOT NULL,
  template_version VARCHAR(20) DEFAULT '1.0',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_complete BOOLEAN DEFAULT true,
  source_reference TEXT,
  accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  account_groups JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, template_name, template_version)
);

-- Normativas y leyes contables por país
CREATE TABLE public.erp_accounting_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL REFERENCES erp_accounting_countries(country_code),
  regulation_type VARCHAR(50) NOT NULL, -- law, decree, standard, guideline
  regulation_code VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_markdown TEXT,
  effective_date DATE,
  expiry_date DATE,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(50), -- fiscal, accounting, vat, reporting
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- FASE 2: TABLAS CORE DE CONTABILIDAD
-- =============================================

-- Plan de cuentas por empresa
CREATE TABLE public.erp_chart_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  country_code VARCHAR(3) REFERENCES erp_accounting_countries(country_code),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id UUID REFERENCES erp_chart_accounts(id),
  level INTEGER DEFAULT 1,
  is_header BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  normal_balance VARCHAR(10) DEFAULT 'debit' CHECK (normal_balance IN ('debit', 'credit')),
  accepts_entries BOOLEAN DEFAULT true,
  reconcilable BOOLEAN DEFAULT false,
  tax_related BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Diarios contables
CREATE TABLE public.erp_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  journal_type VARCHAR(20) NOT NULL CHECK (journal_type IN ('general', 'sales', 'purchases', 'bank', 'cash', 'closing', 'opening')),
  default_debit_account_id UUID REFERENCES erp_chart_accounts(id),
  default_credit_account_id UUID REFERENCES erp_chart_accounts(id),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sequence_prefix VARCHAR(10),
  next_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Asientos contables
CREATE TABLE public.erp_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  journal_id UUID NOT NULL REFERENCES erp_journals(id),
  period_id UUID REFERENCES erp_periods(id),
  fiscal_year_id UUID REFERENCES erp_fiscal_years(id),
  entry_number VARCHAR(30) NOT NULL,
  entry_date DATE NOT NULL,
  reference VARCHAR(100),
  description TEXT,
  source_type VARCHAR(50), -- sales_invoice, purchase_invoice, payment, receipt, manual
  source_id UUID,
  total_debit DECIMAL(15,2) DEFAULT 0,
  total_credit DECIMAL(15,2) DEFAULT 0,
  is_balanced BOOLEAN GENERATED ALWAYS AS (total_debit = total_credit) STORED,
  is_posted BOOLEAN DEFAULT false,
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES profiles(id),
  is_reversed BOOLEAN DEFAULT false,
  reversal_entry_id UUID REFERENCES erp_journal_entries(id),
  is_closing_entry BOOLEAN DEFAULT false,
  is_opening_entry BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, journal_id, entry_number)
);

-- Líneas de asiento
CREATE TABLE public.erp_journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES erp_journal_entries(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  account_id UUID NOT NULL REFERENCES erp_chart_accounts(id),
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  partner_type VARCHAR(20), -- customer, supplier
  partner_id UUID,
  tax_id UUID,
  tax_amount DECIMAL(15,2),
  cost_center_id UUID,
  project_id UUID,
  description TEXT,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  exchange_rate DECIMAL(10,6) DEFAULT 1,
  amount_currency DECIMAL(15,2),
  reconciled BOOLEAN DEFAULT false,
  reconciliation_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, line_number)
);

-- Registro de IVA
CREATE TABLE public.erp_vat_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  period_id UUID REFERENCES erp_periods(id),
  fiscal_year_id UUID REFERENCES erp_fiscal_years(id),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('sales', 'purchases')),
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(50),
  document_date DATE NOT NULL,
  partner_id UUID,
  partner_name VARCHAR(255),
  partner_vat VARCHAR(50),
  base_amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  tax_id UUID,
  source_type VARCHAR(50),
  source_id UUID,
  journal_entry_id UUID REFERENCES erp_journal_entries(id),
  is_rectification BOOLEAN DEFAULT false,
  original_document_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- FASE 3: TABLAS CORE DE TESORERÍA
-- =============================================

-- Vencimientos por pagar
CREATE TABLE public.erp_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  supplier_invoice_id UUID,
  supplier_id UUID REFERENCES erp_suppliers(id),
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  payment_method VARCHAR(50),
  bank_account_id UUID,
  payment_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vencimientos por cobrar
CREATE TABLE public.erp_receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  sales_invoice_id UUID,
  customer_id UUID REFERENCES erp_customers(id),
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'collected', 'cancelled')),
  collected_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount - collected_amount) STORED,
  payment_method VARCHAR(50),
  bank_account_id UUID,
  receipt_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pagos emitidos
CREATE TABLE public.erp_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  payment_number VARCHAR(30),
  payment_date DATE NOT NULL,
  reference VARCHAR(100),
  payment_method VARCHAR(50) NOT NULL,
  bank_account_id UUID,
  supplier_id UUID REFERENCES erp_suppliers(id),
  amount DECIMAL(15,2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'reconciled', 'cancelled')),
  journal_entry_id UUID REFERENCES erp_journal_entries(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cobros recibidos
CREATE TABLE public.erp_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  receipt_number VARCHAR(30),
  receipt_date DATE NOT NULL,
  reference VARCHAR(100),
  payment_method VARCHAR(50) NOT NULL,
  bank_account_id UUID,
  customer_id UUID REFERENCES erp_customers(id),
  amount DECIMAL(15,2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'reconciled', 'cancelled')),
  journal_entry_id UUID REFERENCES erp_journal_entries(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Extractos bancarios
CREATE TABLE public.erp_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  bank_account_id UUID,
  period_id UUID REFERENCES erp_periods(id),
  statement_number VARCHAR(50),
  statement_date DATE NOT NULL,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  closing_balance DECIMAL(15,2) DEFAULT 0,
  total_debits DECIMAL(15,2) DEFAULT 0,
  total_credits DECIMAL(15,2) DEFAULT 0,
  imported_at TIMESTAMPTZ,
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'ofx', 'mt940', 'camt', 'csv')),
  file_path TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'reconciled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Líneas de extracto bancario
CREATE TABLE public.erp_bank_statement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES erp_bank_statements(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT,
  reference VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  running_balance DECIMAL(15,2),
  matched_entity_type VARCHAR(50), -- payment, receipt, journal_entry
  matched_entity_id UUID,
  match_score DECIMAL(5,2),
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mandatos SEPA
CREATE TABLE public.erp_sepa_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES erp_customers(id),
  mandate_reference VARCHAR(35) NOT NULL,
  signature_date DATE NOT NULL,
  mandate_type VARCHAR(10) DEFAULT 'CORE' CHECK (mandate_type IN ('CORE', 'B2B')),
  sequence_type VARCHAR(10) DEFAULT 'RCUR' CHECK (sequence_type IN ('FRST', 'RCUR', 'FNAL', 'OOFF')),
  iban VARCHAR(34) NOT NULL,
  bic VARCHAR(11),
  debtor_name VARCHAR(140) NOT NULL,
  debtor_address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  last_used_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, mandate_reference)
);

-- Remesas SEPA
CREATE TABLE public.erp_sepa_remittances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES erp_series(id),
  remittance_number VARCHAR(30),
  remittance_type VARCHAR(20) NOT NULL CHECK (remittance_type IN ('SDD_CORE', 'SDD_B2B', 'SCT')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'generated', 'sent', 'rejected')),
  presentation_date DATE,
  charge_date DATE,
  total_amount DECIMAL(15,2) DEFAULT 0,
  total_lines INTEGER DEFAULT 0,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  creditor_id VARCHAR(35), -- Identificador acreedor SEPA
  file_path TEXT,
  file_content TEXT, -- XML generado
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Líneas de remesa SEPA
CREATE TABLE public.erp_sepa_remittance_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_id UUID NOT NULL REFERENCES erp_sepa_remittances(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  customer_id UUID REFERENCES erp_customers(id),
  supplier_id UUID REFERENCES erp_suppliers(id),
  receivable_id UUID REFERENCES erp_receivables(id),
  payable_id UUID REFERENCES erp_payables(id),
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  mandate_id UUID REFERENCES erp_sepa_mandates(id),
  iban VARCHAR(34) NOT NULL,
  bic VARCHAR(11),
  debtor_name VARCHAR(140),
  remittance_info VARCHAR(140),
  end_to_end_id VARCHAR(35),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'included', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Incidencias de generación SEPA
CREATE TABLE public.erp_sepa_generation_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_id UUID NOT NULL REFERENCES erp_sepa_remittances(id) ON DELETE CASCADE,
  line_id UUID REFERENCES erp_sepa_remittance_lines(id),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  issue_code VARCHAR(50),
  message TEXT NOT NULL,
  entity_ref VARCHAR(100),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- FASE 4: CIERRES DE EJERCICIO
-- =============================================

-- Cierres fiscales
CREATE TABLE public.erp_fiscal_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  fiscal_year_id UUID NOT NULL REFERENCES erp_fiscal_years(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'closing', 'closed', 'reopened')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  performed_by UUID REFERENCES profiles(id),
  regularization_entry_id UUID REFERENCES erp_journal_entries(id),
  closing_entry_id UUID REFERENCES erp_journal_entries(id),
  opening_entry_id UUID REFERENCES erp_journal_entries(id),
  validations_json JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, fiscal_year_id)
);

-- Eventos de cierre
CREATE TABLE public.erp_closing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_id UUID NOT NULL REFERENCES erp_fiscal_closings(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT now(),
  message TEXT NOT NULL,
  details JSONB,
  severity VARCHAR(10) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- FASE 6 & 7: CHATBOT Y AGENTE ASESOR
-- =============================================

-- Contexto del chatbot por organización
CREATE TABLE public.erp_chatbot_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  company_id UUID REFERENCES erp_companies(id) ON DELETE CASCADE,
  installed_modules JSONB DEFAULT '[]'::jsonb,
  country_code VARCHAR(3) REFERENCES erp_accounting_countries(country_code),
  active_configurations JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de conversaciones del chatbot
CREATE TABLE public.erp_chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES erp_companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  conversation_topic VARCHAR(255),
  messages JSONB DEFAULT '[]'::jsonb,
  context_snapshot JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configuración del agente asesor por empresa
CREATE TABLE public.erp_advisor_agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  country_code VARCHAR(3) REFERENCES erp_accounting_countries(country_code),
  specializations JSONB DEFAULT '["accounting", "tax", "treasury"]'::jsonb,
  alert_thresholds JSONB DEFAULT '{}'::jsonb,
  notification_preferences JSONB DEFAULT '{"email": true, "inApp": true}'::jsonb,
  monitoring_scope JSONB DEFAULT '["entries", "closings", "vat", "payments"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Alertas del agente asesor
CREATE TABLE public.erp_advisor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  recommendation TEXT,
  affected_entities JSONB DEFAULT '[]'::jsonb,
  regulation_reference VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_taken TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auditoría de procesos vigilados por el agente
CREATE TABLE public.erp_advisor_process_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  process_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  validation_result VARCHAR(20) CHECK (validation_result IN ('valid', 'warning', 'error')),
  issues_found JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  country_code VARCHAR(3),
  applied_regulations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_erp_chart_accounts_company ON erp_chart_accounts(company_id);
CREATE INDEX idx_erp_chart_accounts_parent ON erp_chart_accounts(parent_id);
CREATE INDEX idx_erp_chart_accounts_code ON erp_chart_accounts(company_id, code);

CREATE INDEX idx_erp_journals_company ON erp_journals(company_id);
CREATE INDEX idx_erp_journal_entries_company ON erp_journal_entries(company_id);
CREATE INDEX idx_erp_journal_entries_date ON erp_journal_entries(entry_date);
CREATE INDEX idx_erp_journal_entries_period ON erp_journal_entries(period_id);
CREATE INDEX idx_erp_journal_entries_source ON erp_journal_entries(source_type, source_id);

CREATE INDEX idx_erp_journal_entry_lines_entry ON erp_journal_entry_lines(entry_id);
CREATE INDEX idx_erp_journal_entry_lines_account ON erp_journal_entry_lines(account_id);

CREATE INDEX idx_erp_vat_register_company ON erp_vat_register(company_id);
CREATE INDEX idx_erp_vat_register_period ON erp_vat_register(period_id);
CREATE INDEX idx_erp_vat_register_direction ON erp_vat_register(direction);

CREATE INDEX idx_erp_payables_company ON erp_payables(company_id);
CREATE INDEX idx_erp_payables_supplier ON erp_payables(supplier_id);
CREATE INDEX idx_erp_payables_due_date ON erp_payables(due_date);
CREATE INDEX idx_erp_payables_status ON erp_payables(status);

CREATE INDEX idx_erp_receivables_company ON erp_receivables(company_id);
CREATE INDEX idx_erp_receivables_customer ON erp_receivables(customer_id);
CREATE INDEX idx_erp_receivables_due_date ON erp_receivables(due_date);
CREATE INDEX idx_erp_receivables_status ON erp_receivables(status);

CREATE INDEX idx_erp_payments_company ON erp_payments(company_id);
CREATE INDEX idx_erp_receipts_company ON erp_receipts(company_id);

CREATE INDEX idx_erp_bank_statements_company ON erp_bank_statements(company_id);
CREATE INDEX idx_erp_bank_statement_lines_statement ON erp_bank_statement_lines(statement_id);

CREATE INDEX idx_erp_sepa_mandates_company ON erp_sepa_mandates(company_id);
CREATE INDEX idx_erp_sepa_mandates_customer ON erp_sepa_mandates(customer_id);

CREATE INDEX idx_erp_sepa_remittances_company ON erp_sepa_remittances(company_id);
CREATE INDEX idx_erp_sepa_remittance_lines_remittance ON erp_sepa_remittance_lines(remittance_id);

CREATE INDEX idx_erp_advisor_alerts_company ON erp_advisor_alerts(company_id);
CREATE INDEX idx_erp_advisor_alerts_unread ON erp_advisor_alerts(company_id, is_read) WHERE is_read = false;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE erp_accounting_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_chart_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_accounting_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_chart_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_vat_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sepa_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sepa_remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sepa_remittance_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sepa_generation_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_fiscal_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_closing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_chatbot_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_advisor_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_advisor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_advisor_process_audit ENABLE ROW LEVEL SECURITY;

-- Países y plantillas son públicos (lectura)
CREATE POLICY "Anyone can read countries" ON erp_accounting_countries FOR SELECT USING (true);
CREATE POLICY "Anyone can read templates" ON erp_chart_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can read regulations" ON erp_accounting_regulations FOR SELECT USING (true);

-- Políticas por company_id para usuarios autenticados
CREATE POLICY "Users can manage chart_accounts" ON erp_chart_accounts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage journals" ON erp_journals FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage journal_entries" ON erp_journal_entries FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage entry_lines" ON erp_journal_entry_lines FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage vat_register" ON erp_vat_register FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage payables" ON erp_payables FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage receivables" ON erp_receivables FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage payments" ON erp_payments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage receipts" ON erp_receipts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage bank_statements" ON erp_bank_statements FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage statement_lines" ON erp_bank_statement_lines FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage sepa_mandates" ON erp_sepa_mandates FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage sepa_remittances" ON erp_sepa_remittances FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage remittance_lines" ON erp_sepa_remittance_lines FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage generation_issues" ON erp_sepa_generation_issues FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage fiscal_closings" ON erp_fiscal_closings FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage closing_events" ON erp_closing_events FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage chatbot_contexts" ON erp_chatbot_contexts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage chatbot_conversations" ON erp_chatbot_conversations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage advisor_config" ON erp_advisor_agent_config FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage advisor_alerts" ON erp_advisor_alerts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage process_audit" ON erp_advisor_process_audit FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================

CREATE TRIGGER update_erp_accounting_countries_updated_at BEFORE UPDATE ON erp_accounting_countries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_chart_templates_updated_at BEFORE UPDATE ON erp_chart_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_accounting_regulations_updated_at BEFORE UPDATE ON erp_accounting_regulations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_chart_accounts_updated_at BEFORE UPDATE ON erp_chart_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_journals_updated_at BEFORE UPDATE ON erp_journals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_journal_entries_updated_at BEFORE UPDATE ON erp_journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_vat_register_updated_at BEFORE UPDATE ON erp_vat_register FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_payables_updated_at BEFORE UPDATE ON erp_payables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_receivables_updated_at BEFORE UPDATE ON erp_receivables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_payments_updated_at BEFORE UPDATE ON erp_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_receipts_updated_at BEFORE UPDATE ON erp_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_bank_statements_updated_at BEFORE UPDATE ON erp_bank_statements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_bank_statement_lines_updated_at BEFORE UPDATE ON erp_bank_statement_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_sepa_mandates_updated_at BEFORE UPDATE ON erp_sepa_mandates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_sepa_remittances_updated_at BEFORE UPDATE ON erp_sepa_remittances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_fiscal_closings_updated_at BEFORE UPDATE ON erp_fiscal_closings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_erp_advisor_agent_config_updated_at BEFORE UPDATE ON erp_advisor_agent_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();