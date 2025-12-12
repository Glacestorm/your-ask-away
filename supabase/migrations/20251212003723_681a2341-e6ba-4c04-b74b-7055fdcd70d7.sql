-- Tabla model_explanations para Explainable AI
CREATE TABLE IF NOT EXISTS public.model_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  model_version TEXT,
  feature_importances JSONB DEFAULT '[]'::jsonb,
  decision_path TEXT[],
  counterfactuals JSONB DEFAULT '[]'::jsonb,
  confidence_intervals JSONB,
  human_readable_explanation TEXT,
  shap_values JSONB,
  lime_weights JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla ml_model_registry para versionado de modelos
CREATE TABLE IF NOT EXISTS public.ml_model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  training_data_info JSONB,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_production BOOLEAN DEFAULT false,
  ab_test_group TEXT,
  ab_test_weight NUMERIC DEFAULT 1.0,
  trained_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, version)
);

-- Tabla para A/B testing de modelos
CREATE TABLE IF NOT EXISTS public.ml_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  description TEXT,
  model_a_id UUID REFERENCES public.ml_model_registry(id),
  model_b_id UUID REFERENCES public.ml_model_registry(id),
  traffic_split_a NUMERIC DEFAULT 0.5,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'stopped')),
  results JSONB DEFAULT '{}'::jsonb,
  winner_model_id UUID REFERENCES public.ml_model_registry(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para tracking de predicciones con A/B test
CREATE TABLE IF NOT EXISTS public.ml_prediction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.ml_model_registry(id),
  ab_test_id UUID REFERENCES public.ml_ab_tests(id),
  company_id UUID REFERENCES public.companies(id),
  input_features JSONB NOT NULL,
  prediction JSONB NOT NULL,
  prediction_probability NUMERIC,
  actual_outcome JSONB,
  is_correct BOOLEAN,
  latency_ms INTEGER,
  explanation_id UUID REFERENCES public.model_explanations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.model_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_prediction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage model explanations" ON public.model_explanations
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view model explanations" ON public.model_explanations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage model registry" ON public.ml_model_registry
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view model registry" ON public.ml_model_registry
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage AB tests" ON public.ml_ab_tests
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view AB tests" ON public.ml_ab_tests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage prediction logs" ON public.ml_prediction_logs
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "System can insert prediction logs" ON public.ml_prediction_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view prediction logs" ON public.ml_prediction_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Indices
CREATE INDEX IF NOT EXISTS idx_model_explanations_company ON public.model_explanations(company_id);
CREATE INDEX IF NOT EXISTS idx_model_explanations_model_type ON public.model_explanations(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_model_registry_active ON public.ml_model_registry(is_active, is_production);
CREATE INDEX IF NOT EXISTS idx_ml_prediction_logs_model ON public.ml_prediction_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_prediction_logs_company ON public.ml_prediction_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ml_ab_tests_status ON public.ml_ab_tests(status);