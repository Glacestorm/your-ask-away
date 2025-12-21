-- =====================================================
-- FASE 1: CHAT IA SOBRE NOTICIAS
-- =====================================================

-- Tabla para conversaciones del chat de noticias
CREATE TABLE public.news_chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Nueva conversación',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para mensajes del chat
CREATE TABLE public.news_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.news_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para chat
CREATE INDEX idx_news_chat_conversations_user ON public.news_chat_conversations(user_id);
CREATE INDEX idx_news_chat_messages_conversation ON public.news_chat_messages(conversation_id);

-- =====================================================
-- FASE 2: ALERTAS WHATSAPP/TELEGRAM
-- =====================================================

-- Configuración de canales de alerta por usuario
CREATE TABLE public.user_alert_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'telegram', 'email', 'push', 'sms')),
  channel_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  alert_levels TEXT[] DEFAULT ARRAY['critical', 'high'],
  cnae_filter TEXT[] DEFAULT ARRAY[]::TEXT[],
  sector_filter TEXT[] DEFAULT ARRAY[]::TEXT[],
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log de alertas enviadas
CREATE TABLE public.news_alert_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message TEXT,
  external_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para alertas
CREATE INDEX idx_user_alert_channels_user ON public.user_alert_channels(user_id);
CREATE INDEX idx_news_alert_log_article ON public.news_alert_log(article_id);
CREATE INDEX idx_news_alert_log_user ON public.news_alert_log(user_id);
CREATE INDEX idx_news_alert_log_status ON public.news_alert_log(status);

-- =====================================================
-- FASE 3: BENCHMARK COMPETITIVO
-- =====================================================

-- Competidores a monitorear
CREATE TABLE public.news_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  website TEXT,
  logo_url TEXT,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Menciones detectadas de competidores
CREATE TABLE public.news_competitor_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.news_competitors(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  mention_context TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  sentiment_score NUMERIC(3,2),
  keyword_matched TEXT,
  prominence TEXT CHECK (prominence IN ('headline', 'lead', 'body', 'footnote')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competitor_id, article_id)
);

-- Índices para benchmark
CREATE INDEX idx_news_competitors_active ON public.news_competitors(is_active);
CREATE INDEX idx_news_competitor_mentions_competitor ON public.news_competitor_mentions(competitor_id);
CREATE INDEX idx_news_competitor_mentions_article ON public.news_competitor_mentions(article_id);
CREATE INDEX idx_news_competitor_mentions_sentiment ON public.news_competitor_mentions(sentiment);

-- =====================================================
-- FASE 4: BUSINESS IMPACT SCORING PERSONALIZADO
-- =====================================================

-- Perfil de empresa para personalización de noticias
CREATE TABLE public.company_news_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  cnae_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
  sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
  regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  competitor_ids UUID[] DEFAULT ARRAY[]::UUID[],
  alert_threshold INTEGER DEFAULT 70 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  auto_subscribe BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scores personalizados por artículo/empresa
CREATE TABLE public.personalized_news_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  personalized_score INTEGER NOT NULL CHECK (personalized_score >= 0 AND personalized_score <= 100),
  impact_factors JSONB DEFAULT '{}',
  relevance_reasons TEXT[],
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, company_id)
);

-- Índices para impact scoring
CREATE INDEX idx_company_news_profiles_company ON public.company_news_profiles(company_id);
CREATE INDEX idx_personalized_news_scores_article ON public.personalized_news_scores(article_id);
CREATE INDEX idx_personalized_news_scores_company ON public.personalized_news_scores(company_id);
CREATE INDEX idx_personalized_news_scores_score ON public.personalized_news_scores(personalized_score DESC);

-- =====================================================
-- FASE 5: PREDICCIÓN DE TENDENCIAS CON ML
-- =====================================================

-- Predicciones de tendencias
CREATE TABLE public.news_trend_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trend_name TEXT NOT NULL,
  trend_category TEXT,
  current_mentions INTEGER DEFAULT 0,
  predicted_growth NUMERIC(5,2),
  confidence_score NUMERIC(3,2),
  peak_prediction_date DATE,
  velocity_score NUMERIC(5,2),
  supporting_articles UUID[] DEFAULT ARRAY[]::UUID[],
  analysis_factors JSONB DEFAULT '{}',
  status TEXT DEFAULT 'emerging' CHECK (status IN ('emerging', 'growing', 'peaking', 'declining', 'stable')),
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de tendencias para ML
CREATE TABLE public.news_trend_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trend_name TEXT NOT NULL,
  mention_count INTEGER NOT NULL DEFAULT 0,
  avg_sentiment NUMERIC(3,2),
  article_ids UUID[] DEFAULT ARRAY[]::UUID[],
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trend_name, date)
);

-- Índices para predicciones
CREATE INDEX idx_news_trend_predictions_date ON public.news_trend_predictions(analysis_date DESC);
CREATE INDEX idx_news_trend_predictions_status ON public.news_trend_predictions(status);
CREATE INDEX idx_news_trend_history_trend ON public.news_trend_history(trend_name);
CREATE INDEX idx_news_trend_history_date ON public.news_trend_history(date DESC);

-- =====================================================
-- FASE 6: RESUMEN DE VOZ DIARIO
-- =====================================================

-- Resúmenes de audio generados
CREATE TABLE public.news_audio_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  audio_url TEXT,
  transcript TEXT,
  script TEXT,
  articles_included UUID[] DEFAULT ARRAY[]::UUID[],
  duration_seconds INTEGER,
  voice_id TEXT,
  language TEXT DEFAULT 'es',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para audio
