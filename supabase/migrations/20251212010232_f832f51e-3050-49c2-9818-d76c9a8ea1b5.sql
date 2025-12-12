-- FASE 4: Core Banking Interoperability Tables

-- Core Banking Configuration per entity
CREATE TABLE public.core_banking_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT NOT NULL,
  core_type TEXT NOT NULL CHECK (core_type IN ('temenos', 'finastra', 'mambu', 'thought_machine', 'custom')),
  api_endpoint TEXT NOT NULL,
  api_version TEXT DEFAULT 'v1',
  auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth2', 'api_key', 'mtls', 'basic')),
  auth_config JSONB DEFAULT '{}',
  timeout_ms INTEGER DEFAULT 30000,
  retry_config JSONB DEFAULT '{"maxRetries": 3, "backoffMs": 1000}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Field Mappings ObelixIA <-> Core Banking
CREATE TABLE public.integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.core_banking_configs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'contact', 'product', 'transaction', 'account', 'payment')),
  obelixia_field TEXT NOT NULL,
  core_field TEXT NOT NULL,
  transformation_rule JSONB DEFAULT '{}',
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Async Operation Queue
CREATE TABLE public.integration_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.core_banking_configs(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sync_company', 'sync_account', 'push_transaction', 'pull_balance', 'payment_initiation', 'vrp_mandate', 'sepa_instant')),
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- VRP (Variable Recurring Payments) Mandates
CREATE TABLE public.vrp_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID REFERENCES public.open_banking_consents(id),
  tpp_id TEXT NOT NULL,
  debtor_account TEXT NOT NULL,
  creditor_account TEXT NOT NULL,
  creditor_name TEXT NOT NULL,
  max_amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  max_per_period DECIMAL(15,2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  status TEXT DEFAULT 'awaiting_authorization' CHECK (status IN ('awaiting_authorization', 'authorized', 'rejected', 'revoked', 'expired')),
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VRP Payment Executions
CREATE TABLE public.vrp_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES public.vrp_mandates(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  execution_date TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  end_to_end_id TEXT NOT NULL,
  payment_reference TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SEPA Instant Payments
CREATE TABLE public.sepa_instant_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tpp_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  debtor_iban TEXT NOT NULL,
  debtor_name TEXT NOT NULL,
  creditor_iban TEXT NOT NULL,
  creditor_name TEXT NOT NULL,
  creditor_bic TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  remittance_info TEXT,
  end_to_end_id TEXT NOT NULL UNIQUE,
  instruction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'settled', 'cancelled')),
  settlement_date TIMESTAMPTZ,
  rejection_reason TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Premium API Access Tiers
CREATE TABLE public.premium_api_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  description TEXT,
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  features JSONB DEFAULT '[]',
  price_monthly DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TPP Premium Subscriptions
CREATE TABLE public.tpp_premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tpp_id TEXT NOT NULL,
  tier_id UUID REFERENCES public.premium_api_tiers(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.core_banking_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vrp_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vrp_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sepa_instant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_api_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpp_premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins
CREATE POLICY "Admins can manage core banking configs" ON public.core_banking_configs
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage integration mappings" ON public.integration_mappings
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage integration queue" ON public.integration_queue
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can view VRP mandates" ON public.vrp_mandates
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can view VRP payments" ON public.vrp_payments
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can view SEPA instant payments" ON public.sepa_instant_payments
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Anyone can view premium tiers" ON public.premium_api_tiers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage premium tiers" ON public.premium_api_tiers
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage TPP subscriptions" ON public.tpp_premium_subscriptions
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

-- Insert default premium tiers
INSERT INTO public.premium_api_tiers (tier_name, description, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day, features, price_monthly) VALUES
('basic', 'Basic API access', 30, 500, 5000, '["accounts", "balances", "transactions"]', 0),
('standard', 'Standard API access with payments', 60, 1000, 10000, '["accounts", "balances", "transactions", "payments", "funds_confirmation"]', 99.00),
('premium', 'Premium API access with VRP and SEPA Instant', 120, 2000, 20000, '["accounts", "balances", "transactions", "payments", "funds_confirmation", "vrp", "sepa_instant"]', 299.00),
('enterprise', 'Enterprise API access with all features', 300, 5000, 50000, '["accounts", "balances", "transactions", "payments", "funds_confirmation", "vrp", "sepa_instant", "bulk_payments", "standing_orders", "direct_debits"]', 999.00);

-- Triggers for updated_at
CREATE TRIGGER update_core_banking_configs_updated_at
  BEFORE UPDATE ON public.core_banking_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vrp_mandates_updated_at
  BEFORE UPDATE ON public.vrp_mandates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sepa_instant_updated_at
  BEFORE UPDATE ON public.sepa_instant_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_integration_queue_status ON public.integration_queue(status, scheduled_at);
CREATE INDEX idx_integration_queue_config ON public.integration_queue(config_id);
CREATE INDEX idx_vrp_mandates_consent ON public.vrp_mandates(consent_id);
CREATE INDEX idx_vrp_payments_mandate ON public.vrp_payments(mandate_id);
CREATE INDEX idx_sepa_instant_tpp ON public.sepa_instant_payments(tpp_id);
CREATE INDEX idx_sepa_instant_status ON public.sepa_instant_payments(status);