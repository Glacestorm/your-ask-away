-- Tabla para conversaciones del asistente interno
CREATE TABLE public.internal_assistant_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nueva conversación',
    context_type TEXT NOT NULL DEFAULT 'general', -- 'clients', 'regulations', 'products', 'procedures'
    is_sensitive BOOLEAN DEFAULT false,
    requires_human_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para mensajes del asistente
CREATE TABLE public.internal_assistant_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.internal_assistant_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB,
    is_sensitive BOOLEAN DEFAULT false,
    flagged_for_review BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX idx_assistant_conv_user ON public.internal_assistant_conversations(user_id);
CREATE INDEX idx_assistant_conv_created ON public.internal_assistant_conversations(created_at DESC);
CREATE INDEX idx_assistant_msg_conv ON public.internal_assistant_messages(conversation_id);
CREATE INDEX idx_assistant_msg_created ON public.internal_assistant_messages(created_at DESC);
CREATE INDEX idx_assistant_msg_flagged ON public.internal_assistant_messages(flagged_for_review) WHERE flagged_for_review = true;

-- Enable RLS
ALTER TABLE public.internal_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_assistant_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuarios solo ven sus propias conversaciones
CREATE POLICY "Users can view own conversations"
ON public.internal_assistant_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
ON public.internal_assistant_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.internal_assistant_conversations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.internal_assistant_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Admins pueden ver todas las conversaciones para revisión
CREATE POLICY "Admins can view all conversations for review"
ON public.internal_assistant_conversations
FOR SELECT
USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para mensajes
CREATE POLICY "Users can view messages of own conversations"
ON public.internal_assistant_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.internal_assistant_conversations c
        WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create messages in own conversations"
ON public.internal_assistant_messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.internal_assistant_conversations c
        WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all messages for review"
ON public.internal_assistant_messages
FOR SELECT
USING (public.is_admin_or_superadmin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_assistant_conversations_updated_at
    BEFORE UPDATE ON public.internal_assistant_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Función para registrar uso del asistente en audit logs
CREATE OR REPLACE FUNCTION public.log_assistant_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM log_audit_event(
        'assistant_message',
        'internal_assistant_messages',
        NEW.id,
        NULL,
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'role', NEW.role,
            'is_sensitive', NEW.is_sensitive
        ),
        NULL,
        NULL,
        'ai_usage',
        'info'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER log_assistant_message_usage
    AFTER INSERT ON public.internal_assistant_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.log_assistant_usage();