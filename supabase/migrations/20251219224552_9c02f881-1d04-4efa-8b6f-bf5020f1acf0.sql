-- =====================================================
-- FASE 5: CDP + Orquestación Omnicanal
-- =====================================================

-- 1. Customer Consents (GDPR/Privacy compliant)
CREATE TABLE IF NOT EXISTS public.customer_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL, -- 'marketing', 'email', 'sms', 'whatsapp', 'phone', 'analytics'
  status TEXT NOT NULL DEFAULT 'pending', -- 'granted', 'denied', 'pending', 'withdrawn'
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  source TEXT, -- 'web_form', 'api', 'manual', 'import'
  ip_address TEXT,
  user_agent TEXT,
  legal_basis TEXT, -- 'consent', 'legitimate_interest', 'contract'
  version TEXT DEFAULT '1.0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Customer Journeys
CREATE TABLE IF NOT EXISTS public.customer_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'event', 'segment', 'schedule', 'manual'
  trigger_config JSONB DEFAULT '{}', -- trigger conditions
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'archived'
  entry_segment_id UUID, -- segment that triggers entry
  exit_conditions JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]', -- conversion goals
  bpmn_process_id UUID REFERENCES public.bpmn_process_definitions(id),
  stats JSONB DEFAULT '{"enrolled": 0, "completed": 0, "converted": 0}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Journey Steps
CREATE TABLE IF NOT EXISTS public.journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.customer_journeys(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL, -- 'action', 'condition', 'delay', 'split', 'end'
  action_type TEXT, -- 'send_email', 'send_sms', 'send_whatsapp', 'call', 'task', 'webhook', 'update_field'
  config JSONB DEFAULT '{}', -- step-specific configuration
  next_step_id UUID REFERENCES public.journey_steps(id),
  yes_step_id UUID REFERENCES public.journey_steps(id), -- for conditions
  no_step_id UUID REFERENCES public.journey_steps(id), -- for conditions
  delay_duration INTERVAL,
  delay_until_time TIME,
  template_id UUID, -- reference to message template
  stats JSONB DEFAULT '{"processed": 0, "success": 0, "failed": 0}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Journey Enrollments
CREATE TABLE IF NOT EXISTS public.journey_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.customer_journeys(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.company_contacts(id),
  current_step_id UUID REFERENCES public.journey_steps(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'exited', 'paused', 'failed'
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  exit_reason TEXT,
  step_history JSONB DEFAULT '[]',
  variables JSONB DEFAULT '{}', -- personalization variables
  next_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(journey_id, company_id, contact_id)
);

-- 5. Omnichannel Messages
CREATE TABLE IF NOT EXISTS public.omnichannel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.company_contacts(id),
  channel TEXT NOT NULL, -- 'email', 'sms', 'whatsapp', 'voice', 'push', 'in_app'
  direction TEXT NOT NULL DEFAULT 'outbound', -- 'inbound', 'outbound'
  message_type TEXT, -- 'marketing', 'transactional', 'notification', 'conversation'
  subject TEXT,
  content TEXT,
  template_id UUID,
  template_variables JSONB DEFAULT '{}',
  journey_id UUID REFERENCES public.customer_journeys(id),
  journey_step_id UUID REFERENCES public.journey_steps(id),
  external_id TEXT, -- ID from provider (Twilio, SendGrid, etc.)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  engagement_data JSONB DEFAULT '{}',
  cost NUMERIC(10,4),
  sent_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Omnichannel Templates
CREATE TABLE IF NOT EXISTS public.omnichannel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL, -- 'email', 'sms', 'whatsapp', 'voice'
  category TEXT, -- 'marketing', 'transactional', 'notification'
  subject TEXT, -- for email
  content TEXT NOT NULL,
  html_content TEXT, -- for email HTML
  variables TEXT[] DEFAULT '{}', -- available merge tags
  preview_text TEXT,
  attachments JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  version INTEGER DEFAULT 1,
  stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Segment Rules (advanced segmentation)
CREATE TABLE IF NOT EXISTS public.segment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'dynamic', -- 'static', 'dynamic', 'hybrid'
  conditions JSONB NOT NULL DEFAULT '[]', -- rule conditions
  condition_logic TEXT DEFAULT 'AND', -- 'AND', 'OR'
  refresh_frequency INTERVAL DEFAULT '1 hour',
  last_refreshed_at TIMESTAMPTZ,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_enroll_journeys UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Segment Members
CREATE TABLE IF NOT EXISTS public.segment_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.segment_rules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.company_contacts(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  removed_at TIMESTAMPTZ,
  match_score NUMERIC(5,2), -- how well they match criteria
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  UNIQUE(segment_id, company_id, contact_id)
);

-- 9. Channel Connectors Configuration
CREATE TABLE IF NOT EXISTS public.channel_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type TEXT NOT NULL UNIQUE, -- 'email', 'sms', 'whatsapp', 'voip', 'push'
  provider TEXT NOT NULL, -- 'sendgrid', 'twilio', 'whatsapp_business', 'vonage'
  is_active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}', -- encrypted config
  rate_limit INTEGER DEFAULT 100, -- per minute
  daily_limit INTEGER DEFAULT 10000,
  credentials_valid BOOLEAN DEFAULT false,
  last_health_check TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
  stats JSONB DEFAULT '{"total_sent": 0, "total_delivered": 0, "total_failed": 0}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omnichannel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omnichannel_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_connectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Admins can manage customer_consents" ON public.customer_consents
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage customer_journeys" ON public.customer_journeys
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage journey_steps" ON public.journey_steps
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage journey_enrollments" ON public.journey_enrollments
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage omnichannel_messages" ON public.omnichannel_messages
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage omnichannel_templates" ON public.omnichannel_templates
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage segment_rules" ON public.segment_rules
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage segment_members" ON public.segment_members
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage channel_connectors" ON public.channel_connectors
  FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

-- Authenticated users can view journeys and templates
CREATE POLICY "Authenticated users can view journeys" ON public.customer_journeys
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view templates" ON public.omnichannel_templates
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Authenticated users can view segments" ON public.segment_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_customer_consents_company ON public.customer_consents(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_consents_type_status ON public.customer_consents(consent_type, status);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_status ON public.customer_journeys(status);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey ON public.journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_journey ON public.journey_enrollments(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_company ON public.journey_enrollments(company_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_status ON public.journey_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_company ON public.omnichannel_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_channel ON public.omnichannel_messages(channel);
CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_status ON public.omnichannel_messages(status);
CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_journey ON public.omnichannel_messages(journey_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_segment ON public.segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_company ON public.segment_members(company_id);

-- Updated_at triggers
CREATE TRIGGER update_customer_consents_updated_at BEFORE UPDATE ON public.customer_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_customer_journeys_updated_at BEFORE UPDATE ON public.customer_journeys
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_journey_steps_updated_at BEFORE UPDATE ON public.journey_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_journey_enrollments_updated_at BEFORE UPDATE ON public.journey_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_omnichannel_messages_updated_at BEFORE UPDATE ON public.omnichannel_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_omnichannel_templates_updated_at BEFORE UPDATE ON public.omnichannel_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_segment_rules_updated_at BEFORE UPDATE ON public.segment_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_channel_connectors_updated_at BEFORE UPDATE ON public.channel_connectors
  FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.omnichannel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journey_enrollments;