CREATE INDEX idx_news_audio_summaries_date ON public.news_audio_summaries(date DESC);
CREATE INDEX idx_news_audio_summaries_status ON public.news_audio_summaries(status);

-- =====================================================
-- FASE 7: INTEGRACIÓN CRM - OPORTUNIDADES COMERCIALES
-- =====================================================

-- Oportunidades detectadas desde noticias
CREATE TABLE public.news_commercial_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('upsell', 'cross_sell', 'new_lead', 'retention', 'expansion', 'risk_mitigation')),
  title TEXT NOT NULL,
  description TEXT,
  potential_value NUMERIC(12,2),
  confidence_score NUMERIC(3,2),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'converted', 'dismissed', 'expired')),
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ,
  action_items JSONB DEFAULT '[]',
  outcome_notes TEXT,
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relación noticia-lead
CREATE TABLE public.news_lead_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  link_type TEXT DEFAULT 'auto' CHECK (link_type IN ('auto', 'manual', 'ai_suggested')),
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
  relevance_reason TEXT,
  linked_by UUID REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, company_id)
);

-- Índices para oportunidades
CREATE INDEX idx_news_commercial_opportunities_article ON public.news_commercial_opportunities(article_id);
CREATE INDEX idx_news_commercial_opportunities_company ON public.news_commercial_opportunities(company_id);
CREATE INDEX idx_news_commercial_opportunities_status ON public.news_commercial_opportunities(status);
CREATE INDEX idx_news_commercial_opportunities_assigned ON public.news_commercial_opportunities(assigned_to);
CREATE INDEX idx_news_commercial_opportunities_priority ON public.news_commercial_opportunities(priority);
CREATE INDEX idx_news_lead_links_article ON public.news_lead_links(article_id);
CREATE INDEX idx_news_lead_links_company ON public.news_lead_links(company_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.news_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alert_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_competitor_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_news_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_news_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_trend_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_trend_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_audio_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_commercial_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_lead_links ENABLE ROW LEVEL SECURITY;

-- Chat conversations - users can manage their own
CREATE POLICY "Users can view own chat conversations"
  ON public.news_chat_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own chat conversations"
  ON public.news_chat_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat conversations"
  ON public.news_chat_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own chat conversations"
  ON public.news_chat_conversations FOR DELETE
  USING (user_id = auth.uid());

-- Chat messages - users can manage messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON public.news_chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.news_chat_conversations c 
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages in own conversations"
  ON public.news_chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.news_chat_conversations c 
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

-- Alert channels - users manage their own
CREATE POLICY "Users can view own alert channels"
  ON public.user_alert_channels FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own alert channels"
  ON public.user_alert_channels FOR ALL
  USING (user_id = auth.uid());

-- Alert log - users can view their own, admins all
CREATE POLICY "Users can view own alert logs"
  ON public.news_alert_log FOR SELECT
  USING (user_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- Competitors - authenticated users can view, admins can manage
CREATE POLICY "Authenticated users can view competitors"
  ON public.news_competitors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage competitors"
  ON public.news_competitors FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Competitor mentions - authenticated users can view
CREATE POLICY "Authenticated users can view competitor mentions"
  ON public.news_competitor_mentions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Company news profiles - company access
CREATE POLICY "Users can view company news profiles"
  ON public.company_news_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage company news profiles"
  ON public.company_news_profiles FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Personalized scores - viewable by authenticated users
CREATE POLICY "Authenticated users can view personalized scores"
  ON public.personalized_news_scores FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trend predictions - viewable by authenticated users
CREATE POLICY "Authenticated users can view trend predictions"
  ON public.news_trend_predictions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage trend predictions"
  ON public.news_trend_predictions FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Trend history - viewable by authenticated users
CREATE POLICY "Authenticated users can view trend history"
  ON public.news_trend_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Audio summaries - viewable by authenticated users
CREATE POLICY "Authenticated users can view audio summaries"
  ON public.news_audio_summaries FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage audio summaries"
  ON public.news_audio_summaries FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Commercial opportunities - based on role
CREATE POLICY "Users can view assigned opportunities"
  ON public.news_commercial_opportunities FOR SELECT
  USING (
    assigned_to = auth.uid() 
    OR is_admin_or_superadmin(auth.uid())
    OR has_role(auth.uid(), 'director_comercial')
    OR has_role(auth.uid(), 'responsable_comercial')
  );

CREATE POLICY "Admins can manage opportunities"
  ON public.news_commercial_opportunities FOR ALL
  USING (is_admin_or_superadmin(auth.uid()) OR has_role(auth.uid(), 'director_comercial'));

-- Lead links - authenticated users can view
CREATE POLICY "Authenticated users can view lead links"
  ON public.news_lead_links FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage lead links"
  ON public.news_lead_links FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_news_chat_conversations_timestamp
  BEFORE UPDATE ON public.news_chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_news_updated_at();

CREATE TRIGGER update_user_alert_channels_timestamp
  BEFORE UPDATE ON public.user_alert_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_news_updated_at();

CREATE TRIGGER update_news_competitors_timestamp
  BEFORE UPDATE ON public.news_competitors
  FOR EACH ROW EXECUTE FUNCTION public.update_news_updated_at();

CREATE TRIGGER update_company_news_profiles_timestamp
  BEFORE UPDATE ON public.company_news_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_news_updated_at();

CREATE TRIGGER update_news_trend_predictions_timestamp
  BEFORE UPDATE ON public.news_trend_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_news_updated_at();

CREATE TRIGGER update_news_audio_summaries_timestamp
  BEFORE UPDATE ON public.news_audio_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_news_updated_at();

CREATE TRIGGER update_news_commercial_opportunities_timestamp
  BEFORE UPDATE ON public.news_commercial_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_news_updated_at();