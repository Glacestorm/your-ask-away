-- =====================================================
-- FASE 1: MÓDULO DE FINANCIACIÓN E INVERSIONES
-- Tablas base con RLS policies (sin FK a erp_entities)
-- =====================================================

-- 1. OPERACIONES DE FINANCIACIÓN (Leasing, Pólizas, Préstamos)
CREATE TABLE public.erp_financing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  -- Tipo de operación
  operation_type TEXT NOT NULL CHECK (operation_type IN ('leasing', 'credit_policy', 'loan')),
  loan_subtype TEXT CHECK (loan_subtype IN ('personal', 'mortgage', 'monetary', 'guaranteed')),
  
  -- Entidad financiera y contrato
  financial_entity_name TEXT NOT NULL,
  financial_entity_code TEXT,
  contract_number TEXT NOT NULL,
  description TEXT,
  
  -- Importes
  principal_amount DECIMAL(18,2) NOT NULL,
  outstanding_balance DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Condiciones de interés
  interest_rate DECIMAL(8,4) NOT NULL,
  interest_type TEXT NOT NULL DEFAULT 'fixed' CHECK (interest_type IN ('fixed', 'variable', 'mixed')),
  reference_rate TEXT CHECK (reference_rate IN ('euribor_1m', 'euribor_3m', 'euribor_6m', 'euribor_12m', 'sofr', 'libor_usd', 'prime')),
  spread DECIMAL(8,4),
  
  -- Plazos
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  term_months INTEGER NOT NULL,
  
  -- Pagos
  payment_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  next_payment_date DATE,
  payment_amount DECIMAL(18,2),
  
  -- Específicos por tipo
  credit_limit DECIMAL(18,2),
  guarantee_type TEXT,
  guarantee_details JSONB,
  asset_description TEXT,
  residual_value DECIMAL(18,2),
  
  -- Estado y contabilidad
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'pending', 'active', 'closed', 'cancelled')),
  accounting_account_code TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. PAGOS/CUOTAS DE FINANCIACIÓN
CREATE TABLE public.erp_financing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES public.erp_financing_operations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  
  principal_amount DECIMAL(18,2) NOT NULL,
  interest_amount DECIMAL(18,2) NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  fees DECIMAL(18,2) DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  journal_entry_id UUID,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INVERSIONES (Depósitos, Bonos, Acciones)
CREATE TABLE public.erp_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  -- Tipo de inversión
  investment_type TEXT NOT NULL CHECK (investment_type IN ('deposit', 'bond', 'equity_stock', 'fixed_income')),
  
  -- Identificación
  financial_entity_name TEXT,
  isin_code TEXT,
  investment_name TEXT NOT NULL,
  description TEXT,
  
  -- Valoración
  nominal_amount DECIMAL(18,2) NOT NULL,
  current_value DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Rendimiento
  interest_rate DECIMAL(8,4),
  yield_rate DECIMAL(8,4),
  
  -- Fechas y precios
  purchase_date DATE NOT NULL,
  maturity_date DATE,
  purchase_price DECIMAL(18,6),
  
  -- Para acciones
  units_quantity DECIMAL(18,6),
  unit_price DECIMAL(18,6),
  
  -- Para bonos estructurados
  bond_structure_type TEXT,
  coupon_frequency TEXT CHECK (coupon_frequency IN ('monthly', 'quarterly', 'semiannual', 'annual', 'at_maturity')),
  next_coupon_date DATE,
  
  -- Estado y contabilidad
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'pending', 'active', 'matured', 'sold', 'cancelled')),
  accounting_account_code TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. TRANSACCIONES DE INVERSIÓN
CREATE TABLE public.erp_investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES public.erp_investments(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'coupon', 'maturity', 'valuation')),
  transaction_date DATE NOT NULL,
  
  units DECIMAL(18,6),
  price_per_unit DECIMAL(18,6),
  total_amount DECIMAL(18,2) NOT NULL,
  fees DECIMAL(18,2) DEFAULT 0,
  
  realized_pnl DECIMAL(18,2),
  journal_entry_id UUID,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TIPOS DE INTERÉS DE MERCADO (Cache)
CREATE TABLE public.erp_market_interest_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rate_code TEXT NOT NULL,
  rate_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  tenor TEXT NOT NULL,
  
  rate_value DECIMAL(8,6) NOT NULL,
  rate_date DATE NOT NULL,
  previous_value DECIMAL(8,6),
  change_bps DECIMAL(8,2),
  
  source TEXT NOT NULL DEFAULT 'ecb',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(rate_code, rate_date)
);

