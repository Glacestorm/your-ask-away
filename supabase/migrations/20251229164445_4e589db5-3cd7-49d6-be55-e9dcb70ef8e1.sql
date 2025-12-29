-- =====================================================
-- PHASE 15 EXTENDED: STRATEGIC FINANCIAL AGENT TABLES
-- =====================================================

-- 1. Grants & Subsidies Registry
CREATE TABLE public.obelixia_grants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    grant_type TEXT NOT NULL DEFAULT 'subsidy', -- subsidy, loan, credit, guarantee, equity
    level TEXT NOT NULL DEFAULT 'national', -- local, regional, national, european
    region TEXT, -- Specific region (e.g., 'catalonia')
    
    -- Organization/Source
    organization TEXT NOT NULL, -- ACCIÓ, CDTI, ENISA, etc.
    source_url TEXT,
    official_reference TEXT,
    
    -- Amounts
    min_amount NUMERIC(15,2),
    max_amount NUMERIC(15,2),
    coverage_percentage NUMERIC(5,2), -- % of project covered
    
    -- Dates
    opening_date DATE,
    deadline_date DATE,
    resolution_date DATE,
    
    -- Requirements
    requirements JSONB DEFAULT '{}',
    eligible_sectors TEXT[],
    eligible_company_types TEXT[], -- startup, pyme, gran_empresa
    min_employees INTEGER,
    max_employees INTEGER,
    min_turnover NUMERIC(15,2),
    max_turnover NUMERIC(15,2),
    
    -- Categories & Tags
    categories TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    
    -- AI Analysis
    relevance_score NUMERIC(5,2), -- 0-100
    eligibility_score NUMERIC(5,2), -- 0-100 for Obelixia
    complexity_score NUMERIC(5,2), -- 0-100 application difficulty
    success_probability NUMERIC(5,2), -- 0-100
    ai_analysis JSONB DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- active, closed, upcoming, draft
    is_featured BOOLEAN DEFAULT false,
    priority_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    source_hash TEXT -- For detecting changes
);

-- 2. Grant Applications Tracking
CREATE TABLE public.obelixia_grant_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    grant_id UUID REFERENCES public.obelixia_grants(id) ON DELETE SET NULL,
    user_id UUID DEFAULT auth.uid(),
    
    -- Application Info
    application_reference TEXT,
    application_date DATE,
    amount_requested NUMERIC(15,2),
    amount_approved NUMERIC(15,2),
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'draft', -- draft, preparing, submitted, under_review, approved, rejected, withdrawn
    status_history JSONB DEFAULT '[]',
    
    -- Documents
    documents JSONB DEFAULT '[]', -- Array of document metadata
    generated_documents JSONB DEFAULT '[]',
    
    -- AI Generated Content
    application_summary TEXT,
    project_description TEXT,
    innovation_justification TEXT,
    market_analysis TEXT,
    team_description TEXT,
    financial_plan TEXT,
    
    -- Timeline
    submitted_at TIMESTAMP WITH TIME ZONE,
    response_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes & Comments
    internal_notes TEXT,
    reviewer_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Business Plans
CREATE TABLE public.obelixia_business_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(),
    
    -- Plan Info
    title TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    plan_type TEXT NOT NULL DEFAULT 'complete', -- executive, complete, investor, grant
    target_audience TEXT, -- vc, angel, bank, grant, internal
    language TEXT DEFAULT 'es',
    
    -- Content Sections (JSONB for flexibility)
    executive_summary JSONB DEFAULT '{}',
    company_description JSONB DEFAULT '{}',
    market_analysis JSONB DEFAULT '{}',
    competitive_analysis JSONB DEFAULT '{}',
    product_service JSONB DEFAULT '{}',
    business_model JSONB DEFAULT '{}',
    marketing_strategy JSONB DEFAULT '{}',
    operations_plan JSONB DEFAULT '{}',
    team_organization JSONB DEFAULT '{}',
    financial_plan JSONB DEFAULT '{}',
    risk_analysis JSONB DEFAULT '{}',
    implementation_roadmap JSONB DEFAULT '{}',
    investment_needs JSONB DEFAULT '{}',
    exit_strategy JSONB DEFAULT '{}',
    appendices JSONB DEFAULT '{}',
    
    -- Full Generated Content
    full_content TEXT, -- Complete markdown/HTML
    pdf_url TEXT,
    word_url TEXT,
    
    -- Metrics
    total_pages INTEGER,
    word_count INTEGER,
    generation_time_ms INTEGER,
    
    -- AI Metadata
    ai_model_used TEXT,
    prompts_used JSONB DEFAULT '[]',
    data_sources JSONB DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft', -- draft, generating, complete, archived
    is_current BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    generated_at TIMESTAMP WITH TIME ZONE
);

