-- =====================================================
-- FASE 4: REVENUE INTELLIGENCE - MEJORAS DISRUPTIVAS
-- =====================================================

-- 1. Revenue Forecasts - Predicciones de ingresos con IA
CREATE TABLE public.revenue_forecasts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    forecast_date DATE NOT NULL,
    forecast_horizon_months INTEGER NOT NULL DEFAULT 12,
    scenario TEXT NOT NULL CHECK (scenario IN ('optimistic', 'expected', 'pessimistic')),
    predicted_mrr NUMERIC NOT NULL,
    predicted_arr NUMERIC NOT NULL,
    confidence_level NUMERIC CHECK (confidence_level >= 0 AND confidence_level <= 100),
    confidence_interval_low NUMERIC,
    confidence_interval_high NUMERIC,
    growth_rate_predicted NUMERIC,
    churn_rate_predicted NUMERIC,
    expansion_rate_predicted NUMERIC,
    key_drivers JSONB DEFAULT '[]'::jsonb,
    risk_factors JSONB DEFAULT '[]'::jsonb,
    model_version TEXT,
    model_accuracy NUMERIC,
    ai_insights TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. LTV Predictions - Customer Lifetime Value con ML
CREATE TABLE public.ltv_predictions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    predicted_ltv NUMERIC NOT NULL,
    ltv_confidence_low NUMERIC,
    ltv_confidence_high NUMERIC,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
    cac NUMERIC,
    ltv_cac_ratio NUMERIC,
    payback_months NUMERIC,
    expected_lifetime_months NUMERIC,
    churn_probability NUMERIC CHECK (churn_probability >= 0 AND churn_probability <= 100),
    expansion_probability NUMERIC CHECK (expansion_probability >= 0 AND expansion_probability <= 100),
    health_score NUMERIC CHECK (health_score >= 0 AND health_score <= 100),
    engagement_score NUMERIC CHECK (engagement_score >= 0 AND engagement_score <= 100),
    feature_usage_score NUMERIC CHECK (feature_usage_score >= 0 AND feature_usage_score <= 100),
    input_features JSONB DEFAULT '{}'::jsonb,
    model_version TEXT,
    segment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. PLG Signals - Product-Led Growth Signals
CREATE TABLE public.plg_signals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL CHECK (signal_type IN (
        'usage_spike', 'feature_adoption', 'seat_utilization', 'api_growth',
        'integration_added', 'power_user_emergence', 'viral_coefficient',
        'upgrade_intent', 'limit_approaching', 'engagement_increase'
    )),
    signal_strength NUMERIC NOT NULL CHECK (signal_strength >= 0 AND signal_strength <= 100),
    signal_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metric_name TEXT,
    metric_value NUMERIC,
    metric_previous_value NUMERIC,
    metric_change_percentage NUMERIC,
    threshold_exceeded NUMERIC,
    recommended_action TEXT,
    expansion_opportunity_value NUMERIC,
    context JSONB DEFAULT '{}'::jsonb,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    converted_to_opportunity BOOLEAN DEFAULT false,
    opportunity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Revenue Scores - Puntuación multidimensional de cuentas
CREATE TABLE public.revenue_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    score_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_score NUMERIC NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    health_score NUMERIC CHECK (health_score >= 0 AND health_score <= 100),
    expansion_score NUMERIC CHECK (expansion_score >= 0 AND expansion_score <= 100),
    retention_score NUMERIC CHECK (retention_score >= 0 AND retention_score <= 100),
    engagement_score NUMERIC CHECK (engagement_score >= 0 AND engagement_score <= 100),
    satisfaction_score NUMERIC CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
    growth_potential_score NUMERIC CHECK (growth_potential_score >= 0 AND growth_potential_score <= 100),
    risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 100),
    prioritization_quadrant TEXT CHECK (prioritization_quadrant IN ('retain_urgent', 'expand_now', 'nurture', 'monitor')),
    recommended_action TEXT,
    action_priority INTEGER CHECK (action_priority >= 1 AND action_priority <= 5),
    score_factors JSONB DEFAULT '{}'::jsonb,
    score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining')),
    trend_velocity NUMERIC,
    ai_recommendation TEXT,
    next_best_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Revenue Attributions - Attribution de revenue por fuente
CREATE TABLE public.revenue_attributions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    revenue_event_id UUID REFERENCES public.revenue_events(id) ON DELETE SET NULL,
    attribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attribution_model TEXT NOT NULL CHECK (attribution_model IN ('first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven')),
    channel TEXT NOT NULL,
    source TEXT,
    campaign TEXT,
    medium TEXT,
    content TEXT,
    attributed_revenue NUMERIC NOT NULL,
    attribution_weight NUMERIC CHECK (attribution_weight >= 0 AND attribution_weight <= 1),
    touchpoint_order INTEGER,
    total_touchpoints INTEGER,
    days_to_conversion INTEGER,
    revenue_type TEXT CHECK (revenue_type IN ('new_business', 'expansion', 'reactivation')),
    customer_journey JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Monte Carlo Simulations - Simulaciones de escenarios