-- 6. WATCHLIST DE ACCIONES
CREATE TABLE public.erp_market_stock_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.erp_companies(id) ON DELETE CASCADE,
  
  isin_code TEXT,
  symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  exchange TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  last_price DECIMAL(18,6),
  price_change DECIMAL(18,6),
  price_change_pct DECIMAL(8,4),
  day_high DECIMAL(18,6),
  day_low DECIMAL(18,6),
  volume BIGINT,
  market_cap DECIMAL(18,2),
  
  price_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(company_id, symbol)
);

-- ÍNDICES
CREATE INDEX idx_erp_financing_ops_company ON public.erp_financing_operations(company_id);
CREATE INDEX idx_erp_financing_ops_type ON public.erp_financing_operations(operation_type);
CREATE INDEX idx_erp_financing_ops_status ON public.erp_financing_operations(status);

CREATE INDEX idx_erp_financing_pay_op ON public.erp_financing_payments(operation_id);
CREATE INDEX idx_erp_financing_pay_company ON public.erp_financing_payments(company_id);
CREATE INDEX idx_erp_financing_pay_due ON public.erp_financing_payments(due_date);

CREATE INDEX idx_erp_inv_company ON public.erp_investments(company_id);
CREATE INDEX idx_erp_inv_type ON public.erp_investments(investment_type);
CREATE INDEX idx_erp_inv_isin ON public.erp_investments(isin_code);

CREATE INDEX idx_erp_inv_tx_inv ON public.erp_investment_transactions(investment_id);
CREATE INDEX idx_erp_inv_tx_company ON public.erp_investment_transactions(company_id);

CREATE INDEX idx_erp_rates_code ON public.erp_market_interest_rates(rate_code);
CREATE INDEX idx_erp_rates_currency ON public.erp_market_interest_rates(currency);

CREATE INDEX idx_erp_stocks_company ON public.erp_market_stock_watchlist(company_id);

-- RLS
ALTER TABLE public.erp_financing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_financing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_market_interest_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_market_stock_watchlist ENABLE ROW LEVEL SECURITY;

-- Financing Operations policies
CREATE POLICY "erp_financing_ops_select" ON public.erp_financing_operations FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_financing_ops_insert" ON public.erp_financing_operations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_financing_ops_update" ON public.erp_financing_operations FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_financing_ops_delete" ON public.erp_financing_operations FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true) AND status IN ('draft', 'pending'));

-- Financing Payments policies
CREATE POLICY "erp_financing_pay_select" ON public.erp_financing_payments FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_financing_pay_insert" ON public.erp_financing_payments FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_financing_pay_update" ON public.erp_financing_payments FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_financing_pay_delete" ON public.erp_financing_payments FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true) AND status = 'pending');

-- Investments policies
CREATE POLICY "erp_inv_select" ON public.erp_investments FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_inv_insert" ON public.erp_investments FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_inv_update" ON public.erp_investments FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_inv_delete" ON public.erp_investments FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true) AND status IN ('draft', 'pending'));

-- Investment Transactions policies
CREATE POLICY "erp_inv_tx_select" ON public.erp_investment_transactions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_inv_tx_insert" ON public.erp_investment_transactions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_inv_tx_update" ON public.erp_investment_transactions FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_inv_tx_delete" ON public.erp_investment_transactions FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true) AND journal_entry_id IS NULL);

-- Market Interest Rates (public read)
CREATE POLICY "erp_rates_select" ON public.erp_market_interest_rates FOR SELECT USING (true);
CREATE POLICY "erp_rates_insert" ON public.erp_market_interest_rates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "erp_rates_update" ON public.erp_market_interest_rates FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Stock Watchlist policies
CREATE POLICY "erp_stocks_select" ON public.erp_market_stock_watchlist FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_stocks_insert" ON public.erp_market_stock_watchlist FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_stocks_update" ON public.erp_market_stock_watchlist FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "erp_stocks_delete" ON public.erp_market_stock_watchlist FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.erp_user_companies WHERE user_id = auth.uid() AND is_active = true));

-- TRIGGERS updated_at
CREATE TRIGGER update_erp_financing_operations_ts
  BEFORE UPDATE ON public.erp_financing_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_financing_payments_ts
  BEFORE UPDATE ON public.erp_financing_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_investments_ts
  BEFORE UPDATE ON public.erp_investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_investment_transactions_ts
  BEFORE UPDATE ON public.erp_investment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_market_stock_watchlist_ts
  BEFORE UPDATE ON public.erp_market_stock_watchlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();