-- =====================================================
-- ObelixIA Accounting Copilot - Fase 1: AI Chatbot
-- =====================================================

-- Tabla de conversaciones del copilot
CREATE TABLE public.obelixia_copilot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  context_type TEXT DEFAULT 'general', -- general, journal_entry, reconciliation, tax, report
  context_id UUID, -- ID de la entidad relacionada (asiento, declaración, etc.)
  fiscal_config_id UUID REFERENCES public.obelixia_fiscal_config(id),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  messages_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de mensajes del copilot
CREATE TABLE public.obelixia_copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.obelixia_copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- tokens, latency, model, etc.
  references_data JSONB DEFAULT '[]', -- referencias a cuentas, asientos, etc.
  action_taken JSONB, -- acción ejecutada por el copilot
  feedback TEXT CHECK (feedback IN ('positive', 'negative', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de sugerencias del copilot
CREATE TABLE public.obelixia_copilot_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fiscal_config_id UUID REFERENCES public.obelixia_fiscal_config(id),
  suggestion_type TEXT NOT NULL, -- entry, reconciliation, anomaly, optimization, compliance
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  suggested_action JSONB, -- acción sugerida con parámetros
  context_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de quick actions predefinidas
CREATE TABLE public.obelixia_copilot_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  prompt_template TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, entries, reports, tax, reconciliation
  requires_context BOOLEAN DEFAULT false,
  context_type TEXT, -- journal_entry, account, partner, period
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX idx_copilot_conversations_user ON public.obelixia_copilot_conversations(user_id);
CREATE INDEX idx_copilot_conversations_active ON public.obelixia_copilot_conversations(is_active, last_message_at DESC);
CREATE INDEX idx_copilot_messages_conversation ON public.obelixia_copilot_messages(conversation_id, created_at);
CREATE INDEX idx_copilot_suggestions_user ON public.obelixia_copilot_suggestions(user_id, status);
CREATE INDEX idx_copilot_suggestions_type ON public.obelixia_copilot_suggestions(suggestion_type, priority);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_copilot_conversations_timestamp
  BEFORE UPDATE ON public.obelixia_copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

CREATE TRIGGER update_copilot_suggestions_timestamp
  BEFORE UPDATE ON public.obelixia_copilot_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_phase6_timestamp();

-- Trigger para actualizar contador de mensajes
CREATE OR REPLACE FUNCTION public.update_copilot_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.obelixia_copilot_conversations
  SET 
    messages_count = messages_count + 1,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_copilot_stats_on_message
  AFTER INSERT ON public.obelixia_copilot_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_copilot_conversation_stats();

-- RLS Policies
ALTER TABLE public.obelixia_copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_copilot_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obelixia_copilot_quick_actions ENABLE ROW LEVEL SECURITY;

-- Políticas para conversaciones
CREATE POLICY "Users can view own conversations"
  ON public.obelixia_copilot_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.obelixia_copilot_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.obelixia_copilot_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para mensajes
CREATE POLICY "Users can view messages of own conversations"
  ON public.obelixia_copilot_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.obelixia_copilot_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages to own conversations"
  ON public.obelixia_copilot_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.obelixia_copilot_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own messages feedback"
  ON public.obelixia_copilot_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.obelixia_copilot_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

-- Políticas para sugerencias
CREATE POLICY "Users can view own suggestions"
  ON public.obelixia_copilot_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON public.obelixia_copilot_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

-- Quick actions son públicas para lectura
CREATE POLICY "Anyone can view active quick actions"
  ON public.obelixia_copilot_quick_actions FOR SELECT
  USING (is_active = true);

-- Insertar quick actions predefinidas
INSERT INTO public.obelixia_copilot_quick_actions (action_key, title, description, icon, prompt_template, category, display_order) VALUES
('explain_balance', 'Explicar Balance', 'Analiza y explica el estado del balance general', 'FileText', 'Analiza el balance general actual y explícame los puntos clave, ratios importantes y cualquier anomalía que detectes.', 'reports', 1),
('suggest_entries', 'Sugerir Asientos', 'Genera sugerencias de asientos contables pendientes', 'PenTool', 'Basándote en los movimientos bancarios pendientes de conciliar y las facturas sin contabilizar, sugiere los asientos contables que deberían registrarse.', 'entries', 2),
('check_tax', 'Revisar Impuestos', 'Verifica el estado de declaraciones fiscales', 'Receipt', 'Revisa el calendario fiscal y las declaraciones pendientes. ¿Hay alguna obligación próxima o atrasada?', 'tax', 3),
('detect_anomalies', 'Detectar Anomalías', 'Busca irregularidades en la contabilidad', 'AlertTriangle', 'Analiza los asientos recientes y detecta posibles anomalías, errores de cuadre o patrones inusuales.', 'general', 4),
('reconcile_help', 'Ayuda Conciliación', 'Asistencia para conciliar movimientos', 'GitMerge', 'Hay movimientos bancarios pendientes de conciliar. Ayúdame a identificar las contrapartidas correctas y resolver las discrepancias.', 'reconciliation', 5),
('cash_forecast', 'Previsión Tesorería', 'Proyección de flujo de caja', 'TrendingUp', 'Genera una previsión de tesorería para los próximos 30 días basándote en los cobros y pagos pendientes.', 'reports', 6),
('close_period', 'Cerrar Período', 'Guía para cierre contable', 'Lock', 'Guíame paso a paso para realizar el cierre del período actual. ¿Qué verificaciones debo hacer antes?', 'general', 7),
('optimize_taxes', 'Optimizar Fiscalidad', 'Sugerencias de optimización fiscal', 'Sparkles', 'Analiza la situación fiscal actual y sugiere estrategias legales de optimización para reducir la carga tributaria.', 'tax', 8);

-- Habilitar realtime para mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE public.obelixia_copilot_messages;