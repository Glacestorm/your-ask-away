-- FASE 3: CRM Colaborativo Omnicanal - Mejoras

-- 1. Tabla sms_templates para plantillas de SMS personalizables
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Mejorar tabla sms_notifications con template_id
ALTER TABLE public.sms_notifications 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES sms_templates(id),
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 3. Tabla sms_delivery_logs para tracking detallado
CREATE TABLE IF NOT EXISTS public.sms_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sms_id UUID REFERENCES sms_notifications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_code TEXT,
  provider_response JSONB,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Mejorar chat_messages con más campos
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT ARRAY[]::UUID[],
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- 5. Tabla chat_attachments para archivos en chat
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabla conversation_summaries para historial resumido
CREATE TABLE IF NOT EXISTS public.conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  summary_text TEXT,
  key_topics TEXT[],
  sentiment TEXT,
  message_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies para sms_templates
CREATE POLICY "Admins can manage sms templates"
  ON public.sms_templates FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "All users can view active templates"
  ON public.sms_templates FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- RLS Policies para sms_delivery_logs
CREATE POLICY "Admins can manage sms delivery logs"
  ON public.sms_delivery_logs FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view their sms delivery logs"
  ON public.sms_delivery_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sms_notifications sn 
    WHERE sn.id = sms_delivery_logs.sms_id 
    AND sn.user_id = auth.uid()
  ));

-- RLS Policies para chat_attachments
CREATE POLICY "Users can view chat attachments in their rooms"
  ON public.chat_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN chat_participants cp ON cp.room_id = cm.room_id
    WHERE cm.id = chat_attachments.message_id
    AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert attachments to their rooms"
  ON public.chat_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_participants cp ON cp.room_id = cm.room_id
      WHERE cm.id = chat_attachments.message_id
      AND cp.user_id = auth.uid()
    )
  );

-- RLS Policies para conversation_summaries
CREATE POLICY "Users can view conversation summaries in their rooms"
  ON public.conversation_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = conversation_summaries.room_id
    AND cp.user_id = auth.uid()
  ) OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can manage conversation summaries"
  ON public.conversation_summaries FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

-- Trigger para updated_at en sms_templates
CREATE OR REPLACE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime para chat improvements
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_delivery_logs;