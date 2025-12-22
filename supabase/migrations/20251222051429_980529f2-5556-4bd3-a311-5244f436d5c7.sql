-- =============================================
-- FASE 4: Revenue Intelligence & Expansion
-- =============================================

-- Revenue Events Table - Tracks all revenue-related events
CREATE TABLE public.revenue_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('new_business', 'expansion', 'contraction', 'churn', 'reactivation')),
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mrr_change NUMERIC(12, 2) NOT NULL,
    mrr_before NUMERIC(12, 2),
    mrr_after NUMERIC(12, 2),
    arr_change NUMERIC(14, 2),
    reason TEXT,
    product_id TEXT,
    plan_from TEXT,
    plan_to TEXT,
    contract_length_months INTEGER,
    discount_percentage NUMERIC(5, 2),
    recorded_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- MRR Snapshots Table - Monthly snapshots of MRR metrics
CREATE TABLE public.mrr_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    total_mrr NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_arr NUMERIC(16, 2) NOT NULL DEFAULT 0,
    new_mrr NUMERIC(12, 2) DEFAULT 0,
    expansion_mrr NUMERIC(12, 2) DEFAULT 0,
    contraction_mrr NUMERIC(12, 2) DEFAULT 0,
    churned_mrr NUMERIC(12, 2) DEFAULT 0,
    reactivation_mrr NUMERIC(12, 2) DEFAULT 0,
    net_mrr_change NUMERIC(12, 2) DEFAULT 0,
    customer_count INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    expansion_customers INTEGER DEFAULT 0,
    contraction_customers INTEGER DEFAULT 0,
    nrr_percentage NUMERIC(6, 2),
    grr_percentage NUMERIC(6, 2),
    quick_ratio NUMERIC(6, 2),
    arpu NUMERIC(10, 2),
    segment_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(snapshot_date)
);

-- Expansion Opportunities Table
CREATE TABLE public.expansion_opportunities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('upsell', 'cross_sell', 'add_seats', 'upgrade_plan')),
    current_plan TEXT,
    target_plan TEXT,
    current_mrr NUMERIC(10, 2),
    potential_mrr NUMERIC(10, 2),
    mrr_uplift NUMERIC(10, 2),
    propensity_score NUMERIC(5, 2) CHECK (propensity_score >= 0 AND propensity_score <= 100),
    optimal_timing TEXT,
    timing_score NUMERIC(5, 2),
    signals JSONB DEFAULT '[]',
    recommended_actions JSONB DEFAULT '[]',
    status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'qualified', 'in_progress', 'won', 'lost', 'deferred')),
    assigned_to UUID REFERENCES auth.users(id),
    won_date DATE,
    won_mrr NUMERIC(10, 2),
    lost_reason TEXT,
    next_action TEXT,
    next_action_date DATE,
    ai_confidence NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Revenue Cohorts Table
CREATE TABLE public.revenue_cohorts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_date DATE NOT NULL,
    cohort_type TEXT NOT NULL CHECK (cohort_type IN ('monthly', 'quarterly', 'yearly')),
    initial_customers INTEGER NOT NULL,
    initial_mrr NUMERIC(14, 2) NOT NULL,
    month_1_customers INTEGER,
    month_1_mrr NUMERIC(14, 2),
    month_3_customers INTEGER,
    month_3_mrr NUMERIC(14, 2),
    month_6_customers INTEGER,
    month_6_mrr NUMERIC(14, 2),
    month_12_customers INTEGER,
    month_12_mrr NUMERIC(14, 2),
    month_24_customers INTEGER,
    month_24_mrr NUMERIC(14, 2),
    retention_rates JSONB DEFAULT '{}',
    nrr_rates JSONB DEFAULT '{}',
    segment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ROI Tracking Table
