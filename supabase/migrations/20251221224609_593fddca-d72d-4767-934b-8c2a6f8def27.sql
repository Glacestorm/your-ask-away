-- FASE 1 MEJORADA: Sistema NPS Predictivo y VoC Hub

-- 1. PREDICTED NPS
CREATE TABLE public.predicted_nps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
    predicted_score INTEGER NOT NULL CHECK (predicted_score >= 0 AND predicted_score <= 10),
    confidence_level NUMERIC(3,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    prediction_model TEXT NOT NULL DEFAULT 'behavioral_signals_v1',
    behavioral_signals JSONB DEFAULT '{}',
    actual_nps INTEGER CHECK (actual_nps >= 0 AND actual_nps <= 10),
    prediction_accuracy NUMERIC(3,2),
    validated_at TIMESTAMPTZ,
    prediction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_predicted_nps_company ON public.predicted_nps(company_id);
CREATE INDEX idx_predicted_nps_contact ON public.predicted_nps(contact_id);
CREATE INDEX idx_predicted_nps_date ON public.predicted_nps(prediction_date DESC);
CREATE INDEX idx_predicted_nps_score ON public.predicted_nps(predicted_score);
CREATE INDEX idx_predicted_nps_valid ON public.predicted_nps(valid_until);

-- 2. MICROSURVEYS
CREATE TABLE public.microsurveys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'emoji_scale' CHECK (question_type IN ('emoji_scale', 'star_rating', 'thumbs', 'single_choice', 'open_text')),
    options JSONB,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('post_milestone', 'usage_spike', 'inactivity', 'after_positive_interaction', 'feature_discovery', 'post_purchase', 'periodic', 'manual')),
    trigger_conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    target_segments TEXT[] DEFAULT '{}',
    cooldown_days INTEGER DEFAULT 14,
    max_impressions_per_contact INTEGER DEFAULT 1,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.microsurvey_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    microsurvey_id UUID NOT NULL REFERENCES public.microsurveys(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
    response_value TEXT NOT NULL,
    response_score INTEGER,
    open_feedback TEXT,
    trigger_context JSONB DEFAULT '{}',
    responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_time_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_microsurvey_responses_survey ON public.microsurvey_responses(microsurvey_id);
CREATE INDEX idx_microsurvey_responses_company ON public.microsurvey_responses(company_id);
CREATE INDEX idx_microsurvey_responses_date ON public.microsurvey_responses(responded_at DESC);

-- 3. FEEDBACK LOOPS
CREATE TABLE public.feedback_loops (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_type TEXT NOT NULL CHECK (source_type IN ('nps_response', 'csat_response', 'ces_response', 'microsurvey', 'complaint', 'review')),
    source_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
    original_score INTEGER,
    original_category TEXT,
    original_feedback TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'contacted', 'resolved', 'recovered', 'escalated', 'closed_no_action')),
    followup_notes TEXT,
    followup_date TIMESTAMPTZ,
    resolution_notes TEXT,
    recovery_survey_scheduled TIMESTAMPTZ,
    recovery_survey_sent_at TIMESTAMPTZ,
    recovery_score INTEGER,
    is_recovered BOOLEAN DEFAULT false,
    escalation_level INTEGER DEFAULT 0,
    escalated_to UUID REFERENCES public.profiles(id),
    escalated_at TIMESTAMPTZ,
    escalation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

CREATE INDEX idx_feedback_loops_company ON public.feedback_loops(company_id);
CREATE INDEX idx_feedback_loops_assigned ON public.feedback_loops(assigned_to);
CREATE INDEX idx_feedback_loops_status ON public.feedback_loops(status);
CREATE INDEX idx_feedback_loops_priority ON public.feedback_loops(priority);
CREATE INDEX idx_feedback_loops_sla ON public.feedback_loops(sla_deadline);

