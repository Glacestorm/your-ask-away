-- =====================================================
-- STRATEGIC PLANNING & VIABILITY MODULE - DATABASE SCHEMA
-- =====================================================

-- 1. DAFO ANALYSIS TABLES
CREATE TABLE public.business_dafo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  analysis_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  ai_generated BOOLEAN DEFAULT false,
  sector_key TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.dafo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dafo_id UUID NOT NULL REFERENCES public.business_dafo_analysis(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('threats', 'opportunities', 'weaknesses', 'strengths')),
  description TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  concept TEXT,
  action_plan TEXT,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BUSINESS PLAN EVALUATION TABLES
CREATE TABLE public.business_plan_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_description TEXT,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  evaluator_id UUID REFERENCES auth.users(id),
  total_score DECIMAL(5,2) DEFAULT 0,
  viability_level TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.business_plan_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.business_plan_evaluations(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 10),
  section_name TEXT NOT NULL,
  section_weight DECIMAL(3,2) DEFAULT 0.10,
  questions JSONB DEFAULT '[]'::jsonb,
  section_score DECIMAL(5,2) DEFAULT 0,
  section_max_score DECIMAL(5,2) DEFAULT 100,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evaluation_id, section_number)
);

-- 3. FINANCIAL VIABILITY PLANS
CREATE TABLE public.financial_viability_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  description TEXT,
  start_year INTEGER NOT NULL,
  projection_years INTEGER DEFAULT 5 CHECK (projection_years BETWEEN 1 AND 10),
  base_currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'approved', 'archived')),
  synced_with_accounting BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_source TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.financial_plan_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.financial_viability_plans(id) ON DELETE CASCADE,
  variable_key TEXT NOT NULL,
  variable_name TEXT NOT NULL,
  year INTEGER,
  value DECIMAL(15,4),
  percentage DECIMAL(8,4),
  unit TEXT DEFAULT 'value',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, variable_key, year)
);

CREATE TABLE public.financial_plan_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.financial_viability_plans(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('balance_asset', 'balance_liability', 'balance_equity', 'income', 'expense', 'cash_flow')),
  parent_code TEXT,
  year INTEGER NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'synced', 'projected', 'formula')),
  formula TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, account_code, year)
);

CREATE TABLE public.financial_plan_ratios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.financial_viability_plans(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  ratio_key TEXT NOT NULL,
  ratio_name TEXT NOT NULL,
  ratio_value DECIMAL(15,4),
  benchmark_value DECIMAL(15,4),
  status TEXT CHECK (status IN ('excellent', 'good', 'acceptable', 'warning', 'critical')),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, year, ratio_key)
);

-- 4. SCENARIO SIMULATION
CREATE TABLE public.financial_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.financial_viability_plans(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  scenario_type TEXT DEFAULT 'custom' CHECK (scenario_type IN ('optimistic', 'realistic', 'pessimistic', 'custom')),
  description TEXT,
  is_base_scenario BOOLEAN DEFAULT false,
  variables JSONB DEFAULT '{}'::jsonb,
  projections JSONB DEFAULT '{}'::jsonb,
  summary_metrics JSONB DEFAULT '{}'::jsonb,
  breakeven_year INTEGER,
  npv DECIMAL(15,2),
  irr DECIMAL(8,4),
  payback_period DECIMAL(5,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AI ANALYSIS HISTORY
CREATE TABLE public.strategic_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('dafo', 'business_plan', 'financial_plan', 'scenario')),
  entity_id UUID NOT NULL,
  analysis_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,
  confidence_score DECIMAL(5,4),
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'partially_helpful')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. INDEXES
CREATE INDEX idx_dafo_analysis_company ON public.business_dafo_analysis(company_id);
CREATE INDEX idx_dafo_analysis_status ON public.business_dafo_analysis(status);
CREATE INDEX idx_dafo_items_dafo ON public.dafo_items(dafo_id);
CREATE INDEX idx_dafo_items_category ON public.dafo_items(category);
CREATE INDEX idx_bp_evaluations_company ON public.business_plan_evaluations(company_id);
CREATE INDEX idx_bp_sections_evaluation ON public.business_plan_sections(evaluation_id);
CREATE INDEX idx_fin_plans_company ON public.financial_viability_plans(company_id);
CREATE INDEX idx_fin_accounts_plan_year ON public.financial_plan_accounts(plan_id, year);
CREATE INDEX idx_fin_ratios_plan_year ON public.financial_plan_ratios(plan_id, year);
CREATE INDEX idx_fin_scenarios_plan ON public.financial_scenarios(plan_id);
CREATE INDEX idx_ai_analyses_entity ON public.strategic_ai_analyses(entity_type, entity_id);

