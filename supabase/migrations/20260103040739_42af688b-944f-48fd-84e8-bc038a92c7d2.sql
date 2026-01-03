-- =====================================================
-- ERP BANKING HUB - Con RLS correcto via erp_user_companies
-- =====================================================

-- Tabla de cuentas bancarias ERP
CREATE TABLE public.erp_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift_bic TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  currency TEXT DEFAULT 'EUR',
  account_type TEXT DEFAULT 'checking',
  chart_account_id UUID,
  current_balance DECIMAL(18,2) DEFAULT 0,
  available_balance DECIMAL(18,2) DEFAULT 0,
  credit_limit DECIMAL(18,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_reconciled_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erp_bank_accounts_policy" ON public.erp_bank_accounts FOR ALL TO authenticated 
USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE INDEX idx_erp_bank_accounts_company ON public.erp_bank_accounts(company_id);

-- Proveedores bancarios (catálogo global)
CREATE TABLE public.erp_banking_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_code TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  country_code TEXT DEFAULT 'ES',
  region TEXT DEFAULT 'europe',
  protocol TEXT DEFAULT 'psd2',
  api_base_url TEXT,
  auth_type TEXT DEFAULT 'oauth2',
  supported_features JSONB DEFAULT '["balance", "transactions", "accounts"]'::jsonb,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_certificate BOOLEAN DEFAULT false,
  sandbox_available BOOLEAN DEFAULT true,
  rate_limits JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_banking_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erp_banking_providers_select" ON public.erp_banking_providers FOR SELECT TO authenticated USING (true);

-- Conexiones bancarias
CREATE TABLE public.erp_bank_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.erp_banking_providers(id),
  bank_account_id UUID REFERENCES public.erp_bank_accounts(id),
  connection_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  auth_data JSONB DEFAULT '{}'::jsonb,
  consent_id TEXT,
  consent_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily',
  auto_reconcile BOOLEAN DEFAULT true,
  auto_create_entries BOOLEAN DEFAULT true,
  default_journal_id UUID,
  account_mapping JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_bank_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erp_bank_connections_policy" ON public.erp_bank_connections FOR ALL TO authenticated 
USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE INDEX idx_erp_bank_connections_company ON public.erp_bank_connections(company_id);
CREATE INDEX idx_erp_bank_connections_status ON public.erp_bank_connections(status);

-- Sync logs
CREATE TABLE public.erp_bank_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.erp_bank_connections(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  sync_type TEXT DEFAULT 'transactions',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_fetched INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  records_matched INTEGER DEFAULT 0,
  entries_created INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  api_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_bank_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erp_bank_sync_logs_policy" ON public.erp_bank_sync_logs FOR ALL TO authenticated 
USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE INDEX idx_erp_bank_sync_logs_connection ON public.erp_bank_sync_logs(connection_id);

-- Transacciones bancarias importadas
CREATE TABLE public.erp_bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.erp_bank_connections(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES public.erp_bank_accounts(id),
  external_id TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount DECIMAL(18,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  reference TEXT,
  counterparty_name TEXT,
  counterparty_account TEXT,
  counterparty_bank TEXT,
  category_code TEXT,
  category_name TEXT,
  balance_after DECIMAL(18,2),
  status TEXT DEFAULT 'pending',
  match_confidence DECIMAL(5,2),
  matched_entity_type TEXT,
  matched_entity_id UUID,
  journal_entry_id UUID,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  suggested_account_id UUID,
  suggested_partner_id UUID,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of_id UUID,
  raw_data JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connection_id, external_id)
);

ALTER TABLE public.erp_bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erp_bank_transactions_policy" ON public.erp_bank_transactions FOR ALL TO authenticated 
USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE INDEX idx_erp_bank_transactions_company ON public.erp_bank_transactions(company_id);
CREATE INDEX idx_erp_bank_transactions_date ON public.erp_bank_transactions(transaction_date);
CREATE INDEX idx_erp_bank_transactions_status ON public.erp_bank_transactions(status);

-- Reglas de categorización automática
CREATE TABLE public.erp_bank_categorization_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '{}'::jsonb,
  match_count INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_bank_categorization_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erp_bank_rules_policy" ON public.erp_bank_categorization_rules FOR ALL TO authenticated 
USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

-- Posiciones bancarias consolidadas
CREATE TABLE public.erp_bank_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  position_date DATE NOT NULL,
  total_balance DECIMAL(18,2) DEFAULT 0,
  total_available DECIMAL(18,2) DEFAULT 0,
  total_credit_lines DECIMAL(18,2) DEFAULT 0,
  total_used_credit DECIMAL(18,2) DEFAULT 0,
  by_currency JSONB DEFAULT '{}'::jsonb,
  by_bank JSONB DEFAULT '{}'::jsonb,
  by_account JSONB DEFAULT '{}'::jsonb,
  cash_flow_forecast JSONB DEFAULT '{}'::jsonb,
  alerts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, position_date)
);