-- 4. SURVEY THROTTLING
CREATE TABLE public.survey_throttling (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
    last_nps_survey TIMESTAMPTZ,
    last_csat_survey TIMESTAMPTZ,
    last_ces_survey TIMESTAMPTZ,
    last_microsurvey TIMESTAMPTZ,
    surveys_received_30d INTEGER DEFAULT 0,
    surveys_completed_30d INTEGER DEFAULT 0,
    next_survey_allowed TIMESTAMPTZ DEFAULT now(),
    opted_out BOOLEAN DEFAULT false,
    opted_out_at TIMESTAMPTZ,
    opt_out_reason TEXT,
    preferred_channel TEXT DEFAULT 'email' CHECK (preferred_channel IN ('email', 'sms', 'in_app', 'none')),
    preferred_frequency TEXT DEFAULT 'normal' CHECK (preferred_frequency IN ('minimal', 'normal', 'frequent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, contact_id)
);

CREATE INDEX idx_survey_throttling_company ON public.survey_throttling(company_id);
CREATE INDEX idx_survey_throttling_next_allowed ON public.survey_throttling(next_survey_allowed);

-- 5. GAMIFICATION
CREATE TABLE public.feedback_gamification (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
    total_coins INTEGER DEFAULT 0,
    coins_earned_30d INTEGER DEFAULT 0,
    surveys_completed INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_response_date DATE,
    badges TEXT[] DEFAULT '{}',
    company_rank INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, contact_id)
);

-- 6. CONVERSATIONAL SURVEYS
CREATE TABLE public.conversational_survey_flows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES public.satisfaction_surveys(id) ON DELETE CASCADE,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('score_range', 'segment', 'previous_answer', 'sentiment')),
    condition_value JSONB NOT NULL,
    followup_question TEXT NOT NULL,
    question_type TEXT DEFAULT 'open_text',
    options JSONB,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_survey_flows_survey ON public.conversational_survey_flows(survey_id);

-- 7. VOC ANALYTICS CACHE
CREATE TABLE public.voc_analytics_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    segment TEXT,
    gestor_id UUID REFERENCES public.profiles(id),
    office TEXT,
    nps_score NUMERIC(5,2),
    nps_responses INTEGER DEFAULT 0,
    promoters_count INTEGER DEFAULT 0,
    passives_count INTEGER DEFAULT 0,
    detractors_count INTEGER DEFAULT 0,
    csat_avg NUMERIC(3,2),
    ces_avg NUMERIC(3,2),
    predicted_nps_avg NUMERIC(5,2),
    prediction_coverage NUMERIC(3,2),
    prediction_accuracy_avg NUMERIC(3,2),
    feedback_loops_total INTEGER DEFAULT 0,
    feedback_loops_closed INTEGER DEFAULT 0,
    recovery_rate NUMERIC(3,2),
    avg_resolution_hours NUMERIC(6,2),
    sentiment_avg NUMERIC(3,2),
    top_topics JSONB DEFAULT '[]',
    emotion_distribution JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(period_start, period_end, segment, gestor_id, office)
);

CREATE INDEX idx_voc_analytics_period ON public.voc_analytics_cache(period_start, period_end);
CREATE INDEX idx_voc_analytics_calculated ON public.voc_analytics_cache(calculated_at DESC);

