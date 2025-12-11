
-- Create enriched_transactions table for transaction enrichment
CREATE TABLE public.enriched_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  original_transaction_id TEXT,
  transaction_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  merchant_name TEXT,
  merchant_logo_url TEXT,
  category TEXT,
  subcategory TEXT,
  mcc_code TEXT,
  location JSONB DEFAULT '{}'::jsonb,
  is_recurring BOOLEAN DEFAULT false,
  recurring_type TEXT,
  recurring_frequency TEXT,
  confidence_score NUMERIC DEFAULT 0,
  raw_description TEXT,
  enriched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_360_profiles table for unified customer view
CREATE TABLE public.customer_360_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  -- Scores consolidados
  rfm_score JSONB DEFAULT '{}'::jsonb,
  churn_probability NUMERIC,
  credit_score NUMERIC,
  clv_score NUMERIC,
  health_score NUMERIC,
  -- Métricas de engagement
  total_visits INTEGER DEFAULT 0,
  successful_visits INTEGER DEFAULT 0,
  last_visit_date DATE,
  avg_visit_frequency_days NUMERIC,
  -- Métricas financieras
  total_products INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  total_transaction_volume NUMERIC DEFAULT 0,
  avg_monthly_volume NUMERIC DEFAULT 0,
  -- Segmentación
  segment TEXT,
  tier TEXT,
  lifecycle_stage TEXT,
  -- Preferencias detectadas
  preferred_channel TEXT,
  preferred_contact_time TEXT,
  communication_preferences JSONB DEFAULT '{}'::jsonb,
  -- Recomendaciones
  recommended_products JSONB DEFAULT '[]'::jsonb,
  cross_sell_opportunities JSONB DEFAULT '[]'::jsonb,
  next_best_actions JSONB DEFAULT '[]'::jsonb,
  -- Riesgos
  risk_flags JSONB DEFAULT '[]'::jsonb,
  compliance_status TEXT DEFAULT 'compliant',
  -- Timeline consolidado
  interaction_summary JSONB DEFAULT '{}'::jsonb,
  -- Metadatos
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_interactions table for unified timeline
CREATE TABLE public.customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'visit', 'call', 'email', 'transaction', 'document', 'alert'
  interaction_date TIMESTAMPTZ NOT NULL,
  channel TEXT,
  subject TEXT,
  description TEXT,
  outcome TEXT,
  sentiment TEXT,
  importance TEXT DEFAULT 'normal',
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enriched_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_360_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for enriched_transactions
CREATE POLICY "Admins can manage all enriched transactions"
ON public.enriched_transactions FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestores can view their company transactions"
ON public.enriched_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = enriched_transactions.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

CREATE POLICY "Gestores can insert transactions for their companies"
ON public.enriched_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = enriched_transactions.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- RLS policies for customer_360_profiles
CREATE POLICY "Admins can manage all 360 profiles"
ON public.customer_360_profiles FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestores can view their company profiles"
ON public.customer_360_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = customer_360_profiles.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- RLS policies for customer_interactions
CREATE POLICY "Admins can manage all interactions"
ON public.customer_interactions FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestores can view their company interactions"
ON public.customer_interactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = customer_interactions.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

CREATE POLICY "Gestores can insert interactions for their companies"
ON public.customer_interactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = customer_interactions.company_id
    AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- Create indexes for performance
CREATE INDEX idx_enriched_transactions_company ON public.enriched_transactions(company_id);
CREATE INDEX idx_enriched_transactions_date ON public.enriched_transactions(transaction_date);
CREATE INDEX idx_enriched_transactions_category ON public.enriched_transactions(category);
CREATE INDEX idx_customer_360_company ON public.customer_360_profiles(company_id);
CREATE INDEX idx_customer_interactions_company ON public.customer_interactions(company_id);
CREATE INDEX idx_customer_interactions_date ON public.customer_interactions(interaction_date);
CREATE INDEX idx_customer_interactions_type ON public.customer_interactions(interaction_type);

-- Function to calculate customer 360 profile
CREATE OR REPLACE FUNCTION calculate_customer_360(p_company_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_visits INTEGER;
  v_successful_visits INTEGER;
  v_last_visit DATE;
  v_total_products INTEGER;
  v_active_products INTEGER;
  v_segment TEXT;
  v_churn_prob NUMERIC;
BEGIN
  -- Calculate visit metrics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE result = 'positive'),
    MAX(visit_date)::DATE
  INTO v_total_visits, v_successful_visits, v_last_visit
  FROM visits
  WHERE company_id = p_company_id;

  -- Calculate product metrics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE active = true)
  INTO v_total_products, v_active_products
  FROM company_products
  WHERE company_id = p_company_id;

  -- Determine segment based on metrics
  v_segment := CASE
    WHEN v_total_products >= 5 AND v_successful_visits >= 10 THEN 'Premium'
    WHEN v_total_products >= 3 OR v_successful_visits >= 5 THEN 'Growth'
    WHEN v_total_products >= 1 THEN 'Standard'
    ELSE 'New'
  END;

  -- Calculate churn probability (simplified)
  v_churn_prob := CASE
    WHEN v_last_visit IS NULL THEN 0.8
    WHEN v_last_visit < CURRENT_DATE - INTERVAL '180 days' THEN 0.7
    WHEN v_last_visit < CURRENT_DATE - INTERVAL '90 days' THEN 0.5
    WHEN v_last_visit < CURRENT_DATE - INTERVAL '30 days' THEN 0.3
    ELSE 0.1
  END;

  -- Upsert the 360 profile
  INSERT INTO customer_360_profiles (
    company_id,
    total_visits,
    successful_visits,
    last_visit_date,
    total_products,
    active_products,
    segment,
    churn_probability,
    health_score,
    last_calculated_at
  ) VALUES (
    p_company_id,
    v_total_visits,
    v_successful_visits,
    v_last_visit,
    v_total_products,
    v_active_products,
    v_segment,
    v_churn_prob,
    (1 - v_churn_prob) * 100,
    now()
  )
  ON CONFLICT (company_id) DO UPDATE SET
    total_visits = EXCLUDED.total_visits,
    successful_visits = EXCLUDED.successful_visits,
    last_visit_date = EXCLUDED.last_visit_date,
    total_products = EXCLUDED.total_products,
    active_products = EXCLUDED.active_products,
    segment = EXCLUDED.segment,
    churn_probability = EXCLUDED.churn_probability,
    health_score = EXCLUDED.health_score,
    last_calculated_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