-- 4. Viability Studies
CREATE TABLE public.obelixia_viability_studies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(),
    
    -- Study Info
    title TEXT NOT NULL,
    study_type TEXT NOT NULL DEFAULT 'complete', -- technical, commercial, financial, organizational, complete
    version TEXT DEFAULT '1.0',
    
    -- Technical Viability
    technical_analysis JSONB DEFAULT '{}',
    technology_stack JSONB DEFAULT '{}',
    scalability_assessment JSONB DEFAULT '{}',
    security_compliance JSONB DEFAULT '{}',
    technical_score NUMERIC(5,2),
    
    -- Commercial Viability
    market_demand JSONB DEFAULT '{}',
    distribution_channels JSONB DEFAULT '{}',
    pricing_strategy JSONB DEFAULT '{}',
    cac_ltv_analysis JSONB DEFAULT '{}',
    commercial_score NUMERIC(5,2),
    
    -- Financial Viability
    breakeven_analysis JSONB DEFAULT '{}',
    npv_irr_payback JSONB DEFAULT '{}',
    scenarios JSONB DEFAULT '{}', -- pessimistic, realistic, optimistic
    sensitivity_analysis JSONB DEFAULT '{}',
    monte_carlo_results JSONB DEFAULT '{}',
    financial_score NUMERIC(5,2),
    
    -- Organizational Viability
    team_requirements JSONB DEFAULT '{}',
    org_structure JSONB DEFAULT '{}',
    hiring_plan JSONB DEFAULT '{}',
    organizational_score NUMERIC(5,2),
    
    -- Risk Analysis
    risk_matrix JSONB DEFAULT '{}',
    contingency_plans JSONB DEFAULT '{}',
    mitigation_strategies JSONB DEFAULT '{}',
    overall_risk_score NUMERIC(5,2),
    
    -- Overall Assessment
    overall_viability_score NUMERIC(5,2),
    recommendation TEXT,
    key_findings JSONB DEFAULT '[]',
    critical_success_factors JSONB DEFAULT '[]',
    
    -- Full Content
    full_content TEXT,
    pdf_url TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    generated_at TIMESTAMP WITH TIME ZONE
);

-- 5. Competitor Analysis
CREATE TABLE public.obelixia_competitor_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(),
    
    -- Competitor Info
    competitor_name TEXT NOT NULL,
    competitor_type TEXT, -- direct, indirect, potential
    website_url TEXT,
    
    -- Company Profile
    company_profile JSONB DEFAULT '{}',
    founding_year INTEGER,
    headquarters TEXT,
    employee_count TEXT,
    funding_info JSONB DEFAULT '{}',
    
    -- SWOT Analysis
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    opportunities JSONB DEFAULT '[]',
    threats JSONB DEFAULT '[]',
    
    -- Product Comparison
    features JSONB DEFAULT '{}',
    pricing JSONB DEFAULT '{}',
    target_market JSONB DEFAULT '{}',
    technology_stack JSONB DEFAULT '{}',
    
    -- Market Position
    market_share_estimate NUMERIC(5,2),
    positioning_statement TEXT,
    value_proposition TEXT,
    
    -- Competitive Intelligence
    customer_reviews JSONB DEFAULT '[]',
    media_mentions JSONB DEFAULT '[]',
    recent_news JSONB DEFAULT '[]',
    
    -- Obelixia Comparison
    vs_obelixia_advantages JSONB DEFAULT '[]',
    vs_obelixia_disadvantages JSONB DEFAULT '[]',
    competitive_gaps JSONB DEFAULT '[]',
    
    -- Scores
    threat_level NUMERIC(5,2), -- 0-100
    similarity_score NUMERIC(5,2), -- 0-100
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active',
    last_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Investor Documents
