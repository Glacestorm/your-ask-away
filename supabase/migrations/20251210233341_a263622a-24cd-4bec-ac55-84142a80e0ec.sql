-- =====================================================
-- FASE 1: RFM Analysis Tables
-- =====================================================

-- Customer RFM Scores table
CREATE TABLE public.customer_rfm_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recency_days INTEGER NOT NULL DEFAULT 0,
  recency_score INTEGER NOT NULL CHECK (recency_score BETWEEN 1 AND 5),
  frequency_count INTEGER NOT NULL DEFAULT 0,
  frequency_score INTEGER NOT NULL CHECK (frequency_score BETWEEN 1 AND 5),
  monetary_value NUMERIC NOT NULL DEFAULT 0,
  monetary_score INTEGER NOT NULL CHECK (monetary_score BETWEEN 1 AND 5),
  rfm_score INTEGER GENERATED ALWAYS AS (recency_score * 100 + frequency_score * 10 + monetary_score) STORED,
  rfm_segment TEXT NOT NULL,
  segment_description TEXT,
  recommended_actions TEXT[],
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- =====================================================
-- FASE 2: ML Segmentation Tables
-- =====================================================

-- Customer Segments from ML models
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  segment_type TEXT NOT NULL DEFAULT 'ml_generated',
  churn_probability NUMERIC CHECK (churn_probability BETWEEN 0 AND 1),
  churn_risk_level TEXT,
  clv_estimate NUMERIC,
  clv_percentile INTEGER,
  loyalty_score NUMERIC CHECK (loyalty_score BETWEEN 0 AND 100),
  engagement_score NUMERIC CHECK (engagement_score BETWEEN 0 AND 100),
  profitability_tier TEXT,
  decision_path TEXT[],
  feature_importance JSONB,
  model_confidence NUMERIC CHECK (model_confidence BETWEEN 0 AND 1),
  model_version TEXT,
  recommended_actions JSONB,
  priority_score INTEGER CHECK (priority_score BETWEEN 1 AND 100),
  next_best_action TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- =====================================================
-- FASE 3: Management Policies Tables
-- =====================================================

-- Segment Management Policies
CREATE TABLE public.segment_management_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_name TEXT NOT NULL UNIQUE,
  policy_name TEXT NOT NULL,
  description TEXT,
  target_metrics JSONB,
  action_triggers JSONB,
  automated_actions JSONB,
  visit_frequency_days INTEGER,
  communication_channel TEXT[],
  offer_types TEXT[],
  priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer Action Recommendations
CREATE TABLE public.customer_action_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_title TEXT NOT NULL,
  action_description TEXT,
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  expected_impact TEXT,
  estimated_value NUMERIC,
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  source_model TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ML Model Execution History
CREATE TABLE public.ml_model_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_type TEXT NOT NULL,
  model_version TEXT,
  execution_status TEXT NOT NULL DEFAULT 'running',
  companies_processed INTEGER DEFAULT 0,
  segments_created INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  parameters JSONB,
  results_summary JSONB,
  error_message TEXT,
  executed_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_rfm_scores_company ON public.customer_rfm_scores(company_id);
CREATE INDEX idx_rfm_scores_segment ON public.customer_rfm_scores(rfm_segment);
CREATE INDEX idx_rfm_scores_calculated ON public.customer_rfm_scores(calculated_at DESC);

CREATE INDEX idx_customer_segments_company ON public.customer_segments(company_id);
CREATE INDEX idx_customer_segments_name ON public.customer_segments(segment_name);
CREATE INDEX idx_customer_segments_churn ON public.customer_segments(churn_probability DESC);
CREATE INDEX idx_customer_segments_priority ON public.customer_segments(priority_score DESC);

CREATE INDEX idx_action_recommendations_company ON public.customer_action_recommendations(company_id);
CREATE INDEX idx_action_recommendations_status ON public.customer_action_recommendations(status);
CREATE INDEX idx_action_recommendations_priority ON public.customer_action_recommendations(priority);

CREATE INDEX idx_ml_executions_type ON public.ml_model_executions(model_type);
CREATE INDEX idx_ml_executions_status ON public.ml_model_executions(execution_status);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.customer_rfm_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_management_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_action_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_executions ENABLE ROW LEVEL SECURITY;

-- RFM Scores policies
CREATE POLICY "Admins can manage RFM scores" ON public.customer_rfm_scores
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view RFM scores" ON public.customer_rfm_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Customer Segments policies
CREATE POLICY "Admins can manage customer segments" ON public.customer_segments
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view customer segments" ON public.customer_segments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Segment Policies policies
CREATE POLICY "Admins can manage segment policies" ON public.segment_management_policies
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view segment policies" ON public.segment_management_policies
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Action Recommendations policies
CREATE POLICY "Admins can manage action recommendations" ON public.customer_action_recommendations
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestores can view their recommendations" ON public.customer_action_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies c 
      WHERE c.id = customer_action_recommendations.company_id 
      AND (c.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
    )
  );

-- ML Executions policies
CREATE POLICY "Admins can manage ML executions" ON public.ml_model_executions
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view ML executions" ON public.ml_model_executions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Insert Default Segment Policies
-- =====================================================

INSERT INTO public.segment_management_policies (segment_name, policy_name, description, visit_frequency_days, priority_level, communication_channel, offer_types) VALUES
('Champions', 'Retención VIP', 'Clientes de alto valor con engagement frecuente', 15, 5, ARRAY['personal', 'email', 'phone'], ARRAY['exclusivo', 'premium', 'early_access']),
('Loyal Customers', 'Programa Fidelización', 'Clientes frecuentes y rentables', 30, 4, ARRAY['email', 'phone'], ARRAY['rewards', 'upsell', 'cross_sell']),
('Potential Loyalists', 'Conversión a Lealtad', 'Clientes recientes con potencial', 21, 4, ARRAY['email', 'personal'], ARRAY['incentivo', 'trial_premium']),
('New Customers', 'Onboarding Intensivo', 'Clientes nuevos para activar', 7, 3, ARRAY['email', 'phone', 'personal'], ARRAY['welcome', 'tutorial', 'first_purchase']),
('Promising', 'Desarrollo de Potencial', 'Clientes con señales positivas', 30, 3, ARRAY['email'], ARRAY['engagement', 'education']),
('Need Attention', 'Reactivación Temprana', 'Clientes que muestran señales de desenganche', 14, 4, ARRAY['phone', 'email'], ARRAY['win_back', 'feedback']),
('About to Sleep', 'Prevención de Churn', 'Clientes en riesgo de abandonar', 7, 5, ARRAY['phone', 'personal'], ARRAY['rescue', 'special_offer']),
('At Risk', 'Rescate Urgente', 'Clientes de alto valor en riesgo', 3, 5, ARRAY['personal', 'phone'], ARRAY['vip_rescue', 'concierge']),
('Cannot Lose Them', 'Retención Crítica', 'Clientes críticos que debemos retener', 1, 5, ARRAY['personal'], ARRAY['executive_intervention', 'custom_solution']),
('Hibernating', 'Reactivación', 'Clientes inactivos recuperables', 60, 2, ARRAY['email'], ARRAY['reactivation', 'whats_new']),
('Lost', 'Win-Back Campaign', 'Clientes perdidos para campañas masivas', 90, 1, ARRAY['email'], ARRAY['win_back', 'survey']);

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE TRIGGER update_customer_rfm_scores_updated_at
  BEFORE UPDATE ON public.customer_rfm_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_segment_policies_updated_at
  BEFORE UPDATE ON public.segment_management_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_recommendations_updated_at
  BEFORE UPDATE ON public.customer_action_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();