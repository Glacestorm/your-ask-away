-- =============================================
-- FASE 1: Sistema de Métricas de Satisfacción
-- =============================================

-- Tipos de encuesta
CREATE TYPE public.survey_type AS ENUM ('nps', 'csat', 'ces');
CREATE TYPE public.survey_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE public.survey_trigger AS ENUM ('manual', 'post_visit', 'post_ticket', 'milestone', 'periodic', 'post_onboarding');
CREATE TYPE public.sentiment_type AS ENUM ('positive', 'neutral', 'negative', 'mixed');

-- Plantillas de encuestas
CREATE TABLE public.satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  survey_type survey_type NOT NULL,
  description TEXT,
  question_text TEXT NOT NULL,
  follow_up_question TEXT, -- Pregunta abierta opcional
  is_active BOOLEAN DEFAULT true,
  trigger_type survey_trigger DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}', -- Configuración específica del trigger
  delay_hours INTEGER DEFAULT 0, -- Horas de espera antes de enviar
  target_segment TEXT, -- Segmento objetivo (Premium, Growth, etc.)
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campañas de encuestas (ejecuciones de encuestas)
CREATE TABLE public.survey_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.satisfaction_surveys(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status survey_status DEFAULT 'draft',
  target_companies UUID[] DEFAULT '{}', -- IDs de empresas objetivo
  target_segments TEXT[] DEFAULT '{}', -- Segmentos objetivo
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  avg_score DECIMAL(4,2),
  channel TEXT DEFAULT 'email', -- email, in_app, sms
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Respuestas a encuestas
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.satisfaction_surveys(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.survey_campaigns(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
  respondent_name TEXT,
  respondent_email TEXT,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10), -- 0-10 para NPS, 1-5 para CSAT/CES
  feedback_text TEXT, -- Respuesta abierta
  sentiment sentiment_type,
  sentiment_score DECIMAL(3,2), -- -1 a 1
  trigger_context JSONB DEFAULT '{}', -- Contexto del trigger (visit_id, ticket_id, etc.)
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  gestor_id UUID REFERENCES auth.users(id),
  channel TEXT DEFAULT 'email',
  responded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Análisis de sentimiento de interacciones
CREATE TABLE public.sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- visit_notes, email, ticket, chat, call_transcript
  source_id UUID, -- ID del registro fuente
  content_analyzed TEXT NOT NULL,
  sentiment sentiment_type NOT NULL,
  sentiment_score DECIMAL(3,2) NOT NULL, -- -1 (muy negativo) a 1 (muy positivo)
  confidence DECIMAL(3,2) DEFAULT 0.8,
  key_phrases TEXT[] DEFAULT '{}',
  emotions JSONB DEFAULT '{}', -- {joy: 0.2, anger: 0.1, fear: 0.05, etc.}
  topics TEXT[] DEFAULT '{}', -- Temas detectados
  action_required BOOLEAN DEFAULT false,
  alert_sent BOOLEAN DEFAULT false,
  analyzed_by TEXT DEFAULT 'ai', -- ai, manual
  gestor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Métricas agregadas de NPS por período
CREATE TABLE public.nps_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'monthly', -- daily, weekly, monthly, quarterly
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  segment TEXT, -- Si es null, es métrica global
  gestor_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  total_responses INTEGER DEFAULT 0,
  promoters INTEGER DEFAULT 0, -- Score 9-10
  passives INTEGER DEFAULT 0, -- Score 7-8
  detractors INTEGER DEFAULT 0, -- Score 0-6
  nps_score INTEGER, -- Calculado: (promoters - detractors) / total * 100
  avg_csat DECIMAL(3,2),
  avg_ces DECIMAL(3,2),
  avg_sentiment DECIMAL(3,2),
  trend_vs_previous DECIMAL(5,2), -- Variación respecto al período anterior
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(period_start, period_end, company_id, segment, gestor_id, product_id)
);

-- Configuración de alertas de satisfacción
CREATE TABLE public.satisfaction_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- low_nps, negative_sentiment, detractor_response, no_response
  threshold_value DECIMAL(5,2),
  condition_type TEXT DEFAULT 'below', -- below, above, equals
  notify_gestor BOOLEAN DEFAULT true,
  notify_manager BOOLEAN DEFAULT false,
  auto_create_task BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de alertas disparadas
CREATE TABLE public.satisfaction_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.satisfaction_alerts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  trigger_value DECIMAL(5,2),
  trigger_context JSONB DEFAULT '{}',
  task_created_id UUID,
  notified_users UUID[] DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX idx_survey_responses_company ON public.survey_responses(company_id);
CREATE INDEX idx_survey_responses_date ON public.survey_responses(responded_at DESC);
CREATE INDEX idx_survey_responses_score ON public.survey_responses(score);
CREATE INDEX idx_sentiment_analysis_company ON public.sentiment_analysis(company_id);
CREATE INDEX idx_sentiment_analysis_date ON public.sentiment_analysis(created_at DESC);
CREATE INDEX idx_sentiment_analysis_sentiment ON public.sentiment_analysis(sentiment);
CREATE INDEX idx_nps_metrics_period ON public.nps_metrics(period_start, period_end);
CREATE INDEX idx_survey_campaigns_status ON public.survey_campaigns(status);

-- RLS Policies
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satisfaction_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satisfaction_alert_history ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados
CREATE POLICY "Users can view surveys" ON public.satisfaction_surveys
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage surveys" ON public.satisfaction_surveys
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view campaigns" ON public.survey_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage campaigns" ON public.survey_campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view responses" ON public.survey_responses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert responses" ON public.survey_responses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public can insert responses" ON public.survey_responses
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Users can view sentiment" ON public.sentiment_analysis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage sentiment" ON public.sentiment_analysis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view nps metrics" ON public.nps_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage nps metrics" ON public.nps_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view alerts" ON public.satisfaction_alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage alerts" ON public.satisfaction_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view alert history" ON public.satisfaction_alert_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage alert history" ON public.satisfaction_alert_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Función para calcular NPS
CREATE OR REPLACE FUNCTION public.calculate_nps(
  p_promoters INTEGER,
  p_passives INTEGER,
  p_detractors INTEGER
) RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  total := p_promoters + p_passives + p_detractors;
  IF total = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND(((p_promoters::DECIMAL - p_detractors::DECIMAL) / total::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para actualizar métricas NPS automáticamente
CREATE OR REPLACE FUNCTION public.update_nps_metrics_on_response()
RETURNS TRIGGER AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_survey_type survey_type;
BEGIN
  -- Obtener tipo de encuesta
  SELECT survey_type INTO v_survey_type
  FROM public.satisfaction_surveys
  WHERE id = NEW.survey_id;
  
  -- Solo procesar NPS
  IF v_survey_type = 'nps' THEN
    -- Período mensual
    v_period_start := date_trunc('month', NEW.responded_at)::DATE;
    v_period_end := (date_trunc('month', NEW.responded_at) + interval '1 month' - interval '1 day')::DATE;
    
    -- Upsert métricas
    INSERT INTO public.nps_metrics (
      period_start, period_end, company_id, gestor_id,
      total_responses, promoters, passives, detractors
    )
    VALUES (
      v_period_start, v_period_end, NEW.company_id, NEW.gestor_id,
      1,
      CASE WHEN NEW.score >= 9 THEN 1 ELSE 0 END,
      CASE WHEN NEW.score BETWEEN 7 AND 8 THEN 1 ELSE 0 END,
      CASE WHEN NEW.score <= 6 THEN 1 ELSE 0 END
    )
    ON CONFLICT (period_start, period_end, company_id, segment, gestor_id, product_id)
    DO UPDATE SET
      total_responses = nps_metrics.total_responses + 1,
      promoters = nps_metrics.promoters + CASE WHEN NEW.score >= 9 THEN 1 ELSE 0 END,
      passives = nps_metrics.passives + CASE WHEN NEW.score BETWEEN 7 AND 8 THEN 1 ELSE 0 END,
      detractors = nps_metrics.detractors + CASE WHEN NEW.score <= 6 THEN 1 ELSE 0 END,
      nps_score = public.calculate_nps(
        nps_metrics.promoters + CASE WHEN NEW.score >= 9 THEN 1 ELSE 0 END,
        nps_metrics.passives + CASE WHEN NEW.score BETWEEN 7 AND 8 THEN 1 ELSE 0 END,
        nps_metrics.detractors + CASE WHEN NEW.score <= 6 THEN 1 ELSE 0 END
      ),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_nps_metrics
AFTER INSERT ON public.survey_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_nps_metrics_on_response();

-- Insertar encuestas predefinidas
INSERT INTO public.satisfaction_surveys (name, survey_type, question_text, follow_up_question, trigger_type, delay_hours) VALUES
('NPS Post-Visita', 'nps', '¿Qué probabilidad hay de que recomiende nuestros servicios a un colega?', '¿Qué podríamos mejorar?', 'post_visit', 24),
('CSAT Post-Ticket', 'csat', '¿Qué tan satisfecho está con la resolución de su consulta?', '¿Hay algo que podríamos haber hecho mejor?', 'post_ticket', 1),
('CES Onboarding', 'ces', '¿Qué tan fácil fue completar el proceso de activación?', '¿Qué obstáculos encontró?', 'post_onboarding', 0),
('NPS Trimestral', 'nps', '¿Qué probabilidad hay de que recomiende nuestros servicios a un colega?', '¿Qué valora más de nuestro servicio?', 'periodic', 0);

-- Insertar alertas predefinidas
INSERT INTO public.satisfaction_alerts (name, alert_type, threshold_value, condition_type, auto_create_task) VALUES
('Detractor detectado', 'detractor_response', 6, 'below', true),
('Sentimiento muy negativo', 'negative_sentiment', -0.5, 'below', true),
('NPS mensual bajo', 'low_nps', 0, 'below', true),
('Sin respuesta 7 días', 'no_response', 7, 'above', false);