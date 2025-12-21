-- =====================================================
-- FASE 2: ONBOARDING & ADOPTION ENGINE
-- =====================================================

-- 1. Onboarding Templates - Plantillas por segmento/producto
CREATE TABLE public.onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  description TEXT,
  segment_type TEXT NOT NULL, -- 'enterprise', 'pyme', 'startup', 'individual'
  product_keys TEXT[] DEFAULT '{}', -- Productos para los que aplica
  steps JSONB NOT NULL DEFAULT '[]', -- Array of {step_id, title, description, action_type, action_config, order, estimated_minutes, is_required}
  estimated_total_minutes INTEGER DEFAULT 30,
  gamification_config JSONB DEFAULT '{}', -- {points_per_step, badges, completion_reward}
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Onboarding Progress - Progreso individual por empresa
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.onboarding_templates(id),
  assigned_to UUID REFERENCES auth.users(id), -- CSM asignado
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'stalled', 'abandoned'
  current_step_id TEXT,
  completed_steps JSONB DEFAULT '[]', -- Array of {step_id, completed_at, time_spent_seconds, notes}
  skipped_steps TEXT[] DEFAULT '{}',
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  badges_earned TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stalled_at TIMESTAMPTZ,
  stall_reason TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  estimated_completion_date DATE,
  actual_time_spent_minutes INTEGER DEFAULT 0,
  celebration_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Adoption Milestones - Hitos de adopción
CREATE TABLE public.adoption_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_key TEXT NOT NULL UNIQUE, -- 'first_login', 'first_transaction', 'invited_team', etc.
  milestone_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'activation', 'engagement', 'expansion', 'advocacy'
  points_value INTEGER DEFAULT 10,
  badge_icon TEXT,
  required_for_activation BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Company Milestone Tracking - Hitos alcanzados por empresa
CREATE TABLE public.company_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.adoption_milestones(id),
  achieved_at TIMESTAMPTZ DEFAULT now(),
  achieved_by UUID REFERENCES auth.users(id),
  context JSONB DEFAULT '{}', -- Detalles adicionales del logro
  points_awarded INTEGER DEFAULT 0,
  celebrated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, milestone_id)
);

-- 5. Feature Usage Tracking - Tracking de uso por feature
CREATE TABLE public.feature_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  feature_key TEXT NOT NULL, -- 'reports', 'automations', 'integrations', etc.
  product_key TEXT, -- 'crm', 'support', 'analytics', etc.
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  first_used_at TIMESTAMPTZ DEFAULT now(),
  session_duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Time to Value Metrics - Métricas de tiempo a valor
CREATE TABLE public.time_to_value_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'first_value', 'activation', 'habit_formed', 'expansion_ready'
  product_key TEXT,
  target_days INTEGER, -- Objetivo en días
  actual_days INTEGER, -- Días reales
  achieved_at TIMESTAMPTZ,
  value_indicator TEXT, -- Qué acción/métrica indica el valor
  value_amount NUMERIC(15,2), -- Valor cuantificable si aplica
  is_achieved BOOLEAN DEFAULT false,
  predicted_days INTEGER, -- Predicción IA
  prediction_confidence NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Low Usage Alerts - Alertas por bajo uso
CREATE TABLE public.low_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- '7_day', '14_day', '30_day', 'feature_specific'
  feature_key TEXT,
  product_key TEXT,
  days_since_last_use INTEGER,
  expected_usage_frequency TEXT, -- 'daily', 'weekly', 'monthly'
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'critical'
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'escalated'
  assigned_to UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  auto_action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Success Plans - Planes de éxito
CREATE TABLE public.success_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_type TEXT DEFAULT 'standard', -- 'standard', 'accelerated', 'recovery', 'expansion'
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed', 'paused', 'cancelled'
  owner_id UUID REFERENCES auth.users(id), -- CSM owner
  objectives JSONB DEFAULT '[]', -- Array of {id, title, description, target_date, status, kpis}
  current_health_score NUMERIC(5,2),
  target_health_score NUMERIC(5,2) DEFAULT 80,
  ai_generated BOOLEAN DEFAULT false,
  ai_generation_context JSONB, -- Contexto usado para generar
  risk_factors JSONB DEFAULT '[]',
  success_criteria JSONB DEFAULT '[]',
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  next_review_date DATE,
  review_frequency TEXT DEFAULT 'monthly', -- 'weekly', 'biweekly', 'monthly', 'quarterly'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Success Plan Goals - Metas del plan de éxito