CREATE TABLE public.customer_roi_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_revenue NUMERIC(14, 2) DEFAULT 0,
    total_cost NUMERIC(14, 2) DEFAULT 0,
    acquisition_cost NUMERIC(10, 2) DEFAULT 0,
    onboarding_cost NUMERIC(10, 2) DEFAULT 0,
    support_cost NUMERIC(10, 2) DEFAULT 0,
    success_cost NUMERIC(10, 2) DEFAULT 0,
    gross_margin NUMERIC(14, 2),
    gross_margin_percentage NUMERIC(6, 2),
    ltv NUMERIC(14, 2),
    ltv_cac_ratio NUMERIC(6, 2),
    payback_months INTEGER,
    is_profitable BOOLEAN DEFAULT false,
    profitability_date DATE,
    projected_ltv NUMERIC(14, 2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Industry Benchmarks Table
CREATE TABLE public.industry_benchmarks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    industry TEXT NOT NULL,
    segment TEXT,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC(10, 2) NOT NULL,
    percentile_25 NUMERIC(10, 2),
    percentile_50 NUMERIC(10, 2),
    percentile_75 NUMERIC(10, 2),
    percentile_90 NUMERIC(10, 2),
    sample_size INTEGER,
    source TEXT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Risk Concentration Alerts Table
CREATE TABLE public.revenue_risk_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('concentration', 'churn_risk', 'contraction', 'payment_issue', 'engagement_drop')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    company_id UUID REFERENCES public.companies(id),
    segment TEXT,
    mrr_at_risk NUMERIC(12, 2),
    probability NUMERIC(5, 2),
    expected_impact NUMERIC(12, 2),
    recommended_actions JSONB DEFAULT '[]',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- What-If Simulations Table
CREATE TABLE public.retention_simulations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_name TEXT NOT NULL,
    simulation_type TEXT NOT NULL CHECK (simulation_type IN ('churn_reduction', 'expansion_increase', 'pricing_change', 'segment_focus')),
    parameters JSONB NOT NULL DEFAULT '{}',
    baseline_metrics JSONB NOT NULL DEFAULT '{}',
    projected_metrics JSONB NOT NULL DEFAULT '{}',
    impact_analysis JSONB DEFAULT '{}',
    roi_projection NUMERIC(10, 2),
    confidence_level NUMERIC(5, 2),
    time_horizon_months INTEGER DEFAULT 12,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrr_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expansion_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_roi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenue_events
CREATE POLICY "Users can view revenue events" ON public.revenue_events
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert revenue events" ON public.revenue_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update revenue events" ON public.revenue_events
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for mrr_snapshots
CREATE POLICY "Users can view MRR snapshots" ON public.mrr_snapshots
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage MRR snapshots" ON public.mrr_snapshots
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for expansion_opportunities
CREATE POLICY "Users can view expansion opportunities" ON public.expansion_opportunities
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage expansion opportunities" ON public.expansion_opportunities
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for revenue_cohorts
CREATE POLICY "Users can view revenue cohorts" ON public.revenue_cohorts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage revenue cohorts" ON public.revenue_cohorts
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for customer_roi_tracking
CREATE POLICY "Users can view ROI tracking" ON public.customer_roi_tracking
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage ROI tracking" ON public.customer_roi_tracking
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for industry_benchmarks
CREATE POLICY "Users can view industry benchmarks" ON public.industry_benchmarks
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage industry benchmarks" ON public.industry_benchmarks
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for revenue_risk_alerts
CREATE POLICY "Users can view revenue risk alerts" ON public.revenue_risk_alerts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage revenue risk alerts" ON public.revenue_risk_alerts
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for retention_simulations
CREATE POLICY "Users can view retention simulations" ON public.retention_simulations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage retention simulations" ON public.retention_simulations
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_revenue_events_company ON public.revenue_events(company_id);
CREATE INDEX idx_revenue_events_date ON public.revenue_events(event_date);
CREATE INDEX idx_revenue_events_type ON public.revenue_events(event_type);
CREATE INDEX idx_mrr_snapshots_date ON public.mrr_snapshots(snapshot_date);
CREATE INDEX idx_expansion_opportunities_company ON public.expansion_opportunities(company_id);
CREATE INDEX idx_expansion_opportunities_status ON public.expansion_opportunities(status);
CREATE INDEX idx_revenue_cohorts_date ON public.revenue_cohorts(cohort_date);
CREATE INDEX idx_customer_roi_company ON public.customer_roi_tracking(company_id);
CREATE INDEX idx_industry_benchmarks_industry ON public.industry_benchmarks(industry, metric_name);
CREATE INDEX idx_revenue_risk_alerts_status ON public.revenue_risk_alerts(status);
CREATE INDEX idx_revenue_risk_alerts_severity ON public.revenue_risk_alerts(severity);

-- Trigger for updating timestamps
CREATE TRIGGER update_revenue_events_timestamp
    BEFORE UPDATE ON public.revenue_events
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_expansion_opportunities_timestamp
    BEFORE UPDATE ON public.expansion_opportunities
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_revenue_cohorts_timestamp
    BEFORE UPDATE ON public.revenue_cohorts
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_customer_roi_timestamp
    BEFORE UPDATE ON public.customer_roi_tracking
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_industry_benchmarks_timestamp
    BEFORE UPDATE ON public.industry_benchmarks
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_revenue_risk_alerts_timestamp
    BEFORE UPDATE ON public.revenue_risk_alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_retention_simulations_timestamp
    BEFORE UPDATE ON public.retention_simulations
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();