-- 8. SURVEY TOKENS
CREATE TABLE public.survey_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    campaign_id UUID NOT NULL REFERENCES public.survey_campaigns(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.company_contacts(id),
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    prefill_data JSONB DEFAULT '{}',
    language TEXT DEFAULT 'es',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_survey_tokens_token ON public.survey_tokens(token);
CREATE INDEX idx_survey_tokens_campaign ON public.survey_tokens(campaign_id);
CREATE INDEX idx_survey_tokens_expires ON public.survey_tokens(expires_at);

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.update_satisfaction_phase1_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_predicted_nps_timestamp BEFORE UPDATE ON public.predicted_nps FOR EACH ROW EXECUTE FUNCTION public.update_satisfaction_phase1_timestamp();
CREATE TRIGGER update_microsurveys_timestamp BEFORE UPDATE ON public.microsurveys FOR EACH ROW EXECUTE FUNCTION public.update_satisfaction_phase1_timestamp();
CREATE TRIGGER update_feedback_loops_timestamp BEFORE UPDATE ON public.feedback_loops FOR EACH ROW EXECUTE FUNCTION public.update_satisfaction_phase1_timestamp();
CREATE TRIGGER update_survey_throttling_timestamp BEFORE UPDATE ON public.survey_throttling FOR EACH ROW EXECUTE FUNCTION public.update_satisfaction_phase1_timestamp();
CREATE TRIGGER update_feedback_gamification_timestamp BEFORE UPDATE ON public.feedback_gamification FOR EACH ROW EXECUTE FUNCTION public.update_satisfaction_phase1_timestamp();

-- Feedback loop automático para detractores (usando gestor_id)
CREATE OR REPLACE FUNCTION public.create_feedback_loop_for_detractor()
RETURNS TRIGGER AS $$
DECLARE
    v_gestor_id UUID;
    v_sla_hours INTEGER;
BEGIN
    IF NEW.nps_score IS NOT NULL AND NEW.nps_score <= 6 THEN
        SELECT gestor_id INTO v_gestor_id FROM companies WHERE id = NEW.company_id;
        v_sla_hours := CASE WHEN NEW.nps_score <= 3 THEN 24 WHEN NEW.nps_score <= 6 THEN 48 ELSE 72 END;
        
        INSERT INTO public.feedback_loops (source_type, source_id, company_id, contact_id, original_score, original_category, original_feedback, assigned_to, assigned_at, sla_deadline, priority, status)
        VALUES ('nps_response', NEW.id, NEW.company_id, NEW.contact_id, NEW.nps_score,
            CASE WHEN NEW.nps_score <= 6 THEN 'detractor' WHEN NEW.nps_score <= 8 THEN 'passive' ELSE 'promoter' END,
            NEW.open_feedback, v_gestor_id, CASE WHEN v_gestor_id IS NOT NULL THEN now() ELSE NULL END,
            now() + (v_sla_hours || ' hours')::interval,
            CASE WHEN NEW.nps_score <= 3 THEN 'critical' WHEN NEW.nps_score <= 5 THEN 'high' ELSE 'medium' END,
            CASE WHEN v_gestor_id IS NOT NULL THEN 'assigned' ELSE 'pending' END);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_feedback_loop_on_detractor AFTER INSERT ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION public.create_feedback_loop_for_detractor();

-- Gamificación automática
CREATE OR REPLACE FUNCTION public.update_feedback_gamification()
RETURNS TRIGGER AS $$
DECLARE
    v_coins_earned INTEGER;
BEGIN
    v_coins_earned := 10;
    IF NEW.open_feedback IS NOT NULL AND length(NEW.open_feedback) > 50 THEN v_coins_earned := v_coins_earned + 5; END IF;
    IF NEW.open_feedback IS NOT NULL AND length(NEW.open_feedback) > 200 THEN v_coins_earned := v_coins_earned + 10; END IF;
    
    INSERT INTO public.feedback_gamification (company_id, contact_id, total_coins, coins_earned_30d, surveys_completed, streak_days, last_response_date)
    VALUES (NEW.company_id, NEW.contact_id, v_coins_earned, v_coins_earned, 1, 1, CURRENT_DATE)
    ON CONFLICT (company_id, contact_id) DO UPDATE SET
        total_coins = feedback_gamification.total_coins + v_coins_earned,
        coins_earned_30d = feedback_gamification.coins_earned_30d + v_coins_earned,
        surveys_completed = feedback_gamification.surveys_completed + 1,
        streak_days = CASE WHEN feedback_gamification.last_response_date = CURRENT_DATE - 1 THEN feedback_gamification.streak_days + 1 WHEN feedback_gamification.last_response_date = CURRENT_DATE THEN feedback_gamification.streak_days ELSE 1 END,
        best_streak = GREATEST(feedback_gamification.best_streak, CASE WHEN feedback_gamification.last_response_date = CURRENT_DATE - 1 THEN feedback_gamification.streak_days + 1 ELSE feedback_gamification.streak_days END),
        last_response_date = CURRENT_DATE, updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_gamification_on_response AFTER INSERT ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION public.update_feedback_gamification();

-- Función de throttling
CREATE OR REPLACE FUNCTION public.can_send_survey(p_company_id UUID, p_contact_id UUID, p_survey_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_throttle RECORD;
    v_last_survey TIMESTAMPTZ;
    v_cooldown_days INTEGER;
BEGIN
    SELECT * INTO v_throttle FROM public.survey_throttling WHERE company_id = p_company_id AND (contact_id = p_contact_id OR (p_contact_id IS NULL AND contact_id IS NULL));
    IF v_throttle IS NULL THEN RETURN TRUE; END IF;
    IF v_throttle.opted_out THEN RETURN FALSE; END IF;
    IF v_throttle.next_survey_allowed > now() THEN RETURN FALSE; END IF;
    v_cooldown_days := CASE p_survey_type WHEN 'nps' THEN 90 WHEN 'csat' THEN 30 WHEN 'ces' THEN 30 WHEN 'microsurvey' THEN 14 ELSE 30 END;
    v_last_survey := CASE p_survey_type WHEN 'nps' THEN v_throttle.last_nps_survey WHEN 'csat' THEN v_throttle.last_csat_survey WHEN 'ces' THEN v_throttle.last_ces_survey WHEN 'microsurvey' THEN v_throttle.last_microsurvey ELSE LEAST(v_throttle.last_nps_survey, v_throttle.last_csat_survey, v_throttle.last_ces_survey) END;
    IF v_last_survey IS NOT NULL AND v_last_survey > (now() - (v_cooldown_days || ' days')::interval) THEN RETURN FALSE; END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS
ALTER TABLE public.predicted_nps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsurveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsurvey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_throttling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversational_survey_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voc_analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "predicted_nps_select" ON public.predicted_nps FOR SELECT USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial') OR EXISTS (SELECT 1 FROM companies c WHERE c.id = predicted_nps.company_id AND c.gestor_id = auth.uid()));
CREATE POLICY "predicted_nps_insert" ON public.predicted_nps FOR INSERT WITH CHECK (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "predicted_nps_update" ON public.predicted_nps FOR UPDATE USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "microsurveys_select" ON public.microsurveys FOR SELECT USING (is_active = true OR is_admin_or_superadmin(auth.uid()));
CREATE POLICY "microsurveys_insert" ON public.microsurveys FOR INSERT WITH CHECK (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "microsurveys_update" ON public.microsurveys FOR UPDATE USING (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "microsurveys_delete" ON public.microsurveys FOR DELETE USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "microsurvey_responses_select" ON public.microsurvey_responses FOR SELECT USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR EXISTS (SELECT 1 FROM companies c WHERE c.id = microsurvey_responses.company_id AND c.gestor_id = auth.uid()));
CREATE POLICY "microsurvey_responses_insert" ON public.microsurvey_responses FOR INSERT WITH CHECK (true);

CREATE POLICY "feedback_loops_select" ON public.feedback_loops FOR SELECT USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial') OR assigned_to = auth.uid() OR escalated_to = auth.uid() OR EXISTS (SELECT 1 FROM companies c WHERE c.id = feedback_loops.company_id AND c.gestor_id = auth.uid()));
CREATE POLICY "feedback_loops_insert" ON public.feedback_loops FOR INSERT WITH CHECK (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "feedback_loops_update" ON public.feedback_loops FOR UPDATE USING (is_admin_or_superadmin(auth.uid()) OR assigned_to = auth.uid() OR escalated_to = auth.uid());

CREATE POLICY "survey_throttling_select" ON public.survey_throttling FOR SELECT USING (is_admin_or_superadmin(auth.uid()) OR EXISTS (SELECT 1 FROM companies c WHERE c.id = survey_throttling.company_id AND c.gestor_id = auth.uid()));
CREATE POLICY "survey_throttling_insert" ON public.survey_throttling FOR INSERT WITH CHECK (true);
CREATE POLICY "survey_throttling_update" ON public.survey_throttling FOR UPDATE USING (true);

CREATE POLICY "feedback_gamification_select" ON public.feedback_gamification FOR SELECT USING (true);
CREATE POLICY "feedback_gamification_insert" ON public.feedback_gamification FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_gamification_update" ON public.feedback_gamification FOR UPDATE USING (true);

CREATE POLICY "conv_survey_flows_select" ON public.conversational_survey_flows FOR SELECT USING (true);
CREATE POLICY "conv_survey_flows_insert" ON public.conversational_survey_flows FOR INSERT WITH CHECK (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "conv_survey_flows_update" ON public.conversational_survey_flows FOR UPDATE USING (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "conv_survey_flows_delete" ON public.conversational_survey_flows FOR DELETE USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "voc_analytics_select" ON public.voc_analytics_cache FOR SELECT USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial') OR has_role(auth.uid(), 'responsable_comercial') OR gestor_id = auth.uid());
CREATE POLICY "voc_analytics_insert" ON public.voc_analytics_cache FOR INSERT WITH CHECK (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "voc_analytics_update" ON public.voc_analytics_cache FOR UPDATE USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "survey_tokens_select" ON public.survey_tokens FOR SELECT USING (true);
CREATE POLICY "survey_tokens_insert" ON public.survey_tokens FOR INSERT WITH CHECK (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "survey_tokens_update" ON public.survey_tokens FOR UPDATE USING (true);