CREATE TABLE public.success_plan_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.success_plans(id) ON DELETE CASCADE,
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  goal_type TEXT DEFAULT 'adoption', -- 'adoption', 'engagement', 'outcome', 'expansion'
  target_metric TEXT, -- Métrica objetivo
  target_value NUMERIC(15,2),
  current_value NUMERIC(15,2) DEFAULT 0,
  unit TEXT, -- '%', 'count', 'currency', etc.
  start_date DATE,
  target_date DATE,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'at_risk', 'completed', 'missed'
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id),
  ai_recommendations JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]', -- Checkpoints intermedios
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. QBR Records - Quarterly Business Reviews
CREATE TABLE public.qbr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  success_plan_id UUID REFERENCES public.success_plans(id),
  quarter TEXT NOT NULL, -- 'Q1-2024', 'Q2-2024', etc.
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'
  scheduled_date TIMESTAMPTZ,
  actual_date TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  attendees JSONB DEFAULT '[]', -- [{user_id, role, confirmed}]
  agenda JSONB DEFAULT '[]', -- [{topic, duration_minutes, presenter, notes}]
  -- Datos del review
  period_summary JSONB, -- Resumen del período
  achievements JSONB DEFAULT '[]',
  challenges JSONB DEFAULT '[]',
  metrics_reviewed JSONB DEFAULT '{}', -- Métricas clave revisadas
  health_score_at_review NUMERIC(5,2),
  nps_at_review INTEGER,
  -- Outcomes
  action_items JSONB DEFAULT '[]', -- [{title, owner_id, due_date, status}]
  decisions_made JSONB DEFAULT '[]',
  next_quarter_goals JSONB DEFAULT '[]',
  renewal_discussion JSONB, -- Si aplica
  expansion_opportunities JSONB DEFAULT '[]',
  -- AI assistance
  ai_generated_summary TEXT,
  ai_generated_recommendations JSONB DEFAULT '[]',
  ai_risk_assessment JSONB,
  -- Meta
  prepared_by UUID REFERENCES auth.users(id),
  conducted_by UUID REFERENCES auth.users(id),
  recording_url TEXT,
  notes TEXT,
  customer_feedback TEXT,
  customer_satisfaction_score INTEGER, -- 1-5
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Adoption Scores Cache - Cache de scores de adopción
CREATE TABLE public.adoption_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  overall_score NUMERIC(5,2) DEFAULT 0,
  activation_score NUMERIC(5,2) DEFAULT 0, -- ¿Completaron onboarding?
  engagement_score NUMERIC(5,2) DEFAULT 0, -- ¿Usan regularmente?
  depth_score NUMERIC(5,2) DEFAULT 0, -- ¿Usan features avanzados?
  breadth_score NUMERIC(5,2) DEFAULT 0, -- ¿Cuántos productos usan?
  stickiness_score NUMERIC(5,2) DEFAULT 0, -- DAU/MAU ratio
  time_to_value_score NUMERIC(5,2) DEFAULT 0, -- ¿Qué tan rápido obtuvieron valor?
  score_breakdown JSONB DEFAULT '{}', -- Desglose detallado
  trend TEXT DEFAULT 'stable', -- 'improving', 'stable', 'declining'
  trend_percentage NUMERIC(5,2) DEFAULT 0,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  recommendations JSONB DEFAULT '[]',
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  next_calculation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_onboarding_progress_company ON public.onboarding_progress(company_id);
CREATE INDEX idx_onboarding_progress_status ON public.onboarding_progress(status);
CREATE INDEX idx_company_milestones_company ON public.company_milestones(company_id);
CREATE INDEX idx_feature_usage_company ON public.feature_usage_tracking(company_id);
CREATE INDEX idx_feature_usage_feature ON public.feature_usage_tracking(feature_key);
CREATE INDEX idx_feature_usage_last_used ON public.feature_usage_tracking(last_used_at);
CREATE INDEX idx_ttv_metrics_company ON public.time_to_value_metrics(company_id);
CREATE INDEX idx_low_usage_alerts_company ON public.low_usage_alerts(company_id);
CREATE INDEX idx_low_usage_alerts_status ON public.low_usage_alerts(status);
CREATE INDEX idx_success_plans_company ON public.success_plans(company_id);
CREATE INDEX idx_success_plans_status ON public.success_plans(status);
CREATE INDEX idx_success_plan_goals_plan ON public.success_plan_goals(plan_id);
CREATE INDEX idx_qbr_records_company ON public.qbr_records(company_id);
CREATE INDEX idx_qbr_records_quarter ON public.qbr_records(quarter, year);
CREATE INDEX idx_adoption_scores_company ON public.adoption_scores(company_id);
CREATE INDEX idx_adoption_scores_risk ON public.adoption_scores(risk_level);