-- 7. TRIGGERS
CREATE OR REPLACE FUNCTION update_strategic_planning_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dafo_analysis_timestamp BEFORE UPDATE ON public.business_dafo_analysis FOR EACH ROW EXECUTE FUNCTION update_strategic_planning_timestamp();
CREATE TRIGGER update_dafo_items_timestamp BEFORE UPDATE ON public.dafo_items FOR EACH ROW EXECUTE FUNCTION update_strategic_planning_timestamp();
CREATE TRIGGER update_bp_evaluations_timestamp BEFORE UPDATE ON public.business_plan_evaluations FOR EACH ROW EXECUTE FUNCTION update_strategic_planning_timestamp();
CREATE TRIGGER update_bp_sections_timestamp BEFORE UPDATE ON public.business_plan_sections FOR EACH ROW EXECUTE FUNCTION update_strategic_planning_timestamp();
CREATE TRIGGER update_fin_plans_timestamp BEFORE UPDATE ON public.financial_viability_plans FOR EACH ROW EXECUTE FUNCTION update_strategic_planning_timestamp();
CREATE TRIGGER update_fin_variables_timestamp BEFORE UPDATE ON public.financial_plan_variables FOR EACH ROW EXECUTE FUNCTION update_strategic_planning_timestamp();
CREATE TRIGGER update_fin_scenarios_timestamp BEFORE UPDATE ON public.financial_scenarios FOR EACH ROW EXECUTE FUNCTION update_strategic_planning_timestamp();

-- 8. ROW LEVEL SECURITY
ALTER TABLE public.business_dafo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dafo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_plan_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_viability_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_plan_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_plan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_plan_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_ai_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view DAFO analyses" ON public.business_dafo_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create DAFO analyses" ON public.business_dafo_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own DAFO analyses" ON public.business_dafo_analysis FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own DAFO analyses" ON public.business_dafo_analysis FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can manage DAFO items" ON public.dafo_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_dafo_analysis WHERE id = dafo_id));

CREATE POLICY "Users can view BP evaluations" ON public.business_plan_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create BP evaluations" ON public.business_plan_evaluations FOR INSERT TO authenticated WITH CHECK (auth.uid() = evaluator_id);
CREATE POLICY "Users can update own BP evaluations" ON public.business_plan_evaluations FOR UPDATE TO authenticated USING (auth.uid() = evaluator_id);
CREATE POLICY "Users can delete own BP evaluations" ON public.business_plan_evaluations FOR DELETE TO authenticated USING (auth.uid() = evaluator_id);

CREATE POLICY "Users can manage BP sections" ON public.business_plan_sections FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_plan_evaluations WHERE id = evaluation_id));

CREATE POLICY "Users can view financial plans" ON public.financial_viability_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create financial plans" ON public.financial_viability_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own financial plans" ON public.financial_viability_plans FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own financial plans" ON public.financial_viability_plans FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can manage plan variables" ON public.financial_plan_variables FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.financial_viability_plans WHERE id = plan_id));
CREATE POLICY "Users can manage plan accounts" ON public.financial_plan_accounts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.financial_viability_plans WHERE id = plan_id));
CREATE POLICY "Users can manage plan ratios" ON public.financial_plan_ratios FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.financial_viability_plans WHERE id = plan_id));
CREATE POLICY "Users can manage scenarios" ON public.financial_scenarios FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.financial_viability_plans WHERE id = plan_id));
CREATE POLICY "Users can manage AI analyses" ON public.strategic_ai_analyses FOR ALL TO authenticated USING (auth.uid() = created_by);

-- 9. INSERT MODULE (features as JSONB)
INSERT INTO public.app_modules (
  module_key, module_name, description, category, base_price, module_icon, features, dependencies, is_core, is_required, version
) VALUES (
  'strategic-planning',
  'Planificación Estratégica & Viabilidad',
  'Módulo completo para análisis DAFO dinámico, evaluación de planes de negocio y proyecciones financieras a 5 años. Funciona independientemente o sincronizado con el módulo de Contabilidad. Incluye simulador de escenarios y coaching con IA.',
  'horizontal',
  95000,
  'Target',
  '["Análisis DAFO interactivo con matriz visual", "Generación de DAFO con IA basado en sector", "Evaluador de Business Plan (10 dimensiones)", "Modelo financiero completo (Balance, P&L, Cash Flow)", "+25 ratios financieros con semáforos", "Benchmarks sectoriales automáticos", "Simulador de escenarios (optimista/realista/pesimista)", "Cálculo de punto de equilibrio, VAN, TIR", "AI Business Plan Coach", "Sincronización opcional con Contabilidad", "Generación de informes PDF profesionales"]'::jsonb,
  ARRAY['core'],
  false,
  false,
  '1.0.0'
);