CREATE TABLE public.monte_carlo_simulations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_name TEXT NOT NULL,
    simulation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    simulation_type TEXT NOT NULL CHECK (simulation_type IN ('revenue_forecast', 'churn_impact', 'expansion_scenario', 'pricing_change', 'market_shift')),
    num_iterations INTEGER NOT NULL DEFAULT 10000,
    time_horizon_months INTEGER NOT NULL DEFAULT 12,
    input_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    base_mrr NUMERIC,
    base_arr NUMERIC,
    results_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    percentile_10 NUMERIC,
    percentile_25 NUMERIC,
    percentile_50 NUMERIC,
    percentile_75 NUMERIC,
    percentile_90 NUMERIC,
    mean_outcome NUMERIC,
    std_deviation NUMERIC,
    probability_of_target NUMERIC,
    target_value NUMERIC,
    worst_case NUMERIC,
    best_case NUMERIC,
    confidence_interval_95_low NUMERIC,
    confidence_interval_95_high NUMERIC,
    key_risk_factors JSONB DEFAULT '[]'::jsonb,
    sensitivity_analysis JSONB DEFAULT '{}'::jsonb,
    distribution_data JSONB DEFAULT '[]'::jsonb,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ltv_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plg_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monte_carlo_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read all data
CREATE POLICY "Users can view all revenue forecasts"
    ON public.revenue_forecasts FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Users can view all ltv predictions"
    ON public.ltv_predictions FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Users can view all plg signals"
    ON public.plg_signals FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Users can view all revenue scores"
    ON public.revenue_scores FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Users can view all revenue attributions"
    ON public.revenue_attributions FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Users can view all monte carlo simulations"
    ON public.monte_carlo_simulations FOR SELECT
    TO authenticated USING (true);

-- Insert policies for authenticated users
CREATE POLICY "Users can insert revenue forecasts"
    ON public.revenue_forecasts FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Users can insert ltv predictions"
    ON public.ltv_predictions FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Users can insert plg signals"
    ON public.plg_signals FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Users can insert revenue scores"
    ON public.revenue_scores FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Users can insert revenue attributions"
    ON public.revenue_attributions FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Users can insert monte carlo simulations"
    ON public.monte_carlo_simulations FOR INSERT
    TO authenticated WITH CHECK (true);

-- Update policies
CREATE POLICY "Users can update revenue forecasts"
    ON public.revenue_forecasts FOR UPDATE
    TO authenticated USING (true);

CREATE POLICY "Users can update ltv predictions"
    ON public.ltv_predictions FOR UPDATE
    TO authenticated USING (true);

CREATE POLICY "Users can update plg signals"
    ON public.plg_signals FOR UPDATE
    TO authenticated USING (true);

CREATE POLICY "Users can update revenue scores"
    ON public.revenue_scores FOR UPDATE
    TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_revenue_forecasts_date ON public.revenue_forecasts(forecast_date);
CREATE INDEX idx_revenue_forecasts_scenario ON public.revenue_forecasts(scenario);
CREATE INDEX idx_ltv_predictions_company ON public.ltv_predictions(company_id);
CREATE INDEX idx_ltv_predictions_date ON public.ltv_predictions(prediction_date);
CREATE INDEX idx_plg_signals_company ON public.plg_signals(company_id);
CREATE INDEX idx_plg_signals_type ON public.plg_signals(signal_type);
CREATE INDEX idx_plg_signals_active ON public.plg_signals(is_active) WHERE is_active = true;
CREATE INDEX idx_revenue_scores_company ON public.revenue_scores(company_id);
CREATE INDEX idx_revenue_scores_quadrant ON public.revenue_scores(prioritization_quadrant);
CREATE INDEX idx_revenue_attributions_company ON public.revenue_attributions(company_id);
CREATE INDEX idx_revenue_attributions_channel ON public.revenue_attributions(channel);
CREATE INDEX idx_monte_carlo_type ON public.monte_carlo_simulations(simulation_type);

-- Triggers for updated_at
CREATE TRIGGER update_revenue_forecasts_updated_at
    BEFORE UPDATE ON public.revenue_forecasts
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_ltv_predictions_updated_at
    BEFORE UPDATE ON public.ltv_predictions
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_plg_signals_updated_at
    BEFORE UPDATE ON public.plg_signals
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_revenue_scores_updated_at
    BEFORE UPDATE ON public.revenue_scores
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();