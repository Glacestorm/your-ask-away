
-- =============================================
-- FASE 3: RETENCIÓN PROACTIVA CON PLAYBOOKS
-- =============================================

-- 1. PLAYBOOKS DE RETENCIÓN INTELIGENTES
-- =============================================

-- Tabla principal de playbooks
CREATE TABLE public.retention_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'automatic', 'ai_suggested')),
  trigger_conditions JSONB DEFAULT '{}',
  target_segment TEXT,
  priority INTEGER DEFAULT 5,
  estimated_duration_days INTEGER DEFAULT 7,
  success_criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pasos del playbook
CREATE TABLE public.playbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID REFERENCES public.retention_playbooks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('task', 'email', 'call', 'meeting', 'wait', 'condition', 'ai_action')),
  title TEXT NOT NULL,
  description TEXT,
  action_config JSONB DEFAULT '{}',
  wait_days INTEGER DEFAULT 0,
  condition_logic JSONB,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ejecuciones de playbooks
CREATE TABLE public.playbook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID REFERENCES public.retention_playbooks(id),
  company_id UUID REFERENCES public.companies(id),
  triggered_by UUID REFERENCES public.profiles(id),
  trigger_reason TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'failed')),
  current_step INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  outcome_notes TEXT,
  variables JSONB DEFAULT '{}',
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de pasos ejecutados
CREATE TABLE public.playbook_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.playbook_executions(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.playbook_steps(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  result_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SISTEMA DE TICKETS/SOPORTE INTEGRADO
-- =============================================

-- Tickets de soporte (sin referencia a contacts)
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  contact_name TEXT,
  contact_email TEXT,
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'product', 'complaint', 'feature_request', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'waiting_internal', 'resolved', 'closed')),
  subject TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'portal' CHECK (source IN ('portal', 'email', 'phone', 'chat', 'internal')),
  sla_policy_id UUID,
  sla_response_due TIMESTAMPTZ,
  sla_resolution_due TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  health_impact INTEGER DEFAULT -5,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Respuestas a tickets
CREATE TABLE public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  author_type TEXT DEFAULT 'agent' CHECK (author_type IN ('agent', 'customer', 'system', 'ai')),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  ai_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Políticas SLA
CREATE TABLE public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  first_response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  business_hours_only BOOLEAN DEFAULT true,
  escalation_enabled BOOLEAN DEFAULT true,
  escalation_hours INTEGER DEFAULT 4,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reglas de escalación para tickets
CREATE TABLE public.ticket_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_condition TEXT NOT NULL CHECK (trigger_condition IN ('sla_breach', 'priority_change', 'customer_vip', 'repeated_contact', 'negative_sentiment')),
  trigger_config JSONB DEFAULT '{}',
  escalation_level INTEGER DEFAULT 1,
  escalate_to_role TEXT,
  escalate_to_user UUID REFERENCES public.profiles(id),
  notification_channels TEXT[] DEFAULT ARRAY['in_app'],
  auto_assign BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RENEWAL MANAGEMENT
-- =============================================

CREATE TABLE public.renewal_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  contract_id UUID,
  current_mrr DECIMAL(12,2),
  renewal_date DATE NOT NULL,
  renewal_probability DECIMAL(5,2),
  predicted_outcome TEXT CHECK (predicted_outcome IN ('renew', 'churn', 'expand', 'downgrade')),
  risk_factors JSONB DEFAULT '[]',
  expansion_opportunities JSONB DEFAULT '[]',
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_negotiation', 'renewed', 'churned', 'expanded', 'downgraded')),
  nurturing_stage TEXT DEFAULT 'awareness' CHECK (nurturing_stage IN ('awareness', 'engagement', 'negotiation', 'closing', 'completed')),
  last_contact_date DATE,
  next_action TEXT,
  next_action_date DATE,
  outcome_mrr DECIMAL(12,2),
  outcome_notes TEXT,
  ai_insights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.renewal_nurturing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renewal_id UUID REFERENCES public.renewal_opportunities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('email', 'call', 'meeting', 'demo', 'proposal', 'contract_sent', 'negotiation')),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  performed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  outcome TEXT,
  next_step TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WIN-BACK CAMPAIGNS
-- =============================================

