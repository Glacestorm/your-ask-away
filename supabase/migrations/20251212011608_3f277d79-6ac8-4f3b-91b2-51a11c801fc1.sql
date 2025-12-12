-- ==================== FASE 5: ANALYTICS AVANZADO (Parte 2) ====================

-- 5.2 Predictions table for forecasting
CREATE TABLE public.analytics_predictions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'gestor', 'office', 'bank', 'segment')),
    entity_id UUID,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'revenue_forecast', 'growth_prediction', 'churn_risk', 'opportunity_score',
        'product_adoption', 'visit_success', 'goal_achievement', 'segment_evolution'
    )),
    model_name TEXT NOT NULL,
    model_version TEXT,
    prediction_horizon_days INTEGER NOT NULL,
    predicted_value NUMERIC,
    predicted_category TEXT,
    confidence_interval_low NUMERIC,
    confidence_interval_high NUMERIC,
    confidence_level NUMERIC CHECK (confidence_level >= 0 AND confidence_level <= 1),
    feature_importances JSONB,
    input_features JSONB,
    scenario TEXT DEFAULT 'baseline' CHECK (scenario IN ('pessimistic', 'baseline', 'optimistic', 'custom')),
    scenario_parameters JSONB,
    recommendations JSONB,
    priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 100),
    prediction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,
    actual_value NUMERIC,
    accuracy_score NUMERIC CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_predictions_entity ON public.analytics_predictions(entity_type, entity_id);
CREATE INDEX idx_predictions_type ON public.analytics_predictions(prediction_type);
CREATE INDEX idx_predictions_date ON public.analytics_predictions(prediction_date);
CREATE INDEX idx_predictions_valid ON public.analytics_predictions(valid_until);

-- Enable RLS
ALTER TABLE public.analytics_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage predictions"
ON public.analytics_predictions FOR ALL
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Directors can view predictions"
ON public.analytics_predictions FOR SELECT
USING (
    has_role(auth.uid(), 'director_comercial') OR
    has_role(auth.uid(), 'responsable_comercial') OR
    has_role(auth.uid(), 'director_oficina')
);

-- 5.3 Scenario simulations table
CREATE TABLE public.scenario_simulations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    scenario_type TEXT NOT NULL CHECK (scenario_type IN (
        'revenue_impact', 'resource_allocation', 'market_expansion', 
        'product_launch', 'risk_assessment', 'goal_planning', 'custom'
    )),
    base_parameters JSONB NOT NULL,
    variables JSONB NOT NULL,
    constraints JSONB,
    simulation_results JSONB,
    best_case_results JSONB,
    worst_case_results JSONB,
    monte_carlo_iterations INTEGER DEFAULT 1000,
    sensitivity_analysis JSONB,
    recommendations JSONB,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'failed')),
    run_started_at TIMESTAMPTZ,
    run_completed_at TIMESTAMPTZ,
    is_shared BOOLEAN DEFAULT false,
    shared_with UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scenario_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own simulations"
ON public.scenario_simulations FOR ALL
USING (created_by = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view shared simulations"
ON public.scenario_simulations FOR SELECT
USING (is_shared = true OR auth.uid() = ANY(shared_with));

-- Trigger for updated_at
CREATE TRIGGER update_scenario_simulations_updated_at
    BEFORE UPDATE ON public.scenario_simulations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();