ALTER TABLE public.erp_bank_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erp_bank_positions_policy" ON public.erp_bank_positions FOR ALL TO authenticated 
USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));
CREATE INDEX idx_erp_bank_positions_date ON public.erp_bank_positions(company_id, position_date);

-- Insertar 50 proveedores bancarios principales globales
INSERT INTO public.erp_banking_providers (provider_code, provider_name, country_code, region, protocol, auth_type, supported_features) VALUES
-- España
('santander_es', 'Banco Santander', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('bbva_es', 'BBVA', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('caixabank', 'CaixaBank', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('sabadell', 'Banco Sabadell', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('bankinter', 'Bankinter', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('unicaja', 'Unicaja', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('ibercaja', 'Ibercaja', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('abanca', 'Abanca', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('kutxabank', 'Kutxabank', 'ES', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
-- Europa
('deutsche_bank', 'Deutsche Bank', 'DE', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('commerzbank', 'Commerzbank', 'DE', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('bnp_paribas', 'BNP Paribas', 'FR', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('credit_agricole', 'Crédit Agricole', 'FR', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('societe_generale', 'Société Générale', 'FR', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('ing', 'ING', 'NL', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('rabobank', 'Rabobank', 'NL', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('unicredit', 'UniCredit', 'IT', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('intesa', 'Intesa Sanpaolo', 'IT', 'europe', 'psd2', 'oauth2', '["balance", "transactions", "accounts"]'),
('barclays', 'Barclays', 'GB', 'europe', 'open_banking', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('hsbc', 'HSBC', 'GB', 'global', 'open_banking', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('lloyds', 'Lloyds Banking Group', 'GB', 'europe', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('natwest', 'NatWest', 'GB', 'europe', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('ubs', 'UBS', 'CH', 'europe', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('credit_suisse', 'Credit Suisse', 'CH', 'europe', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
-- América
('jpmorgan', 'JPMorgan Chase', 'US', 'americas', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('bank_of_america', 'Bank of America', 'US', 'americas', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('wells_fargo', 'Wells Fargo', 'US', 'americas', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('citibank', 'Citibank', 'US', 'global', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('goldman_sachs', 'Goldman Sachs', 'US', 'global', 'proprietary', 'api_key', '["balance", "transactions", "accounts"]'),
('scotiabank', 'Scotiabank', 'CA', 'americas', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('td_bank', 'TD Bank', 'CA', 'americas', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('bbva_mx', 'BBVA México', 'MX', 'americas', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('banorte', 'Banorte', 'MX', 'americas', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('itau', 'Itaú Unibanco', 'BR', 'americas', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('bradesco', 'Bradesco', 'BR', 'americas', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('santander_cl', 'Santander Chile', 'CL', 'americas', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('banco_chile', 'Banco de Chile', 'CL', 'americas', 'proprietary', 'api_key', '["balance", "transactions", "accounts"]'),
-- Asia-Pacífico
('dbs', 'DBS Bank', 'SG', 'asia', 'open_banking', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('ocbc', 'OCBC Bank', 'SG', 'asia', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('mufg', 'MUFG Bank', 'JP', 'asia', 'proprietary', 'certificate', '["balance", "transactions", "accounts"]'),
('mizuho', 'Mizuho Bank', 'JP', 'asia', 'proprietary', 'certificate', '["balance", "transactions", "accounts"]'),
('icbc', 'ICBC', 'CN', 'asia', 'proprietary', 'certificate', '["balance", "transactions", "accounts"]'),
('bank_of_china', 'Bank of China', 'CN', 'asia', 'proprietary', 'certificate', '["balance", "transactions", "accounts"]'),
('anz', 'ANZ Bank', 'AU', 'asia', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
('westpac', 'Westpac', 'AU', 'asia', 'open_banking', 'oauth2', '["balance", "transactions", "accounts"]'),
-- África y Medio Oriente  
('standard_bank', 'Standard Bank', 'ZA', 'africa', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('fnb', 'First National Bank', 'ZA', 'africa', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
('emirates_nbd', 'Emirates NBD', 'AE', 'middle_east', 'proprietary', 'oauth2', '["balance", "transactions", "accounts"]'),
-- Agregadores globales
('plaid', 'Plaid', 'US', 'global', 'aggregator', 'oauth2', '["balance", "transactions", "accounts", "identity"]'),
('tink', 'Tink', 'SE', 'europe', 'aggregator', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('nordigen', 'Nordigen (GoCardless)', 'GB', 'europe', 'aggregator', 'oauth2', '["balance", "transactions", "accounts"]'),
('truelayer', 'TrueLayer', 'GB', 'europe', 'aggregator', 'oauth2', '["balance", "transactions", "accounts", "payments"]'),
('yodlee', 'Yodlee', 'US', 'global', 'aggregator', 'oauth2', '["balance", "transactions", "accounts"]'),
('salt_edge', 'Salt Edge', 'CA', 'global', 'aggregator', 'oauth2', '["balance", "transactions", "accounts"]');