CREATE TABLE public.winback_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_segment JSONB DEFAULT '{}',
  offer_type TEXT CHECK (offer_type IN ('discount', 'free_trial', 'feature_unlock', 'custom')),
  offer_details JSONB DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  is_ab_test BOOLEAN DEFAULT false,
  ab_variants JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  budget DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.winback_campaign_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.winback_campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  contact_name TEXT,
  contact_email TEXT,
  ab_variant TEXT,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'contacted', 'engaged', 'converted', 'declined', 'unresponsive')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL(12,2),
  touchpoints INTEGER DEFAULT 0,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.winback_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.winback_campaigns(id),
  participant_id UUID REFERENCES public.winback_campaign_participants(id),
  company_id UUID REFERENCES public.companies(id),
  previous_mrr DECIMAL(12,2),
  recovered_mrr DECIMAL(12,2),
  offer_applied JSONB,
  conversion_date DATE DEFAULT CURRENT_DATE,
  retention_months INTEGER DEFAULT 0,
  lifetime_value_recovered DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES PARA RENDIMIENTO
-- =============================================

CREATE INDEX idx_retention_playbooks_segment ON public.retention_playbooks(target_segment);
CREATE INDEX idx_retention_playbooks_active ON public.retention_playbooks(is_active);
CREATE INDEX idx_playbook_steps_playbook ON public.playbook_steps(playbook_id, step_number);
CREATE INDEX idx_playbook_executions_company ON public.playbook_executions(company_id);
CREATE INDEX idx_playbook_executions_status ON public.playbook_executions(status);

