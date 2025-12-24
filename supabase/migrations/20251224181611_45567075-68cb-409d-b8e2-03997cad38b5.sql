-- Quotation proposals table
CREATE TABLE IF NOT EXISTS public.quotation_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  contact_name TEXT,
  contact_email TEXT,
  modules JSONB NOT NULL DEFAULT '[]',
  addons JSONB DEFAULT '[]',
  users_count INTEGER NOT NULL DEFAULT 1,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual', 'perpetual')),
  base_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(12,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_applied NUMERIC(12,2) DEFAULT 0,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance metrics history for Core Web Vitals
CREATE TABLE IF NOT EXISTS public.performance_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lcp NUMERIC,
  fcp NUMERIC,
  cls NUMERIC,
  inp NUMERIC,
  ttfb NUMERIC,
  fid NUMERIC,
  page_url TEXT NOT NULL,
  page_path TEXT,
  user_agent TEXT,
  device_type TEXT DEFAULT 'desktop',
  connection_type TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Expansion predictions for Revenue Intelligence
CREATE TABLE IF NOT EXISTS public.expansion_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  propensity_score INTEGER CHECK (propensity_score >= 0 AND propensity_score <= 100),
  optimal_timing TEXT,
  recommended_products JSONB DEFAULT '[]',
  signals JSONB DEFAULT '{}',
  confidence NUMERIC(5,2),
  predicted_mrr_uplift NUMERIC(12,2),
  predicted_arr_uplift NUMERIC(12,2),
  model_version TEXT DEFAULT 'v1',
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead distribution rules for multi-channel
CREATE TABLE IF NOT EXISTS public.lead_distribution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT DEFAULT 'round_robin' CHECK (rule_type IN ('round_robin', 'weighted', 'specialty', 'load_balanced')),
  agent_weights JSONB DEFAULT '{}',
  specialty_filters JSONB DEFAULT '{}',
  channel_filters TEXT[] DEFAULT '{}',
  max_concurrent INTEGER DEFAULT 5,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SLA configurations
CREATE TABLE IF NOT EXISTS public.sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  first_response_minutes INTEGER DEFAULT 30,
  resolution_hours INTEGER DEFAULT 24,
  escalation_after_minutes INTEGER DEFAULT 60,
  escalation_to UUID,
  business_hours_only BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SLA tracking per conversation
CREATE TABLE IF NOT EXISTS public.sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  sla_config_id UUID REFERENCES public.sla_configs(id),
  first_response_at TIMESTAMPTZ,
  first_response_met BOOLEAN,
  resolution_at TIMESTAMPTZ,
  resolution_met BOOLEAN,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'met', 'breached', 'escalated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotation_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expansion_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distribution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotation_proposals
CREATE POLICY "quotation_proposals_select" ON public.quotation_proposals FOR SELECT USING (true);
CREATE POLICY "quotation_proposals_insert" ON public.quotation_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "quotation_proposals_update" ON public.quotation_proposals FOR UPDATE USING (true);

-- RLS Policies for performance_metrics_history
CREATE POLICY "perf_metrics_insert" ON public.performance_metrics_history FOR INSERT WITH CHECK (true);
CREATE POLICY "perf_metrics_select" ON public.performance_metrics_history FOR SELECT USING (true);

-- RLS Policies for expansion_predictions
CREATE POLICY "expansion_pred_select" ON public.expansion_predictions FOR SELECT USING (true);
CREATE POLICY "expansion_pred_all" ON public.expansion_predictions FOR ALL USING (true);

-- RLS Policies for lead_distribution_rules
CREATE POLICY "lead_dist_all" ON public.lead_distribution_rules FOR ALL USING (true);

-- RLS Policies for sla_configs
CREATE POLICY "sla_configs_all" ON public.sla_configs FOR ALL USING (true);

-- RLS Policies for sla_tracking
CREATE POLICY "sla_tracking_all" ON public.sla_tracking FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotation_proposals_company ON public.quotation_proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_quotation_proposals_status ON public.quotation_proposals(status);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_recorded ON public.performance_metrics_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_page ON public.performance_metrics_history(page_path);
CREATE INDEX IF NOT EXISTS idx_expansion_pred_company ON public.expansion_predictions(company_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_conv ON public.sla_tracking(conversation_id);