CREATE TABLE public.obelixia_investor_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(),
    
    -- Document Info
    title TEXT NOT NULL,
    document_type TEXT NOT NULL, -- pitch_deck, investor_memo, one_pager, data_room, grant_dossier
    target_investor_type TEXT, -- vc, angel, bank, grant, corporate
    language TEXT DEFAULT 'es',
    version TEXT DEFAULT '1.0',
    
    -- Content
    content JSONB DEFAULT '{}', -- Structured content
    slides JSONB DEFAULT '[]', -- For pitch decks
    full_content TEXT,
    
    -- Files
    pdf_url TEXT,
    pptx_url TEXT,
    preview_images JSONB DEFAULT '[]',
    
    -- Customization
    company_data JSONB DEFAULT '{}',
    financial_highlights JSONB DEFAULT '{}',
    key_metrics JSONB DEFAULT '{}',
    ask_amount NUMERIC(15,2),
    
    -- Related Grant (if applicable)
    grant_id UUID REFERENCES public.obelixia_grants(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    generated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.obelixia_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_business_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_viability_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_investor_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Grants are public read, admin write
CREATE POLICY "Grants are viewable by authenticated users"
ON public.obelixia_grants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Grants are manageable by admins"
ON public.obelixia_grants FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('superadmin', 'admin')
    )
);

-- RLS Policies: Applications, Plans, Studies, Docs - user owns
CREATE POLICY "Users can manage their own grant applications"
ON public.obelixia_grant_applications FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own business plans"
ON public.obelixia_business_plans FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own viability studies"
ON public.obelixia_viability_studies FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own competitor analysis"
ON public.obelixia_competitor_analysis FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own investor documents"
ON public.obelixia_investor_documents FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_obelixia_grants_status ON public.obelixia_grants(status);
CREATE INDEX idx_obelixia_grants_level ON public.obelixia_grants(level);
CREATE INDEX idx_obelixia_grants_deadline ON public.obelixia_grants(deadline_date);
CREATE INDEX idx_obelixia_grants_eligibility ON public.obelixia_grants(eligibility_score DESC);
CREATE INDEX idx_obelixia_grant_applications_user ON public.obelixia_grant_applications(user_id);
CREATE INDEX idx_obelixia_business_plans_user ON public.obelixia_business_plans(user_id);
CREATE INDEX idx_obelixia_viability_studies_user ON public.obelixia_viability_studies(user_id);
CREATE INDEX idx_obelixia_competitor_analysis_user ON public.obelixia_competitor_analysis(user_id);
CREATE INDEX idx_obelixia_investor_documents_user ON public.obelixia_investor_documents(user_id);

-- Update timestamp triggers
CREATE TRIGGER update_obelixia_grants_timestamp
    BEFORE UPDATE ON public.obelixia_grants
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_obelixia_grant_applications_timestamp
    BEFORE UPDATE ON public.obelixia_grant_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_obelixia_business_plans_timestamp
    BEFORE UPDATE ON public.obelixia_business_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_obelixia_viability_studies_timestamp
    BEFORE UPDATE ON public.obelixia_viability_studies
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_obelixia_competitor_analysis_timestamp
    BEFORE UPDATE ON public.obelixia_competitor_analysis
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_obelixia_investor_documents_timestamp
    BEFORE UPDATE ON public.obelixia_investor_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();