CREATE INDEX idx_support_tickets_company ON public.support_tickets(company_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_sla ON public.support_tickets(sla_response_due, sla_resolution_due);
CREATE INDEX idx_ticket_responses_ticket ON public.ticket_responses(ticket_id);

CREATE INDEX idx_renewal_opportunities_company ON public.renewal_opportunities(company_id);
CREATE INDEX idx_renewal_opportunities_date ON public.renewal_opportunities(renewal_date);
CREATE INDEX idx_renewal_opportunities_status ON public.renewal_opportunities(status);
CREATE INDEX idx_renewal_nurturing_renewal ON public.renewal_nurturing_activities(renewal_id);

CREATE INDEX idx_winback_campaigns_status ON public.winback_campaigns(status);
CREATE INDEX idx_winback_participants_campaign ON public.winback_campaign_participants(campaign_id);
CREATE INDEX idx_winback_participants_status ON public.winback_campaign_participants(status);
CREATE INDEX idx_winback_conversions_campaign ON public.winback_conversions(campaign_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.retention_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_nurturing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view playbooks" ON public.retention_playbooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage playbooks" ON public.retention_playbooks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view playbook steps" ON public.playbook_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage playbook steps" ON public.playbook_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view executions" ON public.playbook_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage executions" ON public.playbook_executions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view step executions" ON public.playbook_step_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage step executions" ON public.playbook_step_executions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view tickets" ON public.support_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view responses" ON public.ticket_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage responses" ON public.ticket_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view SLA policies" ON public.sla_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage SLA policies" ON public.sla_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view escalation rules" ON public.ticket_escalation_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage escalation rules" ON public.ticket_escalation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view renewals" ON public.renewal_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage renewals" ON public.renewal_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view nurturing" ON public.renewal_nurturing_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage nurturing" ON public.renewal_nurturing_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view winback campaigns" ON public.winback_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage winback campaigns" ON public.winback_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view participants" ON public.winback_campaign_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage participants" ON public.winback_campaign_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view conversions" ON public.winback_conversions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage conversions" ON public.winback_conversions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- DATOS INICIALES: PLAYBOOKS PREDEFINIDOS
-- =============================================

INSERT INTO public.retention_playbooks (name, description, trigger_type, trigger_conditions, target_segment, priority, estimated_duration_days, success_criteria) VALUES
('Cliente en Riesgo Alto', 'Playbook para clientes con health score crítico que requieren intervención inmediata', 'automatic', '{"health_score": {"operator": "lt", "value": 40}}', 'at_risk', 1, 14, '{"target_health_score": 60, "required_touchpoints": 3}'),
('Renovación Próxima - 60 días', 'Nurturing proactivo para clientes con renovación en los próximos 60 días', 'automatic', '{"days_to_renewal": {"operator": "lte", "value": 60}}', 'renewal_upcoming', 2, 45, '{"renewal_confirmed": true, "expansion_discussed": true}'),
('Caída de Uso Significativa', 'Intervención cuando el uso del producto cae más del 30%', 'automatic', '{"usage_drop_percentage": {"operator": "gte", "value": 30}}', 'usage_drop', 2, 21, '{"usage_restored": true, "training_completed": true}'),
('NPS Detractor', 'Recuperación de clientes que han dado NPS bajo (0-6)', 'automatic', '{"nps_score": {"operator": "lte", "value": 6}}', 'nps_low', 1, 7, '{"follow_up_completed": true, "issue_resolved": true}'),
('Win-back Cliente Perdido', 'Campaña de recuperación para clientes que han churneado', 'manual', '{"segment": "Lost", "months_since_churn": {"operator": "lte", "value": 6}}', 'churned', 3, 30, '{"contact_established": true, "offer_presented": true}');

-- Pasos para "Cliente en Riesgo Alto"
INSERT INTO public.playbook_steps (playbook_id, step_number, step_type, title, description, action_config, wait_days) 
SELECT id, 1, 'ai_action', 'Análisis IA de Riesgo', 'La IA analiza el perfil del cliente y genera recomendaciones personalizadas', '{"ai_prompt": "analyze_risk_factors"}', 0
FROM public.retention_playbooks WHERE name = 'Cliente en Riesgo Alto';

INSERT INTO public.playbook_steps (playbook_id, step_number, step_type, title, description, action_config, wait_days) 
SELECT id, 2, 'call', 'Llamada de Diagnóstico', 'Contactar al cliente para entender la situación actual', '{"duration_minutes": 30, "template": "risk_diagnosis"}', 0
FROM public.retention_playbooks WHERE name = 'Cliente en Riesgo Alto';

INSERT INTO public.playbook_steps (playbook_id, step_number, step_type, title, description, action_config, wait_days) 
SELECT id, 3, 'task', 'Plan de Acción Personalizado', 'Crear plan de acción basado en hallazgos de la llamada', '{"create_action_plan": true}', 1
FROM public.retention_playbooks WHERE name = 'Cliente en Riesgo Alto';

INSERT INTO public.playbook_steps (playbook_id, step_number, step_type, title, description, action_config, wait_days) 
SELECT id, 4, 'meeting', 'Reunión de Revisión', 'Presentar plan de acción y obtener compromiso', '{"meeting_type": "review", "attendees": ["csm", "sponsor"]}', 3
FROM public.retention_playbooks WHERE name = 'Cliente en Riesgo Alto';

INSERT INTO public.playbook_steps (playbook_id, step_number, step_type, title, description, action_config, wait_days) 
SELECT id, 5, 'wait', 'Período de Implementación', 'Dar tiempo para implementar mejoras acordadas', '{}', 7
FROM public.retention_playbooks WHERE name = 'Cliente en Riesgo Alto';

INSERT INTO public.playbook_steps (playbook_id, step_number, step_type, title, description, action_config, wait_days) 
SELECT id, 6, 'call', 'Follow-up de Progreso', 'Verificar progreso y ajustar plan si es necesario', '{"duration_minutes": 20, "template": "progress_check"}', 0
FROM public.retention_playbooks WHERE name = 'Cliente en Riesgo Alto';

-- SLA Policies por defecto
INSERT INTO public.sla_policies (name, description, priority, first_response_hours, resolution_hours, business_hours_only, is_default) VALUES
('Urgente', 'Para tickets críticos que afectan operaciones', 'urgent', 1, 4, false, false),
('Alta', 'Tickets de alta prioridad', 'high', 4, 24, true, false),
('Media', 'Tickets estándar', 'medium', 8, 48, true, true),
('Baja', 'Consultas y mejoras menores', 'low', 24, 120, true, false);

-- Reglas de escalación por defecto
INSERT INTO public.ticket_escalation_rules (name, trigger_condition, trigger_config, escalation_level, escalate_to_role, notification_channels) VALUES
('Breach SLA Respuesta', 'sla_breach', '{"breach_type": "first_response"}', 1, 'team_lead', ARRAY['in_app', 'email']),
('Breach SLA Resolución', 'sla_breach', '{"breach_type": "resolution"}', 2, 'manager', ARRAY['in_app', 'email', 'sms']),
('Cliente VIP', 'customer_vip', '{"segment": "Enterprise"}', 1, 'account_manager', ARRAY['in_app', 'email']),
('Sentimiento Negativo', 'negative_sentiment', '{"threshold": -0.5}', 1, 'team_lead', ARRAY['in_app']);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Secuencia para tickets
CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1;

-- Generar número de ticket automáticamente
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- Actualizar health score cuando se crea un ticket
CREATE OR REPLACE FUNCTION update_health_on_ticket()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.health_scores
  SET 
    overall_score = GREATEST(0, overall_score + NEW.health_impact),
    support_score = GREATEST(0, COALESCE(support_score, 100) - 10),
    updated_at = NOW()
  WHERE company_id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_affects_health
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_health_on_ticket();

-- Triggers para actualizar timestamps
CREATE TRIGGER update_retention_playbooks_updated_at
  BEFORE UPDATE ON public.retention_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_executions_updated_at
  BEFORE UPDATE ON public.playbook_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renewal_opportunities_updated_at
  BEFORE UPDATE ON public.renewal_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_winback_campaigns_updated_at
  BEFORE UPDATE ON public.winback_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_winback_participants_updated_at
  BEFORE UPDATE ON public.winback_campaign_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