-- Enable RLS
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_to_value_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_usage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_plan_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qbr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view onboarding templates" ON public.onboarding_templates
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Authenticated users can manage onboarding templates" ON public.onboarding_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view onboarding progress" ON public.onboarding_progress
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage onboarding progress" ON public.onboarding_progress
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view milestones" ON public.adoption_milestones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage milestones" ON public.adoption_milestones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view company milestones" ON public.company_milestones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage company milestones" ON public.company_milestones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view feature usage" ON public.feature_usage_tracking
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage feature usage" ON public.feature_usage_tracking
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view TTV metrics" ON public.time_to_value_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage TTV metrics" ON public.time_to_value_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view low usage alerts" ON public.low_usage_alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage low usage alerts" ON public.low_usage_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view success plans" ON public.success_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage success plans" ON public.success_plans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view success plan goals" ON public.success_plan_goals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage success plan goals" ON public.success_plan_goals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view QBR records" ON public.qbr_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage QBR records" ON public.qbr_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view adoption scores" ON public.adoption_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage adoption scores" ON public.adoption_scores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to calculate adoption score
CREATE OR REPLACE FUNCTION public.calculate_adoption_score(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activation_score NUMERIC(5,2) := 0;
  v_engagement_score NUMERIC(5,2) := 0;
  v_depth_score NUMERIC(5,2) := 0;
  v_breadth_score NUMERIC(5,2) := 0;
  v_stickiness_score NUMERIC(5,2) := 0;
  v_ttv_score NUMERIC(5,2) := 0;
  v_overall_score NUMERIC(5,2) := 0;
  v_onboarding_progress NUMERIC(5,2);
  v_features_used INTEGER;
  v_products_used INTEGER;
  v_days_active_last_30 INTEGER;
  v_risk_level TEXT;
BEGIN
  -- Activation Score (basado en onboarding)
  SELECT COALESCE(progress_percentage, 0) INTO v_activation_score
  FROM onboarding_progress
  WHERE company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Engagement Score (actividad últimos 30 días)
  SELECT COUNT(DISTINCT DATE(last_used_at)) INTO v_days_active_last_30
  FROM feature_usage_tracking
  WHERE company_id = p_company_id
    AND last_used_at >= now() - interval '30 days';
  
  v_engagement_score := LEAST((v_days_active_last_30::NUMERIC / 30) * 100, 100);

  -- Depth Score (features únicos usados)
  SELECT COUNT(DISTINCT feature_key) INTO v_features_used
  FROM feature_usage_tracking
  WHERE company_id = p_company_id
    AND last_used_at >= now() - interval '90 days';
  
  v_depth_score := LEAST((v_features_used::NUMERIC / 10) * 100, 100); -- Asume 10 features como máximo

  -- Breadth Score (productos usados)
  SELECT COUNT(DISTINCT product_key) INTO v_products_used
  FROM feature_usage_tracking
  WHERE company_id = p_company_id
    AND product_key IS NOT NULL
    AND last_used_at >= now() - interval '90 days';
  
  v_breadth_score := LEAST((v_products_used::NUMERIC / 5) * 100, 100); -- Asume 5 productos como máximo

  -- Stickiness Score (DAU/MAU approximation)
  v_stickiness_score := CASE 
    WHEN v_days_active_last_30 >= 20 THEN 100
    WHEN v_days_active_last_30 >= 15 THEN 80
    WHEN v_days_active_last_30 >= 10 THEN 60
    WHEN v_days_active_last_30 >= 5 THEN 40
    ELSE 20
  END;

  -- Time to Value Score
  SELECT CASE 
    WHEN actual_days IS NULL THEN 50
    WHEN actual_days <= target_days THEN 100
    WHEN actual_days <= target_days * 1.5 THEN 75
    WHEN actual_days <= target_days * 2 THEN 50
    ELSE 25
  END INTO v_ttv_score
  FROM time_to_value_metrics
  WHERE company_id = p_company_id AND metric_type = 'first_value'
  ORDER BY created_at DESC
  LIMIT 1;

  v_ttv_score := COALESCE(v_ttv_score, 50);

  -- Overall Score (weighted average)
  v_overall_score := (
    v_activation_score * 0.20 +
    v_engagement_score * 0.25 +
    v_depth_score * 0.15 +
    v_breadth_score * 0.15 +
    v_stickiness_score * 0.15 +
    v_ttv_score * 0.10
  );

  -- Determine risk level
  v_risk_level := CASE
    WHEN v_overall_score >= 70 THEN 'low'
    WHEN v_overall_score >= 50 THEN 'medium'
    WHEN v_overall_score >= 30 THEN 'high'
    ELSE 'critical'
  END;

  -- Upsert adoption score
  INSERT INTO adoption_scores (
    company_id, overall_score, activation_score, engagement_score,
    depth_score, breadth_score, stickiness_score, time_to_value_score,
    risk_level, last_calculated_at
  ) VALUES (
    p_company_id, v_overall_score, v_activation_score, v_engagement_score,
    v_depth_score, v_breadth_score, v_stickiness_score, v_ttv_score,
    v_risk_level, now()
  )
  ON CONFLICT (company_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    activation_score = EXCLUDED.activation_score,
    engagement_score = EXCLUDED.engagement_score,
    depth_score = EXCLUDED.depth_score,
    breadth_score = EXCLUDED.breadth_score,
    stickiness_score = EXCLUDED.stickiness_score,
    time_to_value_score = EXCLUDED.time_to_value_score,
    risk_level = EXCLUDED.risk_level,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();

  RETURN jsonb_build_object(
    'overall_score', v_overall_score,
    'activation_score', v_activation_score,
    'engagement_score', v_engagement_score,
    'depth_score', v_depth_score,
    'breadth_score', v_breadth_score,
    'stickiness_score', v_stickiness_score,
    'time_to_value_score', v_ttv_score,
    'risk_level', v_risk_level
  );
END;
$$;

-- Function to check and create low usage alerts
CREATE OR REPLACE FUNCTION public.check_low_usage_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company RECORD;
  v_days_since_use INTEGER;
BEGIN
  FOR v_company IN 
    SELECT DISTINCT company_id FROM feature_usage_tracking
  LOOP
    -- Get days since last use
    SELECT EXTRACT(DAY FROM now() - MAX(last_used_at))::INTEGER
    INTO v_days_since_use
    FROM feature_usage_tracking
    WHERE company_id = v_company.company_id;

    -- Create alerts based on inactivity
    IF v_days_since_use >= 30 THEN
      INSERT INTO low_usage_alerts (company_id, alert_type, days_since_last_use, severity)
      VALUES (v_company.company_id, '30_day', v_days_since_use, 'critical')
      ON CONFLICT DO NOTHING;
    ELSIF v_days_since_use >= 14 THEN
      INSERT INTO low_usage_alerts (company_id, alert_type, days_since_last_use, severity)
      VALUES (v_company.company_id, '14_day', v_days_since_use, 'warning')
      ON CONFLICT DO NOTHING;
    ELSIF v_days_since_use >= 7 THEN
      INSERT INTO low_usage_alerts (company_id, alert_type, days_since_last_use, severity)
      VALUES (v_company.company_id, '7_day', v_days_since_use, 'info')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to update onboarding progress percentage
CREATE OR REPLACE FUNCTION public.update_onboarding_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_steps INTEGER;
  v_completed_steps INTEGER;
BEGIN
  -- Get total steps from template
  SELECT jsonb_array_length(steps) INTO v_total_steps
  FROM onboarding_templates
  WHERE id = NEW.template_id;

  -- Count completed steps
  v_completed_steps := jsonb_array_length(NEW.completed_steps);

  -- Calculate percentage
  IF v_total_steps > 0 THEN
    NEW.progress_percentage := (v_completed_steps::NUMERIC / v_total_steps) * 100;
  END IF;

  -- Update status based on progress
  IF NEW.progress_percentage >= 100 AND NEW.status != 'completed' THEN
    NEW.status := 'completed';
    NEW.completed_at := now();
  ELSIF NEW.progress_percentage > 0 AND NEW.status = 'not_started' THEN
    NEW.status := 'in_progress';
    NEW.started_at := COALESCE(NEW.started_at, now());
  END IF;

  NEW.last_activity_at := now();
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_onboarding_progress
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_onboarding_progress();

-- Insert default milestones
INSERT INTO public.adoption_milestones (milestone_key, milestone_name, description, category, points_value, required_for_activation, order_index) VALUES
('first_login', 'Primer Inicio de Sesión', 'Usuario inició sesión por primera vez', 'activation', 10, true, 1),
('profile_complete', 'Perfil Completado', 'Información de perfil completada al 100%', 'activation', 15, true, 2),
('first_data_import', 'Primera Importación', 'Datos importados por primera vez', 'activation', 25, true, 3),
('invited_team_member', 'Equipo Invitado', 'Invitó al primer miembro del equipo', 'activation', 20, false, 4),
('first_report_generated', 'Primer Reporte', 'Generó el primer reporte', 'engagement', 15, false, 5),
('automation_created', 'Automatización Creada', 'Creó la primera automatización', 'engagement', 30, false, 6),
('integration_connected', 'Integración Conectada', 'Conectó una integración externa', 'engagement', 25, false, 7),
('weekly_active', 'Usuario Activo Semanal', 'Activo durante 4 semanas consecutivas', 'engagement', 40, false, 8),
('power_user', 'Power User', 'Usa más de 5 features regularmente', 'depth', 50, false, 9),
('advocate', 'Defensor', 'Recomendó el producto (NPS 9-10)', 'advocacy', 100, false, 10);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.low_usage_alerts;